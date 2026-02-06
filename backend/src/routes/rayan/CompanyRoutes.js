const express = require('express');
const router = express.Router();

// Import controllers
const companySettingsController = require('../../controllers/mourad/companySettingsController');
const publicationsController = require('../../controllers/mourad/publicationsController');

// ========================================
// COMPANY SETTINGS ROUTES
// ========================================

// GET company profile (loads current data for settings page)
// GET /api/Company/ProfileSettings/:companyId
router.get(
  '/ProfileSettings/:companyId',
  companySettingsController.getCompanyProfile
);

// UPDATE company profile (Personal Information page - Save Changes button)
// PATCH /api/Company/ProfileSettings/:companyId
router.patch(
  '/ProfileSettings/:companyId',
  companySettingsController.updateCompanyProfile
);

// UPDATE social links (Social Links page - Save Changes button)
// PATCH /api/Company/ProfileSettings/:companyId/SocialLinks
router.patch(
  '/ProfileSettings/:companyId/SocialLinks',
  companySettingsController.updateSocialLinks
);

// UPDATE email only (Login Details page - Update Email button)
// PATCH /api/Company/ProfileSettings/:companyId/Email
router.patch(
  '/ProfileSettings/:companyId/Email',
  companySettingsController.updateCompanyEmail
);

// UPDATE password (Login Details page - Change Password button)
// PATCH /api/Company/ProfileSettings/:companyId/Password
router.patch(
  '/ProfileSettings/:companyId/Password',
  companySettingsController.updateCompanyPassword
);

// ========================================
// COMPANY PUBLIC ACTIONS
// ========================================

// SEND invitation to user
// POST /api/Company/Invitations
router.post(
  '/Invitations',
  publicationsController.inviteUser
);

// GET all jobs (with filtering)
// GET /api/Company/Jobs?type=&category=&companyId=
router.get(
  '/Jobs',
  publicationsController.getAllJobs
);

// GET all users (for company to browse candidates)
// GET /api/Company/Users?status=&location=&minRating=
router.get(
  '/Users',
  publicationsController.getAllUsers
);

router.get(
  '/Users/:userId',
  publicationsController.getUserById
);

// POST /api/Company/Notification
// POST /api/Company/Notification
router.post('/Notification', async (req, res) => {
  try {
    const { id, type, Notification_Type, Content } = req.body;

    

    // ✅ ACTUALLY CREATE NOTIFICATION IN DATABASE
    const notification = await prisma.company_Notifications_History.create({
      data: {
        Company_id: parseInt(id),
        Content: Content,
        Date: new Date(),
        Type: 'New'  // Or Notification_Type if it matches your enum
      }
    });


    res.status(200).json({
      success: true,
      message: '✅ Notification stored in COMPANY database!',
      notificationId: notification.Notification_id
    });

  } catch (error) {
    console.error('❌ ERROR creating company notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notification',
      message: error.message
    });
  }
});



module.exports = router;