const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/protect');
const { paybill, addMoney } = require('../controller/walletController');

router.post('/addMoney', protect, addMoney);
router.post('/paybill', protect, paybill);


module.exports = router;