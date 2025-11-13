// template16.ts
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

// FIX: Interfaces simplified to minimally include 'email' and core fields.
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

const LOGO_DATA_URL = "data:image/png;base64,...";
const STAMP_DATA_URL = "data:image/png;base64,...";
const QR_CODE_DATA_URL = "data:image/png;base64,...";

export const generatePdfForTemplate16 = async (
  transaction: DynamicTransaction,
  company: ExtendedCompany | null | undefined,
  party: ExtendedParty | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ExtendedShippingAddress | null,
  bank?: Bank | null | undefined
): Promise<jsPDF> => {
  console.log("bank details from template 16 :", bank);

  const getBankDetails = () => ({
    name: "Bank Details -",
    branch: "N/A",
    accNumber: "N/A",
    ifsc: "N/A",
    upiId: "N/A",
  });

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

  // Convert itemsWithGST to the format expected by template16
  const lines = itemsWithGST.map((item) => ({
    name: item.name,
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

  const totalTaxableAmount = money(subtotal);
  const finalTotalAmount = money(invoiceTotal);

  const shippingAddressSource = shippingAddress;

  const billingAddress = capitalizeWords(getBillingAddress(party));
  const shippingAddressStr = capitalizeWords(
    getShippingAddress(shippingAddressSource, getBillingAddress(party))
  );

  const companyGSTIN = _getGSTIN(company);
  const partyGSTIN = _getGSTIN(party);

  // ----------------- OPTIMIZED TABLE COLUMN WIDTHS -----------------
  const getColWidths = () => {
    const totalPageWidth = 595.28; // A4 width in pt
    const M = 30; // Reduced margin for more space
    const availableWidth = totalPageWidth - M * 2; // 535.28 pt available

    if (showCGSTSGST) {
      // CGST/SGST layout: 11 columns - optimized widths
      return [28, 95, 42, 47, 32, 58, 34, 55, 34, 55, 55];
    } else if (showIGST) {
      // IGST layout: 9 columns - optimized widths
      return [28, 130, 48, 58, 40, 72, 38, 58, 65];
    } else {
      // Non-GST layout: 7 columns - optimized widths
      return [28, 200, 52, 65, 38, 78, 74];
    }
  };
  // ----------------- END OPTIMIZED WIDTHS -----------------

  const colWidths = getColWidths();

  // --- Dynamic Invoice Data Object ---
  const invoiceData = {
    invoiceNumber: invNo(transaction),
    date: fmtDate(transaction.date) || fmtDate(new Date()),
    poNumber: transaction.poNumber || "N/A",
    poDate: fmtDate(transaction.poDate) || "N/A",
    eWayNo: transaction.eWayBillNo || "N/A",

    placeOfSupply: party?.state
      ? `${capitalizeWords(party.state)} (${getStateCode(party.state) || "-"})`
      : "N/A",

    company: {
      name: capitalizeWords(company?.businessName || "Your Company Name"),
      address: capitalizeWords(company?.address || "Company Address Missing"),
      gstin: companyGSTIN || "N/A",
      pan: company?.panNumber || "N/A",

      state: company?.addressState
        ? `${capitalizeWords(company?.addressState)} (${
            getStateCode(company?.addressState) || "-"
          })`
        : "N/A",
      city: capitalizeWords(company?.City || "N/A"),
      phone: company?.mobileNumber || "N/A",
      email: company?.email || company?.emailId || "N/A",
    },
    invoiceTo: {
      name: capitalizeWords(party?.name || "Client Name"),
      billingAddress: billingAddress,
      gstin: partyGSTIN || "N/A",
      pan: party?.panNumber || "N/A",

      state: party?.state
        ? `${capitalizeWords(party.state)} (${
            getStateCode(party.state) || "-"
          })`
        : "N/A",
      email: party?.email || "N/A",
    },
    shippingAddress: {
      name: capitalizeWords(
        (shippingAddressSource as any)?.name || party?.name || "Client Name"
      ),
      address: shippingAddressStr,

      state: (shippingAddressSource as any)?.state
        ? `${capitalizeWords((shippingAddressSource as any).state)} (${
            getStateCode((shippingAddressSource as any).state) || "-"
          })`
        : party?.state
        ? `${capitalizeWords(party.state)} (${
            getStateCode(party.state) || "-"
          })`
        : "N/A",
    },
  };

  // ---------------- PARSE TERMS AND CONDITIONS ----------------
  const {
    title,
    isList,
    items: notesItems,
  } = parseNotesHtml(transaction.notes || "");
  const termsTitle = title || "Terms and Conditions";
  const termsList = notesItems;

  // ---------------- doc + theme ----------------
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const getW = () => doc.internal.pageSize.getWidth();
  const M = 30; // Reduced margin from 36 to 30

  const BLUE: [number, number, number] = [24, 115, 204];
  const DARK: [number, number, number] = [45, 55, 72];
  const MUTED: [number, number, number] = [105, 112, 119];
  const BORDER: [number, number, number] = [220, 224, 228];

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);

  // ---------- header drawer (DYNAMIC) ----------
  const drawStaticHeader = (): number => {
    let y = M;
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(...DARK);
    doc.text("TAX INVOICE", M - 2, y);
    y += 20;

    // Company Details
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 110, 200);

    doc.text(capitalizeWords(invoiceData.company.name.toUpperCase()), M, y);
    y += 16;
  doc.setTextColor(...DARK);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    if (invoiceData.company.gstin !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text("GSTIN:", M, y);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.company.gstin, M + 35, y);
      y += 14;
    }
    const headerAddr = doc.splitTextToSize(invoiceData.company.address, 250);
    if (headerAddr.length) {
      for (let i = 0; i < Math.min(headerAddr.length, 2); i++) {
        doc.text(headerAddr[i], M, y);
        y += 2;
      }
    }
    y += 12;
    if (invoiceData.company.city !== "N/A") {
      doc.text(`${invoiceData.company.city}`, M, y);
    }
    y += 1;
    if (invoiceData.company.pan !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text("PAN:", M, y + 11);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.company.pan, M + 28, y + 11);
      y += 11;
    }
    if (invoiceData.company.phone !== "N/A") {
      y += 12;
      doc.setFont("helvetica", "bold");
      doc.text("Phone:", M, y);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.company.phone, M + 35, y);
    }
    y += 14;
    if (invoiceData.company.state !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text("State:", M, y);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.company.state, M + 30, y);
    }
    y += 6;

    // Logo
    const logoSize = 60;
    const logoX = getW() - M - logoSize;
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, "PNG", logoX, M, logoSize, logoSize);
      } catch (e) {
        // Fallback to default logo (empty for now)
      }
    }

    // Separator
    y = Math.max(y, M + logoSize + 20);
    doc.setDrawColor(0, 110, 200);
    doc.setLineWidth(1.5);
    doc.line(M, y + 4, getW() - M, y + 4);
    return y + 20;
  };

  let headerBottomY = drawStaticHeader();

  const drawCustomerMetaBlock = (startY: number): number => {
    let detailY = startY;
    // LEFT: Customer Details
    let leftY = detailY;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.setFontSize(10);
    doc.text("Customer Details:", M, leftY);
    leftY += 16;
    doc.setFontSize(9);

    if (invoiceData.invoiceTo.name !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text("Name:", M, leftY);
      doc.setFont("helvetica", "normal");
      doc.text(capitalizeWords(invoiceData.invoiceTo.name), M + 30, leftY);
      leftY += 12;
    }

    if (invoiceData.invoiceTo.email !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text("Email:", M, leftY);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.invoiceTo.email, M + 30, leftY);
      leftY += 12;
    }

    

    doc.setFont("helvetica", "bold");
    doc.text("Phone No:", M, leftY);
    doc.setFont("helvetica", "normal");
    doc.text(`${party?.contactNumber}`, M + 50, leftY);
    leftY += 12;

    if (invoiceData.invoiceTo.gstin !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text("GSTIN:", M, leftY);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.invoiceTo.gstin, M + 35, leftY);
      leftY += 12;
    }

    if (invoiceData.invoiceTo.pan !== "N/A") {
      doc.setFont("helvetica", "bold");
      doc.text("PAN:", M, leftY);
      doc.setFont("helvetica", "normal");
      doc.text(invoiceData.invoiceTo.pan, M + 30, leftY);
      leftY += 12;
    }

    const billAddressLines = doc.splitTextToSize(
      invoiceData.invoiceTo.billingAddress,
      170
    );
    if (billAddressLines.length) {
      doc.setFont("helvetica", "bold");
      doc.text("Address:", M, leftY);
      doc.setFont("helvetica", "normal");
      doc.text(billAddressLines, M + 40, leftY);
      leftY += billAddressLines.length * 12;
    }

    doc.setFont("helvetica", "bold");
    doc.text("Place of Supply:", M, leftY);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.placeOfSupply, M + 72, leftY);
    leftY += 12;

    // MIDDLE: Shipping
    const middleX = M + 220;
    let middleY = detailY;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK);
    doc.setFontSize(10);
    doc.text("Shipping address:", middleX, middleY);
    middleY += 16;
    doc.setFontSize(9);

    // Name
    doc.setFont("helvetica", "bold");
    doc.text("Name:", middleX, middleY);
    const shippingName =
      invoiceData.shippingAddress.name &&
      invoiceData.shippingAddress.name !== "N/A" &&
      invoiceData.shippingAddress.name !== "Client Name"
        ? capitalizeWords(invoiceData.shippingAddress.name)
        : "-";
    doc.setFont("helvetica", "normal");
    doc.text(shippingName, middleX + 40, middleY);
    middleY += 12;

    // Phone
    doc.setFont("helvetica", "bold");
    doc.text("Phone:", middleX, middleY);
    const phoneNumber =
      shippingAddress?.contactNumber && shippingAddress.contactNumber !== "N/A"
        ? shippingAddress.contactNumber
        : "-";
    doc.setFont("helvetica", "normal");
    doc.text(phoneNumber, middleX + 40, middleY);
    middleY += 12;

    // GSTIN
    doc.setFont("helvetica", "bold");
    doc.text("GSTIN:", middleX, middleY);
    const shippingGSTIN = _getGSTIN(shippingAddressSource) || _getGSTIN(party);
    doc.setFont("helvetica", "normal");
    doc.text(shippingGSTIN || "-", middleX + 40, middleY);
    middleY += 12;

    // Address
    doc.setFont("helvetica", "bold");
    doc.text("Address:", middleX, middleY);
    let addressToDisplay = invoiceData.shippingAddress.address;
    if (
      !addressToDisplay ||
      addressToDisplay.toLowerCase().includes("address missing") ||
      addressToDisplay.toLowerCase().includes("-") ||
      addressToDisplay === "-"
    ) {
      addressToDisplay = "-";
    }
    doc.setFont("helvetica", "normal");
    const shipAddressLines = doc.splitTextToSize(addressToDisplay, 140);
    doc.text(shipAddressLines, middleX + 42, middleY);
    middleY += shipAddressLines.length * 12;

    // State
    doc.setFont("helvetica", "bold");
    doc.text("State:", middleX, middleY);
    const stateValue =
      invoiceData.shippingAddress.state !== "N/A"
        ? invoiceData.shippingAddress.state
        : "-";
    doc.setFont("helvetica", "normal");
    doc.text(stateValue, middleX + 40, middleY);
    middleY += 12;

    // Country
    doc.setFont("helvetica", "bold");
    doc.text("Country:", middleX, middleY);
    doc.setFont("helvetica", "normal");
    doc.text("India", middleX + 40, middleY);
    middleY += 12;

    const rightX = getW() - M - 120;
    let rightY = detailY;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const metaLabels = [
      "Invoice # :",
      "Invoice Date :",
      "P.O. No. :",
      "P.O. Date :",
      "E-Way No. :",
    ];
    const metaValues = [
      invoiceData.invoiceNumber,
      invoiceData.date,
      invoiceData.poNumber,
      invoiceData.poDate,
      invoiceData.eWayNo,
    ];
    for (let i = 0; i < metaLabels.length; i++) {
      doc.text(metaLabels[i], rightX, rightY);
      let displayValue = metaValues[i];

      if (displayValue === "N/A") {
        displayValue = "-";
      }

      doc.setFont("helvetica", "normal");
      doc.text(displayValue, rightX + 62, rightY);
      doc.setFont("helvetica", "bold");

      rightY += 14;
    }
    return Math.max(leftY, middleY, rightY) + 10;
  };

  let blockBottomY = drawCustomerMetaBlock(headerBottomY);
  const REPEATING_HEADER_HEIGHT = blockBottomY;
  let cursorY = blockBottomY;

  // ---------------- items table (DYNAMIC with GST logic) ----------------

  // Build dynamic column styles based on GST type
  const columnStyles: any = {};
  colWidths.forEach((width, index) => {
    columnStyles[index] = {
      cellWidth: width,
      halign:
        index === 0 || index === 2 || index === 6 || index === 8 || index === 4 || index === 1
          ? "center"
          : index >= 3 && index <= 11
          ? "center"
          : "center",
      valign: "middle", // Ensure vertical alignment
    };
  });


  // Build dynamic headers based on GST type
  const buildHeaders = () => {
    const baseHeaders = [
      "Sr. No.",
      "Name of Product / Service",
      "HSN/SAC",
      "Rate",
      "Qty",
      "Taxable Value",
    ];

    if (showIGST) {
      return [...baseHeaders, "IGST %", "IGST Amount", "Total"];
    } else if (showCGSTSGST) {
      return [
        ...baseHeaders,
        "CGST %",
        "CGST Amount",
        "SGST %",
        "SGST Amount",
        "Total",
      ];
    } else {
      return [...baseHeaders, "Total"];
    }
  };

  // Build dynamic body data based on GST type
  const buildBodyData = () => {
    return lines.map((it: DynamicLineItem, i: number) => {
      const nameAndDesc = `${capitalizeWords(it.name || "")}\n${
        it.description ? it.description.split("\n").join(" / ") : ""
      }`;

      const baseData = [
        i + 1,
        nameAndDesc,
        it.hsnSac || "N/A",
        money(it.pricePerUnit),
      `${Number(it.quantity)} ${it.unit || ""}`,
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
      fontSize: 8,
      cellPadding: { top: 0, right: 3, bottom: 0, left: 3 },
      lineColor: BORDER,
      lineWidth: 0.3,
      
      textColor: DARK,
      valign: "middle",
      halign: "center",
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [0, 110, 200],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
      minCellHeight: 20,
      valign: "middle",
      // align: "center",
      halign: "center",
    },
    columnStyles,
    head: [buildHeaders()],
    body: buildBodyData(),
    didParseCell: (d) => {
      // Special styling for Name of Product / Service column (index 1)
      if (d.column.dataKey === 1) {
        d.cell.styles.fontSize = 7.5;
        d.cell.styles.halign = "center";
        d.cell.styles.valign = "middle";
        // Force minimum height to ensure proper vertical centering
        d.cell.styles.minCellHeight = 1;
      }
    },
    didDrawPage: (data) => {
      const hdrY = drawStaticHeader();
      drawCustomerMetaBlock(hdrY);
    },
    margin: { left: M, right: M, top: blockBottomY },
    theme: "grid",
  });

  let afterTableY = (doc as any).lastAutoTable.finalY || cursorY + 20;

  // --------------- Totals Summary Block (DYNAMIC) ---------------
  const totalsW = 200;
  const totalsX = getW() - M - totalsW;

  const pageH = doc.internal.pageSize.getHeight();
doc.setLineWidth(1);
  const ensureSpace = (needed: number): number => {
    const H = doc.internal.pageSize.getHeight();
    const bottomSafe = H - M;
    if (cursorY + needed > bottomSafe) {
      doc.addPage();
      const headerY = drawStaticHeader();
      drawCustomerMetaBlock(headerY);
      return REPEATING_HEADER_HEIGHT;
    }
    return cursorY;
  };

  if (afterTableY + 140 > pageH - M) {
    cursorY = afterTableY;
    cursorY = ensureSpace(140);
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
    doc.setFontSize(9);
    doc.text(label, totalsX + 12, y);
    doc.text(val, totalsX + totalsW - 12, y, { align: "right" });
  };

  let currentTotalsY = totalsY;

  // Row 1: Taxable Amount
  doc.setDrawColor(...BORDER);
  doc.setFillColor(255, 255, 255);
  doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
  putTotalLine("Taxable Amount", totalTaxableAmount, currentTotalsY + 12);
  currentTotalsY += 18;

  // GST breakdown rows (only if GST is applicable)
  if (isGSTApplicable) {
    if (showIGST) {
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
      putTotalLine("IGST", money(totalIGST), currentTotalsY + 12);
      currentTotalsY += 18;
    } else if (showCGSTSGST) {
      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
      putTotalLine("CGST", money(totalCGST), currentTotalsY + 12);
      currentTotalsY += 18;

      doc.setFillColor(255, 255, 255);
      doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
      putTotalLine("SGST", money(totalSGST), currentTotalsY + 12);
      currentTotalsY += 18;
    }
  }

  // Final Total Amount
  doc.setFillColor(240, 240, 240);
  doc.rect(totalsX, currentTotalsY, totalsW, 18, "FD");
  putTotalLine("Total Amount", finalTotalAmount, currentTotalsY + 12, true);
  currentTotalsY += 24;

  // Total Items / Qty line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Total Items / Qty : ${totalItems} / ${totalQuantity.toFixed(2)}`,
    M,
    afterTableY + 16
  );

  // Amount in Words
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text("Total amount (in words):", M, currentTotalsY + 10);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    ` ${convertNumberToWords(invoiceTotal)}`,
    M + 105,
    currentTotalsY + 10,
    { maxWidth: 420 }
  );

  cursorY = currentTotalsY + 25;
 doc.setDrawColor(0, 110, 200);
  doc.setLineWidth(1);
  doc.line(M, cursorY, getW() - M, cursorY);
  // ---------------- Bank Details & UPI (Left Block) and Signature (Right Block) ----------------

  const bankBlockH = 90;
  const requiredFooterSpace = bankBlockH + 20;

  cursorY = ensureSpace(requiredFooterSpace);

  const blockY = cursorY + 20;

  // LEFT: Bank Details & UPI (Dynamic)
  let bankY = blockY;

  const dynamicBankDetails =
    bank && typeof bank === "object" && (bank as any).bankName
      ? {
          name: capitalizeWords((bank as any).bankName || "N/A"),
          branch: capitalizeWords(
            (bank as any).branchName || (bank as any).branchAddress || "N/A"
          ),
          accNumber: (bank as any).accountNumber || "N/A",
          ifsc: capitalizeWords((bank as any).ifscCode || "N/A"),
          upiId: (bank as any).upiId || "N/A",
        }
      : getBankDetails();

  const areBankDetailsAvailable = dynamicBankDetails.name !== "Bank Details -";

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  if (areBankDetailsAvailable) {
    doc.text("Pay using UPI:", M, bankY);
    doc.text("Bank Details:", M + 120, bankY);
  } else {
    doc.text("Bank Details:", M, bankY);
  }

  bankY += 16;

  // UPI QR Code (Placeholder)
  const qrSize = 60;
  if (areBankDetailsAvailable) {
    doc.setDrawColor(220, 224, 228);
    doc.setFillColor(240, 240, 240);
    doc.setLineWidth(0.1); 
    doc.rect(M + 2, bankY, qrSize, qrSize, "FD");
  }

  // Bank Details
  let bankDetailY = bankY;
  const bankX = areBankDetailsAvailable ? M + 120 : M;
  doc.setFontSize(8);

  const putBankDetail = (label: string, val: string, y: number) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, bankX, y);
    doc.setFont("helvetica", "normal");
    doc.text(val, bankX + 60, y);
  };

  if (areBankDetailsAvailable) {
    putBankDetail("Bank Name :", dynamicBankDetails.name, bankDetailY);
    bankDetailY += 12;
    putBankDetail("Branch :", dynamicBankDetails.branch, bankDetailY);
    bankDetailY += 12;
    putBankDetail("IFSC :", dynamicBankDetails.ifsc, bankDetailY);
    bankDetailY += 12;
    putBankDetail("Acc. Number :", dynamicBankDetails.accNumber, bankDetailY);
    bankDetailY += 12;
    putBankDetail("UPI ID:", dynamicBankDetails.upiId, bankDetailY);
    bankDetailY += 12;
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("No bank details available", bankX, bankDetailY);
    bankDetailY += 40;
  }

  // RIGHT: Signature Block
  const sigX = getW() - M - 150;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  doc.text(
    `For ${capitalizeWords(invoiceData.company.name)}`,
    sigX + 14,
    blockY + 5
  );

  // Signature/Stamp Placeholder
  const sigHeight = 50;
  const sigWidth = 150;
  doc.setDrawColor(...BORDER)
  doc.setLineWidth(0.1); 
  doc.rect(sigX, blockY + 15, sigWidth, sigHeight, "S");

  cursorY = Math.max(bankY + qrSize, blockY + sigHeight) + 20;

  // ---------------- Terms and Conditions ----------------
  cursorY = ensureSpace(80);
 
  cursorY += 0;

  let termsY = cursorY;

  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);

  doc.text(`${termsTitle}:`, M, termsY);
  termsY += 13;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);

  if (termsList.length > 0) {
    termsList.forEach((item) => {
      const formattedItem = isList ? `• ${item}` : item;
      const itemLines = doc.splitTextToSize(formattedItem, 300);
      doc.text(itemLines, M, termsY);
      termsY += itemLines.length * 10;
    });
  } else {
    doc.text("No terms and conditions specified", M, termsY);
    termsY += 10;
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

  return doc;
};