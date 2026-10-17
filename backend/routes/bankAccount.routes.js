'use strict';

const express = require('express');
const router = express.Router();
const controller = require('../controllers/bankAccount.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.use(authenticate, authorize('doctor', 'hospital'));
router.get('/', controller.getMine);
router.put('/', controller.saveMine);

module.exports = router;