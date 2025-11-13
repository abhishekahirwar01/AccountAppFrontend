// Template8PDF.tsx// Template8PDF.tsx (UPDATED - Removed Items Per Page Logic)
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
  getStateCode,
  prepareTemplate8Data,
  numberToWords,
} from "./pdf-utils";
import { template1Styles, template8Styles } from "./pdf-template-styles";
import { parseHtmlToElements, renderParsedElements } from "./HtmlNoteRenderer";

import HTML from "react-pdf-html";

import { capitalizeWords, parseNotesHtml } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "@/lib/pdf-utils";

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

  console.log("bank details", bank);

  const shouldHideBankDetails = 
  transaction.type === "proforma"  ;

  // Define column widths based on GST applicability
  const getColWidths = () => {
    if (!isGSTApplicable) {
      // Non-GST layout: Sr.No, Name, HSN/SAC, Rate, Qty, Taxable Value, Total
      return [35, 150, 60, 60, 50, 100, 135]; // Sum: 590
    } else if (showIGST) {
      // IGST layout: Sr.No, Name, HSN/SAC, Rate, Qty, Taxable Value, IGST%, IGST Amt, Total
      return [35, 120, 50, 70, 80, 90, 44, 90, 100]; // Sum: 590
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
      <Page size="A4" style={template8Styles.page} wrap>
        {/* Header and Details Section - Set to fixed so they repeat on multi-page invoices */}
        <View style={{ marginBottom: 2 }} fixed>
          {/* Header Section */}
          <View style={template8Styles.header}>
            <Text style={template8Styles.title}>
              {transaction.type === "proforma"
                ? "PROFORMA INVOICE"
                : isGSTApplicable
                ? "TAX INVOICE"
                : "INVOICE"}
            </Text>
            <Text style={template8Styles.companyName}>
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
                {capitalizeWords(company?.addressState || "State")} -{" "}
                {company?.Pincode || "Pincode"}
              </Text>
              <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: "9" }]}>
                  Phone{" "}
                </Text>
                <Text>
                  {company?.mobileNumber
                    ? formatPhoneNumber(company.mobileNumber)
                    : company?.Telephone
                    ? formatPhoneNumber(company.Telephone)
                    : "Phone"}
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
                width: 70,
                height: 70,
                marginBottom: 20,
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
            marginBottom: 6, // Reduced margin
          }}
          fixed
        >
          {/* Left Side - Two Address Sections Stacked */}
          <View style={{ flex: 2, paddingRight: 10 }}>
            {/* Customer Details - Top Section */}
            <View style={{ marginBottom: 8 }}>
              <Text
                style={[
                  template8Styles.grayColor,
                  template8Styles.sectionHeader,
                  { fontWeight: "bold" },
                ]}
              >
                Customer Details | Billed to :
              </Text>
              <Text
                style={[
                  template8Styles.companyName,
                  template8Styles.grayColor,
                  { fontSize: 10 },
                ]}
              >
                {capitalizeWords(party?.name)}
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
                    {" "}
                    {party?.contactNumber
                      ? formatPhoneNumber(party.contactNumber)
                      : "-"}
                  </Text>
                </Text>
              )}

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
              <View
                style={{
                  flexDirection: "row",
                  // justifyContent: "space-between",
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                  Place of Supply:
                </Text>
                <Text style={{ fontSize: 9 }}>
                  {shippingAddress?.state
                    ? `${shippingAddress.state} (${
                        getStateCode(shippingAddress.state) || "-"
                      })`
                    : party?.state
                    ? `${party.state} (${getStateCode(party.state) || "-"})`
                    : "-"}
                </Text>
              </View>

              {/* State detail */}
              {/* <Text
                style={[template8Styles.addressText, template8Styles.grayColor]}
              >
                <Text style={[template8Styles.boldText, { fontSize: 9 }]}>
                  State:{" "}
                </Text>
                <Text>{party?.state || "Madhya Pradesh"}</Text>
              </Text> */}
            </View>

            {/* Shipping Address - Bottom Section */}
            <View>
              <Text
                style={[
                  template8Styles.sectionHeader,
                  template8Styles.grayColor,
                  { fontWeight: "bold" },
                ]}
              >
                Details of Consignee | Shipped to :
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
                    {" "}
                    {party?.contactNumber
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
          <View style={{ width: "30%", textAlign: "right" }}>
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
              <Text style={{ fontSize: 9, fontWeight: "bold" }}>P.O. No.:</Text>
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
              <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                P.O. Date:
              </Text>
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
                <Text style={{ fontSize: 9, fontWeight: "bold" }}>
                  E-Way No.:
                </Text>
                <Text style={{ fontSize: 9 }}>
                  {(transaction as any)?.ewayNumber || "-"}
                </Text>
              </View>
            )}
            {/* <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: "bold"}}>Place of Supply:</Text>
              <Text style={{ fontSize: 9 }}>
                {shippingAddress?.state
                  ? `${shippingAddress.state} (${
                      getStateCode(shippingAddress.state) || "-"
                    })`
                  : party?.state
                  ? `${party.state} (${getStateCode(party.state) || "-"})`
                  : "-"}
              </Text>
            </View> */}
          </View>
        </View>

        {/* Items Table - Use 'wrap' to allow rows to flow across pages */}
        <View style={template8Styles.table}>
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
                {
                  width: colWidths[3],
                  textAlign: "center",
                  padding: 4,
                  fontFamily: "Times-Roman",
                },
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

          {/* Table Rows - Map over ALL items */}
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
                  { width: colWidths[1], textAlign: "left", padding: 4 },
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
                  template8Styles.tableCellLast, // Use tableCellLast for the last cell (no right border)
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

        {/* Footer Content - Removed wrap={false} to allow natural flow */}
        <View style={{ marginTop: 8 }}>
          <View style={template8Styles.totalsSection}>
            <View style={template8Styles.totalsLeft}>
              <Text>
                Total Items / Qty : {totalItems} / {totalQty}
              </Text>
            </View>
            <View style={template8Styles.totalsRight}>
              {/* Show GST breakdown only if GST is applicable */}
              {isGSTApplicable && (
                <>
                  {showIGST && (
                    <View style={template8Styles.totalsRow}>
                      <Text style={template8Styles.boldText}>IGST</Text>
                      <Text>
                        <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                        <Text style={[{ fontSize: 9 }]}>
                          {totalIGST.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Text>
                      </Text>
                    </View>
                  )}
                  {showCGSTSGST && (
                    <>
                      <View style={template8Styles.totalsRow}>
                        <Text style={template8Styles.boldText}>CGST</Text>
                        <Text>
                          <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                          <Text style={[{ fontSize: 9 }]}>
                            {totalCGST.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </Text>
                      </View>
                      <View style={template8Styles.totalsRow}>
                        <Text style={template8Styles.boldText}>SGST</Text>
                        <Text>
                          <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                          <Text style={[{ fontSize: 9 }]}>
                            {totalSGST.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </Text>
                        </Text>
                      </View>
                    </>
                  )}
                </>
              )}
              <View style={template8Styles.totalsRow}>
                <Text style={template8Styles.boldText}>
                  {isGSTApplicable ? "Total Amount After Tax" : "Total Amount"}
                </Text>
                <Text>
                  <Text style={template8Styles.smallRs}>Rs</Text>{" "}
                  <Text style={[{ fontSize: 9 }]}>
                    {totalAmount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                </Text>
              </View>
            </View>
          </View>
          {/* Total in words */}
          <View style={template8Styles.totalsRow}>
            <Text style={{ fontSize: 8, marginTop: 4 }}>
              <Text
                style={{
                  fontSize: 9,
                  marginTop: 4,
                  marginRight: 8,
                  fontWeight: "bold",
                }}
              >
                Total in words :
              </Text>
              {numberToWords(totalAmount)}
            </Text>
          </View>

          <View style={template8Styles.divider} />

          {/* Payment Section */}
          
          <View
            style={{
              marginLeft: 4,
              marginTop: 4,
              flexDirection: "row", // Added to make contents display in a row
              justifyContent: "space-between", // Optional: to space them out
            }}
            wrap={false}
          >
            {/* Bank Details Block */}
            {!shouldHideBankDetails && (
  <>
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
      {/* LEFT: Bank Details */}
      <View style={{ width: 240 }}>
        <Text
          style={[template8Styles.boldText, { textAlign: "left" }]}
          wrap={false}
        >
          Bank Details:
        </Text>
        {bank && typeof bank === "object" && bank.bankName ? (
          <View>
            {/* 1. Bank Name */}
            {bank.bankName && (
              <View style={{ flexDirection: "row", marginBottom: 1 }}>
                <Text
                  style={[
                    template8Styles.normalText,
                    {
                      width: 70,
                      textAlign: "left",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  Name:
                </Text>
                <Text
                  style={[
                    template8Styles.normalText,
                    { width: 150, textAlign: "left" },
                  ]}
                >
                  {capitalizeWords(bank.bankName)}
                </Text>
              </View>
            )}

            {/* 2. Branch Address */}
            {bank.branchAddress && (
              <View style={{ flexDirection: "row", marginBottom: 1 }}>
                <Text
                  style={[
                    template8Styles.normalText,
                    {
                      width: 70,
                      textAlign: "left",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  Branch:
                </Text>
                <Text
                  style={[
                    template8Styles.normalText,
                    { width: 150, textAlign: "left" },
                  ]}
                >
                  {capitalizeWords(bank.branchAddress)}
                </Text>
              </View>
            )}

            {/* 3. IFSC Code */}
            {bank.ifscCode && (
              <View style={{ flexDirection: "row", marginBottom: 1 }}>
                <Text
                  style={[
                    template8Styles.normalText,
                    {
                      width: 70,
                      textAlign: "left",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  IFSC:
                </Text>
                <Text
                  style={[
                    template8Styles.normalText,
                    { width: 150, textAlign: "left" },
                  ]}
                >
                  {capitalizeWords(bank.ifscCode)}
                </Text>
              </View>
            )}

            {/* 4. Account Number */}
            {(bank as any).accountNo && (
              <View style={{ flexDirection: "row", marginBottom: 1 }}>
                <Text
                  style={[
                    template8Styles.normalText,
                    {
                      width: 70,
                      textAlign: "left",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  Acc. No:
                </Text>
                <Text
                  style={[
                    template8Styles.normalText,
                    { width: 150, textAlign: "left" },
                  ]}
                >
                  {(bank as any).accountNo}
                </Text>
              </View>
            )}

            {/* 5. UPI ID */}
            {(bank as any).upiDetails?.upiId && (
              <View style={{ flexDirection: "row", marginBottom: 1 }}>
                <Text
                  style={[
                    template8Styles.normalText,
                    {
                      width: 70,
                      textAlign: "left",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  UPI ID:
                </Text>
                <Text
                  style={[
                    template8Styles.normalText,
                    { width: 150, textAlign: "left" },
                  ]}
                >
                  {(bank as any).upiDetails?.upiId}
                </Text>
              </View>
            )}

            {/* 6. UPI Name */}
            {(bank as any).upiDetails?.upiName && (
              <View style={{ flexDirection: "row", marginBottom: 1 }}>
                <Text
                  style={[
                    template8Styles.normalText,
                    {
                      width: 70,
                      textAlign: "left",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  UPI Name:
                </Text>
                <Text
                  style={[
                    template8Styles.normalText,
                    { width: 150, textAlign: "left" },
                  ]}
                >
                  {(bank as any).upiDetails?.upiName}
                </Text>
              </View>
            )}

            {/* 7. UPI Mobile */}
            {(bank as any).upiDetails?.upiMobile && (
              <View style={{ flexDirection: "row", marginBottom: 1 }}>
                <Text
                  style={[
                    template8Styles.normalText,
                    {
                      width: 70,
                      textAlign: "left",
                      fontWeight: "bold",
                    },
                  ]}
                >
                  UPI Mobile:
                </Text>
                <Text
                  style={[
                    template8Styles.normalText,
                    { width: 150, textAlign: "left" },
                  ]}
                >
                  {(bank as any).upiDetails?.upiMobile}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={template8Styles.normalText}>
            No bank details available
          </Text>
        )}
      </View>

      {/* CENTER: QR Code */}
      {(bank as any)?.qrCode ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            padding: 5,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              fontWeight: "bold",
              marginBottom: 3,
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
                (bank as any).qrCode
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

      {/* RIGHT: Signature Block */}
      <View style={{ width: 210,marginTop:10, alignItems: "flex-end" }}>
        <Text
          style={[
            template8Styles.normalText,
            { fontSize: 9, textAlign: "right" },
          ]}
        >
         For {capitalizeWords(company?.businessName || "Company")}
        </Text>
        <View
          style={{
            width: 100,
            height: 50,
            border: "1px solid #ddd",
            marginTop: 5,
          }}
        />
        <Text
          style={[
            template8Styles.normalText,
            { fontSize: 9, marginTop: 5, marginRight:6, textAlign: "center" },
          ]}
        >
          Authorised Signatory
        </Text>
      </View>
    </View>
  </>
)}
            
          </View>

          <View
            style={{
              marginTop: 8,
              paddingTop: 6,
            }}
            wrap={false}
          >
            <Text
              style={[
                template8Styles.boldText,
                {
                  // color: PRIMARY_BLUE ,
                  borderTopWidth: 3,
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
          {/* ------------------------------------------------------------- */}
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
export const generatePdfForTemplate8 = async (
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
