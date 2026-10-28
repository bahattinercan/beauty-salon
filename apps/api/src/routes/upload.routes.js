const router = require('express').Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middlewares/auth');
const { uploadSingle, uploadMultiple, uploadVideo } = require('../middlewares/upload');

router.post('/single', authenticate, uploadSingle, uploadController.uploadSingle);
router.post('/multiple', authenticate, uploadMultiple, uploadController.uploadMultiple);
router.post('/video', authenticate, uploadVideo, uploadController.uploadVideo);

module.exports = router;
