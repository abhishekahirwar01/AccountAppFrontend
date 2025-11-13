import {
  parseHtmlToElementsForJsPDF,
  renderParsedElementsWithJsPDF,
} from "./jspdf-html-renderer";

import type {
  Company,
  Party,
  Transaction,
  ShippingAddress,
  Bank,
} from "@/lib/types";
import jsPDF from "jspdf";
import autoTable, { RowInput, Styles } from "jspdf-autotable";
import {
  getBillingAddress,
  getShippingAddress,
  getUnifiedLines,
  prepareTemplate8Data,
  invNo,
  formatCurrency,
  numberToWords,
  getStateCode,
  renderNotes,
} from "./pdf-utils";
import { capitalizeWords } from "./utils";
import { formatQuantity } from "@/lib/pdf-utils";
import { formatPhoneNumber } from "@/lib/pdf-utils";

// =======================================================================
// === MAIN FUNCTION TO RENDER HTML NOTES WITH jsPDF (Wrapper) ===
// =======================================================================

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
  const elements = parseHtmlToElementsForJsPDF(htmlNotes, 9);
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

// =======================================================================
// === MAIN PDF GENERATION FUNCTION ===
// =======================================================================

export const generatePdfForTemplate11 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null,
  opts?: { displayCompanyName?: string; logoUrl?: string },
  bank?: Bank | null
): Promise<jsPDF> => {
  // ---------- palette and helper functions ----------
  const COLOR = {
    PRIMARY: [38, 70, 83] as [number, number, number],
    TEXT: [52, 58, 64] as [number, number, number],
    SUB: [108, 117, 125] as [number, number, number],
    BORDER: [206, 212, 218] as [number, number, number],
    BG: [248, 249, 250] as [number, number, number],
    WHITE: [255, 255, 255] as [number, number, number],
    BLUE: [0, 102, 204] as [number, number, number],
  };

  const BORDER_WIDTH = 0.01;

  const detectGSTIN = (x?: Partial<Company | Party> | null): string | null => {
    const a = x as any;
    const gstin =
      a?.gstin ??
      a?.GSTIN ??
      a?.gstIn ??
      a?.GSTIn ??
      a?.gstNumber ??
      a?.GSTNumber ??
      a?.gst_no ??
      a?.GST_no ??
      a?.GST ??
      a?.gstinNumber ??
      a?.tax?.gstin;
    return (gstin || "").toString().trim() || null;
  };

  const money = (n: number) =>
    Number(n || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });

  const rupeesInWords = (n: number) =>
    `${numberToWords(Math.floor(Number(n) || 0)).toUpperCase()}`;

  const fetchAsDataURL = async (url?: string) => {
    if (!url) return "";
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result as string);
        fr.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  };

  const shouldHideBankDetails = transaction.type === "proforma";

  // ---------------- START: BANK DETAILS LOGIC FROM TEMPLATE 19 ----------------
  const handleUndefined = (value: any, fallback: string = "-"): string => {
    if (value === undefined || value === null) return fallback;
    if (typeof value === "string" && value.trim() === "") return fallback;
    if (value === "N/A") return fallback;
    return value.toString();
  };

  const getBankDetailsFallback = () => ({
    name: "Bank Details Not Available",
    branch: "N/A",
    accNumber: "N/A",
    ifsc: "N/A",
    upiId: "N/A",
    contactNumber: "N/A",
    city: "N/A",
  });

  const dynamicBankDetails = (() => {
    if (!bank || typeof bank !== "object") {
      return getBankDetailsFallback();
    }

    const bankObj = bank as any;

    const hasBankDetails =
      bankObj.bankName ||
      bankObj.branchName ||
      bankObj.branchAddress ||
      bankObj.accountNumber ||
      bankObj.accountNo ||
      bankObj.ifscCode ||
      bankObj.upiDetails?.upiId ||
      bankObj.upiId;

    if (!hasBankDetails) {
      return getBankDetailsFallback();
    }

    const accountNumber =
      bankObj.accountNo ||
      bankObj.accountNumber ||
      bankObj.account_number ||
      "N/A";

    const upiId =
      bankObj.upiDetails?.upiId || bankObj.upiId || bankObj.upi_id || "N/A";

    return {
      name: handleUndefined(capitalizeWords(bankObj.bankName)),
      branch: handleUndefined(
        capitalizeWords(bankObj.branchName || bankObj.branchAddress)
      ),
      accNumber: handleUndefined(String(accountNumber)),
      ifsc: handleUndefined(capitalizeWords(bankObj.ifscCode)),
      upiId: handleUndefined(String(upiId)),
      contactNumber: handleUndefined(bankObj.contactNumber),
      city: handleUndefined(capitalizeWords(bankObj.city)),
    };
  })();

  const areBankDetailsAvailable =
    dynamicBankDetails.name !== "Bank Details Not Available";
  // ---------------- END: BANK DETAILS LOGIC FROM TEMPLATE 19 ----------------

  // ---------- derive (Template 8 logic) ----------
  const {
    totalTaxable,
    totalAmount,
    itemsWithGST,
    totalItems,
    totalQty,
    totalCGST,
    totalSGST,
    totalIGST,
    isGSTApplicable,
    isInterstate,
    showIGST,
    showCGSTSGST,
    showNoTax,
  } = prepareTemplate8Data(transaction, company, party, shippingAddress);

  const unifiedLines = itemsWithGST?.length
    ? itemsWithGST
    : getUnifiedLines(transaction, serviceNameById)?.map((it: any) => ({
        name: it.name || transaction.description || "Service Rendered",
        description: it.description || "",
        quantity: it.quantity || 1,
        pricePerUnit:
          it.pricePerUnit ??
          it.amount ??
          Number((transaction as any)?.amount || 0),
        taxableValue: Number(
          it.amount ??
            (it.quantity || 1) *
              (it.pricePerUnit ?? Number((transaction as any)?.amount || 0))
        ),
        gstRate: Number(it.gstPercentage || 0),
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: 0,
        code: it.code || (transaction as any)?.hsn || "N/A",
        unit: it.unit || it.uom || "",
      }));

  const calcRows = (itemsWithGST?.length ? itemsWithGST : unifiedLines).map(
    (it: any, i: number) => {
      const qty = Number(it.quantity || 1);
      const rate =
        it.pricePerUnit ?? (it.taxableValue && qty ? it.taxableValue / qty : 0);

      const taxable = Number(it.taxableValue ?? qty * rate);
      const gstPct = Number(it.gstRate ?? it.gstPercentage ?? 0);

      const cgst = Number(it.cgst || 0);
      const sgst = Number(it.sgst || 0);
      const igst = Number(it.igst || 0);
      const total = Number(it.total ?? taxable + cgst + sgst + igst);

      const desc = `${capitalizeWords(it?.name || "")}${
        it?.description ? " — " + it.description : ""
      }`;

      return {
        sr: i + 1,
        desc,
        hsn: it?.code || "N/A",
        qty: qty,
        unit: it?.unit || "",
        rate: Number(rate || 0),
        taxable,
        gstPct,
        cgst,
        sgst,
        igst,
        total,
      };
    }
  );

  const totalTaxableValue = Number(totalTaxable || 0);
  const invoiceTotalAmount = Number(totalAmount || 0);
  const sumCGST = Number(totalCGST || 0);
  const sumSGST = Number(totalSGST || 0);
  const sumIGST = Number(totalIGST || 0);

  const gstEnabled = !!isGSTApplicable;
  const shouldShowIGSTColumns = !!showIGST;
  const shouldShowCGSTSGSTColumns = !!showCGSTSGST;

  // Address and metadata logic
  const companyGSTIN = detectGSTIN(company) || "";
  const billingAddress = getBillingAddress(party);
  const shippingAddressStr = getShippingAddress(
    shippingAddress,
    billingAddress
  );

  const displayedCompanyName =
    opts?.displayCompanyName?.trim() || (company?.businessName || "").trim();
  const partyAsAny = party as any;
  const partyPhone =
    (partyAsAny?.mobileNumber && typeof partyAsAny.mobileNumber === "string"
      ? partyAsAny.mobileNumber.trim()
      : "") ||
    (partyAsAny?.phone && typeof partyAsAny.phone === "string"
      ? partyAsAny.phone.trim()
      : "") ||
    (partyAsAny?.contactNumber && typeof partyAsAny.contactNumber === "string"
      ? partyAsAny.contactNumber.trim()
      : "") ||
    "-";

  const invoiceData = {
    invoiceNumber: invNo(transaction),
    date: transaction.date
      ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
      : new Intl.DateTimeFormat("en-GB").format(new Date()),
    company: {
      name: displayedCompanyName || " ",
      address: company?.address || "",
      email: (company as any)?.emailId || "",
      phone: (company as any)?.mobileNumber || "",
      gstin: companyGSTIN,
      logoUrl: opts?.logoUrl || (company as any)?.logoUrl || "",
      state: company?.addressState || "-",
    },
    billTo: {
      name: party?.name || "",
      billing: billingAddress || "-",
      shipping: shippingAddressStr || "-",
      email: (party as any)?.email || "",
      gstin: detectGSTIN(party) || "",
    },
    notes: (transaction as any)?.notes || "",
    totalInWords: rupeesInWords(invoiceTotalAmount),
  };

  const buyerState = party?.state || "-";
  const consigneeState = shippingAddress?.state
    ? `${shippingAddress.state} (${getStateCode(shippingAddress.state) || "-"})`
    : party?.state
    ? `${party.state} (${getStateCode(party.state) || "-"})`
    : "-";

  // ---------- doc scaffold ----------
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  const margin = 36;
  const contentWidth = pw - margin * 2;
  const gutter = 10;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLOR.TEXT);

  // Pre-fetch logo
  const logoDataURL = await fetchAsDataURL(invoiceData.company.logoUrl);

  // ---------- Reusable header drawing function ----------
  let DYNAMIC_HEADER_HEIGHT = 228;

  const drawCompleteHeader = (isFirstPage: boolean = false) => {
    // Draw white background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pw, DYNAMIC_HEADER_HEIGHT, "F");

    // Company info section
    if (isFirstPage && logoDataURL) {
      try {
        doc.addImage(logoDataURL, "PNG", margin + gutter - 8, 20, 60, 56);
      } catch {}
    }

    const nameX =
      isFirstPage && logoDataURL ? margin + gutter + 70 : margin + gutter;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COLOR.PRIMARY);
    doc.text(
      capitalizeWords((invoiceData.company.name || "").toUpperCase()),
      nameX - 10,
      45
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...COLOR.SUB);

    const addr = (company?.address || "").trim();
    const stateText = company?.addressState ? `, ${company.addressState}` : "";
    const baseAddressText = addr + stateText;

    const textYStart = 60;
    const textX = nameX - 10;
    const maxWidth = contentWidth - (nameX - margin) - gutter;
    const lineHeight = 8;

    let finalY = textYStart;
    if (baseAddressText.length > 0) {
      const addressLines = doc.splitTextToSize(baseAddressText, maxWidth);
      doc.text(addressLines, textX, finalY);
      finalY += addressLines.length * lineHeight;
    }

    const phoneText = invoiceData.company.phone || "";

    if (phoneText.length > 0) {
      const formattedPhone = formatPhoneNumber(phoneText);
      const phoneY = baseAddressText.length > 0 ? finalY + 4 : textYStart;

      doc.setFont("helvetica", "bold");
      doc.text("Phone No: ", textX, phoneY);

      doc.setFont("helvetica", "normal");

      const labelWidth =
        doc.getStringUnitWidth("Phone No: ") * doc.getFontSize();
      const phoneX = textX + labelWidth;

      doc.text(formattedPhone, phoneX, phoneY, {
        maxWidth: maxWidth - labelWidth,
      });
    }

    // Blue header bar
    const headerBarY = 90;
    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(BORDER_WIDTH);
    doc.line(margin, headerBarY - 10, margin + contentWidth, headerBarY - 10);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...COLOR.TEXT);

    const gstText = invoiceData.company.gstin
      ? `GSTIN: ${invoiceData.company.gstin}`
      : "GSTIN: -";

    doc.text(gstText, margin + gutter - 6, headerBarY + 2);
    doc.text(
      transaction.type === "proforma"
        ? "PROFORMA INVOICE"
        : gstEnabled
        ? "TAX INVOICE"
        : "INVOICE",
      margin + contentWidth / 2,
      headerBarY + 2,
      { align: "center" }
    );
    doc.text(
      "ORIGINAL FOR RECIPIENT",
      margin + contentWidth - gutter + 5,
      headerBarY + 2,
      { align: "right" }
    );

    // Three-column info box with DYNAMIC HEIGHT
    const row = (
      label: string,
      value: string | string[] | undefined,
      x: number,
      y: number,
      colW: number
    ) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const labelWidth =
        (doc.getStringUnitWidth(label) * doc.getFontSize()) /
        doc.internal.scaleFactor;
      const labelW = Math.max(labelWidth + 5, 45);
      const lineHeight = 10;

      doc.setTextColor(...COLOR.TEXT);
      doc.text(label, x + gutter, y);

      doc.setFont("helvetica", "normal");
      const txX = x + gutter + labelW;
      const txW = colW - (txX - x) - gutter;

      const capitalizedValue = capitalizeWords((value || "-") as string);
      const lines = doc.splitTextToSize(capitalizedValue, txW);
      doc.text(lines, txX, y);

      return y + lines.length * lineHeight + 2;
    };

    const topY = 96;
    const bw = contentWidth;

    const w1 = bw * 0.33;
    const w2 = bw * 0.33;
    const w3 = bw * 0.33 + 5;

    const x1 = margin;
    const x2 = margin + w1;
    const x3 = margin + w1 + w2;

    const subHeadH = 18;

    // CALCULATE DYNAMIC HEIGHTS for each column
    let yL = topY + subHeadH + 15;
    let yM = topY + subHeadH + 15;
    let yR = topY + subHeadH + 15;

    // Buyer details
    const buyerStartY = yL;
    yL = row("Name:", invoiceData.billTo.name, x1 - 5, yL, w1);
    yL = row("Address:", invoiceData.billTo.billing || "-", x1 - 5, yL, w1);
    // yL = row("State:", capitalizeWords(buyerState), x1 - 5, yL, w1);
    yL = row(
      "Phone:",
      partyPhone && partyPhone !== "-" ? formatPhoneNumber(partyPhone) : "-",
      x1 - 5,
      yL,
      w1
    );
    yL = row("GSTIN:", invoiceData.billTo.gstin || "-", x1 - 5, yL, w1);
    yL = row("PAN:", party?.pan || "-", x1 - 5, yL, w1);
    yL = row(
      "Place of Supply:",
      shippingAddress?.state
        ? `${shippingAddress.state} (${
            getStateCode(shippingAddress.state) || "-"
          })`
        : party?.state
        ? `${party.state} (${getStateCode(party.state) || "-"})`
        : "-",
      x1 - 5,
      yL,
      w1
    );
    const buyerEndY = yL;

    // Consignee details
    const consigneeName =
      (party as any)?.consigneeName || invoiceData.billTo.name || "";
    const consigneeAddr =
      invoiceData.billTo.shipping || invoiceData.billTo.billing || "-";
    const consigneeCountry =
      (shippingAddress as any)?.country || (party as any)?.country || "India";
    const consigneePhone = shippingAddress?.contactNumber || partyPhone || "-";
    const consigneeGST = invoiceData.billTo.gstin || "-";

    const consigneeStartY = yM;
    yM = row("Name:", consigneeName, x2 - 5, yM, w2);
    yM = row("Address:", consigneeAddr, x2 - 5, yM, w2);

    yM = row("Country:", capitalizeWords(consigneeCountry), x2 - 5, yM, w2);
    yM = row(
      "Phone:",
      consigneePhone && consigneePhone !== "-"
        ? formatPhoneNumber(consigneePhone)
        : "-",
      x2 - 5,
      yM,
      w2
    );
    yM = row("GSTIN:", consigneeGST, x2 - 5, yM, w2);
    yM = row("State:", capitalizeWords(consigneeState), x2 - 5, yM, w2);
    const consigneeEndY = yM;

    // Invoice metadata
    const meta = {
      "Invoice No:": invoiceData.invoiceNumber,
      "Invoice Date:": invoiceData.date,
      "Due Date:": (transaction as any)?.dueDate
        ? new Intl.DateTimeFormat("en-GB").format(
            new Date((transaction as any).dueDate)
          )
        : "-",
      "P.O. No:": (transaction as any)?.poNumber || "-",
      "P.O. Date:": (transaction as any)?.poDate
        ? new Intl.DateTimeFormat("en-GB").format(
            new Date((transaction as any).poDate)
          )
        : "-",
      "E-Way No:": (transaction as any)?.ewayBillNo || "-",
    };

    const metaStartY = yR;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    Object.entries(meta).forEach(([k, v]) => {
      doc.setFont("helvetica", "bold");
      doc.text(k, x3 - 5 + gutter, yR);
      doc.setFont("helvetica", "normal");
      doc.text(String(v || "-"), x3 - 5 + w3 - gutter, yR, { align: "right" });
      yR += 12;
    });
    const metaEndY = yR;

    // Calculate the MAXIMUM height needed
    const buyerHeight = buyerEndY - buyerStartY;
    const consigneeHeight = consigneeEndY - consigneeStartY;
    const metaHeight = metaEndY - metaStartY;
    const maxContentHeight = Math.max(buyerHeight, consigneeHeight, metaHeight);

    const boxH = maxContentHeight + subHeadH + 20;

    // Draw the box with dynamic height
    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(BORDER_WIDTH);
    doc.line(margin, headerBarY - 10.3, margin, topY);
    doc.line(
      margin + contentWidth,
      headerBarY - 10.3,
      margin + contentWidth,
      topY
    );

    doc.rect(margin, topY, bw, boxH, "S");

    doc.setLineWidth(BORDER_WIDTH);
    doc.line(x2, topY, x2, topY + boxH);
    doc.line(x3, topY, x3, topY + boxH);

    doc.line(x1, topY + subHeadH, x1 + w1, topY + subHeadH);
    doc.line(x2, topY + subHeadH, x2 + w2, topY + subHeadH);
    doc.line(x3, topY + subHeadH, x3 + w3, topY + subHeadH);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.TEXT);
    doc.text(
      "Details of Buyer | Billed to :",
      x1 - 6 + gutter,
      topY + subHeadH - 5
    );
    doc.text(
      "Details of Consignee | Shipped to :",
      x2 - 6 + gutter,
      topY + subHeadH - 5
    );

    DYNAMIC_HEADER_HEIGHT = topY + boxH;
  };

  // Draw first page header
  drawCompleteHeader(true);

  // ---------- TABLE ----------
  // Define explicit column widths for better control
  const columnStyles: { [key: number]: Partial<Styles> } = shouldShowIGSTColumns
    ? {
        0: { cellWidth: 30 }, // Sr.No.
        1: { cellWidth: 113 }, // Name - adjust this value as needed
        2: { cellWidth: 50 }, // HSN/SAC
        3: { cellWidth: 45 }, // Qty
        4: { cellWidth: 50 }, // Rate
        5: { cellWidth: 70 }, // Taxable Value
        6: { cellWidth: 40 }, // IGST%
        7: { cellWidth: 60 }, // IGST Amt
        8: { cellWidth: 65 }, // Total
      }
    : shouldShowCGSTSGSTColumns
    ? {
        0: { cellWidth: 20 }, // Sr.No.
        1: { cellWidth: 100 }, // Name - adjust this value as needed
        2: { cellWidth: 43 }, // HSN/SAC
        3: { cellWidth: 38 }, // Qty
        4: { cellWidth: 42 }, // Rate
        5: { cellWidth: 60 }, // Taxable Value
        6: { cellWidth: 38 }, // CGST%
        7: { cellWidth: 45 }, // CGST Amt
        8: { cellWidth: 38 }, // SGST%
        9: { cellWidth: 45 }, // SGST Amt
        10: { cellWidth: 55 }, // Total
      }
    : {
        0: { cellWidth: 35 }, // Sr.No.
        1: { cellWidth: 122 }, // Name - adjust this value as needed
        2: { cellWidth: 60 }, // HSN/SAC
        3: { cellWidth: 60 }, // Qty
        4: { cellWidth: 75 }, // Rate
        5: { cellWidth: 85 }, // Taxable Value
        6: { cellWidth: 85 }, // Total
      };

  const head: RowInput[] = shouldShowIGSTColumns
    ? [
        [
          { content: "Sr.No.", styles: { halign: "center" } },
          {
            content: "Name of Product / Service",
            styles: { halign: "center" },
          },
          { content: "HSN/SAC", styles: { halign: "center" } },
          { content: "Qty", styles: { halign: "center" } },
          { content: "Rate (Rs)", styles: { halign: "center" } },
          { content: "Taxable Value (Rs)", styles: { halign: "center" } },
          { content: "IGST% (Rs)", styles: { halign: "center" } },
          { content: "IGST Amt (Rs)", styles: { halign: "center" } },
          { content: "Total(Rs)", styles: { halign: "center" } },
        ],
      ]
    : shouldShowCGSTSGSTColumns
    ? [
        [
          { content: "Sr.No.", styles: { halign: "center" } },
          {
            content: "Name of Product / Service",
            styles: { halign: "center" },
          },
          { content: "HSN/SAC", styles: { halign: "center" } },
          { content: "Qty", styles: { halign: "center" } },
          { content: "Rate (Rs)", styles: { halign: "center" } },
          { content: "Taxable Value (Rs)", styles: { halign: "center" } },
          { content: "CGST% (Rs)", styles: { halign: "center" } },
          { content: "CGST Amt (Rs)", styles: { halign: "center" } },
          { content: "SGST% (Rs)", styles: { halign: "center" } },
          { content: "SGST Amt (Rs)", styles: { halign: "center" } },
          { content: "Total(Rs)", styles: { halign: "center" } },
        ],
      ]
    : [
        [
          { content: "Sr.No.", styles: { halign: "left" } },
          { content: "Name of Product / Service", styles: { halign: "left" } },
          { content: "HSN/SAC", styles: { halign: "left" } },
          { content: "Qty", styles: { halign: "center" } },
          { content: "Rate(Rs)", styles: { halign: "center" } },
          { content: "Taxable Value (Rs)", styles: { halign: "center" } },
          { content: "Total(Rs)", styles: { halign: "center" } },
        ],
      ];

  const body: RowInput[] = calcRows.map((r) => {
    const qtyCell = formatQuantity(r.qty, r.unit);

    if (shouldShowIGSTColumns) {
      return [
        String(r.sr),
        { content: r.desc },
        r.hsn,
        { content: qtyCell, styles: { halign: "left" } },
        { content: money(r.rate), styles: { halign: "right" } },
        { content: money(r.taxable), styles: { halign: "right" } },
        {
          content: `${(r.gstPct || 0).toFixed(2)}%`,
          styles: { halign: "center" },
        },
        { content: money(r.igst), styles: { halign: "right" } },
        { content: money(r.total), styles: { halign: "right" } },
      ];
    } else if (shouldShowCGSTSGSTColumns) {
      const halfPct = ((r.gstPct || 0) / 2).toFixed(2);
      return [
        String(r.sr),
        { content: r.desc },
        r.hsn,
        { content: qtyCell, styles: { halign: "left" } },
        { content: money(r.rate), styles: { halign: "right" } },
        { content: money(r.taxable), styles: { halign: "right" } },
        { content: `${halfPct}%`, styles: { halign: "center" } },
        { content: money(r.cgst), styles: { halign: "right" } },
        { content: `${halfPct}%`, styles: { halign: "center" } },
        { content: money(r.sgst), styles: { halign: "right" } },
        { content: money(r.total), styles: { halign: "right" } },
      ];
    } else {
      return [
        String(r.sr),
        { content: r.desc },
        r.hsn,
        { content: qtyCell, styles: { halign: "left" } },
        { content: money(r.rate), styles: { halign: "right" } },
        { content: money(r.taxable), styles: { halign: "right" } },
        { content: money(r.total), styles: { halign: "right" } },
      ];
    }
  });

  // Footer totals
  const foot: RowInput[] = shouldShowIGSTColumns
    ? [
        [
          {
            content: "Total",
            colSpan: 5,
            styles: { halign: "left", fontStyle: "bold", cellPadding: 5 },
          },
          {
            content: money(totalTaxableValue),
            styles: { halign: "right", fontStyle: "bold", cellPadding: 5 },
          },
          { content: "", styles: { halign: "center", cellPadding: 5 } },
          {
            content: money(sumIGST),
            styles: { halign: "right", fontStyle: "bold", cellPadding: 5 },
          },
          {
            content: money(invoiceTotalAmount),
            styles: { halign: "right", fontStyle: "bold", cellPadding: 5 },
          },
        ],
      ]
    : shouldShowCGSTSGSTColumns
    ? [
        [
          {
            content: "Total",
            colSpan: 5,
            styles: { halign: "left", fontStyle: "bold", cellPadding: 5 },
          },
          {
            content: money(totalTaxableValue),
            styles: { halign: "right", fontStyle: "bold", cellPadding: 5 },
          },
          { content: "", styles: { halign: "center", cellPadding: 5 } },
          {
            content: money(sumCGST),
            styles: { halign: "right", fontStyle: "bold", cellPadding: 5 },
          },
          { content: "", styles: { halign: "center", cellPadding: 5 } },
          {
            content: money(sumSGST),
            styles: { halign: "right", fontStyle: "bold", cellPadding: 5 },
          },
          {
            content: money(invoiceTotalAmount),
            styles: { halign: "right", fontStyle: "bold", cellPadding: 5 },
          },
        ],
      ]
    : [
        [
          {
            content: "Total",
            colSpan: 5,
            styles: { halign: "left", fontStyle: "bold", cellPadding: 5 },
          },
          {
            content: money(totalTaxableValue),
            styles: { halign: "right", fontStyle: "bold", cellPadding: 5 },
          },
          {
            content: money(invoiceTotalAmount),
            styles: { halign: "right", fontStyle: "bold", cellPadding: 5 },
          },
        ],
      ];

  autoTable(doc, {
    head,
    body,
    foot,
    startY: DYNAMIC_HEADER_HEIGHT,
    theme: "grid",
    margin: {
      left: margin,
      top: DYNAMIC_HEADER_HEIGHT,
      right: margin,
      bottom: 40,
    },
    showFoot: "lastPage",
    styles: {
      font: "helvetica",
      fontSize: 7.5,
      textColor: COLOR.TEXT as any,
      lineColor: COLOR.BLUE as any,
      lineWidth: BORDER_WIDTH,
      cellPadding: 4,
      valign: "top",
    },
    headStyles: {
      fillColor: [200, 225, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    footStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles,
    willDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawCompleteHeader(false);
      }
    },
  });

  // ---------- Footer box ----------
  let footerStartY = (doc as any).lastAutoTable.finalY + 20;
  const pageHeight = doc.internal.pageSize.getHeight();
  const bottomMargin = 40;

  if (footerStartY + 250 > pageHeight - bottomMargin) {
    doc.addPage();
    drawCompleteHeader(false);
    footerStartY = DYNAMIC_HEADER_HEIGHT + 12;
  }

  // Adjusted column widths: left box wider, right box narrower
  const col1W = contentWidth * 0.58; // 58% width for left box
  const col2W = contentWidth * 0.42; // 42% width for right box
  const col1X = margin;
  const col2X = margin + col1W;

  const drawHeading = (
    title: string,
    x: number,
    y: number,
    width: number
  ): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.TEXT);

    const headingW = doc.getTextWidth(title);
    const headingX = x + (width - headingW) / 2;
    doc.text(title, headingX, y);

    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(BORDER_WIDTH);
    doc.line(x, y + 4, x + width, y + 4);
    return y + 12;
  };

  let y1 = footerStartY + 15;
  let y1ContentEnd = y1;

  // Total in Words
  const headingHeight = 15;
  doc.setFillColor(200, 225, 255);
  doc.rect(col1X, y1 - 15, col1W, headingHeight, "F");
  y1 = drawHeading("Total in Words", col1X, y1 - 4, col1W);
  y1 += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const totalWordsLines = doc.splitTextToSize(
    invoiceData.totalInWords,
    col1W - 20
  );
  doc.text(totalWordsLines, col1X + gutter, y1);
  y1 += totalWordsLines.length * 12;
  y1ContentEnd = y1;

  // divider
  doc.setDrawColor(...COLOR.BLUE);
  doc.setLineWidth(BORDER_WIDTH);
  doc.line(col1X, y1, col1X + col1W, y1);
  y1 += 10;
  y1ContentEnd = y1;

  // Bank Details
if (!shouldHideBankDetails) {
  const bankHeadingHeight = 13.4;
  doc.setFillColor(200, 225, 255);
  doc.rect(col1X, y1 - 9.8, col1W, bankHeadingHeight, "F");
  y1 = drawHeading("Bank Details", col1X, y1, col1W);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y1 += 4;

  // ---------------- START: Updated Bank Details Logic ----------------
  if (areBankDetailsAvailable) {
    const bankData = bank as any;
    let currentBankY = y1;

    // Define a maximum width for the value text
    const maxTextWidth = col1W * 0.45; // 55% of left column width for bank text

    // Helper function to render a bank detail line with word wrapping for the value
    const renderBankLine = (label: string, value: string, wrapValue = false) => {
      if (value && value !== "-" && value !== "N/A") {
        doc.setFont("helvetica", "bold");
        const labelWidth = doc.getTextWidth(label);
        const startX = col1X + gutter + labelWidth;

        // 1. Draw the Label
        doc.text(label, col1X + gutter, currentBankY);

        doc.setFont("helvetica", "normal");

        if (wrapValue) {
          // 2. Split the value text into lines
          const splitText = doc.splitTextToSize(value, maxTextWidth);

          // 3. Draw the wrapped text and update Y position based on line count
          doc.text(splitText, startX, currentBankY);
          currentBankY += splitText.length * 14; // 14 units per line
        } else {
          // 2. Draw the single line value
          doc.text(value, startX, currentBankY);
          currentBankY += 14;
        }
      }
    };

    // Store the starting Y position for bank details
    const bankDetailsStartY = currentBankY;

    // Bank Name
    if (bankData?.bankName) {
      renderBankLine("Bank Name: ", dynamicBankDetails.name);
    }

    // IFSC Code
    if (bankData?.ifscCode) {
      renderBankLine("IFSC Code: ", dynamicBankDetails.ifsc);
    }

    // Account Number
    if (bankData?.accountNo || bankData?.accountNumber) {
      renderBankLine("A/C Number: ", dynamicBankDetails.accNumber);
    }

    // Branch Address
    if (bankData?.branchAddress || bankData?.branchName) {
      renderBankLine("Branch: ", dynamicBankDetails.branch, true);
    }

    // UPI ID
    if (bankData?.upiDetails?.upiId || bankData?.upiId) {
      renderBankLine("UPI ID: ", dynamicBankDetails.upiId);
    }

    // UPI Name
    if (bankData?.upiDetails?.upiName) {
      renderBankLine(
        "UPI Name: ",
        capitalizeWords(bankData.upiDetails.upiName)
      );
    }

    // UPI Mobile
    if (bankData?.upiDetails?.upiMobile) {
      renderBankLine("UPI Mobile: ", bankData.upiDetails.upiMobile);
    }

    // Add QR Code on the right side of bank details if available
    if (bankData?.qrCode) {
      try {
        const qrCodeUrl = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/${bankData.qrCode}`;
        const qrDataURL = await fetchAsDataURL(qrCodeUrl);
        
        if (qrDataURL) {
          const qrSize = 85;
          const qrX = col1X + col1W - qrSize - gutter + 10;
          const qrY = bankDetailsStartY + 5;
          
          // Draw "QR Code" label
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          const qrLabel = "QR Code";
          const qrLabelWidth = doc.getTextWidth(qrLabel);
          doc.text(qrLabel, qrX + (qrSize - qrLabelWidth) / 2, qrY - 5);
          
          // Draw QR code image
          doc.addImage(qrDataURL, "PNG", qrX - 2, qrY, qrSize + 5, qrSize - 12);
        }
      } catch (error) {
        console.error("Error loading QR code:", error);
      }
    }

    y1 = currentBankY;
  } else {
    doc.setFont("helvetica", "normal");
    doc.text("Bank details not available", col1X + gutter, y1);
    y1 += 14;
  }
  // ---------------- END: Updated Bank Details Logic ----------------
  y1ContentEnd = y1;

  // divider after bank details
  doc.setDrawColor(...COLOR.BLUE);
  doc.setLineWidth(BORDER_WIDTH);
  doc.line(col1X, y1ContentEnd, col1X + col1W, y1ContentEnd);
  y1ContentEnd += 10;
}

  // Terms & Conditions
  doc.setFillColor(200, 225, 255);

  let tncCursorY = y1ContentEnd + 10;
  const TNC_MAX_WIDTH = col1W - 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  if ((transaction as any)?.notes) {
    // *** Use the new Rich Text HTML Renderer ***
    tncCursorY = renderHtmlNotesForJsPDF(
      doc,
      (transaction as any).notes,
      col1X + gutter,
      tncCursorY,
      TNC_MAX_WIDTH,
      pw,
      ph,
      drawCompleteHeader // Pass function to redraw header on T&C page breaks
    );
  } 

  y1ContentEnd = tncCursorY + 4;

  // ---------- RIGHT SIDE (Tax Summary / Signature) ----------
  const RIGHT_PAD = gutter;
  const LINE_H = 12;

  const rightBoxX = col2X;
  const rightBoxW = col2W;
  const rightBoxTopY = footerStartY;

  const innerRX = rightBoxX + RIGHT_PAD;
  const innerRW = rightBoxW - RIGHT_PAD * 2;

  const BOX_LEFT = rightBoxX;
  const BOX_RIGHT = rightBoxX + rightBoxW;

  const rDivider = (y: number) => {
    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(BORDER_WIDTH);
    doc.line(BOX_LEFT, y, BOX_RIGHT, y);
  };

  const rHeading = (title: string, y: number): number => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...COLOR.TEXT);
    const w = doc.getTextWidth(title);
    const x = innerRX + (innerRW - w) / 2;
    doc.text(title, x, y);
    doc.setDrawColor(...COLOR.BLUE);
    doc.setLineWidth(BORDER_WIDTH);
    doc.line(BOX_LEFT, y + 4, BOX_RIGHT, y + 4);
    return y + 12;
  };

  let y2 = rightBoxTopY + 11;
  let y2ContentEnd = y2;

  // Tax Summary
  const taxHeadingHeight = 15;
  doc.setFillColor(200, 225, 255);
  doc.rect(rightBoxX, rightBoxTopY, rightBoxW, taxHeadingHeight, "F");

  y2 = rHeading("Tax Summary", y2);
  y2 += 9;
  y2ContentEnd = y2;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const labelX = innerRX;
  const valueX = innerRX + innerRW;

  const taxRows: Array<[string, string]> = shouldShowIGSTColumns
    ? [
        ["Taxable Amount", `Rs ${money(totalTaxableValue)}`],
        ["Add: IGST", `Rs ${money(sumIGST)}`],
        ["Total Tax", `Rs ${money(sumIGST)}`],
      ]
    : shouldShowCGSTSGSTColumns
    ? [
        ["Taxable Amount", `Rs ${money(totalTaxableValue)}`],
        ["Add: CGST", `Rs ${money(sumCGST)}`],
        ["Add: SGST", `Rs ${money(sumSGST)}`],
        ["Total Tax", `Rs ${money(sumCGST + sumSGST)}`],
      ]
    : [
        ["Taxable Amount", `Rs ${money(totalTaxableValue)}`],
        ["Total Tax", `Rs ${money(0)}`],
      ];

  taxRows.forEach(([label, value]) => {
    doc.text(label, labelX, y2);
    doc.text(value, valueX, y2, { align: "right" });
    y2 += LINE_H + 2;
  });
  y2ContentEnd = y2;

  rDivider(y2);
  y2 += 16;

  doc.setFont("helvetica", "bold");
  doc.text("Total Amount After Tax :", labelX, y2);

  const formattedTotal = money(invoiceTotalAmount);

  const amountWidth = doc.getTextWidth(formattedTotal);

  const gap = 15;

  const rsX = valueX - amountWidth - gap;

  doc.text("Rs.", rsX, y2);

  doc.text(formattedTotal, valueX, y2, { align: "right" });

  y2 += LINE_H - 4;

  y2ContentEnd = y2;

  rDivider(y2);
  y2 += 14;
  y2ContentEnd = y2;

  // Reverse Charge
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...COLOR.TEXT);
  const rcLabel = "GST Payable on Reverse Charge : ";
  const rcValue = "N.A.";
  doc.text(rcLabel, rightBoxX + gutter, y2);
  const labelWidth = doc.getTextWidth(rcLabel);
  doc.setFont("helvetica", "normal");
  doc.text(rcValue, rightBoxX + gutter + labelWidth + 2, y2);
  y2 += LINE_H - 3;
  y2ContentEnd = y2;

  doc.setDrawColor(...COLOR.BLUE);
  doc.setLineWidth(BORDER_WIDTH);
  doc.line(rightBoxX, y2, rightBoxX + rightBoxW, y2);
  y2 += 12;
  y2ContentEnd = y2;

  // Certificate
  const certText =
    "Certified that the particulars given above are true and correct.";
  const certLines = doc.splitTextToSize(certText, innerRW);
  doc.text(certLines, innerRX, y2);
  y2 += certLines.length * LINE_H + 6;
  y2ContentEnd = y2;

  // Signature / Stamp
  const companyDisplayName = capitalizeWords(
    company?.businessName || company?.companyName || "Company Name"
  );

  doc.setFont("helvetica", "bold");
  doc.text(`For ${companyDisplayName}`, rightBoxX + rightBoxW / 2, y2, {
    align: "center",
  });
  y2 += 8;
  y2ContentEnd = y2;

  const stampW = 70;
  const stampH = 70;
  const stampX = rightBoxX + rightBoxW / 2 - stampW / 2;
  let stampPlaced = false;

  try {
    const stampUrl = (company as any)?.stampDataUrl || "/path/to/stamp.png";
    const stamp = await fetchAsDataURL(stampUrl);
    if (stamp) {
      doc.addImage(stamp, "PNG", stampX, y2 + 6, stampW, stampH);
      stampPlaced = true;
    }
  } catch {}

  const signY = y2 + (stampPlaced ? stampH + 34 : 50);
  doc.setDrawColor(...COLOR.BLUE);
  doc.setLineWidth(BORDER_WIDTH);
  doc.line(rightBoxX, signY - 10, rightBoxX + rightBoxW, signY - 10);

  const finalSignY = signY + 10;
  doc.setFont("helvetica", "normal");
  doc.text("Authorised Signatory", rightBoxX + rightBoxW / 2, finalSignY, {
    align: "center",
  });
  y2ContentEnd = finalSignY + 14;

  // --- Final Box Drawing and Page Numbering ---

  const contentMaxY = Math.max(y1ContentEnd, y2ContentEnd);
  const finalBlockHeight = contentMaxY - footerStartY;
  const blockHeightToDraw = Math.max(finalBlockHeight, 150);

  doc.setPage(doc.getNumberOfPages());
  doc.setDrawColor(...COLOR.BLUE);
  doc.setLineWidth(BORDER_WIDTH);
  doc.rect(col1X, footerStartY, contentWidth, blockHeightToDraw, "S");
  doc.setLineWidth(BORDER_WIDTH);
  doc.line(col2X, footerStartY, col2X, footerStartY + blockHeightToDraw);

  // Page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`Page ${i} of ${pageCount}`, pw - 35, ph - 20, { align: "right" });
  }

  return doc;
};