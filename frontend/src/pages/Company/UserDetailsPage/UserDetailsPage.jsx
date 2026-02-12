import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from 'react-router-dom';
import { Star, MapPin, Mail, Phone, Linkedin, Globe, Briefcase } from "lucide-react";
import "./UserDetailsPage.css";
import api from "../../../services/api"; // ✅ Import the api instance

// Skeleton Component for Loading State - MATCHING JobDetailsPage STYLE
const UserDetailsSkeleton = () => (
  <div className="ud-wrapper" style={{ position: 'relative', minHeight: '100vh' }}>
    <div className="loading-overlay"></div>
    <header className="ud-top">
      <div className="ud-back">
        <button className="back-btn skeleton-btn" aria-label="back"></button>
        <div className="back-text">
          <div className="title skeleton-line" style={{ width: '60%', height: '24px', marginBottom: '8px' }}></div>
          <div className="subtitle skeleton-line" style={{ width: '40%', height: '16px' }}></div>
        </div>
      </div>
    </header>

    <main className="ud-main">
      <section className="ud-left">
        <div className="profile-header">
          <div className="profile-pic skeleton-badge" style={{ width: '120px', height: '120px', borderRadius: '50%' }}></div>
          <div className="profile-info">
            <h2 className="skeleton-line" style={{ width: '200px', height: '28px', marginBottom: '12px' }}></h2>
            <div className="skeleton-line" style={{ width: '100px', height: '24px', marginBottom: '12px' }}></div>
            <p className="profile-title skeleton-line" style={{ width: '80%', height: '20px' }}></p>
          </div>
        </div>

        <div className="section">
          <h3 className="skeleton-line" style={{ width: '160px', height: '20px', marginBottom: '16px' }}></h3>
          <div className="contact-list">
            {[1, 2, 3].map(i => (
              <div key={i} className="contact-item">
                <div className="skeleton-line" style={{ width: '18px', height: '18px' }}></div>
                <div className="skeleton-line" style={{ width: `${150 + i * 20}px`, height: '16px' }}></div>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3 className="skeleton-line" style={{ width: '180px', height: '20px', marginBottom: '16px' }}></h3>
          <div className="experience-list">
            {[1, 2].map(i => (
              <div key={i} className="experience-item">
                <div className="exp-header">
                  <h4 className="skeleton-line" style={{ width: '200px', height: '18px' }}></h4>
                  <span className="exp-duration skeleton-line" style={{ width: '120px', height: '14px' }}></span>
                </div>
                <p className="exp-company skeleton-line" style={{ width: '150px', height: '16px', marginBottom: '8px' }}></p>
                <p className="exp-description skeleton-line" style={{ width: '90%', height: '40px' }}></p>
              </div>
            ))}
          </div>
        </div>

        <div className="invite-wrap">
          <button className="invite-btn skeleton-btn" style={{ width: '180px', height: '44px' }}></button>
        </div>
      </section>

      <aside className="ud-right">
        <div className="card">
          <h4 className="skeleton-line" style={{ width: '80px', height: '18px', marginBottom: '12px' }}></h4>
          <div className="meta">
            {[1, 2].map(i => (
              <div key={i} className="meta-line">
                <span className="meta-title skeleton-line" style={{ width: '60px', height: '14px' }}></span>
                <span className="meta-value skeleton-line" style={{ width: '80px', height: '14px' }}></span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h4 className="skeleton-line" style={{ width: '70px', height: '18px', marginBottom: '12px' }}></h4>
          <div className="skill-tags">
            {[1, 2, 3, 4].map(i => (
              <span key={i} className="skill-tag skeleton-skill" style={{ width: `${60 + i * 20}px`, height: '32px' }}></span>
            ))}
          </div>
        </div>

        <div className="card">
          <h4 className="skeleton-line" style={{ width: '140px', height: '18px', marginBottom: '12px' }}></h4>
          <div className="applications-list">
            {[1, 2].map(i => (
              <div key={i} className="application-item">
                <span className="app-job skeleton-line" style={{ width: '120px', height: '16px' }}></span>
                <span className="app-status skeleton-line" style={{ width: '60px', height: '24px', borderRadius: '12px' }}></span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </main>
  </div>
);

export default function UserDetailsPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const queryClient = useQueryClient();

  const [inviting, setInviting] = useState(false);
  const [invited, setInvited] = useState(false);
  const [notification, setNotification] = useState(null);
  const [hasDispatchedEvent, setHasDispatchedEvent] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);

  // Scroll to top when loading starts
  useEffect(() => {
    if (!isPageReady) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [isPageReady]);

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getCompanyId = () => {
    try {
      const accountType = localStorage.getItem("accountType");
      const rawUser = localStorage.getItem("user");

      if (accountType !== "company") {
        return null;
      }

      if (!rawUser) {
        console.warn("No user found in localStorage");
        return null;
      }

      let user;
      try {
        user = JSON.parse(rawUser);
      } catch (e) {
        console.error("User data is not valid JSON", e);
        return null;
      }

      const companyId =
        user.company_id ??
        user.companyId ??
        user.Company_id ??
        user.id ??
        null;

      return companyId;
    } catch (error) {
      console.error("getCompanyId failed:", error);
      return null;
    }
  };

  // Check if user is already invited from localStorage
  useEffect(() => {
    const invitedCandidates = JSON.parse(localStorage.getItem('invitedCandidates') || '[]');
    if (invitedCandidates.includes(parseInt(userId))) {
      console.log('✅ User already invited (from localStorage)');
      setInvited(true);
    }
  }, [userId]);

  // ✅ FIXED: Optimized user details query with api instance - EXACTLY LIKE JobDetailsPage
  const { data: userData, isLoading, error } = useQuery({
    queryKey: ['userDetails', userId],
    queryFn: async () => {
      const { data } = await api.get(`/Company/Users/${userId}`);

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch user details');
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: !!userId,
    onSuccess: () => {
      setIsPageReady(true);
    },
    onError: () => {
      setIsPageReady(true);
    }
  });

  const user = userData?.user;

  // Update invited status when user data loads
  useEffect(() => {
    if (userData) {
      const invitedCandidates = JSON.parse(localStorage.getItem('invitedCandidates') || '[]');
      if (invitedCandidates.includes(parseInt(userId))) {
        setInvited(true);
      }
    }
  }, [userData, userId]);

  // ✅ FIXED: Mutation for inviting candidate using api instance
  const inviteMutation = useMutation({
    mutationFn: async ({ companyId, userId }) => {
      const token = localStorage.getItem("token");
      const accountType = localStorage.getItem("accountType");

      if (!token) {
        throw new Error("You must be logged in to send invitations.");
      }

      if (accountType !== "company") {
        throw new Error("Only companies can send invitations to candidates.");
      }

      if (!companyId) {
        throw new Error("Unable to retrieve your company information. Please try logging in again.");
      }

      if (isNaN(userId) || userId <= 0) {
        throw new Error(`Invalid user ID: ${userId}.`);
      }

      console.log('📤 UserDetails sending invitation:', { 
        companyId: Number(companyId), 
        userId: Number(userId) 
      });

      const { data } = await api.post('/Company/Invitations', {
        companyId: Number(companyId),
        userId: Number(userId),
        jobName: "Open Position",
        type: "Invitation"
      });

      if (!data.success) {
        throw new Error(data.error || 'Failed to send invitation');
      }

      return data;
    },
    onMutate: () => {
      setInviting(true);
    },
    onSuccess: (data) => {
      setInvited(true);
      setHasDispatchedEvent(true);
      
      // Update localStorage
      const invitedCandidates = JSON.parse(localStorage.getItem('invitedCandidates') || '[]');
      if (!invitedCandidates.includes(parseInt(userId))) {
        invitedCandidates.push(parseInt(userId));
        localStorage.setItem('invitedCandidates', JSON.stringify(invitedCandidates));
      }
      
      // Show success notification
      showNotification(`✅ Invitation sent to ${truncateText(user?.name, 20)}! The candidate has been notified.`, 'success');
      
      // Dispatch event to update other components
      const eventId = `details-invite-${userId}-${Date.now()}`;
      console.log('📢 Dispatching invite event:', eventId);
      
      window.dispatchEvent(new CustomEvent('candidateInvited', {
        detail: {
          userId: parseInt(userId),
          userName: user?.name,
          eventId: eventId,
          source: 'UserDetailsPage'
        }
      }));
      
      // Invalidate the user details query to reflect the change
      queryClient.invalidateQueries(['userDetails', userId]);
    },
    onError: (error) => {
      console.error('❌ Error inviting user:', error);

      const errorMessage = error.response?.data?.error || error.message || 'Failed to send invitation';
      
      if (errorMessage.includes('already') || errorMessage.includes('Duplicate')) {
        setInvited(true);
        setHasDispatchedEvent(true);
        showNotification('You have already invited this candidate.', 'info');
      } else {
        showNotification('Failed to send invitation: ' + errorMessage, 'error');
      }
    },
    onSettled: () => {
      setInviting(false);
    }
  });

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInvite = () => {
    if (invited || inviting || hasDispatchedEvent) {
      console.log('⏸️ Invite blocked:', { invited, inviting, hasDispatchedEvent });
      return;
    }

    const companyId = getCompanyId();
    
    if (!companyId) {
      showNotification("Unable to retrieve your company information. Please log in again.", 'error');
      return;
    }

    inviteMutation.mutate({
      companyId: Number(companyId),
      userId: Number(userId)
    });
  };

  const handleReturn = () => {
    navigate(-1);
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        color={i + 1 <= rating ? "#FFD700" : "#ddd"}
        fill={i + 1 <= rating ? "#FFD700" : "none"}
        style={{ marginRight: "4px" }}
      />
    ));

  if (isLoading) {
    return <UserDetailsSkeleton />;
  }

  if (error) {
    return (
      <div className="ud-wrapper" style={{ textAlign: 'center', padding: '50px' }}>
        <p style={{ color: 'red' }}>Error: {error.message}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="ud-wrapper" style={{ textAlign: 'center', padding: '50px' }}>
        <p>Candidate not found</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="ud-wrapper">
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
      
      <header className="ud-top">
        <div className="ud-back">
          <button className="back-btn" aria-label="back" onClick={handleReturn}>
            ←
          </button>
          <div className="back-text">
            <div className="title">{truncateText(user.name, 50)}</div>
            <div className="subtitle">{truncateText(user.status || 'Job Seeker', 30)}</div>
          </div>
        </div>
      </header>

      <main className="ud-main">
        <section className="ud-left">
          <div className="profile-header">
            <img 
              src={user.photo || "https://via.placeholder.com/150"} 
              alt={truncateText(user.name, 20)}
              className="profile-pic"
              onError={(e) => { e.target.src = "https://via.placeholder.com/150"; }}
            />
            <div className="profile-info">
              <h2>{truncateText(user.name, 40)}</h2>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ 
                  background: '#fbbf24', 
                  color: '#78350f',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  ⭐ {user.rating?.toFixed(1) || '0.0'} / 5
                </span>
              </div>
              
              <p className="profile-title">{truncateText(user.description || "Professional", 80)}</p>
            </div>
          </div>

          {(user.location || user.email || user.phoneNumber || user.linkedInLink || user.website) && (
            <div className="section">
              <h3>Contact Information</h3>
              <div className="contact-list">
                {user.location && (
                  <div className="contact-item">
                    <MapPin size={18} />
                    <span>{truncateText(user.location, 40)}</span>
                  </div>
                )}
                {user.email && (
                  <div className="contact-item">
                    <Mail size={18} />
                    <span>{truncateText(user.email, 40)}</span>
                  </div>
                )}
                {user.phoneNumber && (
                  <div className="contact-item">
                    <Phone size={18} />
                    <span>{truncateText(user.phoneNumber, 20)}</span>
                  </div>
                )}
                {user.linkedInLink && (
                  <div className="contact-item">
                    <Linkedin size={18} />
                    <a href={user.linkedInLink} target="_blank" rel="noopener noreferrer">
                      {truncateText("LinkedIn Profile", 40)}
                    </a>
                  </div>
                )}
                {user.website && (
                  <div className="contact-item">
                    <Globe size={18} />
                    <a href={user.website} target="_blank" rel="noopener noreferrer">
                      {truncateText("Personal Website", 40)}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {user.experiences && user.experiences.length > 0 && (
            <div className="section">
              <h3><Briefcase size={20} style={{ marginRight: '8px' }} />Work Experience</h3>
              <div className="experience-list">
                {user.experiences.map((exp, i) => (
                  <div key={i} className="experience-item">
                    <div className="exp-header">
                      <h4>{truncateText(exp.title, 40)}</h4>
                      <span className="exp-duration">
                        {new Date(exp.startDate).toLocaleDateString()} - 
                        {exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'Present'}
                      </span>
                    </div>
                    <p className="exp-company">{truncateText(exp.companyName, 40)}</p>
                    {exp.description && <p className="exp-description">{truncateText(exp.description, 150)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {localStorage.getItem("accountType") === "company" && (
            <div className="invite-wrap">
              <button 
                className={`invite-btn ${invited ? 'invited' : ''}`}
                onClick={handleInvite}
                disabled={invited || inviting || hasDispatchedEvent}
              >
                {inviting ? "Sending Invitation..." : invited ? "✔ Invited" : "Send Invitation"}
              </button>
            </div>
          )}
        </section>

        <aside className="ud-right">
          <div className="card">
            <h4>About</h4>
            <div className="meta">
              <div className="meta-line">
                <span className="meta-title">Status</span>
                <span className="meta-value">{truncateText(user.status || 'Job Seeker', 20)}</span>
              </div>
              {user.location && (
                <div className="meta-line">
                  <span className="meta-title">Location</span>
                  <span className="meta-value">{truncateText(user.location, 30)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h4>Skills</h4>
            <div className="skill-tags">
              {user.skills && user.skills.length > 0 ? (
                user.skills.map((skill, i) => (
                  <span key={i} className="skill-tag">
                    {truncateText(skill.title, 25)}
                  </span>
                ))
              ) : (
                <span className="skill-tag">No skills listed</span>
              )}
            </div>
          </div>

          {user.recentApplications && user.recentApplications.length > 0 && (
            <div className="card">
              <h4>Recent Applications</h4>
              <div className="applications-list">
                {user.recentApplications.map((app, i) => (
                  <div key={i} className="application-item">
                    <span className="app-job">{truncateText(app.jobTitle, 40)}</span>
                    <span className={`app-status ${app.status.toLowerCase()}`}>
                      {truncateText(app.status, 15)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}