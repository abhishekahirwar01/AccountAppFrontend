// src/lib/pdf-template20.tsx
import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
  Item,
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
import { parseNotesHtml, capitalizeWords } from "./utils";
import { parseHtmlToElements, renderParsedElements } from "./HtmlNoteRenderer";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "./pdf-utils";
// --- Constants and Styles Definition (template20.tsx) ---

// --- Internal Types Definitions for Calculated Data ---

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

// --- Constants and Styles Definition ---

const PRIMARY_BLUE = "#0070c0";
const LIGHT_GRAY = "#FFFFFF";
const DARK_TEXT = "#333333";
const BORDER_COLOR = "#BABABA";

const template20Styles = StyleSheet.create({
  page: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 30,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: DARK_TEXT,
  },

  // --- Header & Company Details ---
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 5,
    borderBottomWidth: 1.5,
    borderBottomColor: PRIMARY_BLUE,
    paddingBottom: 5,
  },
  logoAndNameBlock: {
    flexDirection: "row",
    alignItems: "center",
    width: "80%",
  },
  logoContainer: {
    // backgroundColor: PRIMARY_BLUE,
    // borderRadius: 5,
    // padding: 8,
    // marginRight: 10,
    // height: 75,
    // width: 70,
    // justifyContent: "center",
    // alignItems: "center",
    marginRight: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "extrabold",
    color: PRIMARY_BLUE,
    overflow: "hidden",
    textOverflow: "ellipsis",
    // paddingLeft: 8,
    
  },
  companyDetailsBlock: {
    // paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: LIGHT_GRAY,
  },
  gstin: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 9.5,
    lineHeight: 1.2,
    color: DARK_TEXT,
  },

  // --- Invoice Info & Title ---
  invoiceInfoBlock: {
    width: "30%",
    textAlign: "right",
  },
  taxInvoiceTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: PRIMARY_BLUE,
    marginBottom: 5,
    textDecoration: "underline",
  },
  invoiceDateRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2,
    marginRight: 1,
    alignItems: "center",
  },
  label: {
    fontSize: 9,
    width: 80,
    textAlign: "left",
    fontWeight: "bold",
    marginLeft: 35,
  },
  value: {
    fontSize: 9,
    width: 100,
    textAlign: "right",
  },

  // --- Billed To / Shipped To ---
  partySection: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 1,
    borderTopWidth: 1,
    borderTopColor: LIGHT_GRAY,
    borderBottomWidth: 1,
    borderBottomColor: LIGHT_GRAY,
    paddingVertical: 4,
  },
  combinedPartyBlock: {
    width: "60%",
    paddingRight: 5,
  },
  transactionDetailsBlock: {
    width: "38%",
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: LIGHT_GRAY,
  },
  partyHeader: {
    fontSize: 9,
    fontWeight: "bold",
    color: PRIMARY_BLUE,
    // marginBottom: 5,
    paddingBottom: 2,
  },
  partyName: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 3,
  },

  // --- Items Table ---
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: BORDER_COLOR,
    marginBottom: 5,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PRIMARY_BLUE,
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 7,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomColor: BORDER_COLOR,
    borderBottomWidth: 0.5,
    alignItems: "stretch",
  },
  tableCellHeader: {
    borderRightColor: "white",
    borderRightWidth: 1,
    padding: 4,
    textAlign: "center",
  },
  tableCell: {
    borderRightColor: BORDER_COLOR,
    borderRightWidth: 0.5,
    padding: 4,
    fontSize: 7,
    textAlign: "right",
  },
  tableCellLeft: {
    textAlign: "left",
    paddingLeft: 6,
  },
  tableCellCenter: {
    textAlign: "center",
  },

  // --- Totals and Amount in Words ---
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 8,
    paddingVertical: 1,
    fontSize: 9,
  },
  totalAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: 8,
    paddingVertical: 1,
    backgroundColor: LIGHT_GRAY,
    fontSize: 9,
  },

  // --- Footer / Bank / Terms ---
  bankTermsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 1,
  },
  bankHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: PRIMARY_BLUE,
    marginBottom: 5,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 2,
    fontSize: 8,
  },
  bankLabel: {
    width: 65,
    fontWeight: "bold",
    marginRight: 5,
  },
  smallText: {
    fontSize: 9,
  },
  boldText: {
    fontWeight: "bold",
  },
  ammountInWords: {
    fontSize: 8,
    fontWeight: "normal",
    marginTop: 1,
  },
});

// --- Interface Definitions ---
interface Template20PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
}

// --- Main PDF Component (Modified to use auto-pagination) ---

const Template20PDF: React.FC<Template20PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
}) => {
  // Use 'as unknown as Template8Data' to satisfy TS compiler
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
    showNoTax,
  } = preparedData;

  const typedItems: ItemWithCalculations[] = (preparedData.itemsWithGST ||
    allItems) as ItemWithCalculations[];

     const shouldHideBankDetails = 
  transaction.type === "proforma" 
  ;
  const logoSrc = company?.logo
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`
    : null;

  // --- MODIFICATION: Use entire list of items for rendering ---
  const itemsToRender = typedItems;
  // --- END MODIFICATION ---

  // --- Column Width Logic ---
  const IGST_COL_WIDTHS = [30, 150, 50, 60, 40, 80, 50, 60, 70];
  const NON_GST_COL_WIDTHS = [30, 190, 70, 70, 50, 90, 70];
  const CGST_SGST_COL_WIDTHS = [30, 100, 50, 50, 40, 60, 40, 50, 40, 50, 50];

  const getColWidths = () => {
    if (!isGSTApplicable || showNoTax) {
      return NON_GST_COL_WIDTHS;
    } else if (showIGST) {
      return IGST_COL_WIDTHS;
    } else {
      return CGST_SGST_COL_WIDTHS;
    }
  };

  const colWidths = getColWidths();
  const getTotalColumnIndex = () => {
    if (!isGSTApplicable || showNoTax) return 6;
    if (showIGST) return 8;
    return 10;
  };
  const totalColumnIndex = getTotalColumnIndex();

  const getAddressLines = (address: string | undefined) =>
    address ? address.split("\n").filter((line) => line.trim() !== "") : [];

  const bankData: Bank | null | undefined = bank;

  // Updated check to match Template 8's comprehensive data check
  const isBankDetailAvailable =
    bankData?.bankName ||
    bankData?.ifscCode ||
    bankData?.branchAddress ||
    (bankData as any)?.accountNo ||
    (bankData as any)?.upiDetails?.upiId;

  const amountInWords = numberToWords(Math.round(totalAmount));

  const extendedTransaction = transaction as Transaction & {
    poNumber?: string;
    poDate?: string;
    ewayNumber?: string;
  };

  // Buyer Phone Logic
  const partyAsAny = party as any;
  const buyerPhone =
    (partyAsAny?.mobileNumber && typeof partyAsAny.mobileNumber === "string"
      ? formatPhoneNumber(partyAsAny.mobileNumber.trim())
      : "") ||
    (partyAsAny?.phone && typeof partyAsAny.phone === "string"
      ? formatPhoneNumber(partyAsAny.phone.trim())
      : "") ||
    (partyAsAny?.contactNumber && typeof partyAsAny.contactNumber === "string"
      ? formatPhoneNumber(partyAsAny.contactNumber.trim())
      : "") ||
    "-";

  // Consignee Phone Logic
  const shippingAsAny = shippingAddress as any;
  const consigneePhone =
    (shippingAsAny?.phone && typeof shippingAsAny.phone === "string"
      ? formatPhoneNumber(shippingAsAny.phone.trim())
      : "") ||
    (shippingAsAny?.mobileNumber &&
    typeof shippingAsAny.mobileNumber === "string"
      ? formatPhoneNumber(shippingAsAny.mobileNumber.trim())
      : "") ||
    (shippingAsAny?.contactNumber &&
    typeof shippingAsAny.contactNumber === "string"
      ? formatPhoneNumber(shippingAsAny.contactNumber.trim())
      : "") ||
    buyerPhone;

  // Terms and Conditions Logic
  const { title } = parseNotesHtml(transaction?.notes || "");
  const termsData = {
    title: title || "Terms and Conditions",
  };

  if (!transaction) {
    throw new Error("Transaction is required");
  }

  // --- Document Rendering ---
  return (
    <Document>
      {/* MODIFICATION: Render a single Page with `wrap` enabled */}
      <Page size="A4" style={template20Styles.page} wrap>
        {/* Header Section (Fixed) */}
        <View style={template20Styles.headerContainer} fixed>
          <View style={template20Styles.logoAndNameBlock}>
            {logoSrc && (
              <View style={template20Styles.logoContainer}>
                <Image
                  src={logoSrc}
                  style={{ width: 70, height: 70, objectFit: "contain" }}
                />
              </View>
            )}

            <View style={{ width: "auto" }}>
              <Text style={template20Styles.companyName}>
                {company?.businessName || company?.companyName || ""}
              </Text>

              <View style={template20Styles.companyDetailsBlock}>
                {company?.gstin && (
                  <Text style={template20Styles.gstin}>
                    GSTIN:{" "}
                    <Text style={{ fontWeight: "normal" }}>
                      {company.gstin}
                    </Text>
                  </Text>
                )}
                <Text style={template20Styles.addressText}>
                  {company?.address || ""}
                </Text>
                <Text style={template20Styles.addressText}>
                  {company?.addressState},{company?.Country}{" "}
                  {company?.Pincode ? `, ${company.Pincode}` : ""}
                </Text>
                <Text style={template20Styles.addressText}>
                  <Text style={template20Styles.boldText}>Phone:</Text>{" "}
                  {company?.mobileNumber
                    ? formatPhoneNumber(company.mobileNumber)
                    : company?.Telephone
                    ? formatPhoneNumber(company.Telephone)
                    : "-"}
                </Text>
              </View>
            </View>
          </View>

          {/* Invoice Title & Number/Date */}
          <View style={template20Styles.invoiceInfoBlock}>
            <Text style={template20Styles.taxInvoiceTitle}>
              {transaction.type === "proforma"
                ? "PROFORMA INVOICE"
                : isGSTApplicable
                ? "TAX INVOICE"
                : "INVOICE"}
            </Text>
            <View style={template20Styles.invoiceDateRow}>
              <Text style={template20Styles.label}>Invoice #:</Text>
              <Text style={[template20Styles.value, { fontWeight: "bold" }]}>
                {transaction?.invoiceNumber?.toString() || ""}
              </Text>
            </View>
            <View style={template20Styles.invoiceDateRow}>
              <Text style={template20Styles.label}>Invoice Date:</Text>
              <Text style={[template20Styles.value, { fontWeight: "bold" }]}>
                {transaction?.date
                  ? new Date(transaction.date).toLocaleDateString("en-GB")
                  : ""}
              </Text>
            </View>
          </View>
        </View>

        {/* Address Block (Fixed) */}
        <View style={template20Styles.partySection} fixed>
          {/* Left Block - Buyer and Consignee Combined (60% width) */}
          <View style={template20Styles.combinedPartyBlock}>
            {/* Buyer Details (TOP HALF) */}
            <View style={{ marginBottom: 4 }}>
              <Text style={template20Styles.partyHeader}>
                Details of Buyer | Billed to :
              </Text>

              {/* Name */}
              <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>Name:</Text>{" "}
                {capitalizeWords(party?.name || "")}
              </Text>

              {/* Address */}
              <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>Address:</Text>{" "}
                {capitalizeWords(
                  getAddressLines(getBillingAddress(party)).join(", ")
                )}
              </Text>

              {/* Buyer Phone Number */}

              <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>Phone:</Text>{" "}
                {formatPhoneNumber(buyerPhone)}
              </Text>

              <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>GSTIN:</Text>{" "}
                {party?.gstin}
              </Text>

              <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>PAN:</Text> {party?.pan}
              </Text>
              <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>Place of Supply:</Text>{" "}
                {shippingAddress?.state
                  ? `${shippingAddress.state} (${
                      getStateCode(shippingAddress.state) || "-"
                    })`
                  : party?.state
                  ? `${party.state} (${getStateCode(party.state) || "-"})`
                  : "-"}
              </Text>

              {/* {party?.state && (
                <Text style={template20Styles.addressText}>
                  <Text style={template20Styles.boldText}>State:</Text>{" "}
                  {capitalizeWords(party.state)}
                </Text>
              )} */}
              {/* {company?.Country && (
                <Text style={template20Styles.addressText}>
                  <Text style={template20Styles.boldText}>Country:</Text>{" "}
                  {capitalizeWords(company.Country)}
                </Text>
              )} */}
            </View>

            {/* Consignee Details (BOTTOM HALF) */}
            <View
              style={{
                marginTop: 5,
                // borderTopWidth: 0.5,
                // borderTopColor: BORDER_COLOR,
                paddingTop: 1,
              }}
            >
              <Text style={template20Styles.partyHeader}>
                Details of Consignee | Shipped to :
              </Text>

              {/* Name */}
              <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>Name:</Text>{" "}
                {capitalizeWords(shippingAddress?.label || party?.name || "")}
              </Text>

              {/* Address */}
              <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>Address:</Text>{" "}
                {capitalizeWords(
                  getAddressLines(
                    getShippingAddress(
                      shippingAddress,
                      getBillingAddress(party)
                    )
                  ).join(", ")
                )}
              </Text>
              {company?.Country && (
                <Text style={template20Styles.addressText}>
                  <Text style={template20Styles.boldText}>Country:</Text>{" "}
                  {capitalizeWords(company.Country)}
                </Text>
              )}

              {/* Consignee Phone Number */}
              {consigneePhone !== "-" && (
                <Text style={template20Styles.addressText}>
                  <Text style={template20Styles.boldText}>Phone:</Text>{" "}
                  {formatPhoneNumber(consigneePhone)}
                </Text>
              )}
              <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>GSTIN:</Text>{" "}
                {party?.gstin}
              </Text>

              {shippingAddress?.state && (
                <Text style={template20Styles.addressText}>
                  <Text style={template20Styles.boldText}>State:</Text>{" "}
                  {capitalizeWords(
                    shippingAddress?.state
                      ? `${shippingAddress.state} (${
                          getStateCode(shippingAddress.state) || "-"
                        })`
                      : party?.state
                      ? `${party.state} (${getStateCode(party.state) || "-"})`
                      : "-"
                  )}
                </Text>
              )}
            </View>
          </View>

          {/* Right Block - Transaction Details (38% width) */}
          <View style={template20Styles.transactionDetailsBlock}>
            <View
              style={{
                marginTop: 0,
                marginLeft: 0,
                paddingTop: 5,
              }}
            >
              <Text style={[template20Styles.addressText, { marginBottom: 3 }]}>
                <Text style={template20Styles.boldText}>P.O. No.:</Text>{" "}
                {extendedTransaction?.poNumber || "-"}
              </Text>

              <Text style={[template20Styles.addressText, { marginBottom: 3 }]}>
                <Text style={template20Styles.boldText}>P.O. Date:</Text>{" "}
                {extendedTransaction?.poDate
                  ? new Date(extendedTransaction.poDate).toLocaleDateString(
                      "en-GB"
                    )
                  : "-"}
              </Text>

              <Text style={[template20Styles.addressText, { marginBottom: 3 }]}>
                <Text style={template20Styles.boldText}>E-Way No.:</Text>{" "}
                {extendedTransaction?.ewayNumber || "-"}
              </Text>

              {/* <Text style={template20Styles.addressText}>
                <Text style={template20Styles.boldText}>Place of Supply:</Text>{" "}
                {shippingAddress?.state
                  ? `${shippingAddress.state} (${
                      getStateCode(shippingAddress.state) || "-"
                    })`
                  : party?.state
                  ? `${party.state} (${getStateCode(party.state) || "-"})`
                  : "-"}
              </Text> */}
            </View>
          </View>
        </View>

        {/* --- Items Table (The main content area) --- */}
        <View style={template20Styles.table}>
          {/* ... [Table Header (Fixed)] ... */}
          <View style={template20Styles.tableHeader} fixed>
            <Text
              style={[
                template20Styles.tableCellHeader,
                { width: colWidths[0] },
              ]}
            >
              Sr. No.
            </Text>
            <Text
              style={[
                template20Styles.tableCellHeader,
                template20Styles.tableCellLeft,
                { width: colWidths[1] },
              ]}
            >
              Name of Product / Service
            </Text>
            <Text
              style={[
                template20Styles.tableCellHeader,
                template20Styles.tableCellCenter,
                { width: colWidths[2] },
              ]}
            >
              HSN / SAC
            </Text>
            <Text
              style={[
                template20Styles.tableCellHeader,
                template20Styles.tableCellCenter,
                { width: colWidths[3] },
              ]}
            >
              Rate (Rs.)
            </Text>
            <Text
              style={[
                template20Styles.tableCellHeader,
                template20Styles.tableCellCenter,
                { width: colWidths[4] },
              ]}
            >
              Qty
            </Text>
            <Text
              style={[
                template20Styles.tableCellHeader,
                template20Styles.tableCellCenter,
                { width: colWidths[5] },
              ]}
            >
              Taxable Value (Rs.)
            </Text>

            {showIGST ? (
              <>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
                    { width: colWidths[6] },
                  ]}
                >
                  IGST %
                </Text>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
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
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
                    { width: colWidths[6] },
                  ]}
                >
                  CGST %
                </Text>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
                    { width: colWidths[7] },
                  ]}
                >
                  CGST Amt (Rs.)
                </Text>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
                    { width: colWidths[8] },
                  ]}
                >
                  SGST %
                </Text>
                <Text
                  style={[
                    template20Styles.tableCellHeader,
                    template20Styles.tableCellCenter,
                    { width: colWidths[9] },
                  ]}
                >
                  SGST Amt (Rs.)
                </Text>
              </>
            ) : null}

            <Text
              style={[
                template20Styles.tableCellHeader,
                { width: colWidths[totalColumnIndex], borderRightWidth: 0 },
              ]}
            >
              Total (Rs.)
            </Text>
          </View>

          {/* --- Item Rows (Will break automatically across pages) --- */}
          {itemsToRender.map((item: ItemWithCalculations, index: number) => (
            <View
              key={`${index}`}
              style={template20Styles.tableRow}
              wrap={false} // Prevents a single row from being split across pages
            >
              <Text
                style={[
                  template20Styles.tableCell,
                  template20Styles.tableCellCenter,
                  { width: colWidths[0] },
                ]}
              >
                {index + 1}
              </Text>
              <Text
                style={[
                  template20Styles.tableCell,
                  template20Styles.tableCellLeft,
                  { width: colWidths[1] },
                ]}
              >
                {item.name}
              </Text>
              <Text
                style={[
                  template20Styles.tableCell,
                  template20Styles.tableCellCenter,
                  { width: colWidths[2] },
                ]}
              >
                {item.code || "-"}
              </Text>
              <Text
                style={[
                  template20Styles.tableCell,
                  template20Styles.tableCellCenter,
                  { width: colWidths[3] },
                ]}
              >
                {formatCurrency(item.pricePerUnit || 0)}
              </Text>
              <Text
                style={[
                  template20Styles.tableCell,
                  template20Styles.tableCellCenter,
                  { width: colWidths[4] },
                ]}
              >
                {formatQuantity(item.quantity || 0, item.unit)}
              </Text>
              <Text
                style={[
                  template20Styles.tableCell,
                  template20Styles.tableCellCenter,
                  { width: colWidths[5] },
                ]}
              >
                {formatCurrency(item.taxableValue)}
              </Text>

              {showIGST ? (
                <>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellCenter,
                      { width: colWidths[6] },
                    ]}
                  >
                    {item.gstRate.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellCenter,
                      { width: colWidths[7] },
                    ]}
                  >
                    {formatCurrency(item.igst)}
                  </Text>
                </>
              ) : showCGSTSGST ? (
                <>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellCenter,
                      { width: colWidths[6] },
                    ]}
                  >
                    {(item.gstRate / 2).toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellCenter,
                      { width: colWidths[7] },
                    ]}
                  >
                    {formatCurrency(item.cgst)}
                  </Text>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellCenter,
                      { width: colWidths[8] },
                    ]}
                  >
                    {(item.gstRate / 2).toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      template20Styles.tableCell,
                      template20Styles.tableCellCenter,
                      { width: colWidths[9] },
                    ]}
                  >
                    {formatCurrency(item.sgst)}
                  </Text>
                </>
              ) : null}

              <Text
                style={[
                  template20Styles.tableCell,
                  template20Styles.tableCellCenter,
                  {
                    width: colWidths[totalColumnIndex],
                    borderRightWidth: 0,
                    fontWeight: "bold",
                  },
                ]}
              >
                {formatCurrency(item.total)}
              </Text>
            </View>
          ))}
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

        {/* --- Footer and Totals (Wrap prevents breaking mid-section) --- */}
        <View wrap={false}>
          {/* Totals and Amount in Words Wrapper */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            {/* Left Section: Total Items/Qty & Total Amount in Words */}
            <View style={{ width: "60%" }}>
              {/* Total Items/Qty */}
              <View
                style={{
                  marginTop: 1,
                  marginBottom: 2,
                  paddingVertical: 6,
                  width: "100%",
                }}
              >
                <Text style={{ fontSize: 8 }}>
                  Total Items / Qty :{" "}
                  <Text style={template20Styles.boldText}>
                    {totalItems} / {totalQty}
                  </Text>
                </Text>
              </View>

              <View style={{ height: 10 }} />

              {/* Total Amount (in words) */}
              <View>
                <Text
                  style={{
                    marginBottom: 4,
                    fontSize: 9,
                    fontWeight: "bold",
                  }}
                >
                  Total amount (in words):
                </Text>
                <Text style={template20Styles.ammountInWords}>
                  {amountInWords}
                </Text>
              </View>
            </View>

            {/* Right Section: Tax Breakdown and Total Amount */}
            <View style={{ width: "38%" }}>
              {/* Taxable Amount */}
              <View style={template20Styles.totalsRow}>
                <Text style={{ fontWeight: "bold" }}>Taxable Amount</Text>
                <Text>{`Rs.${formatCurrency(totalTaxable)}`}</Text>
              </View>

              {isGSTApplicable && (
                <>
                  {showIGST && (
                    <View style={template20Styles.totalsRow}>
                      <Text style={{ fontWeight: "bold" }}>IGST</Text>
                      <Text>{`Rs.${formatCurrency(totalIGST)}`}</Text>
                    </View>
                  )}
                  {showCGSTSGST && (
                    <>
                      <View style={template20Styles.totalsRow}>
                        <Text style={{ fontWeight: "bold" }}>CGST</Text>
                        <Text>{`Rs.${formatCurrency(totalCGST)}`}</Text>
                      </View>
                      <View style={template20Styles.totalsRow}>
                        <Text style={{ fontWeight: "bold" }}>SGST</Text>
                        <Text>{`Rs.${formatCurrency(totalSGST)}`}</Text>
                      </View>
                    </>
                  )}
                </>
              )}

              {/* Total Amount */}
              <View style={template20Styles.totalAmountRow}>
                <Text style={{ fontWeight: "bold" }}>Total Amount</Text>
                <Text>{`Rs.${formatCurrency(totalAmount)}`}</Text>
              </View>
            </View>
          </View>

          {/* Bank and Signature Section */}
          <View
            style={[
              template20Styles.bankTermsSection,
              {
                borderTopWidth: 1,
                borderTopColor: PRIMARY_BLUE,
                paddingTop: 5,
              },
            ]}
            wrap={false}
          >
            {/* Bank Details Section (Middle Column) */}
            {!shouldHideBankDetails && (
              <>
            <View style={{ width: "60%", padding: 5 }}>
              <Text style={[template20Styles.bankHeader, { marginBottom: 3 }]}>
                Bank Details:
              </Text>
              {bankData && isBankDetailAvailable ? (
                <View style={{ marginTop: 2 }}>
                  {/* Bank Name */}
                  {bankData.bankName && (
                    <View
                      style={[template20Styles.bankRow, { marginBottom: 1 }]}
                    >
                      <Text style={template20Styles.bankLabel}>Name:</Text>
                      <Text style={template20Styles.smallText}>
                        {capitalizeWords(bankData.bankName)}
                      </Text>
                    </View>
                  )}

                  {/* IFSC Code */}
                  {bankData.ifscCode && (
                    <View
                      style={[template20Styles.bankRow, { marginBottom: 1 }]}
                    >
                      <Text style={template20Styles.bankLabel}>IFSC:</Text>
                      <Text style={template20Styles.smallText}>
                        {capitalizeWords(bankData.ifscCode)}
                      </Text>
                    </View>
                  )}

                  {/* Account Number */}
                  {(bankData as any)?.accountNo && (
                    <View
                      style={[template20Styles.bankRow, { marginBottom: 1 }]}
                    >
                      <Text style={template20Styles.bankLabel}>Acc. No:</Text>
                      <Text style={template20Styles.smallText}>
                        {(bankData as any).accountNo}
                      </Text>
                    </View>
                  )}

                  {/* Branch Address */}
                  {bankData.branchAddress && (
                    <View
                      style={[template20Styles.bankRow, { marginBottom: 1 }]}
                    >
                      <Text style={template20Styles.bankLabel}>Branch:</Text>
                      <Text style={[template20Styles.smallText, { flex: 1 }]}>
                        {capitalizeWords(bankData.branchAddress)}
                      </Text>
                    </View>
                  )}

                  {/* UPI ID */}
                  {(bankData as any)?.upiDetails?.upiId && (
                    <View
                      style={[template20Styles.bankRow, { marginBottom: 1 }]}
                    >
                      <Text style={template20Styles.bankLabel}>UPI ID:</Text>
                      <Text style={template20Styles.smallText}>
                        {(bankData as any).upiDetails.upiId}
                      </Text>
                    </View>
                  )}

                  {/* UPI Name */}
                  {(bankData as any)?.upiDetails?.upiName && (
                    <View
                      style={[template20Styles.bankRow, { marginBottom: 1 }]}
                    >
                      <Text style={template20Styles.bankLabel}>UPI Name:</Text>
                      <Text style={template20Styles.smallText}>
                        {capitalizeWords((bankData as any).upiDetails.upiName)}
                      </Text>
                    </View>
                  )}

                  {/* UPI Mobile */}
                  {(bankData as any)?.upiDetails?.upiMobile && (
                    <View
                      style={[template20Styles.bankRow, { marginBottom: 1 }]}
                    >
                      <Text style={template20Styles.bankLabel}>
                        UPI Mobile:
                      </Text>
                      <Text style={template20Styles.smallText}>
                        {(bankData as any).upiDetails.upiMobile}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: 8,
                    marginTop: 3,
                    color: "#666",
                  }}
                >
                  BANK DETAILS NOT AVAILABLE
                </Text>
              )}
            </View>
            {(bankData as any)?.qrCode ? (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 5,
                  // marginTop: 4,
                  marginLeft: 15,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: "bold",
                    // marginBottom: 5,
                    marginLeft: -2
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
            </>
          )}

            {/* Stamp/Signature Section (Right Column) */}
            <View
              style={{
                width: "38%",
                textAlign: "right",
                alignItems: "flex-end",
                paddingTop: 5,
                paddingLeft: 10,
                // borderLeftWidth: 1,
                marginTop:20,
                borderLeftColor: BORDER_COLOR,
              }}
            >
              {/* Placeholder for Stamp */}
              <View
                style={{
                  height: 55,
                  width: 88,
                  marginBottom: 4,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 7,
                    textAlign: "center",
                  }}
                >
                  {company?.businessName || "Company"}
                </Text>
              </View>
              <Text style={{ fontSize: 7, marginTop: 3, textAlign: "center" }}>
                AUTHORISED SIGNATORY
              </Text>
            </View>
          </View>

          {/* Terms and Conditions Section (HTML Rendering) */}
          <View
            style={{
              marginTop: 8,
              paddingTop: 6,
            }}
            wrap={false}
          >
            <Text
              style={[
                template20Styles.boldText,
                {
                  color: PRIMARY_BLUE,
                  borderTopWidth: 1,
                  borderTopColor: PRIMARY_BLUE,
                  paddingTop: 5,
                },
              ]}
            >
              {/* {termsData.title}: */}
            </Text>
            {transaction?.notes ? (
              <>
                {/* Using renderParsedElements for HTML Notes (rich text) */}
                {renderParsedElements(
                  parseHtmlToElements(transaction.notes, 8),
                  8
                )}
              </>
            ) : null}
          </View>
        </View>

        {/* Page Number - Fixed at bottom */}
        <Text
          style={{
            position: "absolute",
            bottom: 5,
            left: 0,
            right: 30,
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
    </Document>
  );
};

// --- PDF Generation Function (Export) ---

export const generatePdfForTemplate20 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null
): Promise<Blob> => {
  if (!transaction) {
    throw new Error("Transaction is required to generate PDF");
  }

  const pdfDoc = pdf(
    <Template20PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
    />
  );

  return await pdfDoc.toBlob();
};

export default Template20PDF;
