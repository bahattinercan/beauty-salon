const router = require('express').Router();
const favoriteController = require('../controllers/favorite.controller');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, favoriteController.getMyFavorites);
router.post('/:salonId', authenticate, favoriteController.toggle);
router.get('/:salonId/check', authenticate, favoriteController.check);

module.exports = router;
