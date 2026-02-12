const prisma = require("../../config/prisma.js");
const redis = require("../../config/redis.js"); // ✅ Redis Import

// ========================================
// 1. GET ALL USERS
// ========================================
const getAllUsers = async (req, res) => {
  try {
    const {  
      status,  
      location,  
      minRating,  
      search, 
      companyId,  
      limit = 50, 
      page = 1 
    } = req.query;

    const whereClause = {};

    // ---------------- VALIDATE COMPANY ID ----------------
    const companyIdInt = parseInt(companyId);
    if (isNaN(companyIdInt)) {
      return res.status(400).json({  
        success: false, 
        error: 'Invalid company ID', 
        details: 'Company ID must be a valid integer' 
      });
    }

    // ---------------- FILTERS ----------------
    if (status) { 
      if (!['JobSeeker', 'CurrentlyWorking'].includes(status)) { 
        return res.status(400).json({  
          success: false, 
          error: 'Invalid status value', 
          details: 'Status must be either "JobSeeker" or "CurrentlyWorking"' 
        }); 
      } 
      whereClause.Status = status; 
    } 

    if (location && location.trim()) { 
      whereClause.Location = {  
        contains: location.trim(),  
        mode: 'insensitive'  
      }; 
    } 

    if (minRating) { 
      const ratingValue = parseFloat(minRating); 
      if (isNaN(ratingValue) || ratingValue < 0 || ratingValue > 5) { 
        return res.status(400).json({  
          success: false, 
          error: 'Invalid rating value', 
          details: 'Rating must be a number between 0 and 5' 
        }); 
      } 
      whereClause.Rating = { gte: ratingValue }; 
    } 

    if (search && search.trim()) { 
      whereClause.OR = [ 
        { FirstName: { contains: search.trim(), mode: 'insensitive' } }, 
        { LastName: { contains: search.trim(), mode: 'insensitive' } } 
      ]; 
    }

    // ⭐ KEY OPTIMIZATION:
    // Exclude users already invited by this company
    whereClause.Invitations = {
      none: {
        Company_id: companyIdInt
      }
    };

    // ---------------- PAGINATION ----------------
    const limitInt = parseInt(limit); 
    const pageInt = parseInt(page); 

    if (isNaN(limitInt) || limitInt < 1 || limitInt > 100) { 
      return res.status(400).json({  
        success: false, 
        error: 'Invalid limit value', 
        details: 'Limit must be a number between 1 and 100' 
      }); 
    } 

    if (isNaN(pageInt) || pageInt < 1) { 
      return res.status(400).json({  
        success: false, 
        error: 'Invalid page value', 
        details: 'Page must be a positive number' 
      }); 
    } 

    const skip = (pageInt - 1) * limitInt; 

    // ---------------- PARALLEL QUERIES ----------------
    const [totalCount, users] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.findMany({ 
        where: whereClause, 
        include: { 
          User_Experience: { 
            orderBy: { Start_date: 'desc' }, 
            take: 5 
          }, 
          User_Skills: { 
            take: 10 
          }, 
          Job_Applications: { 
            select: { 
              Application_id: true, 
              Status: true, 
              job: { 
                select: { 
                  Job_role: true 
                } 
              } 
            }, 
            orderBy: { date: 'desc' }, 
            take: 3 
          } 
        }, 
        orderBy: { Rating: 'desc' }, 
        skip, 
        take: limitInt 
      })
    ]);

    // ---------------- FORMAT ----------------

    const formattedUsers = users.map(user => {
      // Find most recent COMPLETED experience (has End_date)
      const completedExperiences = user.User_Experience.filter(exp => exp.End_date !== null);
      const mostRecentCompleted = completedExperiences.length > 0 
        ? completedExperiences.reduce((latest, current) => {
            return new Date(current.Start_date) > new Date(latest.Start_date) ? current : latest;
          })
        : null;

      return {
        id: user.User_id, 
        name: `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Anonymous User', 
        firstName: user.FirstName || '', 
        lastName: user.LastName || '', 
        email: user.Email || '', 
        phoneNumber: user.Number || '', 
        description: user.Description || '', 
        location: user.Location || '', 
        photo: user.Photo || '', 
        rating: user.Rating || 2.5, 
        status: user.Status || 'JobSeeker', 
        linkedInLink: user.LinkedInLink || '', 
        website: user.Website || '', 
        lastCompletedRole: mostRecentCompleted?.Title || null,
        lastCompletedCompany: mostRecentCompleted?.Company_Name || null,
        experiences: user.User_Experience.map(exp => ({ 
          id: exp.Experience_id, 
          title: exp.Title || '', 
          startDate: exp.Start_date, 
          endDate: exp.End_date, 
          company: exp.Company_Name || '', 
          companyLocation: exp.Company_location || '', 
          companyLogo: exp.Company_logo || '', 
          jobType: exp.Job_type || '', 
          description: exp.Description || '' 
        })), 
        skills: user.User_Skills.map(skill => ({ 
          id: skill.Skill_id, 
          title: skill.Title || '', 
          description: skill.Description || '',
          certification: skill.Skill_Certification || ''
        })), 
        recentApplications: user.Job_Applications.map(app => ({ 
          id: app.Application_id, 
          status: app.Status, 
          jobTitle: app.job?.Job_role || '' 
        })) 
      };
    });


    // ---------------- META ----------------
    const totalPages = Math.ceil(totalCount / limitInt); 

    res.json({  
      success: true,  
      count: formattedUsers.length, 
      total: totalCount, 
      page: pageInt, 
      limit: limitInt, 
      totalPages: totalPages, 
      hasNextPage: pageInt < totalPages, 
      hasPrevPage: pageInt > 1, 
      users: formattedUsers  
    });

  } catch (err) { 
    console.error('Error fetching users:', err); 
    res.status(500).json({  
      success: false, 
      error: 'Failed to fetch users', 
      message: err.message 
    }); 
  } 
};


// ========================================
// 2. GET ALL JOBS
// ========================================
const getAllJobs = async (req, res) => {
  try {
    const { 
      type, 
      category, 
      companyId,
      userId, 
      search,
      limit = 50,
      page = 1
    } = req.query;

    const whereClause = {};

    // ---------------- VALIDATE USER ID ----------------
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        details: 'User ID must be a valid integer'
      });
    }

    // ---------------- FILTERS ----------------
    if (type && type.trim()) {
      whereClause.Type = { contains: type.trim(), mode: 'insensitive' };
    }

    if (category && category.trim()) {
      whereClause.Category = { contains: category.trim(), mode: 'insensitive' };
    }

    if (companyId) {
      const companyIdInt = parseInt(companyId);
      if (isNaN(companyIdInt)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid company ID',
          details: 'Company ID must be a valid integer'
        });
      }
      whereClause.Company_id = companyIdInt;
    }

    if (search && search.trim()) {
      whereClause.OR = [
        { Job_role: { contains: search.trim(), mode: 'insensitive' } },
        { Description: { contains: search.trim(), mode: 'insensitive' } }
      ];
    }

    // ⭐ KEY OPTIMIZATION: exclude applied jobs using relation
    whereClause.Job_Applications = {
      none: {
        User_id: userIdInt
      }
    };

    // ---------------- PAGINATION ----------------
    const limitInt = parseInt(limit);
    const pageInt = parseInt(page);

    if (isNaN(limitInt) || limitInt < 1 || limitInt > 100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid limit value'
      });
    }

    if (isNaN(pageInt) || pageInt < 1) {
      return res.status(400).json({
        success: false,
        error: 'Invalid page value'
      });
    }

    const skip = (pageInt - 1) * limitInt;

    // ---------------- PARALLEL QUERIES ----------------
    const [totalCount, jobs] = await Promise.all([
      prisma.job.count({ where: whereClause }),
      prisma.job.findMany({
        where: whereClause,
        include: {
          company: {
            select: {
              Company_id: true,
              Name: true,
              Logo: true,
              Industry: true,
              MainLocation: true,
              Website: true,
              Rating: true,
              Email: true,
              Employees_Number: true
            }
          },
          Job_Skills: {
            select: {
              Skill_id: true,
              Name: true
            }
          },
          _count: {
            select: { Job_Applications: true }
          }
        },
        orderBy: { Job_id: 'desc' },
        skip,
        take: limitInt
      })
    ]);

    // ---------------- FORMAT ----------------
    const formattedJobs = jobs.map(job => ({
      id: job.Job_id,
      title: job.Job_role || 'Untitled Position',
      type: job.Type || '',
      category: job.Category || '',
      description: job.Description || '',
      responsibilities: job.Responsibilities || '',
      whoYouAre: job.WhoYouAre || '',
      niceToHave: job.NiceToHave || '',
      company: {
        id: job.company?.Company_id || 0,
        name: job.company?.Name || 'Unknown Company',
        logo: job.company?.Logo || '',
        industry: job.company?.Industry || '',
        location: job.company?.MainLocation || '',
        website: job.company?.Website || '',
        rating: job.company?.Rating || 2.5,
        email: job.company?.Email || '',
        employeesCount: job.company?.Employees_Number || 0
      },
      skills: job.Job_Skills.map(skill => ({
        id: skill.Skill_id,
        name: skill.Name
      })),
      applicationsCount: job._count.Job_Applications,
      applications: [] // user never applied by definition
    }));

    const totalPages = Math.ceil(totalCount / limitInt);

    res.json({
      success: true,
      count: formattedJobs.length,
      total: totalCount,
      page: pageInt,
      limit: limitInt,
      totalPages,
      hasNextPage: pageInt < totalPages,
      hasPrevPage: pageInt > 1,
      jobs: formattedJobs
    });

  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      message: err.message
    });
  }
};


// ========================================
// 2.5 GET SINGLE JOB BY ID (WITH USER PROFILE DATA)
// ========================================
const getJobById = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { userId } = req.query; // Get userId from query params

    const jobIdInt = parseInt(jobId);
    if (isNaN(jobIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid job ID',
        details: 'Job ID must be a valid integer'
      });
    }

    // Fetch job details
    const job = await prisma.job.findUnique({
      where: { Job_id: jobIdInt },
      include: {
        company: {
          select: {
            Company_id: true,
            Name: true,
            Logo: true,
            Industry: true,
            MainLocation: true,
            Website: true,
            Rating: true,
            Email: true,
            Employees_Number: true
          }
        },
        Job_Skills: {
          select: {
            Skill_id: true,
            Name: true
          }
        },
        Job_Applications: {
          select: {
            Application_id: true,
            User_id: true,
            Status: true,
            date: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ 
        success: false,
        error: 'Job not found',
        details: `No job found with ID: ${jobIdInt}`
      });
    }

    let hasApplied = false;
    let userProfile = null;

    // If userId is provided, fetch user profile data
    if (userId) {
      const userIdInt = parseInt(userId);
      if (!isNaN(userIdInt)) {
        // Check if user has applied
        hasApplied = job.Job_Applications.some(app => app.User_id === userIdInt);

        // Fetch user profile with experiences and skills
        const user = await prisma.user.findUnique({
          where: { User_id: userIdInt },
          include: {
            User_Experience: {
              orderBy: {
                Start_date: 'desc'
              }
            },
            User_Skills: true
          }
        });

        if (user) {
          // Find most recent completed experience
          const completedExperiences = user.User_Experience.filter(exp => exp.End_date !== null);
          const mostRecentCompleted = completedExperiences.length > 0 
            ? completedExperiences.reduce((latest, current) => {
                return new Date(current.Start_date) > new Date(latest.Start_date) ? current : latest;
              })
            : null;

          userProfile = {
            id: user.User_id,
            firstName: user.FirstName || '',
            lastName: user.LastName || '',
            name: `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Anonymous User',
            email: user.Email || '',
            phoneNumber: user.Number || '',
            description: user.Description || '',
            location: user.Location || '',
            photo: user.Photo || '',
            rating: user.Rating || 2.5,
            status: user.Status || 'JobSeeker',
            linkedInLink: user.LinkedInLink || '',
            website: user.Website || '',
            lastCompletedRole: mostRecentCompleted?.Title || null,
            lastCompletedCompany: mostRecentCompleted?.Company_Name || null,
            experiences: user.User_Experience.map(exp => ({
              id: exp.Experience_id,
              title: exp.Title || '',
              startDate: exp.Start_date,
              endDate: exp.End_date,
              companyName: exp.Company_Name || '',
              companyLocation: exp.Company_location || '',
              companyLogo: exp.Company_logo || '',
              jobType: exp.Job_type || '',
              description: exp.Description || ''
            })),
            skills: user.User_Skills.map(skill => ({
              id: skill.Skill_id,
              title: skill.Title || '',
              description: skill.Description || '',
              certification: skill.Skill_Certification || ''
            }))
          };
        }
      }
    }

    const formattedJob = {
      id: job.Job_id,
      title: job.Job_role || 'Untitled Position',
      type: job.Type || '',
      category: job.Category || '',
      description: job.Description || '',
      responsibilities: job.Responsibilities || '',
      whoYouAre: job.WhoYouAre || '',
      niceToHave: job.NiceToHave || '',
      company: {
        id: job.company?.Company_id || 0,
        name: job.company?.Name || 'Unknown Company',
        logo: job.company?.Logo || '',
        industry: job.company?.Industry || '',
        location: job.company?.MainLocation || '',
        website: job.company?.Website || '',
        rating: job.company?.Rating || 2.5,
        email: job.company?.Email || '',
        employeesCount: job.company?.Employees_Number || 0
      },
      skills: job.Job_Skills.map(skill => ({
        id: skill.Skill_id,
        name: skill.Name
      })),
      applicationsCount: job.Job_Applications.length,
      capacity: null,
      hasApplied: hasApplied
    };

    res.json({ 
      success: true, 
      job: formattedJob,
      hasApplied: hasApplied,
      userProfile: userProfile // Include user profile data in response
    });

  } catch (err) {
    console.error('Error fetching job:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch job',
      message: err.message
    });
  }
};

// ========================================
// 3. USER APPLIES TO JOB
// ========================================
const applyToJob = async (req, res) => {
  try {
    // ============== DEBUG: Check Database Tables ==============
    try {
      // Test if we can query the notifications tables
      const testUserNotif = await prisma.user_Notifications_History.findFirst();
      console.log('✅ User notifications table exists and is accessible');
    } catch (testError) {
      console.error('❌ Cannot access user_Notifications_History table:', {
        message: testError.message,
        code: testError.code
      });
    }

    try {
      const testCompanyNotif = await prisma.company_Notifications_History.findFirst();
      console.log('✅ Company notifications table exists and is accessible');
    } catch (testError) {
      console.error('❌ Cannot access company_Notifications_History table:', {
        message: testError.message,
        code: testError.code
      });
    }
    // ==========================================================

    let { userId, jobId } = req.body;

    if (!userId || !jobId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        details: 'Both userId and jobId are required'
      });
    }

    const userIdInt = parseInt(userId);
    const jobIdInt = parseInt(jobId);

    if (isNaN(userIdInt) || isNaN(jobIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid data types',
        details: 'userId and jobId must be valid integers'
      });
    }

    // 1. GET USER DETAILS
    const user = await prisma.user.findUnique({
      where: { User_id: userIdInt },
      select: {
        User_id: true, 
        FirstName: true, 
        LastName: true,
        Email: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found'
      });
    }

    // 2. GET JOB DETAILS WITH COMPANY INFO
    const job = await prisma.job.findUnique({
      where: { Job_id: jobIdInt },
      select: {
        Job_id: true,
        Job_role: true,
        Type: true,
        company: {
          select: {
            Company_id: true,
            Name: true,
            Email: true,
            Logo: true
          }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ 
        success: false,
        error: 'Job not found'
      });
    }

    // 3. CHECK DUPLICATE APPLICATION
    const existingApplication = await prisma.job_Applications.findFirst({
      where: {
        User_id: userIdInt,
        Job_id: jobIdInt
      }
    });

    if (existingApplication) {
      return res.status(400).json({ 
        success: false,
        error: 'Duplicate application',
        details: 'You have already applied to this job'
      });
    }

    // 4. CREATE APPLICATION
    const application = await prisma.job_Applications.create({
      data: {
        User_id: userIdInt,
        Job_id: jobIdInt,
        Status: 'Applied',
        date: new Date()
      }
    });

    console.log('✅ Application created, now creating notifications...');

    // ============== COMPANY NOTIFICATION ==============
    let companyNotification = null;
    try {
      console.log('📝 Creating company notification for Company_id:', job.company.Company_id);
      console.log('Company data:', {
        companyId: job.company.Company_id,
        companyName: job.company.Name,
        content: `${user.FirstName || ''} ${user.LastName || ''} has applied to your job "${job.Job_role}"`
      });
      
      companyNotification = await prisma.company_Notifications_History.create({
        data: {
          Company_id: job.company.Company_id,
          Content: `${user.FirstName || ''} ${user.LastName || ''} has applied to your job "${job.Job_role}"`,
          Date: new Date(),
          Type: 'New_Invitation'
        }
      });
      
      console.log('✅ Company notification created with ID:', companyNotification.Notification_id);
    } catch (companyError) {
      console.error('❌ COMPANY notification FAILED:', {
        name: companyError.name,
        code: companyError.code,
        message: companyError.message,
        meta: companyError.meta
      });
    }

    // ============== USER NOTIFICATION ==============
    let userNotification = null;
    try {
      console.log('📝 Creating user notification for User_id:', userIdInt);
      console.log('User data:', {
        userId: userIdInt,
        userName: `${user.FirstName || ''} ${user.LastName || ''}`.trim(),
        content: `Your application for "${job.Job_role}" at ${job.company.Name} has been submitted`,
        type: 'New'
      });
      
      userNotification = await prisma.user_Notifications_History.create({
        data: {
          User_id: userIdInt,
          Content: `Your application for "${job.Job_role}" at ${job.company.Name} has been submitted`,
          Date: new Date(),
          Type: 'New'
        }
      });
      
      console.log('✅ User notification created with ID:', userNotification.Notification_id);
    } catch (userError) {
      console.error('❌ USER notification FAILED:', {
        name: userError.name,
        code: userError.code,
        message: userError.message,
        meta: userError.meta
      });
    }

    // ✅ INVALIDATE CACHE (Relation to Dashboard Stats)
    // 1. Update User Stats (Applied Count increases)
    await redis.del(`dashboard:user:stats:${userIdInt}`);
    
    // 2. Update Company Stats (Applicants Count increases)
    await redis.del(`dashboard:company:stats:${job.company.Company_id}`);
    
    // 3. Update Company Job List (Applicants count on job card increases)
    await redis.del(`dashboard:company:jobs:${job.company.Company_id}`);

    // BUILD RESPONSE
    const responseData = {
      success: true,
      message: 'Application submitted successfully',
      notifications: {
        company: companyNotification ? {
          created: true,
          notificationId: companyNotification.Notification_id,
          companyId: companyNotification.Company_id
        } : {
          created: false,
          error: 'Company notification was not created'
        },
        user: userNotification ? {
          created: true,
          notificationId: userNotification.Notification_id,
          userId: userNotification.User_id
        } : {
          created: false,
          error: 'User notification was not created'
        }
      },
      application: {
        id: application.Application_id,
        status: 'Applied',
        date: new Date(),
        user: {
          id: user.User_id,
          name: `${user.FirstName || ''} ${user.LastName || ''}`.trim(),
          email: user.Email
        },
        job: {
          id: job.Job_id,
          title: job.Job_role,
          type: job.Type,
          company: {
            id: job.company.Company_id,
            name: job.company.Name,
            logo: job.company.Logo
          }
        }
      }
    };

    res.status(201).json(responseData);

  } catch (err) {
    console.error('🔥 Error applying to job:', err);
    
    if (err.code === 'P2003') {
      return res.status(400).json({ 
        success: false,
        error: 'Foreign key constraint failed',
        details: 'Invalid userId or jobId reference'
      });
    }

    if (err.code === 'P2002') {
      return res.status(400).json({ 
        success: false,
        error: 'Duplicate application'
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to submit application',
      message: err.message
    });
  }
};

// ========================================
// 4. COMPANY INVITES USER
// ========================================
const inviteUser = async (req, res) => {
  try {
    const { companyId, userId, jobName, type } = req.body;

    if (!companyId || !userId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields',
        missingFields: [
          !companyId && 'companyId',
          !userId && 'userId'
        ].filter(Boolean),
        details: 'Both companyId and userId are required'
      });
    }

    const companyIdInt = parseInt(companyId);
    const userIdInt = parseInt(userId);

    if (isNaN(companyIdInt) || isNaN(userIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid data types',
        details: 'companyId and userId must be valid integers'
      });
    }

    const companyExists = await prisma.company.findUnique({
      where: { Company_id: companyIdInt },
      select: { 
        Company_id: true, 
        Name: true,
        Email: true,
        Logo: true
      }
    });

    if (!companyExists) {
      return res.status(404).json({ 
        success: false,
        error: 'Company not found',
        details: `No company found with ID: ${companyIdInt}`
      });
    }

    const userExists = await prisma.user.findUnique({
      where: { User_id: userIdInt },
      select: { 
        User_id: true, 
        FirstName: true, 
        LastName: true,
        Email: true,
        Status: true
      }
    });

    if (!userExists) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        details: `No user found with ID: ${userIdInt}`
      });
    }

    const validTypes = ['Invitation', 'Interview', 'Offer'];
    const invitationType = type || 'Invitation';
    
    if (!validTypes.includes(invitationType)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid invitation type',
        details: `Type must be one of: ${validTypes.join(', ')}`,
        provided: invitationType
      });
    }

    if (jobName && jobName.trim().length > 200) {
      return res.status(400).json({ 
        success: false,
        error: 'Job name too long',
        details: 'Job name must be 200 characters or less'
      });
    }

    const existingInvitation = await prisma.invitations.findFirst({
      where: {
        Company_id: companyIdInt,
        User_id: userIdInt,
        Job_Name: jobName?.trim() || ''
      }
    });

    if (existingInvitation) {
      return res.status(400).json({ 
        success: false,
        error: 'Duplicate invitation',
        details: 'An invitation has already been sent to this user for this position',
        invitationId: existingInvitation.Invitation_id,
        sentDate: existingInvitation.Date
      });
    }

    // Create the invitation
    const invitation = await prisma.invitations.create({
      data: {
        Company_id: companyIdInt,
        User_id: userIdInt,
        Job_Name: jobName?.trim() || '',
        Type: invitationType,
        Date: new Date()
      },
      include: {
        user: {
          select: {
            User_id: true,
            FirstName: true,
            LastName: true,
            Email: true,
            Photo: true,
            Status: true
          }
        },
        company: {
          select: {
            Company_id: true,
            Name: true,
            Email: true,
            Logo: true,
            Industry: true
          }
        }
      }
    });

    
    const notificationContent = jobName && jobName.trim()
      ? `${companyExists.Name} has sent you an invitation for "${jobName.trim()}"`
      : `${companyExists.Name} has sent you an invitation`;

    // Create notification in User_Notifications_History table
    const userNotification = await prisma.user_Notifications_History.create({
      data: {
        User_id: userIdInt,
        Content: notificationContent,
        Date: new Date(),
        Type: 'New_Invitation'
      }
    });

    // ✅ INVALIDATE CACHE (Relation to User Dashboard)
    // User Stats: Invitations Count increases
    await redis.del(`dashboard:user:stats:${userIdInt}`);

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      notification: {
        created: true,
        notificationId: userNotification.Notification_id,
        content: notificationContent
      },
      invitation: {
        id: invitation.Invitation_id,
        type: invitation.Type,
        jobName: invitation.Job_Name,
        date: invitation.Date,
        company: {
          id: invitation.company.Company_id,
          name: invitation.company.Name,
          email: invitation.company.Email,
          logo: invitation.company.Logo,
          industry: invitation.company.Industry
        },
        user: {
          id: invitation.user.User_id,
          name: `${invitation.user.FirstName || ''} ${invitation.user.LastName || ''}`.trim(),
          email: invitation.user.Email,
          photo: invitation.user.Photo,
          status: invitation.user.Status
        }
      }
    });

  } catch (err) {
    console.error('Error sending invitation:', err);
    
    if (err.code === 'P2003') {
      return res.status(400).json({ 
        success: false,
        error: 'Foreign key constraint failed',
        details: 'Invalid companyId or userId reference'
      });
    }

    if (err.code === 'P2002') {
      return res.status(400).json({ 
        success: false,
        error: 'Duplicate invitation',
        details: 'This invitation already exists'
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Failed to send invitation',
      message: err.message
    });
  }
};

// ========================================
// 1.5 GET SINGLE USER BY ID
// ========================================
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid user ID',
        details: 'User ID must be a valid integer' 
      });
    }

    // ✅ 1. CACHE (User Profile)
    // NOTE: This uses the same key as the Settings controller (`user:profile:${id}`).
    // This is good because if the user updates their profile settings, this public view updates too.
    const cacheKey = `user:profile:${userIdInt}`;
    
    const cachedData = await redis.get(cacheKey);
    if(cachedData) {
         return res.json({ 
            success: true, 
            user: JSON.parse(cachedData),
            source: 'cache'
        });
    }

    const user = await prisma.user.findUnique({
      where: { User_id: userIdInt },
      include: {
        User_Experience: {
          orderBy: {
            Start_date: 'desc'
          }
        },

        User_Skills: true,

        Job_Applications: {
          select: {
            Application_id: true,
            Status: true,
            job: {
              select: {
                Job_role: true
              }
            }
          },
          orderBy: {
            date: 'desc'
          },
          take: 5
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

    // Find most recent COMPLETED experience (has End_date)
    const completedExperiences = user.User_Experience.filter(exp => exp.End_date !== null);
    const mostRecentCompleted = completedExperiences.length > 0 
      ? completedExperiences.reduce((latest, current) => {
          return new Date(current.Start_date) > new Date(latest.Start_date) ? current : latest;
        })
      : null;

    const formattedUser = {
      id: user.User_id,
      name: `${user.FirstName || ''} ${user.LastName || ''}`.trim() || 'Anonymous User',
      firstName: user.FirstName || '',
      lastName: user.LastName || '',
      email: user.Email || '',
      phoneNumber: user.Number || '',
      description: user.Description || '',
      location: user.Location || '',
      photo: user.Photo || '',
      rating: user.Rating || 2.5,
      status: user.Status || 'JobSeeker',
      linkedInLink: user.LinkedInLink || '',
      website: user.Website || '',
      lastCompletedRole: mostRecentCompleted?.Title || null,
      lastCompletedCompany: mostRecentCompleted?.Company_Name || null,
      experiences: user.User_Experience.map(exp => ({
        id: exp.Experience_id,
        title: exp.Title || '',
        startDate: exp.Start_date,
        endDate: exp.End_date,
        companyName: exp.Company_Name || '',
        companyLocation: exp.Company_location || '',
        companyLogo: exp.Company_logo || '',
        jobType: exp.Job_type || '',
        description: exp.Description || ''
      })),
      skills: user.User_Skills.map(skill => ({
        id: skill.Skill_id,
        title: skill.Title || '',
        description: skill.Description || '',

        certification: skill.Skill_Certification || ''

      })),
      recentApplications: user.Job_Applications.map(app => ({
        id: app.Application_id,
        status: app.Status,
        jobTitle: app.job?.Job_role || ''
      }))
    };

    // ✅ 2. SAVE TO CACHE (10 minutes)
    await redis.set(cacheKey, JSON.stringify(formattedUser), 'EX', 600);

    res.json({ 
      success: true, 
      user: formattedUser,
      source: 'database'
    });

  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user',
      message: err.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  getAllJobs,
  getJobById,
  applyToJob,
  inviteUser
};