// pdf-templateA5.tsx

// --- Imports and Type Definitions ---

import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
  Client,
} from "@/lib/types";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  pdf,
} from "@react-pdf/renderer";
import {
  deriveTotals,
  formatCurrency,
  getBillingAddress,
  getShippingAddress,
  getItemsBody,
  calculateGST,
  getUnifiedLines,
  prepareTemplate8Data,
  getStateCode,
  numberToWords,
} from "./pdf-utils";
import { capitalizeWords, parseNotesHtml } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "./pdf-utils";

// **START: ADDED IMPORT FOR HTML RENDERING UTILITIES**
import { parseHtmlToElements, renderParsedElements } from "./HtmlNoteRenderer";
// **END: ADDED IMPORT FOR HTML RENDERING UTILITIES**

import { templateA5Styles } from "./pdf-template-styles";

/**
 * Derives the client's name from the client object or a string.
 * @param client - The client object or a string name.
 * @returns The client's name.
 */
const getClientName = (client: any) => {
  console.log("getClientName called with:", client);
  if (!client) return "Client Name";
  if (typeof client === "string") return client;
  return client.companyName || client.contactName || "Client Name";
};

/**
 * Props interface for the TemplateA5PDF component.
 */
interface TemplateA5PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
  client?: Client | null;
}

// --- Main PDF Component ---

/**
 * React functional component to render the A5 landscape PDF invoice/proforma.
 * @param props - Component props containing transaction and related entities.
 * @returns A Document component from @react-pdf/renderer.
 */
const TemplateA5PDF: React.FC<TemplateA5PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
  client,
}) => {
  // --- Data Preparation and State Derivation ---
  const {
    totals,
    totalTaxable,
    totalAmount,
    items,
    totalItems,
    totalQty,
    itemsBody,
    itemsWithGST,
    totalCGST,
    totalSGST,
    totalIGST,
    isGSTApplicable,
    isInterstate,
    showIGST,
    showCGSTSGST,
    showNoTax,
  } = prepareTemplate8Data(transaction, company, party, shippingAddress);

  const logoSrc = company?.logo
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`
    : null;

  // Bank Data Check - Added from Template 1
  const bankData: Bank = bank || ({} as Bank);

  // Check if any bank detail is available (used for conditional rendering)
  const isBankDetailAvailable =
    bankData?.bankName ||
    bankData?.ifscCode ||
    bankData?.qrCode ||
    bankData?.branchAddress ||
    (bankData as any)?.accountNo ||
    (bankData as any)?.upiDetails?.upiId;

  // --- Column Widths Configuration ---
  // For IGST (Interstate)
  const colWidthsIGST = ["4%", "25%", "10%", "8%", "10%", "15%", "20%", "12%"];
  const totalColumnIndexIGST = 7;

  // Pagination Logic - Auto adjust to fit all items on one page
  const itemsPerPage = itemsWithGST.length;
  const pages = [];
  for (let i = 0; i < itemsWithGST.length; i += itemsPerPage) {
    pages.push(itemsWithGST.slice(i, i + itemsPerPage));
  }

  // For CGST/SGST (Intrastate)
  const colWidthsCGSTSGST = [
    "4%",
    "20%",
    "10%",
    "8%",
    "10%",
    "12%",
    "12%",
    "15%",
    "20%",
  ];
  const totalColumnIndexCGSTSGST = 8;

  // For No Tax
  const colWidthsNoTax = ["10%", "25%", "10%", "10%", "10%", "15%", "20%"];
  const totalColumnIndexNoTax = 6;

  // Use based on condition
  const colWidths = showIGST
    ? colWidthsIGST
    : showCGSTSGST
    ? colWidthsCGSTSGST
    : colWidthsNoTax;
  const totalColumnIndex = showIGST
    ? totalColumnIndexIGST
    : showCGSTSGST
    ? totalColumnIndexCGSTSGST
    : totalColumnIndexNoTax;

  // Calculate table width for border positioning (A5: 420pt width, padding 20pt each side, section border 1.5pt each side)
  const tableWidth = showCGSTSGST ? 495 : showIGST ? 530 : 560;

  // Calculate vertical border positions
  const borderPositions: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < colWidths.length - 1; i++) {
    cumulative += parseFloat(colWidths[i]);
    borderPositions.push((cumulative / 100) * tableWidth);
  }

  // **START: Terms and Conditions HTML rendering setup (Copied from TemplateA5_4PDF logic)**
  const { title } = parseNotesHtml(transaction?.notes || "");
  const termsTitle = title || "Terms and Conditions";
  // **END: Terms and Conditions HTML rendering setup**

  // --- Document Rendering ---
  return (
    <Document>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <Page
            key={pageIndex}
            size="A5"
            orientation="landscape"
            style={templateA5Styles.page}
          >
            {/* Header Section */}
            <View style={templateA5Styles.header} fixed>
              <View style={templateA5Styles.headerLeft}>
                {logoSrc && (
                  <Image src={logoSrc} style={templateA5Styles.logo} />
                )}
              </View>
              <View style={templateA5Styles.headerRight}>
                <Text style={templateA5Styles.companyName}>
                  {capitalizeWords(
                    company?.businessName ||
                      company?.companyName ||
                      "Company Name"
                  )}
                </Text>
                <Text style={templateA5Styles.address}>
                  {[
                    company?.address,
                    company?.City,
                    company?.addressState,
                    company?.Country,
                    company?.Pincode,
                  ]
                    .filter(Boolean)
                    .join(", ") || "Address Line 1"}
                </Text>
                <View style={templateA5Styles.contactInfo}>
                  <Text style={templateA5Styles.contactLabel}>Name : </Text>
                  <Text style={templateA5Styles.contactValue}>
                    {capitalizeWords(getClientName(client))}
                  </Text>
                  <Text style={templateA5Styles.contactLabel}> | Phone : </Text>
                  <Text style={templateA5Styles.contactValue}>
                    {company?.mobileNumber
                      ? formatPhoneNumber(String(company.mobileNumber))
                      : company?.Telephone
                      ? formatPhoneNumber(String(company.Telephone))
                      : "-"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Body - Items Table and Details */}
            <View style={templateA5Styles.section}>
              <View fixed>
                {/* Invoice Title and GSTIN */}
                <View style={templateA5Styles.tableHeader}>
                  {company?.gstin && (
                    <View style={templateA5Styles.gstRow}>
                      <Text style={templateA5Styles.gstLabel}>GSTIN : </Text>
                      <Text style={templateA5Styles.gstValue}>
                        {company.gstin}
                      </Text>
                    </View>
                  )}

                  <View style={templateA5Styles.invoiceTitleRow}>
                    <Text style={templateA5Styles.invoiceTitle}>
                      {" "}
                      {transaction.type === "proforma"
                        ? "PROFORMA INVOICE"
                        : isGSTApplicable
                        ? "TAX INVOICE"
                        : "INVOICE"}
                    </Text>
                  </View>

                  <View style={templateA5Styles.recipientRow}>
                    <Text style={templateA5Styles.recipientText}>
                      ORIGINAL FOR RECIPIENT
                    </Text>
                  </View>
                </View>

                {/* Three Column Details Section */}
                <View style={templateA5Styles.threeColSection}>
                  {/* Column 1 - Details of Buyer */}
                  <View
                    style={[templateA5Styles.column, { borderLeft: "none" }]}
                  >
                    <View style={templateA5Styles.columnHeader}>
                      <Text style={templateA5Styles.threecoltableHeader}>
                        Details of Buyer | Billed to:
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>Name</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {capitalizeWords(party?.name || "N/A")}
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>Address</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {capitalizeWords(getBillingAddress(party)) || "-"}
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>Phone</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {party?.contactNumber
                          ? formatPhoneNumber(party.contactNumber)
                          : "-"}
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>GSTIN</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {party?.gstin || "-"}
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>PAN</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {party?.pan || "-"}
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>
                        Place of Supply
                      </Text>
                      <Text style={templateA5Styles.tableValue}>
                        {shippingAddress?.state
                          ? `${capitalizeWords(shippingAddress.state)} (${
                              getStateCode(shippingAddress.state) || "-"
                            })`
                          : party?.state
                          ? `${capitalizeWords(party.state)} (${
                              getStateCode(party.state) || "-"
                            })`
                          : "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Column 2 - Details of Consigned */}
                  <View style={templateA5Styles.column}>
                    <View style={templateA5Styles.columnHeader}>
                      <Text style={templateA5Styles.threecoltableHeader}>
                        Details of Consigned | Shipped to:
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>Name</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {capitalizeWords(
                          shippingAddress?.label || party?.name || "N/A"
                        )}
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>Address</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {capitalizeWords(
                          getShippingAddress(
                            shippingAddress,
                            getBillingAddress(party)
                          )
                        )}
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>Country</Text>
                      <Text style={templateA5Styles.tableValue}>India</Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>Phone</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {shippingAddress?.contactNumber
                          ? formatPhoneNumber(
                              String(shippingAddress.contactNumber)
                            )
                          : party?.contactNumber
                          ? formatPhoneNumber(String(party.contactNumber))
                          : "-"}
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>GSTIN</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {party?.gstin || "-"}
                      </Text>
                    </View>
                    <View style={templateA5Styles.dataRow}>
                      <Text style={templateA5Styles.tableLabel}>State</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {shippingAddress?.state
                          ? `${capitalizeWords(shippingAddress.state)} (${
                              getStateCode(shippingAddress.state) || "-"
                            })`
                          : party?.state
                          ? `${capitalizeWords(party.state)} (${
                              getStateCode(party.state) || "-"
                            })`
                          : "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Column 3 - Invoice Details */}
                  <View
                    style={[templateA5Styles.column, { borderRight: "none" }]}
                  >
                    <View
                      style={[
                        templateA5Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={templateA5Styles.tableLabel}>
                        Invoice No.
                      </Text>
                      <Text style={templateA5Styles.tableValue}>
                        {transaction.invoiceNumber || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={[
                        templateA5Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={templateA5Styles.tableLabel}>
                        Invoice Date
                      </Text>
                      <Text style={templateA5Styles.tableValue}>
                        {new Date(transaction.date).toLocaleDateString("en-IN")}
                      </Text>
                    </View>
                    <View
                      style={[
                        templateA5Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={templateA5Styles.tableLabel}>Due Date</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {new Date(transaction.dueDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </Text>
                    </View>
                    <View
                      style={[
                        templateA5Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={templateA5Styles.tableLabel}>P.O. No.</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {transaction.voucher || "-"}
                      </Text>
                    </View>
                    <View
                      style={[
                        templateA5Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={templateA5Styles.tableLabel}>E-Way No.</Text>
                      <Text style={templateA5Styles.tableValue}>
                        {transaction.referenceNumber || "-"}
                      </Text>
                    </View>
                    <View
                      style={[
                        templateA5Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={templateA5Styles.tableLabel}></Text>
                      <Text style={templateA5Styles.tableValue}></Text>
                    </View>
                    <View
                      style={[
                        templateA5Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={templateA5Styles.tableLabel}></Text>
                      <Text style={templateA5Styles.tableValue}></Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Items Table - Main Content */}
              <View style={templateA5Styles.tableContainer}>
                <View style={templateA5Styles.itemsTable}>
                  {/* Table Header */}
                  <View style={templateA5Styles.itemsTableHeader} fixed>
                    <Text
                      style={[
                        templateA5Styles.srNoHeader,
                        { width: colWidths[0] },
                      ]}
                    >
                      Sr. No.
                    </Text>
                    <Text
                      style={[
                        templateA5Styles.productHeader,
                        { width: colWidths[1] },
                      ]}
                    >
                      Name of Product/Service
                    </Text>
                    <Text
                      style={[
                        templateA5Styles.hsnHeader,
                        { width: colWidths[2] },
                      ]}
                    >
                      HSN/SAC
                    </Text>
                    <Text
                      style={[
                        templateA5Styles.qtyHeader,
                        { width: colWidths[3] },
                      ]}
                    >
                      Qty
                    </Text>
                    <Text
                      style={[
                        templateA5Styles.rateHeader,
                        { width: colWidths[4] },
                      ]}
                    >
                      Rate (Rs.)
                    </Text>
                    <Text
                      style={[
                        templateA5Styles.taxableHeader,
                        { width: colWidths[5] },
                      ]}
                    >
                      Taxable Value (Rs.)
                    </Text>

                    {/* Dynamic GST columns */}
                    {showIGST ? (
                      // Interstate - Show IGST columns
                      <View
                        style={[
                          templateA5Styles.igstHeader,
                          { width: colWidths[6] },
                        ]}
                      >
                        <Text style={templateA5Styles.igstMainHeader}>
                          IGST
                        </Text>
                        <View style={templateA5Styles.igstSubHeader}>
                          <Text
                            style={[
                              templateA5Styles.igstSubPercentage,
                              { borderRight: "1px solid #0371C1" },
                            ]}
                          >
                            %
                          </Text>
                          <Text style={templateA5Styles.igstSubText}>
                            Amount (Rs.)
                          </Text>
                        </View>
                      </View>
                    ) : showCGSTSGST ? (
                      // Intrastate - Show CGST/SGST columns
                      <>
                        <View
                          style={[
                            templateA5Styles.igstHeader,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={templateA5Styles.igstMainHeader}>
                            CGST
                          </Text>
                          <View style={templateA5Styles.igstSubHeader}>
                            <Text
                              style={[
                                templateA5Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={templateA5Styles.igstSubText}>
                              Amount (Rs.)
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            templateA5Styles.igstHeader,
                            { width: colWidths[7] },
                          ]}
                        >
                          <Text style={templateA5Styles.igstMainHeader}>
                            SGST
                          </Text>
                          <View style={templateA5Styles.igstSubHeader}>
                            <Text
                              style={[
                                templateA5Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={templateA5Styles.igstSubText}>
                              Amount (Rs.)
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : null}

                    {/* Total Column */}
                    <Text
                      style={[
                        templateA5Styles.totalHeader,
                        { width: colWidths[totalColumnIndex] },
                      ]}
                    >
                      Total (Rs.)
                    </Text>
                  </View>
                  {/* Vertical borders - for visual separation between columns */}
                  {borderPositions.map((pos, index) => (
                    <View
                      key={index}
                      style={[templateA5Styles.verticalBorder, { left: pos }]}
                    />
                  ))}

                  {/* Table Rows (Items) */}
                  {pageItems.map((item, index) => (
                    <View
                      key={index}
                      style={templateA5Styles.itemsTableRow}
                      wrap={false}
                    >
                      <Text
                        style={[
                          templateA5Styles.srNoCell,
                          { width: colWidths[0] },
                        ]}
                      >
                        {pageIndex * itemsPerPage + index + 1}
                      </Text>
                      <Text
                        style={[
                          templateA5Styles.productCell,
                          { width: colWidths[1] },
                        ]}
                      >
                        {capitalizeWords(item.name)}
                      </Text>
                      <Text
                        style={[
                          templateA5Styles.hsnCell,
                          { width: colWidths[2] },
                        ]}
                      >
                        {item.code || "-"}
                      </Text>
                      <Text
                        style={[
                          templateA5Styles.qtyCell,
                          { width: colWidths[3] },
                        ]}
                      >
                        {formatQuantity(item.quantity || 0, item.unit)}
                      </Text>
                      <Text
                        style={[
                          templateA5Styles.rateCell,
                          { width: colWidths[4] },
                        ]}
                      >
                        {formatCurrency(item.pricePerUnit || 0)}
                      </Text>
                      <Text
                        style={[
                          templateA5Styles.taxableCell,
                          { width: colWidths[5] },
                        ]}
                      >
                        {formatCurrency(item.taxableValue)}
                      </Text>
                      {showIGST ? (
                        <View
                          style={[
                            templateA5Styles.igstCell,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={templateA5Styles.igstPercent}>
                            {item.gstRate}
                          </Text>
                          <Text style={templateA5Styles.igstAmount}>
                            {formatCurrency(item.igst)}
                          </Text>
                        </View>
                      ) : showCGSTSGST ? (
                        <>
                          <View
                            style={[
                              templateA5Styles.igstCell,
                              { width: colWidths[6] },
                            ]}
                          >
                            <Text style={templateA5Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={templateA5Styles.igstAmount}>
                              {formatCurrency(item.cgst)}
                            </Text>
                          </View>
                          <View
                            style={[
                              templateA5Styles.igstCell,
                              { width: colWidths[7] },
                            ]}
                          >
                            <Text style={templateA5Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={templateA5Styles.igstAmount}>
                              {formatCurrency(item.sgst)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                      <Text
                        style={[
                          templateA5Styles.totalCell,
                          { width: colWidths[totalColumnIndex] },
                        ]}
                      >
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  ))}

                  {/* Table Total Row (Only on Last Page) */}
                  {isLastPage && (
                    <View style={templateA5Styles.itemsTableTotalRow}>
                      <Text
                        style={[
                          templateA5Styles.totalLabel,
                          { width: colWidths[0] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          templateA5Styles.totalEmpty,
                          { width: colWidths[1] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          templateA5Styles.totalEmpty,
                          {
                            width: colWidths[2],
                          },
                        ]}
                      >
                        Total
                      </Text>
                      <Text
                        style={[
                          templateA5Styles.totalQty,
                          {
                            width: colWidths[3],
                          },
                        ]}
                      >
                        {totalQty}
                      </Text>
                      <Text
                        style={[
                          templateA5Styles.totalEmpty,
                          { width: colWidths[4] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          templateA5Styles.totalTaxable,
                          {
                            width: colWidths[5],
                          },
                        ]}
                      >
                        {formatCurrency(totalTaxable)}
                      </Text>
                      {showIGST ? (
                        <View
                          style={[
                            templateA5Styles.igstTotal,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text
                            style={[
                              templateA5Styles.totalIgstAmount,
                              { paddingRight: 20 },
                            ]}
                          >
                            {formatCurrency(totalIGST)}
                          </Text>
                        </View>
                      ) : showCGSTSGST ? (
                        <>
                          <View
                            style={[
                              templateA5Styles.igstTotal,
                              { width: colWidths[6], paddingRight: 9 },
                            ]}
                          >
                            <Text style={[templateA5Styles.totalIgstAmount]}>
                              {formatCurrency(totalCGST)}
                            </Text>
                          </View>
                          <View
                            style={[
                              templateA5Styles.igstTotal,
                              { width: colWidths[7], paddingRight: 13 },
                            ]}
                          >
                            <Text style={[templateA5Styles.totalIgstAmount]}>
                              {formatCurrency(totalSGST)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                      <Text
                        style={[
                          templateA5Styles.grandTotal,
                          { width: colWidths[totalColumnIndex] },
                        ]}
                      >
                        {formatCurrency(totalAmount)}
                      </Text>
                    </View>
                  )}

                  {/* Vertical borders - for visual separation between columns */}
                  {borderPositions.map((pos, index) => (
                    <View
                      key={index}
                      style={[templateA5Styles.verticalBorder, { left: pos }]}
                    />
                  ))}
                </View>
              </View>

              {/* Bottom Section (Total in Words, Bank Details, Terms, and Final Totals) - Only on Last Page */}
              {isLastPage && (
                <>
                  <View style={templateA5Styles.bottomSection}>
                    {/* Left Column: Total in words + Bank Details + Terms */}
                    <View style={templateA5Styles.leftSection}>
                      <Text style={templateA5Styles.totalInWords}>
                        Total in words : {numberToWords(totalAmount)}
                      </Text>

                      {/* Bank Details Section - Only show if not Cash payment and not proforma invoice */}
                      {transaction.type !== "proforma" &&
                        isBankDetailAvailable && (
                          <View
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              padding: 4,
                            }}
                            wrap={false}
                          >
                            {/* Bank Details Text */}
                            <View
                              style={{
                                flex: 1,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 9,
                                  fontWeight: "bold",
                                  marginBottom: 2,
                                }}
                              >
                                Bank Details:
                              </Text>

                              <View>
                                {/* Bank Name */}
                                {bankData?.bankName && (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      marginBottom: 1,
                                      fontSize: 8,
                                    }}
                                  >
                                    <Text
                                      style={{ width: 70, fontWeight: "bold" }}
                                    >
                                      Name:
                                    </Text>
                                    <Text>
                                      {capitalizeWords(bankData.bankName)}
                                    </Text>
                                  </View>
                                )}

                                {/* Account Number */}
                                {(bankData as any)?.accountNo && (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      marginBottom: 1,
                                      fontSize: 8,
                                    }}
                                  >
                                    <Text
                                      style={{ width: 70, fontWeight: "bold" }}
                                    >
                                      Acc. No:
                                    </Text>
                                    <Text>{(bankData as any).accountNo}</Text>
                                  </View>
                                )}
                                {/* IFSC Code */}
                                {bankData?.ifscCode && (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      marginBottom: 1,
                                      fontSize: 8,
                                    }}
                                  >
                                    <Text
                                      style={{ width: 70, fontWeight: "bold" }}
                                    >
                                      IFSC:
                                    </Text>
                                    <Text>{bankData.ifscCode}</Text>
                                  </View>
                                )}
                                {/* Branch Address */}
                                {bankData?.branchAddress && (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      marginBottom: 1,
                                      fontSize: 8,
                                    }}
                                  >
                                    <Text
                                      style={{ width: 70, fontWeight: "bold" }}
                                    >
                                      Branch:
                                    </Text>
                                    <Text style={{ flex: 1 }}>
                                      {bankData.branchAddress}
                                    </Text>
                                  </View>
                                )}

                                {/* UPI ID */}
                                {(bankData as any)?.upiDetails?.upiId && (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      marginBottom: 1,
                                      fontSize: 8,
                                    }}
                                  >
                                    <Text
                                      style={{ width: 70, fontWeight: "bold" }}
                                    >
                                      UPI ID:
                                    </Text>
                                    <Text>
                                      {(bankData as any).upiDetails.upiId}
                                    </Text>
                                  </View>
                                )}
                                {/* UPI Name */}
                                {(bankData as any)?.upiDetails?.upiName && (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      marginBottom: 1,
                                      fontSize: 8,
                                    }}
                                  >
                                    <Text
                                      style={{ width: 70, fontWeight: "bold" }}
                                    >
                                      UPI Name:
                                    </Text>
                                    <Text>
                                      {(bankData as any).upiDetails.upiName}
                                    </Text>
                                  </View>
                                )}

                                {/* UPI Mobile */}
                                {(bankData as any)?.upiDetails?.upiMobile && (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      marginBottom: 1,
                                      fontSize: 8,
                                    }}
                                  >
                                    <Text
                                      style={{ width: 70, fontWeight: "bold" }}
                                    >
                                      UPI Mobile:
                                    </Text>
                                    <Text>
                                      {(bankData as any).upiDetails.upiMobile}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>

                            {/* QR Code Section */}
                            {(bankData as any)?.qrCode ? (
                              <View
                                style={{
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: 5,
                                  marginLeft: 10,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 9,
                                    fontWeight: "bold",
                                    marginBottom: 5,
                                  }}
                                >
                                  QR Code
                                </Text>
                                <View
                                  style={{
                                    backgroundColor: "#fff",
                                  }}
                                >
                                  <Image
                                    src={`${process.env.NEXT_PUBLIC_BASE_URL}/${
                                      (bankData as any).qrCode
                                    }`}
                                    style={{
                                      width: 70,
                                      height: 70,
                                      objectFit: "contain",
                                    }}
                                  />
                                </View>
                              </View>
                            ) : null}
                          </View>
                        )}
                    </View>

                    {/* Right Column: Totals */}
                    <View style={templateA5Styles.rightSection}>
                      <View style={templateA5Styles.totalRow}>
                        <Text style={templateA5Styles.label}>
                          Taxable Amount
                        </Text>
                        <Text style={templateA5Styles.value}>
                          {`Rs.${formatCurrency(totalTaxable)}`}
                        </Text>
                      </View>

                      {isGSTApplicable && (
                        <View style={templateA5Styles.totalRow}>
                          <Text style={templateA5Styles.label}>Total Tax</Text>
                          <Text style={templateA5Styles.value}>
                            {`Rs.${formatCurrency(
                              showIGST ? totalIGST : totalCGST + totalSGST
                            )}`}
                          </Text>
                        </View>
                      )}

                      <View
                        style={[
                          templateA5Styles.totalRow,
                          isGSTApplicable ? templateA5Styles.highlightRow : {},
                        ]}
                      >
                        <Text
                          style={
                            isGSTApplicable
                              ? templateA5Styles.labelBold
                              : templateA5Styles.label
                          }
                        >
                          {isGSTApplicable
                            ? "Total Amount After Tax"
                            : "Total Amount"}
                        </Text>
                        <Text
                          style={
                            isGSTApplicable
                              ? templateA5Styles.valueBold
                              : templateA5Styles.value
                          }
                        >
                          {`Rs.${formatCurrency(totalAmount)}`}
                        </Text>
                      </View>

                      <View style={templateA5Styles.totalRow}>
                        <Text style={templateA5Styles.label}>
                          For-
                          {company?.businessName ||
                            company?.companyName ||
                            "Company Name"}
                        </Text>
                        <Text style={templateA5Styles.value}>(E & O.E.)</Text>
                      </View>
                    </View>
                  </View>

                  {/* **START: Terms and Conditions HTML Rendering Logic** */}
                  {transaction?.notes ? (
                    <View
                      style={[
                        templateA5Styles.termsBox,
                        {
                          borderLeft: "1px solid #0371C1",
                          borderRight: "1px solid #0371C1",
                        },
                      ]}
                      wrap={false}
                    >
                      <Text
                        style={[
                          templateA5Styles.termLine,
                          { fontWeight: "bold" },
                        ]}
                      ></Text>

                      <>
                        {/* Using renderParsedElements for HTML Notes */}
                        {renderParsedElements(
                          parseHtmlToElements(transaction.notes, 7),
                          7
                        )}
                      </>
                    </View>
                  ) : null}
                </>
              )}

              <View
                fixed
                style={{
                  height: 1,
                  backgroundColor: "#0371C1",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </View>

            {/* Page Number (Fixed at the bottom) */}
            <Text
              fixed
              style={templateA5Styles.pageNumber}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages} page`
              }
            />
          </Page>
        );
      })}
    </Document>
  );
};

// --- PDF Generation Function ---

/**
 * Generates the PDF document for Template A5 as a Blob.
 * @param transaction - The transaction data.
 * @param company - The company data.
 * @param party - The party (buyer) data.
 * @param serviceNameById - Optional map for service names.
 * @param shippingAddress - Optional shipping address data.
 * @param bank - Optional bank details.
 * @param client - Optional client details.
 * @returns A Promise resolving to a Blob representing the PDF file.
 */
export const generatePdfForTemplateA5 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string> | null,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null,
  client?: Client | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <TemplateA5PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
      client={client}
    />
  );

  return await pdfDoc.toBlob();
};

export default TemplateA5PDF;
