import { Router } from 'express';
import userRoutes from './modules/user/user.route';
import accountRoutes from './modules/account/account.route';
import authenticate from './middlewares/auth/authenticate';
import { webhookHandler } from './modules/account/account.controller';

const router = Router();

router.use('/users', userRoutes);
router.use('/accounts', authenticate, accountRoutes);

router.post('/webhook/:provider', webhookHandler);
router.get('/', (req, res) => res.sendStatus(200));
// eslint-disable-next-line no-unused-vars
router.all('*', (req, res, next) => res.sendStatus(404));

export default router;
