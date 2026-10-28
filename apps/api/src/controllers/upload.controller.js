const { successResponse } = require('../utils/helpers');

// POST /upload/single
const uploadSingle = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Dosya yüklenmedi' });
    }

    successResponse(res, {
      url: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
};

// POST /upload/multiple
const uploadMultiple = (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Dosya yüklenmedi' });
    }

    const files = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
    }));

    successResponse(res, files);
  } catch (error) {
    next(error);
  }
};

// POST /upload/video
const uploadVideo = (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Dosya yüklenmedi' });
    }

    successResponse(res, {
      url: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadSingle, uploadMultiple, uploadVideo };
