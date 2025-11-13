// template17.ts
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
  prepareTemplate8Data,
  numberToWords,
  getStateCode,
} from "./pdf-utils";
import { capitalizeWords, parseNotesHtml } from "./utils"; // NOTE: parseNotesHtml is now redundant but kept for original structure
import { formatQuantity } from "@/lib/pdf-utils";

// --- NEW IMPORTS FOR ADVANCED TERMS & CONDITIONS RENDERING ---
import {
  parseHtmlToElementsForJsPDF,
  renderParsedElementsWithJsPDF,
} from "./jspdf-html-renderer"; // Assumed path for the new logic
// -----------------------------------------------------------

import { formatPhoneNumber } from "./pdf-utils";
// Minimal interfaces with necessary dynamic properties
interface ExtendedCompany extends Company {
  email?: string;
  panNumber?: string;
  stateCode?: string;
}
interface ExtendedParty extends Party {
  email?: string;
  panNumber?: string;
  stateCode?: string;
  contactNumber?: string;
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

// ⭐ TYPE DEFINITION FIX FOR jspdf-autotable cells
type AutotableCellDef =
  | string
  | number
  | boolean
  | {
      content: string | number;
      colSpan?: number;
      rowSpan?: number;
      styles?: {
        fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
        halign?: "left" | "center" | "right";
        // Add other necessary styles here as needed
      };
    };
type AutotableRow = AutotableCellDef[];

// --- Constants (Global) ---
const PRIMARY_BLUE: [number, number, number] = [0, 110, 200];
const DARK: [number, number, number] = [45, 55, 72];
const BORDER: [number, number, number] = [0, 110, 200];

// --- FRAME & MARGIN CONSTANTS ---
const TITLE_Y = 30;
const FRAME_TOP_Y = 35;
const BOTTOM_OFFSET = 20;

// Function to safely return value or "-" if it is "N/A" or missing
const checkValue = (
  value: string | number | Date | null | undefined
): string => {
  const val = String(value);
  if (
    val === "N/A" ||
    val === "null" ||
    val === "undefined" ||
    val === "" ||
    val.toLowerCase().includes("not available")
  ) {
    return "-";
  }
  return val;
};

// ⭐ BORDER DRAWING FUNCTION (Global)

const drawBorderFrame = (doc: jsPDF, M: number) => {
  const h = doc.internal.pageSize.getHeight();
  const w = doc.internal.pageSize.getWidth();
  const start_Y = FRAME_TOP_Y;
  const end_Y = h - BOTTOM_OFFSET;
  doc.setDrawColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
  doc.setLineWidth(1);
  doc.line(M - 8, start_Y, M - 8, end_Y);
  doc.line(w - M + 8, start_Y, w - M + 8, end_Y);
  doc.line(M - 8, FRAME_TOP_Y, w - M + 8, FRAME_TOP_Y);
  doc.line(M - 8, h - BOTTOM_OFFSET, w - M + 8, h - BOTTOM_OFFSET);
};

// ⭐ BUYER/CONSIGNEE BLOCK DRAWING FUNCTION (New Global Function)

// ⭐ UPDATED BUYER/CONSIGNEE BLOCK DRAWING FUNCTION (Dynamic Height)

const drawBuyerConsigneeBlock = (
  doc: jsPDF,
  M: number,
  COL_W: number,
  invoiceData: any,
  getW: () => number,
  startY: number
): number => {
  let cursorY = startY;
  const W = getW();

  // Draw top border
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.1);
  doc.line(M - 8, cursorY, W - M + 8, cursorY);

  // Headers
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...DARK);
  doc.text("Details of Buyer | Billed to:", M + 5, cursorY + 9.3);
  doc.text("Details of Consignee | Shipped to:", M + COL_W + 10, cursorY + 9.3);
  cursorY += 15;

  // Draw horizontal line after headers
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.1);
  doc.line(M - 8, cursorY, W - M + 8, cursorY);

  const FONT_NAME = "helvetica";
  const contentStartY = cursorY + 12;

  // ========== LEFT COLUMN: BUYER DETAILS ==========
  let leftY = contentStartY;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(capitalizeWords(invoiceData.invoiceTo.name), M + 5, leftY);
  leftY += 12;

  // Billing Address
  doc.setFont("helvetica", "normal");
  let billAddressToDisplay = capitalizeWords(
    invoiceData.invoiceTo.billingAddress
  );
  if (
    !billAddressToDisplay ||
    billAddressToDisplay.trim() === "" ||
    billAddressToDisplay.toLowerCase().includes("address missing") ||
    billAddressToDisplay.toLowerCase().includes("n/a")
  ) {
    billAddressToDisplay = "-";
  }
  const billAddressLines = doc.splitTextToSize(
    billAddressToDisplay,
    COL_W - 10
  );
  doc.text(billAddressLines.join("\n"), M + 5, leftY + 2);
  leftY += billAddressLines.length * 9 + 4;

  // GSTIN
  const gstinLabel = `GSTIN: `;
  doc.setFont(FONT_NAME, "bold");
  doc.text(gstinLabel, M + 5, leftY);
  const gstinLabelWidth = doc.getTextWidth(gstinLabel);
  doc.setFont(FONT_NAME, "normal");
  doc.text(
    `${invoiceData.party?.gstin || "-"}`,
    M + 5 + gstinLabelWidth,
    leftY
  );
  leftY += 12;

  // PAN
  const panLabel = `PAN: `;
  doc.setFont(FONT_NAME, "bold");
  doc.text(panLabel, M + 5, leftY);
  const panLabelWidth = doc.getTextWidth(panLabel);
  doc.setFont(FONT_NAME, "normal");
  doc.text(
    `${checkValue(invoiceData.invoiceTo.pan)}`,
    M + 5 + panLabelWidth,
    leftY
  );
  leftY += 12;

  // Phone
  const phoneLabel = `Phone: `;
  doc.setFont(FONT_NAME, "bold");
  doc.text(phoneLabel, M + 5, leftY);
  const phoneLabelWidth = doc.getTextWidth(phoneLabel);
  doc.setFont(FONT_NAME, "normal");
  doc.text(
    `${checkValue(invoiceData.invoiceTo.phone)}`,
    M + 5 + phoneLabelWidth,
    leftY
  );
  leftY += 12;

  // Place of Supply
  const posLabel = `Place of Supply: `;
  doc.setFont(FONT_NAME, "bold");
  doc.text(posLabel, M + 5, leftY);
  const posLabelWidth = doc.getTextWidth(posLabel);
  doc.setFont(FONT_NAME, "normal");

  const placeOfSupply = invoiceData.shippingAddress?.state
    ? `${invoiceData.shippingAddress.state} (${
        getStateCode(invoiceData.shippingAddress.state) || "-"
      })`
    : invoiceData.party?.state
    ? `${invoiceData.party.state} (${
        getStateCode(invoiceData.party.state) || "-"
      })`
    : "-";

  doc.text(`${placeOfSupply}`, M + 5 + posLabelWidth, leftY);

  // ========== RIGHT COLUMN: CONSIGNEE DETAILS ==========
  let rightY = contentStartY;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text(
    capitalizeWords(invoiceData.shippingAddress.name),
    M + 5 + COL_W + 5,
    rightY
  );
  rightY += 12;

  // Shipping Address
  doc.setFont("helvetica", "normal");
  let shipAddressToDisplay = capitalizeWords(
    invoiceData.shippingAddress.address
  );
  if (
    shipAddressToDisplay.toLowerCase().includes("address missing") ||
    shipAddressToDisplay.toLowerCase().includes("n/a")
  ) {
    shipAddressToDisplay = "-";
  }
  const shipAddressLines = doc.splitTextToSize(
    shipAddressToDisplay,
    COL_W - 10
  );
  doc.text(shipAddressLines.join("\n"), M + 5 + COL_W + 5, rightY);
  rightY += shipAddressLines.length * 9;

  // Country
  doc.setFont("helvetica", "bold");
  doc.text(`Country:`, M + 5 + COL_W + 5, rightY + 3);
  doc.setFont("helvetica", "normal");
  doc.text(
    ` india`,
    M +
      5 +
      COL_W +
      5 +
      doc.getStringUnitWidth("Country: ") * (doc.internal as any).getFontSize(),
    rightY + 2
  );
  rightY += 13;
  // Phone
  const consigneePhone =
    checkValue(invoiceData.shippingAddress.contactNumber) !== "-"
      ? checkValue(invoiceData.shippingAddress.contactNumber)
      : checkValue(invoiceData.invoiceTo.phone);

  doc.setFont("helvetica", "bold");
  doc.text(`Phone:`, M + 5 + COL_W + 5, rightY + 2);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${consigneePhone}`,
    M +
      5 +
      COL_W +
      5 +
      doc.getStringUnitWidth("Phone: ") * (doc.internal as any).getFontSize(),
    rightY + 2
  );
  rightY += 13;

  // GSTIN
  doc.setFont("helvetica", "bold");
  doc.text(`GSTIN:`, M + 5 + COL_W + 5, rightY + 2);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${invoiceData.Party?.gstin || "-"}`,
    M +
      5 +
      COL_W +
      5 +
      doc.getStringUnitWidth("GSTIN: ") * (doc.internal as any).getFontSize(),
    rightY + 2
  );
  rightY += 13;

  // State
  doc.setFont("helvetica", "bold");
  doc.text(`State:`, M + 5 + COL_W + 5, rightY + 2);
  doc.setFont("helvetica", "normal");
  doc.text(
    invoiceData.shippingAddress?.state
      ? `${invoiceData.shippingAddress.state} (${
          getStateCode(invoiceData.shippingAddress.state) || "-"
        })`
      : invoiceData.party?.state
      ? `${invoiceData.party.state} (${
          getStateCode(invoiceData.party.state) || "-"
        })`
      : "-",
    M +
      5 +
      COL_W +
      5 +
      doc.getStringUnitWidth("State: ") * (doc.internal as any).getFontSize(),
    rightY + 2
  );
  rightY += 10;

  // ========== CALCULATE DYNAMIC BLOCK HEIGHT ==========
  // Use the maximum of both columns' heights to determine block height
  const maxContentHeight = Math.max(leftY, rightY) - contentStartY;
  const blockHeight = maxContentHeight + 20; // Add 20px padding at bottom

  // Calculate exact positions for the vertical divider line
  const verticalLineStartY = cursorY; // Start after the header horizontal line
  const verticalLineEndY = cursorY + blockHeight; // End at the calculated height

  // Draw the vertical divider line with dynamic height
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.1);
  doc.line(M + COL_W, verticalLineStartY, M + COL_W, verticalLineEndY);

  // Update cursor to bottom of the block
  cursorY = verticalLineEndY;

  // Draw bottom border at the exact calculated position
  doc.setDrawColor(...BORDER);
  doc.setLineWidth(0.1);
  doc.line(M - 8, cursorY, W - M + 8, cursorY);
  cursorY += 5;

  return cursorY;
};

// =========================================================================
// ⭐ COMPANY/METADATA BLOCK DRAWING FUNCTION (Global - Updated)
// =========================================================================
const drawHeaderContent = (
  doc: jsPDF,
  M: number,
  COL_W: number,
  invoiceData: any,
  getW: () => number,
  fmtDate: (d?: string | number | Date | null) => string,
  transaction: DynamicTransaction,
  isGSTApplicable: boolean,
  logoUrl: string | null
): number => {
  const W = getW();

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY_BLUE);
  doc.text(
    transaction.type === "proforma"
      ? "PROFORMA INVOICE"
      : isGSTApplicable
      ? "TAX INVOICE"
      : "INVOICE",
    M + 240,
    TITLE_Y
  );

  if (logoUrl) {
    try {
      doc.addImage(logoUrl, "PNG", M, FRAME_TOP_Y - 4 + 20, 70, 70);
    } catch (e) {
      // ... (Logo fallback commented out)
    }
  }
  let companyX = logoUrl ? M + 80 : M + 5;
  let companyY = FRAME_TOP_Y + 25;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  
  
  const maxCompanyNameWidth = 180; 
  const companyNameLines = doc.splitTextToSize(
    capitalizeWords(invoiceData.company.name.toUpperCase()),
    maxCompanyNameWidth
  );
  
  
  companyNameLines.forEach((line: string) => {
    doc.text(line, companyX, companyY);
    companyY += 15; 
  });
  


  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let companyAddressStateDisplay = checkValue(invoiceData.company.address);
  const companyAddressLines = doc.splitTextToSize(
    capitalizeWords(companyAddressStateDisplay),
    250
  );

  if (checkValue(invoiceData.company.lAddress) !== "-")
    doc.text(
      ` ${checkValue(capitalizeWords(invoiceData.company.lAddress))}`,
      companyX - 2,
      companyY
    );
  companyY += 13;

  if (checkValue(invoiceData.company.state) !== "-")
    doc.text(
      ` ${checkValue(capitalizeWords(invoiceData.company?.state))}`,
      companyX - 2,
      companyY
    );
  companyY += 13;

  const companyGstinDisplay = checkValue(invoiceData.company.gstin);
  if (companyGstinDisplay !== "-") {
    doc.text(`GSTIN: ${companyGstinDisplay}`, companyX, companyY);
    companyY += 13;
  }
  const companyPhoneDisplay = checkValue(invoiceData.company.phone);
  if (companyPhoneDisplay !== "-")
    doc.text(`Phone: ${companyPhoneDisplay}`, companyX, companyY);
  companyY += 13;
  if (companyAddressLines.length && companyAddressStateDisplay !== "-") {
    for (let i = 0; i < Math.min(companyAddressLines.length, 2); i++) {
      doc.text(
        `State:${capitalizeWords(companyAddressLines[i])}`,
        companyX,
        companyY
      );
      companyY += 2;
    }
  }

  let metaY = FRAME_TOP_Y + 10;
  const metaData = [
    {
      labelLeft: "Invoice No.",
      valueLeft: checkValue(invoiceData.invoiceNumber),
      labelRight: "Invoice Date",
      valueRight: checkValue(fmtDate(new Date())),
    },
    {
      labelLeft: "P.O. No.",
      valueLeft: checkValue(invoiceData.poNumber),
      labelRight: "P.O. Date",
      valueRight: checkValue(invoiceData.poDate),
    },
    {
      labelLeft: "Due Date",
      valueLeft: checkValue(fmtDate(new Date())),
      labelRight: "E-Way No.",
      valueRight: checkValue(invoiceData.eWayNo),
    },
  ];

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const metaX = M + COL_W + 20;
  const blockWidth = W - M - metaX;
  const boxH = 30; // Increased from 35 to 45 for more vertical padding
  const columnWidth = blockWidth / 2;
  const valueOffset = 12;

  // Vertical lines
  doc.line(metaX, metaY - 3, metaX, metaY + metaData.length * boxH - 3);
  doc.line(
    metaX + columnWidth,
    metaY - 3,
    metaX + columnWidth,
    metaY + metaData.length * boxH - 3
  );
  doc.line(W - M, metaY - 3, W - M, metaY + metaData.length * boxH - 3);

  for (let i = 0; i < metaData.length; i++) {
    const data = metaData[i];

    // Add vertical padding by adjusting Y positions
    const verticalPadding = 8; // Adjust this value to control padding
    const yPosLabel = metaY + verticalPadding;
    const yPosValue = metaY + verticalPadding + valueOffset;

    // Top horizontal line for each row
    doc.line(metaX, metaY - 3, W - M, metaY - 3);

    // Left side - Label
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(data.labelLeft, metaX + 5, yPosLabel);

    // Left side - Value
    doc.setFont("helvetica", "bold");
    doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.text(data.valueLeft, metaX + 5, yPosValue);

    // Right side - Label
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text(data.labelRight, metaX + columnWidth + 5, yPosLabel);

    // Right side - Value
    doc.setFont("helvetica", "bold");
    doc.setTextColor(PRIMARY_BLUE[0], PRIMARY_BLUE[1], PRIMARY_BLUE[2]);
    doc.text(data.valueRight, metaX + columnWidth + 5, yPosValue);

    metaY += boxH;
  }

  // Bottom horizontal line
  doc.line(metaX, metaY - 3, W - M, metaY - 3);

  return Math.max(companyY + 10, metaY + 10);
};

// =======================================================================
// === MAIN FUNCTION TO RENDER HTML NOTES WITH jsPDF (Wrapper - Copied from template11 logic) ===
// =======================================================================

const renderHtmlNotesForJsPDF = (
  doc: jsPDF,
  htmlNotes: string,
  startX: number,
  startY: number,
  maxWidth: number,
  pageWidth: number,
  pageHeight: number,
  // drawHeader is a function that can redraw the complete header on a new page
  drawHeader: (isFirstPage: boolean) => void
): number => {
  // Parse HTML into a structured list of elements
  // Assuming a default font size of 9pt for the elements
  const elements = parseHtmlToElementsForJsPDF(htmlNotes, 9);

  // Render the structured elements to the PDF document
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

// ⭐ EXPORTED FUNCTION (Main Logic)

export const generatePdfForTemplate17 = async (
  transaction: DynamicTransaction,
  company: ExtendedCompany | null | undefined,
  party: ExtendedParty | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddressOverride?: ExtendedShippingAddress | null,
  bank?: Bank | null
): Promise<jsPDF> => {
  // ---------------- START: BANK DETAILS LOGIC FROM TEMPLATE 19 (MODIFIED) ----------------
  // Helper function to handle undefined/null values (re-declared for clarity/safety)
  const handleUndefined = (value: any, fallback: string = "-"): string => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === "string" && value.trim() === "") return fallback;
    if (value === "N/A") return fallback; // Also handle "N/A" if you want
    return value.toString();
  };



 
  // --- Dynamic Bank Details Acquisition  ---
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
        qrCode: null, // ⭐ ADDED: qrCode field
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
        qrCode: bankObj.qrCode || null, // ⭐ ADDED: qrCode field
      };
    }

    // Extract account number from multiple possible fields
    const accountNumber =
      bankObj.accountNo ||
      bankObj.accountNumber ||
      bankObj.account_number ||
      "-";

    // Extract UPI ID from multiple possible paths
    const upiId =
      bankObj.upiDetails?.upiId || bankObj.upiId || bankObj.upi_id || "-";

    // ⭐ ADDED: Extraction for UPI Name and UPI Mobile
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
      qrCode: bankObj.qrCode || null, // ⭐ ADDED: Return QR code path
    };
  })();

  const areBankDetailsAvailable =
    dynamicBankDetails.name !== "Bank Details Not Available";
  // ---------------- END: BANK DETAILS LOGIC FROM TEMPLATE 19 ----------------

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
      : "-";

  const {
    totalTaxable,
    totalAmount,
    itemsWithGST,
    totalCGST,
    totalSGST,
    totalIGST,
    isGSTApplicable,
    isInterstate,
    showIGST,
    showCGSTSGST,
    showNoTax,
    totalQty,
    totalItems,
  } = prepareTemplate8Data(
    transaction,
    company,
    party,
    shippingAddressOverride
  );

  const logoUrl = company?.logo
    ? `${process.env.NEXT_PUBLIC_BASE_URL}${company.logo}`
    : null;

  const lines: DynamicLineItem[] = (itemsWithGST || []).map((it: any) => ({
    name: capitalizeWords(it.name),
    description: it.description || "",
    quantity: it.quantity || 0,
    pricePerUnit: it.pricePerUnit || 0,
    amount: it.taxableValue || 0,
    gstPercentage: it.gstRate || 0,
    lineTax: (it.cgst || 0) + (it.sgst || 0) + (it.igst || 0),
    lineTotal: it.total || 0,
    hsnSac: it.code || "N/A",
    unit: it.unit || "PCS",
  }));

  const subtotal = totalTaxable;
  const tax = totalCGST + totalSGST + totalIGST;
  const invoiceTotal = totalAmount;
  const gstEnabled = isGSTApplicable;
  const totalQuantity = totalQty;

  const totalTaxableAmount = money(subtotal);
  const finalTotalAmount = money(invoiceTotal);
  const shippingAddressSource = shippingAddressOverride;
  const billingAddress = capitalizeWords(getBillingAddress(party));
  const rawShippingAddressStr = getShippingAddress(
    shippingAddressSource,
    billingAddress
  );
  let shippingAddressStr = capitalizeWords(rawShippingAddressStr);
  if (
    shippingAddressStr.toLowerCase().includes("address missing") ||
    shippingAddressStr === "-"
  ) {
    shippingAddressStr = "-";
  }
  const companyGSTIN = _getGSTIN(company);
  const partyGSTIN = _getGSTIN(party);

  const invoiceData = {
    invoiceNumber: checkValue(invNo(transaction)),
    date: checkValue(fmtDate(transaction.date) || fmtDate(new Date())),
    poNumber: checkValue(transaction.poNumber),
    poDate: checkValue(fmtDate(transaction.poDate)),
    eWayNo: checkValue(transaction.eWayBillNo),
    placeOfSupply: checkValue(
      (party as any)?.stateCode
        ? `${capitalizeWords(party?.state)} (${(party as any)?.stateCode})`
        : party?.state || "N/A"
    ),
    company: {
      name: capitalizeWords(company?.businessName || "Your Company Name"),
      lAddress: checkValue(company?.address),
      address: checkValue(company?.addressState || "Company Address Missing"),
      gstin: checkValue(companyGSTIN),
      pan: checkValue(company?.panNumber),
      state: checkValue(company?.addressState),
      phone: checkValue(
        company?.mobileNumber
          ? formatPhoneNumber(company.mobileNumber)
          : company?.Telephone
          ? formatPhoneNumber(company.Telephone)
          : "-"
      ),
      email: checkValue(company?.email || company?.emailId),
    },
    invoiceTo: {
      name: capitalizeWords(party?.name || "Client Name"),
      billingAddress: billingAddress,
      gstin: checkValue(partyGSTIN),
      pan: checkValue(party?.panNumber),
      state: checkValue(party?.state),
      email: checkValue(party?.email),
      phone: checkValue(
        party?.contactNumber ? formatPhoneNumber(party.contactNumber) : "-"
      ),
    },
    shippingAddress: {
      name: capitalizeWords(
        (shippingAddressSource as any)?.name || party?.name || "Client Name"
      ),
      address: shippingAddressStr,
      state: checkValue((shippingAddressSource as any)?.state || party?.state),
      contactNumber: checkValue((shippingAddressSource as any)?.contactNumber),
    },
  };

  // --- REMOVED: Old parseNotesHtml logic ---
  // ------------------------------------------

  const doc = new jsPDF({ unit: "pt", format: [650, 800] });
  const getW = () => doc.internal.pageSize.getWidth();
  const getH = () => doc.internal.pageSize.getHeight();
  const M = 36;
  const COL_W = (getW() - M * 2) / 2;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);

  // --- REUSABLE HEADER DRAWING FUNCTION ---
  const drawHeaderAndBuyerBlocks = (isFirstPage: boolean = true) => {
    // ⭐ 1. Draw frame
    drawBorderFrame(doc, M);
    // ⭐ 2. Draw Company/Metadata Block
    const headerBottomY = drawHeaderContent(
      doc,
      M,
      COL_W,
      invoiceData,
      getW,
      fmtDate,
      transaction,
      isGSTApplicable,
      logoUrl
    );
    // ⭐ 3. Draw Buyer/Consignee Block
    return drawBuyerConsigneeBlock(
      doc,
      M,
      COL_W,
      invoiceData,
      getW,
      headerBottomY
    );
  };
  // -----------------------------------------

  drawBorderFrame(doc, M);
  const initialHeaderBottomY = drawHeaderContent(
    doc,
    M,
    COL_W,
    invoiceData,
    getW,
    fmtDate,
    transaction,
    isGSTApplicable,
    logoUrl
  );

  let initialBuyerBlockStart = initialHeaderBottomY;

  const tempDoc = new jsPDF({ unit: "pt", format: [650, 800] });
  const tempM = 36;
  const tempCOL_W = (tempDoc.internal.pageSize.getWidth() - tempM * 2) / 2;
  let tempY = initialBuyerBlockStart;
  tempY += 15;
  tempY += 80;
  tempY += 5;
  const REPEATING_HEADER_HEIGHT = tempY;

  let headerBottomY = drawHeaderContent(
    doc,
    M,
    COL_W,
    invoiceData,
    getW,
    fmtDate,
    transaction,
    isGSTApplicable,
    logoUrl
  );

  let cursorY = drawBuyerConsigneeBlock(
    doc,
    M,
    COL_W,
    invoiceData,
    getW,
    headerBottomY
  );

  const totalWidth = getW() - M * 2;
  const removeGstColumns = !gstEnabled;
  const fixedWidthsWithGST = 380;
  const itemColWidthWithGST = totalWidth - fixedWidthsWithGST;
  const removedGstWidth = 2;
  const fixedWidthsNoGST = fixedWidthsWithGST - removedGstWidth;
  const itemColWidthNoGST = totalWidth - fixedWidthsNoGST;
  const currentItemColWidth = removeGstColumns
    ? itemColWidthNoGST
    : itemColWidthWithGST;
  const gstGroupHeader = showIGST ? "IGST" : showCGSTSGST ? "CGST/SGST" : "GST"; // ⭐ PREPARE TABLE BODY WITH CORRECT TYPE DEFINITION

  const tableBody: AutotableRow[] = lines.map(
    (it: DynamicLineItem, i: number) => {
      const src = (itemsWithGST as any[])[i] || {};
      const hsnSacDisplay = checkValue(it.hsnSac);

      if (showCGSTSGST) {
        const cgstPct = (src.gstRate || 0) / 2;
        const sgstPct = (src.gstRate || 0) / 2;
        return [
          i + 1,
          `${it.name || ""}\n${
            it.description ? it.description.split("\n").join(" / ") : ""
          }`,
          hsnSacDisplay,
          Number(it.quantity),
          it.unit || "PCS",
          money(it.pricePerUnit),
          money(it.amount),
          `${cgstPct}`,
          money(src.cgst || 0),
          `${sgstPct}`,
          money(src.sgst || 0),
          money(it.lineTotal),
        ] as AutotableRow;
      } else if (removeGstColumns) {
        return [
          i + 1,
          `${it.name || ""}\n${
            it.description ? it.description.split("\n").join(" / ") : ""
          }`,
          hsnSacDisplay,
          Number(it.quantity),
          it.unit || "PCS",
          money(it.pricePerUnit),
          money(it.amount),
          money(it.lineTotal),
        ] as AutotableRow;
      }
      const percent = showIGST ? src.gstRate || 0 : it.gstPercentage || 0;
      const amount = showIGST ? src.igst || 0 : it.lineTax || 0;
      return [
        i + 1,
        `${it.name || ""}\n${
          it.description ? it.description.split("\n").join(" / ") : ""
        }`,
        hsnSacDisplay,
        Number(it.quantity),
        it.unit || "PCS",
        money(it.pricePerUnit),
        money(it.amount),
        `${Number(percent)}`,
        money(amount),
        money(it.lineTotal),
      ] as AutotableRow;
    }
  ); // ⭐ ADD TOTAL ROW TO TABLE BODY (No longer errors due to explicit type AutotableRow[])

  if (showCGSTSGST) {
    tableBody.push([
      {
        content: "Total",
        colSpan: 3,
        styles: { fontStyle: "bold", halign: "left" },
      },
      {
        content: totalQuantity,
        styles: { fontStyle: "bold", halign: "center" },
      },
      "", // Unit column (empty)
      "", // Rate column (empty)
      {
        content: totalTaxableAmount,
        styles: { fontStyle: "bold", halign: "center" },
      },
      "", // CGST % (empty)
      {
        content: money(totalCGST),
        styles: { fontStyle: "bold", halign: "center" },
      },
      "", // SGST % (empty)
      {
        content: money(totalSGST),
        styles: { fontStyle: "bold", halign: "center" },
      },
      {
        content: finalTotalAmount,
        styles: { fontStyle: "bold", halign: "center" },
      },
    ]);
  } else if (removeGstColumns) {
    tableBody.push([
      {
        content: "Total",
        colSpan: 3,
        styles: { fontStyle: "bold", halign: "left" },
      },
      {
        content: totalQuantity,
        styles: { fontStyle: "bold", halign: "center" },
      },
      "", // Unit column (empty)
      "", // Rate column (empty)
      {
        content: totalTaxableAmount,
        styles: { fontStyle: "bold", halign: "center" },
      },
      {
        content: finalTotalAmount,
        styles: { fontStyle: "bold", halign: "center" },
      },
    ]);
  } else {
    const totalTaxAmount = showIGST
      ? money(totalIGST)
      : money(totalCGST + totalSGST);
    tableBody.push([
      {
        content: "Total",
        colSpan: 3,
        styles: { fontStyle: "bold", halign: "left" },
      },
      {
        content: totalQuantity,
        styles: { fontStyle: "bold", halign: "center" },
      },
      "", // Unit column (empty)
      "", // Rate column (empty)
      {
        content: totalTaxableAmount,
        styles: { fontStyle: "bold", halign: "center" },
      },
      "", // GST % (empty)
      {
        content: totalTaxAmount,
        styles: { fontStyle: "bold", halign: "center" },
      },
      {
        content: finalTotalAmount,
        styles: { fontStyle: "bold", halign: "center" },
      },
    ]);
  }

  autoTable(doc, {
    startY: cursorY,
    styles: {
      font: "helvetica",
      fontSize: 8,
      cellPadding: 3,
      lineColor: BORDER,
      lineWidth: 0.1,
      textColor: DARK,
      minCellHeight: 8,
      valign: "top",
      halign: "center",
    },
    headStyles: {
      fillColor: [200, 225, 255],
      textColor: DARK,
      fontStyle: "bold",
      fontSize: 8,
      minCellHeight: 10,
      valign: "middle",
      halign: "center",
    },
    columnStyles: showCGSTSGST
      ? {
          0: { halign: "center", cellWidth: 35 }, // Sr.No.
          1: {
            halign: "left",
            valign: "middle",
            cellWidth: currentItemColWidth - 61,
          }, // Product
          2: { halign: "center", cellWidth: 45 }, // HSN/SAC
          3: { halign: "center", cellWidth: 32 }, // Qty
          4: { halign: "center", cellWidth: 35 }, // Unit
          5: { halign: "center", cellWidth: 48 }, // Rate
          6: { halign: "center", cellWidth: 60 }, // Taxable Value
          7: { halign: "center", cellWidth: 18 }, // %
          8: { halign: "center", cellWidth: 55 }, // Amount (Rs.)
          9: { halign: "center", cellWidth: 18 }, // %
          10: { halign: "center", cellWidth: 55 }, // Amount (Rs.)

          11: { halign: "center", cellWidth: 56 }, // Total (Rs.)
        }
      : removeGstColumns
      ? {
          0: { halign: "center", cellWidth: 30 },
          1: {
            halign: "left",
            valign: "middle",
            cellWidth: currentItemColWidth + removedGstWidth,
          },
          2: { halign: "center", cellWidth: 60 },
          3: { halign: "right", cellWidth: 57 },
          4: { halign: "center", cellWidth: 50 },
          5: { halign: "center", cellWidth: 55 },
          6: { halign: "center", cellWidth: 66 },
          7: { halign: "center", cellWidth: 73 },
        }
      : {
          0: { halign: "center", cellWidth: 30 }, // Sr.No.
          1: {
            halign: "left",
            valign: "middle",
            cellWidth: currentItemColWidth - 30, // Product Name
          },
          2: { halign: "center", cellWidth: 50 }, // HSN/SAC
          3: { halign: "center", cellWidth: 35 }, // Qty
          4: { halign: "center", cellWidth: 38 }, // Unit
          5: { halign: "center", cellWidth: 50 }, // Rate
          6: { halign: "center", cellWidth: 65 }, // Taxable Value
          7: { halign: "center", cellWidth: 25 }, // %
          8: { halign: "center", cellWidth: 65 }, // Amount (Rs.)
          9: { halign: "center", cellWidth: 68 }, // Total (Rs.)
        },
    head: showCGSTSGST
      ? [
          [
            { content: "Sr.No.", styles: { cellWidth: 28 } },
            "Name of Product / Service",
            "HSN/SAC",
            "Qty",
            "Unit",
            "Rate (Rs.)",
            "Taxable Value (Rs.)",
            { content: "CGST", colSpan: 2 },
            { content: "SGST", colSpan: 2 },
            "Total (Rs.)",
          ],
          [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "%",
            "Amount(Rs.)",
            "%",
            "Amount(Rs.)",
            "",
          ],
        ]
      : removeGstColumns
      ? [
          [
            { content: "Sr.No.", styles: { cellWidth: 30 } },
            "Name of Product / Service",
            "HSN/SAC",
            "Qty",
            "Unit",
            "Rate (Rs.)",
            "Taxable Value (Rs.)",
            "Total (Rs.)",
          ],
        ]
      : [
          [
            { content: "Sr.No.", styles: { cellWidth: 30 } },
            "Name of Product / Service",
            "HSN/SAC",
            "Qty",
            "Unit",
            "Rate (Rs.)",
            "Taxable Value (Rs.)",
            { content: gstGroupHeader, colSpan: 2 },
            "Total (Rs.)",
          ],
          ["", "", "", "", "", "", "", "%", "Amount (Rs.)", ""],
        ],
    body: tableBody,
    didDrawPage: (data) => {
      // ⭐ Draw frame and the static header on every page
      drawBorderFrame(doc, M);
      const headerBottomY = drawHeaderContent(
        doc,
        M,
        COL_W,
        invoiceData,
        getW,
        fmtDate,
        transaction,
        isGSTApplicable,
        logoUrl
      ); // ⭐ Draw Buyer/Consignee block on every page, starting right after the header
      drawBuyerConsigneeBlock(doc, M, COL_W, invoiceData, getW, headerBottomY); // Set page number in footer
      doc.setFontSize(8);
      doc.text(`Page ${data.pageNumber}`, getW() - M - 20, getH() - 10);
    }, // ⭐ Margin top must be the height of the entire repeating header block
    margin: { left: M - 8, right: M - 8, top: REPEATING_HEADER_HEIGHT + 5 },
    theme: "grid",
  });

  let afterTableY = (doc as any).lastAutoTable.finalY || cursorY + 20; // ⭐ REMOVED MANUAL TOTAL ROW DRAWING - Now it's in the table body // Total in words

  afterTableY += 10;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9); // --------------- TAX SUMMARY TABLE  --------------- // Helper to ensure space and move to next page if needed

  const ensureSpace = (needed: number): number => {
    const H = getH();
    const bottomSafe = H - BOTTOM_OFFSET;
    if (afterTableY + needed > bottomSafe) {
      doc.addPage(); // ⭐ Manually draw the frame, header, and buyer/consignee block on the new page.
      drawBorderFrame(doc, M);
      const newPageHeaderBottomY = drawHeaderContent(
        doc,
        M,
        COL_W,
        invoiceData,
        getW,
        fmtDate,
        transaction,
        isGSTApplicable,
        logoUrl
      );
      drawBuyerConsigneeBlock(
        doc,
        M,
        COL_W,
        invoiceData,
        getW,
        newPageHeaderBottomY
      ); // Print Page Number on the new page's footer
      doc.setFontSize(8);
      doc.text(
        `Page ${doc.internal.pages.length}`,
        getW() - M - 20,
        getH() - 10
      ); // ⭐ Reset afterTableY to be below the entire repeating header block
      return REPEATING_HEADER_HEIGHT + 5;
    }
    return afterTableY;
  }; // Ensure space before starting tax summary

  afterTableY = ensureSpace(140);
  let taxSummaryY = afterTableY; // Build tax summary dynamically grouped by HSN/SAC

  const groupedByHSN: Record<string, any> = {};
  (itemsWithGST as any[]).forEach((it: any) => {
    const key = checkValue(it.code);
    if (!groupedByHSN[key]) {
      groupedByHSN[key] = {
        hsn: key,
        taxable: 0,
        cgstPct: 0,
        cgstAmt: 0,
        sgstPct: 0,
        sgstAmt: 0,
        igstPct: 0,
        igstAmt: 0,
        total: 0,
      };
    }
    groupedByHSN[key].taxable += it.taxableValue || 0;
    groupedByHSN[key].cgstPct = showCGSTSGST ? (it.gstRate || 0) / 2 : 0;
    groupedByHSN[key].sgstPct = showCGSTSGST ? (it.gstRate || 0) / 2 : 0;
    groupedByHSN[key].igstPct = showIGST ? it.gstRate || 0 : 0;
    groupedByHSN[key].cgstAmt += it.cgst || 0;
    groupedByHSN[key].sgstAmt += it.sgst || 0;
    groupedByHSN[key].igstAmt += it.igst || 0;
    groupedByHSN[key].total += it.total || 0;
  });
  let taxSummaryData = Object.values(groupedByHSN);

  // // ✅ Add the total summary row at the end of the table itself
  // ... (Total row logic commented out)

  autoTable(doc, {
    startY: taxSummaryY,
    body: taxSummaryData.map((d: any) =>
      showIGST
        ? [
            d.hsn,
            money(d.taxable),
            d.isTotalRow ? "" : `${Number(d.igstPct)}`,
            money(d.igstAmt),
            money(d.total),
          ]
        : showCGSTSGST
        ? [
            d.hsn,
            money(d.taxable),
            d.isTotalRow ? "" : `${Number(d.cgstPct)}`,
            money(d.cgstAmt),
            d.isTotalRow ? "" : `${Number(d.sgstPct)}`,
            money(d.sgstAmt),
            money(d.total),
          ]
        : [d.hsn, money(d.taxable), money(d.total)]
    ),
    head: showIGST
      ? [["HSN / SAC", "Taxable Value (Rs.)", "%", "IGST (Rs.)", "Total (Rs.)"]]
      : showCGSTSGST
      ? [
          [
            "HSN / SAC",
            "Taxable Value (Rs.)",
            "%",
            "CGST (Rs.)",
            "%",
            "SGST (Rs.)",
            "Total (Rs.)",
          ],
        ]
      : [["HSN / SAC", "Taxable Value (Rs.)", "Total (Rs.)"]],
    headStyles: {
      fillColor: [200, 225, 255],
      textColor: DARK,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
      minCellHeight: 18,
      valign: "middle",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: DARK,
      lineColor: BORDER,
      lineWidth: 0.1,
    },
    columnStyles: showIGST
      ? {
          0: { halign: "center", cellWidth: 120 },
          1: { halign: "center", cellWidth: 120 },
          2: { halign: "center", cellWidth: 113 },
          3: { halign: "center", cellWidth: 120 },
          4: { halign: "center", cellWidth: 120 },
        }
      : showCGSTSGST
      ? {
          0: { halign: "center", cellWidth: 130 },
          1: { halign: "center", cellWidth: 100 },
          2: { halign: "center", cellWidth: 60 },
          3: { halign: "center", cellWidth: 74 },
          4: { halign: "center", cellWidth: 60 },
          5: { halign: "center", cellWidth: 80 },
          6: { halign: "center", cellWidth: 90 },
        }
      : {
          0: { halign: "center", cellWidth: 200 },
          1: { halign: "center", cellWidth: 195 },
          2: { halign: "center", cellWidth: 200 },
        },
    margin: { left: M - 8, right: M },
    theme: "grid",
    //   didDrawCell: (data) => { ... },
    didDrawPage: (data) => {
      drawBorderFrame(doc, M);
    },
  });

  taxSummaryY = (doc as any).lastAutoTable.finalY;

  // Draw the summary Total row manually
  doc.setDrawColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);

  // Calculate column positions based on actual column widths
  const taxTableStartX = M - 8;

  if (showIGST) {
    // Columns: HSN(120), Taxable(120), %(113), IGST(120), Total(120)
    const col1End = taxTableStartX + 120; // HSN end
    const col2End = col1End + 120; // Taxable end
    const col3End = col2End + 113; // % end
    const col4End = col3End + 120; // IGST end
    const col5End = col4End + 120; // Total end

    doc.text("Total", taxTableStartX + 60, taxSummaryY + 11, {
      align: "center",
    });
    doc.text(money(subtotal), col1End + 60, taxSummaryY + 11, {
      align: "center",
    });
    doc.text(money(totalIGST), col3End + 60, taxSummaryY + 11, {
      align: "center",
    });
    doc.text(money(subtotal + totalIGST), col4End + 60, taxSummaryY + 11, {
      align: "center",
    });
  } else if (showCGSTSGST) {
    // Columns: HSN(130), Taxable(100), %(60), CGST(74), %(60), SGST(80), Total(90)
    const col1End = taxTableStartX + 130; // HSN end
    const col2End = col1End + 100; // Taxable end
    const col3End = col2End + 60; // % end
    const col4End = col3End + 74; // CGST end
    const col5End = col4End + 60; // % end
    const col6End = col5End + 80; // SGST end
    const col7End = col6End + 90; // Total end

    doc.text("Total", taxTableStartX + 65, taxSummaryY + 11, {
      align: "center",
    });
    doc.text(money(subtotal), col1End + 50, taxSummaryY + 11, {
      align: "center",
    });
    doc.text(money(totalCGST), col3End + 37, taxSummaryY + 11, {
      align: "center",
    });
    doc.text(money(totalSGST), col5End + 40, taxSummaryY + 11, {
      align: "center",
    });
    doc.text(
      money(subtotal + totalCGST + totalSGST),
      col6End + 45,
      taxSummaryY + 11,
      { align: "center" }
    );
  } else {
    // Columns: HSN(200), Taxable(195), Total(200)
    const col1End = taxTableStartX + 200; // HSN end
    const col2End = col1End + 195; // Taxable end
    const col3End = col2End + 200; // Total end

    doc.text("Total", taxTableStartX + 100, taxSummaryY + 11, {
      align: "center",
    });
    doc.text(money(subtotal), col1End + 97.5, taxSummaryY + 11, {
      align: "center",
    });
    doc.text(money(invoiceTotal), col2End + 100, taxSummaryY + 11, {
      align: "center",
    });
  }
  taxSummaryY += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const totalTaxVal = showIGST ? totalIGST : totalCGST + totalSGST;

  doc.text(`Total Tax in words: `, M, taxSummaryY + 20);
  doc.setFontSize(8);
  doc.setFont("helvetica", "Normal");
  doc.text(` ${numberToWords(invoiceTotal)}`, M + 82, taxSummaryY + 20);
  afterTableY = taxSummaryY + 25; // --------------- BANK DETAILS & SIGNATURE & TERMS --------------- // Ensure space before the entire footer block (Terms, Bank, Signature)

  // The max height of the footer section for this template (Bank, Sig, T&C) is about 150pt.
  const neededFooterSpace = 180; // Increased a bit to accommodate T&C content
  afterTableY = ensureSpace(neededFooterSpace);

  doc.setDrawColor(...BORDER);
  doc.line(M - 8, afterTableY, getW() - M + 8, afterTableY);
  afterTableY += 24;

// ---------------- START: Use dynamicBankDetails and areBankDetailsAvailable ----------------
 // ---------------- START: Use dynamicBankDetails and areBankDetailsAvailable ----------------
  const bankDetails = dynamicBankDetails; // Use the dynamically created object

  // ⭐ MODIFICATION START: Applied negative offset (-60) to shift left
  const BANK_OFFSET = -60; // Negative offset to push bank details left
  const bankX = M + COL_W + BANK_OFFSET;
  // ⭐ MODIFICATION END

  let currentBlockY = afterTableY;
  let bankDetailY = currentBlockY;
  const qrSize = 90; // ⭐ MODIFIED: Increased from 50 to 80

  // ⭐ MODIFIED: QR code position adjusted to be after bank details
  const qrX = bankX + 250; // Position QR code to the right of bank details
  let qrY = currentBlockY; // Start at same Y as bank details

  // Draw Bank Details on the left side

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  // Only display 'Bank Details' header if details are available or fallback text is used
  doc.text("Bank Details", bankX, bankDetailY); // Uses the new bankX
  bankDetailY += 15;

  doc.setFontSize(8);

  // ⭐ MODIFIED: Updated putBankDetail to support maxWidth for text wrapping
  const putBankDetail = (
    label: string,
    val: string,
    x: number,
    y: number,
    // ADDED: Optional maxWidth parameter
    maxWidth?: number 
  ): number => {
    // Skip if the value is the fallback ("-")
    if (val === "-") return y;

    const valueX = x + 60; // Fixed horizontal offset for the value

    doc.setFont("helvetica", "bold");
    doc.text(label, x, y);
    doc.setFont("helvetica", "normal");
    
    if (maxWidth) {
        // Use text wrapping if maxWidth is provided
        const lines = doc.splitTextToSize(val, maxWidth);
        doc.text(lines, valueX, y);
        // Return new Y position based on number of wrapped lines
        return y + (lines.length * 9); // Using 9 for reduced line height
    } else {
        // Regular text printing
        doc.text(val, valueX, y);
        return y + 12; // Return the new Y position
    }
 };

  if (areBankDetailsAvailable) {
    bankDetailY = putBankDetail("Name:", bankDetails.name, bankX, bankDetailY);
    bankDetailY = putBankDetail(
      "Branch:",
      bankDetails.branch,
      bankX,
      bankDetailY,
      // ⭐ ADDED: Max width parameter (180) to reduce the branch name width
      180 
    );
    bankDetailY = putBankDetail("IFSC:", bankDetails.ifsc, bankX, bankDetailY);
    bankDetailY = putBankDetail(
      "Acc. Number:",
      bankDetails.accNumber,
      bankX,
      bankDetailY
    );

    // --- UPI DETAILS ADDED HERE ---
    bankDetailY = putBankDetail(
      "UPI ID:",
      bankDetails.upiId,
      bankX,
      bankDetailY
    );
    // ⭐ ADDED: UPI Name
    bankDetailY = putBankDetail(
      "UPI Name:",
      bankDetails.upiName,
      bankX,
      bankDetailY
    );
    // ⭐ ADDED: UPI Mobile
    bankDetailY = putBankDetail(
      "UPI Mobile:",
      bankDetails.upiMobile,
      bankX,
      bankDetailY
    );
    // ------------------------------
  }

  // ⭐ NEW: QR CODE LOGIC ADDED HERE 
  if (bankDetails.qrCode) {
    // QR Code Label
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    const qrLabelWidth = doc.getTextWidth("QR Code");
    doc.text("QR Code", qrX + (qrSize / 2) - (qrLabelWidth / 2), qrY);
    
    qrY += 12; // Space between label and QR image
    
    // Add QR Code Image
    try {
      const qrCodeUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/${bankDetails.qrCode}`;
      doc.addImage(qrCodeUrl, 'PNG', qrX - 2, qrY, qrSize, qrSize - 12 );
    } catch (error) {
      console.error("Failed to add QR code image:", error);
      // Fallback: Draw placeholder rectangle with white background
      doc.setDrawColor(220, 224, 228);
      doc.setFillColor(255, 255, 255);
      doc.setLineWidth(0.1);
      doc.rect(qrX, qrY, qrSize, qrSize, "FD");
    }
  }
  // ⭐ END: QR CODE LOGIC
  
  // ---------------- END: Use dynamicBankDetails and areBankDetailsAvailable ----------------
  
  // Signature Block
  const sigY = Math.max(bankDetailY, qrY + qrSize) + 10; // ⭐ MODIFIED: Use max of bank and QR heights
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  const SIG_WIDTH = 125;
  const SIG_RECT_X = qrX - 65;

  doc.setLineWidth(0.1);
  doc.setDrawColor(220, 224, 228);

 
  const maxNameWidthForSign = 130; 
  const companyNameLinesForSign = doc.splitTextToSize(
    `For ${capitalizeWords(invoiceData.company.name)}`,
    maxNameWidthForSign
  );

  let currentSignY = sigY + 28;

  
  companyNameLinesForSign.forEach((line: string) => {
    doc.text(line, qrX - 25, currentSignY);
    currentSignY += 8; 
  });

  
  

  // 2. Draw the rectangle (Signature box) - position adjust hoga agar name multiple lines mein hai
  doc.rect(SIG_RECT_X + 40, currentSignY, SIG_WIDTH, 55, "S");
  doc.setLineWidth(0.1);

  // "Authorised Signatory" text, centered under the new box
  const SIG_TEXT_AUTH_X = SIG_RECT_X + SIG_WIDTH / 2;
  doc.text("Authorised Signatory", SIG_TEXT_AUTH_X + 40, currentSignY + 50, {
    align: "center",
  }); // LEFT HALF: Terms and Conditions
  // --- END: Thinner Border and Adjusted Box ---
  let termsY = currentBlockY;
  const TERMS_COL_WIDTH = COL_W - 80;

  // --- REPLACED TERMS & CONDITIONS LOGIC START ---

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  // Note: Cannot easily extract the title in the new logic, so using a fixed one or defaulting
  //   doc.text(`Terms & Conditions:`, M, termsY);
  //   termsY += 13;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);

  // Get current page height to pass to the render function
  const ph = doc.internal.pageSize.getHeight();
  const pw = doc.internal.pageSize.getWidth();

  if (transaction.notes) {
    // *** Use the new Rich Text HTML Renderer ***
    // Pass the function that redraws the entire header and buyer block
    termsY = renderHtmlNotesForJsPDF(
      doc,
      transaction.notes,
      M, // startX
      termsY, // startY
      TERMS_COL_WIDTH, // maxWidth
      pw,
      ph,
      drawHeaderAndBuyerBlocks // Function to redraw header on new page
    );
  } 

  // --- REPLACED TERMS & CONDITIONS LOGIC END ---

  currentBlockY = sigY + 60;

  return doc;
};
