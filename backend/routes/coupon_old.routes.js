const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: "Coupons list route working" });
});

router.post('/', (req, res) => {
  res.json({ message: "Add coupon route working" });
});

module.exports = router;