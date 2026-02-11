import React from "react";
import styles from "./CInvitation.module.css"; 
import Vector from "../../../../public/Vector.svg"
import TrashIcon from "../../../../public/delete-button.svg"

function CInvitation({ applicant, onDelete }) {
    const handleDelete = () => {
        if (onDelete && applicant.id) {
            onDelete(applicant.id);
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
                    alt="Delete invitation" 
                    className={styles.trashIcon}
                    onClick={handleDelete}
                    style={{ cursor: 'pointer' }}
                />
                {/* Accept button removed */}
            </div>
        </div>
    );
}

export default CInvitation;