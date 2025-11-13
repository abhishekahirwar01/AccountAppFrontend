import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { renderNotes, getUnifiedLines, invNo, getCompanyGSTIN, getBillingAddress, getShippingAddress } from "./pdf-utils";

export const generatePdfForTemplate4 = async (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null
): Promise<jsPDF> => {
  // --- helpers (same as your other templates) ---
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

  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 20; // margin

  // Palette (your minimal theme)
  const PRIMARY: [number, number, number] = [59, 130, 246];
  const SECONDARY: [number, number, number] = [107, 114, 128];
  const TEXT: [number, number, number] = [31, 41, 55];
  const LIGHT_BG: [number, number, number] = [249, 250, 251];

  const { lines, subtotal, tax, invoiceTotal, gstEnabled } = _deriveTotals(
    transaction,
    company,
    serviceNameById
  );
  const companyGSTIN = _getCompanyGSTIN(company);

  // ✅ Same currency style as other templates
  const money = (n: number) =>
    `Rs ${new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(n || 0))}`;

  // Build rows
  const itemsForTable = (
    lines.length
      ? lines
      : [
          {
            name: transaction.description || "Item",
            description: "",
            quantity: 1,
            pricePerUnit: (transaction as any).amount ?? 0,
            amount: (transaction as any).amount ?? 0,
            gstPercentage: (transaction as any)?.gstPercentage ?? 0,
            lineTax:
              (Number((transaction as any).amount ?? 0) *
                Number((transaction as any)?.gstPercentage ?? 0)) /
                100 || 0,
            lineTotal:
              Number((transaction as any).amount ?? 0) +
              ((Number((transaction as any).amount ?? 0) *
                Number((transaction as any)?.gstPercentage ?? 0)) /
                100 || 0),
          },
        ]
  ).map((l: any, i: number) => ({
    sno: (i + 1).toString(),
    description: `${l.name}${l.description ? " — " + l.description : ""}`,
    quantity: l.quantity || 1,
    pricePerUnit: Number(l.pricePerUnit ?? l.amount ?? 0),
    gstPercentage: Number(l.gstPercentage ?? 0),
    lineTax: Number(l.lineTax ?? 0),
    lineTotal: Number(l.lineTotal ?? l.amount ?? 0),
  }));

  const billingAddress = getBillingAddress(party);
  const shippingAddressStr = getShippingAddress(shippingAddress, billingAddress);

  // ---------- Layout constants ----------
  const headerY = 20;
  const billToY = headerY + 40;

  const tableTopY = billToY + 60;
  const tableW = pw - m * 2;

  // Columns
  const colSNo = m + 5;
  const colItem = colSNo + 12;
  const colQty = colSNo + 50;
  const colPrice = pw - m - 80;
  const colGST = pw - m - 60;
  const colTax = pw - m - 30;
  const colTotal = pw - m - 5;

  // Row geometry (fixed height to guarantee 8 rows per page)
  const ROW_H = 14;
  const firstRowY = tableTopY + 15;

  // Footer geometry
  const footerH = 28; // thank you + contact + page #
  const bottomSafeY = ph - (m + footerH);

  // Pagination: exactly 8 rows per page
  const ITEMS_PER_PAGE = 8;
  const chunks: any[][] = [];
  for (let i = 0; i < itemsForTable.length; i += ITEMS_PER_PAGE) {
    chunks.push(itemsForTable.slice(i, i + ITEMS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push(itemsForTable);

  // Will the last table leave space for totals?
  const approxTotalsHeight = gstEnabled ? 34 : 24;
  const lastChunkCount = chunks[chunks.length - 1].length;
  const lastRowsBottom = firstRowY + ROW_H * lastChunkCount;
  const needsExtraTotalsPage =
    lastRowsBottom + approxTotalsHeight > bottomSafeY;
  const totalPages = chunks.length + (needsExtraTotalsPage ? 1 : 0);

  // ---------- painters ----------
  const crisp = (yy: number) => Math.floor(yy) + 0.5;

  const drawHeader = () => {
    // Company (left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...PRIMARY);
    doc.text(company?.businessName || "Your Company", m, headerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...SECONDARY);
    doc.text(company?.address || "Company Address", m, headerY + 7);
    if (companyGSTIN) doc.text(`GSTIN: ${companyGSTIN}`, m, headerY + 14);

    // Invoice (right)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.setFontSize(20);
    doc.text("INVOICE", pw - m, headerY, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SECONDARY);
    doc.setFontSize(10);
    doc.text(`No. ${invNo(transaction)}`, pw - m, headerY + 8, {
      align: "right",
    });

    const dateStr = transaction.date
      ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
      : "";
    doc.setFontSize(9);
    doc.text(`Date: ${dateStr}`, pw - m, headerY + 15, { align: "right" });

    // Divider
    doc.setDrawColor(229, 231, 235);
    doc.setLineWidth(0.6);
    doc.line(m, headerY + 25, pw - m, headerY + 25);

    // Bill To (left)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT);
    doc.setFontSize(11);
    doc.text("BILL TO:", m, billToY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(party?.name || "Client Name", m, billToY + 8);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(...SECONDARY);
    doc.setFontSize(10);
    const addrLines = doc.splitTextToSize(billingAddress, 120);
    doc.text(addrLines, m, billToY + 16);

    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", m, billToY + 25);
    doc.setFont("helvetica", "normal");
    const shipLines = doc.splitTextToSize(shippingAddressStr, 120);
    doc.text(shipLines, m, billToY + 33);
  };

  const drawTableHead = () => {
    // Header band
    doc.setFillColor(...LIGHT_BG);
    doc.rect(m, tableTopY, tableW, 10, "F");

    // Top/bottom crisp borders
    doc.setDrawColor(206, 212, 222);
    doc.setLineWidth(0.6);
    doc.line(m, crisp(tableTopY), m + tableW, crisp(tableTopY));
    doc.line(m, crisp(tableTopY + 10), m + tableW, crisp(tableTopY + 10));

    // Labels
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TEXT);
    doc.setFontSize(10);
    doc.text("#", colSNo, tableTopY + 7);
    doc.text("DESCRIPTION", colItem, tableTopY + 7);
    doc.text("QTY", colQty, tableTopY + 7, { align: "right" });
    doc.text("PRICE", colPrice, tableTopY + 7, { align: "right" });
    doc.text("GST%", colGST, tableTopY + 7, { align: "right" });
    doc.text("TAX", colTax, tableTopY + 7, { align: "right" });
    doc.text("TOTAL", colTotal, tableTopY + 7, { align: "right" });
  };

  const drawRows = (rows: any[]) => {
    let y = firstRowY;
    const maxDescW = colQty - colItem - 4;

    rows.forEach((it, i) => {
      // Alternating row fill
      if (i % 2 === 0) {
        doc.setFillColor(...LIGHT_BG);
        doc.rect(m, y - (ROW_H - 10), tableW, ROW_H, "F");
      }

      // Clamp description to single line for fixed row height
      let desc = it.description || "";
      while (doc.getTextWidth(desc) > maxDescW && desc.length > 0) {
        desc = desc.slice(0, -1);
      }
      if (desc !== it.description) desc = desc.trimEnd() + "...";

      doc.setFont("helvetica", "normal");
      doc.setTextColor(...TEXT);
      doc.setFontSize(9);

      doc.text(it.sno, colSNo, y);
      doc.text(desc, colItem, y);
      doc.text(String(it.quantity), colQty, y, { align: "right" });
      doc.text(money(it.pricePerUnit), colPrice, y, { align: "right" });
      doc.text(`${it.gstPercentage}%`, colGST, y, { align: "right" });
      doc.text(money(it.lineTax), colTax, y, { align: "right" });
      doc.text(money(it.lineTotal), colTotal, y, { align: "right" });

      // Row divider
      doc.setDrawColor(220, 224, 230);
      doc.setLineWidth(0.5);
      doc.line(m, crisp(y + 3), pw - m, crisp(y + 3));

      y += ROW_H;
    });

    return y; // bottom y after last row
  };

  const drawFooter = (pageNum: number, total: number) => {
    const footerY = ph - m - 20;
    // Render notes instead of hardcoded thank you
    const notesEndY = renderNotes(
      doc,
      transaction.notes || "",
      m,
      footerY,
      pw - 2 * m,
      pw,
      ph
    );

    const contact = [
      company?.address || "",
      company?.emailId || "",
      company?.mobileNumber || "",
    ]
      .filter(Boolean)
      .join(" • ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY);
    doc.text(contact || "", m, notesEndY + 6);
    doc.text(`Page ${pageNum} of ${total}`, pw - m, notesEndY + 6, {
      align: "right",
    });
  };

  // ---------- render pages ----------
  chunks.forEach((rows, i) => {
    if (i > 0) doc.addPage();
    drawHeader();
    drawTableHead();
    drawRows(rows);
    drawFooter(i + 1, totalPages);
  });

  // ---------- totals (last page or extra page) ----------
  if (needsExtraTotalsPage) {
    doc.addPage();
    drawHeader();
    drawFooter(totalPages, totalPages);
    var totalsY = firstRowY; // fresh area on new page
  } else {
    var totalsY = lastRowsBottom + 10; // under the last table
  }

  // Totals block
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...TEXT);
  doc.setFontSize(10);

  // Line above totals
  doc.setDrawColor(209, 213, 219);
  doc.setLineWidth(0.5);
  doc.line(pw - m - 120, crisp(totalsY - 5), pw - m, crisp(totalsY - 5));

  doc.text("Subtotal:", pw - m - 30, totalsY, { align: "right" });
  doc.text(money(subtotal), pw - m - 5, totalsY, { align: "right" });

  if (gstEnabled) {
    doc.text("GST:", pw - m - 30, totalsY + 8, { align: "right" });
    doc.text(money(tax), pw - m - 5, totalsY + 8, { align: "right" });
  }

  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY);
  doc.text("Total:", pw - m - 38, totalsY + 20, { align: "right" });
  doc.text(money(invoiceTotal), pw - m - 5, totalsY + 20, { align: "right" });

  return doc;
};