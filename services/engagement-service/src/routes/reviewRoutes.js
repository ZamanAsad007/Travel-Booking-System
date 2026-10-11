import { Router } from 'express';
import { reviewController } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', reviewController.getReviews);
router.get('/eligible', authenticate, reviewController.getReviewableTrips);
router.post('/', authenticate, reviewController.createReview);

export default router;
