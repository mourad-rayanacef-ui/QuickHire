import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import styles from './DashbordCompany.module.css';
import NavBarCompany from '../../../components/navbarcompany/navbarcompany.jsx';
import SideBarCompany from '../../../components/SideBar/SideBarCompany.jsx';
import { companyAPI } from '../../../services/api';
import Alert from '../../../components/Alert/Alert.jsx';
// --- SKELETON COMPONENTS ---
const StatSkeleton = () => (
  <div className={`${styles.statCard} ${styles.skeletonCard}`}>
    <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '40px', height: '30px', marginBottom: '10px' }}></div>
    <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '80%', height: '15px' }}></div>
  </div>
);

const JobSkeleton = () => (
  <div className={`${styles.jobCard} ${styles.skeletonCard}`}>
    <div className={styles.jobContent}>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '70%', height: '24px', marginBottom: '15px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '40%', height: '16px', marginBottom: '10px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '30%', height: '14px' }}></div>
    </div>
  </div>
);

const ChatUserSkeleton = () => (
  <div className={`${styles.inviteCard} ${styles.skeletonCard}`}>
    <div className={styles.inviteContent}>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '60%', height: '20px', marginBottom: '10px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '40%', height: '14px', marginBottom: '10px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '90%', height: '40px' }}></div>
    </div>
    <div className={styles.actionButtons} style={{ marginTop: '15px' }}>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '45%', height: '35px', borderRadius: '5px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '45%', height: '35px', borderRadius: '5px' }}></div>
    </div>
  </div>
);

const EmployeeSkeleton = () => (
  <div className={`${styles.employeeCard} ${styles.skeletonCard}`}>
    <div className={styles.employeeContent}>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '70%', height: '20px', marginBottom: '10px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '50%', height: '14px', marginBottom: '10px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '40%', height: '12px', marginBottom: '10px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '30%', height: '20px', borderRadius: '15px' }}></div>
    </div>
  </div>
);

const CompanyDashboard = () => {
  const navigate = useNavigate();

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'info',
    message: ''
  });

  // Modal state
  const [showHireModal, setShowHireModal] = useState(false);
  const [showRefuseModal, setShowRefuseModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [refuseApplicationId, setRefuseApplicationId] = useState(null);
  const [hireFormData, setHireFormData] = useState({
    jobName: '',
    startDate: '',
    endDate: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Show alert function
  const showNotification = (message, type = 'info') => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  // --- USE QUERY (Replaces fetchData & useEffect) ---
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['companyDashboard'],
    queryFn: async () => {
      try {
        // Fetch all data in parallel as before
        const [statsRes, jobsRes, chatRes, hiredRes] = await Promise.all([
          companyAPI.getDashboardStats(),
          companyAPI.getCompanyJobs(),
          companyAPI.getUsersInChat(),
          companyAPI.getHiredEmployees()
        ]);

        return {
          stats: statsRes.success ? statsRes.data : { activeJobs: 0, totalApplicants: 0, usersInChat: 0, hiredEmployees: 0 },
          companyJobPosts: jobsRes.success ? jobsRes.data : [],
          usersInChat: chatRes.success ? chatRes.data : [],
          hiredEmployees: hiredRes.success ? hiredRes.data : []
        };
      } catch (error) {
        showNotification('Failed to fetch dashboard data', 'error');
        throw error;
      }
    },
    refetchOnWindowFocus: false, // Optional: prevent refetch on window focus
  });

  // Extract data with fallbacks
  const stats = data?.stats || { activeJobs: 0, totalApplicants: 0, usersInChat: 0, hiredEmployees: 0 };
  const companyJobPosts = data?.companyJobPosts || [];
  const usersInChat = data?.usersInChat || [];
  const hiredEmployees = data?.hiredEmployees || [];

  const handlePostJob = () => {
    navigate('../PostJob');
  };

  // Get today's date in YYYY-MM-DD format for date input restrictions
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Handle Accept button click - open hire modal
  const handleAccept = (user) => {
    setSelectedUser(user);
    // If user has applications, default to first one
    const firstApp = user.applications && user.applications.length > 0 ? user.applications[0] : null;
    setSelectedApplicationId(firstApp?.applicationId || null);
    setHireFormData({
      jobName: firstApp?.jobRole || '',
      startDate: getTodayDate(), // Default to today's date
      endDate: ''
    });
    setShowHireModal(true);
  };

  // Handle Refuse button click - open refuse modal
  const handleRefuse = (user) => {
    setSelectedUser(user);
    // If user has applications, default to first one
    const firstApp = user.applications && user.applications.length > 0 ? user.applications[0] : null;
    setRefuseApplicationId(firstApp?.applicationId || null);
    setShowRefuseModal(true);
  };

  // Handle refuse form submission
  const handleRefuseSubmit = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);
      const response = await companyAPI.refuseUser({
        userId: selectedUser.id,
        applicationId: refuseApplicationId
      });

      if (response.success) {
        setShowRefuseModal(false);
        setSelectedUser(null);
        setRefuseApplicationId(null);
        showNotification(`Successfully refused ${selectedUser.name || 'the user'} for the selected job`, 'success');
        // Refetch data to update UI
        refetch();
      } else {
        showNotification(response.error || 'Failed to refuse user', 'error');
      }
    } catch (error) {
      console.error('Error refusing user:', error);
      showNotification('Failed to refuse user. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Send hired notification function
  const Send_Hired_Notification = async (userId, userName) => {
    try {
      // Get company information from localStorage
      const userDataString = localStorage.getItem("user");
      const userData = userDataString ? JSON.parse(userDataString) : null;
      const token = localStorage.getItem("token");

      const Company = {
        id: userData?.Company_id,
        type: "company",
        name: userData?.Name || "Company"   // The name of company from localStorage
      };

      const response = await fetch(`https://quickhire-4d8p.onrender.com/api/Company/Notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: userId,
          type: "user",
          Notification_Type: "Hired",
          Content: `Congratulations on starting your new position at ${Company.name}!`
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const notificationData = await response.json();
      console.log("Notification sent successfully:", notificationData);
      return notificationData;

    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  };

  // Handle hire form submission
  const handleHireSubmit = async (e) => {
    e.preventDefault();

    if (!hireFormData.jobName || !hireFormData.startDate) {

      showNotification('Please fill in the required fields (Job Name and Start Date)', 'warning');

      return;
    }

    try {
      setActionLoading(true);
      const response = await companyAPI.hireUser({
        userId: selectedUser.id,
        jobName: hireFormData.jobName,
        startDate: hireFormData.startDate,
        endDate: hireFormData.endDate || null,
        applicationId: selectedApplicationId // Pass specific application to delete
      });

      if (response.success) {
        // Send notification to the hired user
        await Send_Hired_Notification(selectedUser.id, selectedUser.name);

        // Close modal
        setShowHireModal(false);
        setSelectedUser(null);

        showNotification(`Successfully hired ${selectedUser.name || 'the user'}!`, 'success');

        // ✅ Refetch data using Query to update UI
        refetch();
      } else {
        showNotification(response.error || 'Failed to hire user', 'error');
      }
    } catch (error) {
      console.error('Error hiring user:', error);
      showNotification('Failed to hire user. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setShowHireModal(false);
    setShowRefuseModal(false);
    setSelectedUser(null);
    setSelectedApplicationId(null);
    setRefuseApplicationId(null);
    setHireFormData({
      jobName: '',
      startDate: '',
      endDate: ''
    });
  };

  // Handle application selection change
  const handleApplicationSelect = (appId) => {
    setSelectedApplicationId(appId);
    // Update job name based on selected application
    const selectedApp = selectedUser?.applications?.find(app => app.applicationId === parseInt(appId));
    if (selectedApp) {
      setHireFormData(prev => ({ ...prev, jobName: selectedApp.jobRole }));
    }
  };

  return (
    <>
      {/* Alert Component */}
      {showAlert && (
        <Alert
          type={alertConfig.type}
          message={alertConfig.message}
          onClose={() => setShowAlert(false)}
          duration={3000}
          autoClose={true}
        />
      )}

      <NavBarCompany />
      <SideBarCompany />
      <div className={styles.companydashboard}>

        <div className={styles.dashboardHeader}>
          <br />
          <h1>Dashboard</h1>
          <div className={styles.mobilePostJobContainer}>
            <button
              className={styles.postJobButton}
              onClick={handlePostJob}
            >
              Post Job
            </button>
          </div>

          <div className={styles.statsContainer}>
            {/* STATS LOADING STATE */}
            {isLoading ? (
              <>
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
                <StatSkeleton />
              </>
            ) : (
              <>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.activeJobs}</div>
                  <div className={styles.statLabel}>Active Jobs</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.totalApplicants}</div>
                  <div className={styles.statLabel}>Total Applicants</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.usersInChat}</div>
                  <div className={styles.statLabel}>Users in Chat</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.hiredEmployees}</div>
                  <div className={styles.statLabel}>Hired Employees</div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Your Job Posts</h2>
          </div>
          <div className={styles.gridContainer}>
            {/* JOBS LOADING STATE */}
            {isLoading ? (
              <>
                <JobSkeleton />
                <JobSkeleton />
                <JobSkeleton />
              </>
            ) : companyJobPosts.length > 0 ? (
              companyJobPosts.map(job => (
                <div key={job.id} className={styles.jobCard}>
                  <div className={styles.jobContent}>
                    <h3 className={styles.jobTitle}>{job.title}</h3>
                    <p className={styles.applicantsCount}>{job.applicantsCount} Applicants</p>
                    <p className={styles.postedDate}>{job.postedDate}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No job posts found.</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Users in Chat</h2>
          </div>
          <div className={styles.gridContainer}>
            {/* CHAT USERS LOADING STATE */}
            {isLoading ? (
              <>
                <ChatUserSkeleton />
                <ChatUserSkeleton />
              </>
            ) : usersInChat.length > 0 ? (
              usersInChat.map(user => (
                <div key={user.id} className={styles.inviteCard}>
                  <div className={styles.inviteContent}>
                    <h3 className={styles.userName}>{user.name}</h3>
                    <p className={styles.userPosition}>{user.position}</p>
                    <p className={styles.inviteMessage}>{user.message}</p>
                  </div>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.btnAccept}
                      onClick={() => handleAccept(user)}
                      disabled={actionLoading}
                    >
                      Accept
                    </button>
                    <button
                      className={styles.btnRefuse}
                      onClick={() => handleRefuse(user)}
                      disabled={actionLoading}
                    >
                      Refuse
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p>No users in chat.</p>
            )}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Hired Employees</h2>
          </div>
          <div className={styles.gridContainer}>
            {/* HIRED EMPLOYEES LOADING STATE */}
            {isLoading ? (
              <>
                <EmployeeSkeleton />
                <EmployeeSkeleton />
                <EmployeeSkeleton />
              </>
            ) : hiredEmployees.length > 0 ? (
              hiredEmployees.map(employee => (
                <div key={employee.id} className={styles.employeeCard}>
                  <div className={styles.employeeContent}>
                    <h3 className={styles.employeeName}>{employee.name}</h3>
                    <p className={styles.employeePosition}>{employee.position}</p>
                    <p className={styles.hireDate}>{employee.hireDate}</p>
                    <span className={`${styles.statusBadge} ${styles[employee.status.toLowerCase()]}`}>
                      {employee.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p>No hired employees yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Hire Modal */}
      {showHireModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Hire {selectedUser?.name}</h3>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleHireSubmit}>
              <div className={styles.modalBody}>
                {/* Application selection dropdown - only show if user has multiple applications */}
                {selectedUser?.applications && selectedUser.applications.length > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Application to Hire For *</label>
                    <select
                      className={styles.formInput}
                      value={selectedApplicationId || ''}
                      onChange={(e) => handleApplicationSelect(e.target.value)}
                      required
                    >
                      {selectedUser.applications.map(app => (
                        <option key={app.applicationId} value={app.applicationId}>
                          {app.jobRole} ({app.jobType})
                        </option>
                      ))}
                    </select>
                    {selectedUser.applications.length > 1 && (
                      <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                        This user has applied for {selectedUser.applications.length} jobs. Only the selected application will be processed.
                      </small>
                    )}
                  </div>
                )}
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Job Name / Position *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={hireFormData.jobName}
                    onChange={(e) => setHireFormData({ ...hireFormData, jobName: e.target.value })}
                    placeholder="e.g. Frontend Developer"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Date *</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={hireFormData.startDate}
                    min={getTodayDate()}
                    onChange={(e) => setHireFormData({ ...hireFormData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Date (Optional)</label>
                  <input
                    type="date"
                    className={styles.formInput}
                    value={hireFormData.endDate}
                    min={getTodayDate()}
                    onChange={(e) => setHireFormData({ ...hireFormData, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={closeModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnSubmit}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Hiring...' : 'Hire User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Refuse Modal */}
      {showRefuseModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Refuse {selectedUser?.name}</h3>
              <button className={styles.modalCloseBtn} onClick={closeModal}>
                ×
              </button>
            </div>
            <form onSubmit={handleRefuseSubmit}>
              <div className={styles.modalBody}>
                {/* Application selection dropdown */}
                {selectedUser?.applications && selectedUser.applications.length > 0 && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Select Application to Refuse *</label>
                    <select
                      className={styles.formInput}
                      value={refuseApplicationId || ''}
                      onChange={(e) => setRefuseApplicationId(parseInt(e.target.value))}
                      required
                    >
                      {selectedUser.applications.map(app => (
                        <option key={app.applicationId} value={app.applicationId}>
                          {app.jobRole} ({app.jobType})
                        </option>
                      ))}
                    </select>
                    {selectedUser.applications.length > 1 && (
                      <small style={{ color: '#888', marginTop: '4px', display: 'block' }}>
                        This user has applied for {selectedUser.applications.length} jobs. Only the selected application will be refused and deleted.
                      </small>
                    )}
                  </div>
                )}
                <p style={{ color: '#666', marginTop: '10px' }}>
                  Are you sure you want to refuse this application? This will delete the application from the system.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={closeModal}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.btnRefuse}
                  disabled={actionLoading}
                  style={{ marginLeft: '10px' }}
                >
                  {actionLoading ? 'Refusing...' : 'Refuse Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default CompanyDashboard;