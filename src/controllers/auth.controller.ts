import type { Request, Response } from 'express';
import * as authService from '../services/auth.service';

// unvalidated client input; the service checks the values
type CredentialsBody = { email?: unknown; password?: unknown } | undefined;

export async function register(req: Request, res: Response) {
    const body = req.body as CredentialsBody;
    const user = await authService.register(body?.email, body?.password);
    res.status(201).json({ id: user.id, email: user.email });
}

export async function login(req: Request, res: Response) {
    const body = req.body as CredentialsBody;
    const token = await authService.login(body?.email, body?.password);
    res.status(200).json({ token });
}
