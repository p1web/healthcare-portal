'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { createImageUpload } = require('../middleware/profileImage.middleware');
const staffCtrl = require('../controllers/hospitalStaff.controller');

const staffAvatarUpload = createImageUpload('staff-avatars');

// Public — sitting doctors listed on the hospital detail page.
router.get('/hospitals/:hospitalId/staff', staffCtrl.publicListStaffForHospital);
router.get('/hospitals/:hospitalId/booking-options', staffCtrl.getHospitalBookingOptions);

// Hospital owner CRUD.
router.get('/hospital/staff', authenticate, authorize('hospital'), staffCtrl.listStaff);
router.post('/hospital/staff', authenticate, authorize('hospital'), staffCtrl.createStaff);
router.put('/hospital/staff/:id', authenticate, authorize('hospital'), staffCtrl.updateStaff);
router.delete('/hospital/staff/:id', authenticate, authorize('hospital'), staffCtrl.deleteStaff);
router.post('/hospital/staff-avatar', authenticate, authorize('hospital'), staffAvatarUpload.single('image'), staffCtrl.uploadStaffAvatar);

module.exports = router;
