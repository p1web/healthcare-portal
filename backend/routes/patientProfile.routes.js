const express = require('express');
const router = express.Router();
const controller = require('../controllers/patientProfile.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('patient'));

router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);

module.exports = router;
