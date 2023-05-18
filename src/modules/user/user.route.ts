import { Router } from 'express';
import * as userController from './user.controller';
import validate from '../../middlewares/validator/user';

const router = Router();

router.post('/signup', validate('signup'), userController.signup);
router.post('/login', validate('login'), userController.login);
router.get('/', userController.getAll);

export default router;
