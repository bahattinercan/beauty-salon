const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, './uploads');
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    cb(new Error('Sadece JPEG, PNG, WebP ve GIF dosyaları yüklenebilir'), false);
    return;
  }
  cb(null, true);
};

const uploadSingle = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).single('file');
const uploadMultiple = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).array('files', 10);

module.exports = { uploadSingle, uploadMultiple };
