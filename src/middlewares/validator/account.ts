import { check } from 'express-validator';
import validate from './baseValidator';
import constants from '../../config/constants';
import { SupportedCurrency } from '../../modules/account/interfaces/transaction.interface';

const validationRules = {
  checkId: [
    check('id')
      .trim()
      .notEmpty()
      .withMessage('ID is required.')
      .isString()
      .isLength({ min: constants.ID_LENGTH, max: constants.ID_LENGTH })
      .withMessage(`ID must be a string of ${constants.ID_LENGTH} characters.`),
  ],
  create: [
    check('currency')
      .trim()
      .notEmpty()
      .withMessage('currency is required')
      .isIn(Object.values(SupportedCurrency))
      .withMessage(
        `currency must be one of these: ${Object.values(SupportedCurrency).join(
          ', ',
        )}.`,
      ),
    check('channel')
      .trim()
      .optional()
      .notEmpty()
      .withMessage('channel can not be empty.')
      .isString()
      .withMessage('channel must be in a string format.'),
  ],
  trxn: [
    check('currency')
      .trim()
      .notEmpty()
      .withMessage('currency is required')
      .isIn(Object.values(SupportedCurrency))
      .withMessage(
        `currency must be one of these: ${Object.values(SupportedCurrency).join(
          ', ',
        )}.`,
      ),
    check('amount')
      .notEmpty()
      .withMessage('amount is required.')
      .isNumeric()
      .isDecimal({
        force_decimal: false,
        decimal_digits: '1,2',
        locale: 'en-US',
      })
      .withMessage('amount must be a float with maximum of 2 decimal places.')
      .isFloat({ min: 100, max: 3_000_000 })
      .withMessage('amount can not be less than 100 and ore than 3,000,000.'),
    check('channel')
      .trim()
      .optional()
      .notEmpty()
      .withMessage('channel can not be empty.')
      .isString()
      .withMessage('channel must be in a string format.'),
  ],
  withdraw: [
    check('bankCode')
      .trim()
      .notEmpty()
      .withMessage('bankCode is required.')
      .isNumeric({ no_symbols: true })
      .isString()
      .withMessage('bankCode must be numbers in a string format.'),
    check('bankAccountNumber')
      .trim()
      .notEmpty()
      .withMessage('bankAccountNumber is required.')
      .isNumeric({ no_symbols: true })
      .isString()
      .withMessage('bankAccountNumber must be numbers in a string format.'),
  ],
  transfer: [
    check('receiverId')
      .trim()
      .notEmpty()
      .withMessage('receiverId is required.')
      .isString()
      .isLength({ min: constants.ID_LENGTH, max: constants.ID_LENGTH })
      .withMessage(
        `receiverId must be a string of ${constants.ID_LENGTH} characters.`,
      ),
  ],
  listTransactions: [
    check('transactionId')
      .trim()
      .optional()
      .notEmpty()
      .withMessage('transactionId can not be empty.')
      .isString()
      .isLength({ min: constants.ID_LENGTH, max: constants.ID_LENGTH })
      .withMessage(
        `transactionId must be a string of ${constants.ID_LENGTH} characters.`,
      ),
    check('accountId')
      .trim()
      .optional()
      .notEmpty()
      .withMessage('transactionId can not be empty.')
      .isString()
      .isLength({ min: constants.ID_LENGTH, max: constants.ID_LENGTH })
      .withMessage(
        `transactionId must be a string of ${constants.ID_LENGTH} characters.`,
      ),
    check('currency')
      .trim()
      .optional()
      .notEmpty()
      .withMessage('currency can not be empty.')
      .isIn(Object.values(SupportedCurrency))
      .withMessage(
        `currency must be one of these: ${Object.values(SupportedCurrency).join(
          ', ',
        )}.`,
      ),
  ],
};

export default (
  routeValidation:
    | 'create'
    | 'trxn'
    | 'withdraw'
    | 'transfer'
    | 'listTransactions',
) => [...validationRules[routeValidation], validate];
