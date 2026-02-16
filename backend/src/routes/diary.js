const express = require('express');
const router = express.Router();
const diaryController = require('../controllers/diaryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', diaryController.index);
router.get('/:id', diaryController.show);
router.post('/', diaryController.store);
router.put('/:id', diaryController.update);
router.delete('/:id', diaryController.destroy);

module.exports = router;
