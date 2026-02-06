require('dotenv').config()
const prisma = require("../../config/prisma.js") 
const redis = require("../../config/redis.js"); // ✅ Redis Import

// Get Company Profile
exports.getProfile = async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const cacheKey = `company:profile:${companyId}`;

    // ==========================================
    // ✅ 1. SAFER CACHE RETRIEVAL
    // ==========================================
    try {
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        
        // Ensure we have a valid object before returning to frontend
        if (parsedData && typeof parsedData === 'object') {
          return res.status(200).json({
            success: true,
            data: parsedData,
            source: 'cache'
          });
        }
      }
    } catch (redisError) {
      // If Redis fails, log it and move to Database fetch automatically
      console.warn("⚠️ Redis Cache Error (Company Profile):", redisError.message);
    }

    // ==========================================
    // 2. DATABASE FETCH (All your includes preserved)
    // ==========================================
    const company = await prisma.company.findUnique({
      where: { Company_id: companyId },
      include: {
        Manager: true,
        Job: {
          include: {
            Job_Skills: true,
            Job_Applications: {
              include: {
                user: {
                  select: {
                    User_id: true,
                    FirstName: true,
                    LastName: true,
                    Email: true,
                    Photo: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }

    // ==========================================
    // ✅ 3. SAFER CACHE SAVING
    // ==========================================
    try {
      // Save to Redis (10 mins / 600 seconds)
      await redis.set(cacheKey, JSON.stringify(company), 'EX', 600);
    } catch (redisWriteError) {
      console.error("⚠️ Failed to save Company to Redis:", redisWriteError.message);
    }

    // Final Response
    res.status(200).json({
      success: true,
      data: company,
      source: 'database'
    });

  } catch (error) {
    console.error('❌ Get Company Profile Critical Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update Company Profile
exports.updateProfile = async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const updateData = { ...req.body };

    // Handle file upload (Logo)
    if (req.file) {
      updateData.Logo = req.file.path; // Cloudinary URL
    }

    if (req.body.Photo) {
      updateData.Photo = req.body.Photo;
    }


    // Convert FoundationDate to DateTime if provided
    if (updateData.FoundationDate) {
      updateData.FoundationDate = new Date(updateData.FoundationDate);
    }

    // Convert Employees_Number to int if provided
    if (updateData.Employees_Number) {
      updateData.Employees_Number = parseInt(updateData.Employees_Number);
    }

    // Don't allow Company_id update
    delete updateData.Company_id;

    const updatedCompany = await prisma.company.update({
      where: { Company_id: companyId },
      data: updateData,
      include: {
        Manager: true
      }
    });

    // ✅ INVALIDATE CACHE
    await redis.del(`company:profile:${companyId}`);

    res.status(200).json({
      success: true,
      message: 'Company profile updated successfully',
      data: updatedCompany
    });

  } catch (error) {
    console.error('Update Company Profile Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update company profile',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Company Managers
exports.getManagers = async (req, res) => {
  try {
    const companyId = req.company.companyId;

    const managers = await prisma.manager.findMany({
      where: { Company_id: companyId },
      orderBy: { Manager_id: 'desc' }
    });

    res.status(200).json({
      success: true,
      data: managers
    });

  } catch (error) {
    console.error('Get Managers Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch managers',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create Invitation
exports.createInvitation = async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { User_id, Job_Name, Type } = req.body;

    if (!User_id || !Job_Name) {
      return res.status(400).json({
        success: false,
        error: 'User_id and Job_Name are required'
      });
    }

    // Verify user exists
    const userExists = await prisma.user.findUnique({
      where: { User_id: parseInt(User_id) }
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.invitations.findFirst({
      where: {
        Company_id: companyId,
        User_id: parseInt(User_id),
        Job_Name
      }
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        error: 'Invitation already sent to this user for this job'
      });
    }

    const invitation = await prisma.invitations.create({
      data: {
        Company_id: companyId,
        User_id: parseInt(User_id),
        Job_Name,
        Type,
        Date: new Date()
      },
      include: {
        user: {
          select: {
            User_id: true,
            FirstName: true,
            LastName: true,
            Email: true,
            Photo: true
          }
        }
      }
    });

    // ✅ INVALIDATE CACHE (User Stats: Invitations Count)
    await redis.del(`dashboard:user:stats:${parseInt(User_id)}`);

    res.status(201).json({
      success: true,
      message: 'Invitation sent successfully',
      data: invitation
    });

  } catch (error) {
    console.error('Create Invitation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create invitation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Applicants with pagination
exports.getApplicants = async (req, res) => {
  try {
  
    const companyId = req.company.companyId;
  
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
  

    // Get all jobs for this company
    const companyJobs = await prisma.job.findMany({
      where: { Company_id: companyId },
      select: { Job_id: true }
    });


    const jobIds = companyJobs.map(job => job.Job_id);

    if (jobIds.length === 0) {
    
      return res.status(200).json({
        success: true,
        data: [],
        pagination: {
          page,
          limit,
          totalCount: 0,
          totalPages: 0
        }
      });
    }

    const [applications, totalCount] = await Promise.all([
      prisma.job_Applications.findMany({
        where: {
          Job_id: { in: jobIds },
          Status: 'Applied'
        },
        include: {
          user: {
            select: {
              User_id: true,
              FirstName: true,
              LastName: true,
              Email: true,
              Photo: true,
              Location: true,
              Status: true,
              Rating: true,
              LinkedInLink: true
            }
          },
          job: {
            select: {
              Job_id: true,
              Job_role: true,
              Type: true,
              Category: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.job_Applications.count({
        where: {
          Job_id: { in: jobIds },
          Status: 'Applied'
        }
      })
    ]);


    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('=== Get Applicants Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applicants',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get Applicant by ID
exports.getApplicantById = async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const applicationId = parseInt(req.params.id);

    // Get all jobs for this company
    const companyJobs = await prisma.job.findMany({
      where: { Company_id: companyId },
      select: { Job_id: true }
    });

    const jobIds = companyJobs.map(job => job.Job_id);

    const application = await prisma.job_Applications.findFirst({
      where: {
        Application_id: applicationId,
        Job_id: { in: jobIds }
      },
      include: {
        user: {
          include: {
            User_Experience: {
              orderBy: { Start_date: 'desc' }
            },
            User_Skills: true
          }
        },
        job: {
          include: {
            Job_Skills: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Applicant not found or does not belong to your company jobs'
      });
    }

    // Remove password from user data
    if (application.user) {
      delete application.user.Password;
    }

    res.status(200).json({
      success: true,
      data: application
    });

  } catch (error) {
    console.error('Get Applicant By ID Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applicant',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add Manager
exports.addManager = async (req, res) => {
  try {
    const companyId = req.company.companyId;
    
    const {
      FirstName,
      LastName,
      Role,
      Email,
      LinkedInLink
    } = req.body;

    // Validate required fields
    if (!FirstName || !Role) {
      return res.status(400).json({
        success: false,
        error: 'FirstName and Role are required'
      });
    }

    const managerData = {
      Company_id: companyId,
      FirstName,
      LastName: LastName || '',
      Role,
      Email: Email || null,
      LinkedInLink: LinkedInLink || null
    };

    // Handle file upload (Manager_Photo)
    if (req.file) {
      managerData.Manager_Photo = req.file.path; // Cloudinary URL
    }

    const manager = await prisma.manager.create({
      data: managerData
    });

    // ✅ INVALIDATE CACHE (Profile includes managers list)
    await redis.del(`company:profile:${companyId}`);

    res.status(201).json({
      success: true,
      message: 'Manager added successfully',
      data: manager
    });

  } catch (error) {
    console.error('Add Manager Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add manager',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ✅ Accept Application - UPDATE Status to InContact
exports.acceptApplication = async (req, res) => {
  try {

    
    const companyId = req.company.companyId;
    const { applicationId } = req.params;

    // Get application details
    const application = await prisma.job_Applications.findUnique({
      where: { Application_id: parseInt(applicationId) },
      include: {
        user: {
          select: {
            User_id: true,
            FirstName: true,
            LastName: true
          }
        },
        job: {
          select: {
            Job_role: true,
            Company_id: true
          }
        }
      }
    });


    
    if (!application) {
 
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }



    // Verify this application belongs to the company's job
    if (application.job.Company_id !== companyId) {
    
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }



    // Check if chat conversation already exists
    const existingChat = await prisma.in_Chat.findFirst({
      where: {
        User_id: application.User_id,
        Company_id: companyId
      }
    });

    // ✅ UPDATE Status to InContact (NOT DELETE)
    await prisma.job_Applications.update({
      where: { Application_id: parseInt(applicationId) },
      data: { Status: 'InContact' }
    });



    // Create notification for the user
    await prisma.user_Notifications_History.create({
      data: {
        User_id: application.User_id,
        Type: 'New_Contact',
        Content: `Your application for ${application.job.Job_role} has been accepted! You can now start chatting with the company.`,
        Date: new Date()
      }
    });


    // Create In_Chat record if it doesn't exist
    if (!existingChat) {
      await prisma.in_Chat.create({
        data: {
          User_id: application.User_id,
          Company_id: companyId,
          Status: 'Active'
        }
      });
    
    } else {
      console.log('ℹ️ Chat already exists');
    }

    // ✅ INVALIDATE CACHE (Multi-touch invalidation)
    await redis.del(`company:profile:${companyId}`);       // Profile might show recent jobs/apps
    await redis.del(`dashboard:company:stats:${companyId}`); // Applicants count down, Chat count up
    await redis.del(`dashboard:company:jobs:${companyId}`);  // Job card applicants count down
    await redis.del(`dashboard:user:stats:${application.User_id}`); // User apps count down, notifications up



    res.status(200).json({
      success: true,
      message: 'Application accepted successfully'
    });

  } catch (error) {
    console.error('=== Accept Application Error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to accept application',
      details: error.message
    });
  }
};

// ✅ Reject Application - UPDATE Status to Rejected (NOT DELETE)
exports.rejectApplication = async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { applicationId } = req.params;

    // Get application details
    const application = await prisma.job_Applications.findUnique({
      where: { Application_id: parseInt(applicationId) },
      include: {
        user: {
          select: {
            User_id: true,
            FirstName: true,
            LastName: true
          }
        },
        job: {
          select: {
            Job_role: true,
            Company_id: true
          }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    // Verify this application belongs to the company's job
    if (application.job.Company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // ✅ UPDATE Status to Rejected (NOT DELETE)
    await prisma.job_Applications.update({
      where: { Application_id: parseInt(applicationId) },
      data: { Status: 'Rejected' }
    });





    // No notification sent for rejection

    res.status(200).json({
      success: true,
      message: 'Application rejected successfully'
    });

  } catch (error) {
    console.error('Reject Application Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject application'
    });
  }
};

// ✅ Get Invitations
exports.getInvitations = async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [invitations, totalCount] = await Promise.all([
      prisma.invitations.findMany({
        where: { Company_id: companyId },
        include: {
          user: {
            select: {
              User_id: true,
              FirstName: true,
              LastName: true,
              Email: true,
              Photo: true,
              Location: true,
              Rating: true
            }
          }
        },
        orderBy: { Date: 'desc' },
        skip,
        take: limit
      }),
      prisma.invitations.count({
        where: { Company_id: companyId }
      })
    ]);

    res.status(200).json({
      success: true,
      data: invitations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Get Invitations Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invitations'
    });
  }
};

// ✅ Delete Application
exports.deleteApplication = async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { applicationId } = req.params;

    const application = await prisma.job_Applications.findUnique({
      where: { Application_id: parseInt(applicationId) },
      include: {
        job: {
          select: { Company_id: true }
        }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (application.job.Company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    await prisma.job_Applications.delete({
      where: { Application_id: parseInt(applicationId) }
    });

    // ✅ INVALIDATE CACHE
    await redis.del(`company:profile:${companyId}`);
    await redis.del(`dashboard:company:stats:${companyId}`);
    await redis.del(`dashboard:company:jobs:${companyId}`);
    // Note: application.User_id is needed to invalidate user stats, 
    // but the original findUnique code didn't select it. 
    // However, Prisma returns scalars by default so application.User_id exists.
    if(application.User_id) {
       await redis.del(`dashboard:user:stats:${application.User_id}`);
    }

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Delete Application Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete application'
    });
  }
};

// ✅ Delete Invitation - Completely removes from database
exports.deleteInvitation = async (req, res) => {
  try {
    const companyId = req.company.companyId;
    const { invitationId } = req.params;

    const invitation = await prisma.invitations.findUnique({
      where: { Invitation_id: parseInt(invitationId) }
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        error: 'Invitation not found'
      });
    }

    if (invitation.Company_id !== companyId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // ✅ DELETE invitation completely from database
    await prisma.invitations.delete({
      where: { Invitation_id: parseInt(invitationId) }
    });


    // ✅ INVALIDATE CACHE (User Stats)
    await redis.del(`dashboard:user:stats:${invitation.User_id}`);



    res.status(200).json({
      success: true,
      message: 'Invitation deleted successfully'
    });

  } catch (error) {
    console.error('Delete Invitation Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete invitation'
    });
  }
};