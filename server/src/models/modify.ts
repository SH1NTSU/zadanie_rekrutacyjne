import { PDFDocument, StandardFonts, rgb, PDFPage } from "pdf-lib";
import fetch from "node-fetch";
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as path from 'path';
import { Buffer } from 'buffer';

const PDFJS_STANDARD_FONTS_PATH = path.join(
    process.cwd(),
    'node_modules/pdfjs-dist/standard_fonts/'
);

interface Placeholder {
  placeholder: string;
  x: number;
  y: number;
  pageNumber: number;
  fontSize?: number;
  width?: number;
  height?: number;
}

const modify = async (data: Record<string, string>[], layoutBuffer: Buffer | Uint8Array): Promise<Uint8Array[]> => {
  const outputPDFs: Uint8Array[] = [];

  const bufferForPdfLib = Buffer.isBuffer(layoutBuffer) ? layoutBuffer : Buffer.from(layoutBuffer);
  const uint8ArrayForPdfjs = new Uint8Array(bufferForPdfLib);

  let pdfjsDocTemplate;
  try {
    pdfjsDocTemplate = await pdfjsLib.getDocument({
        data: uint8ArrayForPdfjs,
        standardFontDataUrl: PDFJS_STANDARD_FONTS_PATH,
    }).promise;
  } catch (pdfjsErr: any) {
    throw new Error(`Failed to parse PDF with pdfjs-dist: ${pdfjsErr.message}`);
  }

  const templateFirstPage = await pdfjsDocTemplate.getPage(1);
  const allPlaceholdersOnTemplate = await findPlaceholders(templateFirstPage, 1);

  const finalCatalogPdf = await PDFDocument.create();
  const font = await finalCatalogPdf.embedFont(StandardFonts.Helvetica);

  const originalTemplatePdfLib = await PDFDocument.load(bufferForPdfLib);
  const [templatePage] = await finalCatalogPdf.copyPages(originalTemplatePdfLib, [0]);

  for (const [index, row] of data.entries()) {
    const currentPage = finalCatalogPdf.addPage(templatePage);
    
    for (const { placeholder, x, y, fontSize, width, height } of allPlaceholdersOnTemplate) {
        const value = row[placeholder];

        if (value !== undefined && value !== null && value !== '') {
            if (placeholder.startsWith("img_") || placeholder === "image" || placeholder.toLowerCase().includes("image")) {
                const imgPlaceholderWidth = width || 300;
                const imgPlaceholderHeight = height || 200;
                await drawImg(x, y, value, currentPage, finalCatalogPdf, imgPlaceholderWidth, imgPlaceholderHeight);
            } else {
                drawText(x, y, value, currentPage, font, fontSize || 12, width, height);
            }
        } else {
            const padding = 2;
            const estimatedPlaceholderHeight = height || (fontSize || 12) * 1.2;
            const estimatedPlaceholderWidth = width || ((fontSize || 12) * 0.7 * placeholder.length);
            const rectX = x - padding;
            const rectY = y - padding;
            const rectWidth = estimatedPlaceholderWidth + (padding * 2);
            const rectHeight = estimatedPlaceholderHeight + (padding * 2);

            currentPage.drawRectangle({
              x: rectX,
              y: rectY,
              width: rectWidth,
              height: rectHeight,
              color: BACKGROUND_ERASE_COLOR,
            });
        }
    }
  }

  let finalPDFBytes: Uint8Array;
  try {
      finalPDFBytes = await finalCatalogPdf.save();
  } catch (saveErr: any) {
      throw new Error(`Failed to save FINAL multi-page PDF document: ${saveErr.message}`);
  }
  
  outputPDFs.push(finalPDFBytes);
  return outputPDFs;
};

const BACKGROUND_ERASE_COLOR = rgb(1, 1, 1);

const drawText = (x: number, y: number, text: string, page: PDFPage, font: any, fontSize: number, originalPlaceholderWidth?: number, originalPlaceholderHeight?: number): void => {
  const padding = 1;
  const estimatedTextHeight = originalPlaceholderHeight || (fontSize * 1.5);
  
  const actualTextWidth = font.widthOfTextAtSize(text, fontSize);

  const eraseWidth = Math.max(originalPlaceholderWidth || 0, actualTextWidth) + (padding * 2);
  
  const bottom_padding = 3.2;
  const rectX = x - padding;
  const rectY = y - padding - bottom_padding;
  const rectHeight = estimatedTextHeight + (padding * 2) - bottom_padding;

  page.drawRectangle({
    x: rectX,
    y: rectY,
    width: eraseWidth,
    height: rectHeight,
    color: rgb(1,1,1),
  });

  let drawX = x;
  if (originalPlaceholderWidth && actualTextWidth < originalPlaceholderWidth) {
      drawX = x + (originalPlaceholderWidth - actualTextWidth) / 2;
  }

  page.drawText(text, {
    x: drawX,
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
  pdfDoc: PDFDocument,
  placeholderWidth: number,
  placeholderHeight: number
): Promise<void> => {
    try {
        const res = await fetch(url);
        if (!res.ok) {
            return;
        }
        const buffer = await res.arrayBuffer();
        const bufferUint8 = new Uint8Array(buffer);

        let image;
        if (bufferUint8.length >= 3 && bufferUint8[0] === 0xFF && bufferUint8[1] === 0xD8 && bufferUint8[2] === 0xFF) {
            image = await pdfDoc.embedJpg(bufferUint8);
        } else if (bufferUint8.length >= 8 &&
                   bufferUint8[0] === 0x89 && bufferUint8[1] === 0x50 &&
                   bufferUint8[2] === 0x4E && bufferUint8[3] === 0x47 &&
                   bufferUint8[4] === 0x0D && bufferUint8[5] === 0x0A &&
                   bufferUint8[6] === 0x1A && bufferUint8[7] === 0x0A) {
            image = await pdfDoc.embedPng(bufferUint8);
        } else {
            if (url.endsWith(".jpg") || url.endsWith(".jpeg")) {
                image = await pdfDoc.embedJpg(bufferUint8);
            } else if (url.endsWith(".png")) {
                image = await pdfDoc.embedPng(bufferUint8);
            } else {
                return;
            }
        }

        const originalImageWidth = image.width;
        const originalImageHeight = image.height;
        const imageAspectRatio = originalImageWidth / originalImageHeight;
        const placeholderAspectRatio = placeholderWidth / placeholderHeight;

        let finalImageWidth: number;
        let finalImageHeight: number;

        if (imageAspectRatio > placeholderAspectRatio) {
            finalImageWidth = placeholderWidth;
            finalImageHeight = placeholderWidth / imageAspectRatio;
        } else {
            finalImageHeight = placeholderHeight;
            finalImageWidth = placeholderHeight * imageAspectRatio;
        }

        const padding = 5;
        const rectX = x - padding;
        const rectY = y - padding;
        const rectWidth = placeholderWidth + (padding * 2);
        const rectHeight = placeholderHeight + (padding * 2);

        page.drawRectangle({
          x: rectX,
          y: rectY,
          width: rectWidth,
          height: rectHeight,
          color: rgb(1,1,1),
        });

        const centerX = x + (placeholderWidth - finalImageWidth) / 2;
        const centerY = y + (placeholderHeight - finalImageHeight) / 2;

        page.drawImage(image, { x: centerX, y: centerY, width: finalImageWidth, height: finalImageHeight });

    } catch (imgErr: any) {
    }
};

const findPlaceholders = async (pdfjsPage: any, pageNum: number): Promise<Placeholder[]> => {
  const content = await pdfjsPage.getTextContent();
  const placeholders: Placeholder[] = [];

  for (const item of content.items as any[]) {
    const str = item.str?.trim();
    const match = str?.match(/{{(.*?)}}/);
    if (match) {
        placeholders.push({
            placeholder: match[1],
            x: item.transform[4],
            y: item.transform[5],
            pageNumber: pageNum,
            fontSize: item.fontHeight,
            width: item.width,
            height: item.height,
        });
    }
  }

  return placeholders;
};

export default modify;

