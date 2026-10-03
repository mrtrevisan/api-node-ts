import { Router } from 'express';
import * as authController from './controllers/auth.controller';
import * as linkController from './controllers/link.controller';
import { authenticate } from './middlewares/auth';

export const router = Router();

router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// managing links requires a token; following them is public
router.post('/links', authenticate, linkController.create);
router.get('/links/:code', authenticate, linkController.stats);
router.get('/:code', linkController.redirect);
