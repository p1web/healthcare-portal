const express = require('express');
const router = express.Router();
const controller = require('../controllers/doctorProfile.controller');
const snapshotController = require('../controllers/doctorPatientSnapshot.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const azureUpload = require('../middleware/azureUpload.middleware');
const profileImageUpload = require('../middleware/profileImage.middleware');

router.use(authenticate, authorize('doctor'));

router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);

// Both endpoints route to controller.uploadDocuments and handle both storage drivers dynamically
router.post('/profile/documents', controller.requireEditableProfile, azureUpload.array('documents', 5), controller.uploadDocuments);
router.post('/profile/documents/azure', controller.requireEditableProfile, azureUpload.array('documents', 5), controller.uploadDocuments);

// Stream/Download verification document
router.get('/profile/documents/download/:index', controller.downloadDocument);

router.post('/profile/avatar', profileImageUpload.single('image'), controller.uploadProfileImage);
router.post('/profile/submit', controller.submitForReview);
router.get('/patients/:patientUserId/snapshot', snapshotController.getPatientSnapshot);

module.exports = router;
