import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import CompanyFilterObject from "../../../components/CompanyFilter/CompanyFilter";
import CandidatePost from "../../../components/CandidateCard/CandidateCard";
import ChatBot from "../../../components/chatbot/ChatBot";
import Pagination from "../../../components/pagintion/Pagination";
import SideBarCompany from "../../../components/SideBar/SideBarCompany";
import Search from "../../../components/searchbar/SearchBar";
import Navbarcompany from "../../../components/navbarcompany/navbarcompany.jsx";
import Alert from "../../../components/Alert/Alert";
import Logo from "../../../../public/LOGO.svg";
import MenuIcon from "../../../../public/sidebar.svg";
import NotificationIcon from "../../../../public/notification.svg";
import styles from "./UserPostPage.module.css";
import HiringPic from "../../../../public/WeAreHiring.png";
import "../../../index.css";

// --- SKELETON COMPONENT ---
const CandidateSkeleton = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonHeader}>
      <div className={`${styles.skeletonAvatar} ${styles.shimmer}`}></div>
      <div className={styles.skeletonTitleBlock}>
        <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '50%', height: '20px', marginBottom: '10px' }}></div>
        <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '30%', height: '14px' }}></div>
      </div>
    </div>
    <div className={styles.skeletonTags}>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '70px', height: '24px', borderRadius: '15px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '70px', height: '24px', borderRadius: '15px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '70px', height: '24px', borderRadius: '15px' }}></div>
    </div>
    <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '100%', height: '50px', marginTop: '20px', borderRadius: '8px' }}></div>
    <div className={styles.skeletonFooter}>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '120px', height: '40px', borderRadius: '8px' }}></div>
    </div>
  </div>
);

function CandidatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ ExperienceRange: [], Categories: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [processedEvents, setProcessedEvents] = useState(new Set());
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', message: '' });

  const candidatesPerPage = 4;

  const showNotification = useCallback((message, type = 'success') => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  }, []);

  const getCompanyId = useCallback(() => {
    try {
      const accountType = localStorage.getItem("accountType");
      const storedData = localStorage.getItem("user");

      if (!storedData || storedData === "[object Object]" || storedData === "null") {
        return null;
      }

      const parsedData = JSON.parse(storedData);

      if (accountType === "company") {
        return parsedData.Company_id || parsedData.companyId || parsedData.id;
      }
      return null;
    } catch (error) {
      console.error('Error in getCompanyId:', error);
      return null;
    }
  }, []);

  const currentCompanyId = getCompanyId();

  const fetchCandidates = async (page) => {
    const token = localStorage.getItem("token");
    const companyId = currentCompanyId;

    if (!companyId) {
      showNotification('Please log in as a company to view candidates', 'error');
      throw new Error('Please log in as a company to view candidates');
    }

    const params = new URLSearchParams({
      page: page,
      limit: candidatesPerPage,
      status: 'JobSeeker',
      companyId: companyId,
    });

    if (query) params.append('search', query);

    const url = `https://quickhire-4d8p.onrender.com/api/Company/Users?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    const data = await response.json();

    if (data.success) {
      const invitedCandidates = JSON.parse(localStorage.getItem('invitedCandidates') || '[]');
      const filteredCandidates = data.users.filter(user => !invitedCandidates.includes(user.id));

      const transformedCandidates = filteredCandidates.map(user => ({
        id: user.id,
        pic: user.photo || "https://via.placeholder.com/150",
        name: user.name || `${user.firstName} ${user.lastName}`,
        title: user.description || "Professional",
        company: "",
        stats: {
          experience: calculateExperience(user.experiences),
          jobcategory: getCategoryFromExperiences(user.experiences),
          ratings: [user.rating || 0],
          lastCompletedRole: user.lastCompletedRole || null,
          lastCompletedCompany: user.lastCompletedCompany || null,
          rating: user.rating || 2.5
        },
        description: user.description || "No description available",
        skills: user.skills?.map(skill => skill.title) || [],
        location: user.location || "Location not specified",
        availability: user.status === 'JobSeeker' ? 'Available' : 'Currently Working',
        hasInvited: invitedCandidates.includes(user.id)
      }));

      const adjustedTotal = data.total - (data.users.length - filteredCandidates.length);

      if (page === 1) {
        setAvailableTotal(adjustedTotal);
      }

      return {
        candidates: transformedCandidates,
        total: data.total,
        filteredTotal: adjustedTotal,
        page: data.page,
        totalPages: data.totalPages,
        hasNextPage: data.hasNextPage
      };
    } else {
      showNotification(data.error || 'Failed to fetch candidates', 'error');
      throw new Error(data.error || 'Failed to fetch candidates');
    }
  };

  const {
    data,
    isLoading,
    isError,
    error,
    isPlaceholderData
  } = useQuery({
    queryKey: ['candidates', currentPage, query, currentCompanyId],
    queryFn: () => fetchCandidates(currentPage),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });

  const rawCandidates = data?.candidates || [];
  const totalPages = Math.max(1, Math.ceil(availableTotal / candidatesPerPage));
  const hasNextPage = data?.hasNextPage || false;

  // Update availableTotal when new data comes in
  useEffect(() => {
    if (data && currentPage === 1) {
      setAvailableTotal(data.filteredTotal || data.total);
    }
  }, [data, currentPage]);

  // FIXED: Better auto-navigation that works for both directions
  useEffect(() => {
    if (!isLoading && rawCandidates.length === 0 && availableTotal > 0) {
      console.log('🔄 Current page empty, auto-navigating...');

      // If we have next page, go to it
      if (currentPage < totalPages) {
        console.log(`📥 Auto-fetching next page: ${currentPage + 1}`);
        setCurrentPage(currentPage + 1);
      }
      // If we're on last page and it's empty, check previous pages
      else if (currentPage > 1) {
        console.log(`📤 Last page empty, checking previous pages...`);

        // Try to find a page with candidates in cache
        for (let page = currentPage - 1; page >= 1; page--) {
          const cachedData = queryClient.getQueryData(['candidates', page, query, currentCompanyId]);
          if (cachedData?.candidates?.length > 0) {
            console.log(`✅ Found candidates on page ${page}, navigating there`);
            setCurrentPage(page);
            return;
          }
        }

        // If no cached data, just go to previous page
        console.log(`↩️ Going to previous page: ${currentPage - 1}`);
        setCurrentPage(currentPage - 1);
      }
    }

    // If current page exceeds total pages, adjust
    if (currentPage > totalPages && totalPages > 0 && !isLoading) {
      console.log(`📄 Adjusting from page ${currentPage} to ${totalPages}`);
      setCurrentPage(totalPages);
    }
  }, [rawCandidates.length, isLoading, availableTotal, currentPage, totalPages, query, currentCompanyId, queryClient]);

  // Pre-fetch next page
  useEffect(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: ['candidates', nextPage, query, currentCompanyId],
        queryFn: () => fetchCandidates(nextPage),
      });
    }
  }, [currentPage, totalPages, query, currentCompanyId, queryClient]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const calculateExperience = (experiences) => {
    if (!experiences || experiences.length === 0) return 0;
    const totalMonths = experiences.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 +
        (end.getMonth() - start.getMonth());
      return total + months;
    }, 0);
    return Math.floor(totalMonths / 12);
  };

  const getCategoryFromExperiences = (experiences) => {
    if (!experiences || experiences.length === 0) return "General";
    return experiences[0].title || "General";
  };

  const filteredCandidates = useMemo(() => {
    return rawCandidates.filter((candidate) => {
      const matchesExperience =
        !filters.ExperienceRange?.length ||
        filters.ExperienceRange.some((range) => {
          const exp = candidate.stats.experience || 0;
          switch (range) {
            case "0-4 Years": return exp >= 0 && exp < 4;
            case "4-6 Years": return exp >= 4 && exp < 6;
            case "6-8 Years": return exp >= 6 && exp < 8;
            case "8-10 Years": return exp >= 8 && exp < 10;
            case "10+ Years": return exp >= 10;
            default: return false;
          }
        });

      const matchesCategories =
        !filters.Categories?.length ||
        filters.Categories.includes(candidate.stats.jobcategory);

      return matchesExperience && matchesCategories;
    });
  }, [rawCandidates, filters]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCandidateInvite = useCallback((candidateId, candidateName) => {


    const invitedCandidates = JSON.parse(localStorage.getItem('invitedCandidates') || '[]');
    if (!invitedCandidates.includes(candidateId)) {
      invitedCandidates.push(candidateId);
      localStorage.setItem('invitedCandidates', JSON.stringify(invitedCandidates));
    }

    setAvailableTotal(prev => {
      const newTotal = Math.max(0, prev - 1);
      console.log(`📉 Available total decreased: ${prev} → ${newTotal}`);
      return newTotal;
    });

    queryClient.setQueryData(
      ['candidates', currentPage, query, currentCompanyId],
      (oldData) => {
        if (!oldData) return oldData;

        const newCandidates = oldData.candidates.filter(candidate => candidate.id !== candidateId);

        console.log(`✅ Removed candidate ${candidateId}. Before: ${oldData.candidates.length}, After: ${newCandidates.length}`);

        return {
          ...oldData,
          candidates: newCandidates,
          filteredTotal: oldData.filteredTotal ? oldData.filteredTotal - 1 : oldData.total - 1
        };
      }
    );

    if (candidateName && candidateName.trim()) {
      showNotification(`Invitation sent to ${candidateName}!`, 'success');
    } else {
      showNotification('Invitation sent successfully!', 'success');
    }

  }, [queryClient, currentPage, query, currentCompanyId, showNotification]);

  // Listen for invite events from UserDetailsPage
  useEffect(() => {
    const handleExternalInvite = (event) => {
      const { userId, eventId, source } = event.detail;

      if (processedEvents.has(eventId)) {
        return;
      }

      setProcessedEvents(prev => new Set([...prev, eventId]));

      if (source === 'UserDetailsPage') {
        console.log('📢 Received invite event from UserDetailsPage for user:', userId);

        setAvailableTotal(prev => Math.max(0, prev - 1));

        queryClient.setQueryData(
          ['candidates', currentPage, query, currentCompanyId],
          (oldData) => {
            if (!oldData) return oldData;

            const newCandidates = oldData.candidates.filter(candidate => candidate.id !== userId);

            console.log(`✅ Removed candidate ${userId} from UserDetailsPage event.`);

            return {
              ...oldData,
              candidates: newCandidates,
              filteredTotal: oldData.filteredTotal ? oldData.filteredTotal - 1 : oldData.total - 1
            };
          }
        );

        const invitedCandidates = JSON.parse(localStorage.getItem('invitedCandidates') || '[]');
        if (!invitedCandidates.includes(userId)) {
          invitedCandidates.push(userId);
          localStorage.setItem('invitedCandidates', JSON.stringify(invitedCandidates));
        }
      }
    };

    window.addEventListener('candidateInvited', handleExternalInvite);

    return () => {
      window.removeEventListener('candidateInvited', handleExternalInvite);
    };
  }, [queryClient, currentPage, query, currentCompanyId, processedEvents]);

  // Reset processed events when changing pages or search
  useEffect(() => {
    setProcessedEvents(new Set());
  }, [currentPage, query]);

  useEffect(() => {
    document.documentElement.style.overflowY = "scroll";
    document.body.style.overflowX = "hidden";
  }, []);

  return (
    <div className={styles.container}>
      {showAlert && (
        <Alert
          type={alertConfig.type}
          message={alertConfig.message}
          onClose={() => setShowAlert(false)}
          duration={3000}
          autoClose={true}
        />
      )}

      {isMobile && (
        <div className={styles.MobileHeader}>
          <img
            src={MenuIcon}
            alt="Menu"
            className={styles.MobileMenuIcon}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          />
          <img src={Logo} alt="Logo" className={styles.Logo} />
          <img
            src={NotificationIcon}
            alt="Notifications"
            className={styles.MobileNotification}
            onClick={() => navigate('../companynotifications')}
          />
        </div>
      )}

      <div className={`${styles.SideBarContainer} ${isMobile ? styles.SideBarMobile : ""} ${sidebarOpen && isMobile ? styles.SideBarMobileOpen : ""}`}>
        <Navbarcompany />
        <SideBarCompany />
      </div>

      {isMobile && sidebarOpen && (
        <div className={styles.MobileNavBarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      <main className={styles.Main}>
        <header className={styles.Header}>
          <div className={styles.SearchBar}>
            <h3>Find Skilled Professionals In Minutes</h3>
            {isMobile && (
              <div className={styles.MobileFilterContainer}>
                <CompanyFilterObject
                  jobs={rawCandidates}
                  onFilterChange={setFilters}
                />
              </div>
            )}
            <Search onSearch={(val) => { setQuery(val); setCurrentPage(1); }} />
          </div>
        </header>

        <section className={styles.Pub}>
          {!isMobile && (
            <section id="global-filter" className={styles.Filter}>
              <CompanyFilterObject
                jobs={rawCandidates}
                onFilterChange={setFilters}
              />
            </section>
          )}

          <section className={styles.Candidates}>
            <div className={styles.SearchHeader}>
              <div>
                <h5>All Candidates</h5>
                <p>Showing ({filteredCandidates.length}) Results out of ({availableTotal})</p>
              </div>
              <img src={HiringPic} alt="Get Hired" width="90px" height="90px" />
            </div>

            {isError && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                <p>Error: {error.message}</p>
                <button onClick={() => queryClient.invalidateQueries(['candidates'])}>
                  Try Again
                </button>
              </div>
            )}

            {isLoading && !isPlaceholderData ? (
              <div className={styles.CandidateList}>
                {[1, 2, 3, 4].map((n) => (
                  <CandidateSkeleton key={n} />
                ))}
              </div>
            ) : (
              <div className={`${styles.CandidateList} ${isPlaceholderData ? styles['loading-blur'] : ''}`}>
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <CandidatePost
                      key={candidate.id}
                      {...candidate}
                      onInvite={handleCandidateInvite}
                      showAlert={showNotification}
                    />
                  ))
                ) : (
                  <div className={styles.noResults}>
                    {availableTotal > 0 ? (
                      <>
                        <p>No candidates available on this page.</p>
                        <div className={styles.autoNavMessage}>
                          <p>Automatically navigating to next available page...</p>
                          <div className={styles.spinner}></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p>No candidates found matching your criteria.</p>
                        <p>Try adjusting your search filters or check back later.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {filteredCandidates.length > 0 && totalPages > 1 && (
              <div className={styles.Pagination}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </section>
        </section>
      </main>

      <ChatBot />
    </div>
  );
}

export default CandidatePage;