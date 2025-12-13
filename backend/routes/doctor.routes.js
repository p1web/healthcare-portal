const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: "Doctors list route working" });
});

router.post('/', (req, res) => {
  res.json({ message: "Add doctor route working" });
});

module.exports = router;
