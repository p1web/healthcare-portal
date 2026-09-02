'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const controller = require('../controllers/department.controller');

router.get('/hospitals/:hospitalId/departments', controller.listPublic);
router.get('/hospital/departments', authenticate, authorize('hospital'), controller.listMine);
router.post('/hospital/departments', authenticate, authorize('hospital'), controller.create);
router.put('/hospital/departments/:id', authenticate, authorize('hospital'), controller.update);
router.delete('/hospital/departments/:id', authenticate, authorize('hospital'), controller.remove);

module.exports = router;
