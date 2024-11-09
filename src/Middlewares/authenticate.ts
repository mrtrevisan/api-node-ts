import { Request, Response, NextFunction } from 'express';
import { verifyToken } from "../Library/Secure/jwtToken";

export const authenticate = (req : Request, res : Response, next : NextFunction) => {
    const authorization = req.headers.authorization;
  
    if (authorization) {
        const token = authorization.split(' ')[1];
    
        const decoded = verifyToken(token);
        if (!decoded.ok) {
            return res.status(403).json({ message : decoded.erro.message, code : 403});
        } else {
            // req.user = decoded.user;
            next();
        }
    } else {
        return res.status(401).json({ message : "token not found", code : 401});
    }
};