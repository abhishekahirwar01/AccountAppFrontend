// pdf-template1.tsx
import HTML from "react-pdf-html";

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
  prepareTemplate8Data, // Assuming this utility handles all calculations and GST logic
  getStateCode,
  numberToWords,
  getHsnSummary,
} from "./pdf-utils";

import { parseHtmlToElements, renderParsedElements } from "./HtmlNoteRenderer";

import { capitalizeWords, parseNotesHtml } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "./pdf-utils";
import { template1Styles } from "./pdf-template-styles";

// --- Interface Definition ---
interface TemplateA5PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
  client?: Client | null;
  clientName?: Client;
}

// --- Main PDF Component ---
const Template1: React.FC<TemplateA5PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
  client,
  clientName,
}) => {
  // 1. Data Preparation and Calculations
  const {
    totals,
    totalTaxable,
    totalAmount,
    items,
    totalItems,
    totalQty,
    itemsBody,
    itemsWithGST, // Items with calculated GST fields (used for table rendering)
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

  const bankData: Bank = bank || ({} as Bank);

  // Check if any bank detail is available (used for conditional rendering)
  const isBankDetailAvailable =
    bankData?.bankName ||
    bankData?.ifscCode ||
    bankData?.qrCode ||
    bankData?.branchAddress ||
    (bankData as any)?.accountNo ||
    (bankData as any)?.upiDetails?.upiId;

  console.log("Bank data :", bankData);

  // 2. Dynamic Column Widths for Items Table (Based on GST Type)

  // For IGST (Interstate)
  const colWidthsIGST = ["4%", "30%", "10%", "8%", "10%", "15%", "20%", "12%"];
  const totalColumnIndexIGST = 7;

  // For CGST/SGST (Intrastate)
  const colWidthsCGSTSGST = [
    "4%",
    "30%",
    "10%",
    "8%",
    "10%",
    "10%",
    "13%",
    "13%",
    "10%",
  ];
  const totalColumnIndexCGSTSGST = 8;

  // For No Tax
  const colWidthsNoTax = ["10%", "25%", "10%", "10%", "10%", "15%", "20%"]; // These widths look like they might be optimized for a smaller table, adjusting for A4 wide columns.
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

  const tableWidth = showCGSTSGST ? 501 : showIGST ? 496 : 543;

  // Calculate vertical border positions
  const borderPositions: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < colWidths.length - 1; i++) {
    cumulative += parseFloat(colWidths[i]);
    borderPositions.push((cumulative / 100) * tableWidth);
  }

  const getClientName = (client: any) => {
    if (!client) return "Client Name";
    if (typeof client === "string") return client;
    return client.companyName || client.contactName || "Client Name";
  };

  // 3. Pagination Logic - All items on one page
  const pages = [itemsWithGST];

  // Get company name for signature block
  const companyName =
    company?.businessName || company?.companyName || "Company Name";

  // Signature block style (using generic style properties as template1Styles is external)
  const signatureBlockStyle = {
    width: "100%",
    padding: 5,
    alignItems: "center" as const,
    marginTop: 20,
  };

  const signatureTitleStyle = {
    fontSize: 9,
    fontWeight: "bold" as const,
    color: "#000000",
    marginBottom: 3,
    textAlign: "center" as const,
  };
  // console.log("client name  ::::::::::::", getClientName(client));
  return (
    <Document>
      {pages.map((Items, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <Page key={pageIndex} size="A4" style={template1Styles.page}>
            {/* Header */}
            <View fixed>
              <View style={template1Styles.header}>
                {logoSrc && (
                  <View style={template1Styles.headerLeft}>
                    <Image src={logoSrc} style={template1Styles.logo} />
                  </View>
                )}
                <View
                  style={[
                    template1Styles.headerRight,
                    { marginLeft: logoSrc ? 12 : 0 },
                  ]}
                >
                  <Text style={template1Styles.companyName}>
                    {capitalizeWords(companyName)}
                  </Text>
                  <Text style={template1Styles.address}>
                    {capitalizeWords(
                      [
                        company?.address,
                        company?.City,
                        company?.addressState,
                        company?.Country,
                        company?.Pincode,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Address Line 1"
                    )}
                  </Text>
                  <View style={template1Styles.contactInfo}>
                    {/* <Text style={template1Styles.contactLabel}>Name : </Text>
                  <Text style={template1Styles.contactValue}>
                    {capitalizeWords(localStorage.getItem("name") || "-")}
                  </Text> */}
                    <Text style={template1Styles.contactLabel}>Phone No: </Text>
                    <Text style={template1Styles.contactValue}>
                      {(() => {
                        try {
                          <Text style={template1Styles.contactLabel}>
                            Phone No:{" "}
                          </Text>;
                          const num =
                            company?.mobileNumber || company?.Telephone;
                          return num ? formatPhoneNumber(num) : "Phone";
                        } catch {
                          return (
                            company?.mobileNumber ||
                            company?.Telephone ||
                            "Phone"
                          );
                        }
                      })()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={template1Styles.section}>
                {/* table header */}
                <View style={template1Styles.tableHeader}>
                  {company?.gstin && (
                    <View style={template1Styles.gstRow}>
                      <Text style={template1Styles.gstLabel}>GSTIN : </Text>
                      <Text style={template1Styles.gstValue}>
                        {company.gstin}
                      </Text>
                    </View>
                  )}

                  <View style={template1Styles.invoiceTitleRow}>
                    <Text style={template1Styles.invoiceTitle}>
                      {transaction.type === "proforma"
                        ? "PROFORMA INVOICE"
                        : isGSTApplicable
                        ? "TAX INVOICE"
                        : "INVOICE"}
                    </Text>
                  </View>

                  <View style={template1Styles.recipientRow}>
                    <Text style={template1Styles.recipientText}>
                      ORIGINAL FOR RECIPIENT
                    </Text>
                  </View>
                </View>
                {/* table three columns */}
                <View style={template1Styles.threeColSection}>
                  {/* Column 1 - Details of Buyer */}
                  <View
                    style={[template1Styles.column, { borderLeft: "none" }]}
                  >
                    <View style={template1Styles.columnHeader}>
                      <Text style={template1Styles.threecoltableHeader}>
                        Details of Buyer | Billed to:
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>Name:</Text>
                      <Text style={template1Styles.tableValue}>
                        {capitalizeWords(party?.name || "N/A")}
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>Address:</Text>
                      <Text style={template1Styles.tableValue}>
                        {capitalizeWords(getBillingAddress(party))}
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>Phone:</Text>
                      <Text style={template1Styles.tableValue}>
                        {party?.contactNumber
                          ? formatPhoneNumber(party.contactNumber)
                          : "-"}
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>GSTIN:</Text>
                      <Text style={template1Styles.tableValue}>
                        {party?.gstin || "-"}
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>PAN:</Text>
                      <Text style={template1Styles.tableValue}>
                        {party?.pan || "-"}
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>
                        Place of Supply:
                      </Text>
                      <Text style={template1Styles.tableValue}>
                        {shippingAddress?.state
                          ? `${shippingAddress.state} (${
                              getStateCode(shippingAddress.state) || "-"
                            })`
                          : party?.state
                          ? `${party.state} (${
                              getStateCode(party.state) || "-"
                            })`
                          : "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Column 2 - Details of Consigned */}
                  <View style={template1Styles.column}>
                    <View style={template1Styles.columnHeader}>
                      <Text style={template1Styles.threecoltableHeader}>
                        Details of Consigned | Shipped to:
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>Name:</Text>
                      <Text style={template1Styles.tableValue}>
                        {capitalizeWords(
                          shippingAddress?.label || party?.name || "N/A"
                        )}
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>Address:</Text>
                      <Text style={template1Styles.tableValue}>
                        {capitalizeWords(
                          getShippingAddress(
                            shippingAddress,
                            getBillingAddress(party)
                          )
                        )}
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>Country:</Text>
                      {/* <Text style={template1Styles.tableValue}>India</Text> */}
                      {company?.Country && (
                        <Text style={[{ fontSize: 8, marginRight: 93 }]}>
                          {company?.Country}
                        </Text>
                      )}
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>Phone:</Text>
                      <Text style={template1Styles.tableValue}>
                        {formatPhoneNumber(
                          shippingAddress?.contactNumber ||
                            party?.contactNumber ||
                            "-"
                        )}
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>GSTIN:</Text>
                      <Text style={template1Styles.tableValue}>
                        {party?.gstin || "-"}
                      </Text>
                    </View>
                    <View style={template1Styles.dataRow}>
                      <Text style={template1Styles.tableLabel}>State:</Text>
                      <Text style={template1Styles.tableValue}>
                        {shippingAddress?.state
                          ? `${shippingAddress.state} (${
                              getStateCode(shippingAddress.state) || "-"
                            })`
                          : party?.state
                          ? `${party.state} (${
                              getStateCode(party.state) || "-"
                            })`
                          : "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Column 3 - Invoice Details */}
                  <View
                    style={[template1Styles.column, { borderRight: "none" }]}
                  >
                    <View
                      style={[
                        template1Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={template1Styles.tableLabel}>
                        Invoice No:
                      </Text>
                      <Text style={template1Styles.tableValue}>
                        {transaction.invoiceNumber || "N/A"}
                      </Text>
                    </View>
                    <View
                      style={[
                        template1Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={template1Styles.tableLabel}>
                        Invoice Date:
                      </Text>
                      <Text style={template1Styles.tableValue}>
                        {new Date(transaction.date).toLocaleDateString("en-IN")}
                      </Text>
                    </View>
                    <View
                      style={[
                        template1Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={template1Styles.tableLabel}>Due Date:</Text>
                      <Text style={template1Styles.tableValue}>
                        {new Date(transaction.dueDate).toLocaleDateString(
                          "en-IN"
                        )}
                      </Text>
                    </View>
                    <View
                      style={[
                        template1Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={template1Styles.tableLabel}>P.O. No:</Text>
                      <Text style={template1Styles.tableValue}>
                        {transaction.voucher || "-"}
                      </Text>
                    </View>
                    <View
                      style={[
                        template1Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={template1Styles.tableLabel}>E-Way No:</Text>
                      <Text style={template1Styles.tableValue}>
                        {transaction.referenceNumber || "-"}
                      </Text>
                    </View>
                    <View
                      style={[
                        template1Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={template1Styles.tableLabel}></Text>
                      <Text style={template1Styles.tableValue}></Text>
                    </View>
                    <View
                      style={[
                        template1Styles.dataRow,
                        { display: "flex", gap: 30 },
                      ]}
                    >
                      <Text style={template1Styles.tableLabel}></Text>
                      <Text style={template1Styles.tableValue}></Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {/* Body - Details & Items Table */}
            <View style={template1Styles.section}>
              {/* Items Table */}
              <View style={template1Styles.tableContainer}>
                <View wrap={true} style={template1Styles.itemsTable}>
                  {/* Table Header */}
                  <View style={template1Styles.itemsTableHeader} fixed>
                    <Text
                      style={[
                        template1Styles.srNoHeader,
                        { width: colWidths[0] },
                      ]}
                    >
                      Sr. No.
                    </Text>
                    <Text
                      style={[
                        template1Styles.productHeader,
                        { width: colWidths[1] },
                      ]}
                    >
                      Name of Product/Service
                    </Text>
                    <Text
                      style={[
                        template1Styles.hsnHeader,
                        { width: colWidths[2] },
                      ]}
                    >
                      HSN/SAC
                    </Text>
                    <Text
                      style={[
                        template1Styles.qtyHeader,
                        { width: colWidths[3] },
                      ]}
                    >
                      Qty
                    </Text>
                    <Text
                      style={[
                        template1Styles.rateHeader,
                        { width: colWidths[4] },
                      ]}
                    >
                      Rate (Rs.)
                    </Text>
                    <Text
                      style={[
                        template1Styles.taxableHeader,
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
                          template1Styles.igstHeader,
                          { width: colWidths[6] },
                        ]}
                      >
                        <Text style={template1Styles.igstMainHeader}>IGST</Text>
                        <View style={template1Styles.igstSubHeader}>
                          <Text
                            style={[
                              template1Styles.igstSubPercentage,
                              { borderRight: "1px solid #0371C1" },
                            ]}
                          >
                            %
                          </Text>
                          <Text style={template1Styles.igstSubText}>
                            Amount (Rs.)
                          </Text>
                        </View>
                      </View>
                    ) : showCGSTSGST ? (
                      // Intrastate - Show CGST/SGST columns
                      <>
                        <View
                          style={[
                            template1Styles.igstHeader,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={template1Styles.igstMainHeader}>
                            CGST
                          </Text>
                          <View
                            style={[
                              template1Styles.igstSubHeader,
                              { alignItems: "center" },
                            ]}
                          >
                            <Text
                              style={[
                                template1Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={template1Styles.igstSubText}>
                              Amount (Rs.)
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            template1Styles.igstHeader,
                            { width: colWidths[7] },
                          ]}
                        >
                          <Text style={template1Styles.igstMainHeader}>
                            SGST
                          </Text>
                          <View style={template1Styles.igstSubHeader}>
                            <Text
                              style={[
                                template1Styles.igstSubPercentage,
                                { borderRight: "1px solid #0371C1" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={template1Styles.igstSubText}>
                              Amount (Rs.)
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : null}

                    {/* Total Column */}
                    <Text
                      style={[
                        template1Styles.totalHeader,
                        { width: colWidths[totalColumnIndex] },
                      ]}
                    >
                      Total (Rs.)
                    </Text>
                  </View>

                  {/* Vertical borders */}
                  {borderPositions.map((pos, index) => (
                    <View
                      key={index}
                      style={[template1Styles.verticalBorder, { left: pos }]}
                    />
                  ))}
                  {/* Colored background for Taxable Value column */}
                  <View
                    style={[
                      template1Styles.columnBackground,
                      {
                        left: borderPositions[4], // After Rate column
                        width: (parseFloat(colWidths[5]) / 100) * tableWidth,
                        backgroundColor: "rgba(3, 113, 193, 0.2)",
                      },
                    ]}
                  />

                  {/* Colored background for Total column */}
                  <View
                    style={[
                      template1Styles.columnBackground,
                      {
                        left: borderPositions[totalColumnIndex - 1], // Before Total column
                        width:
                          (parseFloat(colWidths[totalColumnIndex]) / 100) *
                          tableWidth,
                        backgroundColor: "rgba(3, 113, 193, 0.2)",
                      },
                    ]}
                  />

                  {/* Table Rows (Items) */}
                  <View style={[]}>
                    {Items.map((item, index) => (
                      <View
                        key={index}
                        style={[template1Styles.itemsTableRow]}
                        wrap={false}
                      >
                        <Text
                          style={[
                            template1Styles.srNoCell,
                            { width: colWidths[0] },
                          ]}
                        >
                          {index + 1}
                        </Text>
                        <Text
                          style={[
                            template1Styles.productCell,
                            { width: colWidths[1] },
                          ]}
                        >
                          {capitalizeWords(item.name)}
                        </Text>
                        <Text
                          style={[
                            template1Styles.hsnCell,
                            { width: colWidths[2] },
                          ]}
                        >
                          {item.code || "-"}
                        </Text>
                        <Text
                          style={[
                            template1Styles.qtyCell,
                            { width: colWidths[3] },
                          ]}
                        >
                          {formatQuantity(item.quantity || 0, item.unit)}
                        </Text>
                        <Text
                          style={[
                            template1Styles.rateCell,
                            { width: colWidths[4] },
                          ]}
                        >
                          {formatCurrency(item.pricePerUnit || 0)}
                        </Text>
                        <Text
                          style={[
                            template1Styles.taxableCell,
                            { width: colWidths[5] },
                          ]}
                        >
                          {formatCurrency(item.taxableValue)}
                        </Text>
                        {showIGST ? (
                          <View
                            style={[
                              template1Styles.igstCell,
                              { width: colWidths[6] },
                            ]}
                          >
                            <Text style={template1Styles.igstPercent}>
                              {item.gstRate}
                            </Text>
                            <Text style={template1Styles.igstAmount}>
                              {formatCurrency(item.igst)}
                            </Text>
                          </View>
                        ) : showCGSTSGST ? (
                          <>
                            <View
                              style={[
                                template1Styles.igstCell,
                                { width: colWidths[6], alignItems: "center" },
                              ]}
                            >
                              <Text style={template1Styles.igstPercent}>
                                {item.gstRate / 2}
                              </Text>
                              <Text style={template1Styles.igstAmount}>
                                {formatCurrency(item.cgst)}
                              </Text>
                            </View>
                            <View
                              style={[
                                template1Styles.igstCell,
                                { width: colWidths[7] },
                              ]}
                            >
                              <Text style={template1Styles.igstPercent}>
                                {item.gstRate / 2}
                              </Text>
                              <Text style={template1Styles.igstAmount}>
                                {formatCurrency(item.sgst)}
                              </Text>
                            </View>
                          </>
                        ) : null}
                        <Text
                          style={[
                            template1Styles.totalCell,
                            { width: colWidths[totalColumnIndex] },
                          ]}
                        >
                          {formatCurrency(item.total)}
                        </Text>
                      </View>
                    ))}
                  </View>

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

                  {/* Table Totals (Only on Last Page) */}
                  {isLastPage && (
                    <View style={template1Styles.itemsTableTotalRow}>
                      <Text
                        style={[
                          template1Styles.totalLabel,
                          { width: colWidths[0] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          template1Styles.totalEmpty,
                          { width: colWidths[1] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          template1Styles.totalEmpty,
                          {
                            width: colWidths[2],
                          },
                        ]}
                      >
                        Total
                      </Text>
                      <Text
                        style={[
                          template1Styles.totalQty,
                          {
                            width: colWidths[3],
                          },
                        ]}
                      >
                        {totalQty}
                      </Text>
                      <Text
                        style={[
                          template1Styles.totalEmpty,
                          { width: colWidths[4] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          template1Styles.totalTaxable,
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
                            template1Styles.igstTotal,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text
                            style={[
                              template1Styles.totalIgstAmount,
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
                              template1Styles.igstTotal,
                              { width: colWidths[6] },
                            ]}
                          >
                            <Text style={[template1Styles.totalIgstAmount]}>
                              {formatCurrency(totalCGST)}
                            </Text>
                          </View>
                          <View
                            style={[
                              template1Styles.igstTotal,
                              { width: colWidths[7] },
                            ]}
                          >
                            <Text style={[template1Styles.totalIgstAmount]}>
                              {formatCurrency(totalSGST)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                      <Text
                        style={[
                          template1Styles.grandTotal,
                          { width: colWidths[totalColumnIndex] },
                        ]}
                      >
                        {formatCurrency(totalAmount)}
                      </Text>
                    </View>
                  )}

                  {/* Vertical borders */}
                  {borderPositions.map((pos, index) => (
                    <View
                      key={index}
                      style={[template1Styles.verticalBorder, { left: pos }]}
                    />
                  ))}
                </View>
              </View>

              {/* Bottom Sections (Only on Last Page) */}
              {isLastPage && (
                <>
                  <View
                    style={[
                      template1Styles.bottomSection,
                      { flexDirection: "column" },
                    ]}
                    wrap={false}
                  >
                    <Text style={template1Styles.totalInWords}>
                      Total in words : {numberToWords(totalAmount)}
                    </Text>
                    {/* HSN/SAC Tax Table */}
                    {isGSTApplicable && (
                      <View style={template1Styles.hsnTaxTable}>
                        {(() => {
                          // Define column widths specifically for HSN table
                          const hsnColWidths = showIGST
                            ? ["25%", "20%", "30%", "25%"] // HSN, Taxable Value, IGST, Total
                            : showCGSTSGST
                            ? ["18%", "20%", "22%", "22%", "20%"] // HSN, Taxable Value, CGST, SGST, Total
                            : ["40%", "30%", "30%"]; // HSN, Taxable Value, Total (No Tax)

                          const hsnTotalColumnIndex = showIGST
                            ? 3
                            : showCGSTSGST
                            ? 4
                            : 2;

                          return (
                            <>
                              {/* Table Header */}
                              <View style={template1Styles.hsnTaxTableHeader}>
                                <Text
                                  style={[
                                    template1Styles.hsnTaxHeaderCell,
                                    { width: hsnColWidths[0] },
                                  ]}
                                >
                                  HSN / SAC
                                </Text>
                                <Text
                                  style={[
                                    template1Styles.hsnTaxHeaderCell,
                                    { width: hsnColWidths[1] },
                                  ]}
                                >
                                  Taxable Value (Rs.)
                                </Text>

                                {/* Dynamic GST columns */}
                                {showIGST ? (
                                  // Interstate - Show IGST columns
                                  <View
                                    style={[
                                      template1Styles.igstHeader,
                                      {
                                        width: hsnColWidths[2],
                                        borderRight: "1px solid #0371C1",
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={template1Styles.igstMainHeader}
                                    >
                                      IGST
                                    </Text>
                                    <View style={template1Styles.igstSubHeader}>
                                      <Text
                                        style={[
                                          template1Styles.igstSubPercentage,
                                          {
                                            borderRight: "1px solid #0371C1",
                                          },
                                        ]}
                                      >
                                        %
                                      </Text>
                                      <Text style={template1Styles.igstSubText}>
                                        Amount (Rs.)
                                      </Text>
                                    </View>
                                  </View>
                                ) : showCGSTSGST ? (
                                  // Intrastate - Show CGST/SGST columns separately
                                  <>
                                    <View
                                      style={[
                                        template1Styles.igstHeader,
                                        {
                                          width: hsnColWidths[2],
                                          borderRight: "1px solid #0371C1",
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={template1Styles.igstMainHeader}
                                      >
                                        CGST
                                      </Text>
                                      <View
                                        style={template1Styles.igstSubHeader}
                                      >
                                        <Text
                                          style={[
                                            template1Styles.igstSubPercentage,
                                            {
                                              borderRight: "1px solid #0371C1",
                                            },
                                          ]}
                                        >
                                          %
                                        </Text>
                                        <Text
                                          style={template1Styles.igstSubText}
                                        >
                                          Amount (Rs.)
                                        </Text>
                                      </View>
                                    </View>
                                    <View
                                      style={[
                                        template1Styles.igstHeader,
                                        { width: hsnColWidths[3] },
                                      ]}
                                    >
                                      <Text
                                        style={template1Styles.igstMainHeader}
                                      >
                                        SGST
                                      </Text>
                                      <View
                                        style={template1Styles.igstSubHeader}
                                      >
                                        <Text
                                          style={[
                                            template1Styles.igstSubPercentage,
                                            {
                                              borderRight: "1px solid #0371C1",
                                            },
                                          ]}
                                        >
                                          %
                                        </Text>
                                        <Text
                                          style={template1Styles.igstSubText}
                                        >
                                          Amount (Rs.)
                                        </Text>
                                      </View>
                                    </View>
                                  </>
                                ) : null}

                                {/* Total Column */}
                                <Text
                                  style={[
                                    template1Styles.hsnTaxHeaderCell,
                                    {
                                      width: hsnColWidths[hsnTotalColumnIndex],
                                      borderLeft: "1px solid #0371C1",
                                      borderRight: "none",
                                    },
                                  ]}
                                >
                                  Total
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
                                  style={template1Styles.hsnTaxTableRow}
                                >
                                  <Text
                                    style={[
                                      template1Styles.hsnTaxCell,
                                      { width: hsnColWidths[0] },
                                    ]}
                                  >
                                    {hsnItem.hsnCode}
                                  </Text>
                                  <Text
                                    style={[
                                      template1Styles.hsnTaxCell,
                                      { width: hsnColWidths[1] },
                                    ]}
                                  >
                                    {formatCurrency(hsnItem.taxableValue)}
                                  </Text>

                                  {showIGST ? (
                                    <View
                                      style={[
                                        template1Styles.igstCell,
                                        { width: hsnColWidths[2] },
                                      ]}
                                    >
                                      <Text style={template1Styles.igstPercent}>
                                        {hsnItem.taxRate}
                                      </Text>
                                      <Text style={template1Styles.igstAmount}>
                                        {formatCurrency(hsnItem.taxAmount)}
                                      </Text>
                                    </View>
                                  ) : showCGSTSGST ? (
                                    <>
                                      <View
                                        style={[
                                          template1Styles.igstCell,
                                          {
                                            borderRight: "1px solid #0371C1",
                                          },
                                          { width: hsnColWidths[2] },
                                        ]}
                                      >
                                        <Text
                                          style={template1Styles.igstPercent}
                                        >
                                          {hsnItem.taxRate / 2}
                                        </Text>
                                        <Text
                                          style={[template1Styles.igstAmount]}
                                        >
                                          {formatCurrency(hsnItem.cgstAmount)}
                                        </Text>
                                      </View>
                                      <View
                                        style={[
                                          template1Styles.igstCell,
                                          { width: hsnColWidths[3] },
                                        ]}
                                      >
                                        <Text
                                          style={[template1Styles.igstPercent]}
                                        >
                                          {hsnItem.taxRate / 2}
                                        </Text>
                                        <Text
                                          style={template1Styles.igstAmount}
                                        >
                                          {formatCurrency(hsnItem.sgstAmount)}
                                        </Text>
                                      </View>
                                    </>
                                  ) : null}

                                  <Text
                                    style={[
                                      template1Styles.hsnTaxCell,
                                      {
                                        width:
                                          hsnColWidths[hsnTotalColumnIndex],
                                        borderLeft: "1px solid #0371C1",
                                        borderRight: "none",
                                      },
                                    ]}
                                  >
                                    {formatCurrency(hsnItem.total)}
                                  </Text>
                                </View>
                              ))}

                              {/* Total Row */}
                              <View style={template1Styles.hsnTaxTableTotalRow}>
                                <Text
                                  style={[
                                    template1Styles.hsnTaxTotalCell,
                                    { width: hsnColWidths[0] },
                                  ]}
                                >
                                  Total
                                </Text>
                                <Text
                                  style={[
                                    template1Styles.hsnTaxTotalCell,
                                    { width: hsnColWidths[1] },
                                  ]}
                                >
                                  {formatCurrency(totalTaxable)}
                                </Text>

                                {showIGST ? (
                                  <View
                                    style={[
                                      template1Styles.igstTotal,
                                      {
                                        width: hsnColWidths[2],
                                        borderRight: "1px solid #0371C1",
                                        padding: 0,
                                      },
                                    ]}
                                  >
                                    <Text
                                      style={[
                                        template1Styles.totalIgstAmount,
                                        { paddingRight: 38, paddingTop: 0 },
                                      ]}
                                    >
                                      {formatCurrency(totalIGST)}
                                    </Text>
                                  </View>
                                ) : showCGSTSGST ? (
                                  <>
                                    <View
                                      style={[
                                        template1Styles.igstTotal,
                                        {
                                          width: hsnColWidths[2],
                                          borderRight: "1px solid #0371C1",
                                          padding: 0,
                                          paddingRight: 8,
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          template1Styles.totalIgstAmount,
                                          { paddingRight: 20, paddingTop: 0 },
                                        ]}
                                      >
                                        {formatCurrency(totalCGST)}
                                      </Text>
                                    </View>
                                    <View
                                      style={[
                                        template1Styles.igstTotal,
                                        {
                                          width: hsnColWidths[3],
                                          // borderRight: "1px solid #0371C1",
                                          padding: 0,
                                          paddingRight: 8,
                                          // alignItems:'center'
                                        },
                                      ]}
                                    >
                                      <Text
                                        style={[
                                          template1Styles.totalIgstAmount,
                                          { paddingRight: 20, paddingTop: 0 },
                                        ]}
                                      >
                                        {formatCurrency(totalSGST)}
                                      </Text>
                                    </View>
                                  </>
                                ) : null}

                                <Text
                                  style={[
                                    template1Styles.hsnTaxTotalCell,
                                    {
                                      width: hsnColWidths[hsnTotalColumnIndex],
                                      borderLeft: "1px solid #0371C1",
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
                  <View style={template1Styles.bottomSection} wrap={false}>
                    {/* Left Column: Bank Details + Terms */}
                    <View style={template1Styles.leftSection}>
                      {transaction.type !== "proforma" && isBankDetailAvailable && (
                      <View
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        {/* Bank Details Section */}
                        <View
                          style={{
                            padding: 4,
                            flex: 1,
                            // borderTop: "1px solid #0371C1",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 9,
                              fontWeight: "bold",
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
                                    marginBottom: 2,
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
                                    marginBottom: 2,
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
                                    marginBottom: 2,
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
                                    marginBottom: 2,
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

                              {(bankData as any)?.upiDetails?.upiName && (
                                <View
                                  style={{
                                    flexDirection: "row",
                                    marginBottom: 2,
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

                              {(bankData as any)?.upiDetails?.upiMobile && (
                                <View
                                  style={{
                                    flexDirection: "row",
                                    marginBottom: 2,
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
                                src={`${process.env.NEXT_PUBLIC_BASE_URL}/${
                                  (bankData as any).qrCode
                                }`}
                                style={{
                                  width: 80,
                                  height: 80,
                                  objectFit: "contain",
                                }}
                              />
                            </View>
                          </View>
                        ) : null}
                      </View>
                      )}

                      {/* Terms and Conditions Section */}
                      {transaction?.notes ? (
                        <View
                          style={{
                            marginTop: 4,
                            padding: 5,
                            borderTop: "1px solid #0371C1",
                          }}
                        >
                          <>
                            {/* Using renderParsedElements for HTML Notes (rich text) */}
                            {renderParsedElements(
                              parseHtmlToElements(transaction.notes, 8),
                              8
                            )}
                          </>
                        </View>
                      ) : null}
                    </View>

                    {/* Right Column: Totals + Signature Block (from Template 21) */}
                    <View style={template1Styles.rightSection}>
                      <View style={template1Styles.totalRow}>
                        <Text style={template1Styles.label}>
                          Taxable Amount
                        </Text>
                        <Text style={template1Styles.value}>
                          Rs.{formatCurrency(totalTaxable)}
                        </Text>
                      </View>

                      {isGSTApplicable && (
                        <View style={template1Styles.totalRow}>
                          <Text style={template1Styles.label}>Total Tax</Text>
                          <Text style={template1Styles.value}>
                            Rs.
                            {formatCurrency(
                              showIGST ? totalIGST : totalCGST + totalSGST
                            )}
                          </Text>
                        </View>
                      )}

                      <View
                        style={[
                          template1Styles.totalRow,
                          isGSTApplicable ? template1Styles.highlightRow : {},
                        ]}
                      >
                        <Text
                          style={
                            isGSTApplicable
                              ? template1Styles.labelBold
                              : template1Styles.label
                          }
                        >
                          {isGSTApplicable
                            ? "Total Amount After Tax"
                            : "Total Amount"}
                        </Text>
                        <Text
                          style={
                            isGSTApplicable
                              ? template1Styles.valueBold
                              : template1Styles.value
                          }
                        >
                          Rs.{formatCurrency(totalAmount)}
                        </Text>
                      </View>

                      {/* SIGNATURE BLOCK ADDED FROM TEMPLATE 21 */}
                      <View style={signatureBlockStyle}>
                        <Text style={signatureTitleStyle}>
                          For {capitalizeWords(companyName)}
                        </Text>

                        <View
                          style={{
                            height: 40,
                            width: "100%",
                            alignItems: "center" as const,
                            justifyContent: "center" as const,
                          }}
                        >
                          {/* Signature image placeholder */}
                        </View>

                        <View
                          style={{
                            borderTopWidth: 1,
                            borderTopColor: "#0371C1", // Assuming primary color or border color from template 1 styles
                            width: "106%",
                            paddingTop: 2,
                          }}
                        >
                          <Text style={{ fontSize: 7, textAlign: "center" }}>
                            Authorised Signatory
                          </Text>
                        </View>
                      </View>
                      {/* End of SIGNATURE BLOCK */}
                    </View>
                  </View>
                </>
              )}
            </View>

            {/* Page Number */}
            <Text
              fixed
              style={template1Styles.pageNumber}
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
export const generatePdfForTemplate1 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null,
  client?: Client | null,
  clientName?: string | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <Template1
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

export default Template1;
