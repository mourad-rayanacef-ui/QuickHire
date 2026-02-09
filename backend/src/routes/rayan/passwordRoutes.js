const express = require('express');
const router = express.Router();
const passwordController = require('../../controllers/mourad/passwordController');

// Public routes (no authentication required)
router.post('/forgot-password', passwordController.forgotPassword);
router.get('/verify-reset-token/:token', passwordController.verifyResetToken);
router.post('/reset-password', passwordController.resetPassword);

module.exports = router;