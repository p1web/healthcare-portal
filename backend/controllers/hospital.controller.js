const {
  Hospital,
  Specialty,
  Facility,
  Accreditation,
  HospitalImage,
} = require("../models");

const { Op, Sequelize } = require("sequelize");

module.exports = {

  async getHospitalist(req, res) {
    try {
      const hospitals = await Hospital.findAll({
        attributes: ['id', 'name'],
      });

      res.status(200).json(hospitals);

    } catch (error) {
      console.error("Error fetching hospitals:", error);
      res.status(500).json({ message: "Failed to fetch hospitals" });
    }
  },


  // ============================================
  // GET ALL HOSPITALS WITH FILTERS
  // ============================================
  async getAll(req, res) {
    try {
      const {
        search = "",
        specialty = "all",
        rating = 0,
        sortBy = "rating",
        emergency = "",
      } = req.query;

      const where = {};

      // → Rating Filter
      if (rating > 0) {
        where.rating = { [Op.gte]: rating };
      }

      // → Emergency Filter
      if (emergency === "true") {
        where.emergency_available = true;
      }

      // → Search Filter
      if (search.trim() !== "") {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { location: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
          Sequelize.literal(`EXISTS (
            SELECT 1 FROM hospital_specialties hs
            JOIN specialties s ON hs.specialty_id = s.id
            WHERE hs.hospital_id = "Hospital".id
            AND s.name ILIKE '%${search}%'
          )`)
        ];
      }

      // → Sorting Logic
      let order = [];
      if (sortBy === "rating") order = [["rating", "DESC"]];
      else if (sortBy === "name") order = [["name", "ASC"]];
      else if (sortBy === "discount") {
        order = [
          [
            Sequelize.literal(`CAST(REGEXP_REPLACE(discount, '[^0-9]', '', 'g') AS INTEGER)`),
            "DESC"
          ]
        ];
      }

      // → Fetch hospitals with relations
      let hospitals = await Hospital.findAll({
        where,
        include: [
          {
            model: Specialty,
            as: "specialties",
            attributes: ["name"],
            through: { attributes: [] }
          },
          {
            model: Facility,
            as: "facilities",
            attributes: ["name"],
            through: { attributes: [] }
          },
          {
            model: Accreditation,
            as: "accreditations",
            attributes: ["name"],
            through: { attributes: [] }
          },
          {
            model: HospitalImage,
            as: "images",
            attributes: ["id", "image_url", "image_type", "is_primary"],
          }
        ],
        order,
      });

      // → Specialty Filter (AFTER FETCH)
      if (specialty && specialty !== "all") {
        hospitals = hospitals.filter(h =>
          h.specialties.some(s => s.name.toLowerCase() === specialty.toLowerCase())
        );
      }

      // → Format Response for Angular
      const formatted = hospitals.map(h => ({
        id: h.id,
        name: h.name,
        location: h.location,
        address: h.address,
        phone: h.phone,
        email: h.email,
        rating: h.rating,
        discount: h.discount,
        description: h.description,
        beds: h.beds,
        established: h.established,
        operatingHours: h.operating_hours,
        emergencyAvailable: h.emergency_available,

        specialties: h.specialties.map(s => s.name),
        facilities: h.facilities.map(f => f.name),
        accreditations: h.accreditations.map(a => a.name),

        image: h.images.find(img => img.is_primary)?.image_url || null,
      }));

      res.json({
        success: true,
        count: formatted.length,
        data: formatted
      });

    } catch (err) {
      console.error("Error fetching hospitals:", err);
      res.status(500).json({
        success: false,
        message: "Error fetching hospitals",
        error: err.message
      });
    }
  },




  // ============================================
  // GET SINGLE HOSPITAL BY ID (MODAL)
  // ============================================
  async getById(req, res) {
    try {
      const hospital = await Hospital.findByPk(req.params.id, {
        include: [
          {
            model: Specialty,
            as: "specialties",
            attributes: ["name"],
            through: { attributes: [] },
          },
          {
            model: Facility,
            as: "facilities",
            attributes: ["name"],
            through: { attributes: [] },
          },
          {
            model: Accreditation,
            as: "accreditations",
            attributes: ["name"],
            through: { attributes: [] },
          },
          {
            model: HospitalImage,
            as: "images",
            attributes: ["id", "image_url", "image_type", "is_primary"],
          }
        ]
      });

      if (!hospital)
        return res.status(404).json({ success: false, message: "Hospital not found" });

      const formatted = {
        id: hospital.id,
        name: hospital.name,
        location: hospital.location,
        address: hospital.address,
        phone: hospital.phone,
        email: hospital.email,
        rating: hospital.rating,
        discount: hospital.discount,
        description: hospital.description,
        beds: hospital.beds,
        established: hospital.established,
        operatingHours: hospital.operating_hours,
        emergencyAvailable: hospital.emergency_available,

        specialties: hospital.specialties.map(s => s.name),
        facilities: hospital.facilities.map(f => f.name),
        accreditations: hospital.accreditations.map(a => a.name),
        images: hospital.images
      };

      res.json({ success: true, data: formatted });

    } catch (err) {
      console.error("Error fetching hospital by ID:", err);
      res.status(500).json({
        success: false,
        message: "Error fetching hospital",
        error: err.message
      });
    }
  },


  // ============================================
  // LIST SPECIALTIES
  // ============================================
  async getSpecialties(req, res) {
    try {
      const list = await Specialty.findAll({
        order: [["name", "ASC"]],
      });

      res.json({ success: true, data: list });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // ============================================
  // LIST FACILITIES
  // ============================================
  async getFacilities(req, res) {
    try {
      const list = await Facility.findAll({
        order: [["name", "ASC"]],
      });

      res.json({ success: true, data: list });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
