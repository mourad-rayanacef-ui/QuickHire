import React from "react";
import styles from "./CApplications.module.css"
import Vector from "../../../../public/Vector.svg"
import TrashIcon from "../../../../public/delete-button.svg"

function CApplication({ applicant, onDelete, onAccept, onStatusChange }) {
    const handleDelete = async () => {
        if (!applicant.id) return;
        
        try {
            const token = localStorage.getItem('token');
            
          
            // ✅ Call backend API to reject application
            const response = await fetch(
                `https://quickhire-4d8p.onrender.com/api/Company/Application/${applicant.id}/reject`,
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
                console.log("Application rejected successfully");
             
                
                // ✅ Update status locally or remove from list
                if (onStatusChange) {
                    onStatusChange(applicant.id, 'Rejected');
                } else if (onDelete) {
                    onDelete(applicant.id);
                }
            } else {
                console.error("Failed to reject application:", data.error);
             
            }

        } catch (error) {
            console.error("Reject application failed:", error);
    
        }
    };

    const handleAccept = async () => {
        if (!applicant.id) return;
        
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
         
                return;
            }

            // ✅ Call backend API to accept application
            const response = await fetch(
                `https://quickhire-4d8p.onrender.com/api/Company/Application/${applicant.id}/accept`,
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
                console.log("Application accepted successfully");
             
                
                // ✅ Update status locally or call parent callback
                if (onStatusChange) {
                    onStatusChange(applicant.id, 'InContact');
                } else if (onAccept) {
                    onAccept(applicant);
                }
            } else {
                console.error("Failed to accept application:", data.error);
   
            }

        } catch (error) {
            console.error("Accept application failed:", error);
     
        }
    };

    return(
        <div className={styles.ApplicationContainer}>
            {/* Header with applicant avatar and info */}
            <div className={styles.applicantHeader}>
                <img 
                    src={applicant.img} 
                    alt={applicant.fullName}
                    className={styles.applicantAvatar}
                />
                <div className={styles.applicantInfo}>
                    <span className={styles.applicantName}>{applicant.fullName}</span>
                </div>
            </div>

            {/* Applicant Score */}
            <div className={styles.score}>
                <img
                    src={Vector} 
                    alt="Rating"
                    className={styles.ratingstar}
                />
                <span className={styles.scoreValue}>{applicant.score}</span>
            </div>

            {/* Job Role */}
            <div className={styles.detailItem} data-label="Role:">
                <span className={styles.detailValue}>{applicant.roles}</span>
            </div>
            
            {/* Application Details */}
            <div className={styles.detailItem} data-label="Date Applied:">
                <span className={styles.detailValue}>{applicant.dateApplied}</span>
            </div>

            <div className={styles.detailItem} data-label="Type:">
                <span className={`${styles.detailValue} ${styles[applicant.type.replace('-', '')]}`}>
                    {applicant.type}
                </span>
            </div>

            <div className={styles.action}>
                <img 
                    src={TrashIcon} 
                    alt="Decline application" 
                    className={styles.trashIcon}
                    onClick={handleDelete}
                    style={{ cursor: 'pointer' }}
                    title="Decline Application"
                />
                <button 
                    className={styles.acceptButton}
                    onClick={handleAccept}
                >
                    Accept
                </button>
            </div>
        </div>
    );
}


export default CApplication;