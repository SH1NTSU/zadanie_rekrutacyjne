import { Request, Response } from 'express';
import Papa from 'papaparse';
import fs from 'fs/promises';
import modify from '../models/modify'; 
import { writeFileSync } from 'fs';

const generate = async (req: Request, res: Response): Promise<void> => {
  try {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const csvFile = files?.['csv']?.[0];
    const layoutFile = files?.['layout']?.[0];

    if (!csvFile || (!csvFile.buffer && !csvFile.path)) {
      console.error("CSV file missing or buffer/path empty", files?.['csv']);
      res.status(400).send("CSV file missing or unreadable");
      return;
    }

    if (!layoutFile || (!layoutFile.buffer && !layoutFile.path)) {
      console.error("Layout file missing or buffer/path empty", files?.['layout']);
      res.status(400).send("Layout file missing or unreadable");
      return;
    }

    const csvContent = csvFile.buffer
      ? csvFile.buffer.toString('utf-8')
      : await fs.readFile(csvFile.path, 'utf-8');

    const parsed = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        complete: (results) => resolve(results),
        error: (err: any) => reject(err),
      });
    });

    const layoutBuffer = layoutFile.buffer
      ? new Uint8Array(layoutFile.buffer)
      : new Uint8Array(await fs.readFile(layoutFile.path));

    console.log("DEBUG: Layout Buffer Size:", layoutBuffer.byteLength);
    console.log("DEBUG: Layout starts with (hex):", Buffer.from(layoutBuffer.slice(0, 10)).toString('hex'));

    const result = await modify(parsed.data, layoutBuffer);

    const pdf = result[0]; 
    writeFileSync("generated.pdf", pdf);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
    res.setHeader('Content-Length', pdf.length.toString());

    res.send(pdf);   
} catch (err) {
    console.error("Error in generate controller:", err);
    res.status(500).send("PDF generation failed");
  }
};

export default generate;
