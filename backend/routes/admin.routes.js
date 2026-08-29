const express = require("express");
const router = express.Router();
const userController = require("../controllers/admin/user.controller");
const doctorProfileController = require("../controllers/admin/doctor.controller");
const hospitalController = require("../controllers/admin/hospital.controller");
const specialityController = require("../controllers/admin/speciality.controller");
const specializationController = require("../controllers/admin/specialization.controller");
const doctorSpecializationController = require("../controllers/admin/doctorSpecialization.controller");
const appointmentController = require("../controllers/appointment.controller");
const profileController = require("../controllers/admin/profile.controller");
const couponCategoryController = require("../controllers/admin/coupon-category.controller");
const couponController = require("../controllers/admin/coupon.controller");
const adminPracticeController = require("../controllers/admin/practice.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.use(authenticate, authorize("admin"));

// Admin-only routes
router.get("/users", userController.getAllUsers);
router.patch("/users/:id/account-status", userController.updateAccountStatus);
router.get("/profile", profileController.getProfile);
router.put("/profile", profileController.updateProfile);
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

// Coupon Categories (admin CRUD)
router.get("/coupon-categories", couponCategoryController.getCategories);
router.get("/coupon-categories/:id", couponCategoryController.getCategoryById);
router.post("/coupon-categories", couponCategoryController.createCategory);
router.put("/coupon-categories/:id", couponCategoryController.updateCategory);
router.delete("/coupon-categories/:id", couponCategoryController.deleteCategory);
router.patch("/coupon-categories/:id/restore", couponCategoryController.restoreCategory);

// Coupons (admin CRUD)
router.get("/coupons", couponController.getCoupons);
router.get("/coupons-analytics", couponController.getAnalytics);
router.post("/coupons/bulk", couponController.bulkGenerate);
router.get("/coupons/:id", couponController.getCouponById);
router.post("/coupons", couponController.createCoupon);
router.put("/coupons/:id", couponController.updateCoupon);
router.delete("/coupons/:id", couponController.deleteCoupon);
router.patch("/coupons/:id/restore", couponController.restoreCoupon);

// Doctor practices + platform commission defaults
router.get("/practices", adminPracticeController.listPractices);
router.put("/practices/:id", adminPracticeController.updatePractice);
router.get("/commission-settings", adminPracticeController.getCommissionSettings);
router.put("/commission-settings", adminPracticeController.updateCommissionSettings);


// router.get("/filter", userController.getUsersByFilter);
// router.get("/:id", userController.getUserDetails);

// router.put("/:id/approve", userController.approveUser);
// router.put("/:id/reject", userController.rejectUser);
// router.put("/:id/toggle-status", userController.toggleUserActiveStatus);

module.exports = router;
