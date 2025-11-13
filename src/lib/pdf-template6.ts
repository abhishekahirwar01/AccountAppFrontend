import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { renderNotes, getUnifiedLines, invNo, getCompanyGSTIN, getBillingAddress, getShippingAddress } from "./pdf-utils";

export const generatePdfForTemplate6 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null
): Promise<jsPDF> => {
  // ------ local helpers ------
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
  const m = 20; // Margin

  // New Palette - Earthy, modern, and subtle
  const DARK_TEXT: [number, number, number] = [50, 50, 50]; // Near black for main text
  const ACCENT_GOLD: [number, number, number] = [184, 151, 93]; // A refined gold/tan
  const LIGHT_GRAY_BG: [number, number, number] = [248, 248, 248]; // For subtle backgrounds
  const DIVIDER_LINE: [number, number, number] = [220, 220, 220]; // Light gray for dividers
  const MUTED_INFO: [number, number, number] = [120, 120, 120]; // Muted color for secondary info
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

  // Preload logo (using a different, more abstract icon example)
  const logoUrl =
    "https://template.canva.com/EAE1YAgPM_U/1/0/400w-R-Meu_EcnME.jpg"; // Abstract placeholder
  const logoDataURL = await fetchAsDataURL(logoUrl);

  // Base font
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_TEXT);

  // ---------- Layout constants (used across pages) ----------
  const headerSectionH = 35; // Height for the top area with company name and "INVOICE"
  const detailBlockY = headerSectionH + 20; // Y position for invoice/client info
  const tableStartY = detailBlockY + 80; // Y position where the item table starts
  const ROW_H = 10; // Table row height
  const ITEMS_PER_PAGE = 10; // Items per page
  const TABLE_HEADER_HEIGHT = 8; // Height of the table header row

  const tableX = m;
  const tableW = pw - 2 * m;

  // Columns for the new table style
  const colSNo = m + 2;
  const colItem = colSNo + 12;
  const colQty = colItem + 65;
  const colRate = colQty + 20;
  const colGST = colRate + 25;
  const colTax = colGST + 20;
  const colTotal = pw - m - 2;

  const footerSectionH = 25;
  const footerSectionY = ph - footerSectionH - m;

  // ---------- painters ----------

  const drawHeaderSection = () => {
    // Top company name and "INVOICE"
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...ACCENT_GOLD);
    doc.text(invoiceData.company.name.toUpperCase(), m, m + 0, {
      align: "left",
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_INFO);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(...DARK_TEXT);
    doc.text("INVOICE", pw - m, m + 0, { align: "right" });

    // Hairline divider under header
    doc.setDrawColor(...DIVIDER_LINE);
    doc.setLineWidth(0.5);
    doc.line(m, headerSectionH + 5, pw - m, headerSectionH + 5);
  };

  const drawDetailBlocks = () => {
    // Company contact info (Left)
    doc.setTextColor(...MUTED_INFO);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(invoiceData.company.address, m, detailBlockY);
    doc.text(`Email: ${invoiceData.company.email}`, m, detailBlockY + 4);
    doc.text(`Phone: ${invoiceData.company.phone}`, m, detailBlockY + 8);
    if (companyGSTIN) {
      doc.text(`GSTIN: ${companyGSTIN}`, m, detailBlockY + 12);
    }

    // Invoice details (Right)
    const rightColX = pw - m;
    doc.setTextColor(...DARK_TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Invoice No:`, rightColX - 25, detailBlockY, { align: "right" });
    doc.text(`Date:`, rightColX - 25, detailBlockY + 5, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.text(
      invoiceData.invoiceNumber,
      rightColX,
      detailBlockY,
      {
        align: "right",
      }
    );
    doc.text(invoiceData.date, rightColX, detailBlockY + 5, {
      align: "right",
    });

    // Bill To (Below invoice details, aligned right)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("BILL TO:", rightColX, detailBlockY + 15, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_TEXT);
    doc.text(invoiceData.invoiceTo.name, rightColX, detailBlockY + 20, {
      align: "right",
    });
    doc.setTextColor(...MUTED_INFO);
    doc.text(invoiceData.invoiceTo.billingAddress, rightColX, detailBlockY + 24, {
      align: "right",
    });

    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", rightColX, detailBlockY + 30, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.invoiceTo.shippingAddress, rightColX, detailBlockY + 35, {
      align: "right",
    });

    if (invoiceData.invoiceTo.email)
      doc.text(invoiceData.invoiceTo.email, rightColX, detailBlockY + 40, {
        align: "right",
      });
    if (invoiceData.invoiceTo.gstin)
      doc.text(
        `GSTIN: ${invoiceData.invoiceTo.gstin}`,
        rightColX,
        detailBlockY + 44,
        {
          align: "right",
        }
      );
  };

  const drawTableHead = (y: number): number => {
    // Table Header with a subtle bottom border
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...DARK_TEXT);
    doc.setFontSize(8);

    doc.text("S.No.", colSNo, y + TABLE_HEADER_HEIGHT / 2 + 1);
    doc.text("ITEM DESCRIPTION", colItem, y + TABLE_HEADER_HEIGHT / 2 + 1);
    doc.text("QTY", colQty, y + TABLE_HEADER_HEIGHT / 2 + 1, {
      align: "right",
    });
    doc.text("RATE", colRate, y + TABLE_HEADER_HEIGHT / 2 + 1, {
      align: "right",
    });
    doc.text("GST%", colGST, y + TABLE_HEADER_HEIGHT / 2 + 1, {
      align: "right",
    });
    doc.text("TAX", colTax, y + TABLE_HEADER_HEIGHT / 2 + 1, {
      align: "right",
    });
    doc.text("TOTAL", colTotal, y + TABLE_HEADER_HEIGHT / 2 + 1, {
      align: "right",
    });

    doc.setDrawColor(...DIVIDER_LINE);
    doc.setLineWidth(0.2);
    doc.line(
      tableX,
      y + TABLE_HEADER_HEIGHT,
      tableX + tableW,
      y + TABLE_HEADER_HEIGHT
    );

    return y + TABLE_HEADER_HEIGHT + 2; // Small gap after header
  };

  const drawRow = (it: any, y: number, isLast: boolean) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_TEXT);
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

    if (!isLast) {
      doc.setDrawColor(...LIGHT_GRAY_BG); // Very light divider for rows
      doc.setLineWidth(0.1);
      doc.line(tableX, y + ROW_H, tableX + tableW, y + ROW_H);
    }
  };

  const drawTotals = (y: number) => {
    doc.setTextColor(...DARK_TEXT);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    // Subtotal line
    doc.text("SUBTOTAL", pw - m - 40, y, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text(money(subtotal), pw - m, y, { align: "right" });

    if (gstEnabled) {
      y += 8;
      // GST Total line
      doc.setFont("helvetica", "normal");
      doc.text("GST TOTAL", pw - m - 40, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(money(tax), pw - m, y, { align: "right" });
    }

    y += 12;
    // Grand Total Line - Prominent with a subtle background
    doc.setFillColor(...LIGHT_GRAY_BG);
    doc.rect(pw - m - 60, y - 7, 60, 10, "F"); // Light background for total
    doc.setDrawColor(...ACCENT_GOLD);
    doc.setLineWidth(0.5);
    doc.rect(pw - m - 60, y - 7, 60, 10, "S"); // Gold border around total

    doc.setFontSize(12);
    doc.setTextColor(...ACCENT_GOLD); // Gold for the final total
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", pw - m - 65, y, { align: "right" });
    doc.text(money(invoiceTotal), pw - m - 2, y, { align: "right" });

    return y + 15; // Return the Y position after drawing totals
  };

  const drawFooterSection = () => {
    // Simple line at the bottom
    doc.setDrawColor(...DIVIDER_LINE);
    doc.setLineWidth(0.5);
    doc.line(m, footerSectionY, pw - m, footerSectionY);

    // Render notes if present
    const notesEndY = renderNotes(
      doc,
      transaction.notes || "",
      m,
      footerSectionY + 8,
      pw - 2 * m,
      pw,
      ph
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_INFO);

    doc.text(invoiceData.company.address, m, notesEndY + 4);
    doc.text(
      `${invoiceData.company.email} | ${invoiceData.company.phone}`,
      m,
      notesEndY + 8
    );
    const pageCount = doc.getNumberOfPages();
    // Page number (if multiple pages)
    doc.text(`Page ${pageCount} of ${pageCount}`, pw - m, notesEndY + 6, {
      align: "right",
    });
  };

  // ---------- paginate rows ----------
  const chunks: any[][] = [];
  for (let i = 0; i < itemsForTable.length; i += ITEMS_PER_PAGE) {
    chunks.push(itemsForTable.slice(i, i + ITEMS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push([]); // Ensure at least one page

  let lastRowY = tableStartY;

  // Render all pages with items
  chunks.forEach((rows, pageIndex) => {
    if (pageIndex > 0) doc.addPage();

    drawHeaderSection();
    drawDetailBlocks();

    let y = drawTableHead(tableStartY);

    rows.forEach((it, idx) => {
      drawRow(it, y, idx === rows.length - 1);
      y += ROW_H;
    });

    lastRowY = y;

    // Draw footer content on every page
    drawFooterSection();
  });

  // ---------- Totals (only once, at the end) ----------
  const totalsBlockHeight = gstEnabled ? 40 : 30;
  const bottomSafeY = ph - footerSectionH - m - totalsBlockHeight - 10;

  // Check if there's enough space on the current page for totals
  if (lastRowY + totalsBlockHeight <= bottomSafeY) {
    drawTotals(lastRowY + 10);
  } else {
    // Not enough space, need to add a new page
    doc.addPage();
    drawHeaderSection();
    drawDetailBlocks();
    drawTotals(tableStartY + 10);
    drawFooterSection();
  }

  return doc;
};