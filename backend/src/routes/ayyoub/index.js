const express = require('express');
const router = express.Router();
const authController = require('../../controllers/ayyoub/authController');
const UserRoutes = require('./UserRoutes');
const CompanyRoutes = require('./CompanyRoutes');
const {upload} = require('../../config/cloudinary');

// ✅ REMOVED: router.use('/auth', passwordRoutes); ← DELETE THIS LINE

// Existing authentication routes
router.post('/signIn', upload.single('image'), authController.signIn);
router.post('/signup', upload.single('image'), authController.signUp);
router.post('/logIn', authController.logIn);
router.post('/logOut', authController.logOut);

// ✅ Upload endpoint
router.post('/upload', upload.single('Manager_Photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        url: req.file.path,
        secure_url: req.file.path,
        public_id: req.file.filename
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// User routes
router.use('/User', UserRoutes);

// Company routes
router.use('/Company', CompanyRoutes);

module.exports = router;