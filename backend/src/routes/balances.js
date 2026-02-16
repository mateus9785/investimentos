const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', balanceController.index);
router.get('/:id', balanceController.show);
router.post('/', balanceController.store);
router.put('/:id', balanceController.update);
router.delete('/:id', balanceController.destroy);

module.exports = router;
