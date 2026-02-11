import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import FilterObject from "../../../components/filtring/filtring";
import Logo from "../../../../public/LOGO.svg";
import MenuIcon from "../../../public/sidebar.svg";
import NotificationIcon from "../../../public/notification.svg";
import JobPost from "../../../components/projectcard/post";
import Pagination from "../../../components/pagintion/Pagination";
import SideBar from "../../../components/SideBar/SideBar";
import Search from "../../../components/searchbar/SearchBar";
import NavBar from "../../../components/NavBar/NavBar";
import ChatBot from "../../../components/chatbot/ChatBot";
import Alert from "../../../components/Alert/Alert";
import api from "../../../api/api";
import styles from "./JobPostPage.module.css";
import HiringPic from "../../../public/WeAreHiring.png";
import "../../../index.css";

// --- SKELETON COMPONENT (The Blur Effect) ---
const JobSkeleton = () => (
  <div className={styles.skeletonCard}>
    <div className={styles.skeletonHeader}>
      {/* Logo Placeholder */}
      <div className={`${styles.skeletonLogo} ${styles.shimmer}`}></div>
      <div className={styles.skeletonTitleBlock}>
        {/* Title Line */}
        <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '60%', height: '20px', marginBottom: '10px' }}></div>
        {/* Company Name Line */}
        <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '40%', height: '14px' }}></div>
      </div>
    </div>

    {/* Tags/Stats Placeholder */}
    <div className={styles.skeletonTags}>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '80px', height: '24px', borderRadius: '15px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '80px', height: '24px', borderRadius: '15px' }}></div>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '80px', height: '24px', borderRadius: '15px' }}></div>
    </div>

    {/* Description Placeholder */}
    <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '100%', height: '60px', marginTop: '20px', borderRadius: '8px' }}></div>

    {/* Button Placeholder */}
    <div className={styles.skeletonFooter}>
      <div className={`${styles.skeletonLine} ${styles.shimmer}`} style={{ width: '120px', height: '40px', borderRadius: '8px' }}></div>
    </div>
  </div>
);

function JobPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ EmploymentType: [], Categories: [] });
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [processedEvents, setProcessedEvents] = useState(new Set());

  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', message: '' });

  const jobsPerPage = 4;

  const showNotification = useCallback((message, type = 'success') => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  }, []);

  const getUserId = useCallback(() => {
    try {
      const accountType = localStorage.getItem("accountType");
      const userData = localStorage.getItem("user");
      if (!userData || userData === "[object Object]" || userData === "null") return null;
      const parsedUser = JSON.parse(userData);
      if (accountType === "user") {
        return parsedUser.User_id || parsedUser.userId || parsedUser.id;
      }
      return null;
    } catch (error) {
      console.error('Error in getUserId:', error);
      return null;
    }
  }, []);

  const currentUserId = getUserId();

  const fetchJobs = async (page) => {
    // Get applied jobs from localStorage
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');

    const { data } = await api.get('/User/Jobs', {
      params: {
        page: page,
        limit: jobsPerPage,
        search: query,
        userId: currentUserId
      }
    });

    if (data.success) {
      // Filter out already applied jobs
      const filteredJobs = data.jobs.filter(job => !appliedJobs.includes(job.id));

      const transformedJobs = filteredJobs.map(job => ({
        id: job.id,
        pic: job.company.logo || "https://placehold.co/64x64",
        title: job.title,
        companyName: job.company.name,
        companyRating: job.company.rating || 2.5,
        companyEmployees: job.company.employeesCount || 0,
        info: "More Details",
        infolink: `/job/${job.id}`,
        stats: {
          addressicon: "https://placehold.co/16x16",
          address: job.company.location || "Remote",
          jobtypeicon: "https://placehold.co/16x16",
          jobtype: job.type || "Full-time",
          jobcategory: job.category || "General",
          durationicon: "https://placehold.co/16x16",
          duration: "Ongoing",
        },
        description: job.description || "No description available",
        skills: job.skills.map(skill => skill.name) || [],
        applicantsicon: "https://placehold.co/16x16",
        applicants: job.applicationsCount || 0,
        button: { text: "Apply Now", link: "" },
        hasApplied: appliedJobs.includes(job.id)
      }));

      // Set available total (adjusted for already applied jobs)
      const adjustedTotal = data.total - (data.jobs.length - filteredJobs.length);
      if (page === 1) {
        setAvailableTotal(adjustedTotal);
      }

      return {
        jobs: transformedJobs,
        total: data.total,
        filteredTotal: adjustedTotal,
        page: data.page,
        totalPages: data.totalPages,
        hasNextPage: data.hasNextPage
      };
    } else {
      showNotification(data.error || 'Failed to fetch jobs', 'error');
      throw new Error(data.error || 'Failed to fetch jobs');
    }
  };

  const {
    data,
    isLoading,
    isError,
    error,
    isPlaceholderData
  } = useQuery({
    queryKey: ['jobs', currentPage, query, currentUserId],
    queryFn: () => fetchJobs(currentPage),
    staleTime: 1000 * 60 * 5,
    placeholderData: (previousData) => previousData,
  });

  const rawJobs = data?.jobs || [];
  const totalPages = Math.max(1, Math.ceil(availableTotal / jobsPerPage));
  const hasNextPage = data?.hasNextPage || false;

  // Update availableTotal when new data comes in
  useEffect(() => {
    if (data && currentPage === 1) {
      setAvailableTotal(data.filteredTotal || data.total);
    }
  }, [data, currentPage]);

  // FIXED: Better auto-navigation that works for both directions
  useEffect(() => {
    if (!isLoading && rawJobs.length === 0 && availableTotal > 0) {

      // If we have next page, go to it
      if (currentPage < totalPages) {

        setCurrentPage(currentPage + 1);
      }
      // If we're on last page and it's empty, check previous pages
      else if (currentPage > 1) {
        console.log(`📤 Last page empty, checking previous pages...`);

        // Try to find a page with jobs in cache
        for (let page = currentPage - 1; page >= 1; page--) {
          const cachedData = queryClient.getQueryData(['jobs', page, query, currentUserId]);
          if (cachedData?.jobs?.length > 0) {
            console.log(`✅ Found jobs on page ${page}, navigating there`);
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
  }, [rawJobs.length, isLoading, availableTotal, currentPage, totalPages, query, currentUserId, queryClient]);

  // Pre-fetch next page
  useEffect(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: ['jobs', nextPage, query, currentUserId],
        queryFn: () => fetchJobs(nextPage),
      });
    }
  }, [currentPage, totalPages, query, currentUserId, queryClient]);

  // Listen for job applied events from JobDetailsPage
  useEffect(() => {
    const handleJobApplied = (event) => {
      const { jobId, eventId, source } = event.detail;

      // Prevent processing the same event multiple times
      if (processedEvents.has(eventId)) {
        return;
      }

      // Add to processed events
      setProcessedEvents(prev => new Set([...prev, eventId]));

      // Only process if event is from JobDetailsPage
      if (source === 'JobDetailsPage') {
        console.log('📢 Received job applied event from JobDetailsPage for job:', jobId);

        // Update available total
        setAvailableTotal(prev => Math.max(0, prev - 1));

        // Remove from query cache
        queryClient.setQueryData(
          ['jobs', currentPage, query, currentUserId],
          (oldData) => {
            if (!oldData) return oldData;

            const newJobs = oldData.jobs.filter(job => job.id !== jobId);

            console.log(`✅ Removed job ${jobId} from JobDetailsPage event.`);

            return {
              ...oldData,
              jobs: newJobs,
              filteredTotal: oldData.filteredTotal ? oldData.filteredTotal - 1 : oldData.total - 1
            };
          }
        );

        // Add to localStorage
        const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
        if (!appliedJobs.includes(jobId)) {
          appliedJobs.push(jobId);
          localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
        }
      }
    };

    window.addEventListener('jobApplied', handleJobApplied);

    return () => {
      window.removeEventListener('jobApplied', handleJobApplied);
    };
  }, [queryClient, currentPage, query, currentUserId, processedEvents]);

  const filteredJobs = useMemo(() => {
    return rawJobs.filter((job) => {
      const matchesEmploymentType =
        filters.EmploymentType.length === 0 ||
        filters.EmploymentType.includes(job.stats.jobtype);

      const matchesCategories =
        filters.Categories.length === 0 ||
        filters.Categories.includes(job.stats.jobcategory);

      return matchesEmploymentType && matchesCategories;
    });
  }, [rawJobs, filters]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ Handle job application from JobPost component
  const handleApplySuccess = useCallback((jobId, jobTitle) => {

    // Add to applied jobs in localStorage
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
    if (!appliedJobs.includes(jobId)) {
      appliedJobs.push(jobId);
      localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
    }

    // Decrease available total
    setAvailableTotal(prev => {
      const newTotal = Math.max(0, prev - 1);
      console.log(`📉 Available total decreased: ${prev} → ${newTotal}`);
      return newTotal;
    });

    // Remove from query cache
    queryClient.setQueryData(
      ['jobs', currentPage, query, currentUserId],
      (oldData) => {
        if (!oldData) return oldData;

        const newJobs = oldData.jobs.filter(job => job.id !== jobId);

        console.log(`✅ Removed job ${jobId}. Before: ${oldData.jobs.length}, After: ${newJobs.length}`);

        return {
          ...oldData,
          jobs: newJobs,
          filteredTotal: oldData.filteredTotal ? oldData.filteredTotal - 1 : oldData.total - 1
        };
      }
    );

    // Show notification
    if (jobTitle && jobTitle.trim()) {
      showNotification(`Applied to ${jobTitle}!`, 'success');
    } else {
      showNotification('Application submitted successfully!', 'success');
    }

  }, [queryClient, currentPage, query, currentUserId, showNotification]);

  // Reset processed events when changing pages or search
  useEffect(() => {
    setProcessedEvents(new Set());
  }, [currentPage, query]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 900);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
            onClick={() => navigate('../Notifications')}
          />
        </div>
      )}

      <div className={`${styles.SideBarContainer} ${isMobile ? styles.SideBarMobile : ""} ${sidebarOpen && isMobile ? styles.SideBarMobileOpen : ""}`}>
        <NavBar />
        <SideBar />
      </div>

      {isMobile && sidebarOpen && (
        <div className={styles.MobileNavBarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      <main className={styles.Main}>
        <header className={styles.Header}>
          <div className={styles.SearchBar}>
            <h3>Find Your Dream Job Instantly</h3>
            {isMobile && (
              <div className={styles.MobileFilterContainer}>
                <FilterObject jobs={rawJobs} onFilterChange={setFilters} />
              </div>
            )}
            <Search onSearch={(val) => { setQuery(val); setCurrentPage(1); }} />
          </div>
        </header>

        <section className={styles.Pub}>
          {!isMobile && (
            <section id="global-filter" className={styles.Filter}>
              <FilterObject jobs={rawJobs} onFilterChange={setFilters} />
            </section>
          )}

          <section className={styles.Candidates}>
            <div className={styles.SearchHeader}>
              <div>
                <h5>All Jobs</h5>
                <p>Showing ({filteredJobs.length}) Results out of ({availableTotal})</p>
              </div>
              <img src={HiringPic} alt="Get Hired" width="90px" height="90px" />
            </div>

            {isError && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
                <p>Error: {error.message}</p>
                <button onClick={() => queryClient.invalidateQueries(['jobs'])}>Try Again</button>
              </div>
            )}

            {isLoading && !isPlaceholderData ? (
              <div className={styles.JobPost}>
                {[1, 2, 3, 4].map((n) => (
                  <JobSkeleton key={n} />
                ))}
              </div>
            ) : (
              <div className={`${styles.JobPost} ${isPlaceholderData ? styles['loading-blur'] : ''}`}>
                {filteredJobs.length > 0 ? (
                  filteredJobs.map((job) => (
                    <JobPost
                      key={job.id}
                      post={job}
                      onApplySuccess={handleApplySuccess}
                      showAlert={showNotification}
                    />
                  ))
                ) : (
                  <div className={styles.noResults}>
                    {availableTotal > 0 ? (
                      <>
                        <p>No jobs available on this page.</p>
                        <div className={styles.autoNavMessage}>
                          <p>Automatically navigating to next available page...</p>
                          <div className={styles.spinner}></div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p>No jobs found matching your criteria.</p>
                        <p>Try adjusting your search filters or check back later.</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {filteredJobs.length > 0 && totalPages > 1 && (
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

export default JobPage;