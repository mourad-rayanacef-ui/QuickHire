require('dotenv').config();
const prisma = require("../../config/prisma.js");
const bcrypt = require('bcrypt'); 
const redis = require("../../config/redis.js"); // ✅ Redis Import

// ========================================
// 1. GET COMPANY PROFILE
// ========================================
/**
 * Fetches company profile for settings page
 * GET /api/Company/Profile/:companyId
 */
const getCompanyProfile = async (req, res) => {
  try {
    const { companyId } = req.params;

    const companyIdInt = parseInt(companyId);
    if (isNaN(companyIdInt)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid company ID', 
        details: 'Company ID must be a valid integer' 
      });
    }

    // ✅ 1. Define Cache Key
    const cacheKey = `company:profile:settings:${companyIdInt}`;

    // ✅ 2. Check Cache
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      return res.json({ 
        success: true, 
        company: JSON.parse(cachedData),
        source: 'cache'
      });
    }

    // ✅ 3. Cache Miss - Query DB
    const company = await prisma.company.findUnique({
      where: { Company_id: companyIdInt },
      include: {
        Job: {
          select: {
            Job_id: true,
            Job_role: true,
            Type: true,
            _count: {                   // Optimized count
              select: { Job_Applications: true } 
            }
          },
          orderBy: {
            Job_id: 'desc'
          },
          take: 5
        },
        Manager: {
          select: {
            Manager_id: true,
            FirstName: true,
            LastName: true,
            Role: true,
            Email: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({ 
        success: false, 
        error: 'Company not found', 
        details: `No company found with ID: ${companyIdInt}` 
      });
    }

    // Data Transformation (CPU work)
    let foundationDate = null;
    if (company.FoundationDate) {
      const date = new Date(company.FoundationDate);
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      foundationDate = {
        day: date.getDate().toString(),
        month: months[date.getMonth()],
        year: date.getFullYear().toString()
      };
    }

    const employeeRange = mapEmployeeNumberToRange(company.Employees_Number);

    const formattedCompany = {
      companyId: company.Company_id,
      companyName: company.Name || '',
      website: company.Website || '',
      employee: employeeRange,
      employeesNumber: company.Employees_Number || 0,
      industry: company.Industry || '',
      dateFounded: foundationDate,
      description: company.Description || '',
      email: company.Email || '',
      linkedInLink: company.LinkedInLink || '',
      mainLocation: company.MainLocation || '',
      logo: company.Logo || '',
      rating: company.Rating || 0,
      recentJobs: company.Job.map(job => ({
        id: job.Job_id,
        title: job.Job_role || '',
        type: job.Type || '',
        applicationsCount: job._count.Job_Applications
      })),
      managers: company.Manager.map(manager => ({
        id: manager.Manager_id,
        name: `${manager.FirstName || ''} ${manager.LastName || ''}`.trim(),
        role: manager.Role || '',
        email: manager.Email || ''
      }))
    };

    // ✅ 4. Save to Cache (10 minutes)
    // We cache the FINAL formatted object to save CPU time on transformation next time
    await redis.set(cacheKey, JSON.stringify(formattedCompany), 'EX', 600);

    res.json({ 
      success: true, 
      company: formattedCompany,
      source: 'database'
    });

  } catch (err) {
    console.error('Error fetching company profile:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch company profile', 
      message: err.message 
    });
  }
};

// ========================================
// 2. UPDATE COMPANY PROFILE (PATCH)
// ========================================
/**
 * Updates company profile information (partial update)
 * PATCH /api/Company/Profile/:companyId
 */
const updateCompanyProfile = async (req, res) => {
  try {
    const { companyId } = req.params;
    const {
      companyName, website, employee, industry,
      dateFounded, description, mainLocation
    } = req.body;

    const companyIdInt = parseInt(companyId);
    if (isNaN(companyIdInt)) {
      return res.status(400).json({ success: false, error: 'Invalid company ID' });
    }

    // ... [Validation Logic kept exactly as is] ...
    if (!companyName && !website && !employee && !industry && !dateFounded && !description && !mainLocation) {
      return res.status(400).json({ success: false, error: 'No fields provided to update' });
    }

    const existingCompany = await prisma.company.findUnique({
      where: { Company_id: companyIdInt },
      select: { Company_id: true, Email: true }
    });

    if (!existingCompany) {
      return res.status(404).json({ success: false, error: 'Company not found' });
    }

    const updateData = {};

    // ... [Field Processing Logic kept exactly as is] ...
    if (companyName !== undefined) {
      if (companyName.trim().length === 0) return res.status(400).json({ success: false, error: 'Invalid company name' });
      if (companyName.trim().length > 200) return res.status(400).json({ success: false, error: 'Company name too long' });
      updateData.Name = companyName.trim();
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
    if (employee !== undefined) {
      const validRanges = ['1 - 10', '11 - 50', '51 - 100', '101 - 200', '201 - 500', '501 - 1000', '1001 - 5000', '5000+'];
      if (!validRanges.includes(employee)) return res.status(400).json({ success: false, error: 'Invalid employee range' });
      updateData.Employees_Number = parseEmployeeRangeToNumber(employee);
    }
    if (industry !== undefined) {
       if (industry && industry.trim().length > 100) return res.status(400).json({ success: false, error: 'Industry name too long' });
       updateData.Industry = industry.trim();
    }
    if (description !== undefined) {
       if (description && description.trim().length > 2000) return res.status(400).json({ success: false, error: 'Description too long' });
       updateData.Description = description.trim();
    }
    if (mainLocation !== undefined) {
       if (mainLocation && mainLocation.trim().length > 200) return res.status(400).json({ success: false, error: 'Location too long' });
       updateData.MainLocation = mainLocation.trim();
    }
    if (dateFounded && typeof dateFounded === 'object') {
       // ... [Date logic kept as is] ...
       try {
        const foundationDate = new Date(`${dateFounded.month} ${dateFounded.day}, ${dateFounded.year}`);
        if (isNaN(foundationDate.getTime())) return res.status(400).json({ success: false, error: 'Invalid date' });
        if (foundationDate > new Date()) return res.status(400).json({ success: false, error: 'Future date not allowed' });
        const minDate = new Date('1800-01-01');
        if (foundationDate < minDate) return res.status(400).json({ success: false, error: 'Date too old' });
        updateData.FoundationDate = foundationDate;
       } catch (err) { return res.status(400).json({ success: false, error: 'Invalid date format' }); }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields to update' });
    }

    const updatedCompany = await prisma.company.update({
      where: { Company_id: companyIdInt },
      data: updateData
    });

    // ✅ INVALIDATE CACHE
    await redis.del(`company:profile:settings:${companyIdInt}`);
    await redis.del(`company:profile:${companyIdInt}`);

    // ... [Response Formatting kept as is] ...
    let formattedFoundationDate = null;
    if (updatedCompany.FoundationDate) {
      const date = new Date(updatedCompany.FoundationDate);
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      formattedFoundationDate = {
        day: date.getDate().toString(),
        month: months[date.getMonth()],
        year: date.getFullYear().toString()
      };
    }

    res.json({
      success: true,
      message: 'Company profile updated successfully',
      company: {
        companyId: updatedCompany.Company_id,
        companyName: updatedCompany.Name || '',
        website: updatedCompany.Website || '',
        employee: mapEmployeeNumberToRange(updatedCompany.Employees_Number),
        employeesNumber: updatedCompany.Employees_Number || 0,
        industry: updatedCompany.Industry || '',
        dateFounded: formattedFoundationDate,
        description: updatedCompany.Description || '',
        mainLocation: updatedCompany.MainLocation || ''
      }
    });

  } catch (err) {
    console.error('Error updating company profile:', err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Company not found' });
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Duplicate value' });
    res.status(500).json({ success: false, error: 'Failed to update company profile', message: err.message });
  }
};

// ========================================
// 3. UPDATE COMPANY SOCIAL LINKS (PATCH)
// ========================================
/**
 * Updates company social media links (partial update)
 * PATCH /api/Company/Profile/:companyId/SocialLinks
 */
const updateSocialLinks = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { linkedin, email } = req.body;

    const companyIdInt = parseInt(companyId);
    if (isNaN(companyIdInt)) return res.status(400).json({ success: false, error: 'Invalid company ID' });

    const existingCompany = await prisma.company.findUnique({
      where: { Company_id: companyIdInt },
      select: { Company_id: true, Email: true }
    });

    if (!existingCompany) return res.status(404).json({ success: false, error: 'Company not found' });

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
        const cleanEmail = email.trim().toLowerCase();
        if (existingCompany.Email?.toLowerCase() === cleanEmail) return res.status(400).json({ success: false, error: 'Same email address' });
        const emailInUse = await prisma.company.findFirst({ where: { Email: cleanEmail, NOT: { Company_id: companyIdInt } } });
        if (emailInUse) return res.status(400).json({ success: false, error: 'Email already in use' });
        updateData.Email = cleanEmail;
      } else { return res.status(400).json({ success: false, error: 'Email cannot be empty' }); }
    }

    if (Object.keys(updateData).length === 0) return res.status(400).json({ success: false, error: 'No fields provided to update' });

    const updatedCompany = await prisma.company.update({
      where: { Company_id: companyIdInt },
      data: updateData
    });

    // ✅ INVALIDATE CACHE
    await redis.del(`company:profile:settings:${companyIdInt}`);
    await redis.del(`company:profile:${companyIdInt}`);

    res.json({
      success: true,
      message: 'Social links updated successfully',
      company: {
        companyId: updatedCompany.Company_id,
        email: updatedCompany.Email || '',
        linkedInLink: updatedCompany.LinkedInLink || ''
      }
    });

  } catch (err) {
    console.error('Error updating social links:', err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Company not found' });
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Duplicate email' });
    res.status(500).json({ success: false, error: 'Failed to update social links', message: err.message });
  }
};

// ========================================
// 4. UPDATE COMPANY EMAIL (PATCH)
// ========================================
/**
 * Updates company email (partial update)
 * PATCH /api/Company/Profile/:companyId/Email
 */
const updateCompanyEmail = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { email } = req.body;

    const companyIdInt = parseInt(companyId);
    if (isNaN(companyIdInt)) return res.status(400).json({ success: false, error: 'Invalid company ID' });

    if (!email || !email.trim()) return res.status(400).json({ success: false, error: 'Email is required' });

    // ... [Validation Logic kept as is] ...
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, error: 'Invalid email format' });
    const cleanEmail = email.trim().toLowerCase();

    const existingCompany = await prisma.company.findUnique({
      where: { Company_id: companyIdInt },
      select: { Company_id: true, Email: true }
    });
    if (!existingCompany) return res.status(404).json({ success: false, error: 'Company not found' });
    if (existingCompany.Email?.toLowerCase() === cleanEmail) return res.status(400).json({ success: false, error: 'Same email address' });

    const emailInUse = await prisma.company.findFirst({ where: { Email: cleanEmail, NOT: { Company_id: companyIdInt } } });
    if (emailInUse) return res.status(400).json({ success: false, error: 'Email already in use' });

    const updatedCompany = await prisma.company.update({
      where: { Company_id: companyIdInt },
      data: { Email: cleanEmail }
    });

    // ✅ INVALIDATE CACHE
    await redis.del(`company:profile:settings:${companyIdInt}`);
    await redis.del(`company:profile:${companyIdInt}`);

    res.json({
      success: true,
      message: 'Email updated successfully',
      company: {
        companyId: updatedCompany.Company_id,
        email: updatedCompany.Email
      }
    });

  } catch (err) {
    console.error('Error updating company email:', err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Company not found' });
    if (err.code === 'P2002') return res.status(400).json({ success: false, error: 'Duplicate email' });
    res.status(500).json({ success: false, error: 'Failed to update email', message: err.message });
  }
};

// ========================================
// 5. UPDATE COMPANY PASSWORD (PATCH) - WITH BCRYPT
// ========================================
/**
 * Updates company password (partial update)
 * PATCH /api/Company/Profile/:companyId/Password
 */
const updateCompanyPassword = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const companyIdInt = parseInt(companyId);
    if (isNaN(companyIdInt)) return res.status(400).json({ success: false, error: 'Invalid company ID' });

    // ... [Validation Logic kept as is] ...
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'Missing required fields', missingFields: [!oldPassword && 'oldPassword', !newPassword && 'newPassword'].filter(Boolean) });
    }

    const existingCompany = await prisma.company.findUnique({ where: { Company_id: companyIdInt }, select: { Company_id: true, Password: true } });
    if (!existingCompany) return res.status(404).json({ success: false, error: 'Company not found' });

    const isPasswordCorrect = await bcrypt.compare(oldPassword, existingCompany.Password);
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

    await prisma.company.update({
      where: { Company_id: companyIdInt },
      data: { Password: hashedPassword }
    });

    // ✅ INVALIDATE CACHE (Good practice, even if profile JSON doesn't contain password)
    await redis.del(`company:profile:settings:${companyIdInt}`);
    await redis.del(`company:profile:${companyIdInt}`);

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (err) {
    console.error('Error updating company password:', err);
    if (err.code === 'P2025') return res.status(404).json({ success: false, error: 'Company not found' });
    res.status(500).json({ success: false, error: 'Failed to update password', message: err.message });
  }
};

// ========================================
// HELPER FUNCTIONS
// ========================================

function mapEmployeeNumberToRange(num) {
  if (!num) return '1 - 10';
  if (num <= 10) return '1 - 10';
  if (num <= 50) return '11 - 50';
  if (num <= 100) return '51 - 100';
  if (num <= 200) return '101 - 200';
  if (num <= 500) return '201 - 500';
  if (num <= 1000) return '501 - 1000';
  if (num <= 5000) return '1001 - 5000';
  return '5000+';
}

function parseEmployeeRangeToNumber(range) {
  const rangeMap = {
    '1 - 10': 5,
    '11 - 50': 30,
    '51 - 100': 75,
    '101 - 200': 150,
    '201 - 500': 350,
    '501 - 1000': 750,
    '1001 - 5000': 3000,
    '5000+': 6000
  };
  return rangeMap[range] || 30;
}

module.exports = {
  getCompanyProfile,
  updateCompanyProfile,
  updateSocialLinks,
  updateCompanyEmail,
  updateCompanyPassword
};