import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response) {
    const user = await authService.register(req.body?.email, req.body?.password);
    res.status(201).json({ id: user.id, email: user.email });
}

export async function login(req: Request, res: Response) {
    const token = await authService.login(req.body?.email, req.body?.password);
    res.status(200).json({ token });
}
