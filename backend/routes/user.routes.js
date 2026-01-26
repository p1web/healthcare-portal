const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// Admin-only routes
router.get("/", userController.getAllUsers);
// router.get("/filter", userController.getUsersByFilter);
// router.get("/:id", userController.getUserDetails);

// router.put("/:id/approve", userController.approveUser);
// router.put("/:id/reject", userController.rejectUser);
// router.put("/:id/toggle-status", userController.toggleUserActiveStatus);

module.exports = router;
