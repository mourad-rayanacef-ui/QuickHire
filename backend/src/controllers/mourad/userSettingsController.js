require('dotenv').config();
const prisma = require("../../config/prisma.js");
const bcrypt = require('bcrypt'); 
const redis = require("../../config/redis.js"); // ✅ Redis Import

// ========================================
// 1. GET USER PROFILE
// ========================================
/**
 * Fetches user profile for settings page
 * GET /api/User/Profile/:userId
 */
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required', 
        details: 'Please provide a valid user ID' 
      });
    }

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID', 
        details: 'User ID must be a valid integer' 
      });
    }

    // ✅ 1. Define Cache Key
    const cacheKey = `user:profile:settings:${userIdInt}`;

    // ✅ 2. Check Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        user: JSON.parse(cachedData),
        source: 'cache'
      });
    }

    // ✅ 3. Cache Miss - Query DB
    const user = await prisma.user.findUnique({
      where: { User_id: userIdInt },
      include: {
        User_Experience: {
          orderBy: { Start_date: 'desc' }
        },
        User_Skills: {
          select: {
            Skill_id: true,
            Title: true,
            Description: true,
            Skill_Certification : true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found', 
        details: `No user found with ID: ${userIdInt}` 
      });
    }

    // Data Transformation
    const formattedUser = {
      userId: user.User_id,
      fullName: `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Anonymous User',
      firstName: user.FirstName || '',
      lastName: user.LastName || '',
      email: user.Email || '',
      phoneNumber: user.Number || '',
      address: user.Location || '',
      description: user.Description || '',
      photo: user.Photo || '',
      linkedInLink: user.LinkedInLink || '',
      website: user.Website || '',
      status: user.Status || 'JobSeeker',
      rating: user.Rating || 0,
      experiences: user.User_Experience.map(exp => ({
        id: exp.Experience_id,
        title: exp.Title,
        companyName: exp.Company_Name,
        companyLocation: exp.Company_location,
        companyLogo: exp.Company_logo,
        startDate: exp.Start_date,
        endDate: exp.End_date,
        jobType: exp.Job_type,
        description: exp.Description
      })),
      skills: user.User_Skills.map(skill => ({
        id: skill.Skill_id,
        title: skill.Title,
        description: skill.Description,
        Skill_Certification  : skill.Skill_Certification
      }))
    };

    // ✅ 4. Save to Cache (10 minutes)
    await redis.set(cacheKey, JSON.stringify(formattedUser), 'EX', 600);

    res.json({
      success: true,
      user: formattedUser,
      source: 'database'
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch user profile', 
      message: error.message 
    });
  }
};

// ========================================
// 2. UPDATE USER PROFILE (PATCH)
// ========================================
/**
 * Updates user personal information (partial update)
 * PATCH /api/User/Profile/:userId
 */
const updateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, address, phoneNumber, email, description } = req.body;

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) return res.status(400).json({ success: false, error: 'Invalid user ID' });

    if (!fullName && !address && !phoneNumber && !email && !description) {
      return res.status(400).json({ success: false, error: 'No fields provided to update' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { User_id: userIdInt },
      select: { User_id: true, Email: true }
    });

    if (!existingUser) return res.status(404).json({ success: false, error: 'User not found' });

    // ... [Validation Logic kept as is] ...
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return res.status(400).json({ success: false, error: 'Invalid email format' });
      const emailInUse = await prisma.user.findFirst({ where: { Email: email, NOT: { User_id: userIdInt } } });
      if (emailInUse) return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[\s\-()]/g, '');
      if (!/^\+?\d{8,15}$/.test(cleanPhone)) return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }

    const updateData = {};
    if (fullName !== undefined && fullName.trim()) {
      const nameParts = fullName.trim().split(/\s+/);
      updateData.FirstName = nameParts[0] || '';
      updateData.LastName = nameParts.slice(1).join(' ') || '';
    }
    if (address !== undefined) updateData.Location = address.trim();
    if (phoneNumber !== undefined) updateData.Number = phoneNumber.trim();
    if (email !== undefined) updateData.Email = email.trim().toLowerCase();
    if (description !== undefined) {
      if (description.length > 1000) return res.status(400).json({ success: false, error: 'Description too long' });
      updateData.Description = description.trim();
    }

    const updatedUser = await prisma.user.update({
      where: { User_id: userIdInt },
      data: updateData
    });

    // ✅ INVALIDATE CACHE
    await redis.del(`user:profile:settings:${userIdInt}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        userId: updatedUser.User_id,
        fullName: `${updatedUser.FirstName || ''} ${updatedUser.LastName || ''}`.trim(),
        firstName: updatedUser.FirstName || '',
        lastName: updatedUser.LastName || '',
        address: updatedUser.Location || '',
        phoneNumber: updatedUser.Number || '',
        email: updatedUser.Email || '',
        description: updatedUser.Description || ''
      }
    });

  } catch (err) {
    console.error('Error updating user profile:', err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'User not found' });
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Duplicate value' });
    res.status(500).json({ success: false, error: 'Failed to update profile', message: err.message });
  }
};

// ========================================
// 3. UPDATE USER SOCIAL LINKS (PATCH)
// ========================================
/**
 * Updates user social media links (partial update)
 * PATCH /api/User/Profile/:userId/SocialLinks
 */
const updateUserSocialLinks = async (req, res) => {
  try {
    const { userId } = req.params;
    const { linkedin, email, website } = req.body;

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) return res.status(400).json({ success: false, error: 'Invalid user ID' });

    const existingUser = await prisma.user.findUnique({
      where: { User_id: userIdInt },
      select: { User_id: true, Email: true }
    });
    if (!existingUser) return res.status(404).json({ success: false, error: 'User not found' });

    const updateData = {};

    // ... [Validation Logic kept as is] ...
    if (linkedin !== undefined) {
      if (linkedin && linkedin.trim()) {
        const linkedinUrl = linkedin.trim();
        if (!linkedinUrl.includes('linkedin.com')) return res.status(400).json({ success: false, error: 'Invalid LinkedIn URL' });
        updateData.LinkedInLink = linkedinUrl;
      } else { updateData.LinkedInLink = ''; }
    }

    if (email !== undefined) {
      if (email && email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ success: false, error: 'Invalid email format' });
        const emailInUse = await prisma.user.findFirst({ where: { Email: email.trim().toLowerCase(), NOT: { User_id: userIdInt } } });
        if (emailInUse) return res.status(400).json({ success: false, error: 'Email already in use' });
        updateData.Email = email.trim().toLowerCase();
      } else { return res.status(400).json({ success: false, error: 'Email cannot be empty' }); }
    }

    if (website !== undefined) {
      if (website && website.trim()) {
        const websiteUrl = website.trim();
        try {
          new URL(websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`);
          updateData.Website = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;
        } catch (e) { return res.status(400).json({ success: false, error: 'Invalid website URL' }); }
      } else { updateData.Website = ''; }
    }

    if (Object.keys(updateData).length === 0) return res.status(400).json({ success: false, error: 'No fields provided to update' });

    const updatedUser = await prisma.user.update({
      where: { User_id: userIdInt },
      data: updateData
    });

    // ✅ INVALIDATE CACHE
    await redis.del(`user:profile:settings:${userIdInt}`);

    res.json({
      success: true,
      message: 'Social links updated successfully',
      user: {
        userId: updatedUser.User_id,
        linkedInLink: updatedUser.LinkedInLink || '',
        email: updatedUser.Email || '',
        website: updatedUser.Website || ''
      }
    });

  } catch (err) {
    console.error('Error updating social links:', err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'User not found' });
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Duplicate value' });
    res.status(500).json({ success: false, error: 'Failed to update social links', message: err.message });
  }
};

// ========================================
// 4. UPDATE USER EMAIL (PATCH)
// ========================================
/**
 * Updates user email (partial update)
 * PATCH /api/User/Profile/:userId/Email
 */
const updateUserEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { email } = req.body;

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) return res.status(400).json({ success: false, error: 'Invalid user ID' });

    if (!email || !email.trim()) return res.status(400).json({ success: false, error: 'Email is required' });

    // ... [Validation Logic kept as is] ...
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, error: 'Invalid email format' });
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { User_id: userIdInt }, select: { User_id: true, Email: true } });
    if (!existingUser) return res.status(404).json({ success: false, error: 'User not found' });
    if (existingUser.Email?.toLowerCase() === cleanEmail) return res.status(400).json({ success: false, error: 'Same email address' });

    const emailInUse = await prisma.user.findFirst({ where: { Email: cleanEmail, NOT: { User_id: userIdInt } } });
    if (emailInUse) return res.status(400).json({ success: false, error: 'Email already in use' });

    const updatedUser = await prisma.user.update({
      where: { User_id: userIdInt },
      data: { Email: cleanEmail }
    });

    // ✅ INVALIDATE CACHE
    await redis.del(`user:profile:settings:${userIdInt}`);

    res.json({
      success: true,
      message: 'Email updated successfully',
      user: {
        userId: updatedUser.User_id,
        email: updatedUser.Email
      }
    });

  } catch (err) {
    console.error('Error updating email:', err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'User not found' });
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Duplicate email' });
    res.status(500).json({ success: false, error: 'Failed to update email', message: err.message });
  }
};

// ========================================
// 5. UPDATE USER PASSWORD (PATCH) - WITH BCRYPT
// ========================================
/**
 * Updates user password (partial update)
 * PATCH /api/User/Profile/:userId/Password
 */
const updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) return res.status(400).json({ success: false, error: 'Invalid user ID' });

    // ... [Validation Logic kept as is] ...
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Missing required fields', missingFields: [!oldPassword && 'oldPassword', !newPassword && 'newPassword'].filter(Boolean) });
    }

    const existingUser = await prisma.user.findUnique({ where: { User_id: userIdInt }, select: { User_id: true, Password: true } });
    if (!existingUser) return res.status(404).json({ success: false, error: 'User not found' });

    const isPasswordCorrect = await bcrypt.compare(oldPassword, existingUser.Password);
    if (!isPasswordCorrect) return res.status(401).json({ success: false, error: 'Incorrect password' });

    if (oldPassword === newPassword) return res.status(400).json({ success: false, error: 'Same password' });
    if (newPassword.length < 8) return res.status(400).json({ success: false, error: 'Password too short' });

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUpperCase || !hasLowerCase || !hasNumber) return res.status(400).json({ success: false, error: 'Weak password' });
    if (newPassword.length > 128) return res.status(400).json({ success: false, error: 'Password too long' });
    if (confirmPassword && confirmPassword !== newPassword) return res.status(400).json({ success: false, error: 'Passwords do not match' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { User_id: userIdInt },
      data: { Password: hashedPassword }
    });

    // ✅ INVALIDATE CACHE
    await redis.del(`user:profile:settings:${userIdInt}`);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    console.error('Error updating password:', err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'User not found' });
    res.status(500).json({ success: false, error: 'Failed to update password', message: err.message });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  updateUserSocialLinks,
  updateUserEmail,
  updateUserPassword
};