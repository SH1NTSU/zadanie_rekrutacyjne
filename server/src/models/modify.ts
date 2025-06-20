import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib";
import fetch from "node-fetch";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'; // Import pdfjs-dist
import * as path from 'path'; // Needed for standardFontDataUrl

// Define the path to your pdfjs-dist standard_fonts
// This path might need adjustment based on your project's build output and node_modules location
const PDFJS_STANDARD_FONTS_PATH = path.join(
    __dirname, // Current directory of this compiled JS file (e.g., dist/models)
    '../../node_modules/pdfjs-dist/standard_fonts/' // Adjust '../../' based on actual depth
);


interface Placeholder {
  placeholder: string;
  x: number;
  y: number;
  // It's also useful to know the page number if parsing multiple pages
  pageNumber: number;
}

const modify = async (data: Record<string, string>[], layoutBuffer: Uint8Array): Promise<Uint8Array[]> => { // Fixed Uint8Arrayp
  const outputPDFs: Uint8Array[] = [];

  // --- Step 1: Parse the layout PDF with pdfjs-dist ONCE to find all placeholders ---
  // We need pdfjs-dist for text extraction
  const pdfjsDoc = await pdfjsLib.getDocument({
      data: layoutBuffer,
      standardFontDataUrl: PDFJS_STANDARD_FONTS_PATH,
  }).promise;

  const allPlaceholders: Placeholder[] = [];
  for (let i = 1; i <= pdfjsDoc.numPages; i++) {
      const page = await pdfjsDoc.getPage(i);
      const placeholdersOnPage = await findPlaceholders(page, i); // Pass pdfjs-dist page and page number
      allPlaceholders.push(...placeholdersOnPage);
  }

  // --- Step 2: Iterate through each data row to create a new PDF ---
  for (const row of data) {
    const pdfDoc = await PDFDocument.load(layoutBuffer); // Load the original layout with pdf-lib for each new PDF
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages(); // These are pdf-lib pages

    // Apply found placeholders
    for (const { placeholder, x, y, pageNumber } of allPlaceholders) {
        // Ensure the page exists in the pdf-lib document (pages are 0-indexed)
        const targetPage = pages[pageNumber - 1]; // Convert 1-indexed page number to 0-indexed

        if (targetPage) {
            const value = row[placeholder];

            if (value) {
                if (placeholder.startsWith("img_")) {
                    await drawImg(x, y, value, targetPage, pdfDoc);
                } else {
                    drawText(x, y, value, targetPage, font);
                }
            }
        } else {
            console.warn(`Placeholder on non-existent page ${pageNumber}. Skipping.`);
        }
    }

    const finalPDF = await pdfDoc.save();
    outputPDFs.push(finalPDF);
  }

  return outputPDFs;
};

const drawText = (x: number, y: number, text: string, page: PDFPage, font: any): void => {
  const fontSize = 12;
  page.drawText(text, {
    x,
    y,
    size: fontSize,
    font,
    color: rgb(0, 0, 0),
  });
};

const drawImg = async (
  x: number,
  y: number,
  url: string,
  page: PDFPage,
  pdfDoc: PDFDocument
): Promise<void> => {
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const image = url.endsWith(".jpg") || url.endsWith(".jpeg")
    ? await pdfDoc.embedJpg(buffer)
    : await pdfDoc.embedPng(buffer);

  const { width, height } = image.scale(0.5); // Scale image
  page.drawImage(image, { x, y, width, height });
};

// This function now accepts a PDF.js Page (PDFPageProxy) and its 1-indexed number
const findPlaceholders = async (pdfjsPage: any, pageNum: number): Promise<Placeholder[]> => {
  // `pdfjsPage` is now a PDFPageProxy from pdfjs-dist, which HAS `getTextContent()`
  const content = await pdfjsPage.getTextContent();
  const placeholders: Placeholder[] = [];

  for (const item of content.items as any[]) { // Using 'any[]' for items for now, to avoid deep pdfjs-dist typing
    const str = item.str?.trim();
    // This regex looks for {{any_text_inside}}
    // Adjust if your placeholders have different patterns, e.g., only letters/numbers
    const match = str?.match(/{{(.*?)}}/);
    if (match) {
        // Important: When you draw new text, you'll likely want to erase the placeholder.
        // You'll draw the new text at x, y. The placeholder string itself might need to be
        // overwritten with a blank space or removed by manipulating the content stream.
        // pdf-lib's drawText simply adds on top. For actual replacement, consider this:
        // For simplicity, we are currently just drawing over.
      placeholders.push({
        placeholder: match[1],
        x: item.transform[4], // x-coordinate
        y: item.transform[5], // y-coordinate
        pageNumber: pageNum,
      });
    }
  }

  return placeholders;
};

export default modify;
