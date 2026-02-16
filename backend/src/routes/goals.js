const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', goalController.index);
router.post('/', goalController.store);
router.put('/:id', goalController.update);
router.delete('/:id', goalController.destroy);

module.exports = router;
