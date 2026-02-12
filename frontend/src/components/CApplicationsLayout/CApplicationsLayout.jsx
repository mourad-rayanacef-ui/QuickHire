import React, { useState, useEffect } from 'react';
import CApplicationsList from "../CompanyWaitingList/CApplicationsList/CApplicationList.jsx";
import CInvitationList from '../CompanyWaitingList/CInvitationList/CInvitationList.jsx';
import SuccessPopup from '../CAcceptation/CAcceptationPop.jsx';
import styles from "./CApplicationsLayout.module.css";
import { companyAPI } from '../../services/api';

function CApplicationsLayout() {

  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('applicants');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);


  const [loading, setLoading] = useState(false);

  // Backend data states
  const [allApplicants, setAllApplicants] = useState([]); // Store all unfiltered data
  const [applicants, setApplicants] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [allInvitations, setAllInvitations] = useState([]); // Store all unfiltered invitations
  const [applicantsPagination, setApplicantsPagination] = useState(null);
  const [invitationsPagination, setInvitationsPagination] = useState(null);

  const itemsPerPage = 5;

  // Fetch data when tab changes (fetch ALL data once)
  useEffect(() => {
    if (activeTab === 'applicants') {
      fetchAllApplicants();
    } else {
      fetchAllInvitations();
    }
  }, [activeTab]);

  // Re-filter when filter or page changes
  useEffect(() => {
    if (activeTab === 'applicants' && allApplicants.length > 0) {
      applyFilterAndPagination(allApplicants, activeFilter, currentPage);
    }
  }, [activeFilter, currentPage, allApplicants]);

  useEffect(() => {
    if (activeTab === 'invitations' && allInvitations.length > 0) {
      applyFilterAndPagination(allInvitations, activeFilter, currentPage, true);
    }
  }, [activeFilter, currentPage, allInvitations]);

  const fetchAllApplicants = async () => {
    try {
      setLoading(true);
      // Fetch ALL applicants with a large limit
      const response = await companyAPI.getApplicants(1, 1000); // Fetch up to 1000

      if (response.success) {
        // Transform backend data to frontend format
        const transformedData = response.data.map(app => ({
          id: app.Application_id,
          name: `${app.user?.FirstName || ''} ${app.user?.LastName || ''}`.trim() || 'Unknown',
          score: app.user?.Rating || 0,
          appliedDate: formatDate(app.date),
          jobRole: app.job?.Job_role || 'Unknown Role',
          type: normalizeType(app.job?.Type) || 'Full-time',
          photo: app.user?.Photo,
          email: app.user?.Email,
          location: app.user?.Location,
          userId: app.User_id,
          jobId: app.Job_id,
          status: app.Status
        }));

        // Store all data
        setAllApplicants(transformedData);

        // Apply initial filter and pagination
        applyFilterAndPagination(transformedData, activeFilter, currentPage);
      }
    } catch (error) {
      console.error('Error fetching applicants:', error);
      setApplicants([]);
      setAllApplicants([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilterAndPagination = (data, filter, page, isInvitation = false) => {
    // Apply filter
    const filtered = filter === 'All'
      ? data
      : data.filter(item => item.type.toLowerCase() === filter.toLowerCase());

    // Apply pagination
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);

    // Update state
    if (isInvitation) {
      setInvitations(paginated);
      setInvitationsPagination({
        page,
        limit: itemsPerPage,
        totalCount: filtered.length,
        totalPages: Math.ceil(filtered.length / itemsPerPage)
      });
    } else {
      setApplicants(paginated);
      setApplicantsPagination({
        page,
        limit: itemsPerPage,
        totalCount: filtered.length,
        totalPages: Math.ceil(filtered.length / itemsPerPage)
      });
    }
  };

  const fetchAllInvitations = async () => {
    try {
      setLoading(true);
      // Fetch ALL invitations
      const response = await companyAPI.getInvitations(1, 1000); // Fetch up to 1000

      if (response.success) {
        const transformedData = response.data.map(inv => ({
          id: inv.Invitation_id,
          name: `${inv.user?.FirstName || ''} ${inv.user?.LastName || ''}`.trim() || 'Unknown',
          score: inv.user?.Rating || 0,
          appliedDate: formatDate(inv.Date),
          jobRole: inv.Job_Name || 'Unknown Role',
          type: normalizeType(inv.Type) || 'Full-time',
          photo: inv.user?.Photo,
          email: inv.user?.Email,
          location: inv.user?.Location
        }));

        // Store all data
        setAllInvitations(transformedData);

        // Apply initial filter and pagination
        applyFilterAndPagination(transformedData, activeFilter, currentPage, true);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setInvitations([]);
      setAllInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Normalize type to standard format
  const normalizeType = (type) => {
    if (!type) return 'Full-time';
    const lowerType = type.toLowerCase().replace(/\s+/g, '-');

    if (lowerType.includes('full')) return 'Full-time';
    if (lowerType.includes('part')) return 'Part-time';
    if (lowerType.includes('remote')) return 'Remote';
    if (lowerType.includes('intern')) return 'Internship';
    if (lowerType.includes('contract')) return 'Contract';

    return type; // Return original if no match
  };

  const handleAccept = async (applicantData) => {
  try {
    console.log('✅ Accepting applicant with data:', applicantData);
    
    // ✅ Call backend API to add user to Job_Hiring_History table
    const response = await companyAPI.acceptApplicant({
      applicationId: applicantData.applicationId,
      userId: applicantData.userId,
      jobId: applicantData.jobId,
      jobName: applicantData.roles
    });

    if (response.success) {
      // Show success popup
      setSelectedApplicant({
        fullName: applicantData.fullName,
        roles: applicantData.roles
      });
      setShowSuccessPopup(true);

      // Remove the accepted applicant from the list
      if (activeTab === 'applicants') {
        const updatedAllApplicants = allApplicants.filter(app => app.id !== applicantData.applicationId);
        setAllApplicants(updatedAllApplicants);
        applyFilterAndPagination(updatedAllApplicants, activeFilter, currentPage, false);
      }
    } else {
      alert('Failed to accept applicant. Please try again.');
    }
  } catch (error) {
    console.error('Error accepting applicant:', error);
    alert('Failed to accept applicant. Please try again.');
  }
};

  const handleClosePopup = () => {
    // ✅ No need to refresh - we already removed the applicant locally
    setShowSuccessPopup(false);
    setSelectedApplicant(null);

  };

  const handleTabChange = (tab) => {
    if (activeTab !== tab) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTab(tab);
        setCurrentPage(1);
        setActiveFilter('All');
        setIsTransitioning(false);
      }, 300);
    }
  };

  const getFilteredData = () => {
    return activeTab === "applicants" ? applicants : invitations;

  };

  const getApplicantCounts = () => {
    // Use all unfiltered data for accurate counts
    const source = activeTab === "applicants" ? allApplicants : allInvitations;

    return {
      all: source.length,
      fullTime: source.filter(app => {
        const type = (app.type || '').toLowerCase();
        return type === 'full-time';
      }).length,
      partTime: source.filter(app => {
        const type = (app.type || '').toLowerCase();
        return type === 'part-time';
      }).length,
      internship: source.filter(app => {
        const type = (app.type || '').toLowerCase();
        return type === 'internship';
      }).length,
      contract: source.filter(app => {
        const type = (app.type || '').toLowerCase();
        return type === 'contract';
      }).length,
      remote: source.filter(app => {
        const type = (app.type || '').toLowerCase();
        return type === 'remote';
      }).length
    };
  };

  const handleDeleteApplicant = async (applicationId) => {
  try {
    console.log('🗑️ Deleting application with ID:', applicationId);
    
    if (activeTab === "applicants") {
      // ✅ Call backend API to delete from Job_Applications table
      const response = await companyAPI.deleteApplication(applicationId);
      if (response.success) {
        // Refresh the list
        fetchAllApplicants();
      }
    } else {
      // Call backend API to delete from Invitations table
      const response = await companyAPI.deleteInvitation(applicationId);
      if (response.success) {
        // Refresh the list
        fetchAllInvitations();
      }
    }
  } catch (error) {
    console.error('Error deleting:', error);
    alert('Failed to delete. Please try again.');
  }
};

  const filteredData = getFilteredData();
  const currentPagination = activeTab === 'applicants' ? applicantsPagination : invitationsPagination;
  const totalPages = currentPagination?.totalPages || 1;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to page 1 when filter changes

  };

  const counts = getApplicantCounts();

  return (
    <div className={styles.jobApplicationLayout}>

      <header className={styles.header}>
        <div className={styles.Det}>

          <h1 className={styles.title}>Total Applicants:</h1>
          <div className={styles.stats}>
            <span
              className={`${styles.statItem} ${activeFilter === 'All' ? styles.active : ''}`}

              onClick={(e) => { e.preventDefault(); handleFilterChange('All'); }}
            >
              All (<span className={`${styles.statNum} ${activeFilter === 'All' ? styles.activeNum : ''}`}>{counts.all}</span>)
            </span>
            <span
              className={`${styles.statItem} ${activeFilter === 'Full-time' ? styles.active : ''}`}
              onClick={(e) => { e.preventDefault(); handleFilterChange('Full-time'); }}
            >
              Full-time (<span className={`${styles.statNum} ${activeFilter === 'Full-time' ? styles.activeNum : ''}`}>{counts.fullTime}</span>)
            </span>
            <span
              className={`${styles.statItem} ${activeFilter === 'Part-time' ? styles.active : ''}`}
              onClick={(e) => { e.preventDefault(); handleFilterChange('Part-time'); }}
            >
              Part-time (<span className={`${styles.statNum} ${activeFilter === 'Part-time' ? styles.activeNum : ''}`}>{counts.partTime}</span>)
            </span>
            <span
              className={`${styles.statItem} ${activeFilter === 'Internship' ? styles.active : ''}`}
              onClick={(e) => { e.preventDefault(); handleFilterChange('Internship'); }}
            >
              Internship (<span className={`${styles.statNum} ${activeFilter === 'Internship' ? styles.activeNum : ''}`}>{counts.internship}</span>)
            </span>
            <span
              className={`${styles.statItem} ${activeFilter === 'Contract' ? styles.active : ''}`}
              onClick={(e) => { e.preventDefault(); handleFilterChange('Contract'); }}
            >
              Contract (<span className={`${styles.statNum} ${activeFilter === 'Contract' ? styles.activeNum : ''}`}>{counts.contract}</span>)
            </span>
            <span
              className={`${styles.statItem} ${activeFilter === 'remote' ? styles.active : ''}`}
              onClick={(e) => { e.preventDefault(); handleFilterChange('remote'); }}
            >
              Remote (<span className={`${styles.statNum} ${activeFilter === 'remote' ? styles.activeNum : ''}`}>{counts.remote}</span>)
            </span>

          </div>

        </div>
      </header>

      <section className={styles.historySection}>
        <div className={styles.navigation}>
          <div><h2 className={styles.sectionTitle}>
            {activeTab === 'applicants' ? 'Applicants List' : 'Invitation List'}
          </h2></div>
          <div className={styles.BtnContainer}>
            <a
              className={`${styles.AppBtn} ${activeTab === 'applicants' ? styles.activeBtn : ''}`}
              onClick={() => handleTabChange('applicants')}
            >
              Applicants
            </a>
            <a
              className={`${styles.InvBtn} ${activeTab === 'invitation' ? styles.activeBtn : ''}`}
              onClick={() => handleTabChange('invitation')}
            >
              Invitation
            </a>
          </div>
        </div>



        <div className={`${styles.tabContent} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
          {loading && <div className={styles.loading}>Loading...</div>}

          {!loading && filteredData.length === 0 && (
            <div className={styles.emptyState}>
              <p>No {activeTab === 'applicants' ? 'applicants' : 'invitations'} found.</p>
            </div>
          )}

          {!loading && activeTab === 'applicants' && filteredData.length > 0 && (
            <div className={styles.paginatedSection}>
              <CApplicationsList
                applicants={filteredData}
                onDelete={handleDeleteApplicant}
                onAccept={handleAccept}
              />


              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}

                  >
                    &lt;
                  </button>

                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index + 1}
                        className={`${styles.pageNumber} ${currentPage === index + 1 ? styles.active : ''}`}
                        onClick={() => handlePageChange(index + 1)}

                        disabled={loading}

                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                    onClick={() => handlePageChange(currentPage + 1)}

                    disabled={currentPage === totalPages || loading}

                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>
          )}


          {!loading && activeTab === 'invitation' && filteredData.length > 0 && (
            <div className={styles.paginatedSection}>
              <CInvitationList
                applicants={filteredData}
                onDelete={handleDeleteApplicant}
              />


              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}

                  >
                    &lt;
                  </button>

                  <div className={styles.pageNumbers}>
                    {Array.from({ length: totalPages }, (_, index) => (
                      <button
                        key={index + 1}
                        className={`${styles.pageNumber} ${currentPage === index + 1 ? styles.active : ''}`}
                        onClick={() => handlePageChange(index + 1)}

                        disabled={loading}

                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}

                  >
                    &gt;
                  </button>
                </div>
              )}
            </div>

          )}
        </div>
      </section>


      <SuccessPopup

        isOpen={showSuccessPopup}
        onClose={handleClosePopup}
        applicantName={selectedApplicant?.fullName}
        jobRole={selectedApplicant?.roles}
      />
    </div>
  );
}


export default CApplicationsLayout;