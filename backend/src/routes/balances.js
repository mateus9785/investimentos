const express = require('express');
const router = express.Router();
const balanceController = require('../controllers/balanceController');


router.get('/', balanceController.index);
router.get('/:id', balanceController.show);
router.post('/', balanceController.store);
router.put('/:id', balanceController.update);
router.delete('/:id', balanceController.destroy);

module.exports = router;
