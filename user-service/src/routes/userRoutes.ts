import { Router } from 'express';
import { registerUser } from '../controllers/registerController';
import { loginUser } from '../controllers/loginController';
import { getCurrentUser, updateUserProfile } from '../controllers/profileController';
import { getUserById, getAllUsers, deleteUser } from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { validateRegister, validateLogin, validateUpdateProfile } from '../middleware/validator';

const router = Router();

// Public routes
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);

// Protected routes (require authentication)
router.get('/me', protect, getCurrentUser);
router.put('/me', protect, validateUpdateProfile, updateUserProfile);

// User routes
router.get('/:id', protect, getUserById);

// Admin routes
router.get('/', protect, authorize('admin', 'moderator'), getAllUsers);
router.delete('/:id', protect, authorize('admin'), deleteUser);

export default router;

