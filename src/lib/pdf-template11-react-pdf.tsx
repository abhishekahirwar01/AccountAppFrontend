import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
} from "@/lib/types";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
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
  numberToWords,
  getStateCode,
} from "./pdf-utils";
import { template8Styles } from "./pdf-template-styles";
import { parseHtmlToElements, renderParsedElements } from "./HtmlNoteRenderer";
import { capitalizeWords, parseNotesHtml } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "@/lib/pdf-utils";
import { wrap } from "module";

interface Template8PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
}

const Template8PDF: React.FC<Template8PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
}) => {
  const {
    totals,
    totalTaxable,
    totalAmount,
    items,
    totalItems,
    totalQty,
    itemsBody,
    itemsWithGST, // Now contains all items for single map iteration
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

  // --- Bank Detail Logic from Template 20 ---
  const bankData: Bank | null | undefined = bank;
  const isBankDetailAvailable =
    bankData?.bankName ||
    bankData?.ifscCode ||
    bankData?.branchAddress ||
    (bankData as any)?.accountNo ||
    (bankData as any)?.upiDetails?.upiId;
  // --- End of Bank Detail Logic ---

  console.log("bank details", bank);
  const shouldHideBankDetails = 
  transaction.type === "proforma" ;

  // Define column widths based on GST applicability
  const getColWidths = () => {
    if (!isGSTApplicable) {
      // Non-GST layout: Sr.No, Name, HSN/SAC, Rate, Qty, Taxable Value, Total
      return [35, 150, 60, 60, 50, 100, 135]; // Sum: 590
    } else if (showIGST) {
      // IGST layout: Sr.No, Name, HSN/SAC, Rate, Qty, Taxable Value, IGST%, IGST Amt, Total
      return [35, 120, 50, 80, 80, 80, 40, 70, 115]; // Sum: 590
    } else {
      // CGST/SGST layout: Sr.No, Name, HSN/SAC, Rate, Qty, Taxable Value, CGST%, CGST Amt, SGST%, SGST Amt, Total
      return [
        30, // 0: Sr. No. (Reduced from 40 for space)
        100, // 1: Name of Product / Service (Increased from 100)
        50, // 2: HSN / SAC (Reduced from 60)
        50, // 3: Rate (Increased from 30)
        45, // 4: Qty (Kept at 40)
        60, // 5: Taxable Value
        40, // 6: CGST %
        60, // 7: CGST Amount
        40, // 8: SGST %
        60, // 9: SGST Amount
        70, // 10: Total
      ]; // Sum: 590
    }
  };

  const colWidths = getColWidths();

  // Helper function to get total column index based on GST type
  const getTotalColumnIndex = () => {
    if (!isGSTApplicable) return 6;
    if (showIGST) return 8;
    return 10;
  };

  const totalColumnIndex = getTotalColumnIndex();

  return (
    <Document>
      <Page size="A4" style={template8Styles.page}>
        {/* Header and Details Section - Set to fixed so they repeat on multi-page invoices */}
        <View style={{ marginBottom: 8 }} fixed>
          {/* Header Section */}
          <View style={[template8Styles.header]}>
            <View
              style={[
                {
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  // backgroundColor: "red",
                  fontSize: 18,
                  textAlign: "center",
                },
              ]}
            >
              <Text
                style={[
                  template8Styles.companyName,
                  {
                    width: "100%",
                    fontSize: 18,
                    textAlign: "center",
                  },
                ]}
              >
                {transaction.type === "proforma"
                  ? "PROFORMA INVOICE"
                  : isGSTApplicable
                  ? "TAX INVOICE"
                  : "INVOICE"}
              </Text>
            </View>

            <Text
              style={[
                template8Styles.title,
                {
                  fontSize: 16,
                  alignItems: "center",
                  fontWeight: "bold",
                  color: "#0785E5",
                  textTransform: "uppercase",
                },
              ]}
            >
              {capitalizeWords(
                company?.businessName || company?.companyName || "Company Name"
              )}
            </Text>

            <View>
              {company?.gstin && (
                <Text
                  style={[
                    template8Styles.addressText,
                    template8Styles.grayColor,
                  ]}
                >
                  <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                    GSTIN{" "}
                  </Text>
                  <Text style={{ color: "#3d3d3d", fontWeight: "semibold" }}>
                    {company.gstin}{" "}
                  </Text>
                </Text>
              )}
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                {capitalizeWords(company?.address || "Address Line 1")}
              </Text>
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                {capitalizeWords(company?.City || "City")}
              </Text>

              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: "9" }]}>
                  Phone:{" "}
                </Text>
                <Text>
                  <Text>
                    {company?.mobileNumber || company?.Telephone
                      ? formatPhoneNumber(
                          String(company?.mobileNumber || company?.Telephone)
                        )
                      : "-"}
                  </Text>
                </Text>
              </Text>

              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: "9" }]}>
                  State:{" "}
                </Text>
                <Text>
                  {capitalizeWords(company?.addressState || "State")} -{" "}
                  {company?.Pincode || "Pincode"}
                </Text>
              </Text>
            </View>
          </View>

          {/* Logo */}
          {logoSrc && (
            <Image
              src={logoSrc}
              style={{
                position: "absolute",
                right: 0,
                width: 65,
                height: 65,
                marginBottom: 2,
                marginTop: 25,
              }}
            />
          )}
        </View>

        <View style={template8Styles.dividerBlue} fixed />

        {/* Two Column Section - Fixed on all pages */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
          fixed
        >
          {/* Left Side - Two Address Sections Stacked */}
          <View style={{ width: "35%" }}>
            {/* Customer Details - Top Section */}
            <View style={{ marginBottom: 8 }}>
              <Text
                style={[
                  template8Styles.grayColor,
                  template8Styles.sectionHeader,
                  { fontWeight: "bold" },
                ]}
              >
                Customer Details :
              </Text>
              <Text
                style={[
                  template8Styles.companyName,
                  template8Styles.grayColor,
                  { fontSize: 10 },
                ]}
              >
                {capitalizeWords(party?.name || "Jay Enterprises")}
              </Text>
              <Text
                style={[
                  template8Styles.addressText,
                  template8Styles.grayColor,
                  { width: "70%" },
                ]}
              >
                {capitalizeWords(getBillingAddress(party))}
              </Text>

              {/* GSTIN detail */}

              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  GSTIN:{" "}
                </Text>
                <Text>{party?.gstin || "-"}</Text>
              </Text>

              {/* PAN detail */}
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  PAN:
                </Text>
                <Text>{party?.pan ? party.pan : "-"}</Text>
              </Text>

              {/* Phone detail */}
              {party?.contactNumber && (
                <Text
                  style={[
                    template8Styles.addressText,
                    template8Styles.grayColor,
                  ]}
                >
                  <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                    Phone:{" "}
                  </Text>
                  <Text>
                    {party.contactNumber
                      ? formatPhoneNumber(party.contactNumber)
                      : "-"}
                  </Text>
                </Text>
              )}

              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  Place of Supply:{" "}
                </Text>
                <Text>
                  {" "}
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

          {/* Shipping Address - Bottom Section (Right of Left Column) */}
          <View style={{ width: "30%" }}>
            <View>
              <Text
                style={[
                  template8Styles.sectionHeader,
                  template8Styles.grayColor,
                  { fontWeight: "bold" },
                ]}
              >
                Shipping address:
              </Text>
              <Text
                style={[
                  template8Styles.companyName,
                  template8Styles.grayColor,
                  { fontSize: 10 },
                ]}
              >
                {capitalizeWords(party?.name || " ")}
              </Text>
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                {capitalizeWords(
                  getShippingAddress(shippingAddress, getBillingAddress(party))
                )}
              </Text>

              {/* Country detail */}
              {company?.Country && (
                <Text
                  style={[
                    template8Styles.addressText,
                    template8Styles.grayColor,
                  ]}
                >
                  <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                    Country:{" "}
                  </Text>
                  <Text>{company?.Country}</Text>
                </Text>
              )}

              {/* Phone detail */}
              {party?.contactNumber && (
                <Text
                  style={[
                    template8Styles.addressText,
                    template8Styles.grayColor,
                  ]}
                >
                  <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                    Phone:{" "}
                  </Text>
                  <Text>
                    {party.contactNumber
                      ? formatPhoneNumber(party.contactNumber)
                      : "-"}
                  </Text>
                </Text>
              )}
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  GSTIN:{" "}
                </Text>
                <Text>{party?.gstin || "-"}</Text>
              </Text>

              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  State:{" "}
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
          {/* Right Side - Invoice Details */}
          <View style={{ width: "25%", textAlign: "right" }}>
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
                {transaction?.invoiceNumber?.toString() || "2"}
              </Text>
            </View>
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
                  : "14-Oct-2022"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 9 }}>P.O. No.:</Text>
              <Text style={{ fontSize: 9 }}>
                {(transaction as any)?.poNumber || "-"}
              </Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 4,
              }}
            >
              <Text style={{ fontSize: 9 }}>P.O. Date:</Text>
              <Text style={{ fontSize: 9 }}>
                {(transaction as any)?.poDate
                  ? new Date((transaction as any).poDate).toLocaleDateString(
                      "en-GB"
                    )
                  : "-"}
              </Text>
            </View>
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
                  {(transaction as any)?.ewayNumber || "-"}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Items Table - Use 'wrap' to allow rows to flow across pages */}
        <View style={template8Styles.table} wrap>
          {/* Table Header - Add 'fixed' to repeat on new pages */}
          <View style={template8Styles.tableHeader} fixed>
            <Text
              style={[
                template8Styles.tableCellHeader,
                { width: colWidths[0], textAlign: "center", padding: 4 },
              ]}
            >
              Sr.No
            </Text>
            <Text
              style={[
                template8Styles.tableCellHeader,
                { width: colWidths[1], padding: 4 },
              ]}
            >
              Name of Product / Service
            </Text>
            <Text
              style={[
                template8Styles.tableCellHeader,
                { width: colWidths[2], textAlign: "center", padding: 4 },
              ]}
            >
              HSN/SAC
            </Text>
            <Text
              style={[
                template8Styles.tableCellHeader,
                { width: colWidths[3], textAlign: "center", padding: 4 },
              ]}
            >
              Rate (Rs.)
            </Text>
            <Text
              style={[
                template8Styles.tableCellHeader,
                { width: colWidths[4], textAlign: "center", padding: 4 },
              ]}
            >
              Qty
            </Text>
            <Text
              style={[
                template8Styles.tableCellHeader,
                { width: colWidths[5], textAlign: "center", padding: 4 },
              ]}
            >
              Taxable Value (Rs.)
            </Text>

            {/* Dynamic GST columns */}
            {showIGST ? (
              // Interstate - Show IGST columns
              <>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    {
                      width: colWidths[6],
                      textAlign: "center",
                      padding: 4,
                    },
                  ]}
                >
                  IGST%
                </Text>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    {
                      width: colWidths[7],
                      textAlign: "center",
                      padding: 4,
                    },
                  ]}
                >
                  IGST Amount (Rs.)
                </Text>
              </>
            ) : showCGSTSGST ? (
              // Intrastate - Show CGST/SGST columns
              <>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    {
                      width: colWidths[6],
                      textAlign: "center",
                      padding: 4,
                    },
                  ]}
                >
                  CGST%
                </Text>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    {
                      width: colWidths[7],
                      textAlign: "center",
                      padding: 4,
                    },
                  ]}
                >
                  CGST Amount (Rs.)
                </Text>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    {
                      width: colWidths[8],
                      textAlign: "center",
                      padding: 4,
                    },
                  ]}
                >
                  SGST%
                </Text>
                <Text
                  style={[
                    template8Styles.tableCellHeader,
                    {
                      width: colWidths[9],
                      textAlign: "center",
                      padding: 4,
                    },
                  ]}
                >
                  SGST Amount (Rs.)
                </Text>
              </>
            ) : null}

            {/* Total Column */}
            <Text
              style={[
                template8Styles.tableCellHeader,
                {
                  width: colWidths[totalColumnIndex],
                  textAlign: "center",
                  padding: 4,
                },
              ]}
            >
              Total (Rs.)
            </Text>
          </View>

          {/* Table Rows - Map over ALL items (itemsWithGST) once */}
          {itemsWithGST.map((item, index) => (
            <View
              key={index}
              style={[template8Styles.tableRow, template8Styles.grayColor]}
              wrap={false} // Prevents a single row from being split across a page break
            >
              <Text
                style={[
                  template8Styles.tableCell,
                  template8Styles.tableCellSize7,
                  { width: colWidths[0], textAlign: "center", padding: 4 },
                ]}
              >
                {index + 1}
              </Text>
              <Text
                style={[
                  template8Styles.tableCell,
                  template8Styles.tableCellSize7,
                  template8Styles.grayColor,
                  { width: colWidths[1], padding: 4 },
                ]}
              >
                {capitalizeWords(item.name)}
              </Text>
              <Text
                style={[
                  template8Styles.tableCell,
                  template8Styles.tableCellSize7,
                  template8Styles.grayColor,
                  { width: colWidths[2], textAlign: "center", padding: 4 },
                ]}
              >
                {item.code || "-"}
              </Text>
              <Text
                style={[
                  template8Styles.tableCell,
                  template8Styles.tableCellSize7,
                  template8Styles.grayColor,
                  { width: colWidths[3], textAlign: "center", padding: 4 },
                ]}
              >
                {formatCurrency(item.pricePerUnit || 0)}
              </Text>
              <Text
                style={[
                  template8Styles.tableCell,
                  template8Styles.tableCellSize7,
                  template8Styles.grayColor,
                  { width: colWidths[4], textAlign: "center", padding: 4 },
                ]}
              >
                {formatQuantity(item.quantity || 0, item.unit)}
              </Text>
              <Text
                style={[
                  template8Styles.tableCell,
                  template8Styles.tableCellSize7,
                  template8Styles.grayColor,
                  { width: colWidths[5], textAlign: "center", padding: 4 },
                ]}
              >
                {formatCurrency(item.taxableValue)}
              </Text>

              {/* Dynamic GST columns */}
              {showIGST ? (
                // Interstate - Show IGST columns
                <>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      {
                        width: colWidths[6],
                        textAlign: "center",
                        padding: 4,
                      },
                    ]}
                  >
                    {item.gstRate.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      {
                        width: colWidths[7],
                        textAlign: "center",
                        padding: 4,
                      },
                    ]}
                  >
                    {formatCurrency(item.igst)}
                  </Text>
                </>
              ) : showCGSTSGST ? (
                // Intrastate - Show CGST/SGST columns
                <>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      {
                        width: colWidths[6],
                        textAlign: "center",
                        padding: 4,
                      },
                    ]}
                  >
                    {(item.gstRate / 2).toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      {
                        width: colWidths[7],
                        textAlign: "center",
                        padding: 4,
                      },
                    ]}
                  >
                    {formatCurrency(item.cgst)}
                  </Text>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      {
                        width: colWidths[8],
                        textAlign: "center",
                        padding: 4,
                      },
                    ]}
                  >
                    {(item.gstRate / 2).toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      template8Styles.tableCell,
                      template8Styles.tableCellSize7,
                      template8Styles.grayColor,
                      {
                        width: colWidths[9],
                        textAlign: "center",
                        padding: 4,
                      },
                    ]}
                  >
                    {formatCurrency(item.sgst)}
                  </Text>
                </>
              ) : null}

              {/* Total Column */}
              <Text
                style={[
                  template8Styles.tableCellLast,
                  template8Styles.tableCellSize7,
                  template8Styles.grayColor,
                  {
                    width: colWidths[totalColumnIndex],
                    textAlign: "center",
                    padding: 4,
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

        {/* Totals and Footer Section 
            The 'break' property is REMOVED to allow this content 
            to start immediately after the table if vertical space permits.
        */}
        <View>
          <View
            style={{
              height: 1,
              backgroundColor: "#d3d3d3",
              width: "100%",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          <View style={{ marginTop: 8 }}>
            <View style={template8Styles.totalsSection}>
              <View style={template8Styles.totalsLeft}>
                <Text style={{ fontSize: 9 }}>
                  Total Items / Qty : {totalItems} / {totalQty}
                </Text>
              </View>
              <View
                style={[
                  template8Styles.totalsRight,
                  { border: "1px solid #bfbfbf" },
                ]}
              >
                {/* Taxable Amount Row */}
                <View
                  style={[
                    template8Styles.totalsRow,
                    { borderBottom: "1px solid #bfbfbf" },
                  ]}
                >
                  <Text
                    style={[
                      template8Styles.boldText,
                      { fontSize: 9, padding: 2, paddingTop: 4 },
                    ]}
                  >
                    Taxable Amount
                  </Text>
                  <Text style={{ fontSize: 9, padding: 2 }}>
                    <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                    {formatCurrency(totalTaxable)}
                  </Text>
                </View>

                {/* Show GST breakdown only if GST is applicable */}
                {isGSTApplicable && (
                  <>
                    {showIGST && (
                      <View
                        style={[
                          template8Styles.totalsRow,
                          // { borderBottom: "1px solid #bfbfbf" },
                        ]}
                      >
                        <Text
                          style={[
                            template8Styles.boldText,
                            { fontSize: 9, padding: 2, marginBottom: 0 },
                          ]}
                        >
                          IGST
                        </Text>
                        <Text style={{ fontSize: 9, padding: 2 }}>
                          <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                          {formatCurrency(totalIGST)}
                        </Text>
                      </View>
                    )}
                    {showCGSTSGST && (
                      <>
                        <View
                          style={[
                            template8Styles.totalsRow,
                            { borderBottom: "1px solid #bfbfbf" },
                          ]}
                        >
                          <Text
                            style={[
                              template8Styles.boldText,
                              { fontSize: 9, padding: 2, marginBottom: 0 },
                            ]}
                          >
                            CGST
                          </Text>
                          <Text style={{ fontSize: 9, padding: 2 }}>
                            <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                            {formatCurrency(totalCGST)}
                          </Text>
                        </View>
                        <View
                          style={[
                            template8Styles.totalsRow,
                            // { borderBottom: "1px solid #bfbfbf" },
                          ]}
                        >
                          <Text
                            style={[
                              template8Styles.boldText,
                              { fontSize: 9, padding: 2, marginBottom: 0 },
                            ]}
                          >
                            SGST
                          </Text>
                          <Text style={{ fontSize: 9, padding: 2 }}>
                            <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                            {formatCurrency(totalSGST)}
                          </Text>
                        </View>
                      </>
                    )}
                  </>
                )}

                {/* Total Amount Row - Bold and prominent */}
                <View
                  style={[
                    {
                      // backgroundColor: "#E2E2E2",
                      padding: 2,
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                      minHeight: 10,
                      height: "auto",
                    },
                  ]}
                >
                  <Text style={[template8Styles.boldText, { fontSize: 10 }]}>
                    Total Amount
                  </Text>
                  <Text style={[template8Styles.boldText, { fontSize: 10 }]}>
                    <Text style={template8Styles.smallRs}>Rs.</Text>{" "}
                    {formatCurrency(totalAmount)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Total in words */}
            <View style={[template8Styles.totalsRow, { marginTop: 8 }]}>
              <Text style={{ fontSize: 8 }}>
                <Text style={[template8Styles.boldText, { fontSize: 10 }]}>
                  Total in words :{" "}
                </Text>
                {numberToWords(totalAmount)}
              </Text>
            </View>

            <View style={template8Styles.divider} />

            {/* Combined Payment/Signature Section */}
             {!shouldHideBankDetails && (
            <View
              style={[
                template8Styles.paymentSection,
                {
                  marginTop: 8,
                  justifyContent: "space-between", // Added to distribute sections
                },
              ]}
            >
              {/* Left Column: UPI Section (Retained) */}

              {/* Middle Column: Bank Details (Retained) */}
              <View style={{ width: "45%" }}>
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  Bank Details:
                </Text>
                {bankData && isBankDetailAvailable ? (
                  <View style={{ marginTop: 4 }}>
                    {/* Bank Name */}
                    {bankData.bankName && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              marginRight: 5,
                              fontSize: 9,
                              width: 65,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          Name:
                        </Text>
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              fontSize: 9,
                              flexGrow: 1,
                              textAlign: "right",
                            },
                          ]}
                        >
                          {capitalizeWords(bankData.bankName)}
                        </Text>
                      </View>
                    )}
                    {/* IFSC Code */}
                    {bankData.ifscCode && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              marginRight: 5,
                              fontSize: 9,
                              width: 65,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          IFSC:
                        </Text>
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              fontSize: 9,
                              flexGrow: 1,
                              textAlign: "right",
                            },
                          ]}
                        >
                          {capitalizeWords(bankData.ifscCode)}
                        </Text>
                      </View>
                    )}
                    {/* Account Number */}
                    {(bankData as any)?.accountNo && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              marginRight: 5,
                              fontSize: 9,
                              width: 65,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          Acc. No:
                        </Text>
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              fontSize: 9,
                              flexGrow: 1,
                              textAlign: "right",
                            },
                          ]}
                        >
                          {(bankData as any).accountNo}
                        </Text>
                      </View>
                    )}
                    {/* Branch Address */}
                    {bankData.branchAddress && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              marginRight: 5,
                              fontSize: 9,
                              width: 65,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          Branch:
                        </Text>
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              fontSize: 9,
                              flexGrow: 1,
                              textAlign: "left",
                              flex: 1,
                            },
                          ]}
                        >
                          {capitalizeWords(bankData.branchAddress)}
                        </Text>
                      </View>
                    )}
                    {/* UPI ID */}
                    {(bankData as any)?.upiDetails?.upiId && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              marginRight: 5,
                              fontSize: 9,
                              width: 65,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          UPI ID:
                        </Text>
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              fontSize: 9,
                              flexGrow: 1,
                              textAlign: "right",
                            },
                          ]}
                        >
                          {(bankData as any).upiDetails.upiId}
                        </Text>
                      </View>
                    )}

                    {(bankData as any)?.upiDetails?.upiName && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              marginRight: 5,
                              fontSize: 9,
                              width: 65,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          UPI Name:
                        </Text>
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              fontSize: 9,
                              flexGrow: 1,
                              textAlign: "right",
                            },
                          ]}
                        >
                          {(bankData as any).upiDetails.upiName}
                        </Text>
                      </View>
                    )}

                    {(bankData as any)?.upiDetails?.upiMobile && (
                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: 2,
                        }}
                      >
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              marginRight: 5,
                              fontSize: 9,
                              width: 65,
                              fontWeight: "bold",
                            },
                          ]}
                        >
                          UPI Mobile:
                        </Text>
                        <Text
                          style={[
                            template8Styles.normalText,
                            {
                              fontSize: 9,
                              flexGrow: 1,
                              textAlign: "right",
                            },
                          ]}
                        >
                          {(bankData as any).upiDetails.upiMobile}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={[template8Styles.normalText, { fontSize: 9 }]}>
                    No bank details available
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
                    marginLeft: 10,
                    marginTop: -15
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: "bold",
                      // marginBottom: 5,
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

              {/* Right Column: Stamp/Signature Section (Added from Template 20) */}
              <View
                style={{
                  width: "30%",
                  textAlign: "right",
                  alignItems: "flex-end",
                  paddingTop: 5,
                }}
              >
                <Text
                  style={[
                    template8Styles.boldText,
                    {
                      fontSize: 9,
                      marginRight: 4,
                      marginBottom: 5,
                      textAlign: "right",
                    },
                  ]}
                >
                  For{" "}
                  {company?.businessName ||
                    company?.companyName ||
                    "Company Name"}
                </Text>
                {/* Placeholder for Stamp */}
                <View
                  style={{
                    height: 70,
                    width: 70,
                    borderStyle: "dashed",
                    borderWidth: 1,
                    borderColor: "#999",
                    marginBottom: 12,
                    marginTop: 5,
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 7,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 7,
                      textAlign: "center",
                    }}
                  >
                    {/* {company?.businessName || "Company"} */}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 7,
                    marginTop: 3,
                    textAlign: "center",
                    marginBottom: 10,
                  }}
                >
                  AUTHORISED SIGNATORY
                </Text>
              </View>
            </View>)}

            {/* Terms and Conditions */}
            <View
              style={{
                // marginTop: 8,
                paddingTop: 6,
              }}
            >
              <Text
                style={[
                  template8Styles.boldText,
                  {
                    // color: PRIMARY_BLUE ,
                    borderTopWidth: 1,
                    borderTopColor: "#2583C6",
                    // paddingTop: 5,
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
        </View>

        {/* Page Number - Use 'fixed' to position regardless of content flow */}
        <Text
          fixed
          style={template8Styles.pageNumber}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages} page`
          }
        />
      </Page>
    </Document>
  );
};

// Update your generatePdfForTemplate8 function
export const generatePdfForTemplate11React = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null
): Promise<Blob> => {
  // React PDF generates the PDF directly
  const pdfDoc = pdf(
    <Template8PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
    />
  );

  return await pdfDoc.toBlob();
};
