const express = require("express");
const router = express.Router();
const userController = require("../controllers/admin/user.controller");
const doctorProfileController = require("../controllers/admin/doctor.controller");
const hospitalController = require("../controllers/admin/hospital.controller");

// Admin-only routes
router.get("/users", userController.getAllUsers);

router.get("/doctors-profile", doctorProfileController.getDoctorProfiles);
router.get("/public-doctors", doctorProfileController.getPublicDoctors);

router.get("/specializations", doctorProfileController.getSpecializations);

router.get("/hospital-user-profile", hospitalController.getHospitalUserProfiles);
router.get("/public-hospitals", hospitalController.getPublicHospitals);

// router.get("/filter", userController.getUsersByFilter);
// router.get("/:id", userController.getUserDetails);

// router.put("/:id/approve", userController.approveUser);
// router.put("/:id/reject", userController.rejectUser);
// router.put("/:id/toggle-status", userController.toggleUserActiveStatus);

module.exports = router;
