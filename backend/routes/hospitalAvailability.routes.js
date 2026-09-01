'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/hospitalAvailability.controller');

router.get('/hospitals/:hospitalId/availability', ctrl.getPublicAvailability);
router.get('/hospital/availability', authenticate, authorize('hospital'), ctrl.getMyAvailability);
router.put('/hospital/availability', authenticate, authorize('hospital'), ctrl.replaceMyAvailability);
router.patch('/hospital/accepts-bookings', authenticate, authorize('hospital'), ctrl.setAcceptsBookings);

module.exports = router;
