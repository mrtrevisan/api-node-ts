import type { Request, Response } from 'express';
import * as exampleService from '../services/example.service';

export async function list(req: Request, res: Response) {
    const items = await exampleService.listExamples();
    res.status(200).json({ items });
}
