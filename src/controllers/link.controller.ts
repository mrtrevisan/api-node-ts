import type { Request, Response } from 'express';
import * as linkService from '../services/link.service';

export async function create(req: Request, res: Response) {
    const body = req.body as { url?: unknown } | undefined;
    const link = await linkService.shorten(body?.url, res.locals.userId);
    res.status(201).json({ code: link.code, url: link.url });
}

export async function stats(req: Request<{ code: string }>, res: Response) {
    res.status(200).json(await linkService.stats(req.params.code, res.locals.userId));
}

export async function redirect(req: Request<{ code: string }>, res: Response) {
    res.redirect(302, await linkService.resolve(req.params.code));
}
