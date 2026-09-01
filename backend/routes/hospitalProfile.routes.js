const express = require('express');
const router = express.Router();
const controller = require('../controllers/hospitalProfile.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

router.use(authenticate, authorize('hospital'));

router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);
router.patch('/consultation-fee', controller.updateConsultationFee);
router.post('/profile/documents', controller.requireEditableProfile, upload.array('documents', 5), controller.uploadDocuments);
router.post('/profile/submit', controller.submitForReview);

module.exports = router;
