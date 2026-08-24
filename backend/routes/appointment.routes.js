const express = require('express');
const router = express.Router();
const controller = require('../controllers/appointment.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', authorize('patient'), controller.getPatientAppointments);
router.post('/', authorize('patient'), controller.createAppointment);
router.get('/doctor', authorize('doctor'), controller.getDoctorAppointments);
router.patch('/:id/approve', authorize('doctor'), controller.approveAppointment);

module.exports = router;
