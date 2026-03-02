const express = require("express");
const router = express.Router();
const userController = require("../controllers/admin/user.controller");
const doctorProfileController = require("../controllers/admin/doctor.controller");
const hospitalController = require("../controllers/admin/hospital.controller");
const specialityController = require("../controllers/admin/speciality.controller");
const specializationController = require("../controllers/admin/specialization.controller");
const hospitalSpecialityController = require("../controllers/admin/hospitalSpeciality.controller");
const doctorSpecializationController = require("../controllers/admin/doctorSpecialization.controller");

// Admin-only routes
router.get("/users", userController.getAllUsers);

router.get("/doctors-profile", doctorProfileController.getDoctorProfiles);
router.get("/public-doctors", doctorProfileController.getPublicDoctors);

router.get("/specialization-list", doctorProfileController.getSpecializationList);

router.get("/hospital-user-profile", hospitalController.getHospitalUserProfiles);
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

router.get("/hospital-specialty-mapping", hospitalSpecialityController.getHospitalSpeciality);
router.get("/get-hospital-specialty-by-hospital/:hospitalId", hospitalSpecialityController.getHospitalWiseSpecialityList);
router.put("/update-hospital-specialty/:hospital_id", hospitalSpecialityController.updateHospitalSpeciality);


router.get("/doctor-specialization-mapping", doctorSpecializationController.getDoctorSpecialization);


// router.get("/filter", userController.getUsersByFilter);
// router.get("/:id", userController.getUserDetails);

// router.put("/:id/approve", userController.approveUser);
// router.put("/:id/reject", userController.rejectUser);
// router.put("/:id/toggle-status", userController.toggleUserActiveStatus);

module.exports = router;
