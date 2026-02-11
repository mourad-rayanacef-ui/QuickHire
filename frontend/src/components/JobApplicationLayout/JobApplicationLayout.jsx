import React, { useState, useEffect, useMemo } from 'react';
import JobApplicationsList from "../JobApplicationList/JobApplicationList.jsx";
import JobInvitationList from "../JobInvitationList/JobInvitationList.jsx";
import SuccessPopup from '../UAcceptation/UAcceptationPop.jsx';
import styles from './JobApplicationLayout.module.css';
import jobseek from '../../../public/jobseek.svg';
import { userAPI } from '../../services/api';

function JobApplicationLayout() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeTab, setActiveTab] = useState('applications');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentInvitationPage, setCurrentInvitationPage] = useState(1);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ Store ALL data for accurate counts and filtering
  const [allApplicationsData, setAllApplicationsData] = useState([]);
  const [allInvitationsData, setAllInvitationsData] = useState([]);
  
  const applicationsPerPage = 5;
  const invitationsPerPage = 5;

  // ✅ Fetch ALL applications once when component mounts or tab changes
  useEffect(() => {
    if (activeTab === 'applications') {
      fetchAllApplications();
    }
  }, [activeTab]);

  // ✅ Fetch ALL invitations once when tab switches to invitations
  useEffect(() => {
    if (activeTab === 'invitations') {
      fetchAllInvitations();
    }
  }, [activeTab]);

  // ✅ Fetch ALL applications (not paginated) for accurate counts
  const fetchAllApplications = async () => {
    try {
      setLoading(true);
      // Fetch with large limit to get all applications
      const response = await userAPI.getApplications(1, 1000);
      
      if (response.success) {
        // Transform backend data to frontend format
        const transformedData = response.data.map(app => ({
          id: app.Application_id,
          CompanyName: app.job?.company?.Name || 'Unknown Company',
          CompanyLogo: app.job?.company?.Logo,
          Score: app.job?.company?.Rating || 0,
          Roles: app.job?.Job_role || 'Unknown Role',
          DateApplied: formatDate(app.date),
          Type: normalizeType(app.job?.Type) || 'Full-time',
          Status: app.Status || 'Applied',
          companyLocation: app.job?.company?.MainLocation,
          skills: app.job?.Job_Skills?.map(s => s.Name) || []
        }));
        
     
        setAllApplicationsData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setAllApplicationsData([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch ALL invitations (not paginated) for accurate counts
  const fetchAllInvitations = async () => {
    try {
      setLoading(true);
      // Fetch with large limit to get all invitations
      const response = await userAPI.getInvitations(1, 1000);
      
      if (response.success) {
        const transformedData = response.data.map(inv => ({
          id: inv.Invitation_id,
          companyName: inv.company?.Name || 'Unknown Company',
          companyLogo: inv.company?.Logo,
          companyId: inv.Company_id,
          score: inv.company?.Rating || 0,
          roles: inv.Job_Name || 'Unknown Role',
          dateReceived: formatDate(inv.Date),
          type: normalizeType(inv.Type) || 'Full-time',
          status: 'Pending',
          companyLocation: inv.company?.MainLocation
        }));
       
        setAllInvitationsData(transformedData);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
      setAllInvitationsData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ✅ Normalize type to standard format
  const normalizeType = (type) => {
    if (!type) return 'Full-time';
    const lowerType = type.toLowerCase().replace(/\s+/g, '-');
    
    if (lowerType.includes('full')) return 'Full-time';
    if (lowerType.includes('part')) return 'Part-time';
    if (lowerType.includes('remote')) return 'Remote';
    if (lowerType.includes('intern')) return 'Internship';
    if (lowerType.includes('contract')) return 'Contract';
    
    return type;
  };

  // ✅ Client-side filtering and pagination for Applications
  const { filteredApplications, paginatedApplications, totalApplicationsPages } = useMemo(() => {

    // Apply filter
    const filtered = activeFilter === 'All' 
      ? allApplicationsData 
      : allApplicationsData.filter(app => app.Type?.toLowerCase() === activeFilter.toLowerCase());
    

    // Apply pagination
    const startIndex = (currentPage - 1) * applicationsPerPage;
    const endIndex = startIndex + applicationsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / applicationsPerPage);
    
    return {
      filteredApplications: filtered,
      paginatedApplications: paginated,
      totalApplicationsPages: totalPages || 1
    };
  }, [allApplicationsData, activeFilter, currentPage]);

  // ✅ Client-side filtering and pagination for Invitations
  const { filteredInvitations, paginatedInvitations, totalInvitationsPages } = useMemo(() => {
    // Apply filter
    const filtered = activeFilter === 'All' 
      ? allInvitationsData 
      : allInvitationsData.filter(inv => inv.type?.toLowerCase() === activeFilter.toLowerCase());
    
    // Apply pagination
    const startIndex = (currentInvitationPage - 1) * invitationsPerPage;
    const endIndex = startIndex + invitationsPerPage;
    const paginated = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / invitationsPerPage);
    
    return {
      filteredInvitations: filtered,
      paginatedInvitations: paginated,
      totalInvitationsPages: totalPages || 1
    };
  }, [allInvitationsData, activeFilter, currentInvitationPage]);

  // ✅ Counts based on ALL data (not just current page)
  const counts = useMemo(() => {
    const source = activeTab === 'applications' ? allApplicationsData : allInvitationsData;
    
    const allCount = source.length;
    const fullTimeCount = source.filter(app => {
      const type = (app.Type || app.type || '').toLowerCase();
      return type === 'full-time';
    }).length;
    const partTimeCount = source.filter(app => {
      const type = (app.Type || app.type || '').toLowerCase();
      return type === 'part-time';
    }).length;
    const remoteCount = source.filter(app => {
      const type = (app.Type || app.type || '').toLowerCase();
      return type === 'remote';
    }).length;
    const internshipCount = source.filter(app => {
      const type = (app.Type || app.type || '').toLowerCase();
      return type === 'internship';
    }).length;

    console.log('📊 Filter counts:', {
      all: allCount,
      fullTime: fullTimeCount,
      partTime: partTimeCount,
      remote: remoteCount,
      internship: internshipCount
    });

    return {
      all: allCount,
      fullTime: fullTimeCount,
      partTime: partTimeCount,
      remote: remoteCount,
      internship: internshipCount
    };
  }, [activeTab, allApplicationsData, allInvitationsData]);

  const handleAcceptInvitation = async (invitation) => {
    console.log('Invitation accepted:', invitation);
    setSelectedInvitation(invitation);
    setShowSuccessPopup(true);
  };

  const handleClosePopup = () => {
    if (selectedInvitation) {
      // Refresh invitations after acceptance
      fetchAllInvitations();
    }
    setShowSuccessPopup(false);
    setSelectedInvitation(null);
  };

  const handleTabChange = (tab) => {
    if (activeTab !== tab) {
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveTab(tab);
        setActiveFilter('All');
        setCurrentPage(1);
        setCurrentInvitationPage(1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleApplicationsPageChange = (page) => {
    if (page >= 1 && page <= totalApplicationsPages) {
      setCurrentPage(page);
    }
  };

  const handleInvitationsPageChange = (page) => {
    if (page >= 1 && page <= totalInvitationsPages) {
      setCurrentInvitationPage(page);
    }
  };

  const handleFilterChange = (filter) => {
    console.log('🔍 Filter changed to:', filter);
    setActiveFilter(filter);
    setCurrentPage(1);
    setCurrentInvitationPage(1);
  };

  // Pagination Sub-component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
      <div className={styles.pagination}>
        <button 
          className={`${styles.pageButton} ${currentPage === 1 ? styles.disabled : ''}`}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          &lt;
        </button>
        
        <div className={styles.pageNumbers}>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              className={`${styles.pageNumber} ${currentPage === index + 1 ? styles.active : ''}`}
              onClick={() => onPageChange(index + 1)}
            >
              {index + 1}
            </button>
          ))}
        </div>
        
        <button 
          className={`${styles.pageButton} ${currentPage === totalPages ? styles.disabled : ''}`}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          &gt;
        </button>
      </div>
    );
  };

  return (
    <div className={styles.jobApplicationLayout}>
      <header className={styles.header}>
        <div className={styles.Det}>
          <h1 className={styles.title}>Total Applications:</h1>
          <div className={styles.stats}>
            <span 
              className={`${styles.statItem} ${activeFilter === 'All' ? styles.active : ''}`}
              onClick={(e) => { 
                e.preventDefault(); 
                handleFilterChange('All');
              }}
            >
              All (<span className={`${styles.statNum} ${activeFilter === 'All' ? styles.activeNum : ''}`}>{counts.all}</span>)
            </span>
            <span 
              className={`${styles.statItem} ${activeFilter === 'Full-time' ? styles.active : ''}`}
              onClick={(e) => { 
                e.preventDefault(); 
                handleFilterChange('Full-time');
              }}
            >
              Full-time (<span className={`${styles.statNum} ${activeFilter === 'Full-time' ? styles.activeNum : ''}`}>{counts.fullTime}</span>)
            </span>
            <span 
              className={`${styles.statItem} ${activeFilter === 'Part-time' ? styles.active : ''}`}
              onClick={(e) => { 
                e.preventDefault(); 
                handleFilterChange('Part-time');
              }}
            >
              Part-time (<span className={`${styles.statNum} ${activeFilter === 'Part-time' ? styles.activeNum : ''}`}>{counts.partTime}</span>)
            </span>
            <span 
              className={`${styles.statItem} ${activeFilter === 'Remote' ? styles.active : ''}`}
              onClick={(e) => { 
                e.preventDefault(); 
                handleFilterChange('Remote');
              }}
            >
              Remote (<span className={`${styles.statNum} ${activeFilter === 'Remote' ? styles.activeNum : ''}`}>{counts.remote}</span>)
            </span>
            <span 
              className={`${styles.statItem} ${activeFilter === 'Internship' ? styles.active : ''}`}
              onClick={(e) => { 
                e.preventDefault(); 
                handleFilterChange('Internship');
              }}
            >
              Internship (<span className={`${styles.statNum} ${activeFilter === 'Internship' ? styles.activeNum : ''}`}>{counts.internship}</span>)
            </span>
          </div>
        </div>
        <img src={jobseek} alt="Job seeking" className={styles.jobseek} />
      </header>

      <section className={styles.historySection}>
        <div className={styles.navigation}>
          <div>
            <h2 className={styles.sectionTitle}>
              {activeTab === 'applications' ? 'My Applications History' : 'Invitations'}
            </h2>
          </div>
          <div className={styles.BtnContainer}>
            <a 
              className={`${styles.AppBtn} ${activeTab === 'applications' ? styles.activeBtn : ''}`}
              onClick={() => handleTabChange('applications')}
            >
              Applications
            </a>
            <a 
              className={`${styles.InvBtn} ${activeTab === 'invitations' ? styles.activeBtn : ''}`}
              onClick={() => handleTabChange('invitations')}
            >
              Invitations
            </a>
          </div>
        </div>
        
        <div className={`${styles.tabContent} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
          
          {/* Loading State */}
          {loading && (
            <div className={styles.loading}>
              <p>Loading...</p>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && paginatedApplications.length === 0 && paginatedInvitations.length === 0 && (
            <div className={styles.emptyState}>
              <p>No {activeTab === 'applications' ? 'applications' : 'invitations'} found{activeFilter !== 'All' ? ` for filter: ${activeFilter}` : ''}.</p>
            </div>
          )}

          {/* Applications Tab */}
          {!loading && activeTab === 'applications' && paginatedApplications.length > 0 && (
            <div className={styles.paginatedSection}>
              <JobApplicationsList applications={paginatedApplications} />
              
              <PaginationControls 
                currentPage={currentPage}
                totalPages={totalApplicationsPages}
                onPageChange={handleApplicationsPageChange}
              />
            </div>
          )}
          
          {/* Invitations Tab */}
          {!loading && activeTab === 'invitations' && paginatedInvitations.length > 0 && (
            <div className={styles.paginatedSection}>
              <JobInvitationList 
                invitations={paginatedInvitations} 
                onAccept={handleAcceptInvitation} 
              />
              
              <PaginationControls 
                currentPage={currentInvitationPage}
                totalPages={totalInvitationsPages}
                onPageChange={handleInvitationsPageChange}
              />
            </div>
          )}
        </div>
      </section>

      <SuccessPopup 
        isOpen={showSuccessPopup}
        onClose={handleClosePopup}
        companyName={selectedInvitation?.companyName}
        jobRole={selectedInvitation?.roles}
      />
    </div>
  );
}

export default JobApplicationLayout;