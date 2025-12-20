const express = require('express');
const router = express.Router();
const controller = require('../controllers/coupon.controller');

// Category routes
router.get('/categories', controller.getCategories);

// Coupon validation and application routes - MUST be before /:id
router.post('/validate/:code', controller.validate);
router.post('/apply/:code', controller.apply);

// Get by code route - MUST be before /:id
router.get('/code/:code', controller.getByCode);

// Main CRUD routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.delete('/:id', controller.delete);

module.exports = router;