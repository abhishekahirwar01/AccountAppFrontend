import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { renderNotes, getUnifiedLines, invNo, getCompanyGSTIN, getBillingAddress, getShippingAddress } from "./pdf-utils";

export const generatePdfForTemplate5 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null
): Promise<jsPDF> => {
  // ------ local helpers (re-used or slightly modified) ------
  const _getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
    const x = c as any;
    return (
      x?.gstin ??
      x?.gstIn ??
      x?.gstNumber ??
      x?.gst_no ??
      x?.gst ??
      x?.gstinNumber ??
      x?.tax?.gstin ??
      null
    );
  };

  const _deriveTotals = (
    tx: Transaction,
    co?: Company | null,
    svcNameById?: Map<string, string>
  ) => {
    const lines = getUnifiedLines(tx, svcNameById);
    const subtotal = lines.reduce(
      (s: number, it: any) => s + (Number(it.amount) || 0),
      0
    );
    const totalTax = lines.reduce(
      (s: number, it: any) => s + (Number(it.lineTax) || 0),
      0
    );
    const invoiceTotal = lines.reduce(
      (s: number, it: any) => s + (Number(it.lineTotal) || 0),
      0
    );
    const gstEnabled = totalTax > 0 && !!_getCompanyGSTIN(co)?.trim();
    return { lines, subtotal, tax: totalTax, invoiceTotal, gstEnabled };
  };

  const fetchAsDataURL = async (url: string) => {
    try {
      const res = await fetch(url, { mode: "cors" });
      const blob = await res.blob();
      return await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(blob);
      });
    } catch {
      return "";
    }
  };

  // -------------------------------------------------------------------------

  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 18; // Smaller Margin for more content area

  // New Palette - Modern, Professional, and Clean
  const PRIMARY_DARK: [number, number, number] = [38, 50, 56]; // Dark Slate Gray for main text and headers
  const ACCENT_TEAL: [number, number, number] = [0, 150, 136]; // Vibrant Teal for accents
  const LIGHT_TEXT: [number, number, number] = [100, 115, 120]; // Muted gray for secondary info
  const BORDER_GRAY: [number, number, number] = [230, 230, 230]; // Light gray for subtle borders
  const TABLE_HEADER_BG: [number, number, number] = [240, 245, 248]; // Very light blue-gray for table header background
  const WHITE: [number, number, number] = [255, 255, 255];

  const { lines, subtotal, tax, invoiceTotal, gstEnabled } = _deriveTotals(
    transaction,
    company,
    serviceNameById
  );
  const companyGSTIN = _getCompanyGSTIN(company);

  const money = (n: number) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;

  const billingAddress = getBillingAddress(party);
  const shippingAddressStr = getShippingAddress(shippingAddress, billingAddress);

  // Data scaffold
  const invoiceData = {
    invoiceNumber: invNo(transaction),
    date: transaction.date
      ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
      : "01 / 10 / 2024",
    company: {
      name: company?.businessName || "Your Company Name",
      address: company?.address || "123 Business Lane, City, State - 123456",
      email: company?.emailId || "contact@yourcompany.com",
      phone: company?.mobileNumber || "+91 98765 43210",
    },
    invoiceTo: {
      name: party?.name || "Client Name",
      billingAddress,
      shippingAddress: shippingAddressStr,
      email: party?.email || "",
      gstin: _getCompanyGSTIN(party) || "",
    },
  };

  // Convert to table rows
  const itemsForTable = lines.map((l: any, index: number) => ({
    sno: (index + 1).toString(),
    description: `${l.name}${l.description ? " — " + l.description : ""}`,
    quantity: l.quantity || 1,
    pricePerUnit: Number(l.pricePerUnit || l.amount || 0),
    amount: Number(l.amount || 0),
    gstPercentage: l.gstPercentage || 0,
    lineTax: Number(l.lineTax || 0),
    lineTotal: Number(l.lineTotal || l.amount || 0),
  }));

  if (itemsForTable.length === 0) {
    const amount = Number((transaction as any).amount ?? 0);
    const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
    const lineTax = (amount * gstPct) / 100;
    const lineTotal = amount + lineTax;
    itemsForTable.push({
      sno: "1",
      description: transaction.description || "Service Rendered",
      quantity: 1,
      pricePerUnit: amount,
      amount,
      gstPercentage: gstPct,
      lineTax,
      lineTotal,
    });
  }

  // Preload logo (using a slightly more professional placeholder)
  const logoUrl =
    "https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_font_awesome.svg"; // A generic icon
  const logoDataURL = await fetchAsDataURL(logoUrl);

  // Base font
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...PRIMARY_DARK);

  // ---------- Layout constants (used across pages) ----------
  const headerBlockHeight = 40; // Height for the top section with logo/company name/invoice title
  const infoBlockY = headerBlockHeight + 15; // Y for invoice/client details
  const tableStartY = infoBlockY + 90; // Y where the item table starts
  const ROW_H = 9; // Table row height
  const ITEMS_PER_PAGE = 10; // Adjusted items per page for new ROW_H
  const TABLE_HEADER_HEIGHT = 10; // Height of the table header row

  const contentX = m;
  const contentW = pw - 2 * m;

  // Columns for the new table style (more relative positioning)
  // Columns for the new table style (more relative positioning)
  const colSNo = contentX + 2;
  const colItem = colSNo + 20; // Start item description after S.No.
  const colQty = colItem + 38; // Approx 65% across
  const colRate = colQty + 20; // Approx 75% across
  const colGST = colRate + 30; // Approx 85% across
  const colTax = colRate + 60; // Approx 92% across
  const colTotal = pw - m - 2;

  const footerSectionH = 20;
  const footerSectionY = ph - footerSectionH - m;

  // ---------- painters ----------

  const drawHeaderSection = () => {
    // Left: Company Logo and Name
    let currentX = m;
    let currentY = m;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...PRIMARY_DARK);
    doc.text(invoiceData.company.name.toUpperCase(), currentX, currentY + 7);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...LIGHT_TEXT);
    const companyInfoY = currentY + 12;
    doc.text(invoiceData.company.address, currentX, companyInfoY);
    doc.text(invoiceData.company.email, currentX, companyInfoY + 4);

    // Right: "INVOICE" Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);
    doc.setTextColor(...ACCENT_TEAL);
    doc.text("INVOICE", pw - m, m + 15, { align: "right" });

    // Subtle line below header
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.7);
    doc.line(m, headerBlockHeight + 5, pw - m, headerBlockHeight + 5);
  };

  const drawDetailBlocks = () => {
    let currentY = infoBlockY;

    // Left Block: Invoice Details
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_DARK);
    doc.text("INVOICE DETAILS", m, currentY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT_TEXT);
    doc.text(`Invoice No: ${invoiceData.invoiceNumber}`, m, currentY + 7);
    doc.text(`Date: ${invoiceData.date}`, m, currentY + 12);

    // Right Block: Bill To
    const rightColX = pw - m;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_DARK);
    doc.text("BILL TO:", rightColX, currentY, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...LIGHT_TEXT);
    doc.text(invoiceData.invoiceTo.name, rightColX, currentY + 7, {
      align: "right",
    });
    doc.text(invoiceData.invoiceTo.billingAddress, rightColX, currentY + 12, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", rightColX, currentY + 20, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.invoiceTo.shippingAddress, rightColX, currentY + 27, {
      align: "right",
    });

    if (invoiceData.invoiceTo.email)
      doc.text(invoiceData.invoiceTo.email, rightColX, currentY + 35, {
        align: "right",
      });
    if (invoiceData.invoiceTo.gstin)
      doc.text(
        `GSTIN: ${invoiceData.invoiceTo.gstin}`,
        rightColX,
        currentY + 40,
        {
          align: "right",
        }
      );

    // Horizontal divider for clarity
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.3);
    doc.line(m, currentY + 40, pw - m, currentY + 40);
  };

  const drawTableHead = (): number => {
    let y = tableStartY;

    // Table Header with a subtle background and border
    doc.setFillColor(...TABLE_HEADER_BG);
    doc.rect(contentX, y, contentW, TABLE_HEADER_HEIGHT, "F");
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.5);
    doc.rect(contentX, y, contentW, TABLE_HEADER_HEIGHT, "S");

    // Header labels
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY_DARK);
    doc.setFontSize(8);

    doc.text("S.No.", colSNo, y + TABLE_HEADER_HEIGHT / 2 + 1.5);
    doc.text("ITEM DESCRIPTION", colItem, y + TABLE_HEADER_HEIGHT / 2 + 1.5);
    doc.text("QTY", colQty, y + TABLE_HEADER_HEIGHT / 2 + 1.5, {
      align: "right",
    });
    doc.text("RATE", colRate, y + TABLE_HEADER_HEIGHT / 2 + 1.5, {
      align: "right",
    });
    doc.text("GST%", colGST, y + TABLE_HEADER_HEIGHT / 2 + 1.5, {
      align: "right",
    });
    doc.text("TAX", colTax, y + TABLE_HEADER_HEIGHT / 2 + 1.5, {
      align: "right",
    });
    doc.text("TOTAL", colTotal, y + TABLE_HEADER_HEIGHT / 2 + 1.5, {
      align: "right",
    });

    return y + TABLE_HEADER_HEIGHT; // Start drawing rows immediately after header
  };

  const drawRow = (it: any, y: number, isLast: boolean) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PRIMARY_DARK);
    doc.setFontSize(8);

    doc.text(it.sno, colSNo, y + ROW_H / 2);

    const maxDescWidth = colQty - colItem - 5;
    let description = it.description;
    const descLines = doc.splitTextToSize(description, maxDescWidth);
    doc.text(descLines, colItem, y + ROW_H / 2 - (descLines.length - 1) * 2);

    doc.text(String(it.quantity), colQty, y + ROW_H / 2, { align: "right" });
    doc.text(money(it.pricePerUnit), colRate, y + ROW_H / 2, {
      align: "right",
    });
    doc.text(`${it.gstPercentage}%`, colGST, y + ROW_H / 2, {
      align: "right",
    });
    doc.text(money(it.lineTax), colTax, y + ROW_H / 2, { align: "right" });
    doc.text(money(it.lineTotal), colTotal, y + ROW_H / 2, { align: "right" });

    // Subtle line between rows
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.1);
    doc.line(contentX, y + ROW_H, contentX + contentW, y + ROW_H);
  };

  const drawTotals = (startY: number) => {
    let yTotals = startY + 10;
    const totalsBoxWidth = 70; // Width of the totals box
    const totalsBoxX = pw - m - totalsBoxWidth; // Aligned to the right margin

    // Subtotal line
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...PRIMARY_DARK);
    doc.text("Subtotal:", totalsBoxX, yTotals, { align: "left" });
    doc.setFont("helvetica", "bold");
    doc.text(money(subtotal), pw - m, yTotals, { align: "right" });

    if (gstEnabled) {
      yTotals += 7;
      // GST Total line
      doc.setFont("helvetica", "normal");
      doc.text("GST Total:", totalsBoxX, yTotals, { align: "left" });
      doc.setFont("helvetica", "bold");
      doc.text(money(tax), pw - m, yTotals, { align: "right" });
    }

    yTotals += 10;
    // Grand Total Line - Prominent with accent color background
    doc.setFillColor(...ACCENT_TEAL);
    doc.rect(
      totalsBoxX - 2,
      yTotals - 6,
      totalsBoxWidth + 4 + (pw - m - totalsBoxX),
      10,
      "F"
    ); // Background for total
    doc.setDrawColor(...ACCENT_TEAL); // Border same as fill
    doc.setLineWidth(0.5);
    doc.rect(
      totalsBoxX - 2,
      yTotals - 6,
      totalsBoxWidth + 4 + (pw - m - totalsBoxX),
      10,
      "S"
    );

    doc.setFontSize(12);
    doc.setTextColor(...WHITE); // White text on teal background
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", totalsBoxX + 2, yTotals + 1, { align: "left" });
    doc.text(money(invoiceTotal), pw - m - 2, yTotals + 1, { align: "right" });
  };

  const drawFooterSection = () => {
    // Top border for footer
    doc.setDrawColor(...BORDER_GRAY);
    doc.setLineWidth(0.5);
    doc.line(m, footerSectionY, pw - m, footerSectionY);

    // Render notes instead of hardcoded thank you
    const notesEndY = renderNotes(
      doc,
      transaction.notes || "",
      m,
      footerSectionY + 7,
      pw - 2 * m,
      pw,
      ph
    );

    // Company contact details in footer
    const contact = [
      invoiceData.company.address || "",
      invoiceData.company.email || "",
      invoiceData.company.phone || "",
    ]
      .filter(Boolean)
      .join(" • ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...LIGHT_TEXT);
    doc.text(contact || "", m, notesEndY + 6);
    const pageCount = doc.getNumberOfPages();
    doc.text(`Page ${pageCount} of ${pageCount}`, pw - m, notesEndY + 6, {
      align: "right",
    });

    // // Page number
    // for (let i = 1; i <= pageCount; i++) {
    //   doc.setPage(i);
    //   doc.setFont("helvetica", "italic");
    //   doc.setFontSize(7);
    //   doc.setTextColor(...LIGHT_TEXT);
    //   doc.text(`Page ${i} of ${pageCount}`, pw / 1, ph - m + 5, {
    //     align: "center",
    //   });
    // }
    doc.setPage(pageCount); // Reset to the last page
  };

  // ---------- paginate rows ----------
  const chunks: any[][] = [];
  for (let i = 0; i < itemsForTable.length; i += ITEMS_PER_PAGE) {
    chunks.push(itemsForTable.slice(i, i + ITEMS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push(itemsForTable);

  let lastRowY = tableStartY;

  chunks.forEach((rows, pageIndex) => {
    if (pageIndex > 0) doc.addPage();

    drawHeaderSection();
    drawDetailBlocks();
    let y = drawTableHead();

    rows.forEach((it, idx) => {
      drawRow(it, y, idx === rows.length - 1);
      y += ROW_H;
    });

    lastRowY = y;

    // Draw footer content on every page
    drawFooterSection();
  });

  // ---------- Totals (only once, at the end) ----------
  const totalsBlockHeight = gstEnabled ? 35 : 28; // Adjusted height for new total style
  const bottomSafeY = ph - footerSectionH - m - totalsBlockHeight - 5; // Extra padding

  // Check if there's enough space for totals on the current page
  if (lastRowY + totalsBlockHeight + 10 <= bottomSafeY) {
    // Added 10 for spacing before totals
    drawTotals(lastRowY);
  } else {
    // Not enough space, add a new page
    doc.addPage();
    drawHeaderSection();
    drawDetailBlocks();
    // Reset lastRowY if content starts from top of new page, or just place totals
    // For totals, we can place them relative to the bottom of the page
    const totalsStartOnNewPageY = Math.max(
      tableStartY,
      ph - footerSectionH - m - totalsBlockHeight - 5
    );
    drawTotals(totalsStartOnNewPageY - 10); // Subtract 10 to move it up slightly
  }

  return doc;
};