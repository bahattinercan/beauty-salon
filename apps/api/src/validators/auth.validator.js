const { body } = require('express-validator');

const registerValidator = [
  body('email')
    .isEmail().withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Şifre en az 8 karakter olmalıdır')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('İsim 2-100 karakter arasında olmalıdır'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{9,14}$/).withMessage('Geçerli bir telefon numarası giriniz'),
  body('role')
    .optional()
    .isIn(['CUSTOMER', 'SALON_OWNER']).withMessage('Geçerli bir rol seçiniz'),
];

const loginValidator = [
  body('email')
    .isEmail().withMessage('Geçerli bir email adresi giriniz')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Şifre boş olamaz'),
];

module.exports = { registerValidator, loginValidator };
