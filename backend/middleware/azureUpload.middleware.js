// middleware/azureUpload.middleware.js
// Uses memoryStorage so file bytes are kept in memory, then
// streamed to Azure Blob Storage by the controller.
const multer = require('multer');

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

function fileFilter(req, file, cb) {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, and PNG files are allowed'));
    }
}

// memoryStorage — no disk writes; file.buffer is available in the controller
module.exports = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024, files: 5 }
});
