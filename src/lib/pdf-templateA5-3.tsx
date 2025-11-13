// pdf-templateA5-3.tsx
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
  getHsnSummary,
} from "./pdf-utils";
import { capitalizeWords, parseNotesHtml } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";

import { formatPhoneNumber } from "./pdf-utils";
// 🚀 ADDED/UPDATED IMPORTS FOR HTML RENDERING LOGIC 🚀
import { parseHtmlToElements, renderParsedElements } from "./HtmlNoteRenderer"; // Assuming this utility exists

import { templateA5_3Styles } from "./pdf-template-styles";

const getClientName = (client: any) => {
  if (!client) return "Client Name";
  if (typeof client === "string") return client;
  return client.companyName || client.contactName || "Client Name";
};
console.log("client name", getClientName);

const logo = "/assets/invoice-logos/R.png";

interface TemplateA5PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
  client?: Client | null;
}

const TemplateA5_3PDF: React.FC<TemplateA5PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
  client,
}) => {
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

  // FIXED: Column widths now add up to exactly 100%
  // For IGST (Interstate)
  const colWidthsIGST = ["5%", "22%", "11%", "8%", "11%", "15%", "16%", "12%"];
  const totalColumnIndexIGST = 7;

  const itemsPerPage = itemsWithGST.length;
  const pages = [];
  for (let i = 0; i < itemsWithGST.length; i += itemsPerPage) {
    pages.push(itemsWithGST.slice(i, i + itemsPerPage));
  }

  // For CGST/SGST (Intrastate)
  const colWidthsCGSTSGST = [
    "5%",
    "20%",
    "11%",
    "8%",
    "10%",
    "11%",
    "11%",
    "12%",
    "12%",
  ];
  const totalColumnIndexCGSTSGST = 8;

  // For No Tax
  const colWidthsNoTax = ["6%", "32%", "12%", "10%", "11%", "14%", "15%"];
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

  // FIXED: Calculate table width in points (A5: 420pt width, padding 20pt each side, section border 1.5pt each side)
  const tableWidth = 375.5; // Consistent width for all table types

  // Calculate vertical border positions
  const borderPositions: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < colWidths.length - 1; i++) {
    cumulative += parseFloat(colWidths[i]);
    borderPositions.push((cumulative / 100) * tableWidth);
  }

  // --- Terms and Conditions HTML rendering setup ---
  const { title } = parseNotesHtml(transaction?.notes || "");
  const termsTitle = title || "Terms and Conditions";
  // ------------------------------------------------

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <Page key={pageIndex} size="A5" style={templateA5_3Styles.page}>
            {/* Header */}
            <View style={templateA5_3Styles.header} fixed>
              <View style={templateA5_3Styles.headerLeft}>
                {logoSrc && (
                  <Image src={logoSrc} style={templateA5_3Styles.logo} />
                )}
              </View>
              <View style={templateA5_3Styles.headerRight}>
                <Text style={templateA5_3Styles.companyName}>
                  {capitalizeWords(
                    company?.businessName ||
                      company?.companyName ||
                      "Company Name"
                  )}
                </Text>
                <Text style={[templateA5_3Styles.address]}>
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
                <View style={templateA5_3Styles.contactInfo}>
                  <Text style={templateA5_3Styles.contactLabel}>Name : </Text>
                  <Text style={templateA5_3Styles.contactValue}>
                    {capitalizeWords(getClientName(client))}
                  </Text>
                  <Text style={templateA5_3Styles.contactLabel}>
                    {" "}
                    | Phone :{" "}
                  </Text>
                  <Text style={templateA5_3Styles.contactValue}>
                    {company?.mobileNumber
                      ? formatPhoneNumber(String(company.mobileNumber))
                      : company?.Telephone
                      ? formatPhoneNumber(String(company.Telephone))
                      : "-"}
                  </Text>
                </View>
              </View>
            </View>
            {/* Body - Items Table */}
            <View style={templateA5_3Styles.section}>
              {/* table header  */}
              <View fixed>
                <View style={templateA5_3Styles.tableHeader}>
                  {company?.gstin && (
                    <View style={templateA5_3Styles.gstRow}>
                      <Text style={templateA5_3Styles.gstLabel}>GSTIN : </Text>
                      <Text style={templateA5_3Styles.gstValue}>
                        {" "}
                        {company.gstin}{" "}
                      </Text>
                    </View>
                  )}

                  <View style={templateA5_3Styles.invoiceTitleRow}>
                    <Text style={templateA5_3Styles.invoiceTitle}>
                      {" "}
                      {transaction.type === "proforma"
                        ? "PROFORMA INVOICE"
                        : isGSTApplicable
                        ? "TAX INVOICE"
                        : "INVOICE"}
                    </Text>
                  </View>

                  <View style={templateA5_3Styles.recipientRow}>
                    <Text style={templateA5_3Styles.recipientText}>
                      ORIGINAL FOR RECIPIENT
                    </Text>
                  </View>
                </View>
                {/* table three columns */}
                <View style={templateA5_3Styles.threeColSection}>
                  {/* Column 1 - Details of Buyer */}
                  <View
                    style={[templateA5_3Styles.column, { borderLeft: "none" }]}
                  >
                    <View style={templateA5_3Styles.columnHeader}>
                      <Text
                        style={[
                          templateA5_3Styles.threecoltableHeader,
                          { paddingTop: 2 },
                        ]}
                      >
                        Details of Buyer | Billed to:
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>Name</Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {capitalizeWords(party?.name || "N/A")}
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>Address</Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {capitalizeWords(getBillingAddress(party)) || "-"}
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>Phone</Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {party?.contactNumber
                          ? formatPhoneNumber(party.contactNumber)
                          : "-"}
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>GSTIN</Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {party?.gstin || "-"}
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>PAN</Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {party?.pan || "-"}
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>
                        Place of Supply
                      </Text>
                      <Text style={templateA5_3Styles.tableValue}>
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
                  <View style={templateA5_3Styles.column}>
                    <View style={templateA5_3Styles.columnHeader}>
                      <Text
                        style={[
                          templateA5_3Styles.threecoltableHeader,
                          { paddingTop: 2 },
                        ]}
                      >
                        Details of Consigned | Shipped to:
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>Name</Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {capitalizeWords(
                          shippingAddress?.label || party?.name || "N/A"
                        )}
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>Address</Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {capitalizeWords(
                          getShippingAddress(
                            shippingAddress,
                            getBillingAddress(party)
                          )
                        )}
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>Country</Text>
                      <Text style={templateA5_3Styles.tableValue}>India</Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>Phone</Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {shippingAddress?.contactNumber
                          ? formatPhoneNumber(
                              String(shippingAddress.contactNumber)
                            )
                          : party?.contactNumber
                          ? formatPhoneNumber(String(party.contactNumber))
                          : "-"}
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>GSTIN</Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {party?.gstin || "-"}
                      </Text>
                    </View>
                    <View style={templateA5_3Styles.dataRow}>
                      <Text style={templateA5_3Styles.tableLabel}>State</Text>
                      <Text style={templateA5_3Styles.tableValue}>
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
                    style={[templateA5_3Styles.column, { borderRight: "none" }]}
                  >
                    <View
                      style={[templateA5_3Styles.dataRow, { display: "flex" }]}
                    >
                      <Text style={templateA5_3Styles.tableLabel}>
                        Invoice No.
                      </Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {transaction.invoiceNumber || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={[templateA5_3Styles.dataRow, { display: "flex" }]}
                    >
                      <Text style={templateA5_3Styles.tableLabel}>
                        Invoice Date
                      </Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {new Date(transaction.date).toLocaleDateString("en-IN")}
                      </Text>
                    </View>
                    <View
                      style={[templateA5_3Styles.dataRow, { display: "flex" }]}
                    >
                      <Text style={templateA5_3Styles.tableLabel}>
                        Due Date
                      </Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {new Date(transaction.dueDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </Text>
                    </View>
                    <View
                      style={[templateA5_3Styles.dataRow, { display: "flex" }]}
                    >
                      <Text style={templateA5_3Styles.tableLabel}>
                        P.O. No.
                      </Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {transaction.voucher || "-"}
                      </Text>
                    </View>
                    <View
                      style={[templateA5_3Styles.dataRow, { display: "flex" }]}
                    >
                      <Text style={templateA5_3Styles.tableLabel}>
                        E-Way No.
                      </Text>
                      <Text style={templateA5_3Styles.tableValue}>
                        {transaction.referenceNumber || "-"}
                      </Text>
                    </View>
                    <View
                      style={[templateA5_3Styles.dataRow, { display: "flex" }]}
                    >
                      <Text style={templateA5_3Styles.tableLabel}></Text>
                      <Text style={templateA5_3Styles.tableValue}></Text>
                    </View>
                    <View
                      style={[templateA5_3Styles.dataRow, { display: "flex" }]}
                    >
                      <Text style={templateA5_3Styles.tableLabel}></Text>
                      <Text style={templateA5_3Styles.tableValue}></Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Items Table */}
              <View style={templateA5_3Styles.tableContainer}>
                {/* Vertical borders */}
                {borderPositions.map((pos, index) => (
                  <View
                    key={index}
                    style={[templateA5_3Styles.verticalBorder, { left: pos }]}
                  />
                ))}

                <View style={templateA5_3Styles.itemsTable}>
                  {/* Table Header */}
                  <View
                    style={templateA5_3Styles.itemsTableHeader}
                    wrap={false}
                    fixed
                  >
                    <Text
                      style={[
                        templateA5_3Styles.srNoHeader,
                        { width: colWidths[0] },
                      ]}
                    >
                      Sr. No.
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.productHeader,
                        { width: colWidths[1] },
                      ]}
                    >
                      Name of Product/Service
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.hsnHeader,
                        { width: colWidths[2] },
                      ]}
                    >
                      HSN/SAC
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.qtyHeader,
                        { width: colWidths[3] },
                      ]}
                    >
                      Qty
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.rateHeader,
                        { width: colWidths[4] },
                      ]}
                    >
                      Rate (Rs.)
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.taxableHeader,
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
                          templateA5_3Styles.igstHeader,
                          { width: colWidths[6] },
                        ]}
                      >
                        <Text style={templateA5_3Styles.igstMainHeader}>
                          IGST
                        </Text>
                        <View style={templateA5_3Styles.igstSubHeader}>
                          <Text
                            style={[
                              templateA5_3Styles.igstSubPercentage,
                              { borderRight: "1px solid #0371C1" },
                            ]}
                          >
                            %
                          </Text>
                          <Text style={templateA5_3Styles.igstSubText}>
                            Amount (Rs.)
                          </Text>
                        </View>
                      </View>
                    ) : showCGSTSGST ? (
                      // Intrastate - Show CGST/SGST columns
                      <>
                        <View
                          style={[
                            templateA5_3Styles.igstHeader,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={templateA5_3Styles.igstMainHeader}>
                            CGST
                          </Text>
                          <View style={templateA5_3Styles.igstSubHeader}>
                            <Text
                              style={[
                                templateA5_3Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={templateA5_3Styles.igstSubText}>
                              Amount (Rs.)
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            templateA5_3Styles.igstHeader,
                            { width: colWidths[7] },
                          ]}
                        >
                          <Text style={templateA5_3Styles.igstMainHeader}>
                            SGST
                          </Text>
                          <View style={templateA5_3Styles.igstSubHeader}>
                            <Text
                              style={[
                                templateA5_3Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={templateA5_3Styles.igstSubText}>
                              Amount (Rs.)
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : null}

                    {/* Total Column */}
                    <Text
                      style={[
                        templateA5_3Styles.totalHeader,
                        { width: colWidths[totalColumnIndex] },
                      ]}
                    >
                      Total (Rs.)
                    </Text>
                  </View>

                  {/* FIXED: Added wrap={false} to prevent row breaking */}
                  {pageItems.map((item, index) => (
                    <View
                      key={index}
                      style={templateA5_3Styles.itemsTableRow}
                      wrap={false}
                    >
                      <Text
                        style={[
                          templateA5_3Styles.srNoCell,
                          { width: colWidths[0] },
                        ]}
                      >
                        {pageIndex * itemsPerPage + index + 1}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.productCell,
                          { width: colWidths[1] },
                        ]}
                      >
                        {capitalizeWords(item.name)}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.hsnCell,
                          { width: colWidths[2] },
                        ]}
                      >
                        {item.code || "-"}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.qtyCell,
                          { width: colWidths[3] },
                        ]}
                      >
                        {formatQuantity(item.quantity || 0, item.unit)}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.rateCell,
                          { width: colWidths[4] },
                        ]}
                      >
                        {formatCurrency(item.pricePerUnit || 0)}
                      </Text>
                      <Text
                        style={[
                          templateA5_3Styles.taxableCell,
                          { width: colWidths[5] },
                        ]}
                      >
                        {formatCurrency(item.taxableValue)}
                      </Text>
                      {showIGST ? (
                        <View
                          style={[
                            templateA5_3Styles.igstCell,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={templateA5_3Styles.igstPercent}>
                            {item.gstRate}
                          </Text>
                          <Text style={templateA5_3Styles.igstAmount}>
                            {formatCurrency(item.igst)}
                          </Text>
                        </View>
                      ) : showCGSTSGST ? (
                        <>
                          <View
                            style={[
                              templateA5_3Styles.igstCell,
                              { width: colWidths[6] },
                            ]}
                          >
                            <Text style={templateA5_3Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={templateA5_3Styles.igstAmount}>
                              {formatCurrency(item.cgst)}
                            </Text>
                          </View>
                          <View
                            style={[
                              templateA5_3Styles.igstCell,
                              { width: colWidths[7] },
                            ]}
                          >
                            <Text style={templateA5_3Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={templateA5_3Styles.igstAmount}>
                              {formatCurrency(item.sgst)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                      <Text
                        style={[
                          templateA5_3Styles.totalCell,
                          { width: colWidths[totalColumnIndex] },
                        ]}
                      >
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* FIXED: Added wrap={false} to total row */}
                {isLastPage && (
                  <View style={templateA5_3Styles.itemsTableTotalRow}>
                    <Text
                      style={[
                        templateA5_3Styles.totalLabel,
                        { width: colWidths[0] },
                      ]}
                    ></Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalEmpty,
                        { width: colWidths[1] },
                      ]}
                    ></Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalEmpty,
                        {
                          width: colWidths[2],
                          textAlign: "center",
                          fontSize: 8,
                          fontWeight: "bold",
                        },
                      ]}
                    >
                      Total
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalQty,
                        {
                          width: colWidths[3],
                        },
                      ]}
                    >
                      {totalQty}
                    </Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalEmpty,
                        { width: colWidths[4] },
                      ]}
                    ></Text>
                    <Text
                      style={[
                        templateA5_3Styles.totalTaxable,
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
                          templateA5_3Styles.igstTotal,
                          { width: colWidths[6] },
                        ]}
                      >
                        <Text
                          style={[
                            templateA5_3Styles.totalIgstAmount,
                            { paddingRight: 5 },
                          ]}
                        >
                          {formatCurrency(totalIGST)}
                        </Text>
                      </View>
                    ) : showCGSTSGST ? (
                      <>
                        <View
                          style={[
                            templateA5_3Styles.igstTotal,
                            { width: colWidths[6], paddingRight: 4 },
                          ]}
                        >
                          <Text style={[templateA5_3Styles.totalIgstAmount]}>
                            {formatCurrency(totalCGST)}
                          </Text>
                        </View>
                        <View
                          style={[
                            templateA5_3Styles.igstTotal,
                            { width: colWidths[7], paddingRight: 5 },
                          ]}
                        >
                          <Text style={[templateA5_3Styles.totalIgstAmount]}>
                            {formatCurrency(totalSGST)}
                          </Text>
                        </View>
                      </>
                    ) : null}
                    <Text
                      style={[
                        templateA5_3Styles.grandTotal,
                        { width: colWidths[totalColumnIndex] },
                      ]}
                    >
                      {formatCurrency(totalAmount)}
                    </Text>
                  </View>
                )}
              </View>

              {isLastPage && (
                <>
                  <View>
                    <View
                      style={[
                        templateA5_3Styles.bottomSection,
                        { flexDirection: "column" },
                      ]}
                    >
                      <Text style={templateA5_3Styles.totalInWords}>
                        Total in words : {numberToWords(totalAmount)}
                      </Text>
                      {/* HSN/SAC Tax Table */}
                      {isGSTApplicable && (
                        <View
                          style={[
                            templateA5_3Styles.hsnTaxTable,
                            { borderTop: 0 },
                          ]}
                        >
                          {/* Define specific column widths for HSN table */}
                          {(() => {
                            // Define column widths specifically for HSN table
                            const hsnColWidths = showIGST
                              ? ["25%", "20%", "30%", "25%"]
                              : showCGSTSGST
                              ? ["18%", "20%", "22%", "22%", "18%"]
                              : ["40%", "30%", "30%"];

                            const hsnTotalColumnIndex = showIGST
                              ? 3
                              : showCGSTSGST
                              ? 4
                              : 2;

                            const hsnTableWidth = 377;

                            const hsnBorderPositions: number[] = [];
                            let hsnCumulative = 0;
                            for (let i = 0; i < hsnColWidths.length - 1; i++) {
                              hsnCumulative += parseFloat(hsnColWidths[i]);
                              hsnBorderPositions.push(
                                (hsnCumulative / 100) * hsnTableWidth
                              );
                            }

                            return (
                              <>
                                {/* Table Header */}
                                <View
                                  style={[
                                    templateA5_3Styles.hsnTaxTableHeader,
                                    { borderTop: 0 },
                                  ]}
                                  wrap={false}
                                  fixed
                                >
                                  <Text
                                    style={[
                                      templateA5_3Styles.hsnTaxHeaderCell,
                                      { width: hsnColWidths[0] },
                                    ]}
                                  >
                                    HSN / SAC
                                  </Text>
                                  <Text
                                    style={[
                                      templateA5_3Styles.hsnTaxHeaderCell,
                                      { width: hsnColWidths[1] },
                                    ]}
                                  >
                                    Taxable Value (Rs.)
                                  </Text>

                                  {/* Dynamic GST columns */}
                                  {showIGST ? (
                                    <View
                                      style={[
                                        templateA5_3Styles.igstHeader,
                                        {
                                          width: hsnColWidths[2],
                                          borderRight: "1px solid #0371C1",
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={
                                          templateA5_3Styles.igstMainHeader
                                        }
                                      >
                                        IGST
                                      </Text>
                                      <View
                                        style={templateA5_3Styles.igstSubHeader}
                                      >
                                        <Text
                                          style={[
                                            templateA5_3Styles.igstSubPercentage,
                                            {
                                              borderRight: "1px solid #0371C1",
                                            },
                                          ]}
                                        >
                                          %
                                        </Text>
                                        <Text
                                          style={templateA5_3Styles.igstSubText}
                                        >
                                          Amount (Rs.)
                                        </Text>
                                      </View>
                                    </View>
                                  ) : showCGSTSGST ? (
                                    <>
                                      <View
                                        style={[
                                          templateA5_3Styles.igstHeader,
                                          {
                                            width: hsnColWidths[2],
                                            borderRight: "1px solid #0371C1",
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={
                                            templateA5_3Styles.igstMainHeader
                                          }
                                        >
                                          CGST
                                        </Text>
                                        <View
                                          style={
                                            templateA5_3Styles.igstSubHeader
                                          }
                                        >
                                          <Text
                                            style={[
                                              templateA5_3Styles.igstSubPercentage,
                                              {
                                                borderRight:
                                                  "1px solid #0371C1",
                                              },
                                            ]}
                                          >
                                            %
                                          </Text>
                                          <Text
                                            style={
                                              templateA5_3Styles.igstSubText
                                            }
                                          >
                                            Amount (Rs.)
                                          </Text>
                                        </View>
                                      </View>
                                      <View
                                        style={[
                                          templateA5_3Styles.igstHeader,
                                          {
                                            width: hsnColWidths[3],
                                            borderRight: "1px solid #0371C1",
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={
                                            templateA5_3Styles.igstMainHeader
                                          }
                                        >
                                          SGST
                                        </Text>
                                        <View
                                          style={
                                            templateA5_3Styles.igstSubHeader
                                          }
                                        >
                                          <Text
                                            style={[
                                              templateA5_3Styles.igstSubPercentage,
                                              {
                                                borderRight:
                                                  "1px solid #0371C1",
                                              },
                                            ]}
                                          >
                                            %
                                          </Text>
                                          <Text
                                            style={
                                              templateA5_3Styles.igstSubText
                                            }
                                          >
                                            Amount (Rs.)
                                          </Text>
                                        </View>
                                      </View>
                                    </>
                                  ) : null}

                                  <Text
                                    style={[
                                      templateA5_3Styles.hsnTaxHeaderCell,
                                      {
                                        width:
                                          hsnColWidths[hsnTotalColumnIndex],
                                        borderRight: "none",
                                      },
                                    ]}
                                  >
                                    Total (Rs.)
                                  </Text>
                                </View>

                                {/* Table Rows */}
                                {getHsnSummary(
                                  itemsWithGST,
                                  showIGST,
                                  showCGSTSGST
                                ).map((hsnItem, index) => (
                                  <View
                                    key={index}
                                    style={templateA5_3Styles.hsnTaxTableRow}
                                    wrap={false}
                                  >
                                    <Text
                                      style={[
                                        templateA5_3Styles.hsnTaxCell,
                                        { width: hsnColWidths[0] },
                                      ]}
                                    >
                                      {hsnItem.hsnCode}
                                    </Text>
                                    <Text
                                      style={[
                                        templateA5_3Styles.hsnTaxCell,
                                        { width: hsnColWidths[1] },
                                      ]}
                                    >
                                      {formatCurrency(hsnItem.taxableValue)}
                                    </Text>

                                    {showIGST ? (
                                      <View
                                        style={[
                                          templateA5_3Styles.igstCell,
                                          {
                                            width: hsnColWidths[2],
                                            borderRight: "1px solid #0371C1",
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={templateA5_3Styles.igstPercent}
                                        >
                                          {hsnItem.taxRate}
                                        </Text>
                                        <Text
                                          style={templateA5_3Styles.igstAmount}
                                        >
                                          {formatCurrency(hsnItem.taxAmount)}
                                        </Text>
                                      </View>
                                    ) : showCGSTSGST ? (
                                      <>
                                        <View
                                          style={[
                                            templateA5_3Styles.igstCell,
                                            {
                                              borderRight: "1px solid #0371C1",
                                            },
                                            { width: hsnColWidths[2] },
                                          ]}
                                        >
                                          <Text
                                            style={
                                              templateA5_3Styles.igstPercent
                                            }
                                          >
                                            {hsnItem.taxRate / 2}
                                          </Text>
                                          <Text
                                            style={[
                                              templateA5_3Styles.igstAmount,
                                            ]}
                                          >
                                            {formatCurrency(hsnItem.cgstAmount)}
                                          </Text>
                                        </View>
                                        <View
                                          style={[
                                            templateA5_3Styles.igstCell,
                                            {
                                              width: hsnColWidths[3],
                                              borderRight: "1px solid #0371C1",
                                            },
                                          ]}
                                        >
                                          <Text
                                            style={[
                                              templateA5_3Styles.igstPercent,
                                            ]}
                                          >
                                            {hsnItem.taxRate / 2}
                                          </Text>
                                          <Text
                                            style={
                                              templateA5_3Styles.igstAmount
                                            }
                                          >
                                            {formatCurrency(hsnItem.sgstAmount)}
                                          </Text>
                                        </View>
                                      </>
                                    ) : null}

                                    <Text
                                      style={[
                                        templateA5_3Styles.hsnTaxCell,
                                        {
                                          width:
                                            hsnColWidths[hsnTotalColumnIndex],
                                          borderRight: "none",
                                        },
                                      ]}
                                    >
                                      {formatCurrency(hsnItem.total)}
                                    </Text>
                                  </View>
                                ))}

                                {/* Total Row */}
                                <View
                                  style={templateA5_3Styles.hsnTaxTableTotalRow}
                                  wrap={false}
                                >
                                  <Text
                                    style={[
                                      templateA5_3Styles.hsnTaxTotalCell,
                                      {
                                        width: hsnColWidths[0],
                                        borderRight: "1px solid #0371C1",
                                      },
                                    ]}
                                  >
                                    Total
                                  </Text>
                                  <Text
                                    style={[
                                      templateA5_3Styles.hsnTaxTotalCell,
                                      {
                                        width: hsnColWidths[1],
                                        borderRight: "1px solid #0371C1",
                                      },
                                    ]}
                                  >
                                    {formatCurrency(totalTaxable)}
                                  </Text>

                                  {showIGST ? (
                                    <View
                                      style={[
                                        templateA5_3Styles.igstTotal,
                                        {
                                          width: hsnColWidths[2],
                                          borderRight: "1px solid #0371C1",
                                          paddingRight: 25,
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={
                                          templateA5_3Styles.totalIgstAmount
                                        }
                                      >
                                        {formatCurrency(totalIGST)}
                                      </Text>
                                    </View>
                                  ) : showCGSTSGST ? (
                                    <>
                                      <View
                                        style={[
                                          templateA5_3Styles.igstTotal,
                                          {
                                            width: hsnColWidths[2],
                                            paddingRight: 14,
                                            borderRight: "1px solid #0371C1",
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={
                                            templateA5_3Styles.totalIgstAmount
                                          }
                                        >
                                          {formatCurrency(totalCGST)}
                                        </Text>
                                      </View>
                                      <View
                                        style={[
                                          templateA5_3Styles.igstTotal,
                                          {
                                            width: hsnColWidths[3],
                                            paddingRight: 14,
                                            borderRight: "1px solid #0371C1",
                                          },
                                        ]}
                                      >
                                        <Text
                                          style={
                                            templateA5_3Styles.totalIgstAmount
                                          }
                                        >
                                          {formatCurrency(totalSGST)}
                                        </Text>
                                      </View>
                                    </>
                                  ) : null}

                                  <Text
                                    style={[
                                      templateA5_3Styles.hsnTaxTotalCell,
                                      {
                                        width:
                                          hsnColWidths[hsnTotalColumnIndex],
                                        borderRight: "none",
                                      },
                                    ]}
                                  >
                                    {formatCurrency(totalAmount)}
                                  </Text>
                                </View>
                              </>
                            );
                          })()}
                        </View>
                      )}
                    </View>
                    <View
                      style={[
                        templateA5_3Styles.bottomSection,
                        { borderTop: 0 },
                      ]}
                    >
                      {/* Left Column: Bank Details + Terms */}

                      <View style={templateA5_3Styles.leftSection} wrap={false}>
                        {transaction.type !== "proforma" &&
                          isBankDetailAvailable && (
                            <View
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              {/* Bank Details Section - Added from Template 1 */}
                              <View
                                style={{
                                  padding: 4,
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
                                        marginBottom: 2,
                                        fontSize: 8,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          width: 70,
                                          fontWeight: "bold",
                                        }}
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
                                        marginBottom: 2,
                                        fontSize: 8,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          width: 70,
                                          fontWeight: "bold",
                                        }}
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
                                        marginBottom: 2,
                                        fontSize: 8,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          width: 70,
                                          fontWeight: "bold",
                                        }}
                                      >
                                        IFSC:
                                      </Text>
                                      <Text>{bankData.ifscCode}</Text>
                                    </View>
                                  )}
                                  {bankData?.branchAddress && (
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        marginBottom: 2,
                                        fontSize: 8,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          width: 70,
                                          fontWeight: "bold",
                                        }}
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
                                        marginBottom: 2,
                                        fontSize: 8,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          width: 70,
                                          fontWeight: "bold",
                                        }}
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
                                        marginBottom: 2,
                                        fontSize: 8,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          width: 70,
                                          fontWeight: "bold",
                                        }}
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
                                        marginBottom: 2,
                                        fontSize: 8,
                                      }}
                                    >
                                      <Text
                                        style={{
                                          width: 70,
                                          fontWeight: "bold",
                                        }}
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
                                    marginTop: 4,
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
                                      src={`${
                                        process.env.NEXT_PUBLIC_BASE_URL
                                      }/${(bankData as any).qrCode}`}
                                      style={{
                                        width: 60,
                                        height: 60,
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
                      <View style={templateA5_3Styles.rightSection}>
                        <View style={templateA5_3Styles.totalRow}>
                          <Text style={templateA5_3Styles.label}>
                            Taxable Amount
                          </Text>
                          <Text style={templateA5_3Styles.value}>
                            {`Rs.${formatCurrency(totalTaxable)}`}
                          </Text>
                        </View>

                        {isGSTApplicable && (
                          <View style={templateA5_3Styles.totalRow}>
                            <Text style={templateA5_3Styles.label}>
                              Total Tax
                            </Text>
                            <Text style={templateA5_3Styles.value}>
                              {`Rs.${formatCurrency(
                                showIGST ? totalIGST : totalCGST + totalSGST
                              )}`}
                            </Text>
                          </View>
                        )}

                        <View
                          style={[
                            templateA5_3Styles.totalRow,
                            isGSTApplicable
                              ? templateA5_3Styles.highlightRow
                              : {},
                          ]}
                        >
                          <Text
                            style={
                              isGSTApplicable
                                ? templateA5_3Styles.labelBold
                                : templateA5_3Styles.label
                            }
                          >
                            {isGSTApplicable
                              ? "Total Amount After Tax"
                              : "Total Amount"}
                          </Text>
                          <Text
                            style={
                              isGSTApplicable
                                ? templateA5_3Styles.valueBold
                                : templateA5_3Styles.value
                            }
                          >
                            {`Rs.${formatCurrency(totalAmount)}`}
                          </Text>
                        </View>

                        <View style={templateA5_3Styles.totalRow}>
                          <Text style={[templateA5_3Styles.label, { flex: 1 }]}>
                            For{" "}
                            {company?.businessName ||
                              company?.companyName ||
                              "Company Name"}
                          </Text>
                          <Text style={templateA5_3Styles.value}>
                            (E & O.E.)
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Terms and Conditions Section */}
                    {transaction?.notes ? (
                      <View
                        style={[
                          templateA5_3Styles.termsBox,
                          {
                            borderLeft: "1pt solid #0371C1",
                            borderRight: "1pt solid #0371C1",
                            width: "100%",
                            padding: 3,
                          },
                        ]}
                        wrap={false}
                      >
                        <>
                          {renderParsedElements(
                            parseHtmlToElements(transaction.notes, 7),
                            7
                          )}
                        </>
                      </View>
                    ) : null}
                  </View>
                </>
              )}

              {/* Table Bottom Border on Each Page */}
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
            {/* Page Number */}
            <Text
              fixed
              style={templateA5_3Styles.pageNumber}
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

export const generatePdfForTemplateA5_3 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null,
  client?: Client | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <TemplateA5_3PDF
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

export default TemplateA5_3PDF;
