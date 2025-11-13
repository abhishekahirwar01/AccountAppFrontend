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
} from "./pdf-utils";
// Import template18Styles instead of template8Styles
import { template18Styles } from "./pdf-template-styles";
import { capitalizeWords } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";

// Define the UPI specific styles locally - UPDATED FOR SLIGHT LEFT SHIFT VIA FLEX-START
const UPI_STYLES = StyleSheet.create({
  upiSection: {
    marginTop: 8,
    // Aligns children (QR code, text) to the LEFT
    alignItems: "flex-start",
    paddingVertical: 5,
    // *** NEW CHANGE: Add padding to shift it slightly right from the edge ***
    paddingLeft: 10,
  },
  qrCode: {
    width: 70,
    height: 70,
    marginVertical: 5,
  },
  qrPlaceholder: {
    width: 70,
    height: 70,
    borderStyle: "solid",
    borderWidth: 0.5,
    borderColor: "#666",
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },
  borderLine: {
    textAlign: "center",
    marginVertical: 2,
    fontSize: 7,
  },
  bold: { fontWeight: "bold" },

  // Ensures detailed text lines are Left-aligned
  upiTextDetail: {
    fontSize: 7,
    marginVertical: 1,
    textAlign: "left",
  },
});

import { formatPhoneNumber } from "./pdf-utils";

const logo = "/assets/invoice-logos/R.png"; // Placeholder logo path

interface Template18PDFProps {
  transaction: Transaction;
  company?: Company | null;
  party?: Party | null;
  shippingAddress?: ShippingAddress | null;
  bank?: Bank | null;
}

// Helper to determine GST Label (IGST or CGST/SGST combined)
const getTaxLabel = (
  showIGST: boolean,
  totalCGST: number,
  totalSGST: number
) => {
  if (showIGST) return "Add: IGST";
  if (totalCGST > 0 || totalSGST > 0) return "Add: Total Tax";
  return "Total Tax";
};

const Template18PDF: React.FC<Template18PDFProps> = ({
  transaction,
  company,
  party,
  shippingAddress,
  bank,
}) => {
  // --- Thermal page sizing helpers ---
  const mmToPt = (mm: number) => (mm * 72) / 25.4;
  const THERMAL_WIDTH_MM = 100; // common 80mm paper; change to 58 if needed
  const thermalPageWidth = mmToPt(THERMAL_WIDTH_MM);
  const estimateThermalHeight = (itemCount: number) => {
    // Rough estimate: header/meta/billed-to ≈ 180pt, per item ≈ 34pt, summary/QR ≈ 240pt
    const headerHeight = 180;
    const perItemHeight = 34;
    const footerHeight = 240;
    const minHeight = 400; // ensure non-zero height for very small invoices
    return Math.max(
      minHeight,
      headerHeight + itemCount * perItemHeight + footerHeight
    );
  };
  const {
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
  } = prepareTemplate8Data(transaction, company, party, shippingAddress); // --- START LOGIC COPY FROM TEMPLATE 8 (for item presentation/pagination) ---

  // For thermal receipts, render all items on a single page so height grows with content
  const itemsPerPage = itemsWithGST.length || 12;
  const pages = [];
  for (let i = 0; i < itemsWithGST.length; i += itemsPerPage) {
    pages.push(itemsWithGST.slice(i, i + itemsPerPage));
  } // Simplified items breakdown structure for visual appearance, matching the image. // Group by item name/HSN to show the essential lines.
  const itemsBreakdown = itemsWithGST.map((item) => ({
    name: capitalizeWords(item.name), // ⭐ Applied here
    qty: item.quantity || 0,
    unit: item.unit || "BDL",
    rate: item.pricePerUnit || 0,
    hsn: item.code || "-",
    gstRate: item.gstRate,
    taxableValue: item.taxableValue,
    total: item.total,
    tax: item.igst || item.cgst + item.sgst,
  })); // Use the total tax amount based on GST type
  const totalTaxAmount = totalIGST || totalCGST + totalSGST;
  const taxLabel = getTaxLabel(showIGST, totalCGST, totalSGST); // --- END LOGIC COPY FROM TEMPLATE 8 ---
  

  // FIX: Change type assertion to 'any' to resolve 'upiDetails' property existence error.
  const bankDataWithUpi: any = bank;
  const isUpiAvailable = bankDataWithUpi?.upiDetails?.upiId;

  // FIX: Standardized separator string length for thermal receipt width (45 chars)
  const SEPARATOR_LINE = "=============================================";

  return (
    <Document>
      {" "}
      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === pages.length - 1;
        const dynamicHeight = estimateThermalHeight(pageItems.length);
        return (
          <Page
            key={pageIndex}
            size={{ width: thermalPageWidth, height: dynamicHeight }}
            style={[
              template18Styles.page,
              { paddingHorizontal: 8, paddingVertical: 8 },
            ]}
          >
            {" "}
            <View style={template18Styles.pageContent}>
              {/* Company Header - Centered */}
              <View style={template18Styles.companyHeaderSection}>
                {" "}
                <Text style={template18Styles.companyNameTop}>
                  {" "}
                  {capitalizeWords(
                    company?.businessName ||
                      company?.companyName ||
                      "Global Securities"
                  )}{" "}
                </Text>{" "}
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
                </Text>{" "}
                {company?.mobileNumber && (
                  <Text style={template18Styles.gstin}>
                    Phone no: {formatPhoneNumber(String(company.mobileNumber))}{" "}
                  </Text>
                )}
                {company?.gstin && (
                  <Text style={template18Styles.gstin}>
                    GSTIN: {company.gstin}{" "}
                  </Text>
                )}{" "}
              </View>
              {/* TAX INVOICE Header (Centered Text) */}{" "}
              <View style={template18Styles.invoiceTitleContainer}>
                {" "}
                <Text style={template18Styles.invoiceTitle}>
                  ========================TAX INVOICE=======================
                </Text>{" "}
              </View>{" "}
              {/* INVOICE # and DATE (Spread Left/Right) */}
              <View style={template18Styles.invoiceMetaRow}>
                {" "}
                <Text style={template18Styles.invoiceMetaTextLeft}>
                  INVOICE #: {transaction.invoiceNumber || "N/A"}
                </Text>{" "}
                <Text style={template18Styles.invoiceMetaTextRight}>
                  DATE:{" "}
                  {new Date(transaction.date)
                    .toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })
                    .toUpperCase()
                    .replace(/\./g, "-")}
                </Text>{" "}
              </View>
              {/* Billed To Section */}
              <View style={template18Styles.billedToBox}>
                {" "}
                <Text style={template18Styles.billedToHeader}>
                  ============================BILLED
                  TO============================
                </Text>{" "}
                <Text style={template18Styles.billedToText}>
                  Name : {capitalizeWords(party?.name || "Jay Enterprises")}
                </Text>{" "}
                {company?.mobileNumber && (
                  <Text>
                    {party?.contactNumber
                      ? formatPhoneNumber(party.contactNumber)
                      : "N/A"}
                  </Text>
                )}{" "}
                {party?.gstin && (
                  <Text style={template18Styles.billedToText}>
                    GSTIN : {party.gstin}
                  </Text>
                )}{" "}
                {party?.pan && (
                  <Text style={template18Styles.billedToText}>
                    PAN : {party.pan}
                  </Text>
                )}{" "}
                <Text style={template18Styles.billedToHeader}>
                  =================================================================
                </Text>{" "}
              </View>
              {/* Items Table Header */}
              <View style={template18Styles.itemsTableHeaderSimple}>
                {" "}
                <Text
                  style={[
                    template18Styles.itemsHeaderColumn,
                    { width: "30%", textAlign: "left" },
                  ]}
                >
                  Items
                </Text>{" "}
                 <Text
                  style={[
                    template18Styles.itemsHeaderColumn,
                    { width: "25%", textAlign: "center" },
                  ]}
                >
                  Amount (Rs.)
                </Text>
                <Text
                  style={[
                    template18Styles.itemsHeaderColumn,
                    { width: "40%", textAlign: "center" },
                  ]}
                >
                  GST
                </Text>
               
                <Text
                  style={[
                    template18Styles.itemsHeaderColumn,
                    { width: "30%", textAlign: "right" },
                  ]}
                >
                  Total(Rs)
                </Text>{" "}
              </View>
              <Text>
                ==========================================================
              </Text>
              {/* Items Table Body */}
              <View style={template18Styles.itemsTableSimple}>
                {" "}
                {pageItems.map((item, index) => (
                  <View
                    key={index}
                    style={template18Styles.itemsTableRowSimple}
                  >
                    {" "}
                    {/* Item Details - Position 1 (25%) */}{" "}
                    <View
                      style={[
                        template18Styles.itemDetailsCell,
                        { width: "30%" },
                      ]}
                    >
                      {" "}
                      <Text style={template18Styles.itemNameText}>
                        {/* ⭐ Used capitalized name from itemsBreakdown */}
                        {capitalizeWords(item.name)}
                      </Text>{" "}
                      {item.itemType !== 'service' && (
                        <Text style={template18Styles.itemSubText}>
                          {formatQuantity(item.quantity || 0, item.unit)}
                        </Text>
                      )}
                      <Text style={template18Styles.itemSubText}>
                        {item.itemType === 'service' ? 'SAC' : 'HSN'}: {item.code || "-"}
                      </Text>{" "}
                    </View>
                       {/* Amount - Position 3 (25%) */}
                    <View
                      style={[
                        template18Styles.itemDetailsCell,
                        { width: "25%", textAlign: "center" },
                      ]}
                    >
                      <Text style={template18Styles.itemSubText}>
                        {formatCurrency(item.pricePerUnit || 0)}
                      </Text>
                    </View>
                    {/* GST - Position 2 (20%) */}
                    <View
                      style={[
                        template18Styles.taxablePlusGSTCell,
                        { width: "40%" },
                      ]}
                    >
                      {isGSTApplicable ? (
                        <>
                          {showIGST ? (
                            <Text style={template18Styles.gstRateText}>
                              IGST-{item.gstRate.toFixed(2)}%
                            </Text>
                          ) : showCGSTSGST ? (
                            <>
                              <Text style={template18Styles.gstRateText}>
                                CGST-{(item.gstRate / 2).toFixed(2)}%
                              </Text>
                              <Text style={template18Styles.gstRateText}>
                                SGST-{(item.gstRate / 2).toFixed(2)}%
                              </Text>
                            </>
                          ) : (
                            <Text style={template18Styles.gstRateText}>No Tax</Text>
                          )}
                        </>
                      ) : (
                        <Text style={template18Styles.gstRateText}>No Tax</Text>
                      )}
                    </View>
                 
                    {/* Total - Position 4 (30%) */}{" "}
                    <Text
                      style={[
                        template18Styles.totalCellSimple,
                        { width: "30%" },
                      ]}
                    >
                      <Text style={template18Styles.taxableValueTextrs}>
                        {formatCurrency(item.total)}
                      </Text>{" "}
                    </Text>{" "}
                  </View>
                ))}{" "}
              </View>
              <View style={template18Styles.invoiceTitleContainer}>
                {" "}
                <Text style={template18Styles.invoiceTitle}>
                  ========================SUMMARY=======================
                </Text>{" "}
              </View>
              {/* Summary Section (Only on last page) */}
              {isLastPage && (
                <View style={template18Styles.summaryContainer}>
                  <Text style={template18Styles.separatorDouble}></Text>
                  <View style={template18Styles.summarySection}>
                    <View style={template18Styles.summaryRow}>
                      <Text style={template18Styles.summaryLabel}>
                        Taxable Amount
                      </Text>
                      <Text style={template18Styles.summaryValue}>
                        Rs {formatCurrency(totalTaxable)}
                      </Text>
                    </View>

                    {showIGST && (
                      <View style={template18Styles.summaryRow}>
                        <Text style={template18Styles.summaryLabel}>
                          Add: IGST
                        </Text>
                        <Text style={template18Styles.summaryValue}>
                          Rs {formatCurrency(totalIGST)}
                        </Text>
                      </View>
                    )}

                    {showCGSTSGST && (
                      <>
                        <View style={template18Styles.summaryRow}>
                          <Text style={template18Styles.summaryLabel}>
                            Add: CGST
                          </Text>
                          <Text style={template18Styles.summaryValue}>
                            Rs {formatCurrency(totalCGST)}
                          </Text>
                        </View>
                        <View style={template18Styles.summaryRow}>
                          <Text style={template18Styles.summaryLabel}>
                            Add: SGST
                          </Text>
                          <Text style={template18Styles.summaryValue}>
                            Rs {formatCurrency(totalSGST)}
                          </Text>
                        </View>
                      </>
                    )}

                    <View style={template18Styles.summaryRow}>
                      <Text style={template18Styles.summaryLabel}>
                        Total Tax
                      </Text>
                      <Text style={template18Styles.summaryValue}>
                        Rs {formatCurrency(totalIGST || totalCGST + totalSGST)}
                      </Text>
                    </View>
                    <View style={template18Styles.summaryRow}>
                      <Text style={template18Styles.summaryLabel}>
                        Total Amount After Tax
                      </Text>
                      <Text style={template18Styles.summaryValue}>
                        Rs {formatCurrency(totalAmount).replace("₹", "")}
                      </Text>
                    </View>
                    <View style={template18Styles.summaryRow}>
                      <Text style={template18Styles.summaryLabel}>
                        GST Payable on Reverse Charge
                      </Text>
                      <Text style={template18Styles.summaryValue}>N.A.</Text>
                    </View>
                    <Text style={template18Styles.separatorDouble}></Text>
                    <View style={template18Styles.summaryRow}>
                      <Text style={template18Styles.summaryLabelGrand}>
                        Grand Total
                      </Text>
                      <Text style={template18Styles.summaryValueGrand}>
                        Rs {formatCurrency(totalAmount).replace("₹", "")}
                      </Text>
                    </View>
                    <Text style={template18Styles.separatorDouble}></Text>
                  </View>

                  {/* --- UPI Payment Section Updated for Slight Left Alignment (Left Aligned + Padding) --- */}
                  {isUpiAvailable && (
                    <View
                      style={[
                        UPI_STYLES.upiSection,
                        { alignItems: "flex-end", marginRight: 90 },
                      ]}
                      wrap={false}
                    >
                      {(bank as any)?.qrCode ? (
                        <View
                          style={{
                            alignItems: "center",
                            justifyContent: "center",
                            padding: 5,
                            marginTop: 4,
                            marginRight: -8,
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

                      {/* UPI ID (Left Aligned via upiTextDetail) */}
                      {bankDataWithUpi.upiDetails.upiId && (
                        <Text style={UPI_STYLES.upiTextDetail}>
                          UPI ID: {bankDataWithUpi.upiDetails.upiId}
                        </Text>
                      )}
                      {bankDataWithUpi.upiDetails.upiName && (
                        <Text style={UPI_STYLES.upiTextDetail}>
                          UPI Name: {bankDataWithUpi.upiDetails.upiName}
                        </Text>
                      )}

                      {/* UPI Contact No (Left Aligned via upiTextDetail) */}
                      {bankDataWithUpi.upiDetails.upiMobile && (
                        <Text style={UPI_STYLES.upiTextDetail}>
                          UPI Mobile No: {bankDataWithUpi.upiDetails.upiMobile}
                        </Text>
                      )}
                    </View>
                  )}
                  {/* --- End UPI Payment Section --- */}
                </View>
              )}{" "}
            </View>{" "}
          </Page>
        );
      })}{" "}
    </Document>
  );
};

export const generatePdfForTemplate18 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  bank?: Bank | null
): Promise<Blob> => {
  const pdfDoc = pdf(
    <Template18PDF
      transaction={transaction}
      company={company}
      party={party}
      shippingAddress={shippingAddress}
      bank={bank}
    />
  );

  return await pdfDoc.toBlob();
};

export default Template18PDF;
