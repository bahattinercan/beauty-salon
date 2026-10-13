const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { v4: uuid } = require('uuid');

const UPLOAD_DEST = process.env.UPLOAD_DEST || './uploads';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = parseInt(process.env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024;
const MAX_FILE_COUNT = 10;

fs.mkdirSync(UPLOAD_DEST, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DEST);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    const error = new Error('Sadece JPEG, PNG, WebP ve GIF dosyaları yüklenebilir');
    error.statusCode = 400;
    return cb(error);
  }
  cb(null, true);
};

const uploadSingle = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } }).single('file');
const uploadMultiple = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE, files: MAX_FILE_COUNT } }).array('files', MAX_FILE_COUNT);

module.exports = { uploadSingle, uploadMultiple, UPLOAD_DEST, ALLOWED_TYPES, MAX_SIZE };
