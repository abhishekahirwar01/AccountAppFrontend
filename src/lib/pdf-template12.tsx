// src/lib/pdf-template12.tsx

import HTML from "react-pdf-html";

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
  Image,
  pdf,
} from "@react-pdf/renderer";
import {
  formatCurrency,
  getBillingAddress,
  getShippingAddress,
  prepareTemplate8Data,
  getStateCode,
} from "./pdf-utils";
import { template8Styles } from "./pdf-template-styles";
import { parseHtmlToElements, renderParsedElements } from "./HtmlNoteRenderer";

import { capitalizeWords, parseNotesHtml } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "@/lib/pdf-utils";

/** Number to words (Indian system) */
const convertNumberToWords = (num: number): string => {
  if (num === 0) return "Zero";
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        " Hundred" +
        (n % 100 ? " " + inWords(n % 100) : "")
      );
    if (n < 100000)
      return (
        inWords(Math.floor(n / 1000)) +
        " Thousand" +
        (n % 1000 ? " " + inWords(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        inWords(Math.floor(n / 100000)) +
        " Lakh" +
        (n % 100000 ? " " + inWords(n % 100000) : "")
      );
    return (
      inWords(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + inWords(n % 10000000) : "")
    );
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let words = inWords(integerPart);

  if (decimalPart > 0) {
    words += " and " + inWords(decimalPart) + " Paise";
  }

  return words;
};

// Styles
const styles = StyleSheet.create({
  page: {
    fontSize: 9,
    paddingTop: 20,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 60,
    fontFamily: "Helvetica",
    color: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  companyDetails: {
    textAlign: "right",
    flex: 1,
  },
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 4,
  },
  title: {
    textAlign: "center",
    fontSize: 15,
    fontWeight: "bold",
    color: "#1976d2",
  },
  divider: {
    borderBottom: "0.5px solid #1976d2",
    marginVertical: 6,
  },
  sectionHeader: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tableRow: {
    flexDirection: "row",
  },
  th: {
    fontSize: 8,
    fontWeight: "bold",
    padding: 2,
    backgroundColor: "#1976d2",
    color: "#fff",
    borderRight: "0.5px solid #1976d2",
    borderBottom: "0.5px solid #1976d2",
  },
  td: {
    fontSize: 8,
    padding: 4,
  },
  tableContainer: {
    border: "0.5px solid #1976d2",
  },
  tableHeaderContainer: {
    borderBottom: "0.5px solid #1976d2",
  },
  tableBodyContainer: {
    borderBottom: "0.5px solid #1976d2",
  },
  totals: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  labelText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  normalText: {
    fontSize: 8,
    fontWeight: "normal",
  },
  footer: {
    marginTop: 12,
    fontSize: 8,
  },
});

interface Template12PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
}

// Reusable Header Component
const PageHeader: React.FC<{
  company?: Company | null;
  transaction: Transaction;
  isGSTApplicable: boolean;
  logoSrc: string | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
}> = ({
  company,
  transaction,
  isGSTApplicable,
  logoSrc,
  party,
  shippingAddress,
}) => (
  <View fixed>
    {/* Header */}
    <View style={styles.header}>
      {logoSrc && <Image src={logoSrc} style={{ width: 70, height: 70 }} />}

      <View style={[styles.companyDetails, { marginLeft: 10 }]}>
        <Text style={styles.companyName}>
          {capitalizeWords(
            company?.businessName || company?.companyName || "Company Name"
          )}
        </Text>
        {!!company?.gstin && (
          <Text style={{ marginBottom: 2, fontSize: 8 }}>
            <Text style={{ fontWeight: "bold" }}>GSTIN: </Text>
            <Text>{company.gstin}</Text>
          </Text>
        )}
        <Text style={{ marginBottom: 2, fontSize: 8 }}>
          {capitalizeWords(company?.address || "Address Line 1")}
        </Text>
        <Text style={{ fontSize: 8 }}>
          {capitalizeWords(company?.City || "City")},{" "}
          {capitalizeWords(company?.addressState || "State")} -{" "}
          {company?.Pincode || "Pincode"}
        </Text>
      </View>
    </View>

    {/* Title */}
    <Text style={styles.title}>
      {transaction.type === "proforma"
        ? "PROFORMA INVOICE"
        : isGSTApplicable
        ? "TAX INVOICE"
        : "INVOICE"}
    </Text>

    <View
      style={{
        height: 1.5,
        backgroundColor: "#1976d2",
        width: "100%",
      }}
    />

    {/* Customer Details | Consignee | Invoice Info - 3 Columns */}
    <View
      style={[styles.row, { marginTop: 8, alignItems: "flex-start", gap: 12 }]}
    >
      {/* Customer Details (Left) */}
      <View style={{ flex: 1, paddingRight: 8 }}>
        <Text style={[styles.sectionHeader, { marginBottom: 6 }]}>
          Customer Details | Billed to:
        </Text>

        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 65 }]}>Name:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {capitalizeWords(party?.name) || "-"}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 65 }]}>Phone:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {party?.contactNumber
              ? formatPhoneNumber(party.contactNumber)
              : "-"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 65 }]}>Address:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {capitalizeWords(getBillingAddress(party))}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 65 }]}>PAN:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {party?.pan || "-"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 65 }]}>GSTIN:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {party?.gstin || "-"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 65 }]}>
            Place of Supply:
          </Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {shippingAddress?.state
              ? `${shippingAddress.state} (${
                  getStateCode(shippingAddress.state) || "-"
                })`
              : party?.state
              ? `${party.state} (${getStateCode(party.state) || "-"})`
              : "-"}
          </Text>
        </View>
      </View>

      {/* Consignee Details (Middle) */}
      <View style={{ flex: 1, paddingHorizontal: 8 }}>
        <Text style={[styles.sectionHeader, { marginBottom: 6 }]}>
          Details of Consignee | Shipped to:
        </Text>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 60 }]}>Name:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {capitalizeWords(
              (shippingAddress as any)?.label || party?.name || "-"
            )}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 60 }]}>Address:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {capitalizeWords(
              getShippingAddress(shippingAddress, getBillingAddress(party))
            )}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 60 }]}>Country:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            <Text>{company?.Country}</Text>
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 60 }]}>Phone:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {formatPhoneNumber(
              (shippingAddress as any)?.phone ||
                (shippingAddress as any)?.mobileNumber ||
                party?.contactNumber ||
                "-"
            )}
          </Text>
        </View>
        {isGSTApplicable && (
          <View
            style={{
              flexDirection: "row",
              marginBottom: 3,
              alignItems: "flex-start",
            }}
          >
            <Text style={[styles.labelText, { width: 60 }]}>GSTIN:</Text>
            <Text style={[styles.normalText, { flex: 1 }]}>
              {(shippingAddress as any)?.gstin || "-"}
            </Text>
          </View>
        )}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 60 }]}>State:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {shippingAddress?.state
              ? `${shippingAddress.state} (${
                  getStateCode(shippingAddress.state) || "-"
                })`
              : party?.state
              ? `${party.state} (${getStateCode(party.state) || "-"})`
              : "-"}
          </Text>
        </View>
      </View>

      {/* Invoice Info (Right) */}
      <View style={{ flex: 0.7, paddingLeft: 8 }}>
        <Text style={[styles.sectionHeader, { marginBottom: 6, opacity: 0 }]}>
          Placeholder
        </Text>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 75 }]}>Invoice #:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {transaction?.invoiceNumber || "—"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 75 }]}>Invoice Date:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {transaction?.date
              ? new Date(transaction.date).toLocaleDateString("en-GB")
              : "—"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 75 }]}>P.O. Date:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>
            {transaction?.dueDate
              ? new Date(transaction.dueDate).toLocaleDateString("en-GB")
              : "-"}
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            marginBottom: 3,
            alignItems: "flex-start",
          }}
        >
          <Text style={[styles.labelText, { width: 75 }]}>E-Way No.:</Text>
          <Text style={[styles.normalText, { flex: 1 }]}>-</Text>
        </View>
      </View>
    </View>
  </View>
);

const Template12PDF: React.FC<Template12PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
}) => {
  const {
    totalTaxable,
    totalAmount,
    totalCGST,
    totalSGST,
    totalIGST,
    totalItems,
    totalQty,
    isGSTApplicable,
    showIGST,
    showCGSTSGST,
    itemsWithGST,
  } = prepareTemplate8Data(transaction, company, party, shippingAddress);

  const logoSrc = company?.logo
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`
    : null;

  const showNoGST = !isGSTApplicable || (!showIGST && !showCGSTSGST);
  const shouldHideBankDetails = 
  transaction.type === "proforma";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Fixed Header on all pages */}
        <PageHeader
          company={company}
          transaction={transaction}
          isGSTApplicable={isGSTApplicable}
          logoSrc={logoSrc}
          party={party}
          shippingAddress={shippingAddress}
        />

        {/* Main Items Table */}
        <View style={{ marginTop: 8 }}>
          {/* Table Header - Fixed on every page break */}
          <View
            style={[
              styles.tableRow,
              {
                border: "0.5px solid #1976d2",
                borderBottom: "0.5px solid #1976d2",
              },
            ]}
            fixed
          >
            {[
              "Sr. No",
              "Name of Product / Service",
              "HSN/SAC",
              "Qty",
              "Rate (Rs.)",
              "Taxable Value(Rs.)",
            ].map((h, i) => (
              <Text
                key={i}
                style={[
                  styles.th,
                  {
                    flex:
                      i === 0
                        ? 0.55 // Sr. No → smaller width
                        : i === 1
                        ? 3 // Name → larger width
                        : 1, // others → normal
                  },
                ]}
              >
                {h}
              </Text>
            ))}
          </View>

          {/* Items Table Body - Each row wraps independently */}
          {itemsWithGST.map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                {
                  borderLeft: "0.5px solid #1976d2",
                  borderRight: "0.5px solid #1976d2",
                  borderBottom: "0.5px solid #1976d2",
                },
              ]}
              wrap={false} // Prevent breaking individual rows
            >
              <Text style={[styles.td, { flex: 0.5 }]}>{idx + 1}</Text>
              <Text style={[styles.td, { flex: 3 }]}>
                {capitalizeWords(item.name)}
              </Text>
              <Text style={[styles.td, { flex: 1 }]}>{item.code || "-"}</Text>
              <Text style={[styles.td, { flex: 1 }]}>
                {formatQuantity(item.quantity ?? 0, item.unit || "")}
              </Text>
              <Text style={[styles.td, { flex: 1 }]}>
                {item.pricePerUnit != null
                  ? formatCurrency(item.pricePerUnit)
                  : "-"}
              </Text>
              <Text style={[styles.td, { flex: 1 }]}>
                {formatCurrency(item.taxableValue || 0)}
              </Text>
            </View>
          ))}
        </View>

        {/* Total Items/Qty - Keep with content below */}
        <View style={{ marginTop: 8, marginBottom: 4 }} wrap={false}>
          <Text style={{ fontSize: 8 }}>
            <Text style={{ fontWeight: "bold" }}>Total Items / Qty: </Text>
            {totalItems} / {Number(totalQty || 0)}
          </Text>
        </View>

        {/* Totals Section - Keep together */}
        <View style={styles.totals} wrap={false}>
          <View style={{ minWidth: 200 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 2,
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 8 }}>
                Taxable Amount:{" "}
              </Text>
              <Text style={{ fontSize: 8 }}>{`Rs.${formatCurrency(
                totalTaxable
              )}`}</Text>
            </View>

            {isGSTApplicable && showIGST && (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginBottom: 2,
                }}
              >
                <Text style={{ fontWeight: "bold", fontSize: 8 }}>IGST: </Text>
                <Text style={{ fontSize: 8 }}>{`Rs.${formatCurrency(
                  totalIGST
                )}`}</Text>
              </View>
            )}

            {isGSTApplicable && showCGSTSGST && (
              <>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 8 }}>
                    CGST:{" "}
                  </Text>
                  <Text style={{ fontSize: 8 }}>{`Rs.${formatCurrency(
                    totalCGST
                  )}`}</Text>
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 2,
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 8 }}>
                    SGST:{" "}
                  </Text>
                  <Text style={{ fontSize: 8 }}>{`Rs.${formatCurrency(
                    totalSGST
                  )}`}</Text>
                </View>
              </>
            )}

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 2,
                paddingTop: 2,
                borderTop: "0.5px solid #000",
              }}
            >
              <Text style={{ fontWeight: "bold", fontSize: 9 }}>
                Total Amount:{" "}
              </Text>
              <Text
                style={{ fontWeight: "bold", fontSize: 9 }}
              >{`Rs.${formatCurrency(totalAmount)}`}</Text>
            </View>
          </View>
        </View>

        {/* Total in Words - Keep with totals */}
        <View style={{ marginTop: 6, marginBottom: 10 }} wrap={false}>
          <Text style={{ fontSize: 9 }}>
            <Text style={{ fontWeight: "bold" }}>Total (in words): </Text>
            <Text>{convertNumberToWords(Math.round(totalAmount))} only</Text>
          </Text>
        </View>

        {/* GST Summary Table */}
        <View style={{ marginTop: 16, marginBottom: 10 }}>
          <View style={[styles.tableContainer]}>
            {/* GST Table Header - Fixed on page breaks */}
            <View style={[styles.tableRow, styles.tableHeaderContainer]} fixed>
              {showIGST && !showNoGST && (
                <>
                  <Text style={[styles.th, { flex: 1 }]}>HSN/SAC</Text>
                  <Text style={[styles.th, { flex: 1 }]}>
                    Taxable Value (Rs.)
                  </Text>
                  <Text style={[styles.th, { flex: 1 }]}>IGST %</Text>
                  <Text style={[styles.th, { flex: 1 }]}>IGST Amt (Rs.)</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Total (Rs.)</Text>
                </>
              )}

              {showCGSTSGST && !showNoGST && (
                <>
                  <Text style={[styles.th, { flex: 1 }]}>HSN/SAC</Text>
                  <Text style={[styles.th, { flex: 1 }]}>
                    Taxable Value (Rs.)
                  </Text>
                  <Text style={[styles.th, { flex: 1 }]}>CGST %</Text>
                  <Text style={[styles.th, { flex: 1 }]}>CGST Amt (Rs.)</Text>
                  <Text style={[styles.th, { flex: 1 }]}>SGST %</Text>
                  <Text style={[styles.th, { flex: 1 }]}>SGST Amt (Rs.)</Text>
                  <Text style={[styles.th, { flex: 1 }]}>Total (Rs.)</Text>
                </>
              )}

              {showNoGST && (
                <>
                  <Text style={[styles.th, { flex: 1 }]}>HSN/SAC</Text>
                  <Text style={[styles.th, { flex: 1 }]}>
                    Taxable Value (Rs.)
                  </Text>
                  <Text style={[styles.th, { flex: 1 }]}>Total (Rs.)</Text>
                </>
              )}
            </View>

            {/* GST Table Body */}
            {itemsWithGST.map((item, idx) => {
              const taxable = item.taxableValue || 0;
              const totalLine =
                item.total ??
                taxable +
                  (item.cgst || 0) +
                  (item.sgst || 0) +
                  (item.igst || 0);

              if (showIGST && !showNoGST) {
                return (
                  <View
                    key={idx}
                    style={[styles.tableRow, styles.tableBodyContainer]}
                    wrap={false}
                  >
                    <Text
                      style={[
                        styles.td,
                        { flex: 1, borderLeft: "none", borderBottom: "none" },
                      ]}
                    >
                      {item.code || "-"}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1, borderBottom: "none" }]}
                    >
                      {formatCurrency(taxable)}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1, borderBottom: "none" }]}
                    >
                      {Number(item.gstRate || 0).toFixed(2)}%
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1, borderBottom: "none" }]}
                    >
                      {formatCurrency(item.igst || 0)}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        { flex: 1, borderRight: "none", borderBottom: "none" },
                      ]}
                    >
                      {formatCurrency(totalLine)}
                    </Text>
                  </View>
                );
              }

              if (showCGSTSGST && !showNoGST) {
                const halfRate = Number((item.gstRate || 0) / 2);
                return (
                  <View
                    key={idx}
                    style={[styles.tableRow, styles.tableBodyContainer]}
                    wrap={false}
                  >
                    <Text
                      style={[
                        styles.td,
                        { flex: 1, borderLeft: "none", borderBottom: "none" },
                      ]}
                    >
                      {item.code || "-"}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1, borderBottom: "none" }]}
                    >
                      {formatCurrency(taxable)}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1, borderBottom: "none" }]}
                    >
                      {halfRate.toFixed(2)}%
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1, borderBottom: "none" }]}
                    >
                      {formatCurrency(item.cgst || 0)}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1, borderBottom: "none" }]}
                    >
                      {halfRate.toFixed(2)}%
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1, borderBottom: "none" }]}
                    >
                      {formatCurrency(item.sgst || 0)}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        { flex: 1, borderRight: "none", borderBottom: "none" },
                      ]}
                    >
                      {formatCurrency(totalLine)}
                    </Text>
                  </View>
                );
              }

              if (showNoGST) {
                return (
                  <View
                    key={idx}
                    style={[styles.tableRow, styles.tableBodyContainer]}
                    wrap={false}
                  >
                    <Text
                      style={[
                        styles.td,
                        { flex: 1, borderLeft: "none", borderBottom: "none" },
                      ]}
                    >
                      {item.code || "-"}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1, borderBottom: "none" }]}
                    >
                      {formatCurrency(taxable)}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        {
                          flex: 1,
                          fontWeight: "bold",
                          borderRight: "none",
                          borderBottom: "none",
                        },
                      ]}
                    >
                      {formatCurrency(taxable)}
                    </Text>
                  </View>
                );
              }
            })}

            {/* TOTAL row - Keep with table */}
            <View
              style={[styles.tableRow, { borderTop: "0.5px solid #1976d2" }]}
              wrap={false}
            >
              {showIGST && !showNoGST && (
                <>
                  <Text
                    style={[
                      styles.td,
                      { flex: 1, fontWeight: "bold", borderLeft: "none" },
                    ]}
                  >
                    TOTAL
                  </Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>
                    {formatCurrency(totalTaxable)}
                  </Text>
                  <Text style={[styles.td, { flex: 1 }]} />
                  <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>
                    {formatCurrency(totalIGST)}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      { flex: 1, fontWeight: "bold", borderRight: "none" },
                    ]}
                  >
                    {formatCurrency(totalAmount)}
                  </Text>
                </>
              )}

              {showCGSTSGST && !showNoGST && (
                <>
                  <Text
                    style={[
                      styles.td,
                      { flex: 1, fontWeight: "bold", borderLeft: "none" },
                    ]}
                  >
                    TOTAL
                  </Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>
                    {formatCurrency(totalTaxable)}
                  </Text>
                  <Text style={[styles.td, { flex: 1 }]} />
                  <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>
                    {formatCurrency(totalCGST)}
                  </Text>
                  <Text style={[styles.td, { flex: 1 }]} />
                  <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>
                    {formatCurrency(totalSGST)}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      { flex: 1, fontWeight: "bold", borderRight: "none" },
                    ]}
                  >
                    {formatCurrency(totalAmount)}
                  </Text>
                </>
              )}

              {showNoGST && (
                <>
                  <Text
                    style={[
                      styles.td,
                      { flex: 1, fontWeight: "bold", borderLeft: "none" },
                    ]}
                  >
                    TOTAL
                  </Text>
                  <Text style={[styles.td, { flex: 1, fontWeight: "bold" }]}>
                    {formatCurrency(totalTaxable)}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      { flex: 1, fontWeight: "bold", borderRight: "none" },
                    ]}
                  >
                    {formatCurrency(totalTaxable)}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Bank Details + Signatory Row - Keep together */}
        <View
          style={{
            flexDirection: "row",
            marginTop: 16,
            marginBottom: 20,
          }}
          wrap={false}
        >
          {/* Bank Details (Left - Increased width with flex: 2) */}
          {!shouldHideBankDetails && (
            <>
          <View style={{ flex: 2 }}>
            <Text style={{ fontWeight: "bold", fontSize: 9, marginBottom: 4 }}>
              Bank Details:
            </Text>
            {bank && typeof bank === "object" ? (
              <View style={{ marginTop: 4 }}>
                {/* Bank Name */}
                {bank.bankName && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 3,
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={[styles.labelText, { width: 70 }]}>Name:</Text>
                    <Text style={[styles.normalText, { flex: 1 }]}>
                      {capitalizeWords(bank.bankName)}
                    </Text>
                  </View>
                )}

                {/* IFSC Code */}
                {bank.ifscCode && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 3,
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={[styles.labelText, { width: 70 }]}>IFSC:</Text>
                    <Text style={[styles.normalText, { flex: 1 }]}>
                      {capitalizeWords(bank.ifscCode)}
                    </Text>
                  </View>
                )}

                {/* Account Number */}
                {((bank as any).accountNo || bank.accountNumber) && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 3,
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={[styles.labelText, { width: 70 }]}>
                      Account No:
                    </Text>
                    <Text style={[styles.normalText, { flex: 1 }]}>
                      {(bank as any).accountNo || bank.accountNumber}
                    </Text>
                  </View>
                )}

                {/* Branch Address */}
                {bank.branchAddress && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 3,
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={[styles.labelText, { width: 70 }]}>
                      Branch:
                    </Text>
                    <Text style={[styles.normalText, { flex: 1 }]}>
                      {capitalizeWords(bank.branchAddress)}
                    </Text>
                  </View>
                )}

                {/* UPI ID */}
                {(bank as any)?.upiDetails?.upiId && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 3,
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={[styles.labelText, { width: 70 }]}>
                      UPI ID:
                    </Text>
                    <Text style={[styles.normalText, { flex: 1 }]}>
                      {(bank as any).upiDetails.upiId}
                    </Text>
                  </View>
                )}

                {/* UPI Name */}
                {(bank as any)?.upiDetails?.upiName && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 3,
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={[styles.labelText, { width: 70 }]}>
                      UPI Name:
                    </Text>
                    <Text style={[styles.normalText, { flex: 1 }]}>
                      {capitalizeWords((bank as any).upiDetails.upiName)}
                    </Text>
                  </View>
                )}

                {/* UPI Mobile */}
                {(bank as any)?.upiDetails?.upiMobile && (
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 3,
                      alignItems: "flex-start",
                    }}
                  >
                    <Text style={[styles.labelText, { width: 70 }]}>
                      UPI Mobile:
                    </Text>
                    <Text style={[styles.normalText, { flex: 1 }]}>
                      {(bank as any).upiDetails.upiMobile}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.normalText}>No bank details available</Text>
            )}
          </View>

          {/* QR Code (Center-Right - flex: 1, centered content) */}
          
          {(bank as any)?.qrCode ? (
            <View
              style={{
                flex: 1, // Retains 25% width
                alignItems: "center", // Centers the QR code horizontally within its 25% space
                justifyContent: "center",
                // padding: 5,
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
                    (bank as any).qrCode
                  }`}
                  style={{
                    width: 76,
                    height: 76,
                    objectFit: "contain",
                  }}
                />
              </View>
            </View>
          ) : (
            <View style={{ flex: 1 }} /> // Empty view to maintain centering if QR is missing
          )}
          </>
        )}

          {/* Signatory (Right - flex: 1) */}
          <View
            style={{
              flex: 1, // Retains 25% width
              alignItems: "flex-end",
              justifyContent: "flex-end",
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: "bold" }}>
              For {capitalizeWords(company?.businessName || "Company")}
            </Text>
            <Text style={{ fontSize: 8, marginTop: 30 }}>
              Authorised Signatory
            </Text>
          </View>
        </View>

        {/* Terms and Conditions - Keep together */}
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
                borderTopWidth: 1,
                borderTopColor: "#2583C6",
              },
            ]}
          ></Text>
          {transaction?.notes ? (
            <>
              {renderParsedElements(
                parseHtmlToElements(transaction.notes, 8),
                8
              )}
            </>
          ) : null}
        </View>

        {/* Page Number - Fixed at bottom */}
        <Text
          style={{
            position: "absolute",
            bottom: 15,
            right: 20,
            fontSize: 8,
            color: "#666",
          }}
          render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};

export const generatePdfForTemplate12 = async (
  transaction: Transaction,
  company: Company | null,
  party: Party | null,
  serviceNameById: Map<string, string> | undefined,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <Template12PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
    />
  );
  return await pdfDoc.toBlob();
};
