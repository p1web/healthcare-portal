const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'healthcare_db',
  user: process.env.DB_USER || 'healthcare_user',
  password: process.env.DB_PASSWORD || 'healthcare_pass',
});

// ====================
// GET /api/hospitals - Get all hospitals with filters
// ====================
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      specialty, 
      rating, 
      sortBy = 'rating', 
      emergency 
    } = req.query;

    let query = `
      SELECT DISTINCT
        h.id,
        h.name,
        h.location,
        h.address,
        h.phone,
        h.email,
        h.rating,
        h.discount,
        h.description,
        h.beds,
        h.established,
        h.operating_hours as "operatingHours",
        h.emergency_available as "emergencyAvailable",
        COALESCE(
          array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) as specialties,
        COALESCE(
          array_agg(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) as facilities,
        COALESCE(
          array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) as accreditations,
        (
          SELECT image_url 
          FROM hospital_images 
          WHERE hospital_id = h.id AND is_primary = TRUE 
          LIMIT 1
        ) as image
      FROM hospitals h
      LEFT JOIN hospital_specialties hs ON h.id = hs.hospital_id
      LEFT JOIN specialties s ON hs.specialty_id = s.id
      LEFT JOIN hospital_facilities hf ON h.id = hf.hospital_id
      LEFT JOIN facilities f ON hf.facility_id = f.id
      LEFT JOIN hospital_accreditations ha ON h.id = ha.hospital_id
      LEFT JOIN accreditations a ON ha.accreditation_id = a.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramCount = 1;

    // Apply search filter
    if (search) {
      query += ` AND (
        h.name ILIKE $${paramCount} OR 
        h.location ILIKE $${paramCount} OR
        h.address ILIKE $${paramCount} OR
        EXISTS (
          SELECT 1 FROM hospital_specialties hs2
          JOIN specialties s2 ON hs2.specialty_id = s2.id
          WHERE hs2.hospital_id = h.id AND s2.name ILIKE $${paramCount}
        )
      )`;
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Apply rating filter
    if (rating) {
      query += ` AND h.rating >= $${paramCount}`;
      queryParams.push(parseFloat(rating));
      paramCount++;
    }

    // Apply emergency filter
    if (emergency === 'true') {
      query += ` AND h.emergency_available = TRUE`;
    }

    query += ` GROUP BY h.id`;

    // Apply specialty filter (after GROUP BY)
    if (specialty && specialty !== 'all' && specialty !== 'All Specialties') {
      query += ` HAVING EXISTS (
        SELECT 1 FROM hospital_specialties hs3
        JOIN specialties s3 ON hs3.specialty_id = s3.id
        WHERE hs3.hospital_id = h.id AND s3.name ILIKE $${paramCount}
      )`;
      queryParams.push(specialty);
      paramCount++;
    }

    // Apply sorting
    switch (sortBy) {
      case 'rating':
        query += ` ORDER BY h.rating DESC`;
        break;
      case 'name':
        query += ` ORDER BY h.name ASC`;
        break;
      case 'discount':
        query += ` ORDER BY CAST(REGEXP_REPLACE(h.discount, '[^0-9]', '', 'g') AS INTEGER) DESC`;
        break;
      default:
        query += ` ORDER BY h.rating DESC`;
    }

    const result = await pool.query(query, queryParams);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hospitals',
      error: error.message
    });
  }
});

// ====================
// GET /api/hospitals/:id - Get single hospital by ID
// ====================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        h.id,
        h.name,
        h.location,
        h.address,
        h.phone,
        h.email,
        h.rating,
        h.discount,
        h.description,
        h.beds,
        h.established,
        h.operating_hours as "operatingHours",
        h.emergency_available as "emergencyAvailable",
        COALESCE(
          array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) as specialties,
        COALESCE(
          array_agg(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) as facilities,
        COALESCE(
          array_agg(DISTINCT a.name) FILTER (WHERE a.name IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) as accreditations,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', hi.id,
              'url', hi.image_url,
              'type', hi.image_type,
              'isPrimary', hi.is_primary
            )
          ) FILTER (WHERE hi.id IS NOT NULL),
          '[]'::json
        ) as images
      FROM hospitals h
      LEFT JOIN hospital_specialties hs ON h.id = hs.hospital_id
      LEFT JOIN specialties s ON hs.specialty_id = s.id
      LEFT JOIN hospital_facilities hf ON h.id = hf.hospital_id
      LEFT JOIN facilities f ON hf.facility_id = f.id
      LEFT JOIN hospital_accreditations ha ON h.id = ha.hospital_id
      LEFT JOIN accreditations a ON ha.accreditation_id = a.id
      LEFT JOIN hospital_images hi ON h.id = hi.hospital_id
      WHERE h.id = $1
      GROUP BY h.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hospital',
      error: error.message
    });
  }
});

// ====================
// GET /api/hospitals/search/specialties - Get all specialties
// ====================
router.get('/search/specialties', async (req, res) => {
  try {
    const query = `
      SELECT id, name, description
      FROM specialties
      ORDER BY name ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching specialties:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching specialties',
      error: error.message
    });
  }
});

// ====================
// GET /api/hospitals/search/facilities - Get all facilities
// ====================
router.get('/search/facilities', async (req, res) => {
  try {
    const query = `
      SELECT id, name, description
      FROM facilities
      ORDER BY name ASC
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching facilities',
      error: error.message
    });
  }
});

// ====================
// GET /api/hospitals/stats - Get hospital statistics
// ====================
router.get('/statistics/overview', async (req, res) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_hospitals,
        COUNT(*) FILTER (WHERE emergency_available = TRUE) as emergency_hospitals,
        ROUND(AVG(rating)::numeric, 2) as average_rating,
        SUM(beds) as total_beds
      FROM hospitals
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;