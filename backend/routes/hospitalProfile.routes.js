const express = require('express');
const router = express.Router();
const controller = require('../controllers/hospitalProfile.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('hospital'));

router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);

module.exports = router;
