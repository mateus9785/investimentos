const express = require('express');
const router = express.Router();
const internationalTradeController = require('../controllers/internationalTradeController');


router.get('/', internationalTradeController.index);
router.get('/calendar/:year/:month', internationalTradeController.calendar);
router.get('/:id', internationalTradeController.show);
router.post('/', internationalTradeController.store);
router.put('/:id', internationalTradeController.update);
router.delete('/:id', internationalTradeController.destroy);

module.exports = router;
