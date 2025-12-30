const express = require('express');
const router = express.Router();
const controller = require("../controllers/auth.controller");
const {authenticate, authorize } = require("../middleware/auth.middleware");
// Public routes
router.post('/login', controller.login);
router.post('/register', controller.register);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Protected routes (require authentication)
router.get('/me', authenticate, controller.getCurrentUser);
router.put('/profile', authenticate, controller.updateProfile);
router.post('/change-password', authenticate, controller.changePassword);
router.post('/logout', authenticate, controller.logout);

module.exports = router;
