import { useState, useEffect } from "react";
import styles from "./post.module.css";
import PropTypes from "prop-types";
import { Link, useNavigate } from 'react-router-dom';
import { Star, Users } from "lucide-react";
import api from "../../services/api"; // ✅ Import the api instance

function JobPost({ post, onApplySuccess, showAlert }) {
  const navigate = useNavigate();
  const [applied, setApplied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [hasRemoved, setHasRemoved] = useState(false);
  const [processedEvents, setProcessedEvents] = useState(new Set());

  useEffect(() => {
    // Get user info from localStorage
    const getUserInfo = () => {
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
          
          const userName = 
            `${parsedUser.FirstName || ''} ${parsedUser.LastName || ''}`.trim() ||
            parsedUser.Name ||
            "User";
          
          setUserId(userId);
          setUserName(userName);
          return { userId, userName };
        }
        return null;
      } catch (error) {
        console.error('Error in getUserInfo:', error);
        return null;
      }
    };

    getUserInfo();
    
    // Check if already applied from localStorage
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
    if (appliedJobs.includes(post.id)) {
      console.log('✅ Job already applied (from localStorage)');
      setApplied(true);
      setHasRemoved(true);
    }
  }, [post.id]);

  // Listen for job applied events from JobDetailsPage
  useEffect(() => {
    const handleExternalApply = (event) => {
      const { jobId, eventId, source } = event.detail;
      
      // Prevent processing the same event multiple times
      if (processedEvents.has(eventId)) {
        return;
      }
      
      if (jobId === post.id) {
        // Add to processed events
        setProcessedEvents(prev => new Set([...prev, eventId]));
        
        // Only update local state if event is from JobDetailsPage
        if (source === 'JobDetailsPage') {
          setApplied(true);
          setHasRemoved(true);
        }
      }
    };

    window.addEventListener('jobApplied', handleExternalApply);
    
    return () => {
      window.removeEventListener('jobApplied', handleExternalApply);
    };
  }, [post.id, processedEvents]);

  const handleApply = async () => {
  // Check if already applied
  if (applied || applying || hasRemoved) {
    console.log('⏸️ Apply blocked:', { applied, applying, hasRemoved });
    return;
  }

  const token = localStorage.getItem("token");
  const accountType = localStorage.getItem("accountType");

  // Check if user is logged in
  if (!token) {
    if (showAlert) {
      showAlert("You must be logged in to apply for a job.", 'error');
    } else {
      alert("You must be logged in to apply for a job.");
    }
    navigate('/SignIn');
    return;
  }

  // Check if this is a USER account
  if (accountType !== "user") {
    if (showAlert) {
      showAlert("Only users can apply for jobs.", 'error');
    } else {
      alert("Only users can apply for jobs.");
    }
    return;
  }

  // ✅ GET FRESH USER ID FROM LOCALSTORAGE
  let currentUserId = null;
  try {
    const userData = localStorage.getItem("user");
    if (userData && userData !== "[object Object]" && userData !== "null") {
      const parsedUser = JSON.parse(userData);
      currentUserId = parsedUser.User_id || parsedUser.userId || parsedUser.id || parsedUser.Company_id;
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }

  // Check if we got a valid user ID
  if (!currentUserId) {
    if (showAlert) {
      showAlert("Unable to retrieve your user information. Please log in again.", 'error');
    } else {
      alert("Unable to retrieve your user information. Please log in again.");
    }
    navigate('/SignIn');
    return;
  }

  // ✅ SAFE JOB ID EXTRACTION
  const jobId = post?.id || post?.Job_id || post?.jobId;
  
  if (!jobId) {
    console.error('❌ No job ID found!', post);
    showAlert('Invalid job data - missing ID', 'error');
    return;
  }

  // ✅ DEBUG LOG
  console.log('📦 JobPost apply payload:', { 
    userId: currentUserId, 
    jobId: jobId,
    userIdType: typeof currentUserId,
    jobIdType: typeof jobId,
    parsedUserId: Number(currentUserId),
    parsedJobId: Number(jobId)
  });

  try {
    setApplying(true);

    console.log('📤 Sending application to backend...', { 
      userId: currentUserId, 
      jobId: jobId 
    });

    // ✅ FIXED: Use currentUserId, not the state variable
    const { data: applicationData } = await api.post('/User/Applications', {
      userId: Number(currentUserId),  // ✅ Ensure it's a number
      jobId: Number(jobId)           // ✅ Ensure it's a number
    });

    if (!applicationData.success) {
      throw new Error(applicationData.error || 'Failed to apply');
    }

    console.log('✅ Application submitted successfully!');
    
    // Update local state
    setApplied(true);
    setHasRemoved(true);
    setUserId(currentUserId); // ✅ Update state AFTER successful application
    
    // Add to localStorage
    const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
    if (!appliedJobs.includes(jobId)) {
      appliedJobs.push(jobId);
      localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
    }
    
    // ✅ Call parent to remove job from list
    if (onApplySuccess && typeof onApplySuccess === 'function') {
      console.log('📞 Calling onApplySuccess callback for job:', jobId);
      onApplySuccess(jobId, post.title);
    }
    
    // Show notification
    if (showAlert) {
      showAlert(`Applied to ${post.title}! Notifications sent.`, 'success');
    }
    
    // Dispatch event
    const eventId = `job-card-apply-${jobId}-${Date.now()}`;
    window.dispatchEvent(new CustomEvent('jobApplied', {
      detail: {
        jobId: jobId,
        jobTitle: post.title,
        eventId: eventId,
        source: 'JobPost'
      }
    }));

  } catch (error) {
    console.error('❌ Error applying to job:', error);

    if (error.message.includes('already applied') || error.message.includes('Duplicate')) {
      setApplied(true);
      setHasRemoved(true);
      
      const appliedJobs = JSON.parse(localStorage.getItem('appliedJobs') || '[]');
      if (!appliedJobs.includes(jobId)) {
        appliedJobs.push(jobId);
        localStorage.setItem('appliedJobs', JSON.stringify(appliedJobs));
      }
      
      if (showAlert) {
        showAlert('You have already applied to this job.', 'info');
      }
    } else if (error.message.includes('Invalid token') || error.message.includes('No token')) {
      if (showAlert) {
        showAlert('Your session has expired. Please log in again.', 'error');
      } else {
        alert('Your session has expired. Please log in again.');
      }
      navigate('/SignIn');
    } else {
      if (showAlert) {
        showAlert(`Failed to apply: ${error.message}`, 'error');
      } else {
        alert(`Failed to apply: ${error.message}`);
      }
    }
  } finally {
    setApplying(false);
  }
};

  // Check if job already has applied flag from backend
  useEffect(() => {
    if (post.hasApplied) {
      setApplied(true);
      setHasRemoved(true);
    }
  }, [post.hasApplied]);

  // Format company rating display
  const renderCompanyRating = (rating) => {
    const displayRating = rating || 2.5;
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Star size={14} fill="#FFD700" color="#FFD700" />
        {Number(displayRating).toFixed(1)}
      </span>
    );
  };

  // Format employee count display
  const formatEmployeeCount = (count) => {
    if (!count || count === 0) return "Not specified";
    if (count < 50) return "1-50";
    if (count < 200) return "50-200";
    if (count < 1000) return "200-1K";
    if (count < 5000) return "1K-5K";
    return "5K+";
  };

  return (
    <div className={styles.JobCard}>
      <div className={styles.Header}>
        <div className={styles.HeaderLeft}>
          <img 
            src={post.pic} 
            alt={post.companyName}
            onError={(e) => { e.target.src = "https://placehold.co/64x64"; }}
          />
          <div className={styles.HeaderLeftText}>
            <h2>{post.title}</h2>
            <h4>{post.companyName}</h4>
          </div>
        </div>
        <Link to={`/User/job-details/${post.id}`}>More Details</Link>
      </div>

      <div className={styles.JobStats}>
        <div>
          <img src={post.stats.addressicon} alt="address" /> {post.stats.address}
        </div>
        <div>
          <img src={post.stats.jobtypeicon} alt="job type" /> {post.stats.jobtype}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={16} color="#666" />
          <span>{formatEmployeeCount(post.companyEmployees)}</span>
        </div>
      </div>

      <div className={styles.Description}>
        <p>{post.description}</p>
      </div>

      <div className={styles.collector}>
        <div className={styles.JobSkill}>
          {post.skills && post.skills.length > 0 ? (
            post.skills.map((skill, i) => (
              <span key={i} className={styles.Text}>{skill}</span>
            ))
          ) : (
            <span className={styles.Text}>No skills listed</span>
          )}
        </div>

        <div className={styles.Footer}>
          <div className={styles.ApplicantsInfo} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {post.applicants > 0 && (
              <span>{post.applicants} applicant{post.applicants !== 1 ? 's' : ''}</span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', color: '#666' }}>
              Company: {renderCompanyRating(post.companyRating)}
            </span>
          </div>
          
          {localStorage.getItem("accountType") === "user" && (
            <button
              type="button"
              className={`${styles.ApplyButton} ${applied ? styles.applied : ""}`}
              onClick={handleApply}
              disabled={applied || applying || hasRemoved}
            >
              {applying ? "Applying..." : applied ? "✔ Applied" : "Apply Now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

JobPost.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.number.isRequired,
    pic: PropTypes.string,
    title: PropTypes.string.isRequired,
    companyName: PropTypes.string.isRequired,
    companyRating: PropTypes.number,
    companyEmployees: PropTypes.number,
    infolink: PropTypes.string,
    stats: PropTypes.shape({
      addressicon: PropTypes.string,
      address: PropTypes.string,
      jobtypeicon: PropTypes.string,
      jobtype: PropTypes.string,
      durationicon: PropTypes.string,
      duration: PropTypes.string,
    }).isRequired,
    description: PropTypes.string,
    skills: PropTypes.array,
    applicants: PropTypes.number,
    hasApplied: PropTypes.bool,
  }).isRequired,
  onApplySuccess: PropTypes.func,
  showAlert: PropTypes.func,
};

export default JobPost;