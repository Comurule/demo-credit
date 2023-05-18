import { Router } from 'express';
import * as accountController from './account.controller';
import validate from '../../middlewares/validator/account';

const router = Router();

router.post('/deposit', validate('trxn'), accountController.intializeDeposit);
router.post(
  '/withdraw',
  validate('trxn'),
  validate('withdraw'),
  accountController.intializeWithdrawal,
);
router.post(
  '/transfer',
  validate('trxn'),
  validate('transfer'),
  accountController.transfer,
);
router.get(
  '/transactions',
  validate('listTransactions'),
  accountController.getAllUserTransactions,
);
router.post('/', validate('create'), accountController.createUserAccount);
router.get('/', accountController.getAllUserAccount);

export default router;
