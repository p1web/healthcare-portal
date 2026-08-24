const express = require("express");
const router = express.Router();
const userController = require("../controllers/admin/user.controller");
const doctorProfileController = require("../controllers/admin/doctor.controller");
const hospitalController = require("../controllers/admin/hospital.controller");
const specialityController = require("../controllers/admin/speciality.controller");
const specializationController = require("../controllers/admin/specialization.controller");
const doctorSpecializationController = require("../controllers/admin/doctorSpecialization.controller");
const appointmentController = require("../controllers/appointment.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.use(authenticate, authorize("admin"));

// Admin-only routes
router.get("/users", userController.getAllUsers);
router.patch("/users/:id/account-status", userController.updateAccountStatus);
router.get("/appointments", appointmentController.getAdminAppointments);

router.get("/doctors-profile", doctorProfileController.getDoctorProfiles);
router.put("/doctors-profile/:id/review", doctorProfileController.verifyDoctorProfile);
router.put("/doctors-profile/:id/verify", doctorProfileController.verifyDoctorProfile);

router.get("/specialization-list", doctorProfileController.getSpecializationList);

router.get("/hospital-user-profile", hospitalController.getHospitalUserProfiles);
router.put("/hospital-user-profile/:id/review", hospitalController.verifyHospitalProfile);
router.put("/hospital-user-profile/:id/verify", hospitalController.verifyHospitalProfile);
router.get("/public-hospitals", hospitalController.getPublicHospitals);

// masters
router.get("/specialities", specialityController.getSpecialities);
router.post("/add-speciality", specialityController.addSpeciality);
router.put("/update-speciality/:id", specialityController.updateSpeciality);
router.delete("/delete-speciality/:id", specialityController.deleteSpeciality);

router.get("/specializations", specializationController.getSpecializations);
router.post("/add-specialization", specializationController.addSpecialization);
router.put("/update-specialization/:id", specializationController.updateSpecialization);
router.delete("/delete-specialization/:id", specializationController.deleteSpecialization);

router.get("/doctor-specialization-mapping", doctorSpecializationController.getDoctorSpecialization);


// router.get("/filter", userController.getUsersByFilter);
// router.get("/:id", userController.getUserDetails);

// router.put("/:id/approve", userController.approveUser);
// router.put("/:id/reject", userController.rejectUser);
// router.put("/:id/toggle-status", userController.toggleUserActiveStatus);

module.exports = router;
