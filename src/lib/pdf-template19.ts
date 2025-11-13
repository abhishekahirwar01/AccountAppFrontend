// template19.ts
import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
} from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  renderNotes,
  getUnifiedLines,
  invNo,
  getBillingAddress,
  getShippingAddress,
  calculateGST,
  prepareTemplate8Data,
  formatCurrency,
  numberToWords,
  
  getStateCode,
} from "./pdf-utils";
import { capitalizeWords, parseNotesHtml } from "./utils";
import { styleText } from "util";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "./pdf-utils";

// --- NEW IMPORTS FOR ADVANCED TERMS & CONDITIONS RENDERING ---
import {
    parseHtmlToElementsForJsPDF,
    renderParsedElementsWithJsPDF,
} from "./jspdf-html-renderer";
// -----------------------------------------------------------

// FIX: Interfaces simplified to minimally include 'email' and core fields.
// We use type assertions inside the function to handle dynamic/non-standard fields (like panNumber, stateCode).
interface ExtendedCompany extends Company {
  email?: string;
  panNumber?: string;
  stateCode?: string;
}
interface ExtendedParty extends Party {
  email?: string;
  panNumber?: string;
  stateCode?: string;
}
interface ExtendedShippingAddress extends ShippingAddress {
  stateCode?: string;
}

interface BaseLineItem {
  name: string;
  description: string;
  quantity: number;
  pricePerUnit: number;
  amount: number;
  gstPercentage: number;
  lineTax: number;
  lineTotal: number;
}
interface DynamicLineItem extends BaseLineItem {
  hsnSac?: string;
  unit?: string;
}
interface DynamicTransaction extends Transaction {
  poNumber?: string;
  poDate?: string | Date | number;
  eWayBillNo?: string;
  notes?: string;
}

// --- Constants & Placeholders (UI unchanged) ---
const LOGO_DATA_URL = "data:image/png;base64,...";
const STAMP_DATA_URL = "data:image/png;base64,...";
const QR_CODE_DATA_URL = "data:image/png;base64,...";

// // Hardcoded Terms for default use when transaction.notes is empty (NO LONGER USED AS FALLBACK)
// const IMAGE_DEFAULT_TERMS = `Subject to our Home Jurisdiction.
// Our Responsibility Ceases as soon as goods leaves our Premises.
// Goods once sold will not taken back.
// Delivery Ex-Premises.`;

export const generatePdfForTemplate19 = async (
  transaction: DynamicTransaction,
  company: ExtendedCompany | null | undefined,
  party: ExtendedParty | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ExtendedShippingAddress | null,
  bank?: Bank | null | undefined
): Promise<jsPDF> => {
  console.log("bank details from template 19 :", bank);

  // Helper function to handle undefined/null values
  const handleUndefined = (value: any, fallback: string = "-"): string => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === "string" && value.trim() === "") return fallback;
    if (value === "N/A") return fallback; // Also handle "N/A" if you want
    return value.toString();
  };

  // --- START: Bank Details N/A fallback (Modified from template 16) ---
  const getBankDetails = () => ({
    name: "Bank Details Not Available",
    branch: "-",
    accNumber: "-",
    ifsc: "-",
    upiId: "-",
  });
  // --- END: Bank Details N/A fallback ---
  const shouldHideBankDetails = transaction.type === "proforma";

  // ---------------- DYNAMIC HELPERS ----------------
  const _getGSTIN = (x?: any): string | null =>
    x?.gstin ??
    x?.gstIn ??
    x?.gstNumber ??
    x?.gst_no ??
    x?.gst ??
    x?.gstinNumber ??
    x?.tax?.gstin ??
    null;

  const money = (n: number) =>
    Number(n || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const fmtDate = (d?: string | number | Date | null) =>
    d
      ? new Intl.DateTimeFormat("en-GB").format(new Date(d)).replace(/\//g, "-")
      : "N/A";

  // Use the actual numberToWords function from pdf-utils
  const convertNumberToWords = (n: number): string => {
    return numberToWords(n);
  };

  // Use template8 data preparation logic
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
  } = prepareTemplate8Data(transaction, company, party, shippingAddress);

  const logoUrl = company?.logo
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`
    : null;

  // Convert itemsWithGST to the format expected by template19
  const lines = itemsWithGST.map((item) => ({
    // ⭐ Apply capitalizeWords
    name: capitalizeWords(item.name),
    description: item.description || "",
    quantity: item.quantity || 0,
    pricePerUnit: item.pricePerUnit || 0,
    amount: item.taxableValue,
    gstPercentage: item.gstRate,
    lineTax: item.cgst + item.sgst + item.igst,
    lineTotal: item.total,
    hsnSac: item.code || "N/A",
    unit: item.unit || "PCS",
    formattedDescription: item.description
      ? item.description.split("\n").join(" / ")
      : "",
  }));

  const subtotal = totalTaxable;
  const tax = totalCGST + totalSGST + totalIGST;
  const invoiceTotal = totalAmount;
  const gstEnabled = isGSTApplicable;
  const totalQuantity = totalQty;

  const totalTaxableAmount = formatCurrency(subtotal);
  const finalTotalAmount = formatCurrency(invoiceTotal);

  const shippingAddressSource = shippingAddress;

  const billingAddress = capitalizeWords(getBillingAddress(party));

  const shippingAddressStr = capitalizeWords(
    getShippingAddress(shippingAddressSource, billingAddress)
  );

  const companyGSTIN = _getGSTIN(company);
  const partyGSTIN = _getGSTIN(party);

  // ----------------- OPTIMIZED COLUMN WIDTHS -----------------
  const getColWidths = (availableWidth: number) => {
    if (showCGSTSGST) {
      // Sr.No | Name | HSN | Rate | Qty | Taxable | CGST% | CGST Amt | SGST% | SGST Amt | Total
      const fixedSum = 28 + 18 + 48 + 26 + 55 + 45 + 50 + 55 + 45 + 55; // 433
      const nameColWidth = availableWidth - fixedSum;
      return [23, nameColWidth, 40, 40, 33, 54, 35, 55, 35, 55, 55];
    } else if (showIGST) {
      // Sr.No | Name | HSN | Rate | Qty | Taxable | IGST% | IGST Amt | Total
      const fixedSum = 28 + 48 + 45 + 28 + 55 + 40 + 55 + 55; // 348
      const nameColWidth = availableWidth - fixedSum;
      return [28, nameColWidth, 42, 40, 37, 55, 40, 55, 58];
    } else {
      // Sr.No | Name | HSN | Rate | Qty | Taxable | Total
      const fixedSum = 28 + 100 + 40 + 33 + 55 + 55; // 253
      const nameColWidth = availableWidth - fixedSum;
      return [28, nameColWidth, 52, 50, 35, 70, 77];
    }
  };
  // ----------------- END OPTIMIZED WIDTHS -----------------

  // --- Dynamic Invoice Data Object ---
  const invoiceData = {
    invoiceNumber: handleUndefined(invNo(transaction)),
    date: handleUndefined(fmtDate(transaction.date) || fmtDate(new Date())),
    poNumber: handleUndefined(transaction.poNumber, "-"),
    poDate: handleUndefined(fmtDate(transaction.poDate), "-"),
    eWayNo: handleUndefined(transaction.eWayBillNo, "-"),

    placeOfSupply: handleUndefined(
      shippingAddress?.state
        ? `${capitalizeWords(shippingAddress.state)} (${getStateCode(shippingAddress.state) || "-"
        })`
        : "-"
    ),

    company: {
      name: handleUndefined(
        capitalizeWords(company?.businessName),
        "Company Name"
      ),
      address: handleUndefined(
        capitalizeWords(company?.address),
        "Address not available"
      ),
      gstin: handleUndefined(companyGSTIN, "-"),
      pan: handleUndefined(company?.panNumber, "-"),
      state: handleUndefined(
        company?.addressState
          ? `${capitalizeWords(company?.addressState)} (${getStateCode(company?.addressState) || "-"
          })`
          : "-"
      ),
      city: handleUndefined(capitalizeWords(company?.City), "-"),
      phone: handleUndefined(company?.mobileNumber, "-"),
      // email: handleUndefined(company?.email || company?.emailId, "-"),
    },
    invoiceTo: {
      name: handleUndefined(capitalizeWords(party?.name), "Client Name"),
      billingAddress: handleUndefined(billingAddress, "Address not available"),
      gstin: handleUndefined(partyGSTIN, "-"),
      pan: handleUndefined(party?.panNumber, "-"),
      state: handleUndefined(
        party?.state
          ? `${capitalizeWords(party.state)} (${getStateCode(party.state) || "-"
          })`
          : "-"
      ),
      email: handleUndefined(party?.email, "-"),
    },
    shippingAddress: {
      name: handleUndefined(
        capitalizeWords((shippingAddressSource as any)?.name || party?.name),
        "Client Name"
      ),
      address: handleUndefined(shippingAddressStr, "Address not available"),
      state: handleUndefined(
        (shippingAddressSource as any)?.state
          ? `${capitalizeWords((shippingAddressSource as any).state)} (${getStateCode((shippingAddressSource as any).state) || "-"
          })`
          : party?.state
            ? `${capitalizeWords(party.state)} (${getStateCode(party.state) || "-"
            })`
            : "-"
      ),
    },
  };

  // ---------------- REMOVED: Old parseNotesHtml logic (Now using advanced HTML renderer) ----------------
  // const {
  //   title,
  //   isList,
  //   items: notesItems,
  // } = parseNotesHtml(transaction.notes || "");
  // const termsTitle = title || "Terms and Conditions";
  // const termsList = notesItems;
  // ---------------- END REMOVED ----------------

  // ---------------- doc + theme ----------------
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const getW = () => doc.internal.pageSize.getWidth();
  const M = 36;
  const totalPageWidth = getW();
  const availableWidth = totalPageWidth - M * 2;

  const BLUE: [number, number, number] = [24, 115, 204];
  const DARK: [number, number, number] = [45, 55, 72];
  const MUTED: [number, number, number] = [105, 112, 119];
  const BORDER: [number, number, number] = [220, 224, 228];

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // ---------- header drawer (DYNAMIC) ----------
  // Helper to draw company header on each page and return bottom Y
  const drawStaticHeader = (): number => {
    let y = M;
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 110, 200);
    doc.text("TAX INVOICE", pageWidth / 2, y, { align: "center" });
    y += 24;

    // Company Details
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);

    doc.text(capitalizeWords(invoiceData.company.name.toUpperCase()), M, y);
    y += 16;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (invoiceData.company.gstin !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN: `, M, y);
      doc.setFont("helvetica", "normal");
      doc.text(
        ` ${ invoiceData.company.gstin}`,
        M + 4 + doc.getTextWidth("GSTIN"),
        y
      );
      y += 12;
    }

    const headerAddr = doc.splitTextToSize(
      capitalizeWords(invoiceData.company.address),
      250
    );
    if (headerAddr.length) {
      for (let i = 0; i < Math.min(headerAddr.length, 2); i++) {
        doc.text(headerAddr[i], M, y);
        y += 1;
      }
    }
    y += 12;
    // ⭐ Apply capitalizeWords
    if (invoiceData.company.city !== "N/A") {
      doc.text(`${capitalizeWords(invoiceData.company.city)}`, M, y);
    }
    y += 1;
    if (invoiceData.company.pan !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text(`PAN:`, M, y + 11);
      doc.setFont("helvetica", "normal");
      doc.text(
        ` ${invoiceData.company.pan}`,
        M + doc.getTextWidth("PAN:"),
        y + 11
      );
      y += 12;
    }
    if (invoiceData.company.phone !== "N/A") {
      y += 12;
      doc.setFont("helvetica", "bold");
      doc.text(`Phone:`, M, y);
      doc.setFont("helvetica", "normal");
      doc.text(
        ` ${invoiceData.company.phone ? formatPhoneNumber(invoiceData.company.phone) : "-"}`,
        M + 4 + doc.getTextWidth("Phone:"),
        y
      );
    }
    y += 12;
    // ⭐ Apply capitalizeWords
    if (invoiceData.company.state !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text(`State:`, M, y);
      doc.setFont("helvetica", "normal");
      doc.text(
        ` ${capitalizeWords(invoiceData.company.state)}`,
        M + 4 + doc.getTextWidth("State:"),
        y
      );
    }
    y += 6;

    // Logo
    const logoSize = 70;
    const logoX = getW() - M - logoSize;
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, "PNG", logoX, M + 20, logoSize, logoSize);
      } catch (e) {
        // // Fallback to default logo
        // doc.setFillColor(242, 133, 49);
        // doc.triangle(
        //   logoX + logoSize * 0.4,
        //   M,
        //   logoX + logoSize,
        //   M,
        //   logoX + logoSize * 0.4,
        //   M + logoSize,
        //   "F"
        // );
        // doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
        // doc.triangle(
        //   logoX,
        //   M,
        //   logoX + logoSize * 0.6,
        //   M,
        //   logoX,
        //   M + logoSize,
        //   "F"
        // );
      }
    } else {
      // Default logo
      //       doc.setFillColor(242, 133, 49);
      //       doc.triangle(
      //         logoX + logoSize * 0.4,
      //         M,
      //         logoX + logoSize,
      //         M,
      //         logoX + logoSize * 0.4,
      //         M + logoSize,
      //         "F"
      //       );
      //       doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
      //       doc.triangle(
      //         logoX,
      //         M,
      //         logoX + logoSize * 0.6,
      //         M,
      //         logoX,
      //         M + logoSize,
      //         "F"
      //       );
    }

    // Separator
    y = Math.max(y, M + logoSize + 20);
    doc.setDrawColor(0, 110, 200);
    doc.setLineWidth(1.5);
    doc.line(M, y + 4, getW() - M, y + 4);

    return y + 20;
  };

  // Helper to draw customer + shipping + invoice meta block; returns bottom Y
  const drawCustomerMetaBlock = (startY: number): number => {
    let detailY = startY;
    // LEFT: Customer Details
    let leftY = detailY;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 110, 200);
    doc.setFontSize(10);
    // MODIFIED LINE: Changed header text to match the image
    doc.text("Details of Buyer | Billed to :", M, leftY);
    leftY += 15;

    // ⭐ Buyer's Name with font size 14
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    doc.setFont("helvetica", "bold");
    doc.text(capitalizeWords(invoiceData.invoiceTo.name), M, leftY);
    leftY += 12; // Increased spacing for larger font

    // ⭐ Other details with font size 10
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // ⭐ Apply capitalizeWords
    const billAddressLines = doc.splitTextToSize(
      capitalizeWords(invoiceData.invoiceTo.billingAddress),
      200
    );
    if (billAddressLines.length) doc.text(billAddressLines, M, leftY);
    leftY += billAddressLines.length * 12;

    // if (
    //   invoiceData.invoiceTo.email !== "N/A" ? invoiceData.invoiceTo.email : "-"
    // ) {
    //   doc.setFont("helvetica", "bold");
    //   doc.text(`Email:`, M, leftY);
    //   doc.setFont("helvetica", "normal");
    //   doc.text(
    //     ` ${invoiceData.invoiceTo.email}`,
    //     M + 2 + doc.getTextWidth("Email:"),
    //     leftY
    //   );
    //   leftY += 12;
    // }

    doc.setFont("helvetica", "bold");
    doc.text(`Phone No:`, M, leftY);
    doc.setFont("helvetica", "normal");
    doc.text(
      ` ${handleUndefined(party?.contactNumber ? formatPhoneNumber(party.contactNumber) : "-")}`,
      M + 2 + doc.getTextWidth("Phone No:"),
      leftY
    );
    leftY += 12;

    if (invoiceData.invoiceTo.gstin !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN:`, M, leftY);
      doc.setFont("helvetica", "normal");
      doc.text(
        ` ${invoiceData.invoiceTo.gstin}`,
        M + 2 + doc.getTextWidth("GSTIN:"),
        leftY
      );
      leftY += 12;
    }

    if (invoiceData.invoiceTo.pan !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text(`PAN:`, M, leftY);
      doc.setFont("helvetica", "normal");
      doc.text(
        ` ${invoiceData.invoiceTo.pan}`,
        M + 2 + doc.getTextWidth("PAN:"),
        leftY
      );
      leftY += 12;
    }

    // ⭐ Apply capitalizeWords
    // State (This value already includes state code or is 'N/A')
    // const state =
    //   invoiceData.invoiceTo.state !== "N/A" ? invoiceData.invoiceTo.state : "-";
    // doc.setFont("helvetica", "bold");
    // doc.text(`State:`, M, leftY);
    // doc.setFont("helvetica", "normal");
    // doc.text(` ${state}`, M + 2 + doc.getTextWidth("State:"), leftY);
    // leftY += 12;

    // ⭐ Apply capitalizeWords
const placeOfSupply = shippingAddress?.state
  ? `${shippingAddress.state} (${getStateCode(shippingAddress.state) || "-"})`
  : party?.state
  ? `${party.state} (${getStateCode(party.state) || "-"})`
  : "-";

doc.setFont("helvetica", "bold");
doc.text(`Place of Supply:`, M, leftY);
doc.setFont("helvetica", "normal");
doc.text(
  ` ${placeOfSupply}`,
  M + 4 + doc.getTextWidth("Place of Supply:"),
  leftY
);
leftY += 16;

    // MIDDLE: Shipping (NOW MOVED BELOW)

    // Use the current 'leftY' as the start for the next block, ensuring a small gap
    let shippingY = leftY + 9;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 110, 200);
    doc.setFontSize(10);
    // MODIFIED LINE: Changed header text to match the image
    doc.text("Details of Consignee | Shipped to :", M, shippingY); // Moved to column M
    shippingY += 15;

    // Shipping name with font size 14
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.text(capitalizeWords(invoiceData.shippingAddress.name), M, shippingY);
    shippingY += 12;

    // Other shipping details with font size 10
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    // Address
    let addressString = capitalizeWords(invoiceData.shippingAddress.address);
    if (
      addressString === "" ||
      addressString.toLowerCase().includes("not available") ||
      addressString.toLowerCase().includes("address missing")
    ) {
      addressString = "Address not available";
    }
    const shipAddressLines = doc.splitTextToSize(addressString, 200);
    if (shipAddressLines.length) doc.text(shipAddressLines, M + 0, shippingY);
    shippingY += shipAddressLines.length * 12;
     // Country
    if (company?.Country !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text(`Country:`, M, shippingY);
      doc.setFont("helvetica", "normal");
      doc.text(
        ` ${company?.Country}`,
        M + 2 + doc.getTextWidth("Country:"),
        shippingY
      );
      shippingY += 12;
    }

    // Phone
    const phoneraw =
      (shippingAddressSource as any)?.contactNumber ||
      (shippingAddressSource as any)?.phone ||
      party?.contactNumber ||
      "-";
      const phone =
  phoneraw && phoneraw !== "-"
    ? formatPhoneNumber(String(phoneraw))
    : "-";
    doc.setFont("helvetica", "bold");
    doc.text(`Phone No:`, M, shippingY);
    doc.setFont("helvetica", "normal");
    doc.text(
      ` ${handleUndefined(phone)}`,
      M + 2 + doc.getTextWidth("Phone No:"),
      shippingY
    );
    shippingY += 12;

    // GSTIN
    const shippingGSTIN = _getGSTIN(shippingAddressSource) || partyGSTIN || "-";
    if (shippingGSTIN !== "N/A" && shippingGSTIN !== "-") {
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN:`, M, shippingY);
      doc.setFont("helvetica", "normal");
      doc.text(` ${shippingGSTIN}`, M + doc.getTextWidth("GSTIN:"), shippingY);
      shippingY += 12;
    } else {
      doc.setFont("helvetica", "bold");
      doc.text(`GSTIN:`, M, shippingY);
      doc.setFont("helvetica", "normal");
      doc.text(` -`, M + 2 + doc.getTextWidth("GSTIN:"), shippingY);
      shippingY += 12;
    }

    // State
    if (invoiceData.shippingAddress.state !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text(`State:`, M, shippingY);
      doc.setFont("helvetica", "normal");
      doc.text(
        ` ${invoiceData.shippingAddress.state}`,
        M + 2 + doc.getTextWidth("State:"),
        shippingY
      );
      shippingY += 12;
    }

    

    // Track the new effective bottom Y for the left/middle content
    const contentBottomY = shippingY;

    // RIGHT: Invoice meta
    const rightX = getW() - M - 120;
    let rightY = detailY;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const metaLabels = [
      "Invoice # :",
      "Invoice Date :",
      "P.O. No :",
      "P.O. Date :",
      "E-Way No :",
    ];
    const metaValues = [
      handleUndefined(invoiceData.invoiceNumber),
      handleUndefined(invoiceData.date),
      handleUndefined(invoiceData.poNumber),
      handleUndefined(invoiceData.poDate),
      handleUndefined(invoiceData.eWayNo),
    ];
    for (let i = 0; i < metaLabels.length; i++) {
      doc.text(metaLabels[i], rightX, rightY);
      let displayValue = metaValues[i];

      // Check if the value is "N/A" and replace it with "-"
      if (displayValue === "N/A") {
        displayValue = "-";
      }

      doc.setFont("helvetica", "normal");
      doc.text(displayValue, rightX + 60, rightY); // Using the modified displayValue
      doc.setFont("helvetica", "bold");
      rightY += 14;
    }

    // The final bottom Y is the maximum of the content block and the meta block
    return Math.max(contentBottomY, rightY);
  };

  // --- REUSABLE HEADER DRAWING FUNCTION FOR PAGE BREAKS ---
  const drawHeaderAndCustomerBlocks = (isFirstPage: boolean = true) => {
    // Draw header
    const hdrY = drawStaticHeader();
    // Draw customer/meta block
    return drawCustomerMetaBlock(hdrY);
  };
  // ---------------------------------------------------------

  // Draw header on first page and capture bottom Y
  let headerBottomY = drawStaticHeader();

  // Draw block on first page and get its bottom for table margin
  let blockBottomY = drawCustomerMetaBlock(headerBottomY);

  // Calculate the fixed height of the repeating header blocks for page break management
  const REPEATING_HEADER_HEIGHT = blockBottomY;

  let cursorY = blockBottomY;

  // Get final column widths
  const colWidths = getColWidths(availableWidth);

  // ---------------- items table (DYNAMIC with GST logic) ----------------

  // Build dynamic column styles based on GST type
  const columnStyles: any = {};
  colWidths.forEach((width, index) => {
    columnStyles[index] = {
      cellWidth: width,
      halign:
        index === 0 || index === 2 || index === 4
          ? "center"
          : index >= 3 && index <= 9
            ? "center"
            : "center",
    };
  });

  // Override for name column (index 1) to be left-aligned
  columnStyles[1] = {
    cellWidth: colWidths[1],
    halign: "left",
  };

  // Build dynamic headers based on GST type
  const buildHeaders = () => {
    const baseHeaders = [
      "Sr.No",
      "Name of Product / Service",
      "HSN/SAC",
      "Rate (Rs.)",
      "Qty",
      "Taxable Value (Rs.)",
    ];

    if (showIGST) {
      return [...baseHeaders, "IGST %", "IGST Amount (Rs.)", "Total (Rs.)"];
    } else if (showCGSTSGST) {
      return [
        ...baseHeaders,
        "CGST%",
        "CGST Amount (Rs.)",
        "SGST%",
        "SGST Amount (Rs.)",
        "Total (Rs.)",
      ];
    } else {
      return [...baseHeaders, "Total (Rs.)"];
    }
  };

  // Build dynamic body data based on GST type
  const buildBodyData = () => {
    return lines.map((it: DynamicLineItem, i: number) => {
      const nameAndDesc = handleUndefined(capitalizeWords(it.name || ""));

      const baseData = [
        i + 1,
        nameAndDesc,
        handleUndefined(it.hsnSac),
        money(it.pricePerUnit),
        formatQuantity(Number(it.quantity), handleUndefined(it.unit, "pcs")),
        money(it.amount),
      ];

      if (showIGST) {
        return [
          ...baseData,
          `${it.gstPercentage || 0}`,
          money(it.lineTax),
          money(it.lineTotal),
        ];
      } else if (showCGSTSGST) {
        const cgst = (it.lineTax || 0) / 2;
        const sgst = (it.lineTax || 0) / 2;
        return [
          ...baseData,
          `${(it.gstPercentage || 0) / 2}`,
          money(cgst),
          `${(it.gstPercentage || 0) / 2}`,
          money(sgst),
          money(it.lineTotal),
        ];
      } else {
        return [...baseData, money(it.lineTotal)];
      }
    });
  };

  autoTable(doc, {
    startY: cursorY,
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      cellPadding: {
        top: 4,
        right: 1,
        bottom: 4,
        left: 1,
      },
      lineColor: BORDER,
      lineWidth: 0.3,
      textColor: DARK,
      valign: "top",
      halign: "center",
    },
    headStyles: {
      fillColor: [0, 110, 200],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
      minCellHeight: 24,
      halign: "center",
      valign: "middle",
    },
    columnStyles,
    head: [buildHeaders()],
    body: buildBodyData(),
    didParseCell: (d) => {
      if (d.column.dataKey === 1) {
        d.cell.styles.fontSize = 7.5;
        d.cell.styles.halign = "left";
        d.cell.styles.valign = "middle";
      }
    },
    didDrawPage: (data) => {
      // Redraw header and customer/meta block on each new page
      const hdrY = drawStaticHeader();
      drawCustomerMetaBlock(hdrY);
    },
    // IMPORTANT: Use the calculated repeating height for the top margin
    margin: { left: M, right: M, top: REPEATING_HEADER_HEIGHT },
    theme: "grid",
  });

  let afterTableY = (doc as any).lastAutoTable.finalY || cursorY + 20;

  // --------------- Totals Summary Block (DYNAMIC) ---------------
  const totalsW = 200;
  const totalsX = getW() - M - totalsW;

  // Ensure there is space for totals, else new page with header
  const pageH = doc.internal.pageSize.getHeight();
  doc.setLineWidth(1);
  
  const ensureSpace = (needed: number): number => {
    const H = doc.internal.pageSize.getHeight();
    const bottomSafe = H - M;
    if (cursorY + needed > bottomSafe) {
      doc.addPage();
      const newHeaderBottomY = drawStaticHeader();
      drawCustomerMetaBlock(newHeaderBottomY);
      return REPEATING_HEADER_HEIGHT;
    }
    return cursorY;
  };

  // We need ~140pt for the summary block and words in the old code.
  // With the new TOTAL line, we need an extra 18pt. Let's make it 160pt total.
  if (afterTableY + 160 > pageH - M) {
    cursorY = afterTableY;
    cursorY = ensureSpace(160);
    afterTableY = cursorY;
  } else {
    cursorY = afterTableY;
  }

  const totalsY = afterTableY + 10;

  const putTotalLine = (
    label: string,
    val: string,
    y: number,
    bold = false
  ) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(8);
    doc.text(label, totalsX + 12, y);
    doc.text(val, totalsX + totalsW - 12, y, { align: "right" });
  };

  let currentTotalsY = totalsY;

  // Row 1: Taxable Amount
  doc.setDrawColor(...BORDER);
  doc.setFillColor(255, 255, 255);
  doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
  putTotalLine(
    "Taxable Amount",
    `Rs.${formatCurrency(subtotal)}`,
    currentTotalsY + 12
  );
  currentTotalsY += 18;

  // GST breakdown rows (only if GST is applicable)
  if (isGSTApplicable) {
    if (showIGST) {
      // IGST row
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
      putTotalLine(
        "IGST",
        `Rs.${formatCurrency(totalIGST)}`,
        currentTotalsY + 12
      );
      currentTotalsY += 18;
    } else if (showCGSTSGST) {
      // CGST row
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
      putTotalLine(
        "CGST",
        `Rs.${formatCurrency(totalCGST)}`,
        currentTotalsY + 12
      );
      currentTotalsY += 18;

      // SGST row
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
      putTotalLine(
        "SGST",
        `Rs.${formatCurrency(totalSGST)}`,
        currentTotalsY + 12
      );
      currentTotalsY += 18;
    }
  }

  // Final Total Row
  doc.setFillColor(255, 255, 255);
  doc.rect(totalsX, currentTotalsY, totalsW, 20, "FD");

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  doc.text("Total", totalsX + 12, currentTotalsY + 14);
  doc.text(
    `Rs.${formatCurrency(invoiceTotal)}`,
    totalsX + totalsW - 12,
    currentTotalsY + 14,
    { align: "right" }
  );

  currentTotalsY += 20; // Increased height
  // ⭐ MODIFICATION END

  // Logo
  // const logoSize = 60;
  // const logoX = getW() - M - logoSize;
  // if (logoUrl) {
  //   try {
  //     doc.addImage(logoUrl, "PNG", logoX, M, logoSize, logoSize);
  //   } catch (e) {
  //     // // Fallback to default logo
  //     // doc.setFillColor(242, 133, 49);
  //     // doc.triangle(
  //     //   logoX + logoSize * 0.4,
  //     //   M,
  //     //   logoX + logoSize,
  //     //   M,
  //     //   logoX + logoSize * 0.4,
  //     //   M + logoSize,
  //     //   "F"
  //     // );
  //     // doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
  //     // doc.triangle(
  //     //   logoX,
  //     //   M,
  //     //   logoX + logoSize * 0.6,
  //     //   M,
  //     //   logoX,
  //     //   M + logoSize,
  //     //   "F"
  //     // );
  //   }
  // }

  // Total Items / Qty line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Total Items / Qty : ${totalItems} / ${totalQuantity % 1 === 0 ? totalQuantity.toFixed(0) : totalQuantity.toFixed(2)}`,
    M,
    afterTableY + 16
  );
  // Amount in Words
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text("Total amount (in words):", M, currentTotalsY + 13);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    ` ${convertNumberToWords(invoiceTotal)}`,
    M + 106,
    currentTotalsY + 13,
    { maxWidth: 420 }
  );

  cursorY = currentTotalsY + 25;
  doc.setDrawColor(0, 110, 200);
  doc.setLineWidth(1);
  doc.line(M, cursorY, getW() - M, cursorY);
  cursorY += 15;
  
  // ---------------- Bank Details & UPI (Left Block) and Signature (Right Block) ----------------

  
const bankBlockH = 90;
const requiredFooterSpace = bankBlockH + 10;

cursorY = ensureSpace(requiredFooterSpace);

const blockY = cursorY + 10;

// --- Dynamic Bank Details Acquisition (UNCHANGED) ---
const dynamicBankDetails = (() => {
    // Check if bank object exists and has data
    if (!bank || typeof bank !== "object") {
        return {
            name: "Bank Details Not Available",
            branch: "-",
            accNumber: "-",
            ifsc: "-",
            upiId: "-",
            upiName: "-",
            upiMobile: "-",
            qrCode: null,
        };
    }

    const bankObj = bank as any;

    // Check if any bank details are available
    const hasBankDetails =
        bankObj.bankName ||
        bankObj.branchName ||
        bankObj.branchAddress ||
        bankObj.accountNumber ||
        bankObj.accountNo ||
        bankObj.ifscCode ||
        bankObj.upiDetails?.upiId ||
        bankObj.upiDetails?.upiName ||
        bankObj.upiDetails?.upiMobile ||
        bankObj.upiId;

    if (!hasBankDetails) {
        return {
            name: "Bank Details Not Available",
            branch: "-",
            accNumber: "-",
            ifsc: "-",
            upiId: "-",
            upiName: "-",
            upiMobile: "-",
            qrCode: bankObj.qrCode || null,
        };
    }

    // Extract account number from multiple possible fields
    const accountNumber =
        bankObj.accountNo ||
        bankObj.accountNumber ||
        bankObj.account_number ||
        "-";

    // Extract UPI details
    const upiId =
        bankObj.upiDetails?.upiId ||
        bankObj.upiId ||
        bankObj.upi_id ||
        "-";
    
    const upiName = bankObj.upiDetails?.upiName || "-";
    const upiMobile = bankObj.upiDetails?.upiMobile || "-";

    return {
        name: handleUndefined(capitalizeWords(bankObj.bankName)),
        branch: handleUndefined(
            capitalizeWords(bankObj.branchName || bankObj.branchAddress)
        ),
        accNumber: handleUndefined(String(accountNumber)),
        ifsc: handleUndefined(capitalizeWords(bankObj.ifscCode)),
        upiId: handleUndefined(String(upiId)),
        upiName: handleUndefined(capitalizeWords(upiName)),
        upiMobile: handleUndefined(String(upiMobile)),
        qrCode: bankObj.qrCode || null,
    };
})();

const areBankDetailsAvailable =
    dynamicBankDetails.name !== "Bank Details Not Available";
// --- END Dynamic Bank Details Acquisition ---

// LEFT: Bank Details
let bankY = blockY;

doc.setFont("helvetica", "bold");
doc.setTextColor(0, 0, 0);
doc.setFontSize(10);
doc.text("Bank Details:", M, bankY - 6);

bankY += 12;

// Bank Details Table-like layout
let bankDetailY = bankY;
const bankX = M;

doc.setFontSize(8);

const putBankDetail = (label: string, val: string, y: number, maxWidth?: number) => {
    // Only print if the value is NOT "-" (i.e., actually available)
    if (val === "-") return y; 
    
    doc.setFont("helvetica", "bold");
    doc.text(label, bankX, y);

    doc.setFont("helvetica", "normal");
    
    // ⭐ MODIFICATION HERE: Increased horizontal offset from 50 to 65
    const valueX = bankX + 65; 
    
    // Use splitTextToSize if maxWidth is provided to wrap text
    if (maxWidth) {
        const lines = doc.splitTextToSize(val, maxWidth);
        doc.text(lines, valueX, y);
        return y + (lines.length * 10); // Adjust spacing based on wrapped lines
    } else {
        doc.text(val, valueX, y);
        return y + 12; // Return the new Y position
    }
};

if (areBankDetailsAvailable) {
    // Bank Details
    bankDetailY = putBankDetail("Bank Name:", dynamicBankDetails.name, bankDetailY);
    bankDetailY = putBankDetail("Branch:", dynamicBankDetails.branch, bankDetailY, 160); 
    bankDetailY = putBankDetail("IFSC:", dynamicBankDetails.ifsc, bankDetailY);
    bankDetailY = putBankDetail("Acc. Number:", dynamicBankDetails.accNumber, bankDetailY);
    
    // UPI Details (added after bank details)
    bankDetailY = putBankDetail("UPI ID:", dynamicBankDetails.upiId, bankDetailY);
    bankDetailY = putBankDetail("UPI Name:", dynamicBankDetails.upiName, bankDetailY);
    bankDetailY = putBankDetail("UPI Mobile:", dynamicBankDetails.upiMobile, bankDetailY);
} else {
    doc.setFont("helvetica");
    doc.setFontSize(8);
    doc.setTextColor(...DARK);
    doc.text("No bank details available", bankX, bankDetailY);
    bankDetailY += 40;
}

// CENTER: QR Code (UNCHANGED)
const qrSize = 80;
const centerX = getW() / 2;

if (dynamicBankDetails.qrCode) {
    const qrX = centerX - qrSize / 3;
    const qrY = blockY + 4;
    
    // QR Code Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const qrLabelWidth = doc.getTextWidth("QR Code");
    doc.text("QR Code", centerX - qrLabelWidth / 6, qrY - 8);
    
    // Add QR Code Image
    try {
        const qrCodeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${dynamicBankDetails.qrCode}`;
        doc.addImage(qrCodeUrl, 'PNG', qrX, qrY, qrSize, qrSize - 12);
    } catch (error) {
        console.error("Failed to add QR code image:", error);
        // Fallback: Draw placeholder rectangle
        doc.setDrawColor(220, 224, 228);
        doc.setFillColor(240, 240, 240);
        doc.setLineWidth(0.1);
        doc.rect(qrX, qrY, qrSize, qrSize, "FD");
    }
}

// RIGHT: Signature Block (UNCHANGED)
const sigX = getW() - M - 150;
doc.setFont("helvetica", "normal");
doc.setTextColor(0, 0, 0);
doc.setFontSize(10);

// Company Name ko split karo agar lamba hai
const maxNameWidthForSign2 = 120; // Signature width ke barabar rakha
const companyNameLinesForSign2 = doc.splitTextToSize(
    `For ${capitalizeWords(invoiceData.company.name)}`,
    maxNameWidthForSign2
);

let currentBlockY = blockY;


companyNameLinesForSign2.forEach((line: string) => {
    doc.text(line, sigX + 30, currentBlockY);
    currentBlockY += 8; 
});




const sigHeight = 50;
const sigWidth = 120;
doc.setDrawColor(...BORDER);
doc.setLineWidth(0.1);
doc.rect(sigX + 30, currentBlockY, sigWidth, sigHeight, "S");

cursorY = Math.max(bankY + qrSize, currentBlockY + sigHeight);

 

  const renderHtmlNotesForJsPDF = (
    doc: jsPDF,
    htmlNotes: string,
    startX: number,
    startY: number,
    maxWidth: number,
    pageWidth: number,
    pageHeight: number,
    drawHeader: (isFirstPage: boolean) => void 
  ): number => {
    const elements = parseHtmlToElementsForJsPDF(htmlNotes, 8);
    
    return renderParsedElementsWithJsPDF(
      doc,
      elements,
      startX,
      startY,
      maxWidth,
      pageWidth,
      pageHeight,
      drawHeader
    );
  };

  // ---------------- Terms and Conditions (ADVANCED HTML RENDERING) ----------------
const termsHeightEstimate = 100;

// *** FIX: Move declaration of TERMS_COL_WIDTH here ***
const TERMS_COL_WIDTH = 520;
// ****************************************************

// 1. Ensure space for the terms block
cursorY = ensureSpace(termsHeightEstimate);

// --- ADDED: Horizontal Line and Top Margin Logic ---
const LINE_Y_POSITION = cursorY + 20; 
doc.setDrawColor(0, 110, 200); // Set line color (using the blue from the header)
doc.setLineWidth(1); // Set line thickness

// FIX APPLIED HERE: LINE_END_X now safely uses TERMS_COL_WIDTH
doc.line(M, LINE_Y_POSITION, M+ 3 + TERMS_COL_WIDTH, LINE_Y_POSITION ); // Draw line from M to M + TERMS_COL_WIDTH


// 2. Set the starting Y position for the text, giving it a top margin
let termsY = cursorY + 40; // Increased margin to 20pt (15pt after the line)
// --- END ADDED LOGIC ---

doc.setFont("helvetica", "normal");
doc.setFontSize(8);
doc.setTextColor(...DARK);

// Removed the original definition of TERMS_COL_WIDTH from here

const pageW = getW();
const pageHt = doc.internal.pageSize.getHeight();

if (transaction.notes) {
  termsY = renderHtmlNotesForJsPDF(
    doc,
    transaction.notes,
    M,
    termsY,
    TERMS_COL_WIDTH, // Now safe to use
    pageW,
    pageHt,
    drawHeaderAndCustomerBlocks
  );
} 
  // ---------------- FINAL PASS: ADD TOTAL PAGE COUNT ----------------

  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);

    doc.text(`Page ${i} of ${totalPages}`, getW() - M + 7, pageHeight - 15, {
      align: "right",
    });
  }

  // ---------------- END FINAL PASS ----------------

  return doc;
};