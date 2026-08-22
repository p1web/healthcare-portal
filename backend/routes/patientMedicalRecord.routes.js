const express = require('express');
const router = express.Router();
const controller = require('../controllers/patientMedicalRecord.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('patient'));

router.get('/allergies', controller.listAllergies);
router.post('/allergies', controller.addAllergy);
router.patch('/allergies/:id', controller.updateAllergy);
router.delete('/allergies/:id', controller.deleteAllergy);

router.get('/medical-conditions', controller.listMedicalConditions);
router.post('/medical-conditions', controller.addMedicalCondition);
router.patch('/medical-conditions/:id', controller.updateMedicalCondition);
router.delete('/medical-conditions/:id', controller.deleteMedicalCondition);

module.exports = router;
