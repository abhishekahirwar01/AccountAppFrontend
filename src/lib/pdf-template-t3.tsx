// pdf-template-t3.tsx
import React from "react";
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
import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
  Client,
} from "@/lib/types";
import {
  prepareTemplate8Data,
  formatCurrency,
  getBillingAddress,
  getShippingAddress,
  getStateCode,
  numberToWords,
} from "./pdf-utils";
import { capitalizeWords } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "./pdf-utils";
// Register a monospace font for proper alignment
Font.register({
  family: "Courier",
  fonts: [
    { src: "https://fonts.cdnfonts.com/s/63309/CourierPrime-Regular.ttf" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontSize: 8,
    padding: 10,
    width: 280, // approx 80mm roll width
  },
  center: { textAlign: "center" },
  line: { marginVertical: 2 },
  section: { marginBottom: 5 },
  tableHeader: {
    flexDirection: "row",
    fontWeight: "bold",
    marginTop: 4,
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    fontSize: 7,
    marginTop: 2,
    marginBottom: 2,
    alignItems: "flex-start",
  },
  colItem: { width: "50%", textAlign: "left" },
  colGst: { width: "35%", paddingLeft: 5, textAlign: "center", },
  colTotal: { width: "25%", textAlign: "right" },
  bold: { fontWeight: "bold" },
  borderLine: {
    textAlign: "center",
    marginVertical: 2,
  },
  gstLine: {
    marginBottom: 1,
    textAlign: "center",
  },
  upiSection: {
    marginTop: 8,
    alignItems: "flex-end",
    // marginRight: 10,
  },
  qrCode: {
    width: 80,
    height: 80,
    marginVertical: 5,
  },
  qrPlaceholder: {
    width: 80,
    height: 80,
    borderStyle: "solid",
    borderWidth: 0.5,
    borderColor: "#666",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },
});

interface Template_t3Props {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
  client?: Client | null;
}

const Template_t3: React.FC<Template_t3Props> = ({
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

  const bankData: Bank | null | undefined = bank;
  const isBankDetailAvailable =
    bankData?.bankName ||
    bankData?.ifscCode ||
    bankData?.branchAddress ||
    (bankData as any)?.accountNo ||
    (bankData as any)?.upiDetails?.upiId;

  return (
    <Document>
      <Page size={{ width: 280, height: "1000" }} style={styles.page}>
        <View style={styles.center}>
          <Text style={{ fontWeight: "bold" }}>
            {capitalizeWords(
              company?.businessName || company?.companyName || "Company Name"
            )}
          </Text>
          <Text>
            {capitalizeWords(
              [company?.address, company?.City, company?.addressState]
                .filter(Boolean)
                .join(", ")
            )}
          </Text>
          <Text>
            {capitalizeWords(company?.Country || "India")} -{" "}
            {company?.Pincode || ""}
          </Text>
          <Text>
            {company?.mobileNumber
              ? formatPhoneNumber(String(company.mobileNumber))
              : company?.Telephone
              ? formatPhoneNumber(String(company.Telephone))
              : ""}
          </Text>
        </View>

        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>
        <Text style={[styles.center, styles.bold]}>
          {" "}
          {transaction.type === "proforma"
            ? "PROFORMA INVOICE"
            : isGSTApplicable
            ? "TAX INVOICE"
            : "INVOICE"}
        </Text>
        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>

        <View style={styles.section}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            {/* Left side - Billed To section */}
            <View style={{ flexDirection: "column", gap: 4 }}>
              <Text style={styles.bold}>BILLED TO</Text>
              <Text>{capitalizeWords(party?.name || "N/A")}</Text>
              <Text>
                {party?.contactNumber
                  ? formatPhoneNumber(party.contactNumber)
                  : "N/A"}
              </Text>
              <Text>{party?.gstin || "N/A"}</Text>
            </View>

            {/* Right side - Invoice # and Date */}
            <View style={{ alignItems: "flex-end" }}>
              <View style={{ flexDirection: "column", gap: 4 }}>
                <Text>
                  <Text style={styles.bold}>INVOICE # :</Text>{" "}
                  {transaction.invoiceNumber || "N/A"}
                </Text>
                <Text>
                  <Text style={styles.bold}>DATE :</Text>{" "}
                  {new Date(transaction.date).toLocaleDateString("en-IN")}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>

        {/* Updated Table Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.colItem}>Item</Text>
          <Text style={styles.colGst}>Amount (Rs.)</Text>
          <Text style={styles.colGst}>GST</Text>
          <Text style={styles.colTotal}>Total(Rs.)</Text>
        </View>

        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>

        {/* Updated Table Rows */}
        {itemsWithGST.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            {/* Item Column */}
            <View style={styles.colItem}>
              <Text>{capitalizeWords(item.name)}</Text>
              {item.itemType !== "service" && (
                <Text>{formatQuantity(item.quantity || 0, item.unit)}</Text>
              )}
              <Text>
                {item.itemType === "service" ? "SAC" : "HSN"}:{" "}
                {item.code || "-"}
              </Text>
              {/* <Text>Rate: Rs {formatCurrency(item.pricePerUnit || 0)}</Text> */}
            </View>

            {/* Total Column */}
            <View style={[styles.colGst, { textAlign: "center" }]}>
              <Text>{formatCurrency(item.pricePerUnit || 0)}</Text>
            </View>

            {/* GST Column - Apply same logic as A5 template */}
            <View style={styles.colGst}>
              {isGSTApplicable ? (
                <>
                  {showIGST ? (
                    <Text style={styles.gstLine}>IGST-{item.gstRate}%</Text>
                  ) : showCGSTSGST ? (
                    <>
                      <Text style={styles.gstLine}>
                        CGST-{(item.gstRate || 0) / 2}%
                      </Text>
                      <Text style={styles.gstLine}>
                        SGST-{(item.gstRate || 0) / 2}%
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.gstLine}>No Tax Applicable</Text>
                  )}
                </>
              ) : (
                <Text style={styles.gstLine}>No Tax</Text>
              )}
            </View>

            <View style={styles.colTotal}>
              <Text>{formatCurrency(item.total || 0)}</Text>
            </View>
          </View>
        ))}

        <Text style={[styles.borderLine, { fontSize: 10 }]}>
          =============================================
        </Text>

        {/* Totals Section - Apply same GST logic as A5 template */}
        <View style={styles.section}>
          <Text style={[styles.center, styles.bold]}>TOTAL AMOUNT</Text>
          <Text style={[styles.borderLine, { fontSize: 10 }]}>
            =============================================
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginVertical: 2,
            }}
          >
            <Text>Subtotal:</Text>
            <Text>Rs {formatCurrency(totalTaxable)}</Text>
          </View>

          {isGSTApplicable && (
            <>
              {showIGST && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginVertical: 2,
                  }}
                >
                  <Text>IGST:</Text>
                  <Text>Rs {formatCurrency(totalIGST)}</Text>
                </View>
              )}
              {showCGSTSGST && (
                <>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginVertical: 2,
                    }}
                  >
                    <Text>CGST:</Text>
                    <Text>Rs {formatCurrency(totalCGST)}</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginVertical: 2,
                    }}
                  >
                    <Text>SGST:</Text>
                    <Text>Rs {formatCurrency(totalSGST)}</Text>
                  </View>
                </>
              )}
            </>
          )}

          <Text style={[styles.borderLine, { fontSize: 10 }]}>
            =============================================
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginVertical: 2,
            }}
          >
            <Text style={styles.bold}>
              {isGSTApplicable ? "Total Amount After Tax" : "Total Amount"}:
            </Text>
            <Text style={styles.bold}>Rs {formatCurrency(totalAmount)}</Text>
          </View>
          <Text style={[styles.center, { marginTop: 4, textAlign: "left" }]}>
            {numberToWords(totalAmount)}
          </Text>
        </View>

        {/* UPI Payment Section */}
        {bankData && (bankData as any)?.upiDetails?.upiId && (
          <View style={styles.upiSection}>
            <Text style={[styles.borderLine, { fontSize: 10 }]}>
              =============================================
            </Text>
            {(bankData as any)?.qrCode ? (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 5,
                  marginTop: 4,
                  marginRight: -7,
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

            {/* UPI ID */}
            <Text style={[styles.center, { fontSize: 7, marginTop: 2 }]}>
              <Text style={styles.bold}>UPI ID: </Text>
              {(bankData as any).upiDetails.upiId}
            </Text>

            <Text style={[styles.center, { fontSize: 7, marginTop: 2 }]}>
              <Text style={styles.bold}>UPI Name: </Text>
              {(bankData as any).upiDetails.upiName}
            </Text>

            {company && (
              <Text
                style={[
                  styles.center,
                  { fontSize: 7, marginTop: 2, marginRight: 0 },
                ]}
              >
                <Text style={styles.bold}>UPI Mobile No: </Text>
                {(bankData as any).upiDetails.upiMobile}
              </Text>
            )}

            <Text style={[styles.borderLine, { fontSize: 10 }]}>
              =============================================
            </Text>
          </View>
        )}

        {/* Bank Details Section (if UPI not available) */}
        {bankData &&
          isBankDetailAvailable &&
          !(bankData as any)?.upiDetails?.upiId && (
            <View style={[styles.section, { marginTop: 8 }]}>
              <Text style={[styles.borderLine, { fontSize: 10 }]}>
                =============================================
              </Text>
              <Text
                style={[
                  styles.center,
                  styles.bold,
                  { fontSize: 9, marginVertical: 3 },
                ]}
              >
                Bank Details
              </Text>

              {bankData.bankName && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginVertical: 1,
                  }}
                >
                  <Text style={styles.bold}>Bank Name:</Text>
                  <Text>{capitalizeWords(bankData.bankName)}</Text>
                </View>
              )}

              {(bankData as any)?.accountNo && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginVertical: 1,
                  }}
                >
                  <Text style={styles.bold}>Account No:</Text>
                  <Text>{(bankData as any).accountNo}</Text>
                </View>
              )}

              {bankData.ifscCode && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginVertical: 1,
                  }}
                >
                  <Text style={styles.bold}>IFSC Code:</Text>
                  <Text>{capitalizeWords(bankData.ifscCode)}</Text>
                </View>
              )}

              <Text style={[styles.borderLine, { fontSize: 10 }]}>
                =============================================
              </Text>
            </View>
          )}

        {/* Footer with company name */}
        <View style={[styles.section, { marginTop: 10 }]}>
          <Text style={[styles.center, { fontSize: 7 }]}>
            For{" "}
            {capitalizeWords(
              company?.businessName || company?.companyName || "Company Name"
            )}{" "}
            (E & O.E.)
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export const generatePdfForTemplatet3 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null,
  client?: Client | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <Template_t3
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

export default Template_t3;
