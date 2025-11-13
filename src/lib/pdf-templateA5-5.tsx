// pdf-templateA5.tsx
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
import { useState } from "react";
import { parseHtmlToElements, renderParsedElements } from "./HtmlNoteRenderer";
import { formatPhoneNumber } from "./pdf-utils";
import { templateA5_4Styles } from "./pdf-template-styles";
const getClientName = (client: any) => {
  console.log("getClientName called with:", client);
  if (!client) return "Client Name";
  if (typeof client === "string") return client;
  return client.companyName || client.contactName || "Client Name";
};

interface TemplateA5PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
  client?: Client | null;
}

const templateA5_6Styles = StyleSheet.create({
  tableOuterBorder: {
    borderColor: "#02006C",
    borderWidth: 0,
    marginVertical: 10,
  },
  page: {
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    padding: 20,
    fontSize: 8,
    fontFamily: "Helvetica",
  },
  header: {
    display: "flex",
    flexDirection: "row",
    paddingBottom: 4,
    alignItems: "center",
    textAlign: "center",
    gap: 6,
  },
  headerLeft: {
    alignItems: "flex-start",
  },
  headerRight: {
    flex: 3,
    alignItems: "flex-start",
  },
  logo: {
    width: 60,
    height: 60,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#02006C",
  },
  address: {
    fontSize: 10,
    marginBottom: 3,
    lineHeight: 1.2,
    color: "#02006C",
    textAlign: "left",
    // fontWeight: "normal",
  },
  contactInfo: {
    fontSize: 10,
    lineHeight: 1.2,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    alignItems: "center",
    color: "#02006C",
  },
  contactLabel: {
    fontSize: 9,
    fontWeight: "bold",
  },
  contactValue: {
    fontSize: 9,
    fontWeight: "normal",
    color: "#02006C",
  },
  section: {
    padding: 0,
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1.5px solid #02006C",
    position: "relative",
  },
  gstRow: {
    flexDirection: "row",
    padding: 4,
  },
  gstLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  gstValue: {
    fontSize: 12,
    fontWeight: "normal",
  },
  invoiceTitleRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    padding: 2,
    flexWrap: "wrap",
  },
  invoiceTitle: {
    fontSize: 12,
    fontWeight: "extrabold",
    textAlign: "center",
    color: "#02006C",
    flex: 1,
  },
  recipientRow: {
    padding: 4,
  },
  recipientText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  threeColSection: {
    flexDirection: "row",
    borderBottom: "1.5px solid #02006C",
    borderLeft: "1.5px solid #02006C",
    borderRight: "1.5px solid #02006C",
  },
  column: {
    width: "33.3%",
    paddingHorizontal: 4,
    borderLeft: "1px solid #02006C",
  },
  columnHeader: {
    marginBottom: 5,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  threecoltableHeader: {
    fontSize: 8,
    fontWeight: "bold",
  },
  tableLabel: {
    fontSize: 8,
    fontWeight: "bold",
    width: "40%",
    flexShrink: 0,
    wrap: true,
    hyphens: "none",
  },
  tableValue: {
    fontSize: 8,
    fontWeight: "normal",
    width: "70%",
    flexShrink: 1,
    wrap: true,
    hyphens: "none",
  },
  itemsTable: {},
  tableContainer: {
    position: "relative",
    width: "100%",
    borderBottom: "1.5px solid #02006C",
    borderLeft: "1.5px solid #02006C",
    borderRight: "1.5px solid #02006C",
  },
  verticalBorder: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "#02006C",
  },
  itemsTableHeader: {
    flexDirection: "row",
    backgroundColor: "#D8D8E8",
    borderBottom: "1px solid #02006C",
    borderTop: 0,
  },
  headerCell: {
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  itemsTableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  itemsTableTotalRow: {
    flexDirection: "row",
    backgroundColor: "#D8D8E8",
    alignItems: "center",
  },
  srNoHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  productHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "25%",

    // textAlign: "center",
    padding: 4,
    // borderLeft:"1px solid #02006C"
  },
  hsnHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
  },
  qtyHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  rateHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    padding: 2,
  },
  taxableHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
  },
  igstHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
  },
  totalHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },
  igstMainHeader: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 1,
  },
  igstSubHeader: { flexDirection: "row", borderTop: "1px solid #02006C" },
  igstSubText: {
    fontSize: 6,
    fontWeight: "bold",
    width: "70%",
    textAlign: "center",
    padding: 1,
  },
  igstSubPercentage: {
    fontSize: 6,
    fontWeight: "bold",
    width: "30%",
    textAlign: "center",
    padding: 1,
  },
  srNoCell: { fontSize: 7, width: "8%", textAlign: "center", padding: 4 },
  productCell: {
    fontSize: 7,
    width: "25%",
    textAlign: "left",
    padding: 4,
    wrap: true,
  },
  hsnCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
  },
  qtyCell: {
    fontSize: 7,
    width: "8%",
    textAlign: "center",
    padding: 4,
  },
  rateCell: {
    fontSize: 7,
    width: "10%",
    textAlign: "center",
    padding: 4,
  },
  taxableCell: {
    fontSize: 7,
    width: "12%",
    textAlign: "center",
    padding: 4,
  },
  igstCell: {
    flexDirection: "row",
    width: "12%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    textAlign: "center",
    paddingVertical: 3,
  },
  igstPercent: {
    fontSize: 7,
    textAlign: "center",
    padding: 1,
    width: "30%",
  },
  igstAmount: {
    fontSize: 7,
    textAlign: "center",
    padding: 1,
    width: "70%",
  },
  totalCell: {
    fontSize: 7,
    width: "15%",
    textAlign: "center",
    padding: 4,
  },
  totalLabel: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "center",
    padding: 2,
  },
  totalEmpty: {
    fontSize: 7,
    width: "25%",
    padding: 2,
    textAlign: "center",
    fontWeight: "bold",
  },
  totalQty: {
    fontSize: 7,
    fontWeight: "bold",
    width: "8%",
    textAlign: "center",
    padding: 2,
  },
  totalTaxable: {
    fontSize: 7,
    fontWeight: "bold",
    width: "12%",
    textAlign: "center",
    padding: 2,
  },
  igstTotal: {
    fontSize: 7,
    padding: 2,
    borderLeft: "1px solid #ddd",
    borderRight: "1px solid #ddd",
  },
  totalIgstAmount: {
    fontSize: 7,
    fontWeight: "bold",
    textAlign: "right",
    padding: 1,
  },
  grandTotal: {
    fontSize: 7,
    fontWeight: "bold",
    width: "15%",
    textAlign: "center",
    padding: 2,
  },
  igstPercentHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
    borderRight: "1px solid #000",
  },
  igstAmountHeader: {
    fontSize: 7,
    fontWeight: "bold",
    width: "50%",
    textAlign: "center",
    padding: 2,
  },
  igstPercentCell: {
    fontSize: 7,
    textAlign: "center",
    padding: 2,
  },
  igstAmountCell: {
    fontSize: 7,
    textAlign: "center",
    padding: 2,
  },
  bottomSection: {
    flexDirection: "row",
    borderTop: "1px solid #02006C",
    width: "100%",
    fontSize: 7,
    borderLeft: "1px solid #02006C",
    borderRight: "1px solid #02006C",
    borderBottom: "1px solid #02006C",
  },
  leftSection: {
    width: "65%",
    borderRight: "1px solid #02006C",
  },
  totalInWords: {
    fontSize: 7,
    fontWeight: "bold",
    borderBottom: "1px solid #02006C",
    padding: 4,
    textTransform: "uppercase",
  },
  termsBox: {
    // marginTop: 3,
    padding: 8,
    paddingTop: 0,
  },
  termLine: {
    fontSize: 10,
    marginBottom: 3,
    fontFamily: "Helvetica",
    color: "#000000",
    textAlign: "left" as "left",
    fontWeight: "normal",
    textDecoration: "none",
    backgroundColor: "transparent",
  },
  qrContainer: {
    alignItems: "center",
    marginTop: 6,
  },
  qrImage: {
    width: 45,
    height: 45,
  },
  qrText: {
    fontSize: 7,
    marginTop: 2,
  },
  rightSection: {
    width: "35%",
    justifyContent: "flex-start",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1px solid #02006C",
    padding: 4,
  },
  label: { fontSize: 8, fontWeight: "bold" },
  value: { fontSize: 8, fontWeight: "bold" },
  labelBold: { fontSize: 8, fontWeight: "bold" },
  valueBold: { fontSize: 8, fontWeight: "bold" },
  highlightRow: {
    backgroundColor: "#D8D8E8",
  },
  currencySymbol: {
    fontSize: 6,
  },
  pageNumber: {
    position: "absolute",
    bottom: 5,
    right: 22,
    fontSize: 8,
    textAlign: "right",
  },
});

const TemplateA5PDF: React.FC<TemplateA5PDFProps> = ({
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

  const [hasWrapped, setHasWrapped] = useState(false);

  const logoSrc = company?.logo
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`
    : null;

  // Bank Details Logic from Template 1
  const bankData: Bank = bank || ({} as Bank);

  const isBankDetailAvailable =
    bankData?.bankName ||
    bankData?.ifscCode ||
    bankData?.qrCode ||
    bankData?.branchAddress ||
    (bankData as any)?.accountNo ||
    (bankData as any)?.upiDetails?.upiId;

  const colWidthsIGST = ["4%", "25%", "10%", "8%", "10%", "15%", "20%", "12%"];
  const totalColumnIndexIGST = 7;

  const itemsPerPage = itemsWithGST.length;
  const pages = [];
  for (let i = 0; i < itemsWithGST.length; i += itemsPerPage) {
    pages.push(itemsWithGST.slice(i, i + itemsPerPage));
  }

  const colWidthsCGSTSGST = [
    "4%",
    "30%",
    "10%",
    "8%",
    "10%",
    "12%",
    "12%",
    "15%",
    "10%",
  ];
  const totalColumnIndexCGSTSGST = 8;

  const colWidthsNoTax = ["10%", "25%", "10%", "10%", "10%", "15%", "20%"];
  const totalColumnIndexNoTax = 6;

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

  const tableWidth = showCGSTSGST ? 495 : showIGST ? 530 : 560;

  const borderPositions: number[] = [];
  let cumulative = 0;
  for (let i = 0; i < colWidths.length - 1; i++) {
    cumulative += parseFloat(colWidths[i]);
    borderPositions.push((cumulative / 100) * tableWidth);
  }

  return (
    <Document>
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        return (
          <Page
            key={pageIndex}
            size="A5"
            orientation="landscape"
            style={templateA5_6Styles.page}
          >
            {/* Header */}
            <View
              style={[
                {
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  border: "1.5px solid #02006C",
                  borderBottom: 0,
                },
              ]}
              fixed
            >
              {/* Left */}
              <View
                style={[
                  templateA5_6Styles.header,
                  { width: "70%", padding: 4 },
                ]}
              >
                <View style={templateA5_6Styles.headerLeft}>
                  {logoSrc && (
                    <Image src={logoSrc} style={templateA5_6Styles.logo} />
                  )}
                </View>
                <View style={templateA5_6Styles.headerRight}>
                  <Text style={templateA5_6Styles.companyName}>
                    {capitalizeWords(
                      company?.businessName ||
                        company?.companyName ||
                        "Company Name"
                    )}
                  </Text>
                  <Text style={templateA5_6Styles.address}>
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
                  <View style={templateA5_6Styles.contactInfo}>
                    <Text style={templateA5_6Styles.contactLabel}>
                      Phone :{" "}
                    </Text>
                    <Text style={templateA5_6Styles.contactValue}>
                      {company?.mobileNumber
                        ? formatPhoneNumber(company.mobileNumber)
                        : "-"}
                    </Text>
                    <Text style={templateA5_6Styles.contactLabel}>
                      , E-mail :{" "}
                    </Text>
                    <Text style={templateA5_6Styles.contactValue}>
                      {company?.emailId}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.contactInfo}>
                    <Text style={templateA5_6Styles.contactLabel}>
                      Telephone :{" "}
                    </Text>
                    <Text style={templateA5_6Styles.contactValue}>
                      {company?.Telephone || "-"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right */}
              {/* <View
                style={[
                  {
                    width: "30%",
                    borderLeft: "1px solid #02006C",
                    alignItems: "flex-start",
                  },
                ]}
              >
                {company?.gstin && (
                  <View style={[templateA5_6Styles.header]}>
                    <View
                      style={[
                        templateA5_6Styles.contactInfo,
                        {
                          color: "#02006C",
                          borderBottom: "1px solid #02006C",
                          width: "100%",
                          padding: 4,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          templateA5_6Styles.contactLabel,
                          { fontWeight: "extraBold", fontSize: 10 },
                        ]}
                      >
                        GSTIN :
                      </Text>
                      <Text
                        style={[
                          templateA5_6Styles.contactValue,
                          { fontWeight: "extraBold", fontSize: 10 },
                        ]}
                      >
                        {company.gstin}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={[templateA5_6Styles.headerRight, { padding: 4 }]}>
                  <Text style={templateA5_6Styles.address}>
                    Our Banking Partner:
                  </Text>

                  {bank?.ifscCode || bank?.branchAddress ? (
                    <View style={templateA5_6Styles.contactInfo}>
                      <Text style={templateA5_6Styles.contactValue}>
                        IFSC Code :{" "}
                      </Text>
                      <Text style={templateA5_6Styles.contactValue}>
                        {bank?.ifscCode}
                      </Text>
                      <Text style={templateA5_6Styles.contactValue}>
                        Address :{" "}
                      </Text>
                      <Text style={templateA5_6Styles.contactValue}>
                        {bank?.branchAddress}
                      </Text>
                    </View>
                  ) : (
                    <Text style={templateA5_6Styles.contactValue}>
                      No bank details available
                    </Text>
                  )}
                </View>
              </View> */}
            </View>

            {/* Body - Items Table */}
            <View style={templateA5_6Styles.section}>
              {/* table header */}
              <View style={templateA5_6Styles.tableHeader} fixed>
                <View style={templateA5_6Styles.invoiceTitleRow}>
                  {company?.gstin ? (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text
                        style={[
                          templateA5_6Styles.contactLabel,
                          { fontWeight: "extraBold", fontSize: 10 , color:"#02006C"},
                        ]}
                      >
                        GSTIN :
                      </Text>
                      <Text
                        style={[
                          templateA5_6Styles.contactValue,
                          { fontWeight: "extraBold", fontSize: 10 },
                        ]}
                      >
                        {company.gstin}
                      </Text>
                    </View>
                  ) : (
                    // No GSTIN, make sure to left-align the title
                    <View style={{ flex: 1, alignItems: "flex-start" }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "extrabold",
                          textAlign: "left", // Align to the left
                          color: "#02006C",
                        }}
                      >
                        {transaction.type === "proforma"
                          ? "PROFORMA INVOICE"
                          : isGSTApplicable
                          ? "TAX INVOICE"
                          : "INVOICE"}
                      </Text>
                    </View>
                  )}

                  {company?.gstin && (
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "extrabold",
                          textAlign: "center",
                          color: "#02006C",
                        }}
                      >
                        {transaction.type === "proforma"
                          ? "PROFORMA INVOICE"
                          : isGSTApplicable
                          ? "TAX INVOICE"
                          : "INVOICE"}
                      </Text>
                    </View>
                  )}

                  <View style={templateA5_6Styles.recipientRow}>
                    <Text
                      style={[
                        templateA5_6Styles.recipientText,
                        { color: "#02006C" },
                      ]}
                    >
                      ORIGINAL FOR RECIPIENT
                    </Text>
                  </View>
                </View>
              </View>

              {/* table three columns */}
              <View style={templateA5_6Styles.threeColSection} fixed>
                {/* Column 1 - Details of Buyer */}
                <View
                  style={[templateA5_6Styles.column, { borderLeft: "none" }]}
                >
                  <View style={templateA5_6Styles.columnHeader}>
                    <Text style={templateA5_6Styles.threecoltableHeader}>
                      Details of Buyer | Billed to:
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>Name</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {capitalizeWords(party?.name || "N/A")}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>Address</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {capitalizeWords(getBillingAddress(party) || "-")}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>Phone</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {party?.contactNumber
                        ? formatPhoneNumber(party.contactNumber)
                        : "-"}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>GSTIN</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {party?.gstin || "-"}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>PAN</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {party?.pan || "-"}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>
                      Place of Supply
                    </Text>
                    <Text style={templateA5_6Styles.tableValue}>
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
                <View style={templateA5_6Styles.column}>
                  <View style={templateA5_6Styles.columnHeader}>
                    <Text style={templateA5_6Styles.threecoltableHeader}>
                      Details of Consigned | Shipped to:
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>Name</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {capitalizeWords(
                        shippingAddress?.label || party?.name || "N/A"
                      )}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>Address</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {capitalizeWords(
                        getShippingAddress(
                          shippingAddress,
                          getBillingAddress(party)
                        )
                      )}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>Country</Text>
                    <Text style={templateA5_6Styles.tableValue}>India</Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>Phone</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {capitalizeWords(
                        shippingAddress?.contactNumber
                          ? formatPhoneNumber(shippingAddress.contactNumber)
                          : party?.contactNumber
                          ? formatPhoneNumber(party.contactNumber)
                          : "-"
                      )}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>GSTIN</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {party?.gstin || "-"}
                    </Text>
                  </View>
                  <View style={templateA5_6Styles.dataRow}>
                    <Text style={templateA5_6Styles.tableLabel}>State</Text>
                    <Text style={templateA5_6Styles.tableValue}>
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
                  style={[templateA5_6Styles.column, { borderRight: "none" }]}
                >
                  <View
                    style={[
                      templateA5_6Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5_6Styles.tableLabel}>
                      Invoice No.
                    </Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {transaction.invoiceNumber || "N/A"}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_6Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5_6Styles.tableLabel}>
                      Invoice Date
                    </Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {new Date(transaction.date).toLocaleDateString("en-IN")}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_6Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5_6Styles.tableLabel}>Due Date</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {new Date(transaction.dueDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_6Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5_6Styles.tableLabel}>P.O. No.</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {transaction.voucher || "-"}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_6Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5_6Styles.tableLabel}>E-Way No.</Text>
                    <Text style={templateA5_6Styles.tableValue}>
                      {transaction.referenceNumber || "-"}
                    </Text>
                  </View>
                  <View
                    style={[
                      templateA5_6Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5_6Styles.tableLabel}></Text>
                    <Text style={templateA5_6Styles.tableValue}></Text>
                  </View>
                  <View
                    style={[
                      templateA5_6Styles.dataRow,
                      { display: "flex", gap: 30 },
                    ]}
                  >
                    <Text style={templateA5_6Styles.tableLabel}></Text>
                    <Text style={templateA5_6Styles.tableValue}></Text>
                  </View>
                </View>
              </View>

              {/* Items Table */}
              <View style={templateA5_6Styles.tableContainer}>
                <View style={templateA5_6Styles.itemsTable}>
                  {/* Table Header */}
                  <View style={templateA5_6Styles.itemsTableHeader} fixed>
                    {/* Vertical borders */}
                    {borderPositions.map((pos, index) => (
                      <View
                        key={index}
                        style={[
                          templateA5_6Styles.verticalBorder,
                          { left: pos },
                        ]}
                      />
                    ))}
                    <Text
                      style={[
                        templateA5_6Styles.srNoHeader,
                        { width: colWidths[0] },
                      ]}
                    >
                      Sr. No.
                    </Text>
                    <Text
                      style={[
                        templateA5_6Styles.productHeader,
                        { width: colWidths[1] },
                      ]}
                    >
                      Name of Product/Service
                    </Text>
                    <Text
                      style={[
                        templateA5_6Styles.hsnHeader,
                        { width: colWidths[2] },
                      ]}
                    >
                      HSN/SAC
                    </Text>
                    <Text
                      style={[
                        templateA5_6Styles.qtyHeader,
                        { width: colWidths[3] },
                      ]}
                    >
                      Qty
                    </Text>
                    <Text
                      style={[
                        templateA5_6Styles.rateHeader,
                        { width: colWidths[4] },
                      ]}
                    >
                      Rate (Rs.)
                    </Text>
                    <Text
                      style={[
                        templateA5_6Styles.taxableHeader,
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
                          templateA5_6Styles.igstHeader,
                          { width: colWidths[6] },
                        ]}
                      >
                        <Text style={templateA5_6Styles.igstMainHeader}>
                          IGST
                        </Text>
                        <View style={templateA5_6Styles.igstSubHeader}>
                          <Text
                            style={[
                              templateA5_6Styles.igstSubPercentage,
                              { borderRight: "1px solid #02006C" },
                            ]}
                          >
                            %
                          </Text>
                          <Text style={templateA5_6Styles.igstSubText}>
                            Amount (Rs.)
                          </Text>
                        </View>
                      </View>
                    ) : showCGSTSGST ? (
                      // Intrastate - Show CGST/SGST columns
                      <>
                        <View
                          style={[
                            templateA5_6Styles.igstHeader,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={templateA5_6Styles.igstMainHeader}>
                            CGST
                          </Text>
                          <View style={templateA5_6Styles.igstSubHeader}>
                            <Text
                              style={[
                                templateA5_6Styles.igstSubPercentage,
                                { borderRight: "1px solid #02006C" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={templateA5_6Styles.igstSubText}>
                              Amount (Rs.)
                            </Text>
                          </View>
                        </View>
                        <View
                          style={[
                            templateA5_6Styles.igstHeader,
                            { width: colWidths[7] },
                          ]}
                        >
                          <Text style={templateA5_6Styles.igstMainHeader}>
                            SGST
                          </Text>
                          <View style={templateA5_6Styles.igstSubHeader}>
                            <Text
                              style={[
                                templateA5_6Styles.igstSubPercentage,
                                { borderRight: "1px solid #02006C" },
                              ]}
                            >
                              %
                            </Text>
                            <Text style={templateA5_6Styles.igstSubText}>
                              Amount (Rs.)
                            </Text>
                          </View>
                        </View>
                      </>
                    ) : null}

                    {/* Total Column */}
                    <Text
                      style={[
                        templateA5_6Styles.totalHeader,
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
                      style={[templateA5_6Styles.verticalBorder, { left: pos }]}
                    />
                  ))}
                  {pageItems.map((item, index) => (
                    <View
                      key={index}
                      style={templateA5_6Styles.itemsTableRow}
                      wrap={false}
                    >
                      <Text
                        style={[
                          templateA5_6Styles.srNoCell,
                          { width: colWidths[0] },
                        ]}
                      >
                        {pageIndex * itemsPerPage + index + 1}
                      </Text>
                      <Text
                        style={[
                          templateA5_6Styles.productCell,
                          { width: colWidths[1] },
                        ]}
                      >
                        {capitalizeWords(item.name)}
                      </Text>
                      <Text
                        style={[
                          templateA5_6Styles.hsnCell,
                          { width: colWidths[2] },
                        ]}
                      >
                        {item.code || "-"}
                      </Text>
                      <Text
                        style={[
                          templateA5_6Styles.qtyCell,
                          { width: colWidths[3] },
                        ]}
                      >
                        {formatQuantity(item.quantity || 0, item.unit)}
                      </Text>
                      <Text
                        style={[
                          templateA5_6Styles.rateCell,
                          { width: colWidths[4] },
                        ]}
                      >
                        {formatCurrency(item.pricePerUnit || 0)}
                      </Text>
                      <Text
                        style={[
                          templateA5_6Styles.taxableCell,
                          { width: colWidths[5] },
                        ]}
                      >
                        {formatCurrency(item.taxableValue)}
                      </Text>
                      {showIGST ? (
                        <View
                          style={[
                            templateA5_6Styles.igstCell,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text style={templateA5_6Styles.igstPercent}>
                            {item.gstRate}
                          </Text>
                          <Text style={templateA5_6Styles.igstAmount}>
                            {formatCurrency(item.igst)}
                          </Text>
                        </View>
                      ) : showCGSTSGST ? (
                        <>
                          <View
                            style={[
                              templateA5_6Styles.igstCell,
                              { width: colWidths[6] },
                            ]}
                          >
                            <Text style={templateA5_6Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={templateA5_6Styles.igstAmount}>
                              {formatCurrency(item.cgst)}
                            </Text>
                          </View>
                          <View
                            style={[
                              templateA5_6Styles.igstCell,
                              { width: colWidths[7] },
                            ]}
                          >
                            <Text style={templateA5_6Styles.igstPercent}>
                              {item.gstRate / 2}
                            </Text>
                            <Text style={templateA5_6Styles.igstAmount}>
                              {formatCurrency(item.sgst)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                      <Text
                        style={[
                          templateA5_6Styles.totalCell,
                          { width: colWidths[totalColumnIndex] },
                        ]}
                      >
                        {formatCurrency(item.total)}
                      </Text>
                    </View>
                  ))}

                  {isLastPage && (
                    <View style={templateA5_6Styles.itemsTableTotalRow}>
                      <Text
                        style={[
                          templateA5_6Styles.totalLabel,
                          { width: colWidths[0] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          templateA5_6Styles.totalEmpty,
                          { width: colWidths[1] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          templateA5_6Styles.totalEmpty,
                          {
                            width: colWidths[2],
                          },
                        ]}
                      >
                        Total
                      </Text>
                      <Text
                        style={[
                          templateA5_6Styles.totalQty,
                          {
                            width: colWidths[3],
                          },
                        ]}
                      >
                        {totalQty}
                      </Text>
                      <Text
                        style={[
                          templateA5_6Styles.totalEmpty,
                          { width: colWidths[4] },
                        ]}
                      ></Text>
                      <Text
                        style={[
                          templateA5_6Styles.totalTaxable,
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
                            templateA5_6Styles.igstTotal,
                            { width: colWidths[6] },
                          ]}
                        >
                          <Text
                            style={[
                              templateA5_6Styles.totalIgstAmount,
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
                              templateA5_6Styles.igstTotal,
                              { width: colWidths[6], paddingRight: 10 },
                            ]}
                          >
                            <Text style={[templateA5_6Styles.totalIgstAmount]}>
                              {formatCurrency(totalCGST)}
                            </Text>
                          </View>
                          <View
                            style={[
                              templateA5_6Styles.igstTotal,
                              { width: colWidths[7], paddingRight: 15 },
                            ]}
                          >
                            <Text style={[templateA5_6Styles.totalIgstAmount]}>
                              {formatCurrency(totalSGST)}
                            </Text>
                          </View>
                        </>
                      ) : null}
                      <Text
                        style={[
                          templateA5_6Styles.grandTotal,
                          { width: colWidths[totalColumnIndex] },
                        ]}
                      >
                        {formatCurrency(totalAmount)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {isLastPage && (
                <>
                  <View style={[templateA5_6Styles.bottomSection]}>
                    {/* Left Column: Total in words + Bank Details + Terms */}
                    <View style={templateA5_6Styles.leftSection}>
                      <Text style={templateA5_6Styles.totalInWords}>
                        Total in words : {numberToWords(totalAmount)}
                      </Text>

                      {/* Bank Details Section - Added from Template 1 */}
                      {transaction.type !== "proforma" &&
                        isBankDetailAvailable && (
                          <View
                            style={{
                              padding: 5,
                            }}
                            wrap={false}
                          >
                            <View
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                              }}
                            >
                              {/* Bank Details Text */}
                              <View style={{ flex: 1 }}>
                                <Text
                                  style={{
                                    fontSize: 9,
                                    fontWeight: "bold",
                                    marginBottom: 5,
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
                                        width: 70,
                                        height: 70,
                                        objectFit: "contain",
                                      }}
                                    />
                                  </View>
                                </View>
                              ) : null}
                            </View>
                          </View>
                        )}
                    </View>

                    {/* Right Column: Totals */}
                    <View style={templateA5_6Styles.rightSection}>
                      <View style={templateA5_6Styles.totalRow}>
                        <Text style={templateA5_6Styles.label}>
                          Taxable Amount
                        </Text>
                        <Text style={templateA5_6Styles.value}>
                          {`Rs.${formatCurrency(totalTaxable)}`}
                        </Text>
                      </View>

                      {isGSTApplicable && (
                        <View style={templateA5_6Styles.totalRow}>
                          <Text style={templateA5_6Styles.label}>
                            Total Tax
                          </Text>
                          <Text style={templateA5_6Styles.value}>
                            {`Rs.${formatCurrency(
                              showIGST ? totalIGST : totalCGST + totalSGST
                            )}`}
                          </Text>
                        </View>
                      )}

                      <View
                        style={[
                          templateA5_6Styles.totalRow,
                          isGSTApplicable
                            ? templateA5_6Styles.highlightRow
                            : {},
                        ]}
                      >
                        <Text
                          style={
                            isGSTApplicable
                              ? templateA5_6Styles.labelBold
                              : templateA5_6Styles.label
                          }
                        >
                          {isGSTApplicable
                            ? "Total Amount After Tax"
                            : "Total Amount"}
                        </Text>
                        <Text
                          style={
                            isGSTApplicable
                              ? templateA5_6Styles.valueBold
                              : templateA5_6Styles.value
                          }
                        >
                          {`Rs.${formatCurrency(totalAmount)}`}
                        </Text>
                      </View>

                      <View style={templateA5_6Styles.totalRow}>
                        <Text style={templateA5_6Styles.label}>
                          For{"-"}
                          {company?.businessName ||
                            company?.companyName ||
                            "Company Name"}
                        </Text>
                        <Text style={templateA5_6Styles.value}>(E & O.E.)</Text>
                      </View>
                    </View>
                  </View>

                  {/* Terms and Conditions Section */}
          {transaction?.notes ? (
                  <View
                    style={[
                      templateA5_4Styles.termsBox,
                      {
                        borderBottom: 0,
                        borderLeft: "1pt solid #02006C",
                        borderRight: "1pt solid #02006C",
                      },
                    ]}
                    wrap={false}
                  >
                    <Text
                      style={[
                        templateA5_4Styles.termLine,
                        { fontWeight: "bold" },
                      ]}
                    >
                      {/* {termsTitle || "Terms and Conditions"} */}
                    </Text>

                      <>
                        {renderParsedElements(
                          parseHtmlToElements(transaction.notes, 7),
                          7
                        )}
                      </>
                   
                  </View>
                   ) : null}
                </>
              )}
              {/* Table Bottom Border on Each Page */}
              <View
                fixed
                style={{
                  height: 1,
                  backgroundColor: "#02006C",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />
            </View>

            {/* Page Number */}
            <Text
              fixed
              style={templateA5_6Styles.pageNumber}
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

export const generatePdfForTemplateA5_5 = async (
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
