import { Router } from 'express';
import { wishlistController } from '../controllers/wishlistController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.delete('/', wishlistController.removeFromWishlist);
router.delete('/:id', wishlistController.removeFromWishlist);

export default router;
