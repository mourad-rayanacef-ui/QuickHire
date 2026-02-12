import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query'; 
import api from '../../api/api'; // ✅ Import the api instance
import styles from './Notifications.module.css';

// --- ICONS ---
const Icons = {
  Hired: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
  New_Invitation: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>,
  New_Contact: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  Completed: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>,
  New: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>,
  Default: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
};

// --- HELPERS ---
function getNotificationAssets(type) {
  const normalizedType = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'New';
  let icon = Icons.Default;
  let styleClass = styles.new;

  switch (normalizedType) {
    case 'Hired': icon = Icons.Hired; styleClass = styles.hired; break;
    case 'New_Invitation': icon = Icons.New_Invitation; styleClass = styles.new; break;
    case 'New_Contact': icon = Icons.New_Contact; styleClass = styles.new; break;
    case 'Completed': icon = Icons.Completed; styleClass = styles.completed; break;
    default: icon = Icons.New; styleClass = styles.new; break;
  }
  return { icon, styleClass, displayType: normalizedType.replace('_', ' ') };
}

function formatTimeAgo(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diffInMs = now - past;
  const minute = 60 * 1000, hour = 60 * minute, day = 24 * hour, month = 30 * day, year = 365 * day;

  if (diffInMs < minute) return "just now";
  if (diffInMs < hour) return `${Math.floor(diffInMs / minute)}m ago`;
  if (diffInMs < day) return `${Math.floor(diffInMs / hour)}h ago`;
  if (diffInMs < month) return `${Math.floor(diffInMs / day)}d ago`;
  if (diffInMs < year) return `${Math.floor(diffInMs / month)}mo ago`;
  return `${Math.floor(diffInMs / year)}y ago`;
}

// --- STAR RATING ---
const StarRating = ({ notificationId, userRole, initialIsRated }) => {
  const [isSubmitted, setIsSubmitted] = useState(initialIsRated || false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!userRole) return null;
  const resource = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

  const handleSubmit = async (e) => {
    e.stopPropagation(); 
    e.preventDefault();
    if (rating === 0) return;
    
    setLoading(true);
    try {
      // ✅ Use api instance
      const { data } = await api.patch(`/${resource}/Notification/AddRating`, {
        notificationId, 
        rating, 
        role: userRole
      });
      
      setIsSubmitted(true);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  if (isSubmitted) return <span className={styles['rating-done']}>✓ Rated</span>;

  return (
    <div className={styles['inline-rating']} onClick={(e) => e.stopPropagation()}>
      <div className={styles['stars-wrapper']}>
        {[...Array(5)].map((_, index) => (
          <svg key={index} className={styles['mini-star']} width="14" height="14" viewBox="0 0 24 24"
            fill={(index + 1) <= (hover || rating) ? "#FFC107" : "none"}
            stroke={(index + 1) <= (hover || rating) ? "#FFC107" : "#CBD5E1"}
            strokeWidth="2" onMouseEnter={() => setHover(index + 1)} onMouseLeave={() => setHover(0)} onClick={() => setRating(index + 1)}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        ))}
      </div>
      {rating > 0 && <button className={styles['submit-rating-btn']} onClick={handleSubmit} disabled={loading}>{loading ? "..." : "Send"}</button>}
    </div>
  );
};

// --- SKELETON ---
const NotificationsSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5].map((item) => (
      <div key={item} className={`${styles['notification-item']} ${styles['skeleton-item']}`}>
        <div className={styles['skeleton-icon']}></div>
        <div className={styles['notification-content']}>
          <div className={styles['skeleton-title']}></div>
          <div className={styles['skeleton-meta']}></div>
        </div>
      </div>
    ))}
  </>
);

// --- MAIN COMPONENT ---
const Notifications = () => {
  const queryClient = useQueryClient();
  const storedRole = localStorage.getItem("accountType") || "user"; 
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const storedId = storedRole === "user" ? user.User_id : (user.Company_id || 2);
  const UserType = { type: storedRole, id: storedId };

  const [currentPage, setCurrentPage] = useState(1);
  const notificationsPerPage = 5;

  const getResourceName = () => UserType.type.charAt(0).toUpperCase() + UserType.type.slice(1).toLowerCase();

  // ✅ 1. Fetcher function using api instance
  const fetchNotifications = async (page) => {
    const resource = getResourceName();
    
    const { data: result } = await api.get(`/${resource}/Notification`, {
      params: {
        id: UserType.id,
        type: UserType.type,
        page: page,
        limit: notificationsPerPage
      }
    });

    return {
      totalCount: result.totalCount,
      data: result.data.map(d => ({
        id: d.Notification_id,
        title: d.Content,
        time: formatTimeAgo(d.Date), 
        ...getNotificationAssets(d.Type),
        isRated: d.isRated 
      }))
    };
  };

  // 2. Main Query
  const { data, isLoading, isError, isPlaceholderData } = useQuery({
    queryKey: ['notifications', UserType.id, currentPage],
    queryFn: () => fetchNotifications(currentPage),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });

  const notifications = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / notificationsPerPage);

  // 3. Prefetch Logic (Load next page in background)
  useEffect(() => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      queryClient.prefetchQuery({
        queryKey: ['notifications', UserType.id, nextPage],
        queryFn: () => fetchNotifications(nextPage),
      });
    }
  }, [currentPage, totalPages, queryClient, UserType.id]);

  const handlePageChange = (p) => {
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ Delete notification using api instance
  const deleteNotification = async (notificationId) => {
    try {
      const resource = getResourceName();
      await api.delete(`/${resource}/Notification/${notificationId}`, {
        data: { 
          id: UserType.id, 
          type: UserType.type 
        }
      });
      queryClient.invalidateQueries(['notifications', UserType.id]);
    } catch (e) { 
      console.error(e); 
    }
  };

  return (
    <div className={styles['notifications-container']}>
      <div className={styles['notifications-header-wrapper']}>
        <div className={styles['notifications-header']}>
          <div className={styles['header-left']}>
            <button className={styles['back-button']} onClick={() => window.history.back()}><span>←</span> Back</button>
            <div className={styles['header-divider']}></div>
            <h2>Notifications {totalCount > 0 && `(${totalCount})`}</h2>
          </div>
        </div>
      </div>

      <div className={`${styles['notifications-list']} ${isPlaceholderData ? styles['is-loading-next'] : ''}`}>
        {isLoading ? <NotificationsSkeleton /> : 
         isError ? <div className={styles['no-notifications']}>Error loading.</div> :
         notifications.length > 0 ? (
          notifications.map(n => (
            <div key={n.id} className={styles['notification-item']}>
              <div className={`${styles['notification-icon-container']} ${n.styleClass}`}>{n.icon}</div>
              <div className={styles['notification-content']}>
                <div className={styles['notification-title']}>{n.title}</div>
                <div className={styles['notification-meta']}>
                  <span className={`${styles['notification-status']} ${n.styleClass}`}>{n.displayType}</span>
                  <span className={styles['notification-dot']}>•</span>
                  <span className={styles['notification-time']}>{n.time}</span>
                  {n.displayType === 'Completed' && <StarRating notificationId={n.id} userRole={UserType.type} initialIsRated={n.isRated} />}
                </div>
              </div>
              <button className={styles['delete-btn']} onClick={() => deleteNotification(n.id)}>×</button>
            </div>
          ))
        ) : <div className={styles['no-notifications']}>No notifications found.</div>}
      </div>

      {totalPages > 1 && (
        <div className={styles['pagination']}>
          <button className={styles['page-nav']} disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)}>Prev</button>
          {[...Array(totalPages)].map((_, i) => (
            (i + 1 >= currentPage - 2 && i + 1 <= currentPage + 2) && (
              <button key={i} onClick={() => handlePageChange(i + 1)} className={`${styles['page-number']} ${currentPage === i + 1 ? styles['active'] : ''}`}>
                {i + 1}
              </button>
            )
          ))}
          <button className={styles['page-nav']} disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default Notifications;