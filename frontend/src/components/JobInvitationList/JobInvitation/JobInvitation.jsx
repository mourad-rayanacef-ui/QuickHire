import React from "react"; 
import companyLogo from '../../../../public/company-logo.svg'; 
import Vector from '../../../../public/Vector.svg'; 

import styles from "./JobInvitation.module.css";

function JobInvitation({ application, onAccept }) {

  const handleAccept = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error("User not authenticated");
      
        return;
      }

      // ✅ Call backend API to accept invitation
      const response = await fetch(
        `https://quickhire-4d8p.onrender.com/api/User/Invitation/${application.id}/accept`, 
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          }
        }
      );

      const data = await response.json();

      if (data.success) {
        // ✅ Call parent's onAccept to refresh the list
        if (onAccept) {
          await onAccept(application);
        }
      } else {
        console.error("Failed to accept invitation:", data.error);
  
      }

    } catch (error) {
      console.error("Accept invitation failed:", error);
    
    }
  };

  return(  
       <div className={styles.ApplicationContainer}>

      <div className={styles.applicationHeader}>
        <img
          src={application.img || companyLogo}
          alt={application.companyName}
          className={styles.companyLogo}
        />
        <div className={styles.companyInfo}>
          <span className={styles.companyName}>
            {application.companyName}
          </span>
        </div>
      </div>

      <div className={styles.rating}>
        <img src={Vector} alt="Rating" className={styles.ratingstar} />
        <span className={styles.score}>{application.score}</span>
      </div>


      <div className={styles.detailItem} data-label="Role:">
        <span className={styles.detailValue}>{application.roles}</span>
      </div>


      <div className={styles.detailItem} data-label="Date:">
        <span className={styles.detailValue}>{application.dateApplied}</span>
      </div>

      <div className={styles.detailItem} data-label="Type:">
        <span className={`${styles.detailValue} ${styles[application.type.replace('-', '')]}`}>
          {application.type}
        </span>
      </div>

      <div>
        <button className={styles.AcceptBtn} onClick={handleAccept}>
          Accept
        </button>
      </div>
    </div>
  ); 
} 

export default JobInvitation;