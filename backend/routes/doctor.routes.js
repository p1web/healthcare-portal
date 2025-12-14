const express = require('express');
const router = express.Router();
const controller = require("../controllers/doctor.controller"); // Fixed: "controler" → "controller"


// Main CRUD routes
router.get("/", controller.getAll);           // Get all doctors (component does filtering)
router.get("/:id", controller.getById);       // Get single doctor
router.post("/", controller.create);          // Create doctor
router.put("/:id", controller.update);        // Update doctor
router.delete("/:id", controller.delete);     // Delete doctor

module.exports = router;