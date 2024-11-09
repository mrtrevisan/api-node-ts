import { Router, Request, Response } from 'express';
import { authenticate } from '../Middlewares/authenticate';
import { logger } from '../Library/util/logger';

const router = Router();

router.use(authenticate);

router.post('/path', async (req : Request, res : Response) => {
    try
    {
        const data = {};
        res.status(200).json(data);
    }
    catch (e : any)
    {
        res.status(500).json({ message : e.message, code : 500 });
        logger.error(e.message);
    }
});

export { router as Controller };
