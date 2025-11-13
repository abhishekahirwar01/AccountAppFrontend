// import type { Company, Party, Transaction } from "@/lib/types";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// // import { getUnifiedLines } from "./utils";
// import { getUnifiedLines } from "./getUnifiedLines";

// // read a GSTIN off a company no matter the key
// const getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
//   const x = c as any;
//   return (
//     x?.gstin ??
//     x?.gstIn ??
//     x?.gstNumber ??
//     x?.gst_no ??
//     x?.gst ??
//     x?.gstinNumber ??
//     x?.tax?.gstin ??
//     null
//   );
// };

// // derive subtotal, tax, final using tx + company context
// const deriveTotals = (
//   tx: Transaction,
//   company?: Company | null,
//   serviceNameById?: Map<string, string>
// ) => {
//   const lines = getUnifiedLines(tx, serviceNameById);

//   const subtotal = lines.reduce(
//     (sum: number, item: any) => sum + (Number(item.amount) || 0),
//     0
//   );
//   const totalTax = lines.reduce(
//     (sum: number, item: any) => sum + (Number(item.lineTax) || 0),
//     0
//   );
//   const invoiceTotal = lines.reduce(
//     (sum: number, item: any) => sum + (Number(item.lineTotal) || 0),
//     0
//   );

//   const gstEnabled = totalTax > 0 && !!getCompanyGSTIN(company)?.trim();

//   return {
//     lines,
//     subtotal,
//     tax: totalTax,
//     invoiceTotal,
//     gstPct: 0, // This will be handled per item now
//     gstEnabled,
//   };
// };

// const formatCurrency = (amount: number) => {
//   // Manually format currency to avoid weird characters that break jspdf
//   const formatted = new Intl.NumberFormat("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   }).format(amount);
//   return `Rs ${formatted}`;
// };

// const renderNotes = (
//   pdfDoc: jsPDF,
//   notes: string,
//   startX: number,
//   startY: number,
//   maxWidth: number,
//   pageWidth: number,
//   pageHeight: number
// ) => {
//   if (!notes || typeof window === "undefined") return startY;

//   const parser = new DOMParser();
//   const docHTML = parser.parseFromString(notes, "text/html");
//   const elements = Array.from(docHTML.body.children);

//   let currentY = startY;

//   let listCounter = 1;
//   for (let el of elements) {
//     let bgColor: [number, number, number] | null = null; // Background color
//     if (el.tagName === "P") {
//       let text = el.textContent?.trim() || "";
//       if (!text) continue;

//       let align: "left" | "center" | "right" = "left";
//       let fontSize = 10;
//       let bold = false;
//       let textColor: [number, number, number] = [0, 0, 0]; // Default black

//       if (el.classList.contains("ql-align-center")) align = "center";
//       if (el.classList.contains("ql-align-right")) align = "right";
//       if (el.classList.contains("ql-size-large")) fontSize = 14;
//       if (el.classList.contains("ql-size-small")) fontSize = 8;

//       // Check for strong and underline tags
//       const strongEl = el.querySelector("strong");
//       const underlineEl = el.querySelector("u");
//       if (strongEl) {
//         bold = true;
//         text = strongEl.textContent?.trim() || text;
//         // Check for color in strong element
//         const style = strongEl.getAttribute("style");
//         if (style) {
//           const colorMatch = style.match(
//             /color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
//           );
//           if (colorMatch) {
//             textColor = [
//               parseInt(colorMatch[1]),
//               parseInt(colorMatch[2]),
//               parseInt(colorMatch[3]),
//             ];
//           }
//         }
//       }
//       const isUnderlined = !!underlineEl;
//       if (isUnderlined && !strongEl) {
//         text = underlineEl.textContent?.trim() || text;
//       }

//       // Check for color and background in paragraph itself
//       const paraStyle = el.getAttribute("style");
//       if (paraStyle) {
//         const colorMatch = paraStyle.match(
//           /color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
//         );
//         if (colorMatch) {
//           textColor = [
//             parseInt(colorMatch[1]),
//             parseInt(colorMatch[2]),
//             parseInt(colorMatch[3]),
//           ];
//         }
//         const bgMatch = paraStyle.match(
//           /background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
//         );
//         if (bgMatch) {
//           bgColor = [
//             parseInt(bgMatch[1]),
//             parseInt(bgMatch[2]),
//             parseInt(bgMatch[3]),
//           ];
//         }
//       }

//       pdfDoc.setFontSize(fontSize);
//       pdfDoc.setFont("helvetica", bold ? "bold" : "normal");
//       pdfDoc.setTextColor(...textColor);

//       const lines = pdfDoc.splitTextToSize(text, maxWidth);
//       const lineHeight = fontSize * 0.4 + 2;
//       const totalHeight = lines.length * lineHeight;

//       // Draw background if needed
//       if (bgColor) {
//         let bgX = startX;
//         let bgWidth = maxWidth;
//         if (align === "center") {
//           bgX = startX + maxWidth / 2 - maxWidth / 2;
//         } else if (align === "right") {
//           bgX = startX;
//         }
//         pdfDoc.setFillColor(...bgColor);
//         pdfDoc.rect(
//           bgX - 2,
//           currentY - fontSize * 0.3,
//           bgWidth + 4,
//           totalHeight + 2,
//           "F"
//         );
//       }

//       for (let line of lines) {
//         let x = startX;
//         if (align === "center") x = startX + maxWidth / 2;
//         else if (align === "right") x = startX + maxWidth;
//         pdfDoc.text(line, x, currentY, { align });

//         // Draw underline if needed
//         if (isUnderlined) {
//           const textWidth = pdfDoc.getTextWidth(line);
//           let underlineX = x;
//           if (align === "center") underlineX = x - textWidth / 2;
//           else if (align === "right") underlineX = x - textWidth;
//           pdfDoc.setLineWidth(0.5);
//           pdfDoc.setDrawColor(...textColor); // Use same color for underline
//           pdfDoc.line(
//             underlineX,
//             currentY + 1,
//             underlineX + textWidth,
//             currentY + 1
//           );
//           pdfDoc.setDrawColor(0, 0, 0); // Reset to black
//         }

//         currentY += lineHeight;
//       }

//       // Reset text color to black for next elements
//       pdfDoc.setTextColor(0, 0, 0);
//       currentY += 5; // paragraph spacing
//     } else if (el.tagName === "OL") {
//       const listItems = el.querySelectorAll("li");
//       listItems.forEach((li, index) => {
//         let text = li.textContent?.trim() || "";
//         if (!text) return;

//         let align: "left" | "center" | "right" = "left";
//         let fontSize = 10;
//         let bold = false;
//         let textColor: [number, number, number] = [0, 0, 0]; // Default black

//         if (li.classList.contains("ql-align-center")) align = "center";
//         if (li.classList.contains("ql-align-right")) align = "right";
//         if (li.classList.contains("ql-size-large")) fontSize = 14;
//         if (li.classList.contains("ql-size-small")) fontSize = 8;

//         // Check for strong and underline tags
//         const strongEl = li.querySelector("strong");
//         const underlineEl = li.querySelector("u");
//         if (strongEl) {
//           bold = true;
//           text = strongEl.textContent?.trim() || text;
//           // Check for color in strong element
//           const style = strongEl.getAttribute("style");
//           if (style) {
//             const colorMatch = style.match(
//               /color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
//             );
//             if (colorMatch) {
//               textColor = [
//                 parseInt(colorMatch[1]),
//                 parseInt(colorMatch[2]),
//                 parseInt(colorMatch[3]),
//               ];
//             }
//           }
//         }
//         const isUnderlined = !!underlineEl;
//         if (isUnderlined && !strongEl) {
//           text = underlineEl.textContent?.trim() || text;
//         }

//         // Check for color and background in list item itself
//         const liStyle = li.getAttribute("style");
//         if (liStyle) {
//           if (!strongEl) {
//             const colorMatch = liStyle.match(
//               /color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
//             );
//             if (colorMatch) {
//               textColor = [
//                 parseInt(colorMatch[1]),
//                 parseInt(colorMatch[2]),
//                 parseInt(colorMatch[3]),
//               ];
//             }
//           }
//           const bgMatch = liStyle.match(
//             /background-color:\s*rgb\((\d+),\s*(\d+),\s*(\d+)\)/
//           );
//           if (bgMatch) {
//             bgColor = [
//               parseInt(bgMatch[1]),
//               parseInt(bgMatch[2]),
//               parseInt(bgMatch[3]),
//             ];
//           }
//         }

//         pdfDoc.setFontSize(fontSize);
//         pdfDoc.setFont("helvetica", bold ? "bold" : "normal");
//         pdfDoc.setTextColor(...textColor);

//         const listText = `${listCounter}. ${text}`;
//         const lines = pdfDoc.splitTextToSize(listText, maxWidth);
//         const lineHeight = fontSize * 0.4 + 2;
//         const totalHeight = lines.length * lineHeight;

//         // Draw background if needed
//         if (bgColor) {
//           let bgX = startX;
//           let bgWidth = maxWidth;
//           if (align === "center") {
//             bgX = startX + maxWidth / 2 - maxWidth / 2;
//           } else if (align === "right") {
//             bgX = startX;
//           }
//           pdfDoc.setFillColor(...bgColor);
//           pdfDoc.rect(
//             bgX - 2,
//             currentY - fontSize * 0.3,
//             bgWidth + 4,
//             totalHeight + 2,
//             "F"
//           );
//         }

//         for (let line of lines) {
//           let x = startX;
//           if (align === "center") x = startX + maxWidth / 2;
//           else if (align === "right") x = startX + maxWidth;
//           pdfDoc.text(line, x, currentY, { align });

//           // Draw underline if needed
//           if (isUnderlined) {
//             const textWidth = pdfDoc.getTextWidth(line);
//             let underlineX = x;
//             if (align === "center") underlineX = x - textWidth / 2;
//             else if (align === "right") underlineX = x - textWidth;
//             pdfDoc.setLineWidth(0.5);
//             pdfDoc.setDrawColor(...textColor); // Use same color for underline
//             pdfDoc.line(
//               underlineX,
//               currentY + 1,
//               underlineX + textWidth,
//               currentY + 1
//             );
//             pdfDoc.setDrawColor(0, 0, 0); // Reset to black
//           }

//           currentY += lineHeight;
//         }

//         // Reset text color to black for next elements
//         pdfDoc.setTextColor(0, 0, 0);
//         currentY += 3; // list item spacing
//         listCounter++;
//       });
//       currentY += 5; // list spacing
//     }
//   }

//   return currentY;
// };

// const getItemsBody = (
//   transaction: Transaction,
//   serviceNameById?: Map<string, string>
// ) => {
//   const lines = getUnifiedLines(transaction, serviceNameById);

//   if (lines.length === 0) {
//     return [
//       [
//         "1",
//         1,
//         transaction.description || "Item",
//         formatCurrency((transaction as any).amount ?? 0),
//         "0%",
//         formatCurrency(0),
//         formatCurrency((transaction as any).amount ?? 0),
//       ],
//     ];
//   }

//   return lines.map((item: any, index: number) => [
//     (index + 1).toString(),
//     item.quantity || 1,
//     `${item.name}\n${item.description || ""}`,
//     formatCurrency(Number(item.pricePerUnit || item.amount)),
//     `${item.gstPercentage || 0}%`,
//     formatCurrency(item.lineTax || 0),
//     formatCurrency(item.lineTotal || item.amount || 0),
//   ]);
// };

// const invNo = (tx: Transaction) => {
//   // Prefer the issued invoice number from server
//   if ((tx as any)?.invoiceNumber) return String((tx as any).invoiceNumber);

//   // Fallbacks for old data:
//   if ((tx as any)?.referenceNumber) return String((tx as any).referenceNumber);
//   const id = tx?._id ? String(tx._id) : "";
//   return `INV-${id.slice(-6).toUpperCase() || "000000"}`;
// };

// export const generatePdfForTemplate1 = (
//   transaction: Transaction,
//   company: Company | null | undefined,
//   party: Party | null | undefined,
//   serviceNameById?: Map<string, string>
// ): jsPDF => {
//   const doc = new jsPDF();
//   const { subtotal, tax, invoiceTotal } = deriveTotals(
//     transaction,
//     company,
//     serviceNameById
//   );
//   const companyGSTIN = getCompanyGSTIN(company);

//   const invoiceNo = invNo(transaction);
//   const invoiceDate = new Intl.DateTimeFormat("en-IN", {
//     year: "numeric",
//     month: "long",
//     day: "numeric",
//   }).format(new Date(transaction.date));
//   const partyAddress = party
//     ? [party.address, party.city, party.state].filter(Boolean).join(", ")
//     : "Address not available";

//   // ---- helpers -------------------------------------------------------------
//   const ITEMS_PER_PAGE = 10;
//   const pageW = doc.internal.pageSize.getWidth();
//   const pageH = doc.internal.pageSize.getHeight();
//   const headerStartY = 65; // where table starts
//   const footerOffset = 40; // reserved space at bottom for footer
//   const tableBottomMargin = 60;
//   const tabletopMargin = 10; // to keep table off the footer

//   const drawDecor = () => {
//     doc.setFillColor(82, 101, 167);
//     doc.rect(0, 0, 8, 40, "F");
//     doc.rect(pageW - 8, pageH - 40, 8, 40, "F");
//   };

//   const drawHeader = () => {
//     drawDecor();

//     // Company / INVOICE label
//     doc.setFontSize(22);
//     doc.setFont("helvetica", "bold");
//     doc.text(company?.businessName || "Your Company", 15, 20);

//     if (companyGSTIN) {
//       doc.setFontSize(10);
//       doc.setFont("helvetica", "normal");
//       doc.text(`GSTIN: ${companyGSTIN}`, 15, 26);
//     }

//     doc.setFontSize(18);
//     doc.setFont("helvetica", "bold");
//     doc.text("INVOICE", pageW - 15, 20, { align: "right" });
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text(invoiceDate, pageW - 15, 26, { align: "right" });

//     // Invoice info + Bill To
//     doc.setFontSize(12);
//     doc.setFont("helvetica", "bold");
//     doc.text(`INVOICE NO: ${invoiceNo}`, 15, 40);

//     doc.setFontSize(10);
//     doc.text("TO:", pageW - 15, 40, { align: "right" });
//     doc.setFont("helvetica", "normal");
//     doc.text(party?.name || "N/A", pageW - 15, 45, { align: "right" });
//     doc.text(partyAddress, pageW - 15, 50, { align: "right" });
//   };

//   const drawFooter = () => {
//     const y = pageH - footerOffset;
//     doc.setFontSize(10);
//     doc.setFont("helvetica", "bold");
//     doc.text("Payment Method", 15, y);
//     doc.setFont("helvetica", "normal");
//     doc.text("Please make payments to the provided account.", 15, y + 5);

//     // Render notes instead of hardcoded terms
//     renderNotes(
//       doc,
//       transaction.notes || "",
//       pageW - 15 - 60,
//       y,
//       60,
//       pageW,
//       pageH
//     );
//   };

//   // Build full rows, then chunk into pages of 8
//   const allRows = getItemsBody(transaction, serviceNameById);
//   const chunks: any[][] = [];
//   for (let i = 0; i < allRows.length; i += ITEMS_PER_PAGE) {
//     chunks.push(allRows.slice(i, i + ITEMS_PER_PAGE));
//   }

//   // Ensure we render at least one page even if there are 0 rows (your getItemsBody already handles empty)
//   if (chunks.length === 0) chunks.push(allRows);

//   // ---- render pages --------------------------------------------------------
//   const tableHead = [
//     [
//       "S.No.",
//       "QTY",
//       "DESCRIPTION",
//       "PRICE",
//       "GST %",
//       "TAX",
//       "TOTAL (Incl. GST)",
//     ],
//   ];

//   chunks.forEach((rows, idx) => {
//     if (idx > 0) doc.addPage();
//     drawHeader();

//     autoTable(doc, {
//       startY: headerStartY,
//       head: tableHead,
//       body: rows,
//       theme: "striped",
//       headStyles: { fillColor: [241, 245, 249], textColor: [0, 0, 0] },
//       bodyStyles: { fillColor: [255, 255, 255] },
//       showHead: "everyPage",
//       margin: { bottom: tableBottomMargin }, // leaves space for footer
//       didDrawPage: () => {
//         // nothing here; we manually draw footer after the table so totals can sit above it on last page
//       },
//       didParseCell: (data) => {
//         // Add extra TOP padding for ONLY the first body row
//         if (data.section === "body" && data.row.index === 0) {
//           // Ensure padding is in object form, then bump the top
//           const current = data.cell.styles.cellPadding;
//           if (typeof current === "number") {
//             data.cell.styles.cellPadding = {
//               top: current + 6,
//               right: current,
//               bottom: current,
//               left: current,
//             };
//           } else {
//             // data.cell.styles.cellPadding = { top: (current?.top || 2) + 6, right: current?.right || 2, bottom: current?.bottom || 2, left: current?.left || 2 };
//           }
//         }
//       },
//     });

//     // Draw static footer on every page — totals will overwrite/come above on last page if needed
//     drawFooter();
//   });

//   // ---- totals on the last page --------------------------------------------
//   // Place totals under the last table; if no space, add a new page (with header & footer).
//   let finalY = (doc as any).lastAutoTable?.finalY || headerStartY;
//   const minSpaceNeeded = 30; // approx height for totals block
//   if (finalY + minSpaceNeeded > pageH - footerOffset - 10) {
//     doc.addPage();
//     drawHeader();
//     drawFooter();
//     finalY = headerStartY; // start near top on the new page
//   }

//   let currentY = finalY + 10;
//   doc.setFontSize(10);
//   doc.setFont("helvetica", "normal");
//   doc.text("Sub Total", 150, currentY, { align: "right" });
//   doc.text(formatCurrency(subtotal), 200, currentY, { align: "right" });

//   if (tax > 0) {
//     currentY += 7;
//     doc.text("GST Total", 150, currentY, { align: "right" });
//     doc.text(formatCurrency(tax), 200, currentY, { align: "right" });
//   }

//   currentY += 5;
//   doc.setDrawColor(0);
//   doc.line(120, currentY, 200, currentY);

//   currentY += 7;
//   doc.setFont("helvetica", "bold");
//   doc.text("GRAND TOTAL", 160, currentY, { align: "right" });
//   doc.text(formatCurrency(invoiceTotal), 200, currentY, { align: "right" });

//   return doc;
// };

// const getItemsBodyTemplate2 = (
//   transaction: Transaction,
//   serviceNameById?: Map<string, string>
// ) => {
//   const lines = getUnifiedLines(transaction, serviceNameById);

//   if (lines.length === 0) {
//     const amt = Number((transaction as any).amount ?? 0);
//     const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
//     const tax = (amt * gstPct) / 100;
//     const total = amt + tax;

//     return [
//       [
//         "1",
//         transaction.description || "Item",
//         1,
//         `${gstPct}%`,
//         formatCurrency(amt),
//         formatCurrency(tax),
//         formatCurrency(total),
//       ],
//     ];
//   }

//   return lines.map((item: any, index: number) => [
//     (index + 1).toString(),
//     `${item.name}${item.description ? " - " + item.description : ""}`,
//     item.quantity || 1,
//     `${item.gstPercentage || 0}%`,
//     formatCurrency(Number(item.pricePerUnit || item.amount)),
//     formatCurrency(item.lineTax || 0),
//     formatCurrency(item.lineTotal || item.amount || 0),
//   ]);
// };

// export const generatePdfForTemplate2 = (
//   transaction: Transaction,
//   company: Company | null | undefined,
//   party: Party | null | undefined,
//   serviceNameById?: Map<string, string>
// ): jsPDF => {
//   const doc = new jsPDF();

//   const { subtotal, tax, invoiceTotal, gstEnabled } = deriveTotals(
//     transaction,
//     company,
//     serviceNameById
//   );
//   const companyGSTIN = getCompanyGSTIN(company);

//   const pageW = doc.internal.pageSize.getWidth();
//   const pageH = doc.internal.pageSize.getHeight();

//   const ITEMS_PER_PAGE = 12;
//   const headerStartY = 100; // where the table begins
//   const footerOffset = 35; // reserved space for footer at bottom
//   const tableBottomMargin = 55; // keep table above footer
//   const rightX = pageW - 10;
//   const labelX = rightX - 60;

//   const partyAddress = party
//     ? [party.address, party.city, party.state].filter(Boolean).join(", ")
//     : "Address not available";

//   // --- helpers -------------------------------------------------------------
//   const drawHeader = () => {
//     // Company block (left)
//     doc.setFontSize(22);
//     doc.setFont("helvetica", "bold");
//     doc.text(company?.businessName || "Your Company", 20, 30);

//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     if (company?.emailId) doc.text(company.emailId, 20, 37);
//     if (company?.mobileNumber) doc.text(company.mobileNumber, 20, 44);
//     if (companyGSTIN) doc.text(`GSTIN: ${companyGSTIN}`, 20, 51);

//     // Invoice block (right)
//     doc.setFontSize(18);
//     doc.setFont("helvetica", "bold");
//     doc.text(`Invoice ${invNo(transaction)}`, rightX, 30, { align: "right" });

//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     doc.text(
//       `Issued: ${new Intl.DateTimeFormat("en-US").format(
//         new Date(transaction.date)
//       )}`,
//       rightX,
//       37,
//       { align: "right" }
//     );
//     doc.text(
//       `Payment Due: ${new Intl.DateTimeFormat("en-US").format(
//         new Date(
//           new Date(transaction.date).setDate(
//             new Date(transaction.date).getDate() + 30
//           )
//         )
//       )}`,
//       rightX,
//       44,
//       { align: "right" }
//     );

//     // Divider
//     doc.line(15, 60, pageW - 15, 60);

//     // Client block (repeat on each page for consistency)
//     doc.setFontSize(14);
//     doc.setFont("helvetica", "bold");
//     doc.text(party?.name || "Client Name", 20, 75);

//     doc.setFontSize(10);
//     doc.setFont("helvetica", "normal");
//     if (party?.email) doc.text(party.email, 20, 82);
//     doc.text(partyAddress, 20, 89);
//   };

//   const drawFooter = (pageNum: number, totalPages: number) => {
//     const y = pageH - footerOffset;
//     // Render notes instead of hardcoded thank you
//     renderNotes(doc, transaction.notes || "", 20, y, pageW - 40, pageW, pageH);
//     // Optional page numbering
//     doc.text(`Page ${pageNum} of ${totalPages}`, rightX, y, { align: "right" });
//   };

//   // Build all rows then chunk into pages of 8
//   const allRows = getItemsBodyTemplate2(transaction, serviceNameById);
//   const chunks: any[][] = [];
//   for (let i = 0; i < allRows.length; i += ITEMS_PER_PAGE) {
//     chunks.push(allRows.slice(i, i + ITEMS_PER_PAGE));
//   }
//   if (chunks.length === 0) chunks.push(allRows); // safety

//   const totalPagesPlanned = Math.max(1, chunks.length); // base count (may add one later if totals need a fresh page)

//   // Render each chunk on its own page
//   chunks.forEach((rows, idx) => {
//     if (idx > 0) doc.addPage();
//     drawHeader();

//     autoTable(doc, {
//       startY: headerStartY,
//       head: [
//         ["S.No.", "Item Description", "Qty", "GST%", "Rate", "Tax", "Total"],
//       ],
//       body: rows,
//       theme: "grid",
//       headStyles: { fillColor: [238, 238, 238], textColor: [0, 0, 0] },
//       bodyStyles: { fillColor: [255, 255, 255] },
//       margin: { bottom: tableBottomMargin },
//       showHead: "everyPage",
//       styles: {
//         cellPadding: { top: 3, right: 3, bottom: 3, left: 3 }, // ← breathing room
//         overflow: "linebreak", // wrap text instead of clipping
//         valign: "middle", // vertical centering
//         fontSize: 10,
//         lineWidth: 0.25, // slightly darker cell borders
//         lineColor: [220, 223, 230],
//       },
//     });

//     drawFooter(idx + 1, totalPagesPlanned);
//   });

//   // Totals on the last page (or add a new one if no room)
//   let finalY = (doc as any).lastAutoTable?.finalY || headerStartY;
//   const approxTotalsHeight = 30;

//   if (finalY + approxTotalsHeight > pageH - footerOffset - 10) {
//     // Need a fresh page only for totals
//     doc.addPage();
//     drawHeader();
//     drawFooter(chunks.length + 1, chunks.length + 1);
//     finalY = headerStartY;
//   } else {
//     // Update footer page count if no extra page was needed
//     // (Re-draw footer on the last rendered page so page count stays correct)
//     const pageCount = doc.getNumberOfPages();
//     doc.setPage(pageCount);
//     drawFooter(pageCount, pageCount);
//   }

//   // Totals block
//   let y = finalY + 10;
//   doc.setFontSize(10);
//   doc.setFont("helvetica", "normal");
//   doc.text("Sub Total", labelX, y, { align: "right" });
//   doc.text(formatCurrency(subtotal), rightX, y, { align: "right" });

//   if (gstEnabled) {
//     y += 7;
//     doc.text("GST Total", labelX, y, { align: "right" });
//     doc.text(formatCurrency(tax), rightX, y, { align: "right" });
//   }

//   y += 5;
//   doc.setDrawColor(0);
//   doc.line(rightX - 80, y, rightX, y);

//   y += 7;
//   doc.setFont("helvetica", "bold");
//   doc.text("GRAND TOTAL", labelX + 10, y, { align: "right" });
//   doc.text(formatCurrency(invoiceTotal), rightX, y, { align: "right" });

//   return doc;
// };

// export const generatePdfForTemplate3 = async (
//   transaction: Transaction,
//   company: Company | null | undefined,
//   party: Party | null | undefined,
//   serviceNameById?: Map<string, string>
// ): Promise<jsPDF> => {
//   // ------ local helpers ------
//   const _getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
//     const x = c as any;
//     return (
//       x?.gstin ??
//       x?.gstIn ??
//       x?.gstNumber ??
//       x?.gst_no ??
//       x?.gst ??
//       x?.gstinNumber ??
//       x?.tax?.gstin ??
//       null
//     );
//   };

//   const _deriveTotals = (
//     tx: Transaction,
//     co?: Company | null,
//     svcNameById?: Map<string, string>
//   ) => {
//     const lines = getUnifiedLines(tx, svcNameById);
//     const subtotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.amount) || 0),
//       0
//     );
//     const totalTax = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTax) || 0),
//       0
//     );
//     const invoiceTotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTotal) || 0),
//       0
//     );
//     const gstEnabled = totalTax > 0 && !!_getCompanyGSTIN(co)?.trim();
//     return { lines, subtotal, tax: totalTax, invoiceTotal, gstEnabled };
//   };

//   const fetchAsDataURL = async (url: string) => {
//     try {
//       const res = await fetch(url, { mode: "cors" });
//       const blob = await res.blob();
//       return await new Promise<string>((resolve) => {
//         const r = new FileReader();
//         r.onload = () => resolve(r.result as string);
//         r.readAsDataURL(blob);
//       });
//     } catch {
//       return "";
//     }
//   };
//   // -------------------------------------------------------------------------

//   const doc = new jsPDF();
//   const pw = doc.internal.pageSize.getWidth();
//   const ph = doc.internal.pageSize.getHeight();
//   const m = 20; // margin

//   // Palette
//   const NAVY: [number, number, number] = [29, 44, 74];
//   const GOLD: [number, number, number] = [204, 181, 122];
//   const TEXT: [number, number, number] = [41, 48, 66];
//   const MUTED: [number, number, number] = [110, 119, 137];

//   const { lines, subtotal, tax, invoiceTotal, gstEnabled } = _deriveTotals(
//     transaction,
//     company,
//     serviceNameById
//   );
//   const companyGSTIN = _getCompanyGSTIN(company);

//   const money = (n: number) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;

//   // Data scaffold
//   const invoiceData = {
//     invoiceNumber: invNo(transaction),
//     date: transaction.date
//       ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
//       : "01 / 10 / 2024",
//     footer: {
//       address: company?.address || "your address here",
//       email: company?.emailId || "yourbusinessaccount@mail.com",
//       phone: company?.mobileNumber || "123 456 789",
//     },
//     invoiceTo: {
//       name: party?.name || "Client Name",
//       address:
//         party?.address && party?.city
//           ? `${party.address}, ${party.city}, ${party.state || ""}`.replace(
//               /,\s*$/,
//               ""
//             )
//           : "Address not available",
//       email: party?.email || "",
//     },
//   };

//   // Convert to table rows
//   const itemsForTable = lines.map((l: any, index: number) => ({
//     sno: (index + 1).toString(),
//     description: `${l.name}${l.description ? " — " + l.description : ""}`,
//     quantity: l.quantity || 1,
//     pricePerUnit: Number(l.pricePerUnit || l.amount || 0),
//     amount: Number(l.amount || 0),
//     gstPercentage: l.gstPercentage || 0,
//     lineTax: Number(l.lineTax || 0),
//     lineTotal: Number(l.lineTotal || l.amount || 0),
//   }));

//   if (itemsForTable.length === 0) {
//     const amount = Number((transaction as any).amount ?? 0);
//     const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
//     const lineTax = (amount * gstPct) / 100;
//     const lineTotal = amount + lineTax;
//     itemsForTable.push({
//       sno: "1",
//       description: transaction.description || "Item",
//       quantity: 1,
//       pricePerUnit: amount,
//       amount,
//       gstPercentage: gstPct,
//       lineTax,
//       lineTotal,
//     });
//   }

//   // Preload logo once
//   const logoUrl =
//     "https://i.pinimg.com/736x/71/b3/e4/71b3e4159892bb319292ab3b76900930.jpg";
//   const logoDataURL = await fetchAsDataURL(logoUrl);

//   // Base font
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(...TEXT);

//   // ---------- Layout constants (used across pages) ----------
//   const stripY = 5;
//   const stripH = 15;
//   const rightLogoBlockW = 10;
//   const stripX = 5;
//   const stripW = pw - m - rightLogoBlockW - stripX;

//   const headYBase = stripY + stripH + 22;
//   const ROW_H = 14;
//   const ITEMS_PER_PAGE = 10;

//   const tableX = m;
//   const tableW = pw - 2 * m;
//   const crisp = (yy: number) => Math.floor(yy) + 0.5; // half-pixel alignment

//   // Columns
//   const colSNo = m;
//   const colItem = colSNo + 20;
//   const colQty = colItem + 40;
//   const colRate = pw - m - 110; // (kept if you want to show rate separately)
//   const colAmount = pw - m - 80;
//   const colGST = pw - m - 50;
//   const colTax = pw - m - 30;
//   const colTotal = pw - m;

//   // Footer bar geometry
//   const fbH = 18;
//   const fbY = ph - m - fbH;

//   // ---------- painters ----------
//   const drawTopStripAndLogo = () => {
//     // hairline
//     doc.setDrawColor(200, 200, 200);
//     doc.setLineWidth(0.2);
//     doc.line(0, stripY - 6, pw, stripY - 6);

//     // navy strip
//     doc.setFillColor(...NAVY);
//     doc.rect(stripX, stripY, stripW, stripH, "F");

//     // business name (gold, spaced)
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(16);
//     doc.setTextColor(...GOLD);
//     const spacedText = (company?.businessName || "Your Company")
//       .toUpperCase()
//       .split("")
//       .join(" ");
//     doc.text(spacedText, pw / 2, stripY + stripH - 5, { align: "center" });

//     // right logo
//     const logoBoxX = pw - m - rightLogoBlockW;
//     const maxLogoW = 24;
//     const maxLogoH = 24;
//     const logoTopY = stripY - 3;

//     try {
//       if (logoDataURL) {
//         const props = doc.getImageProperties(logoDataURL);
//         const scale = Math.min(maxLogoW / props.width, maxLogoH / props.height);
//         const w = props.width * scale;
//         const h = props.height * scale;
//         const x = logoBoxX + 6;
//         const y = logoTopY;
//         doc.addImage(logoDataURL, "JPEG", x, y, w, h);
//       } else {
//         // vector fallback
//         const x = logoBoxX + 5,
//           y = logoTopY,
//           s = 20;
//         doc.setFillColor(...NAVY);
//         doc.roundedRect(x, y, s, s, 3, 3, "F");
//         doc.setFillColor(...GOLD);
//         doc.circle(x + s - 6, y + 6, 3, "F");
//         doc.setDrawColor(255, 255, 255);
//         doc.setLineWidth(2);
//         doc.line(x + 6, y + 10, x + 10, y + 14);
//         doc.line(x + 10, y + 14, x + 16, y + 8);
//       }
//     } catch {}
//   };

//   const drawHeaderBlocks = () => {
//     // GSTIN under strip
//     if (companyGSTIN) {
//       doc.setFont("helvetica", "normal");
//       doc.setFontSize(9);
//       doc.setTextColor(...NAVY);
//       doc.text(`GSTIN: ${companyGSTIN}`, m, stripY + stripH + 7);
//     }

//     // left: INVOICE TO
//     doc.setTextColor(...TEXT);
//     doc.setFontSize(9.8);
//     doc.setFont("helvetica", "bold");
//     doc.text("INVOICE TO:", m, headYBase);

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(10.2);
//     doc.text(invoiceData.invoiceTo.name, m, headYBase + 7);

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(9.2);
//     doc.setTextColor(...MUTED);
//     if (invoiceData.invoiceTo.email)
//       doc.text(invoiceData.invoiceTo.email, m, headYBase + 13.5);
//     doc.text(invoiceData.invoiceTo.address, m, headYBase + 19.5);

//     // right: invoice number + date
//     doc.setTextColor(...TEXT);
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(9.8);
//     doc.text(`INVOICE NO. ${invoiceData.invoiceNumber}`, pw - m, headYBase, {
//       align: "right",
//     });
//     doc.setFont("helvetica", "normal");
//     doc.text(`DATE  ${invoiceData.date}`, pw - m, headYBase + 7, {
//       align: "right",
//     });
//   };

//   const drawTableHead = (): number => {
//     let y = headYBase + 35;

//     // CRISP top rule above the header
//     doc.setDrawColor(196, 200, 208); // a bit darker than before
//     doc.setLineWidth(0.2);
//     doc.line(tableX, crisp(y - 8), tableX + tableW, crisp(y - 8));

//     // Header background (subtle)
//     doc.setFillColor(247, 249, 252); // very light gray/blue
//     doc.rect(tableX, y - 6, tableW, 12, "F");

//     // CRISP bottom border under the header
//     doc.setDrawColor(206, 212, 222);
//     doc.setLineWidth(0.2);
//     doc.line(tableX, crisp(y + 6), tableX + tableW, crisp(y + 6));

//     // Header labels
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(...NAVY);
//     doc.setFontSize(10.5);

//     doc.text("S.No.", colSNo, y);
//     doc.text("ITEM", colItem, y);
//     doc.text("QTY", colQty, y, { align: "right" });
//     doc.text("PRICE", colAmount, y, { align: "right" }); // keep aligned to the “amount” column
//     doc.text("GST%", colGST, y, { align: "right" });
//     doc.text("TAX", colTax, y, { align: "right" });
//     doc.text("TOTAL", colTotal, y, { align: "right" });

//     // Start of first data row baseline
//     return y + 12;
//   };

//   const drawRow = (it: any, y: number) => {
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(...TEXT);
//     doc.setLineWidth(0.3);
//     doc.setDrawColor(...GOLD);
//     doc.setFontSize(9);

//     // S.No.
//     doc.text(it.sno, colSNo, y);

//     // Description (truncate to fit one line)
//     const maxDescWidth = colQty - colItem - 5;
//     let description = it.description;
//     if (doc.getTextWidth(description) > maxDescWidth) {
//       // rough clamp based on width
//       while (
//         doc.getTextWidth(description + "...") > maxDescWidth &&
//         description.length > 0
//       ) {
//         description = description.slice(0, -1);
//       }
//       description = description.trimEnd() + "...";
//     }
//     doc.text(description, colItem, y);

//     // Right-aligned numeric columns
//     doc.text(String(it.quantity), colQty, y, { align: "right" });
//     doc.text(money(it.pricePerUnit), colAmount, y, { align: "right" });
//     doc.text(`${it.gstPercentage}%`, colGST, y, { align: "right" });
//     doc.text(money(it.lineTax), colTax, y, { align: "right" });
//     doc.text(money(it.lineTotal), colTotal, y, { align: "right" });

//     // row divider
//     doc.line(m, y + 3.2, pw - m, y + 3.2);
//   };

//   const drawFooterBar = () => {
//     // bottom navy footer bar with contact
//     doc.setFillColor(...NAVY);
//     doc.rect(0, fbY, pw, fbH, "F");

//     const innerW = pw;
//     const sectionW = innerW / 3;
//     const padX = 10;
//     const r = 2.2;
//     const gap = 4;
//     const baseline = fbY + fbH / 2 + 1;

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(9);
//     doc.setTextColor(255, 255, 255);

//     const footerVals = [
//       String(invoiceData.footer.address || ""),
//       String(invoiceData.footer.email || ""),
//       String(invoiceData.footer.phone || ""),
//     ];

//     const maxTextW = sectionW - (padX + r * 2 + gap + 2);
//     const fit = (s: string) => {
//       let t = s;
//       while (doc.getTextWidth(t) > maxTextW && t.length > 1) t = t.slice(0, -1);
//       return t.length < s.length ? t.trimEnd() + "..." : t;
//     };

//     footerVals.forEach((val, i) => {
//       const left = i * sectionW;
//       const textX = left + padX + r * 2 + gap;
//       doc.setFillColor(...GOLD);
//       doc.text(fit(val), textX, baseline, { align: "left" });
//     });
//   };

//   // ---------- paginate rows (8 per page) ----------
//   const chunks: any[][] = [];
//   for (let i = 0; i < itemsForTable.length; i += ITEMS_PER_PAGE) {
//     chunks.push(itemsForTable.slice(i, i + ITEMS_PER_PAGE));
//   }
//   if (chunks.length === 0) chunks.push(itemsForTable);

//   // Render each page of rows
//   let lastRowY = headYBase + 28; // will be updated
//   chunks.forEach((rows, pageIndex) => {
//     if (pageIndex > 0) doc.addPage();

//     drawTopStripAndLogo();
//     drawHeaderBlocks();
//     let y = drawTableHead();

//     rows.forEach((it) => {
//       drawRow(it, y);
//       y += ROW_H;
//     });

//     lastRowY = y;
//     drawFooterBar();
//   });

//   // ---------- Totals (only once, at the end) ----------
//   // space check (approx height of totals block)
//   const approxTotalsHeight = gstEnabled ? 34 : 24;
//   const bottomSafeY = ph - (m + fbH) - 10;

//   if (lastRowY + approxTotalsHeight > bottomSafeY) {
//     // add a new page just for totals
//     doc.addPage();
//     drawTopStripAndLogo();
//     drawHeaderBlocks();
//     drawFooterBar();
//     lastRowY = headYBase + 28; // fresh start area for totals
//   }

//   let yTotals = lastRowY + 6;
//   doc.setTextColor(...TEXT);
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(10.5);

//   doc.text("SUBTOTAL", colTax, yTotals, { align: "right" });
//   doc.text(money(subtotal), colTotal, yTotals, { align: "right" });

//   if (gstEnabled) {
//     yTotals += 10;
//     doc.text("GST TOTAL", colTax, yTotals, { align: "right" });
//     doc.text(money(tax), colTotal, yTotals, { align: "right" });
//   }

//   yTotals += 14;
//   doc.setFontSize(12.5);
//   doc.text("GRAND TOTAL:    ", colTax, yTotals, { align: "right" });
//   doc.text(money(invoiceTotal), colTotal, yTotals, { align: "right" });

//   // subtle divider above footer
//   const afterTotals = yTotals + 6;
//   doc.setDrawColor(220, 220, 220);
//   doc.setLineWidth(0.2);
//   doc.line(m, afterTotals, pw - m, afterTotals);

//   return doc;
// };

// export const generatePdfForTemplate4 = async (
//   transaction: Transaction,
//   company: Company | null | undefined,
//   party: Party | null | undefined,
//   serviceNameById?: Map<string, string>
// ): Promise<jsPDF> => {
//   // --- helpers (same as your other templates) ---
//   const _getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
//     const x = c as any;
//     return (
//       x?.gstin ??
//       x?.gstIn ??
//       x?.gstNumber ??
//       x?.gst_no ??
//       x?.gst ??
//       x?.gstinNumber ??
//       x?.tax?.gstin ??
//       null
//     );
//   };

//   const _deriveTotals = (
//     tx: Transaction,
//     co?: Company | null,
//     svcNameById?: Map<string, string>
//   ) => {
//     const lines = getUnifiedLines(tx, svcNameById);
//     const subtotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.amount) || 0),
//       0
//     );
//     const totalTax = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTax) || 0),
//       0
//     );
//     const invoiceTotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTotal) || 0),
//       0
//     );
//     const gstEnabled = totalTax > 0 && !!_getCompanyGSTIN(co)?.trim();
//     return { lines, subtotal, tax: totalTax, invoiceTotal, gstEnabled };
//   };

//   const doc = new jsPDF();
//   const pw = doc.internal.pageSize.getWidth();
//   const ph = doc.internal.pageSize.getHeight();
//   const m = 20; // margin

//   // Palette (your minimal theme)
//   const PRIMARY: [number, number, number] = [59, 130, 246];
//   const SECONDARY: [number, number, number] = [107, 114, 128];
//   const TEXT: [number, number, number] = [31, 41, 55];
//   const LIGHT_BG: [number, number, number] = [249, 250, 251];

//   const { lines, subtotal, tax, invoiceTotal, gstEnabled } = _deriveTotals(
//     transaction,
//     company,
//     serviceNameById
//   );
//   const companyGSTIN = _getCompanyGSTIN(company);

//   // ✅ Same currency style as other templates
//   const money = (n: number) =>
//     `Rs ${new Intl.NumberFormat("en-IN", {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2,
//     }).format(Number(n || 0))}`;

//   // Build rows
//   const itemsForTable = (
//     lines.length
//       ? lines
//       : [
//           {
//             name: transaction.description || "Item",
//             description: "",
//             quantity: 1,
//             pricePerUnit: (transaction as any).amount ?? 0,
//             amount: (transaction as any).amount ?? 0,
//             gstPercentage: (transaction as any)?.gstPercentage ?? 0,
//             lineTax:
//               (Number((transaction as any).amount ?? 0) *
//                 Number((transaction as any)?.gstPercentage ?? 0)) /
//                 100 || 0,
//             lineTotal:
//               Number((transaction as any).amount ?? 0) +
//               ((Number((transaction as any).amount ?? 0) *
//                 Number((transaction as any)?.gstPercentage ?? 0)) /
//                 100 || 0),
//           },
//         ]
//   ).map((l: any, i: number) => ({
//     sno: (i + 1).toString(),
//     description: `${l.name}${l.description ? " — " + l.description : ""}`,
//     quantity: l.quantity || 1,
//     pricePerUnit: Number(l.pricePerUnit ?? l.amount ?? 0),
//     gstPercentage: Number(l.gstPercentage ?? 0),
//     lineTax: Number(l.lineTax ?? 0),
//     lineTotal: Number(l.lineTotal ?? l.amount ?? 0),
//   }));

//   // ---------- Layout constants ----------
//   const headerY = 20;
//   const billToY = headerY + 40;

//   const tableTopY = billToY + 40;
//   const tableW = pw - m * 2;

//   // Columns
//   const colSNo = m + 5;
//   const colItem = colSNo + 12;
//   const colQty = colSNo + 50;
//   const colPrice = pw - m - 80;
//   const colGST = pw - m - 60;
//   const colTax = pw - m - 30;
//   const colTotal = pw - m - 5;

//   // Row geometry (fixed height to guarantee 8 rows per page)
//   const ROW_H = 14;
//   const firstRowY = tableTopY + 15;

//   // Footer geometry
//   const footerH = 28; // thank you + contact + page #
//   const bottomSafeY = ph - (m + footerH);

//   // Pagination: exactly 8 rows per page
//   const ITEMS_PER_PAGE = 8;
//   const chunks: any[][] = [];
//   for (let i = 0; i < itemsForTable.length; i += ITEMS_PER_PAGE) {
//     chunks.push(itemsForTable.slice(i, i + ITEMS_PER_PAGE));
//   }
//   if (chunks.length === 0) chunks.push(itemsForTable);

//   // Will the last table leave space for totals?
//   const approxTotalsHeight = gstEnabled ? 34 : 24;
//   const lastChunkCount = chunks[chunks.length - 1].length;
//   const lastRowsBottom = firstRowY + ROW_H * lastChunkCount;
//   const needsExtraTotalsPage =
//     lastRowsBottom + approxTotalsHeight > bottomSafeY;
//   const totalPages = chunks.length + (needsExtraTotalsPage ? 1 : 0);

//   // ---------- painters ----------
//   const crisp = (yy: number) => Math.floor(yy) + 0.5;

//   const drawHeader = () => {
//     // Company (left)
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(16);
//     doc.setTextColor(...PRIMARY);
//     doc.text(company?.businessName || "Your Company", m, headerY);

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(9);
//     doc.setTextColor(...SECONDARY);
//     doc.text(company?.address || "Company Address", m, headerY + 7);
//     if (companyGSTIN) doc.text(`GSTIN: ${companyGSTIN}`, m, headerY + 14);

//     // Invoice (right)
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(...PRIMARY);
//     doc.setFontSize(20);
//     doc.text("INVOICE", pw - m, headerY, { align: "right" });

//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(...SECONDARY);
//     doc.setFontSize(10);
//     doc.text(`No. ${invNo(transaction)}`, pw - m, headerY + 8, {
//       align: "right",
//     });

//     const dateStr = transaction.date
//       ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
//       : "";
//     doc.setFontSize(9);
//     doc.text(`Date: ${dateStr}`, pw - m, headerY + 15, { align: "right" });

//     // Divider
//     doc.setDrawColor(229, 231, 235);
//     doc.setLineWidth(0.6);
//     doc.line(m, headerY + 25, pw - m, headerY + 25);

//     // Bill To (left)
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(...TEXT);
//     doc.setFontSize(11);
//     doc.text("BILL TO:", m, billToY);

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(12);
//     doc.text(party?.name || "Client Name", m, billToY + 8);

//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(...SECONDARY);
//     doc.setFontSize(10);
//     const addr =
//       party && (party.address || party.city || party.state)
//         ? [party.address, party.city, party.state].filter(Boolean).join(", ")
//         : "Address not available";
//     const addrLines = doc.splitTextToSize(addr, 120);
//     doc.text(addrLines, m, billToY + 16);
//   };

//   const drawTableHead = () => {
//     // Header band
//     doc.setFillColor(...LIGHT_BG);
//     doc.rect(m, tableTopY, tableW, 10, "F");

//     // Top/bottom crisp borders
//     doc.setDrawColor(206, 212, 222);
//     doc.setLineWidth(0.6);
//     doc.line(m, crisp(tableTopY), m + tableW, crisp(tableTopY));
//     doc.line(m, crisp(tableTopY + 10), m + tableW, crisp(tableTopY + 10));

//     // Labels
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(...TEXT);
//     doc.setFontSize(10);
//     doc.text("#", colSNo, tableTopY + 7);
//     doc.text("DESCRIPTION", colItem, tableTopY + 7);
//     doc.text("QTY", colQty, tableTopY + 7, { align: "right" });
//     doc.text("PRICE", colPrice, tableTopY + 7, { align: "right" });
//     doc.text("GST%", colGST, tableTopY + 7, { align: "right" });
//     doc.text("TAX", colTax, tableTopY + 7, { align: "right" });
//     doc.text("TOTAL", colTotal, tableTopY + 7, { align: "right" });
//   };

//   const drawRows = (rows: any[]) => {
//     let y = firstRowY;
//     const maxDescW = colQty - colItem - 4;

//     rows.forEach((it, i) => {
//       // Alternating row fill
//       if (i % 2 === 0) {
//         doc.setFillColor(...LIGHT_BG);
//         doc.rect(m, y - (ROW_H - 10), tableW, ROW_H, "F");
//       }

//       // Clamp description to single line for fixed row height
//       let desc = it.description || "";
//       while (doc.getTextWidth(desc) > maxDescW && desc.length > 0) {
//         desc = desc.slice(0, -1);
//       }
//       if (desc !== it.description) desc = desc.trimEnd() + "...";

//       doc.setFont("helvetica", "normal");
//       doc.setTextColor(...TEXT);
//       doc.setFontSize(9);

//       doc.text(it.sno, colSNo, y);
//       doc.text(desc, colItem, y);
//       doc.text(String(it.quantity), colQty, y, { align: "right" });
//       doc.text(money(it.pricePerUnit), colPrice, y, { align: "right" });
//       doc.text(`${it.gstPercentage}%`, colGST, y, { align: "right" });
//       doc.text(money(it.lineTax), colTax, y, { align: "right" });
//       doc.text(money(it.lineTotal), colTotal, y, { align: "right" });

//       // Row divider
//       doc.setDrawColor(220, 224, 230);
//       doc.setLineWidth(0.5);
//       doc.line(m, crisp(y + 3), pw - m, crisp(y + 3));

//       y += ROW_H;
//     });

//     return y; // bottom y after last row
//   };

//   const drawFooter = (pageNum: number, total: number) => {
//     const footerY = ph - m - 20;
//     // Render notes instead of hardcoded thank you
//     const notesEndY = renderNotes(
//       doc,
//       transaction.notes || "",
//       m,
//       footerY,
//       pw - 2 * m,
//       pw,
//       ph
//     );

//     const contact = [
//       company?.address || "",
//       company?.emailId || "",
//       company?.mobileNumber || "",
//     ]
//       .filter(Boolean)
//       .join(" • ");
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8);
//     doc.setTextColor(...SECONDARY);
//     doc.text(contact || "", m, notesEndY + 6);
//     doc.text(`Page ${pageNum} of ${total}`, pw - m, notesEndY + 6, {
//       align: "right",
//     });
//   };

//   // ---------- render pages ----------
//   chunks.forEach((rows, i) => {
//     if (i > 0) doc.addPage();
//     drawHeader();
//     drawTableHead();
//     drawRows(rows);
//     drawFooter(i + 1, totalPages);
//   });

//   // ---------- totals (last page or extra page) ----------
//   if (needsExtraTotalsPage) {
//     doc.addPage();
//     drawHeader();
//     drawFooter(totalPages, totalPages);
//     var totalsY = firstRowY; // fresh area on new page
//   } else {
//     var totalsY = lastRowsBottom + 10; // under the last table
//   }

//   // Totals block
//   doc.setFont("helvetica", "bold");
//   doc.setTextColor(...TEXT);
//   doc.setFontSize(10);

//   // Line above totals
//   doc.setDrawColor(209, 213, 219);
//   doc.setLineWidth(0.5);
//   doc.line(pw - m - 120, crisp(totalsY - 5), pw - m, crisp(totalsY - 5));

//   doc.text("Subtotal:", pw - m - 30, totalsY, { align: "right" });
//   doc.text(money(subtotal), pw - m - 5, totalsY, { align: "right" });

//   if (gstEnabled) {
//     doc.text("GST:", pw - m - 30, totalsY + 8, { align: "right" });
//     doc.text(money(tax), pw - m - 5, totalsY + 8, { align: "right" });
//   }

//   doc.setFontSize(12);
//   doc.setTextColor(...PRIMARY);
//   doc.text("Total:", pw - m - 38, totalsY + 20, { align: "right" });
//   doc.text(money(invoiceTotal), pw - m - 5, totalsY + 20, { align: "right" });

//   return doc;
// };

// export const generatePdfForTemplate5 = async (
//   transaction: Transaction,
//   company: Company | null | undefined,
//   party: Party | null | undefined,
//   serviceNameById?: Map<string, string>
// ): Promise<jsPDF> => {
//   // ------ local helpers (re-used or slightly modified) ------
//   const _getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
//     const x = c as any;
//     return (
//       x?.gstin ??
//       x?.gstIn ??
//       x?.gstNumber ??
//       x?.gst_no ??
//       x?.gst ??
//       x?.gstinNumber ??
//       x?.tax?.gstin ??
//       null
//     );
//   };

//   const _deriveTotals = (
//     tx: Transaction,
//     co?: Company | null,
//     svcNameById?: Map<string, string>
//   ) => {
//     const lines = getUnifiedLines(tx, svcNameById);
//     const subtotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.amount) || 0),
//       0
//     );
//     const totalTax = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTax) || 0),
//       0
//     );
//     const invoiceTotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTotal) || 0),
//       0
//     );
//     const gstEnabled = totalTax > 0 && !!_getCompanyGSTIN(co)?.trim();
//     return { lines, subtotal, tax: totalTax, invoiceTotal, gstEnabled };
//   };

//   const fetchAsDataURL = async (url: string) => {
//     try {
//       const res = await fetch(url, { mode: "cors" });
//       const blob = await res.blob();
//       return await new Promise<string>((resolve) => {
//         const r = new FileReader();
//         r.onload = () => resolve(r.result as string);
//         r.readAsDataURL(blob);
//       });
//     } catch {
//       return "";
//     }
//   };

//   // -------------------------------------------------------------------------

//   const doc = new jsPDF();
//   const pw = doc.internal.pageSize.getWidth();
//   const ph = doc.internal.pageSize.getHeight();
//   const m = 18; // Smaller Margin for more content area

//   // New Palette - Modern, Professional, and Clean
//   const PRIMARY_DARK: [number, number, number] = [38, 50, 56]; // Dark Slate Gray for main text and headers
//   const ACCENT_TEAL: [number, number, number] = [0, 150, 136]; // Vibrant Teal for accents
//   const LIGHT_TEXT: [number, number, number] = [100, 115, 120]; // Muted gray for secondary info
//   const BORDER_GRAY: [number, number, number] = [230, 230, 230]; // Light gray for subtle borders
//   const TABLE_HEADER_BG: [number, number, number] = [240, 245, 248]; // Very light blue-gray for table header background
//   const WHITE: [number, number, number] = [255, 255, 255];

//   const { lines, subtotal, tax, invoiceTotal, gstEnabled } = _deriveTotals(
//     transaction,
//     company,
//     serviceNameById
//   );
//   const companyGSTIN = _getCompanyGSTIN(company);

//   const money = (n: number) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;

//   // Data scaffold
//   const invoiceData = {
//     invoiceNumber: invNo(transaction),
//     date: transaction.date
//       ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
//       : "01 / 10 / 2024",
//     company: {
//       name: company?.businessName || "Your Company Name",
//       address: company?.address || "123 Business Lane, City, State - 123456",
//       email: company?.emailId || "contact@yourcompany.com",
//       phone: company?.mobileNumber || "+91 98765 43210",
//     },
//     invoiceTo: {
//       name: party?.name || "Client Name",
//       address:
//         party?.address && party?.city
//           ? `${party.address}, ${party.city}, ${party.state || ""}`.replace(
//               /,\s*$/,
//               ""
//             )
//           : "Client Address Not Available",
//       email: party?.email || "",
//       gstin: _getCompanyGSTIN(party) || "",
//     },
//   };

//   // Convert to table rows
//   const itemsForTable = lines.map((l: any, index: number) => ({
//     sno: (index + 1).toString(),
//     description: `${l.name}${l.description ? " — " + l.description : ""}`,
//     quantity: l.quantity || 1,
//     pricePerUnit: Number(l.pricePerUnit || l.amount || 0),
//     amount: Number(l.amount || 0),
//     gstPercentage: l.gstPercentage || 0,
//     lineTax: Number(l.lineTax || 0),
//     lineTotal: Number(l.lineTotal || l.amount || 0),
//   }));

//   if (itemsForTable.length === 0) {
//     const amount = Number((transaction as any).amount ?? 0);
//     const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
//     const lineTax = (amount * gstPct) / 100;
//     const lineTotal = amount + lineTax;
//     itemsForTable.push({
//       sno: "1",
//       description: transaction.description || "Service Rendered",
//       quantity: 1,
//       pricePerUnit: amount,
//       amount,
//       gstPercentage: gstPct,
//       lineTax,
//       lineTotal,
//     });
//   }

//   // Preload logo (using a slightly more professional placeholder)
//   const logoUrl =
//     "https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_font_awesome.svg"; // A generic icon
//   const logoDataURL = await fetchAsDataURL(logoUrl);

//   // Base font
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(...PRIMARY_DARK);

//   // ---------- Layout constants (used across pages) ----------
//   const headerBlockHeight = 40; // Height for the top section with logo/company name/invoice title
//   const infoBlockY = headerBlockHeight + 15; // Y for invoice/client details
//   const tableStartY = infoBlockY + 70; // Y where the item table starts
//   const ROW_H = 9; // Table row height
//   const ITEMS_PER_PAGE = 10; // Adjusted items per page for new ROW_H
//   const TABLE_HEADER_HEIGHT = 10; // Height of the table header row

//   const contentX = m;
//   const contentW = pw - 2 * m;

//   // Columns for the new table style (more relative positioning)
//   // Columns for the new table style (more relative positioning)
//   const colSNo = contentX + 2;
//   const colItem = colSNo + 20; // Start item description after S.No.
//   const colQty = colItem + 38; // Approx 65% across
//   const colRate = colQty + 20; // Approx 75% across
//   const colGST = colRate + 30; // Approx 85% across
//   const colTax = colRate + 60; // Approx 92% across
//   const colTotal = pw - m - 2;

//   const footerSectionH = 20;
//   const footerSectionY = ph - footerSectionH - m;

//   // ---------- painters ----------

//   const drawHeaderSection = () => {
//     // Left: Company Logo and Name
//     let currentX = m;
//     let currentY = m;

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(16);
//     doc.setTextColor(...PRIMARY_DARK);
//     doc.text(invoiceData.company.name.toUpperCase(), currentX, currentY + 7);

//     doc.setFontSize(9);
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(...LIGHT_TEXT);
//     const companyInfoY = currentY + 12;
//     doc.text(invoiceData.company.address, currentX, companyInfoY);
//     doc.text(invoiceData.company.email, currentX, companyInfoY + 4);

//     // Right: "INVOICE" Title
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(30);
//     doc.setTextColor(...ACCENT_TEAL);
//     doc.text("INVOICE", pw - m, m + 15, { align: "right" });

//     // Subtle line below header
//     doc.setDrawColor(...BORDER_GRAY);
//     doc.setLineWidth(0.7);
//     doc.line(m, headerBlockHeight + 5, pw - m, headerBlockHeight + 5);
//   };

//   const drawDetailBlocks = () => {
//     let currentY = infoBlockY;

//     // Left Block: Invoice Details
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(10);
//     doc.setTextColor(...PRIMARY_DARK);
//     doc.text("INVOICE DETAILS", m, currentY);

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(9);
//     doc.setTextColor(...LIGHT_TEXT);
//     doc.text(`Invoice No: ${invoiceData.invoiceNumber}`, m, currentY + 7);
//     doc.text(`Date: ${invoiceData.date}`, m, currentY + 12);

//     // Right Block: Bill To
//     const rightColX = pw - m;
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(10);
//     doc.setTextColor(...PRIMARY_DARK);
//     doc.text("BILL TO:", rightColX, currentY, { align: "right" });

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(9);
//     doc.setTextColor(...LIGHT_TEXT);
//     doc.text(invoiceData.invoiceTo.name, rightColX, currentY + 7, {
//       align: "right",
//     });
//     doc.text(invoiceData.invoiceTo.address, rightColX, currentY + 12, {
//       align: "right",
//     });
//     if (invoiceData.invoiceTo.email)
//       doc.text(invoiceData.invoiceTo.email, rightColX, currentY + 17, {
//         align: "right",
//       });
//     if (invoiceData.invoiceTo.gstin)
//       doc.text(
//         `GSTIN: ${invoiceData.invoiceTo.gstin}`,
//         rightColX,
//         currentY + 22,
//         {
//           align: "right",
//         }
//       );

//     // Horizontal divider for clarity
//     doc.setDrawColor(...BORDER_GRAY);
//     doc.setLineWidth(0.3);
//     doc.line(m, currentY + 40, pw - m, currentY + 40);
//   };

//   const drawTableHead = (): number => {
//     let y = tableStartY;

//     // Table Header with a subtle background and border
//     doc.setFillColor(...TABLE_HEADER_BG);
//     doc.rect(contentX, y, contentW, TABLE_HEADER_HEIGHT, "F");
//     doc.setDrawColor(...BORDER_GRAY);
//     doc.setLineWidth(0.5);
//     doc.rect(contentX, y, contentW, TABLE_HEADER_HEIGHT, "S");

//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(...PRIMARY_DARK);
//     doc.setFontSize(8);

//     const headerY = y + TABLE_HEADER_HEIGHT / 2 + 1.5;
//     doc.text("S.No.", colSNo, headerY);
//     doc.text("ITEM DESCRIPTION", colItem, headerY);
//     doc.text("QTY", colQty, headerY, { align: "right" });
//     doc.text("RATE", colRate, headerY, { align: "right" });
//     doc.text("GST%", colGST, headerY, { align: "right" });
//     doc.text("TAX", colTax, headerY, { align: "right" });
//     doc.text("TOTAL", colTotal, headerY, { align: "right" });

//     return y + TABLE_HEADER_HEIGHT; // Start drawing rows immediately after header
//   };

//   const drawRow = (it: any, y: number, isLast: boolean) => {
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(...PRIMARY_DARK);
//     doc.setFontSize(8);

//     doc.text(it.sno, colSNo, y + ROW_H / 2);

//     const maxDescWidth = colQty - colItem - 5;
//     let description = it.description;
//     const descLines = doc.splitTextToSize(description, maxDescWidth);
//     doc.text(descLines, colItem, y + ROW_H / 2 - (descLines.length - 1) * 2);

//     doc.text(String(it.quantity), colQty, y + ROW_H / 2, { align: "right" });
//     doc.text(money(it.pricePerUnit), colRate, y + ROW_H / 2, {
//       align: "right",
//     });
//     doc.text(`${it.gstPercentage}%`, colGST, y + ROW_H / 2, {
//       align: "right",
//     });
//     doc.text(money(it.lineTax), colTax, y + ROW_H / 2, { align: "right" });
//     doc.text(money(it.lineTotal), colTotal, y + ROW_H / 2, { align: "right" });

//     // Subtle line between rows
//     doc.setDrawColor(...BORDER_GRAY);
//     doc.setLineWidth(0.1);
//     doc.line(contentX, y + ROW_H, contentX + contentW, y + ROW_H);
//   };

//   const drawTotals = (startY: number) => {
//     let yTotals = startY + 10;
//     const totalsBoxWidth = 70; // Width of the totals box
//     const totalsBoxX = pw - m - totalsBoxWidth; // Aligned to the right margin

//     // Subtotal line
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);
//     doc.setTextColor(...PRIMARY_DARK);
//     doc.text("Subtotal:", totalsBoxX, yTotals, { align: "left" });
//     doc.setFont("helvetica", "bold");
//     doc.text(money(subtotal), pw - m, yTotals, { align: "right" });

//     if (gstEnabled) {
//       yTotals += 7;
//       // GST Total line
//       doc.setFont("helvetica", "normal");
//       doc.text("GST Total:", totalsBoxX, yTotals, { align: "left" });
//       doc.setFont("helvetica", "bold");
//       doc.text(money(tax), pw - m, yTotals, { align: "right" });
//     }

//     yTotals += 10;
//     // Grand Total Line - Prominent with accent color background
//     doc.setFillColor(...ACCENT_TEAL);
//     doc.rect(
//       totalsBoxX - 2,
//       yTotals - 6,
//       totalsBoxWidth + 4 + (pw - m - totalsBoxX),
//       10,
//       "F"
//     ); // Background for total
//     doc.setDrawColor(...ACCENT_TEAL); // Border same as fill
//     doc.setLineWidth(0.5);
//     doc.rect(
//       totalsBoxX - 2,
//       yTotals - 6,
//       totalsBoxWidth + 4 + (pw - m - totalsBoxX),
//       10,
//       "S"
//     );

//     doc.setFontSize(12);
//     doc.setTextColor(...WHITE); // White text on teal background
//     doc.setFont("helvetica", "bold");
//     doc.text("GRAND TOTAL", totalsBoxX + 2, yTotals + 1, { align: "left" });
//     doc.text(money(invoiceTotal), pw - m - 2, yTotals + 1, { align: "right" });
//   };

//   const drawFooterSection = () => {
//     // Top border for footer
//     doc.setDrawColor(...BORDER_GRAY);
//     doc.setLineWidth(0.5);
//     doc.line(m, footerSectionY, pw - m, footerSectionY);

//     // Render notes instead of hardcoded thank you
//     const notesEndY = renderNotes(
//       doc,
//       transaction.notes || "",
//       m,
//       footerSectionY + 7,
//       pw - 2 * m,
//       pw,
//       ph
//     );

//     // Company contact details in footer
//     const contact = [
//       invoiceData.company.address || "",
//       invoiceData.company.email || "",
//       invoiceData.company.phone || "",
//     ]
//       .filter(Boolean)
//       .join(" • ");
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8);
//     doc.setTextColor(...LIGHT_TEXT);
//     doc.text(contact || "", m, notesEndY + 6);
//     const pageCount = doc.getNumberOfPages();
//     doc.text(`Page ${pageCount} of ${pageCount}`, pw - m, notesEndY + 6, {
//       align: "right",
//     });

//     // // Page number
//     // for (let i = 1; i <= pageCount; i++) {
//     //   doc.setPage(i);
//     //   doc.setFont("helvetica", "italic");
//     //   doc.setFontSize(7);
//     //   doc.setTextColor(...LIGHT_TEXT);
//     //   doc.text(`Page ${i} of ${pageCount}`, pw / 1, ph - m + 5, {
//     //     align: "center",
//     //   });
//     // }
//     doc.setPage(pageCount); // Reset to the last page
//   };

//   // ---------- paginate rows ----------
//   const chunks: any[][] = [];
//   for (let i = 0; i < itemsForTable.length; i += ITEMS_PER_PAGE) {
//     chunks.push(itemsForTable.slice(i, i + ITEMS_PER_PAGE));
//   }
//   if (chunks.length === 0) chunks.push([]); // Ensure at least one page

//   let lastRowY = tableStartY;

//   chunks.forEach((rows, pageIndex) => {
//     if (pageIndex > 0) doc.addPage();

//     drawHeaderSection();
//     drawDetailBlocks();
//     let y = drawTableHead();

//     rows.forEach((it, idx) => {
//       drawRow(it, y, idx === rows.length - 1);
//       y += ROW_H;
//     });

//     lastRowY = y;

//     // Draw footer content on every page
//     drawFooterSection();
//   });

//   // ---------- Totals (only once, at the end) ----------
//   const totalsBlockHeight = gstEnabled ? 35 : 28; // Adjusted height for new total style
//   const bottomSafeY = ph - footerSectionH - m - totalsBlockHeight - 5; // Extra padding

//   // Check if there's enough space for totals on the current page
//   if (lastRowY + totalsBlockHeight + 10 <= bottomSafeY) {
//     // Added 10 for spacing before totals
//     drawTotals(lastRowY);
//   } else {
//     // Not enough space, add a new page
//     doc.addPage();
//     drawHeaderSection();
//     drawDetailBlocks();
//     // Reset lastRowY if content starts from top of new page, or just place totals
//     // For totals, we can place them relative to the bottom of the page
//     const totalsStartOnNewPageY = Math.max(
//       tableStartY,
//       ph - footerSectionH - m - totalsBlockHeight - 5
//     );
//     drawTotals(totalsStartOnNewPageY - 10); // Subtract 10 to move it up slightly
//   }

//   return doc;
// };

// export const generatePdfForTemplate6 = async (
//   transaction: Transaction,
//   company: Company | null | undefined,
//   party: Party | null | undefined,
//   serviceNameById?: Map<string, string>
// ): Promise<jsPDF> => {
//   // ------ local helpers ------
//   const _getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
//     const x = c as any;
//     return (
//       x?.gstin ??
//       x?.gstIn ??
//       x?.gstNumber ??
//       x?.gst_no ??
//       x?.gst ??
//       x?.gstinNumber ??
//       x?.tax?.gstin ??
//       null
//     );
//   };

//   const _deriveTotals = (
//     tx: Transaction,
//     co?: Company | null,
//     svcNameById?: Map<string, string>
//   ) => {
//     const lines = getUnifiedLines(tx, svcNameById);
//     const subtotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.amount) || 0),
//       0
//     );
//     const totalTax = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTax) || 0),
//       0
//     );
//     const invoiceTotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTotal) || 0),
//       0
//     );
//     const gstEnabled = totalTax > 0 && !!_getCompanyGSTIN(co)?.trim();
//     return { lines, subtotal, tax: totalTax, invoiceTotal, gstEnabled };
//   };

//   const fetchAsDataURL = async (url: string) => {
//     try {
//       const res = await fetch(url, { mode: "cors" });
//       const blob = await res.blob();
//       return await new Promise<string>((resolve) => {
//         const r = new FileReader();
//         r.onload = () => resolve(r.result as string);
//         r.readAsDataURL(blob);
//       });
//     } catch {
//       return "";
//     }
//   };

//   // -------------------------------------------------------------------------

//   const doc = new jsPDF();
//   const pw = doc.internal.pageSize.getWidth();
//   const ph = doc.internal.pageSize.getHeight();
//   const m = 20; // Margin

//   // New Palette - Earthy, modern, and subtle
//   const DARK_TEXT: [number, number, number] = [50, 50, 50]; // Near black for main text
//   const ACCENT_GOLD: [number, number, number] = [184, 151, 93]; // A refined gold/tan
//   const LIGHT_GRAY_BG: [number, number, number] = [248, 248, 248]; // For subtle backgrounds
//   const DIVIDER_LINE: [number, number, number] = [220, 220, 220]; // Light gray for dividers
//   const MUTED_INFO: [number, number, number] = [120, 120, 120]; // Muted color for secondary info
//   const WHITE: [number, number, number] = [255, 255, 255];

//   const { lines, subtotal, tax, invoiceTotal, gstEnabled } = _deriveTotals(
//     transaction,
//     company,
//     serviceNameById
//   );
//   const companyGSTIN = _getCompanyGSTIN(company);

//   const money = (n: number) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;

//   // Data scaffold
//   const invoiceData = {
//     invoiceNumber: invNo(transaction),
//     date: transaction.date
//       ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
//       : "01 / 10 / 2024",
//     company: {
//       name: company?.businessName || "Your Company Name",
//       address: company?.address || "123 Business Lane, City, State - 123456",
//       email: company?.emailId || "contact@yourcompany.com",
//       phone: company?.mobileNumber || "+91 98765 43210",
//     },
//     invoiceTo: {
//       name: party?.name || "Client Name",
//       address:
//         party?.address && party?.city
//           ? `${party.address}, ${party.city}, ${party.state || ""}`.replace(
//               /,\s*$/,
//               ""
//             )
//           : "Client Address Not Available",
//       email: party?.email || "",
//       gstin: _getCompanyGSTIN(party) || "",
//     },
//   };

//   // Convert to table rows
//   const itemsForTable = lines.map((l: any, index: number) => ({
//     sno: (index + 1).toString(),
//     description: `${l.name}${l.description ? " — " + l.description : ""}`,
//     quantity: l.quantity || 1,
//     pricePerUnit: Number(l.pricePerUnit || l.amount || 0),
//     amount: Number(l.amount || 0),
//     gstPercentage: l.gstPercentage || 0,
//     lineTax: Number(l.lineTax || 0),
//     lineTotal: Number(l.lineTotal || l.amount || 0),
//   }));

//   if (itemsForTable.length === 0) {
//     const amount = Number((transaction as any).amount ?? 0);
//     const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
//     const lineTax = (amount * gstPct) / 100;
//     const lineTotal = amount + lineTax;
//     itemsForTable.push({
//       sno: "1",
//       description: transaction.description || "Service Rendered",
//       quantity: 1,
//       pricePerUnit: amount,
//       amount,
//       gstPercentage: gstPct,
//       lineTax,
//       lineTotal,
//     });
//   }

//   // Preload logo once (using a different, more abstract icon example)
//   const logoUrl =
//     "https://template.canva.com/EAE1YAgPM_U/1/0/400w-R-Meu_EcnME.jpg"; // Abstract placeholder
//   const logoDataURL = await fetchAsDataURL(logoUrl);

//   // Base font
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(...DARK_TEXT);

//   // ---------- Layout constants (used across pages) ----------
//   const headerSectionH = 35; // Height for the top area with company name and "INVOICE"
//   const detailBlockY = headerSectionH + 20; // Y position for invoice/client info
//   const tableStartY = detailBlockY + 60; // Y position where the item table starts
//   const ROW_H = 10; // Table row height
//   const ITEMS_PER_PAGE = 10; // Items per page
//   const TABLE_HEADER_HEIGHT = 8; // Height of the table header row

//   const tableX = m;
//   const tableW = pw - 2 * m;

//   // Columns for the new table style
//   const colSNo = m + 2;
//   const colItem = colSNo + 12;
//   const colQty = colItem + 65;
//   const colRate = colQty + 20;
//   const colGST = colRate + 25;
//   const colTax = colGST + 20;
//   const colTotal = pw - m - 2;

//   const footerSectionH = 25;
//   const footerSectionY = ph - footerSectionH - m;

//   // ---------- painters ----------

//   const drawHeaderSection = () => {
//     // Top company name and "INVOICE"
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(18);
//     doc.setTextColor(...ACCENT_GOLD);
//     doc.text(invoiceData.company.name.toUpperCase(), m, m + 0, {
//       align: "left",
//     });

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);
//     doc.setTextColor(...MUTED_INFO);

//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(24);
//     doc.setTextColor(...DARK_TEXT);
//     doc.text("INVOICE", pw - m, m + 0, { align: "right" });

//     // Hairline divider under header
//     doc.setDrawColor(...DIVIDER_LINE);
//     doc.setLineWidth(0.5);
//     doc.line(m, headerSectionH + 5, pw - m, headerSectionH + 5);
//   };

//   const drawDetailBlocks = () => {
//     // Company contact info (Left)
//     doc.setTextColor(...MUTED_INFO);
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8);
//     doc.text(invoiceData.company.address, m, detailBlockY);
//     doc.text(`Email: ${invoiceData.company.email}`, m, detailBlockY + 4);
//     doc.text(`Phone: ${invoiceData.company.phone}`, m, detailBlockY + 8);
//     if (companyGSTIN) {
//       doc.text(`GSTIN: ${companyGSTIN}`, m, detailBlockY + 12);
//     }

//     // Invoice details (Right)
//     const rightColX = pw - m;
//     doc.setTextColor(...DARK_TEXT);
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(9);
//     doc.text(`Invoice No:`, rightColX - 25, detailBlockY, { align: "right" });
//     doc.text(`Date:`, rightColX - 25, detailBlockY + 5, { align: "right" });

//     doc.setFont("helvetica", "normal");
//     doc.text(invoiceData.invoiceNumber, rightColX, detailBlockY, {
//       align: "right",
//     });
//     doc.text(invoiceData.date, rightColX, detailBlockY + 5, {
//       align: "right",
//     });

//     // Bill To (Below invoice details, aligned right)
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(10);
//     doc.text("BILL TO:", rightColX, detailBlockY + 15, { align: "right" });

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(9);
//     doc.setTextColor(...DARK_TEXT);
//     doc.text(invoiceData.invoiceTo.name, rightColX, detailBlockY + 20, {
//       align: "right",
//     });
//     doc.setTextColor(...MUTED_INFO);
//     doc.text(invoiceData.invoiceTo.address, rightColX, detailBlockY + 24, {
//       align: "right",
//     });
//     if (invoiceData.invoiceTo.email)
//       doc.text(invoiceData.invoiceTo.email, rightColX, detailBlockY + 28, {
//         align: "right",
//       });
//     if (invoiceData.invoiceTo.gstin)
//       doc.text(
//         `GSTIN: ${invoiceData.invoiceTo.gstin}`,
//         rightColX,
//         detailBlockY + 32,
//         {
//           align: "right",
//         }
//       );
//   };

//   const drawTableHead = (y: number): number => {
//     // Table Header with a subtle bottom border
//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(...DARK_TEXT);
//     doc.setFontSize(8);

//     doc.text("S.No.", colSNo, y + TABLE_HEADER_HEIGHT / 2 + 1);
//     doc.text("ITEM DESCRIPTION", colItem, y + TABLE_HEADER_HEIGHT / 2 + 1);
//     doc.text("QTY", colQty, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });
//     doc.text("RATE", colRate, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });
//     doc.text("GST%", colGST, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });
//     doc.text("TAX", colTax, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });
//     doc.text("TOTAL", colTotal, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });

//     doc.setDrawColor(...DIVIDER_LINE);
//     doc.setLineWidth(0.2);
//     doc.line(
//       tableX,
//       y + TABLE_HEADER_HEIGHT,
//       tableX + tableW,
//       y + TABLE_HEADER_HEIGHT
//     );

//     return y + TABLE_HEADER_HEIGHT + 2; // Small gap after header
//   };

//   const drawRow = (it: any, y: number, isLast: boolean) => {
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(...DARK_TEXT);
//     doc.setFontSize(8);

//     doc.text(it.sno, colSNo, y + ROW_H / 2);

//     const maxDescWidth = colQty - colItem - 5;
//     let description = it.description;
//     const descLines = doc.splitTextToSize(description, maxDescWidth);
//     doc.text(descLines, colItem, y + ROW_H / 2 - (descLines.length - 1) * 2);

//     doc.text(String(it.quantity), colQty, y + ROW_H / 2, { align: "right" });
//     doc.text(money(it.pricePerUnit), colRate, y + ROW_H / 2, {
//       align: "right",
//     });
//     doc.text(`${it.gstPercentage}%`, colGST, y + ROW_H / 2, {
//       align: "right",
//     });
//     doc.text(money(it.lineTax), colTax, y + ROW_H / 2, { align: "right" });
//     doc.text(money(it.lineTotal), colTotal, y + ROW_H / 2, { align: "right" });

//     if (!isLast) {
//       doc.setDrawColor(...LIGHT_GRAY_BG); // Very light divider for rows
//       doc.setLineWidth(0.1);
//       doc.line(tableX, y + ROW_H, tableX + tableW, y + ROW_H);
//     }
//   };

//   const drawTotals = (y: number) => {
//     doc.setTextColor(...DARK_TEXT);
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(10);

//     // Subtotal line
//     doc.text("SUBTOTAL", pw - m - 40, y, { align: "right" });
//     doc.setFont("helvetica", "bold");
//     doc.text(money(subtotal), pw - m, y, { align: "right" });

//     if (gstEnabled) {
//       y += 8;
//       // GST Total line
//       doc.setFont("helvetica", "normal");
//       doc.text("GST TOTAL", pw - m - 40, y, { align: "right" });
//       doc.setFont("helvetica", "bold");
//       doc.text(money(tax), pw - m, y, { align: "right" });
//     }

//     y += 12;
//     // Grand Total Line - Prominent with a subtle background
//     doc.setFillColor(...LIGHT_GRAY_BG);
//     doc.rect(pw - m - 60, y - 7, 60, 10, "F"); // Light background for total
//     doc.setDrawColor(...ACCENT_GOLD);
//     doc.setLineWidth(0.5);
//     doc.rect(pw - m - 60, y - 7, 60, 10, "S"); // Gold border around total

//     doc.setFontSize(12);
//     doc.setTextColor(...ACCENT_GOLD); // Gold for the final total
//     doc.setFont("helvetica", "bold");
//     doc.text("GRAND TOTAL", pw - m - 65, y, { align: "right" });
//     doc.text(money(invoiceTotal), pw - m - 2, y, { align: "right" });

//     return y + 15; // Return the Y position after drawing totals
//   };

//   const drawFooterSection = () => {
//     // Simple line at the bottom
//     doc.setDrawColor(...DIVIDER_LINE);
//     doc.setLineWidth(0.5);
//     doc.line(m, footerSectionY, pw - m, footerSectionY);

//     // Render notes if present
//     const notesEndY = renderNotes(
//       doc,
//       transaction.notes || "",
//       m,
//       footerSectionY + 8,
//       pw - 2 * m,
//       pw,
//       ph
//     );

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8);
//     doc.setTextColor(...MUTED_INFO);

//     doc.text(invoiceData.company.address, m, notesEndY + 4);
//     doc.text(
//       `${invoiceData.company.email} | ${invoiceData.company.phone}`,
//       m,
//       notesEndY + 8
//     );
//     const pageCount = doc.getNumberOfPages();
//     // Page number (if multiple pages)
//     doc.text(`Page ${pageCount} of ${pageCount}`, pw - m, notesEndY + 6, {
//       align: "right",
//     });
//   };

//   // ---------- paginate rows ----------
//   const chunks: any[][] = [];
//   for (let i = 0; i < itemsForTable.length; i += ITEMS_PER_PAGE) {
//     chunks.push(itemsForTable.slice(i, i + ITEMS_PER_PAGE));
//   }
//   if (chunks.length === 0) chunks.push([]); // Ensure at least one page

//   let lastRowY = tableStartY;

//   // Render all pages with items
//   chunks.forEach((rows, pageIndex) => {
//     if (pageIndex > 0) doc.addPage();

//     drawHeaderSection();
//     drawDetailBlocks();

//     let y = drawTableHead(tableStartY);

//     rows.forEach((it, idx) => {
//       drawRow(it, y, idx === rows.length - 1);
//       y += ROW_H;
//     });

//     lastRowY = y;

//     // Draw footer content on every page
//     drawFooterSection();
//   });

//   // ---------- Totals (only once, at the end) ----------
//   const totalsBlockHeight = gstEnabled ? 40 : 30;
//   const bottomSafeY = ph - footerSectionH - m - totalsBlockHeight - 10;

//   // Check if there's enough space on the current page for totals
//   if (lastRowY + totalsBlockHeight <= bottomSafeY) {
//     // Enough space on the current page
//     drawTotals(lastRowY + 10);
//   } else {
//     // Not enough space, need to add a new page
//     doc.addPage();
//     drawHeaderSection();
//     drawDetailBlocks();
//     drawTotals(tableStartY + 10);
//     drawFooterSection();
//   }

//   return doc;
// };

// export const generatePdfForTemplate7 = async (
//   transaction: Transaction,
//   company: Company | null | undefined,
//   party: Party | null | undefined,
//   serviceNameById?: Map<string, string>
// ): Promise<jsPDF> => {
//   // ------ local helpers ------
//   const _getCompanyGSTIN = (c?: Partial<Company> | null): string | null => {
//     const x = c as any;
//     return (
//       x?.gstin ??
//       x?.gstIn ??
//       x?.gstNumber ??
//       x?.gst_no ??
//       x?.gst ??
//       x?.gstinNumber ??
//       x?.tax?.gstin ??
//       null
//     );
//   };

//   const _deriveTotals = (
//     tx: Transaction,
//     co?: Company | null,
//     svcNameById?: Map<string, string>
//   ) => {
//     const lines = getUnifiedLines(tx, svcNameById);
//     const subtotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.amount) || 0),
//       0
//     );
//     const totalTax = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTax) || 0),
//       0
//     );
//     const invoiceTotal = lines.reduce(
//       (s: number, it: any) => s + (Number(it.lineTotal) || 0),
//       0
//     );
//     const gstEnabled = totalTax > 0 && !!_getCompanyGSTIN(co)?.trim();
//     return { lines, subtotal, tax: totalTax, invoiceTotal, gstEnabled };
//   };

//   const fetchAsDataURL = async (url: string) => {
//     try {
//       const res = await fetch(url, { mode: "cors" });
//       const blob = await res.blob();
//       return await new Promise<string>((resolve) => {
//         const r = new FileReader();
//         r.onload = () => resolve(r.result as string);
//         r.readAsDataURL(blob);
//       });
//     } catch {
//       return "";
//     }
//   };

//   // -------------------------------------------------------------------------

//   const doc = new jsPDF();
//   const pw = doc.internal.pageSize.getWidth();
//   const ph = doc.internal.pageSize.getHeight();
//   const m = 20; // Margin

//   // New Palette - Professional, cool-toned, and clean
//   const PRIMARY_BLUE: [number, number, number] = [38, 70, 83]; // Dark Teal/Blue - primary accent
//   const SECONDARY_GRAY: [number, number, number] = [108, 117, 125]; // Muted dark gray for secondary info
//   const TEXT_COLOR: [number, number, number] = [52, 58, 64]; // Near black for main text
//   const LIGHT_BORDER: [number, number, number] = [206, 212, 218]; // Light gray for borders/dividers
//   const BG_LIGHT: [number, number, number] = [248, 249, 250]; // Very light background for sections
//   const WHITE: [number, number, number] = [255, 255, 255];

//   const { lines, subtotal, tax, invoiceTotal, gstEnabled } = _deriveTotals(
//     transaction,
//     company,
//     serviceNameById
//   );
//   const companyGSTIN = _getCompanyGSTIN(company);

//   const money = (n: number) => `Rs ${Number(n || 0).toLocaleString("en-IN")}`;

//   // Data scaffold
//   const invoiceData = {
//     invoiceNumber: invNo(transaction),
//     date: transaction.date
//       ? new Intl.DateTimeFormat("en-GB").format(new Date(transaction.date))
//       : "01 / 10 / 2024",
//     company: {
//       name: company?.businessName || "Your Company Name",
//       address: company?.address || "123 Business Lane, City, State - 123456",
//       email: company?.emailId || "contact@yourcompany.com",
//       phone: company?.mobileNumber || "+91 98765 43210",
//     },
//     invoiceTo: {
//       name: party?.name || "Client Name",
//       address:
//         party?.address && party?.city
//           ? `${party.address}, ${party.city}, ${party.state || ""}`.replace(
//               /,\s*$/,
//               ""
//             )
//           : "Client Address Not Available",
//       email: party?.email || "",
//       gstin: _getCompanyGSTIN(party) || "",
//     },
//   };

//   // Convert to table rows
//   const itemsForTable = lines.map((l: any, index: number) => ({
//     sno: (index + 1).toString(),
//     description: `${l.name}${l.description ? " — " + l.description : ""}`,
//     quantity: l.quantity || 1,
//     pricePerUnit: Number(l.pricePerUnit || l.amount || 0),
//     amount: Number(l.amount || 0),
//     gstPercentage: l.gstPercentage || 0,
//     lineTax: Number(l.lineTax || 0),
//     lineTotal: Number(l.lineTotal || l.amount || 0),
//   }));

//   if (itemsForTable.length === 0) {
//     const amount = Number((transaction as any).amount ?? 0);
//     const gstPct = Number((transaction as any)?.gstPercentage ?? 0);
//     const lineTax = (amount * gstPct) / 100;
//     const lineTotal = amount + lineTax;
//     itemsForTable.push({
//       sno: "1",
//       description: transaction.description || "Service Rendered",
//       quantity: 1,
//       pricePerUnit: amount,
//       amount,
//       gstPercentage: gstPct,
//       lineTax,
//       lineTotal,
//     });
//   }

//   // Preload logo (using a more modern, abstract icon example)
//   const logoUrl =
//     "https://template.canva.com/EAE1YAgPM_U/1/0/400w-R-Meu_EcnME.jpg"; // Modern abstract placeholder
//   const logoDataURL = await fetchAsDataURL(logoUrl);

//   // Base font
//   doc.setFont("helvetica", "normal");
//   doc.setTextColor(...TEXT_COLOR);

//   // ---------- Layout constants (used across pages) ----------
//   const headerBlockH = 35; // Height for the top area with company name and "INVOICE"
//   const infoBlockY = headerBlockH + 20; // Y position for invoice/client info
//   const tableStartY = infoBlockY + 60; // Y position where the item table starts
//   const ROW_H = 10; // Table row height
//   const ITEMS_PER_PAGE = 10; // Items per page
//   const TABLE_HEADER_HEIGHT = 10; // Height of the table header row

//   const tableX = m;
//   const tableW = pw - 2 * m;

//   // Columns for the new table style
//   const colSNo = m + 2;
//   const colItem = colSNo + 12;
//   const colQty = colItem + 65;
//   const colRate = colQty + 20;
//   const colGST = colRate + 25;
//   const colTax = colGST + 20;
//   const colTotal = pw - m - 2;

//   const footerSectionH = 30;
//   const footerSectionY = ph - footerSectionH - m;

//   // ---------- painters ----------

//   const drawHeaderSection = () => {
//     // Background for header
//     doc.setFillColor(...BG_LIGHT);
//     doc.rect(0, 0, pw, headerBlockH + 10, "F"); // Light background across the top

//     const logoUrl =
//       "https://template.canva.com/EAE1YAgPM_U/1/0/400w-R-Meu_EcnME.jpg"; // Replace with your logo URL

//     // // Add the logo image to the PDF (adjust x, y, width, height as needed)
//     // doc.addImage(logoUrl, "JPEG", m, m + 5, 30, 20); // x, y, width, height

//     // Company Name
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(16);
//     doc.setTextColor(...PRIMARY_BLUE);
//     doc.text(invoiceData.company.name.toUpperCase(), m + 0, m + 10);

//     // "INVOICE" title
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(28);
//     doc.setTextColor(...TEXT_COLOR);
//     doc.text("INVOICE", pw - m, m + 12, { align: "right" });

//     // Subtle line below header
//     doc.setDrawColor(...LIGHT_BORDER);
//     doc.setLineWidth(0.8);
//     doc.line(m, headerBlockH + 10, pw - m, headerBlockH + 10);
//   };

//   const drawInfoBlocks = () => {
//     // Company contact info (Left - more structured)
//     doc.setTextColor(...SECONDARY_GRAY);
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8);

//     let currentY = infoBlockY;
//     doc.text(invoiceData.company.address, m, currentY);
//     currentY += 4;
//     doc.text(`Email: ${invoiceData.company.email}`, m, currentY);
//     currentY += 4;
//     doc.text(`Phone: ${invoiceData.company.phone}`, m, currentY);
//     currentY += 4;
//     if (companyGSTIN) {
//       doc.text(`GSTIN: ${companyGSTIN}`, m, currentY);
//     }

//     // Invoice details & Bill To (Right - in a structured block)
//     const infoBlockWidth = 70;
//     const infoBlockX = pw - m - infoBlockWidth;
//     let rightY = infoBlockY;

//     // Invoice Details
//     doc.setFillColor(...BG_LIGHT);
//     doc.rect(infoBlockX, rightY - 5, infoBlockWidth, 18, "F"); // Background for invoice details
//     doc.setDrawColor(...LIGHT_BORDER);
//     doc.setLineWidth(0.2);
//     doc.rect(infoBlockX, rightY - 5, infoBlockWidth, 18, "S"); // Border

//     doc.setTextColor(...PRIMARY_BLUE);
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(9);
//     doc.text("INVOICE NO:", infoBlockX + 2, rightY);
//     doc.text("DATE:", infoBlockX + 2, rightY + 5);

//     doc.setTextColor(...TEXT_COLOR);
//     doc.setFont("helvetica", "normal");
//     doc.text(
//       invoiceData.invoiceNumber,
//       infoBlockX + infoBlockWidth - 2,
//       rightY,
//       {
//         align: "right",
//       }
//     );
//     doc.text(invoiceData.date, infoBlockX + infoBlockWidth - 2, rightY + 5, {
//       align: "right",
//     });

//     // Bill To
//     rightY += 25; // Space between blocks
//     doc.setTextColor(...PRIMARY_BLUE);
//     doc.setFont("helvetica", "bold");
//     doc.setFontSize(10);
//     doc.text("BILL TO:", infoBlockX, rightY);

//     doc.setTextColor(...TEXT_COLOR);
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(9);
//     doc.text(invoiceData.invoiceTo.name, infoBlockX, rightY + 5);
//     doc.setTextColor(...SECONDARY_GRAY);
//     const maxAddressWidth = infoBlockWidth - 2; // Leave some padding
//     const addressLines = doc.splitTextToSize(
//       invoiceData.invoiceTo.address,
//       maxAddressWidth +10
//     );
//     doc.text(addressLines, infoBlockX, rightY + 9);
//     let addressYOffset = 4 + (addressLines.length - 1) * 5;

//    if (invoiceData.invoiceTo.email)
//   doc.text(invoiceData.invoiceTo.email, infoBlockX, rightY + 9 + addressYOffset);
// if (invoiceData.invoiceTo.gstin)
//   doc.text(
//     `GSTIN: ${invoiceData.invoiceTo.gstin}`,
//     infoBlockX,
//     rightY + 9 + addressYOffset + (invoiceData.invoiceTo.email ? 4 : 0)
//   );
//   };

//   const drawTableHead = (): number => {
//     let y = tableStartY;

//     // Table Header with a fill and bottom border
//     doc.setFillColor(...PRIMARY_BLUE);
//     doc.rect(tableX, y, tableW, TABLE_HEADER_HEIGHT, "F");

//     doc.setFont("helvetica", "bold");
//     doc.setTextColor(...WHITE);
//     doc.setFontSize(8);

//     doc.text("S.No.", colSNo, y + TABLE_HEADER_HEIGHT / 2 + 1);
//     doc.text("ITEM DESCRIPTION", colItem, y + TABLE_HEADER_HEIGHT / 2 + 1);
//     doc.text("QTY", colQty, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });
//     doc.text("RATE", colRate, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });
//     doc.text("GST%", colGST, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });
//     doc.text("TAX", colTax, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });
//     doc.text("TOTAL", colTotal, y + TABLE_HEADER_HEIGHT / 2 + 1, {
//       align: "right",
//     });

//     doc.setDrawColor(...LIGHT_BORDER);
//     doc.setLineWidth(0.2);
//     doc.line(
//       tableX,
//       y + TABLE_HEADER_HEIGHT,
//       tableX + tableW,
//       y + TABLE_HEADER_HEIGHT
//     );

//     return y + TABLE_HEADER_HEIGHT; // No extra gap for the clean look
//   };

//   const drawRow = (it: any, y: number, isLast: boolean) => {
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(...TEXT_COLOR);
//     doc.setFontSize(8);

//     // Alternating row background for readability
//     if (parseInt(it.sno) % 2 === 0) {
//       doc.setFillColor(...BG_LIGHT);
//       doc.rect(tableX, y, tableW, ROW_H, "F");
//     }

//     doc.text(it.sno, colSNo, y + ROW_H / 2 + 1);

//     const maxDescWidth = colQty - colItem - 5;
//     let description = it.description;
//     const descLines = doc.splitTextToSize(description, maxDescWidth);
//     doc.text(
//       descLines,
//       colItem,
//       y + ROW_H / 2 + 1 - (descLines.length - 1) * 2
//     );

//     doc.text(String(it.quantity), colQty, y + ROW_H / 2 + 1, {
//       align: "right",
//     });
//     doc.text(money(it.pricePerUnit), colRate, y + ROW_H / 2 + 1, {
//       align: "right",
//     });
//     doc.text(`${it.gstPercentage}%`, colGST, y + ROW_H / 2 + 1, {
//       align: "right",
//     });
//     doc.text(money(it.lineTax), colTax, y + ROW_H / 2 + 1, { align: "right" });
//     doc.text(money(it.lineTotal), colTotal, y + ROW_H / 2 + 1, {
//       align: "right",
//     });

//     // Draw bottom border for the row
//     doc.setDrawColor(...LIGHT_BORDER);
//     doc.setLineWidth(0.1);
//     doc.line(tableX, y + ROW_H, tableX + tableW, y + ROW_H);
//   };

//   const drawTotals = (currentY: number) => {
//     const totalsBlockWidth = 70;
//     const totalsBlockX = pw - m - totalsBlockWidth;
//     let yTotals = currentY + 10;

//     // Subtotal
//     doc.setFont("helvetica", "normal");
//     doc.setTextColor(...TEXT_COLOR);
//     doc.setFontSize(9);
//     doc.text("SUBTOTAL", totalsBlockX, yTotals);
//     doc.setFont("helvetica", "bold");
//     doc.text(money(subtotal), totalsBlockX + totalsBlockWidth, yTotals, {
//       align: "right"
//     });

//     if (gstEnabled) {
//       yTotals += 6;
//       // GST Total
//       doc.setFont("helvetica", "normal");
//       doc.text("GST TOTAL", totalsBlockX, yTotals);
//       doc.setFont("helvetica", "bold");
//       doc.text(money(tax), totalsBlockX + totalsBlockWidth, yTotals, {
//         align: "right",
//       });
//     }

//     yTotals += 10; // Space before grand total

//     // Grand Total - Highlighted
//     doc.setFillColor(...PRIMARY_BLUE);
//     doc.rect(totalsBlockX - 5, yTotals - 7, totalsBlockWidth + 5, 10, "F");

//     doc.setFontSize(12);
//     doc.setTextColor(...WHITE);
//     doc.setFont("helvetica", "bold");
//     doc.text("GRAND TOTAL", totalsBlockX - 2, yTotals);
//     doc.text(
//       money(invoiceTotal),
//       totalsBlockX + totalsBlockWidth-2 ,
//       yTotals,
//       {
//         align: "right",
//       }
//     );
//   };

//   const drawFooterSection = () => {
//     // Solid line at the bottom
//     doc.setDrawColor(...PRIMARY_BLUE);
//     doc.setLineWidth(1);
//     doc.line(m, footerSectionY, pw - m, footerSectionY);

//     // Render notes if present
//     const notesEndY = renderNotes(
//       doc,
//       transaction.notes || "",
//       m,
//       footerSectionY + 8,
//       pw - 2 * m,
//       pw,
//       ph
//     );

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8);
//     doc.setTextColor(...SECONDARY_GRAY);

//     doc.text(
//       `${invoiceData.company.address} | ${invoiceData.company.email} | ${invoiceData.company.phone}`,
//       m,
//       notesEndY + 4
//     );

//     const pageCount = doc.getNumberOfPages();
//     // Page number (if multiple pages)
//     doc.text(`Page ${pageCount} of ${pageCount}`, pw - m, notesEndY + 6, {
//       align: "right",
//     });
//   };

//   // ---------- paginate rows ----------
//   const chunks: any[][] = [];
//   for (let i = 0; i < itemsForTable.length; i += ITEMS_PER_PAGE) {
//     chunks.push(itemsForTable.slice(i, i + ITEMS_PER_PAGE));
//   }
//   if (chunks.length === 0) chunks.push([]); // Ensure at least one page

//   let lastRowY = tableStartY;

//   chunks.forEach((rows, pageIndex) => {
//     if (pageIndex > 0) doc.addPage();

//     drawHeaderSection();
//     drawInfoBlocks();
//     let y = drawTableHead();

//     rows.forEach((it, idx) => {
//       drawRow(it, y, idx === rows.length - 1);
//       y += ROW_H;
//     });

//     lastRowY = y;

//     // Draw footer content on every page (page number will be updated)
//     drawFooterSection();
//   });

//   // ---------- Totals (only once, at the end) ----------
//   const totalsBlockHeight = gstEnabled ? 40 : 30; // Estimate height needed for totals
//   const bottomSafeY = ph - footerSectionH - m - totalsBlockHeight - 10;

//   // Check if there's enough space for totals on the current page
//   if (lastRowY + totalsBlockHeight + 10 <= bottomSafeY) {
//     drawTotals(lastRowY);
//   } else {
//     // If not enough space, add a new page and then draw the totals
//     doc.addPage();
//     drawHeaderSection(); // Redraw header on new page
//     drawInfoBlocks(); // Redraw info on new page
//     drawTotals(tableStartY); // Draw totals starting from tableStartY on new page
//     drawFooterSection(); // Redraw footer to update page number
//   }

//   return doc;
// };

// // @/lib/pdf-templates.ts
// export async function generatePdf(
//   transaction: Transaction,
//   company?: Company | null,
//   party?: Party | null,
//   serviceNameById?: Map<string, string>,
//   template?: string
// ) {
//   // Get default template from user settings if not provided
//   const defaultTemplate = template || (await getUserDefaultTemplate());

//   switch (defaultTemplate) {
//     case "template1":
//       return generatePdfForTemplate1(
//         transaction,
//         company,
//         party,
//         serviceNameById
//       );
//     case "template2":
//       return generatePdfForTemplate2(
//         transaction,
//         company,
//         party,
//         serviceNameById
//       );
//     case "template3":
//       return await generatePdfForTemplate3(
//         transaction,
//         company,
//         party,
//         serviceNameById
//       );
//     case "template4":
//       return await generatePdfForTemplate4(
//         transaction,
//         company,
//         party,
//         serviceNameById
//       );
//     case "template5":
//       return await generatePdfForTemplate5(
//         transaction,
//         company,
//         party,
//         serviceNameById
//       );
//     case "template6":
//       return await generatePdfForTemplate6(
//         transaction,
//         company,
//         party,
//         serviceNameById
//       );
//     case "template7":
//       return await generatePdfForTemplate7(
//         transaction,
//         company,
//         party,
//         serviceNameById
//       );
//     default:
//       return generatePdfForTemplate1(
//         transaction,
//         company,
//         party,
//         serviceNameById
//       );
//   }
// }

// async function getUserDefaultTemplate(): Promise<string> {
//   try {
//     const response = await fetch("/api/settings/default-template");
//     if (response.ok) {
//       const data = await response.json();
//       return data.defaultTemplate || "template1";
//     }
//     return "template1";
//   } catch (error) {
//     console.error("Failed to fetch default template:", error);
//     return "template1";
//   }
// }

// Re-export the template functions
export { generatePdfForTemplate1 } from "./pdf-template1";
export { generatePdfForTemplate2 } from "./pdf-template2";
export { generatePdfForTemplate3 } from "./pdf-template3";
export { generatePdfForTemplate4 } from "./pdf-template4";
export { generatePdfForTemplate5 } from "./pdf-template5";
export { generatePdfForTemplate6 } from "./pdf-template6";
export { generatePdfForTemplate7 } from "./pdf-template7";
export { generatePdfForTemplate8 } from "./pdf-template8";
export { generatePdfForTemplateA5 } from "./pdf-templateA5";
export { generatePdfForTemplateA5_3 } from "./pdf-templateA5-3";
export { generatePdfForTemplateA5_4 } from "./pdf-templateA5-4";
export { generatePdfForTemplate16 } from "./pdf-template16";
export { generatePdfForTemplate17 } from "./pdf-template17";
