const express = require('express');
const router = express.Router();
const milestoneController = require('../controllers/milestoneController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', milestoneController.index);
router.post('/', milestoneController.store);
router.delete('/:id', milestoneController.destroy);

module.exports = router;
