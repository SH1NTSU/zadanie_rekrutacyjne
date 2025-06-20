import { Request, Response } from 'express';
import Papa from 'papaparse';
import modify from '../models/modify'; // Assuming this returns a Uint8Array or Buffer

const generate = async (req: Request, res: Response): Promise<void> => { // Explicitly set return type to Promise<void>
  try {
    const files = req.files as {
      csv?: Express.Multer.File[];
      layout?: Express.Multer.File[];
    };

    if (!files?.csv || files.csv.length === 0) {
      res.status(400).send("CSV file missing");       return;     }
    if (!files?.layout || files.layout.length === 0) {
      res.status(400).send("Layout file missing");    
	return;
    }

    const parsed = await parseCSV(files.csv);
    const buffer = files.layout[0].buffer; // Buffer (Uint8Array)

    const result = await modify(parsed.data, buffer); // result should be Uint8Array or Buffer
	
    const pdf = result[0];
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="output.pdf"');
    res.setHeader('Content-Length', result.length);


    res.send(Buffer.from(pdf)); // No 'return' here
    return; // Explicitly return void to signify completion
  } catch (err) {
    console.error(err);
    res.status(500).send("PDF generation failed"); // No 'return' here
    return; // Explicitly return void to signify completion
  }
};

const parseCSV = (file: Express.Multer.File[]): Promise<Papa.ParseResult<any>> => {
  return new Promise((resolve, reject) => {
    const content = file[0].buffer.toString();
    Papa.parse(content, {
      header: true,
      complete: (results) => resolve(results),
      error: (err: any) => reject(err),
    });
  });
};

export default generate;
