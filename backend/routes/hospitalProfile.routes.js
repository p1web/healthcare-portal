const express = require('express');
const router = express.Router();
const controller = require('../controllers/hospitalProfile.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const { createHospitalImageUpload } = require('../middleware/hospitalImage.middleware');

const profileImageUpload = createHospitalImageUpload('profile');
const bannerImageUpload = createHospitalImageUpload('banner');

// Wrap multer so per-slot file size / mime errors surface as JSON 400s
// instead of falling through to the generic error handler.
function multerHandler(uploader) {
  return (req, res, next) => {
    uploader(req, res, (err) => {
      if (!err) return next();
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image exceeds the allowed size limit'
        : err.message || 'Image upload failed';
      return res.status(400).json({ success: false, message });
    });
  };
}

router.use(authenticate, authorize('hospital'));

router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);
router.patch('/consultation-fee', controller.updateConsultationFee);
router.post('/profile/documents', controller.requireEditableProfile, upload.array('documents', 5), controller.uploadDocuments);
router.post('/profile/submit', controller.submitForReview);

router.post('/profile/logo-image', multerHandler(profileImageUpload.single('image')), controller.uploadProfileImage);
router.delete('/profile/logo-image', controller.removeProfileImage);
router.patch('/profile/logo-image/publish', controller.setProfileImagePublished);
router.post('/profile/banner-image', multerHandler(bannerImageUpload.single('image')), controller.uploadBannerImage);
router.delete('/profile/banner-image', controller.removeBannerImage);
router.patch('/profile/banner-image/publish', controller.setBannerImagePublished);

module.exports = router;
