const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');


router.get('/', expenseController.index);
router.get('/by-category', expenseController.byCategory);
router.get('/:id', expenseController.show);
router.post('/', expenseController.store);
router.put('/:id', expenseController.update);
router.delete('/:id', expenseController.destroy);

module.exports = router;
