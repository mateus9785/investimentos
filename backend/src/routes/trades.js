const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', tradeController.index);
router.get('/calendar/:year/:month', tradeController.calendar);
router.get('/:id', tradeController.show);
router.post('/', tradeController.store);
router.put('/:id', tradeController.update);
router.delete('/:id', tradeController.destroy);

module.exports = router;
