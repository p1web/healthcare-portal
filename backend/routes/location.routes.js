const express = require('express');
const router = express.Router();
const { State, District } = require('../models');

router.get('/states', async (req, res) => {
  try {
    const states = await State.findAll({
      attributes: ['id', 'name'],
      include: [{
        model: District,
        as: 'districts',
        attributes: ['id', 'name'],
        required: false
      }],
      order: [
        ['name', 'ASC'],
        [{ model: District, as: 'districts' }, 'name', 'ASC']
      ]
    });

    res.json(states);
  } catch (err) {
    console.error('Failed to fetch state and district master data:', err);
    res.status(500).json({ message: 'Failed to fetch state and district master data' });
  }
});

module.exports = router;