const express = require("express");
const router = express.Router();
const controller = require("../controllers/specialization.controller");

router.get("/", controller.getAll);
router.get("/:id", controller.getById);
// router.get("/search/specialties/list", controller.getSpecialties);
// router.get("/search/facilities/list", controller.getFacilities);

module.exports = router;
