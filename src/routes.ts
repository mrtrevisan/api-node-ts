import { Router } from 'express';
import * as exampleController from './controllers/example.controller';
import { authenticate } from './middlewares/auth';

export const router = Router();

router.use(authenticate);
router.get('/examples', exampleController.list);
