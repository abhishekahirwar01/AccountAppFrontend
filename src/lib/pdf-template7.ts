import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { renderNotes, getUnifiedLines, invNo, getCompanyGSTIN, getBillingAddress, getShippingAddress } from "./pdf-utils";

export const generatePdfForTemplate7 = async (
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

  // New Palette - Professional, cool-toned, and clean
  const PRIMARY_BLUE: [number, number, number] = [38, 70, 83]; // Dark Teal/Blue - primary accent
  const SECONDARY_GRAY: [number, number, number] = [108, 117, 125]; // Muted dark gray for secondary info
  const TEXT_COLOR: [number, number, number] = [52, 58, 64]; // Near black for main text
  const LIGHT_BORDER: [number, number, number] = [206, 212, 218]; // Light gray for borders/dividers
  const BG_LIGHT: [number, number, number] = [248, 249, 250]; // Very light background for sections
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

  // Preload logo (using a more modern, abstract icon example)
  const logoUrl =
    "https://template.canva.com/EAE1YAgPM_U/1/0/400w-R-Meu_EcnME.jpg"; // Modern abstract placeholder
  const logoDataURL = await fetchAsDataURL(logoUrl);

  // Base font
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT_COLOR);

  // ---------- Layout constants (used across pages) ----------
  const headerBlockH = 35; // Height for the top area with company name and "INVOICE"
  const infoBlockY = headerBlockH + 20; // Y position for invoice/client info
  const tableStartY = infoBlockY + 80; // Y position where the item table starts
  const ROW_H = 10; // Table row height
  const ITEMS_PER_PAGE = 10; // Items per page
  const TABLE_HEADER_HEIGHT = 10; // Height of the table header row

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

  const footerSectionH = 30;
  const footerSectionY = ph - footerSectionH - m;

  // ---------- painters ----------

  const drawHeaderSection = () => {
    // Background for header
    doc.setFillColor(...BG_LIGHT);
    doc.rect(0, 0, pw, headerBlockH + 10, "F"); // Light background across the top

    const logoUrl =
      "https://template.canva.com/EAE1YAgPM_U/1/0/400w-R-Meu_EcnME.jpg"; // Replace with your logo URL

    // // Add the logo image to the PDF (adjust x, y, width, height as needed)
    // doc.addImage(logoUrl, "JPEG", m, m + 5, 30, 20); // x, y, width, height

    // Company Name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...PRIMARY_BLUE);
    doc.text(invoiceData.company.name.toUpperCase(), m + 0, m + 10);

    // "INVOICE" title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.setTextColor(...TEXT_COLOR);
    doc.text("INVOICE", pw - m, m + 12, { align: "right" });

    // Subtle line below header
    doc.setDrawColor(...LIGHT_BORDER);
    doc.setLineWidth(0.8);
    doc.line(m, headerBlockH + 10, pw - m, headerBlockH + 10);
  };

  const drawInfoBlocks = () => {
    // Company contact info (Left - more structured)
    doc.setTextColor(...SECONDARY_GRAY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    let currentY = infoBlockY;
    doc.text(invoiceData.company.address, m, currentY);
    currentY += 4;
    doc.text(`Email: ${invoiceData.company.email}`, m, currentY);
    currentY += 4;
    doc.text(`Phone: ${invoiceData.company.phone}`, m, currentY);
    currentY += 4;
    if (companyGSTIN) {
      doc.text(`GSTIN: ${companyGSTIN}`, m, currentY);
    }

    // Invoice details & Bill To (Right - in a structured block)
    const infoBlockWidth = 70;
    const infoBlockX = pw - m - infoBlockWidth;
    let rightY = infoBlockY;

    // Invoice Details
    doc.setFillColor(...BG_LIGHT);
    doc.rect(infoBlockX, rightY - 5, infoBlockWidth, 18, "F"); // Background for invoice details
    doc.setDrawColor(...LIGHT_BORDER);
    doc.setLineWidth(0.2);
    doc.rect(infoBlockX, rightY - 5, infoBlockWidth, 18, "S"); // Border

    doc.setTextColor(...PRIMARY_BLUE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("INVOICE NO:", infoBlockX + 2, rightY);
    doc.text("DATE:", infoBlockX + 2, rightY + 5);

    doc.setTextColor(...TEXT_COLOR);
    doc.setFont("helvetica", "normal");
    doc.text(
      invoiceData.invoiceNumber,
      infoBlockX + infoBlockWidth - 2,
      rightY,
      {
        align: "right",
      }
    );
    doc.text(invoiceData.date, infoBlockX + infoBlockWidth - 2, rightY + 5, {
      align: "right",
    });

    // Bill To
    rightY += 25; // Space between blocks
    doc.setTextColor(...PRIMARY_BLUE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("BILL TO:", infoBlockX, rightY);

    doc.setTextColor(...TEXT_COLOR);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(invoiceData.invoiceTo.name, infoBlockX, rightY + 5);
    doc.setTextColor(...SECONDARY_GRAY);
    const maxAddressWidth = infoBlockWidth - 2; // Leave some padding
    const addressLines = doc.splitTextToSize(
      invoiceData.invoiceTo.billingAddress,
      maxAddressWidth +10
    );
    doc.text(addressLines, infoBlockX, rightY + 9);
    let addressYOffset = 4 + (addressLines.length - 1) * 5;

    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", infoBlockX, rightY + 9 + addressYOffset);
    doc.setFont("helvetica", "normal");
    const shipLines = doc.splitTextToSize(
      invoiceData.invoiceTo.shippingAddress,
      maxAddressWidth +10
    );
    doc.text(shipLines, infoBlockX, rightY + 9 + addressYOffset + 5);
    let shipYOffset = addressYOffset + 5 + (shipLines.length - 1) * 5;

   if (invoiceData.invoiceTo.email)
 doc.text(invoiceData.invoiceTo.email, infoBlockX, rightY + 9 + shipYOffset + 4);
if (invoiceData.invoiceTo.gstin)
  doc.text(
    `GSTIN: ${invoiceData.invoiceTo.gstin}`,
    infoBlockX,
    rightY + 9 + shipYOffset + 4 + (invoiceData.invoiceTo.email ? 4 : 0)
  );
  };

  const drawTableHead = (): number => {
    let y = tableStartY;

    // Table Header with a fill and bottom border
    doc.setFillColor(...PRIMARY_BLUE);
    doc.rect(tableX, y, tableW, TABLE_HEADER_HEIGHT, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...WHITE);
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

    doc.setDrawColor(...LIGHT_BORDER);
    doc.setLineWidth(0.2);
    doc.line(
      tableX,
      y + TABLE_HEADER_HEIGHT,
      tableX + tableW,
      y + TABLE_HEADER_HEIGHT
    );

    return y + TABLE_HEADER_HEIGHT; // No extra gap for the clean look
  };

  const drawRow = (it: any, y: number, isLast: boolean) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_COLOR);
    doc.setFontSize(8);

    // Alternating row background for readability
    if (parseInt(it.sno) % 2 === 0) {
      doc.setFillColor(...BG_LIGHT);
      doc.rect(tableX, y, tableW, ROW_H, "F");
    }

    doc.text(it.sno, colSNo, y + ROW_H / 2 + 1);

    const maxDescWidth = colQty - colItem - 5;
    let description = it.description;
    const descLines = doc.splitTextToSize(description, maxDescWidth);
    doc.text(
      descLines,
      colItem,
      y + ROW_H / 2 + 1 - (descLines.length - 1) * 2
    );

    doc.text(String(it.quantity), colQty, y + ROW_H / 2 + 1, {
      align: "right",
    });
    doc.text(money(it.pricePerUnit), colRate, y + ROW_H / 2 + 1, {
      align: "right",
    });
    doc.text(`${it.gstPercentage}%`, colGST, y + ROW_H / 2 + 1, {
      align: "right",
    });
    doc.text(money(it.lineTax), colTax, y + ROW_H / 2 + 1, { align: "right" });
    doc.text(money(it.lineTotal), colTotal, y + ROW_H / 2 + 1, {
      align: "right",
    });

    // Draw bottom border for the row
    doc.setDrawColor(...LIGHT_BORDER);
    doc.setLineWidth(0.1);
    doc.line(tableX, y + ROW_H, tableX + tableW, y + ROW_H);
  };

  const drawTotals = (currentY: number) => {
    const totalsBlockWidth = 70;
    const totalsBlockX = pw - m - totalsBlockWidth;
    let yTotals = currentY + 10;

    // Subtotal
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT_COLOR);
    doc.setFontSize(9);
    doc.text("SUBTOTAL", totalsBlockX, yTotals);
    doc.setFont("helvetica", "bold");
    doc.text(money(subtotal), totalsBlockX + totalsBlockWidth, yTotals, {
      align: "right"
    });

    if (gstEnabled) {
      yTotals += 6;
      // GST Total
      doc.setFont("helvetica", "normal");
      doc.text("GST TOTAL", totalsBlockX, yTotals);
      doc.setFont("helvetica", "bold");
      doc.text(money(tax), totalsBlockX + totalsBlockWidth, yTotals, {
        align: "right",
      });
    }

    yTotals += 10; // Space before grand total

    // Grand Total - Highlighted
    doc.setFillColor(...PRIMARY_BLUE);
    doc.rect(totalsBlockX - 5, yTotals - 7, totalsBlockWidth + 5, 10, "F");

    doc.setFontSize(12);
    doc.setTextColor(...WHITE);
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", totalsBlockX - 2, yTotals);
    doc.text(
      money(invoiceTotal),
      totalsBlockX + totalsBlockWidth-2 ,
      yTotals,
      {
        align: "right",
      }
    );
  };

  const drawFooterSection = () => {
    // Solid line at the bottom
    doc.setDrawColor(...PRIMARY_BLUE);
    doc.setLineWidth(1);
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
    doc.setTextColor(...SECONDARY_GRAY);

    doc.text(
      `${invoiceData.company.address} | ${invoiceData.company.email} | ${invoiceData.company.phone}`,
      m,
      notesEndY + 4
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

  chunks.forEach((rows, pageIndex) => {
    if (pageIndex > 0) doc.addPage();

    drawHeaderSection();
    drawInfoBlocks();
    let y = drawTableHead();

    rows.forEach((it, idx) => {
      drawRow(it, y, idx === rows.length - 1);
      y += ROW_H;
    });

    lastRowY = y;

    // Draw footer content on every page (page number will be updated)
    drawFooterSection();
  });

  // ---------- Totals (only once, at the end) ----------
  const totalsBlockHeight = gstEnabled ? 40 : 30; // Estimate height needed for totals
  const bottomSafeY = ph - footerSectionH - m - totalsBlockHeight - 10;

  // Check if there's enough space for totals on the current page
  if (lastRowY + totalsBlockHeight + 10 <= bottomSafeY) {
    drawTotals(lastRowY);
  } else {
    // If not enough space, add a new page and then draw the totals
    doc.addPage();
    drawHeaderSection(); // Redraw header on new page
    drawInfoBlocks(); // Redraw info on new page
    drawTotals(tableStartY); // Draw totals starting from tableStartY on new page
    drawFooterSection(); // Redraw footer to update page number
  }

  return doc;
};