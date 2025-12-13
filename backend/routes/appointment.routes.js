const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: "Appointments list route working" });
});

router.post('/', (req, res) => {
  res.json({ message: "Create appointment route working" });
});

module.exports = router;
