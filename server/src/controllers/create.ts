import { Request, Response } from 'express';

const generate = (req: Request, res: Response) => {
  res.json({ message: 'Generated something' });
};

export default generate;
