const express = require('express');
const router = express.Router();
const controller = require("../controllers/doctor.controller"); // Fixed: "controler" → "controller"
router.get("/", controller.getAll);           // Get all doctors (component does filtering)
router.get("/:id", controller.getById);       // Get single doctor

module.exports = router;