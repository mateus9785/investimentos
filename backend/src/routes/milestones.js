const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');


router.get('/', milestoneController.index);
router.post('/', milestoneController.store);
router.delete('/:id', milestoneController.destroy);

module.exports = router;
