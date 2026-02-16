const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/summary', dashboardController.summary);
router.get('/equity-curve', dashboardController.equityCurve);

module.exports = router;
