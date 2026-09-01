'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/hospitalAppointment.controller');

router.get('/hospital/appointments', authenticate, authorize('hospital'), ctrl.listAppointments);
router.patch('/hospital/appointments/:id/confirm', authenticate, authorize('hospital'), ctrl.confirmAppointment);
router.patch('/hospital/appointments/:id/complete', authenticate, authorize('hospital'), ctrl.completeAppointment);
router.patch('/hospital/appointments/:id/reject', authenticate, authorize('hospital'), ctrl.rejectAppointment);

module.exports = router;
