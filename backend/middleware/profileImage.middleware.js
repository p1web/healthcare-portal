// middleware/profileImage.middleware.js
//
// Factory for image-only multer middleware. Files land under
// backend/uploads/<subfolder>/<userId>/, only JPG/PNG/WEBP are accepted, and
// a single file <= 5 MB per request is enforced.
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
  return cb(new Error('Only JPG, PNG, and WEBP images are allowed'));
}

function createImageUpload(subfolder) {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_ROOT, subfolder, String(req.user.id));
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
  });

  return multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
}

module.exports = createImageUpload('profile-images');
module.exports.createImageUpload = createImageUpload;
