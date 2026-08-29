'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const practiceCtrl = require('../controllers/practice.controller');

// Public — powers the "which hospital do you want to book at?" picker on doctor detail.
router.get('/doctors/:doctorId/practices', practiceCtrl.listPublicPracticesForDoctor);
router.get('/practices/:practiceId/availability', practiceCtrl.getPublicPracticeAvailability);

// Doctor self-service
router.get('/doctor/practices', authenticate, authorize('doctor'), practiceCtrl.listMyPractices);
router.post('/doctor/practices', authenticate, authorize('doctor'), practiceCtrl.createPracticeRequest);
router.post('/doctor/solo-clinic', authenticate, authorize('doctor'), practiceCtrl.createSoloClinic);
router.put('/doctor/practices/:id', authenticate, authorize('doctor'), practiceCtrl.updateMyPractice);
router.delete('/doctor/practices/:id', authenticate, authorize('doctor'), practiceCtrl.deactivateMyPractice);
router.get('/doctor/practices/:practiceId/availability', authenticate, authorize('doctor'), practiceCtrl.getMyPracticeAvailability);
router.put('/doctor/practices/:practiceId/availability', authenticate, authorize('doctor'), practiceCtrl.replaceMyPracticeAvailability);

// Hospital owner self-service
router.get('/hospital/practices', authenticate, authorize('hospital'), practiceCtrl.listHospitalPractices);
router.patch('/hospital/practices/:id/review', authenticate, authorize('hospital'), practiceCtrl.reviewPractice);
router.get('/hospital/summary', authenticate, authorize('hospital'), practiceCtrl.getHospitalSummary);

module.exports = router;
