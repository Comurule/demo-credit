import { check } from 'express-validator';
import validate from './baseValidator';
import constants from '../../config/constants';

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
  signup: [
    check('first_name')
      .trim()
      .notEmpty()
      .withMessage('first_name is required')
      .isString()
      .isLength({ min: 3 })
      .withMessage(
        'first_name must be in a string format with at least 3 characters.',
      ),
    check('last_name')
      .trim()
      .notEmpty()
      .withMessage('last_name is required')
      .isString()
      .isLength({ min: 3 })
      .withMessage(
        'last_name must be in a string format with at least 3 characters.',
      ),
    check('email')
      .trim()
      .notEmpty()
      .withMessage('email is required')
      .isEmail()
      .withMessage('Invalid email.'),
    check('password')
      .trim()
      .notEmpty()
      .withMessage('password is required.')
      .isString()
      .isLength({ min: 6 })
      .withMessage('password must be a string with at least 6 characters.'),
  ],
  login: [
    check('email')
      .trim()
      .notEmpty()
      .withMessage('email is required')
      .isEmail()
      .withMessage('Invalid email.'),
    check('password')
      .trim()
      .notEmpty()
      .withMessage('password is required.')
      .isString()
      .isLength({ min: 6 })
      .withMessage('password must be a string with at least 6 characters.'),
  ],
};

export default (routeValidation: 'checkId' | 'signup' | 'login') => [
  ...validationRules[routeValidation],
  validate,
];
