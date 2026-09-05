const multer = require('multer');

const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File size too large. Maximum permitted retinal scan image size is 10MB.',
      });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err.message && err.message.includes('Invalid image file format')) {
    return res.status(422).json({ error: err.message });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { details: err.stack }),
  });
};

module.exports = errorHandler;
