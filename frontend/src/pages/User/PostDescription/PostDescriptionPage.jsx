import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import "./PostDescriptionPage.css";
import { useNavigate, useParams } from 'react-router-dom';
import api from "../../../services/api"; // ✅ Import the api instance

// Skeleton Component for Loading State
const JobDetailsSkeleton = () => (
  <div className="jd-wrapper loading-blur">
    <header className="jd-top">
      <div className="jd-back">
        <button className="back-btn skeleton-btn" aria-label="back"></button>
        <div className="back-text">
          <div className="title skeleton-line" style={{ width: '60%', height: '24px', marginBottom: '8px' }}></div>
          <div className="subtitle skeleton-line" style={{ width: '40%', height: '16px' }}></div>
        </div>
      </div>
    </header>

    <main className="jd-main">
      <section className="jd-left">
        <div className="company-row">
          <div className="company-badge skeleton-badge"></div>
          <div className="company-name skeleton-line" style={{ width: '200px', height: '24px' }}></div>
        </div>

        <div className="section description">
          <h3 className="skeleton-line" style={{ width: '120px', height: '20px', marginBottom: '16px' }}></h3>
          <div className="skeleton-line" style={{ width: '100%', height: '80px', marginBottom: '8px' }}></div>
          <div className="skeleton-line" style={{ width: '80%', height: '80px' }}></div>
        </div>

        <div className="section">
          <h3 className="skeleton-line" style={{ width: '150px', height: '20px', marginBottom: '16px' }}></h3>
          {[1, 2, 3].map(i => (
            <div key={i} className="check-list">
              <li>
                <span className="check skeleton-check"></span>
                <span className="li-text skeleton-line" style={{ width: `${80 + i * 10}%`, height: '16px' }}></span>
              </li>
            </div>
          ))}
        </div>

        <div className="section">
          <h3 className="skeleton-line" style={{ width: '130px', height: '20px', marginBottom: '16px' }}></h3>
          {[1, 2, 3].map(i => (
            <div key={i} className="check-list">
              <li>
                <span className="check skeleton-check"></span>
                <span className="li-text skeleton-line" style={{ width: `${70 + i * 10}%`, height: '16px' }}></span>
              </li>
            </div>
          ))}
        </div>

        <div className="apply-wrap">
          <button className="apply-now skeleton-btn" style={{ width: '150px', height: '44px' }}></button>
        </div>
      </section>

      <aside className="jd-right">
        <div className="card about-role">
          <div className="card-head">
            <h4 className="skeleton-line" style={{ width: '140px', height: '18px' }}></h4>
          </div>
          
          <div className="applied-row">
            <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
            <div className="progress-bar skeleton-bar"></div>
          </div>
          
          <div className="meta">
            {[1, 2, 3].map(i => (
              <div key={i} className="meta-line">
                <span className="meta-title skeleton-line" style={{ width: '60px', height: '14px' }}></span>
                <span className="meta-value skeleton-line" style={{ width: '80px', height: '14px' }}></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h4 className="skeleton-line" style={{ width: '100px', height: '18px', marginBottom: '12px' }}></h4>
          <div className="pill-row">
            <span className="pill skeleton-pill" style={{ width: '80px', height: '32px' }}></span>
            <span className="pill skeleton-pill" style={{ width: '60px', height: '32px' }}></span>
          </div>
        </div>

        <div className="card">
          <h4 className="skeleton-line" style={{ width: '140px', height: '18px', marginBottom: '12px' }}></h4>
          <div className="skill-tags">
            {[1, 2, 3, 4].map(i => (
              <span key={i} className="skill-tag skeleton-skill" style={{ width: `${60 + i * 20}px`, height: '32px' }}></span>
            ))}
          </div>
        </div>
      </aside>
    </main>
  </div>
);

export default function JobDetailsPage() {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const queryClient = useQueryClient();

  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasDispatchedEvent, setHasDispatchedEvent] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const getUserId = () => {
    try {
      const accountType = localStorage.getItem("accountType");
      const userData = localStorage.getItem("user");
      
      if (!userData || userData === "[object Object]" || userData === "null") {
        return null;
      }
      
      const parsedUser = JSON.parse(userData);
      
      if (accountType === "user") {
        const userId = 
          parsedUser.User_id ||
          parsedUser.userId ||
          parsedUser.id ||
          parsedUser.Company_id;
        
        return userId;
      }
      return null;
    } catch (error) {
      console.error('Error in getUserId:', error);
      return null;
    }
  };

  const userId = getUserId();

  const accountType = localStorage.getItem("accountType");
  const isCompany = accountType === "company";

  const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ✅ Optimized job details query with api instance
  const { data: jobData, isLoading, error } = useQuery({
    queryKey: ['jobDetails', jobId],
    queryFn: async () => {
      const { data } = await api.get(`/User/Jobs/${jobId}`);

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch job details');
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!jobId,
  });

  const job = jobData?.job;

  // Check if job is already applied from localStorage
  useEffect(() => {
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
    if (appliedJobs.includes(parseInt(jobId))) {
      setApplied(true);
    }
  }, [jobId]);

  // Update applied status when job data loads
  useEffect(() => {
    if (jobData?.hasApplied) {
      setApplied(true);
    }
  }, [jobData]);

  // ✅ Mutation for applying to job using api instance
  const applyMutation = useMutation({
    mutationFn: async () => {
      const userId = getUserId();
      const accountType = localStorage.getItem("accountType");

      if (!localStorage.getItem("token")) {
        throw new Error("You must be logged in to apply for a job.");
      }

      if (accountType !== "user") {
        throw new Error("Only users can apply for jobs.");
      }

      if (!userId) {
        throw new Error("Unable to retrieve your user information.");
      }

      if (isNaN(userId) || userId <= 0) {
        throw new Error(`Invalid user ID: ${userId}.`);
      }

      // ✅ CORRECT - Send ONLY the IDs, no nested objects
const { data } = await api.post('/User/Applications', {
  userId: Number(userId),  // ✅ Send as plain number, not in an object
  jobId: Number(jobId)     // ✅ Send as plain number
});

      if (!data.success) {
        throw new Error(data.error || 'Failed to apply');
      }

      return data;
    },
    onMutate: () => {
      setApplying(true);
    },
    onSuccess: (data) => {
      setApplied(true);
      setHasDispatchedEvent(true);
      
      // Update localStorage
      const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
      if (!appliedJobs.includes(parseInt(jobId))) {
        appliedJobs.push(parseInt(jobId));
        localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
      }
      
      // Show success notification
      const message = data.notifications?.company?.created
        ? `✅ Applied to ${truncateText(job?.title, 30)}! Company notified.`
        : `✅ Applied to ${truncateText(job?.title, 30)}!`;
      showNotification(message, 'success');
      
      // Dispatch event to update other components
      const eventId = `details-apply-${jobId}-${Date.now()}`;
      console.log('📢 Dispatching job applied event:', eventId);
      
      window.dispatchEvent(new CustomEvent('jobApplied', {
        detail: {
          jobId: parseInt(jobId),
          jobTitle: job?.title,
          eventId: eventId,
          source: 'JobDetailsPage'
        }
      }));
      
      // Invalidate the job details query to reflect the change
      queryClient.invalidateQueries(['jobDetails', jobId]);
    },
    onError: (error) => {
      console.error('❌ Error applying to job:', error);

      if (error.message.includes('already applied') || error.message.includes('Duplicate')) {
        setApplied(true);
        setHasDispatchedEvent(true);
        showNotification('You have already applied to this job.', 'info');
      } else if (error.message.includes('Invalid token') || error.message.includes('No token')) {
        showNotification('Your session has expired. Please log in again.', 'error');
        navigate('/SignIn');
      } else {
        showNotification(`Failed to apply: ${error.message}`, 'error');
      }
    },
    onSettled: () => {
      setApplying(false);
    }
  });

  const handleApply = () => {
    if (applied || applying || hasDispatchedEvent) {
      return;
    }

    applyMutation.mutate();
  };

  const handleReturn = () => {
    navigate(-1);
  };

  if (isLoading) {
    return <JobDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="jd-wrapper" style={{ textAlign: 'center', padding: '50px' }}>
        <p style={{ color: 'red' }}>Error: {error.message}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="jd-wrapper" style={{ textAlign: 'center', padding: '50px' }}>
        <p>Job not found</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  const progressPct = job.capacity > 0
    ? Math.min(100, Math.round((job.applicationsCount / job.capacity) * 100))
    : 0;

  return (
    <div className="jd-wrapper">
      {notification && (
        <div className={`notification-overlay ${notification.type}`}>
          <div className="notification-content">
            <div className="notification-icon">
              {notification.type === 'success' && '✅'}
              {notification.type === 'error' && '❌'}
              {notification.type === 'info' && 'ℹ️'}
            </div>
            <div className="notification-message">{notification.message}</div>
          </div>
        </div>
      )}
      
      <header className="jd-top">
        <div className="jd-back">
          <button className="back-btn" aria-label="back" onClick={handleReturn}>
            ←
          </button>
          <div className="back-text">
            <div className="title">{truncateText(job.title, 50)}</div>
            <div className="subtitle">{truncateText(job.type, 30)} · {truncateText(job.category, 30)}</div>
          </div>
        </div>
      </header>

      <main className="jd-main">
        <section className="jd-left">
          <div className="company-row">
            <div className="company-badge">
              {job.company.logo ? (
                <img src={job.company.logo} alt={truncateText(job.company.name, 30)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              ) : (
                truncateText(job.company.name, 1)
              )}
            </div>
            <div className="company-name">{truncateText(job.company.name, 50)}</div>
          </div>

          <div className="section description">
            <h3>Description</h3>
            <p>{truncateText(job.description, 500)}</p>
          </div>

          {job.responsibilities && (
            <div className="section">
              <h3>Responsibilities</h3>
              <ul className="check-list">
                {job.responsibilities.split('\n').filter(r => r.trim()).map((r, i) => (
                  <li key={i}>
                    <span className="check" />
                    <span className="li-text">{truncateText(r, 150)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.whoYouAre && (
            <div className="section">
              <h3>Who You Are</h3>
              <ul className="check-list">
                {job.whoYouAre.split('\n').filter(w => w.trim()).map((w, i) => (
                  <li key={i}>
                    <span className="check" />
                    <span className="li-text">{truncateText(w, 150)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.niceToHave && (
            <div className="section">
              <h3>Nice-To-Haves</h3>
              <ul className="check-list">
                {job.niceToHave.split('\n').filter(n => n.trim()).map((n, i) => (
                  <li key={i}>
                    <span className="check" />
                    <span className="li-text">{truncateText(n, 150)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {localStorage.getItem("accountType") === "user" && (
            <div className="apply-wrap">
              <button 
                className={`apply-now ${applied ? 'applied' : ''}`}
                onClick={handleApply}
                disabled={applied || applying || hasDispatchedEvent}
              >
                {applying ? "Applying..." : applied ? "✔ Applied" : "Apply Now"}
              </button>
            </div>
          )}
        </section>

        <aside className="jd-right">
          <div className="card about-role">
            <div className="card-head">
              <h4>About this role</h4>
            </div>

            <div className="applied-row">
              <div className="applied-text">
                <strong>{job.applicationsCount}</strong> applied
                {job.capacity && (
                  <span> of <span className="muted">{job.capacity} capacity</span></span>
                )}
              </div>

              {job.capacity && (
                <div className="progress-bar" role="progressbar" aria-valuenow={progressPct} aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
              )}
            </div>

            <div className="meta">
              <div className="meta-line">
                <span className="meta-title">Job Type</span>
                <span className="meta-value">{truncateText(job.type, 30)}</span>
              </div>
              <div className="meta-line">
                <span className="meta-title">Category</span>
                <span className="meta-value">{truncateText(job.category, 30)}</span>
              </div>
              <div className="meta-line">
                <span className="meta-title">Location</span>
                <span className="meta-value">{truncateText(job.company.location || 'Remote', 30)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h4>Categories</h4>
            <div className="pill-row">
              <span className="pill">{truncateText(job.category, 25)}</span>
              <span className="pill">{truncateText(job.type, 25)}</span>
            </div>
          </div>

          <div className="card">
            <h4>Required Skills</h4>
            <div className="skill-tags">
              {job.skills && job.skills.length > 0 ? (
                job.skills.map((s, i) => (
                  <span 
                    key={i} 
                    className="skill-tag"
                  >
                    {truncateText(s.name, 20)}
                  </span>
                ))
              ) : (
                <span className="skill-tag">No skills specified</span>
              )}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}