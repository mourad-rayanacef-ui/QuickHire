import React from 'react';
import styles from './JobSuccessPopup.module.css';
import { useNavigate } from 'react-router-dom';

import Checkmark from '../../../public/Checkmark.svg'

const JobSuccessPopup = ({ 
  isVisible, 
  onClose,  
  onPostAnotherJob 
}) => {
  if (!isVisible) return null;

  const navigate = useNavigate() ;
  const onViewDashboard= ()=>{
    navigate("../Home") ;
    window.scrollTo(0,0) ;
  }

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.successPopup}>
        <div className={styles.popupHeader}>
          <div className={styles.checkmarkContainer}>
            <img 
              src={Checkmark}
              alt="Success Checkmark" 
              className={styles.checkmarkImg}
            />
          </div>
          <h3>Job Post Added Successfully!</h3>
        </div>
        
        <div className={styles.popupContent}>
          <p>
            Your job listing has been published and is now visible to potential candidates. 
            You can track applications and manage your post from the dashboard.
          </p>
          
          <div className={styles.popupDivider}></div>
          
          <div className={styles.popupActions}>
            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={onViewDashboard}>
              View Dashboard
            </button>
            <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={onPostAnotherJob}>
              Post Another Job
            </button>
          </div>
        </div>
        
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close popup">
          <div className={styles.closeIcon}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </button>
      </div>
    </div>
  );
};

export default JobSuccessPopup;