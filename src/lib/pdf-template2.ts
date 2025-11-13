import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { deriveTotals, formatCurrency, renderNotes, invNo, getCompanyGSTIN, getUnifiedLines, getBillingAddress, getShippingAddress } from "./pdf-utils";

const getItemsBodyTemplate2 = (
  transaction: Transaction,
  serviceNameById?: Map<string, string>
) => {
  const lines = getUnifiedLines(transaction, serviceNameById);

  if (lines.length === 0) {
    const amt = Number((transaction as any).amount ?? 0);
    const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
    const tax = (amt * gstPct) / 100;
    const total = amt + tax;

    return [
      [
        "1",
        transaction.description || "Item",
        "",
        1,
        `${gstPct}%`,
        formatCurrency(amt),
        formatCurrency(tax),
        formatCurrency(total),
      ],
    ];
  }

  return lines.map((item: any, index: number) => [
    (index + 1).toString(),
    `${item.name}${item.description ? " - " + item.description : ""}`,
    item.code || "",
    item.quantity || 1,
    `${item.gstPercentage || 0}%`,
    formatCurrency(Number(item.pricePerUnit || item.amount)),
    formatCurrency(item.lineTax || 0),
    formatCurrency(item.lineTotal || item.amount || 0),
  ]);
};

export const generatePdfForTemplate2 = (
  transaction: Transaction,
  company: Company | null | undefined,
  party: Party | null | undefined,
  serviceNameById?: Map<string, string>,
  shippingAddress?: ShippingAddress | null
): jsPDF => {
  const doc = new jsPDF();

  const { subtotal, tax, invoiceTotal, gstEnabled } = deriveTotals(
    transaction,
    company,
    serviceNameById
  );
  const companyGSTIN = getCompanyGSTIN(company);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const ITEMS_PER_PAGE = 12;
  const headerStartY = 120; // where the table begins
  const footerOffset = 35; // reserved space for footer at bottom
  const tableBottomMargin = 55; // keep table above footer
  const rightX = pageW - 10;
  const labelX = rightX - 60;

  const billingAddress = getBillingAddress(party);
  const shippingAddressStr = getShippingAddress(shippingAddress, billingAddress);

  // --- helpers -------------------------------------------------------------
  const drawHeader = () => {
    // Company block (left)
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(company?.businessName || "Your Company", 20, 30);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (company?.emailId) doc.text(company.emailId, 20, 37);
    if (company?.mobileNumber) doc.text(company.mobileNumber, 20, 44);
    if (companyGSTIN) doc.text(`GSTIN: ${companyGSTIN}`, 20, 51);

    // Invoice block (right)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Invoice ${invNo(transaction)}`, rightX, 30, { align: "right" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Issued: ${new Intl.DateTimeFormat("en-US").format(
        new Date(transaction.date)
      )}`,
      rightX,
      37,
      { align: "right" }
    );
    doc.text(
      `Payment Due: ${new Intl.DateTimeFormat("en-US").format(
        new Date(
          new Date(transaction.date).setDate(
            new Date(transaction.date).getDate() + 30
          )
        )
      )}`,
      rightX,
      44,
      { align: "right" }
    );

    // Divider
    doc.line(15, 60, pageW - 15, 60);

    // Client block (repeat on each page for consistency)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(party?.name || "Client Name", 20, 75);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (party?.email) doc.text(party.email, 20, 82);

    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 89);
    doc.setFont("helvetica", "normal");
    doc.text(billingAddress, 20, 94);

    doc.setFont("helvetica", "bold");
    doc.text("Ship To:", 20, 99);
    doc.setFont("helvetica", "normal");
    doc.text(shippingAddressStr, 20, 104);
  };

  const drawFooter = (pageNum: number, totalPages: number) => {
    const y = pageH - footerOffset;
    // Render notes instead of hardcoded thank you
    renderNotes(doc, transaction.notes || "", 20, y, pageW - 40, pageW, pageH);
    // Optional page numbering
    doc.text(`Page ${pageNum} of ${totalPages}`, rightX, y, { align: "right" });
  };

  // Build all rows then chunk into pages of 8
  const allRows = getItemsBodyTemplate2(transaction, serviceNameById);
  const chunks: any[][] = [];
  for (let i = 0; i < allRows.length; i += ITEMS_PER_PAGE) {
    chunks.push(allRows.slice(i, i + ITEMS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push(allRows); // safety

  const totalPagesPlanned = Math.max(1, chunks.length); // base count (may add one later if totals need a fresh page)

  // Render each chunk on its own page
  chunks.forEach((rows, idx) => {
    if (idx > 0) doc.addPage();
    drawHeader();

    autoTable(doc, {
      startY: headerStartY,
      head: [
        ["S.No.", "Item Description", "HSN/SAC", "Qty", "GST%", "Rate", "Tax", "Total"],
      ],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [238, 238, 238], textColor: [0, 0, 0] },
      bodyStyles: { fillColor: [255, 255, 255] },
      margin: { bottom: tableBottomMargin },
      showHead: "everyPage",
      styles: {
        cellPadding: { top: 3, right: 3, bottom: 3, left: 3 }, // ← breathing room
        overflow: "linebreak", // wrap text instead of clipping
        valign: "middle", // vertical centering
        fontSize: 10,
        lineWidth: 0.25, // slightly darker cell borders
        lineColor: [220, 223, 230],
      },
    });

    drawFooter(idx + 1, totalPagesPlanned);
  });

  // Totals on the last page (or add a new one if no room)
  let finalY = (doc as any).lastAutoTable?.finalY || headerStartY;
  const approxTotalsHeight = 30;

  if (finalY + approxTotalsHeight > pageH - footerOffset - 10) {
    // Need a fresh page only for totals
    doc.addPage();
    drawHeader();
    drawFooter(chunks.length + 1, chunks.length + 1);
    finalY = headerStartY;
  } else {
    // Update footer page count if no extra page was needed
    // (Re-draw footer on the last rendered page so page count stays correct)
    const pageCount = doc.getNumberOfPages();
    doc.setPage(pageCount);
    drawFooter(pageCount, pageCount);
  }

  // Totals block
  let y = finalY + 10;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Sub Total", labelX, y, { align: "right" });
  doc.text(formatCurrency(subtotal), rightX, y, { align: "right" });

  if (gstEnabled) {
    y += 7;
    doc.text("GST Total", labelX, y, { align: "right" });
    doc.text(formatCurrency(tax), rightX, y, { align: "right" });
  }

  y += 5;
  doc.setDrawColor(0);
  doc.line(rightX - 80, y, rightX, y);

  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL", labelX + 10, y, { align: "right" });
  doc.text(formatCurrency(invoiceTotal), rightX, y, { align: "right" });

  return doc;
};