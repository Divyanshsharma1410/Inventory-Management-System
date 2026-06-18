import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as auth from '../controllers/auth.controller.js';
import * as categories from '../controllers/category.controller.js';
import * as products from '../controllers/product.controller.js';
import * as stock from '../controllers/stock.controller.js';
import * as dashboard from '../controllers/dashboard.controller.js';

const router = Router();

// --- Auth ---
router.post('/auth/register', auth.register);
router.post('/auth/login', auth.login);
router.get('/auth/me', authenticate, auth.me);

// Everything below requires authentication.
router.use(authenticate);

// --- Dashboard ---
router.get('/dashboard', dashboard.getStats);

// --- Categories ---
router.get('/categories', categories.listCategories);
router.post('/categories', categories.createCategory);
router.get('/categories/:id', categories.getCategory);
router.put('/categories/:id', categories.updateCategory);
router.delete('/categories/:id', categories.deleteCategory);

// --- Products ---
router.get('/products', products.listProducts);
router.post('/products', products.createProduct);
router.get('/products/:id', products.getProduct);
router.put('/products/:id', products.updateProduct);
router.delete('/products/:id', products.deleteProduct);

// --- Stock movements ---
router.get('/movements', stock.listMovements);
router.post('/products/:id/movements', stock.createMovement);

export default router;
