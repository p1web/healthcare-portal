const express = require('express');
const router = express.Router();
const { Specialty } = require('../models'); // adjust path

router.get('/', async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
      attributes: ['name'],
      order: [['name', 'ASC']]
    });
    res.json(specialties);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch specialties' });
  }
});

module.exports = router;
