const router = require('express').Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth');
const { uploadSingle, uploadMultiple } = require('../middlewares/upload');

router.post('/single', authenticate, uploadSingle, uploadController.uploadSingle);
router.post('/multiple', authenticate, uploadMultiple, uploadController.uploadMultiple);

module.exports = router;
