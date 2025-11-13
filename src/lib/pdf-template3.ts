import type { Company, Party, Transaction, ShippingAddress } from "@/lib/types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { renderNotes, getUnifiedLines, invNo, getBillingAddress, getShippingAddress } from "./pdf-utils";

export const generatePdfForTemplate3 = async (
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
  const m = 20; // margin

  // Palette
  const NAVY: [number, number, number] = [29, 44, 74];
  const GOLD: [number, number, number] = [204, 181, 122];
  const TEXT: [number, number, number] = [41, 48, 66];
  const MUTED: [number, number, number] = [110, 119, 137];

  const { lines, subtotal, tax, invoiceTotal, gstEnabled } = _deriveTotals(
    transaction,
    company,
    serviceNameById
  );
  const companyGSTIN = _getCompanyGSTIN(company);

  const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

  const billingAddress = getBillingAddress(party);
  const shippingAddressStr = getShippingAddress(shippingAddress, billingAddress);

  // Data scaffold
  const invoiceData = {
    invoiceNumber: invNo(transaction),
    date: transaction.date
      ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
      : "01 / 10 / 2024",
    footer: {
      address: company?.address || "your address here",
      email: company?.emailId || "yourbusinessaccount@mail.com",
      phone: company?.mobileNumber || "123 456 789",
    },
    invoiceTo: {
      name: party?.name || "Client Name",
      billingAddress,
      shippingAddress: shippingAddressStr,
      email: party?.email || "",
    },
  };

  // Convert to table rows
  const itemsForTable = lines.map((l: any, index: number) => ({
    sno: (index + 1).toString(),
    description: `${l.name}${l.description ? " — " + l.description : ""}`,
    code: l.code || "",
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
      description: transaction.description || "Item",
      code: "",
      quantity: 1,
      pricePerUnit: amount,
      amount,
      gstPercentage: gstPct,
      lineTax,
      lineTotal,
    });
  }

  // Preload logo once
  const logoUrl =
    "https://i.pinimg.com/736x/71/b3/e4/71b3e4159892bb319292ab3b76900930.jpg";
  const logoDataURL = await fetchAsDataURL(logoUrl);

  // Base font
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...TEXT);

  // ---------- Layout constants (used across pages) ----------
  const stripY = 5;
  const stripH = 15;
  const rightLogoBlockW = 10;
  const stripX = 5;
  const stripW = pw - m - rightLogoBlockW - stripX;

  const headYBase = stripY + stripH + 22;
  const ROW_H = 14;
  const ITEMS_PER_PAGE = 10;

  const tableX = m;
  const tableW = pw - 2 * m;
  const crisp = (yy: number) => Math.floor(yy) + 0.5; // half-pixel alignment

  // Columns
  const colSNo = m;
  const colItem = colSNo + 20;
  const colCode = colItem + 30;
  const colQty = colCode + 20;
  const colRate = pw - m - 110; // (kept if you want to show rate separately)
  const colAmount = pw - m - 80;
  const colGST = pw - m - 50;
  const colTax = pw - m - 30;
  const colTotal = pw - m;

  // Footer bar geometry
  const fbH = 18;
  const fbY = ph - m - fbH;

  // ---------- painters ----------
  const drawTopStripAndLogo = () => {
    // hairline
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(0, stripY - 6, pw, stripY - 6);

    // navy strip
    doc.setFillColor(...NAVY);
    doc.rect(stripX, stripY, stripW, stripH, "F");

    // business name (gold, spaced)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...GOLD);
    const spacedText = (company?.businessName || "Your Company")
      .toUpperCase()
      .split("")
      .join(" ");
    doc.text(spacedText, pw / 2, stripY + stripH - 5, { align: "center" });

    // right logo
    const logoBoxX = pw - m - rightLogoBlockW;
    const maxLogoW = 24;
    const maxLogoH = 24;
    const logoTopY = stripY - 3;

    try {
      if (logoDataURL) {
        const props = doc.getImageProperties(logoDataURL);
        const scale = Math.min(maxLogoW / props.width, maxLogoH / props.height);
        const w = props.width * scale;
        const h = props.height * scale;
        const x = logoBoxX + 6;
        const y = logoTopY;
        doc.addImage(logoDataURL, "JPEG", x, y, w, h);
      } else {
        // vector fallback
        const x = logoBoxX + 5,
          y = logoTopY,
          s = 20;
        doc.setFillColor(...NAVY);
        doc.roundedRect(x, y, s, s, 3, 3, "F");
        doc.setFillColor(...GOLD);
        doc.circle(x + s - 6, y + 6, 3, "F");
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(2);
        doc.line(x + 6, y + 10, x + 10, y + 14);
        doc.line(x + 10, y + 14, x + 16, y + 8);
      }
    } catch {}
  };

  const drawHeaderBlocks = () => {
    // GSTIN under strip
    if (companyGSTIN) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...NAVY);
      doc.text(`GSTIN: ${companyGSTIN}`, m, stripY + stripH + 7);
    }

    // left: INVOICE TO
    doc.setTextColor(...TEXT);
    doc.setFontSize(9.8);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", m, headYBase);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.2);
    doc.text(invoiceData.invoiceTo.name, m, headYBase + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.2);
    doc.setTextColor(...MUTED);
    if (invoiceData.invoiceTo.email)
      doc.text(invoiceData.invoiceTo.email, m, headYBase + 13.5);
    doc.text(invoiceData.invoiceTo.billingAddress, m, headYBase + 19.5);

    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", m, headYBase + 25.5);
    doc.setFont("helvetica", "normal");
    doc.text(invoiceData.invoiceTo.shippingAddress, m, headYBase + 31.5);

    // right: invoice number + date
    doc.setTextColor(...TEXT);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.8);
    doc.text(`INVOICE NO. ${invoiceData.invoiceNumber}`, pw - m, headYBase, {
      align: "right",
    });
    doc.setFont("helvetica", "normal");
    doc.text(`DATE  ${invoiceData.date}`, pw - m, headYBase + 7, {
      align: "right",
    });
  };

  const drawTableHead = (): number => {
    let y = headYBase + 45;

    // CRISP top rule above the header
    doc.setDrawColor(196, 200, 208); // a bit darker than before
    doc.setLineWidth(0.2);
    doc.line(tableX, crisp(y - 8), tableX + tableW, crisp(y - 8));

    // Header background (subtle)
    doc.setFillColor(247, 249, 252); // very light gray/blue
    doc.rect(tableX, y - 6, tableW, 12, "F");

    // CRISP bottom border under the header
    doc.setDrawColor(206, 212, 222);
    doc.setLineWidth(0.2);
    doc.line(tableX, crisp(y + 6), tableX + tableW, crisp(y + 6));

    // Header labels
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.setFontSize(10.5);

    doc.text("S.No.", colSNo, y);
    doc.text("ITEM", colItem, y);
    doc.text("HSN/SAC", colCode, y);
    doc.text("QTY", colQty, y, { align: "right" });
    doc.text("PRICE", colAmount, y, { align: "right" }); // keep aligned to the “amount” column
    doc.text("GST%", colGST, y, { align: "right" });
    doc.text("TAX", colTax, y, { align: "right" });
    doc.text("TOTAL", colTotal, y, { align: "right" });

    // Start of first data row baseline
    return y + 12;
  };

  const drawRow = (it: any, y: number) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...TEXT);
    doc.setLineWidth(0.3);
    doc.setDrawColor(...GOLD);
    doc.setFontSize(9);

    // S.No.
    doc.text(it.sno, colSNo, y);

    // Description (truncate to fit one line)
    const maxDescWidth = colCode - colItem - 5;
    let description = it.description;
    if (doc.getTextWidth(description) > maxDescWidth) {
      // rough clamp based on width
      while (
        doc.getTextWidth(description + "...") > maxDescWidth &&
        description.length > 0
      ) {
        description = description.slice(0, -1);
      }
      description = description.trimEnd() + "...";
    }
    doc.text(description, colItem, y);

    // HSN/SAC
    doc.text(it.code, colCode, y);

    // Right-aligned numeric columns
    doc.text(String(it.quantity), colQty, y, { align: "right" });
    doc.text(money(it.pricePerUnit), colAmount, y, { align: "right" });
    doc.text(`${it.gstPercentage}%`, colGST, y, { align: "right" });
    doc.text(money(it.lineTax), colTax, y, { align: "right" });
    doc.text(money(it.lineTotal), colTotal, y, { align: "right" });

    // row divider
    doc.line(m, y + 3.2, pw - m, y + 3.2);
  };

  const drawFooterBar = () => {
    // bottom navy footer bar with contact
    doc.setFillColor(...NAVY);
    doc.rect(0, fbY, pw, fbH, "F");

    const innerW = pw;
    const sectionW = innerW / 3;
    const padX = 10;
    const r = 2.2;
    const gap = 4;
    const baseline = fbY + fbH / 2 + 1;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);

    const footerVals = [
      String(invoiceData.footer.address || ""),
      String(invoiceData.footer.email || ""),
      String(invoiceData.footer.phone || ""),
    ];

    const maxTextW = sectionW - (padX + r * 2 + gap + 2);
    const fit = (s: string) => {
      let t = s;
      while (doc.getTextWidth(t) > maxTextW && t.length > 1) t = t.slice(0, -1);
      return t.length < s.length ? t.trimEnd() + "..." : t;
    };

    footerVals.forEach((val, i) => {
      const left = i * sectionW;
      const textX = left + padX + r * 2 + gap;
      doc.setFillColor(...GOLD);
      doc.text(fit(val), textX, baseline, { align: "left" });
    });
  };

  // ---------- paginate rows (8 per page) ----------
  const chunks: any[][] = [];
  for (let i = 0; i < itemsForTable.length; i += ITEMS_PER_PAGE) {
    chunks.push(itemsForTable.slice(i, i + ITEMS_PER_PAGE));
  }
  if (chunks.length === 0) chunks.push(itemsForTable);

  let lastRowY = headYBase + 28; // will be updated
  chunks.forEach((rows, pageIndex) => {
    if (pageIndex > 0) doc.addPage();

    drawTopStripAndLogo();
    drawHeaderBlocks();
    let y = drawTableHead();

    rows.forEach((it) => {
      drawRow(it, y);
      y += ROW_H;
    });

    lastRowY = y;
    drawFooterBar();
  });

  // ---------- Totals (only once, at the end) ----------
  // space check (approx height of totals block)
  const approxTotalsHeight = gstEnabled ? 34 : 24;
  const bottomSafeY = ph - (m + fbH) - 10;

  if (lastRowY + approxTotalsHeight > bottomSafeY) {
    // add a new page just for totals
    doc.addPage();
    drawTopStripAndLogo();
    drawHeaderBlocks();
    drawFooterBar();
    lastRowY = headYBase + 28; // fresh start area for totals
  }

  let yTotals = lastRowY + 6;
  doc.setTextColor(...TEXT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);

  doc.text("SUBTOTAL", colTax, yTotals, { align: "right" });
  doc.text(money(subtotal), colTotal, yTotals, { align: "right" });

  if (gstEnabled) {
    yTotals += 10;
    doc.text("GST TOTAL", colTax, yTotals, { align: "right" });
    doc.text(money(tax), colTotal, yTotals, { align: "right" });
  }

  yTotals += 14;
  doc.setFontSize(12.5);
  doc.text("GRAND TOTAL:    ", colTax, yTotals, { align: "right" });
  doc.text(money(invoiceTotal), colTotal, yTotals, { align: "right" });

  // subtle divider above footer
  const afterTotals = yTotals + 6;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.line(m, afterTotals, pw - m, afterTotals);

  return doc;
};