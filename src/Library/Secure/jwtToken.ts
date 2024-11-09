import jwt from 'jsonwebtoken';
const { sign, verify } = jwt;

export const genrateToken = (payload) => {
    try {
        const secretKey = process.env.JWT_SECRET_KEY!;

        return sign(payload, secretKey, { expiresIn: '6h' });
    } catch (e) {
        throw e;
    }
}

export const verifyToken = (token : string) => {
    const secretKey = process.env.JWT_SECRET_KEY!;
    const result : any = {};
    
    verify(token, secretKey, (e, decoded) => {
        if (e) {
            result.ok = false;
            result.erro = e;
        } else {   
            result.ok = true;
            result.user = decoded;
        }
    });

    return result;
}