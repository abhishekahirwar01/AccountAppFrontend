// template21.tsx (UPDATED VERSION with Content-Bound Table Border Logic and Increased Bottom Margin)
import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
  Item,
  Client, // Assuming Client type might be needed in some templates/utils
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
  formatCurrency,
  getBillingAddress,
  getShippingAddress,
  prepareTemplate8Data,
  numberToWords,
  getStateCode,
} from "./pdf-utils";
import { capitalizeWords, parseNotesHtml } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "./pdf-utils";
import { formatWithOptions } from "util";
import { parseHtmlToElements, renderParsedElements } from "./HtmlNoteRenderer";

// --- Constants and Styles Definition (template21.tsx) ---

const PRIMARY_BLUE = "#0066cc";
const LIGHT_GRAY = "#f5f5f5";
const DARK_TEXT = "#000000";
const BORDER_COLOR = "#b2b2b2";
const TABLE_HEADER_BG = "#0066cc";

const template21Styles = StyleSheet.create({
  page: {
    paddingTop: 15,
    paddingBottom: 30, // Increased for better bottom margin
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: DARK_TEXT,
  },

  // --- Header & Company Details ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 2,
    paddingBottom: 6,
  },
  leftHeaderBlock: {
    width: "65%",
  },
  taxInvoiceTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: PRIMARY_BLUE,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 11,
    fontWeight: "bold",
    color: DARK_TEXT,
    marginBottom: 2,
  },
  gstin: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 2,
    color: DARK_TEXT,
  },
  addressText: {
    fontSize: 9,
    lineHeight: 1.3,
    color: DARK_TEXT,
  },
  emailText: {
    fontSize: 8,
    lineHeight: 1.3,
    color: DARK_TEXT,
  },

  // --- Logo & Original Text ---
  rightHeaderBlock: {
    width: "35%",
    alignItems: "flex-end",
  },
  originalForRecipient: {
    fontSize: 8,
    fontWeight: "bold",
    color: DARK_TEXT,
    marginBottom: 4,
    textAlign: "right",
  },
  logoContainer: {
    // width: 80,
    // height: 80,
    backgroundColor: "transparent",
  },

  // --- Reusable Styles for Address Blocks (Updated to simplify) ---
  grayColor: {
    color: "#262626",
  },
  sectionHeader: {
    fontSize: 9,
    marginBottom: 3,
  },
  boldText: {
    fontWeight: "bold",
  },

  // --- Items Table ---
  table: {
    width: "auto",
    // FIX: Use individual border properties to prevent border extending past content
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: TABLE_HEADER_BG,
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 7,
    // FIX: Set to 0 as the border is added dynamically on the row to manage wrapping
    borderBottomWidth: 0,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: 0.5, // Standard row separator
    minHeight: 16,
  },
  tableCellHeader: {
    borderRightColor: "white",
    borderRightWidth: 0.5,
    padding: 3,
    textAlign: "center",
    justifyContent: "center",
  },
  tableCell: {
    borderRightColor: BORDER_COLOR,
    borderRightWidth: 0.5,
    padding: 2.5,
    fontSize: 7,
    textAlign: "right",
    justifyContent: "center",
  },
  tableCellCenter: {
    textAlign: "center",
  },

  // --- Tax Summary Table ---
  taxSummaryTable: {
    marginTop: 2,
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 6,
  },
  taxHeader: {
    flexDirection: "row",
    backgroundColor: TABLE_HEADER_BG,
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
  },
  taxRow: {
    flexDirection: "row",
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: 0.5,
  },
  taxCell: {
    padding: 2.5,
    fontSize: 8,
    textAlign: "right",
    borderRightColor: BORDER_COLOR,
    borderRightWidth: 0.5,
  },

  // --- Footer / Bank / Terms ---
  qrBankSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    minHeight: 90,
  },
  qrBlock: {
    width: "25%",
    // padding: 5,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
    alignItems: "center",
    textAlign: "center",
  },
  bankBlock: {
    width: "55%",
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: BORDER_COLOR,
  },
  signatureBlock: {
    width: "20%",
    padding: 5,
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: DARK_TEXT,
    marginBottom: 3,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 1.5,
    fontSize: 7,
  },
  bankLabel: {
    width: 55,
    fontWeight: "bold",
    marginRight: 4,
    textAlign: "left",
  },
  termsSection: {
    width: "100%",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    padding: 5,
    paddingTop: 0,
  },
  termLine: {
    fontSize: 8,
    lineHeight: 1.3,
  },
  smallText: {
    fontSize: 7,
  },
  amountInWords: {
    fontSize: 7.5,
    marginBottom: 2,
    padding: 2,
  },
  grantTotalAmount: {
    fontSize: 8,
    marginBottom: 2,
    textAlign: "right",
    padding: 2,
  },
});

// --- Interface Definitions for calculated data ---

interface ItemWithCalculations extends Item {
  code?: string;
  unit?: string;
  taxableValue: number;
  gstRate: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
  details?: string[];
}

interface TaxSummaryItem {
  hsn: string;
  taxableValue: number;
  rate: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
}

interface Template8Data {
  totals: any;
  totalTaxable: number;
  totalAmount: number;
  items: ItemWithCalculations[];
  itemsWithGST: ItemWithCalculations[];
  totalItems: number;
  totalQty: number;
  itemsBody: any;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  isGSTApplicable: boolean;
  isInterstate: boolean;
  showIGST: boolean;
  showCGSTSGST: boolean;
  showNoTax: boolean;
}

interface Template21PDFProps {
  company?: (Company & { logoUrl?: string; emailId?: string }) | null;
  party?: Party | null;
  transaction: Transaction;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
}

// --- Main PDF Component ---

const Template21PDF: React.FC<Template21PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
}) => {
  // --- Data Preparation ---
  const preparedData: Template8Data = prepareTemplate8Data(
    transaction,
    company,
    party,
    shippingAddress
  ) as unknown as Template8Data;

  const {
    totalTaxable,
    totalAmount,
    items: allItems,
    totalItems,
    totalQty,
    totalCGST,
    totalSGST,
    totalIGST,
    isGSTApplicable,
    showIGST,
    showCGSTSGST,
  } = preparedData;

  const typedItems: ItemWithCalculations[] = (preparedData.itemsWithGST ||
    allItems) as ItemWithCalculations[];

  const pages: ItemWithCalculations[][] = [typedItems];
  const shouldHideBankDetails = transaction.type === "proforma";
  // --- Column Width Definitions (Fixed values) ---
  const COL_WIDTH_SR_NO = 25;
  const COL_WIDTH_NAME = showIGST ? 130 : showCGSTSGST ? 110 : 195;
  const COL_WIDTH_HSN = showIGST ? 55 : showCGSTSGST ? 45 : 65;
  const COL_WIDTH_QTY = showIGST ? 45 : showCGSTSGST ? 35 : 55;
  const COL_WIDTH_RATE = showIGST ? 58 : showCGSTSGST ? 48 : 70;
  const COL_WIDTH_TAXABLE = showIGST ? 72 : showCGSTSGST ? 58 : 80;
  const COL_WIDTH_GST_PCT_HALF = 35;
  const COL_WIDTH_GST_AMT_HALF = 50;
  const COL_WIDTH_IGST_PCT = 40;
  const COL_WIDTH_IGST_AMT = 60;
  const COL_WIDTH_TOTAL = showIGST ? 50 : showCGSTSGST ? 65 : 90;

  const getColWidths = () => {
    let widths = [
      COL_WIDTH_SR_NO,
      COL_WIDTH_NAME,
      COL_WIDTH_HSN,
      COL_WIDTH_QTY,
      COL_WIDTH_RATE,
      COL_WIDTH_TAXABLE,
    ];

    if (showIGST) {
      widths.push(COL_WIDTH_IGST_PCT, COL_WIDTH_IGST_AMT);
    } else if (showCGSTSGST) {
      widths.push(
        COL_WIDTH_GST_PCT_HALF,
        COL_WIDTH_GST_AMT_HALF,
        COL_WIDTH_GST_PCT_HALF,
        COL_WIDTH_GST_AMT_HALF
      );
    }
    widths.push(COL_WIDTH_TOTAL);

    return widths;
  };

  const colWidths = getColWidths();
  const totalColumnIndex = colWidths.length - 1;

  const calculateTotalLabelWidth = () => {
    if (showIGST) {
      return (
        COL_WIDTH_SR_NO +
        COL_WIDTH_NAME +
        COL_WIDTH_HSN +
        COL_WIDTH_QTY +
        COL_WIDTH_RATE +
        COL_WIDTH_TAXABLE +
        COL_WIDTH_IGST_PCT +
        COL_WIDTH_IGST_AMT
      );
    } else if (showCGSTSGST) {
      return (
        COL_WIDTH_SR_NO +
        COL_WIDTH_NAME +
        COL_WIDTH_HSN +
        COL_WIDTH_QTY +
        COL_WIDTH_RATE +
        COL_WIDTH_TAXABLE +
        COL_WIDTH_GST_PCT_HALF * 2 +
        COL_WIDTH_GST_AMT_HALF * 2
      );
    } else {
      return (
        COL_WIDTH_SR_NO +
        COL_WIDTH_NAME +
        COL_WIDTH_HSN +
        COL_WIDTH_QTY +
        COL_WIDTH_RATE +
        COL_WIDTH_TAXABLE
      );
    }
  };

  const getAddressLines = (address: string | undefined) =>
    address ? address.split("\n").filter((line) => line.trim() !== "") : [];

  const bankData: Bank = bank || ({} as Bank);
  const totalAmountRounded = Math.round(totalAmount);
  const amountInWords = numberToWords(totalAmountRounded);

  // Check if any bank detail is available (used for conditional rendering)
  const isBankDetailAvailable =
    bankData?.bankName ||
    bankData?.ifscCode ||
    bankData?.branchAddress ||
    (bankData as any)?.accountNo ||
    (bankData as any)?.upiDetails?.upiId;

  const extendedTransaction = transaction as Transaction & {
    poNumber?: string;
    poDate?: string;
    ewayNumber?: string;
  };

  // --- Tax Summary Data Grouped by HSN/SAC ---
  const taxSummary = typedItems.reduce((acc, item) => {
    const key = `${item.code || "-"}-${item.gstRate || 0}`;

    if (!acc[key]) {
      acc[key] = {
        hsn: item.code || "-",
        taxableValue: 0,
        rate: item.gstRate || 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
        total: 0,
      };
    }

    acc[key].taxableValue += item.taxableValue || 0;
    acc[key].igst += item.igst || 0;
    acc[key].cgst += item.cgst || 0;
    acc[key].sgst += item.sgst || 0;
    acc[key].total += (item.igst || 0) + (item.cgst || 0) + (item.sgst || 0);

    return acc;
  }, {} as Record<string, TaxSummaryItem>);

  const taxSummaryArray: TaxSummaryItem[] = Object.values(taxSummary);

  // Use the new, more robust extraction logic
  const {
    title,
    isList,
    items: notesItems,
  } = parseNotesHtml(transaction?.notes || "");
  const termsTitle = title || "Terms and Conditions";

  const termsItems =
    notesItems.length > 0 ? notesItems : ["No terms and conditions specified"];

  // --- Document Rendering ---
  return (
    <Document>
      {pages.map((pageItems: ItemWithCalculations[], pageIndex: number) => {
        const isLastPage = pageIndex === pages.length - 1;

        const companyName =
          company?.businessName || company?.companyName || "-";
        const partyAddress = getBillingAddress(party);
        const shippingAddressString = getShippingAddress(
          shippingAddress,
          partyAddress
        );

        return (
          <Page key={pageIndex} size="A4" style={template21Styles.page}>
            {/* --- Header Section (Fixed) --- */}
            <View style={template21Styles.headerContainer} fixed>
              {/* Left Side: Tax Invoice & Company Details */}
              <View style={template21Styles.leftHeaderBlock}>
                <Text style={template21Styles.taxInvoiceTitle}>
                  {transaction.type === "proforma"
                    ? "PROFORMA INVOICE"
                    : isGSTApplicable
                    ? "TAX INVOICE"
                    : "INVOICE"}
                </Text>

                <Text style={template21Styles.companyName}>
                  {capitalizeWords(companyName)}
                </Text>

                {company?.gstin && (
                  <Text style={template21Styles.gstin}>
                    GSTIN: {company.gstin}
                  </Text>
                )}
                {getAddressLines(company?.address).map((line, idx) => (
                  <Text
                    key={`comp-addr-${idx}`}
                    style={template21Styles.addressText}
                  >
                    {line}
                  </Text>
                ))}
                {company?.addressState && (
                  <Text style={template21Styles.addressText}>
                    {capitalizeWords(company.City)},{" "}
                    {capitalizeWords(company.addressState)},
                    {capitalizeWords(company.Country)}
                    {company?.Pincode ? `, ${company.Pincode}` : ""}
                  </Text>
                )}
                <Text style={template21Styles.addressText}>
                  <Text style={{ fontWeight: "bold" }}>Phone:  </Text>
                  {company?.mobileNumber
                    ? formatPhoneNumber(company.mobileNumber)
                    : company?.Telephone
                    ? formatPhoneNumber(company.Telephone)
                    : "-"}
                </Text>
              </View>

              {/* Right Side: Original Text & Logo */}
              <View style={template21Styles.rightHeaderBlock}>
                <Text style={template21Styles.originalForRecipient}>
                  ORIGINAL FOR RECIPIENT
                </Text>
                {company?.logo ? (
                  <View style={template21Styles.logoContainer}>
                    <Image
                      style={{
                        width: 70,
                        height: 70,
                        objectFit: "contain",
                      }}
                      src={`${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`}
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                    }}
                  />
                )}
              </View>
            </View>

            {/* Two Column Section (Fixed) */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
              fixed
            >
              {/* NEW: Full-width blue line added at the very top */}
              <View
                style={{
                  position: "absolute",
                  top: -6,
                  left: 0,
                  right: 0,
                  height: 1.5,
                  backgroundColor: "#007AFF",
                }}
              />
              {/* End of NEW: Blue line */}

              {/* Left Side - Customer Details (Billed to) */}
              <View style={{ flex: 2, paddingRight: 10 }}>
                <View style={{ marginBottom: 8 }}>
                  <Text
                    style={[
                      template21Styles.grayColor,
                      template21Styles.sectionHeader,
                      { fontSize: 10, fontWeight: "bold" },
                    ]}
                  >
                    Customer Details | Billed to :
                  </Text>
                  <Text
                    style={[
                      template21Styles.companyName,
                      template21Styles.grayColor,
                      { fontSize: 9 },
                    ]}
                  >
                    {capitalizeWords(party?.name || "-")}
                  </Text>
                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { width: "90%", fontSize: 9 },
                    ]}
                  >
                    {capitalizeWords(partyAddress || "-")}
                  </Text>

                  {/* GSTIN detail */}

                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 9 },
                    ]}
                  >
                    <Text style={[template21Styles.boldText, { fontSize: 9 }]}>
                      GSTIN:{" "}
                    </Text>
                    <Text>{party?.gstin || "-"}</Text>
                  </Text>

                  <Text style={{ fontSize: 9 }}>
                    <Text style={template21Styles.boldText}>Phone: </Text>
                    <Text>
                      {" "}
                      {party?.contactNumber
                        ? formatPhoneNumber(party.contactNumber)
                        : "-"}
                    </Text>
                  </Text>

                  {/* PAN detail */}
                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 10, marginTop: 3 },
                    ]}
                  >
                    <Text style={[template21Styles.boldText, { fontSize: 9 }]}>
                      PAN:{" "}
                    </Text>
                    <Text style={[{ fontSize: 9 }]}>{party?.pan || "-"}</Text>
                  </Text>

                  {/* State detail */}
                  {/* <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 10 },
                    ]}
                  >
                    <Text style={[template21Styles.boldText, { fontSize: 9 }]}>
                      State:{" "}
                    </Text>
                    <Text style={[{ fontSize: 9 }]}>
                      {capitalizeWords(party?.state || "-")}
                    </Text>
                  </Text> */}
                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 9, marginBottom: 1 },
                    ]}
                  >
                    <Text style={[template21Styles.boldText, { fontSize: 9 }]}>
                      Place of Supply:{" "}
                    </Text>
                    <Text>
                      {shippingAddress?.state
                        ? `${shippingAddress.state} (${
                            getStateCode(shippingAddress.state) || "-"
                          })`
                        : party?.state
                        ? `${party.state} (${getStateCode(party.state) || "-"})`
                        : "-"}
                    </Text>
                  </Text>
                </View>
              </View>

              {/* Center - Shipping Address (Shipped to) */}
              <View style={{ flex: 2, paddingRight: 10 }}>
                <View>
                  <Text
                    style={[
                      template21Styles.sectionHeader,
                      template21Styles.grayColor,
                      { fontSize: 10, fontWeight: "bold" },
                    ]}
                  >
                    Details of Consignee | Shipped to :
                  </Text>
                  <Text
                    style={[
                      template21Styles.companyName,
                      template21Styles.grayColor,
                      { fontSize: 9 },
                    ]}
                  >
                    {capitalizeWords(
                      shippingAddress?.label || party?.name || " "
                    )}
                  </Text>
                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 9, marginBottom: 1 },
                    ]}
                  >
                    {capitalizeWords(shippingAddressString || "-")}
                  </Text>
                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 9 },
                    ]}
                  >
                    <Text
                      style={[
                        template21Styles.boldText,
                        { fontSize: 9, marginBottom: 2 },
                      ]}
                    >
                      Country:{" "}
                    </Text>
                    <Text>
                      {company?.Country ||
                        getShippingAddress(
                          shippingAddress,
                          getBillingAddress(party)
                        )
                          ?.split(",")[4]
                          ?.trim() ||
                        "-"}
                    </Text>
                  </Text>

                  <Text style={{ fontSize: 9, marginBottom: 2 }}>
                    <Text style={template21Styles.boldText}>Phone: </Text>
                    <Text>
                      {shippingAddress?.contactNumber
                        ? formatPhoneNumber(party?.contactNumber || "")
                        : party?.contactNumber
                        ? formatPhoneNumber(party?.contactNumber || "")
                        : "-"}
                    </Text>
                  </Text>

                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 9 },
                    ]}
                  >
                    <Text style={[template21Styles.boldText, { fontSize: 9 }]}>
                      GSTIN:{" "}
                    </Text>
                    <Text>{party?.gstin || "-"}</Text>
                  </Text>

                  <Text
                    style={[
                      template21Styles.addressText,
                      template21Styles.grayColor,
                      { fontSize: 9, marginBottom: 1 },
                    ]}
                  >
                    <Text style={[template21Styles.boldText, { fontSize: 9 }]}>
                      State:{" "}
                    </Text>
                    <Text>
                      {capitalizeWords(
                        shippingAddress?.state
                          ? `${shippingAddress.state} (${
                              getStateCode(shippingAddress.state) || "-"
                            })`
                          : party?.state
                          ? `${party.state} (${
                              getStateCode(party.state) || "-"
                            })`
                          : "-"
                      )}
                    </Text>
                  </Text>
                </View>
              </View>

              {/* Right Side - Invoice Details */}
              <View style={{ width: "20%", textAlign: "right" }}>
                {/* Invoice # */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                    Invoice #:
                  </Text>
                  <Text style={{ fontSize: 9 }}>
                    {transaction?.invoiceNumber?.toString() || "-"}
                  </Text>
                </View>
                {/* Invoice Date */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                    Invoice Date:
                  </Text>
                  <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                    {transaction?.date
                      ? new Date(transaction.date).toLocaleDateString("en-GB")
                      : "-"}
                  </Text>
                </View>
                {/* P.O. No. */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 9 }}>P.O. No.:</Text>
                  <Text style={{ fontSize: 9 }}>
                    {extendedTransaction?.poNumber || "-"}
                  </Text>
                </View>
                {/* P.O. Date */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text style={{ fontSize: 9 }}>P.O. Date:</Text>
                  <Text style={{ fontSize: 9 }}>
                    {extendedTransaction?.poDate
                      ? new Date(extendedTransaction.poDate).toLocaleDateString(
                          "en-GB"
                        )
                      : "-"}
                  </Text>
                </View>
                {/* E-Way No. */}
                {isGSTApplicable && (
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text style={{ fontSize: 9 }}>E-Way No.:</Text>
                    <Text style={{ fontSize: 9 }}>
                      {extendedTransaction?.ewayNumber || "-"}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* --- Items Table (Content-bound table border) --- */}
            <View style={template21Styles.table} wrap>
              {/* Table Header */}
              <View
                style={[
                  template21Styles.tableHeader,
                  { borderBottomWidth: 1, borderBottomColor: TABLE_HEADER_BG },
                ]}
                fixed
              >
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[0] },
                  ]}
                >
                  Sr.No
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[1], textAlign: "center" },
                  ]}
                >
                  Name of Product / Service
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[2] },
                  ]}
                >
                  HSN/SAC
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[3] },
                  ]}
                >
                  Qty
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[4] },
                  ]}
                >
                  Rate (Rs.)
                </Text>
                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[5] },
                  ]}
                >
                  Taxable Value (Rs.)
                </Text>

                {showIGST ? (
                  <>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[6] },
                      ]}
                    >
                      IGST%
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[7] },
                      ]}
                    >
                      IGST Amt (Rs.)
                    </Text>
                  </>
                ) : showCGSTSGST ? (
                  <>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[6] },
                      ]}
                    >
                      CGST%
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[7] },
                      ]}
                    >
                      CGST Amt (Rs.)
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[8] },
                      ]}
                    >
                      SGST%
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCellHeader,
                        { width: colWidths[9] },
                      ]}
                    >
                      SGST Amt (Rs.)
                    </Text>
                  </>
                ) : null}

                <Text
                  style={[
                    template21Styles.tableCellHeader,
                    { width: colWidths[totalColumnIndex], borderRightWidth: 0 },
                  ]}
                >
                  Total (Rs.)
                </Text>
              </View>

              {/* Table Rows */}
              {typedItems.map((item, index: number) => {
                const isLastItemInList = index === typedItems.length - 1;

                return (
                  <View
                    key={`${pageIndex}-${index}`}
                    style={[
                      template21Styles.tableRow,
                      // Apply thick bottom border only if it's the very last item row
                      isLastItemInList ? { borderBottomWidth: 1 } : {},
                    ]}
                    wrap={false}
                  >
                    <Text
                      style={[
                        template21Styles.tableCell,
                        template21Styles.tableCellCenter,
                        { width: colWidths[0], padding: 4 },
                      ]}
                    >
                      {index + 1}
                    </Text>

                    <View
                      style={[
                        template21Styles.tableCell,
                        {
                          width: colWidths[1],
                          padding: 3,
                          textAlign: "left",
                          alignItems: "flex-start",
                        },
                      ]}
                    >
                      <Text style={template21Styles.smallText}>
                        {item.name}
                      </Text>
                      {(item.details || []).map((detail, dIdx) => (
                        <Text
                          key={dIdx}
                          style={[
                            template21Styles.smallText,
                            { fontSize: 6, color: "#666", marginTop: 0.5 },
                          ]}
                        >
                          {detail}
                        </Text>
                      ))}
                    </View>

                    <Text
                      style={[
                        template21Styles.tableCell,
                        template21Styles.tableCellCenter,
                        { width: colWidths[2], padding: 4 },
                      ]}
                    >
                      {item.code || ""}
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCell,
                        template21Styles.tableCellCenter,
                        { width: colWidths[3], padding: 2 },
                      ]}
                    >
                      {formatQuantity(item.quantity || 0, item.unit)}
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCell,
                        { width: colWidths[4], padding: 4 },
                      ]}
                    >
                      {formatCurrency(item.pricePerUnit || 0)}
                    </Text>
                    <Text
                      style={[
                        template21Styles.tableCell,
                        { width: colWidths[5], padding: 4 },
                      ]}
                    >
                      {formatCurrency(item.taxableValue || 0)}
                    </Text>

                    {showIGST ? (
                      <>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            template21Styles.tableCellCenter,
                            { width: colWidths[6], padding: 4 },
                          ]}
                        >
                          {(item.gstRate || 0).toFixed(2)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            { width: colWidths[7], padding: 4 },
                          ]}
                        >
                          {formatCurrency(item.igst || 0)}
                        </Text>
                      </>
                    ) : showCGSTSGST ? (
                      <>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            template21Styles.tableCellCenter,
                            { width: colWidths[6], padding: 4 },
                          ]}
                        >
                          {((item.gstRate || 0) / 2).toFixed(2)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            { width: colWidths[7], padding: 4 },
                          ]}
                        >
                          {formatCurrency(item.cgst || 0)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            template21Styles.tableCellCenter,
                            { width: colWidths[8], padding: 4 },
                          ]}
                        >
                          {((item.gstRate || 0) / 2).toFixed(2)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.tableCell,
                            { width: colWidths[9], padding: 4 },
                          ]}
                        >
                          {formatCurrency(item.sgst || 0)}
                        </Text>
                      </>
                    ) : null}

                    <Text
                      style={[
                        template21Styles.tableCell,
                        {
                          width: colWidths[totalColumnIndex],
                          fontWeight: "bold",
                          borderRightWidth: 0,
                          padding: 4,
                        },
                      ]}
                    >
                      {formatCurrency(item.total || 0)}
                    </Text>
                  </View>
                );
              })}

              {/* Total Row (Last Row in list) */}
              {isLastPage && (
                <View
                  style={[
                    template21Styles.tableRow,
                    {
                      backgroundColor: LIGHT_GRAY,
                      borderBottomWidth: 1,
                    },
                  ]}
                  wrap={false}
                >
                  {/* Left part for Total Items / Qty */}
                  <Text
                    style={[
                      template21Styles.tableCell,
                      {
                        width:
                          calculateTotalLabelWidth() -
                          colWidths[4] -
                          colWidths[5],
                        fontWeight: "bold",
                        textAlign: "left",
                        paddingLeft: 3,
                        borderRightWidth: 0.5,
                      },
                    ]}
                  >
                    Total Items / Qty: {totalItems} / {totalQty}
                  </Text>
                  {/* Taxable Value Label/Amount */}
                  <Text
                    style={[
                      template21Styles.tableCell,
                      {
                        width: colWidths[4] + colWidths[5],
                        fontWeight: "bold",
                        textAlign: "right",
                        paddingRight: 5,
                        borderRightWidth: isGSTApplicable ? 0.5 : 0,
                      },
                    ]}
                  >
                    Taxable Total:
                  </Text>
                  <Text
                    style={[
                      template21Styles.tableCell,
                      {
                        width: colWidths[totalColumnIndex],
                        fontWeight: "bold",
                        borderRightWidth: 0,
                        padding: 4,
                      },
                    ]}
                  >
                    {formatCurrency(totalTaxable)}
                  </Text>
                </View>
              )}
            </View>
            <View
              fixed
              style={{
                height: 1,
                backgroundColor: "#d3d3d3",
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            />

            {/* --- Footer and Totals (Last page only) --- */}
            {isLastPage && (
              <View>
                {/* Taxable, Total GST, Grand Total Summary */}
                <View style={[template21Styles.grantTotalAmount]}>
                  <Text
                    style={[
                      template21Styles.grantTotalAmount,
                      { fontWeight: "normal", marginBottom: 2 },
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>Taxable Amount: </Text>
                    {formatCurrency(totalTaxable)}
                  </Text>
                  <Text
                    style={[
                      template21Styles.grantTotalAmount,
                      { fontWeight: "normal", marginBottom: 2 },
                    ]}
                  >
                    <Text style={{ fontWeight: "bold" }}>Total GST: </Text>
                    {formatCurrency(
                      isGSTApplicable
                        ? showIGST
                          ? totalIGST
                          : totalCGST + totalSGST
                        : 0
                    )}
                  </Text>
                  <Text style={template21Styles.boldText}>
                    Grand Total: Rs. {formatCurrency(totalAmount)}
                  </Text>
                </View>

                {/* Amount in Words */}
                <View style={template21Styles.amountInWords}>
                  <Text>
                    <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                      Total Amount (in words):{" "}
                    </Text>
                    <Text>{amountInWords}</Text>
                  </Text>
                </View>

                {/* --- Tax Summary Table (HSN Wise) --- */}
                {isGSTApplicable && taxSummaryArray.length > 0 && (
                  <View style={template21Styles.taxSummaryTable}>
                    {/* Tax Header */}
                    <View style={template21Styles.taxHeader}>
                      <Text
                        style={[
                          template21Styles.taxCell,
                          {
                            width: 100,
                            borderRightWidth: 0.5,
                            borderRightColor: "white",
                          },
                        ]}
                      >
                        HSN/SAC
                      </Text>
                      <Text
                        style={[
                          template21Styles.taxCell,
                          {
                            width: 150,
                            borderRightWidth: 0.5,
                            borderRightColor: "white",
                          },
                        ]}
                      >
                        Taxable Value (Rs.)
                      </Text>
                      <Text
                        style={[
                          template21Styles.taxCell,
                          {
                            width: 50,
                            borderRightWidth: 0.5,
                            borderRightColor: "white",
                          },
                        ]}
                      >
                        %
                      </Text>
                      {showIGST ? (
                        <>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 120,
                                borderRightWidth: 0.5,
                                borderRightColor: "white",
                              },
                            ]}
                          >
                            IGST (Rs.)
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 135, borderRightWidth: 0 },
                            ]}
                          >
                            Total (Rs.)
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 90,
                                borderRightWidth: 0.5,
                                borderRightColor: "white",
                              },
                            ]}
                          >
                            CGST (Rs.)
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 90,
                                borderRightWidth: 0.5,
                                borderRightColor: "white",
                              },
                            ]}
                          >
                            SGST (Rs.)
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 75, borderRightWidth: 0 },
                            ]}
                          >
                            Total (Rs.)
                          </Text>
                        </>
                      )}
                    </View>

                    {/* Tax Rows */}
                    {taxSummaryArray.map((summary, index) => (
                      <View
                        key={index}
                        style={[
                          template21Styles.taxRow,
                          index === taxSummaryArray.length - 1
                            ? { borderBottomWidth: 0 }
                            : {},
                        ]}
                      >
                        <Text
                          style={[
                            template21Styles.taxCell,
                            { width: 100, textAlign: "center" },
                          ]}
                        >
                          {summary.hsn}
                        </Text>
                        <Text
                          style={[template21Styles.taxCell, { width: 150 }]}
                        >
                          {formatCurrency(summary.taxableValue)}
                        </Text>
                        <Text
                          style={[
                            template21Styles.taxCell,
                            { width: 50, textAlign: "center" },
                          ]}
                        >
                          {summary.rate.toFixed(2)}
                        </Text>
                        {showIGST ? (
                          <>
                            <Text
                              style={[template21Styles.taxCell, { width: 120 }]}
                            >
                              {formatCurrency(summary.igst)}
                            </Text>
                            <Text
                              style={[
                                template21Styles.taxCell,
                                { width: 135, borderRightWidth: 0 },
                              ]}
                            >
                              {formatCurrency(summary.total)}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text
                              style={[template21Styles.taxCell, { width: 90 }]}
                            >
                              {formatCurrency(summary.cgst)}
                            </Text>
                            <Text
                              style={[template21Styles.taxCell, { width: 90 }]}
                            >
                              {formatCurrency(summary.sgst)}
                            </Text>
                            <Text
                              style={[
                                template21Styles.taxCell,
                                { width: 75, borderRightWidth: 0 },
                              ]}
                            >
                              {formatCurrency(summary.total)}
                            </Text>
                          </>
                        )}
                      </View>
                    ))}

                    {/* Tax Total Row */}
                    <View
                      style={[
                        template21Styles.taxRow,
                        { backgroundColor: LIGHT_GRAY, borderBottomWidth: 0 },
                      ]}
                    >
                      <Text
                        style={[
                          template21Styles.taxCell,
                          {
                            width: 100,
                            fontWeight: "bold",
                            textAlign: "center",
                          },
                        ]}
                      >
                        Total Tax
                      </Text>
                      <Text
                        style={[
                          template21Styles.taxCell,
                          { width: 150, fontWeight: "bold" },
                        ]}
                      >
                        {formatCurrency(totalTaxable)}
                      </Text>
                      <Text style={[template21Styles.taxCell, { width: 50 }]}>
                        {" "}
                      </Text>
                      {showIGST ? (
                        <>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 120, fontWeight: "bold" },
                            ]}
                          >
                            {formatCurrency(totalIGST)}
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 135,
                                fontWeight: "bold",
                                borderRightWidth: 0,
                              },
                            ]}
                          >
                            {formatCurrency(totalIGST)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 90, fontWeight: "bold" },
                            ]}
                          >
                            {formatCurrency(totalCGST)}
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              { width: 90, fontWeight: "bold" },
                            ]}
                          >
                            {formatCurrency(totalSGST)}
                          </Text>
                          <Text
                            style={[
                              template21Styles.taxCell,
                              {
                                width: 75,
                                fontWeight: "bold",
                                borderRightWidth: 0,
                              },
                            ]}
                          >
                            {formatCurrency(totalCGST + totalSGST)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}

                {/* --- Footer Section (QR, Bank, Signature) --- */}
                <View>
                  <View style={template21Styles.qrBankSection} wrap={false}>
                    {/* QR Code Block */}

                    {/* Bank Details Block - UPDATED LOGIC HERE */}
                    {!shouldHideBankDetails && (
                      <View style={template21Styles.bankBlock}>
                        <Text style={template21Styles.sectionTitle}>
                          Bank Details:
                        </Text>
                          <View style={{ marginTop: 2 }}>
                            {/* Bank Name */}
                            {bankData?.bankName && (
                              <View style={template21Styles.bankRow}>
                                <Text style={template21Styles.bankLabel}>
                                  Name:
                                </Text>
                                <Text style={template21Styles.smallText}>
                                  {capitalizeWords(bankData.bankName)}
                                </Text>
                              </View>
                            )}

                            {/* Account Number */}
                            {(bankData as any)?.accountNo && (
                              <View style={template21Styles.bankRow}>
                                <Text style={template21Styles.bankLabel}>
                                  Acc. No:
                                </Text>
                                <Text style={template21Styles.smallText}>
                                  {(bankData as any).accountNo}
                                </Text>
                              </View>
                            )}

                            {/* IFSC Code */}
                            {bankData?.ifscCode && (
                              <View style={template21Styles.bankRow}>
                                <Text style={template21Styles.bankLabel}>
                                  IFSC:
                                </Text>
                                <Text style={template21Styles.smallText}>
                                  {bankData.ifscCode}
                                </Text>
                              </View>
                            )}

                            {/* Branch Address */}
                            {bankData?.branchAddress && (
                              <View style={template21Styles.bankRow}>
                                <Text style={template21Styles.bankLabel}>
                                  Branch:
                                </Text>
                                <Text style={template21Styles.smallText}>
                                  {bankData.branchAddress}
                                </Text>
                              </View>
                            )}

                            {/* UPI ID */}
                            {(bankData as any)?.upiDetails?.upiId && (
                              <View style={template21Styles.bankRow}>
                                <Text style={template21Styles.bankLabel}>
                                  UPI ID:
                                </Text>
                                <Text style={template21Styles.smallText}>
                                  {(bankData as any).upiDetails.upiId}
                                </Text>
                              </View>
                            )}

                            {/* UPI Name */}
                            {(bankData as any)?.upiDetails?.upiName && (
                              <View style={template21Styles.bankRow}>
                                <Text style={template21Styles.bankLabel}>
                                  UPI Name:
                                </Text>
                                <Text style={template21Styles.smallText}>
                                  {capitalizeWords(
                                    (bankData as any).upiDetails.upiName
                                  )}
                                </Text>
                              </View>
                            )}

                            {/* UPI Mobile */}
                            {(bankData as any)?.upiDetails?.upiMobile && (
                              <View style={template21Styles.bankRow}>
                                <Text style={template21Styles.bankLabel}>
                                  UPI Mobile:
                                </Text>
                                <Text style={template21Styles.smallText}>
                                  {(bankData as any).upiDetails.upiMobile}
                                </Text>
                              </View>
                            )}
                          </View>

                      </View>
                    )}

                    {!shouldHideBankDetails && (
                      <View style={template21Styles.qrBlock}>
                        {(bankData as any)?.qrCode ? (
                          <View
                            style={{
                              alignItems: "center",
                              justifyContent: "center",
                              // padding: 5,
                              marginTop: 4,
                              // marginLeft: 10,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 9,
                                fontWeight: "bold",
                                // marginBottom: 3,
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

                    {/* Signature Block - BORDER REMOVED */}
                    <View
                      style={[
                        template21Styles.signatureBlock,
                        {
                          borderLeftWidth: 0,
                          borderLeftColor: "transparent",
                          paddingLeft: 5,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          template21Styles.sectionTitle,
                          { textAlign: "center", fontSize: 7 },
                        ]}
                      >
                        For {companyName}
                      </Text>

                      <View
                        style={{
                          height: 40,
                          width: "100%",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {/* Signature image placeholder */}
                      </View>

                      <View
                        style={{
                          borderTopWidth: 1,
                          borderTopColor: BORDER_COLOR,
                          width: "100%",
                          paddingTop: 2,
                        }}
                      >
                        <Text style={{ fontSize: 6, textAlign: "center" }}>
                          Authorised Signatory
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Terms and Conditions Section (HTML Rendering) */}
                  {transaction?.notes ? (
                    <View style={template21Styles.termsSection} wrap={false}>
                      <Text
                        style={[
                          template21Styles.termLine,
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
                </View>
              </View>
            )}
            {/* Page Number */}
            <Text
              style={{
                position: "absolute",
                bottom: 5,
                left: 0,
                right: 20,
                textAlign: "right",
                fontSize: 7,
                color: "#666",
              }}
              render={({ pageNumber, totalPages }) =>
                `${pageNumber} / ${totalPages} Page`
              }
              fixed
            />
          </Page>
        );
      })}
    </Document>
  );
};

// --- PDF Generation Function (Export) ---

export const generatePdfForTemplate21 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <Template21PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
    />
  );

  return await pdfDoc.toBlob();
};

export default Template21PDF;
