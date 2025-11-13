import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';

export interface PDFTextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  color: { r: number; g: number; b: number };
  rotation: number;
  pageIndex: number;
}

export interface PDFEditingOptions {
  fontSize?: number;
  fontFamily?: StandardFonts;
  color?: { r: number; g: number; b: number };
  position?: { x: number; y: number };
  rotation?: number;
}

/**
 * Extract text elements from a PDF page
 * This is a simplified implementation - real PDF text extraction is complex
 */
export async function extractTextElements(pdfDoc: PDFDocument): Promise<PDFTextElement[]> {
  const textElements: PDFTextElement[] = [];

  for (let pageIndex = 0; pageIndex < pdfDoc.getPageCount(); pageIndex++) {
    const page = pdfDoc.getPage(pageIndex);
    const { width, height } = page.getSize();

    // In a real implementation, you would parse the PDF content stream
    // For now, we'll create sample text elements based on common invoice fields
    const sampleElements = [
      {
        text: 'INVOICE',
        x: 50,
        y: height - 50,
        fontSize: 24,
        fontName: 'Helvetica-Bold'
      },
      {
        text: 'Invoice Number:',
        x: 50,
        y: height - 100,
        fontSize: 12,
        fontName: 'Helvetica'
      },
      {
        text: 'Date:',
        x: 400,
        y: height - 100,
        fontSize: 12,
        fontName: 'Helvetica'
      },
      {
        text: 'Bill To:',
        x: 50,
        y: height - 150,
        fontSize: 14,
        fontName: 'Helvetica-Bold'
      },
      {
        text: 'Total Amount:',
        x: 350,
        y: height - 500,
        fontSize: 14,
        fontName: 'Helvetica-Bold'
      }
    ];

    sampleElements.forEach((element, index) => {
      textElements.push({
        id: `page_${pageIndex}_text_${index}`,
        text: element.text,
        x: element.x,
        y: element.y,
        width: element.text.length * element.fontSize * 0.6, // Approximate width
        height: element.fontSize * 1.2, // Approximate height
        fontSize: element.fontSize,
        fontName: element.fontName,
        color: { r: 0, g: 0, b: 0 }, // Default black
        rotation: 0,
        pageIndex
      });
    });
  }

  return textElements;
}

/**
 * Update text element in PDF document
 */
export async function updateTextElement(
  pdfDoc: PDFDocument,
  elementId: string,
  newText: string,
  options: PDFEditingOptions = {}
): Promise<PDFDocument> {
  const newPdfDoc = await PDFDocument.create();

  // Copy all pages
  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(copiedPage);
  }

  // Find and update the text element
  const textElements = await extractTextElements(pdfDoc);
  const element = textElements.find(el => el.id === elementId);

  if (element) {
    const page = newPdfDoc.getPage(element.pageIndex);

    // Remove old text by drawing white rectangle over it
    page.drawRectangle({
      x: element.x - 2,
      y: element.y - element.height + 2,
      width: element.width + 4,
      height: element.height + 4,
      color: rgb(1, 1, 1), // White
    });

    // Add new text
    const font = newPdfDoc.embedStandardFont(
      options.fontFamily || StandardFonts[element.fontName as keyof typeof StandardFonts] || StandardFonts.Helvetica
    );

    const color = options.color || element.color;

    page.drawText(newText, {
      x: options.position?.x ?? element.x,
      y: options.position?.y ?? element.y,
      size: options.fontSize ?? element.fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      // rotate: options.rotation ? { type: 'degrees' as const, angle: options.rotation } : { type: 'degrees' as const, angle: 0 }
    });
  }

  return newPdfDoc;
}

/**
 * Add new text element to PDF
 */
export async function addTextElement(
  pdfDoc: PDFDocument,
  text: string,
  pageIndex: number,
  options: PDFEditingOptions & { x: number; y: number }
): Promise<PDFDocument> {
  const newPdfDoc = await PDFDocument.create();

  // Copy all pages
  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(copiedPage);
  }

  const page = newPdfDoc.getPage(pageIndex);
  const font = newPdfDoc.embedStandardFont(
    options.fontFamily || StandardFonts.Helvetica
  );

  const color = options.color || { r: 0, g: 0, b: 0 };

  page.drawText(text, {
    x: options.x,
    y: options.y,
    size: options.fontSize || 12,
    font,
    color: rgb(color.r, color.g, color.b),
    // rotate: options.rotation ? { type: 'degrees' as const, angle: options.rotation } : { type: 'degrees' as const, angle: 0 }
  });

  return newPdfDoc;
}

/**
 * Delete text element from PDF
 */
export async function deleteTextElement(
  pdfDoc: PDFDocument,
  elementId: string
): Promise<PDFDocument> {
  const textElements = await extractTextElements(pdfDoc);
  const element = textElements.find(el => el.id === elementId);

  if (!element) return pdfDoc;

  const newPdfDoc = await PDFDocument.create();

  // Copy all pages
  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(copiedPage);
  }

  const page = newPdfDoc.getPage(element.pageIndex);

  // Cover the text with white rectangle
  page.drawRectangle({
    x: element.x - 2,
    y: element.y - element.height + 2,
    width: element.width + 4,
    height: element.height + 4,
    color: rgb(1, 1, 1), // White
  });

  return newPdfDoc;
}

/**
 * Get available fonts in PDF-lib
 */
export function getAvailableFonts(): StandardFonts[] {
  return [
    StandardFonts.Helvetica,
    StandardFonts.HelveticaBold,
    StandardFonts.HelveticaOblique,
    StandardFonts.HelveticaBoldOblique,
    StandardFonts.TimesRoman,
    // StandardFonts.TimesBold,
    // StandardFonts.TimesItalic,
    StandardFonts.TimesRomanBoldItalic,
    StandardFonts.Courier,
    StandardFonts.CourierBold,
    StandardFonts.CourierOblique,
    StandardFonts.CourierBoldOblique
  ];
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Calculate text dimensions
 */
export function calculateTextDimensions(
  text: string,
  fontSize: number,
  fontName: string = 'Helvetica'
): { width: number; height: number } {
  // Approximate character width based on font
  const charWidth = fontName.includes('Courier') ? 0.6 : 0.5;
  const width = text.length * fontSize * charWidth;
  const height = fontSize * 1.2; // Line height

  return { width, height };
}

/**
 * Validate PDF editing options
 */
export function validateEditingOptions(options: PDFEditingOptions): boolean {
  if (options.fontSize && (options.fontSize < 6 || options.fontSize > 144)) {
    return false;
  }

  if (options.rotation && (options.rotation < -180 || options.rotation > 180)) {
    return false;
  }

  if (options.color) {
    const { r, g, b } = options.color;
    if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
      return false;
    }
  }

  return true;
}