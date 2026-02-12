import React, { useState } from "react";
import styles from "./CApplications.module.css";
import Vector from "../../../../public/Vector.svg";
import TrashIcon from "../../../../public/delete-button.svg";
import { companyAPI } from '../../../services/api';

function CApplication({ applicant, onDelete, onAccept, onStatusChange }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    const handleDelete = async () => {
        if (!applicant.applicationId) {
            console.error('❌ No application ID provided');
            return;
        }
        
        if (!window.confirm(`Are you sure you want to delete ${applicant.fullName}'s application?`)) {
            return;
        }

        setIsDeleting(true);
        try {
            // ✅ Call companyAPI.deleteApplication with the Application_id
            const response = await companyAPI.deleteApplication(applicant.applicationId);

            if (response.success) {
                console.log("✅ Application deleted successfully");
                // Call parent onDelete with the application ID
                if (onDelete) {
                    onDelete(applicant.applicationId);
                }
            } else {
                console.error("❌ Failed to delete application:", response.error);
                alert('Failed to delete application. Please try again.');
            }
        } catch (error) {
            console.error("❌ Delete application failed:", error);
            alert('Failed to delete application. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAccept = async () => {
        if (!applicant.applicationId || !applicant.userId || !applicant.jobId) {
            console.error('❌ Missing required data for accept:', {
                applicationId: applicant.applicationId,
                userId: applicant.userId,
                jobId: applicant.jobId
            });
            alert('Missing required data to accept application.');
            return;
        }

        setIsAccepting(true);
        try {
            // ✅ Call companyAPI.acceptApplicant with complete data
            const response = await companyAPI.acceptApplicant({
                applicationId: applicant.applicationId,
                userId: applicant.userId,
                jobId: applicant.jobId,
                jobName: applicant.roles || "Position"
            });

            if (response.success) {
                console.log("✅ Application accepted successfully");
                
                // Call parent onAccept with complete applicant data
                if (onAccept) {
                    onAccept({
                        applicationId: applicant.applicationId,
                        userId: applicant.userId,
                        jobId: applicant.jobId,
                        fullName: applicant.fullName,
                        roles: applicant.roles
                    });
                }
            } else {
                console.error("❌ Failed to accept application:", response.error);
                alert('Failed to accept applicant. Please try again.');
            }
        } catch (error) {
            console.error("❌ Accept application failed:", error);
            alert('Failed to accept applicant. Please try again.');
        } finally {
            setIsAccepting(false);
        }
    };

    return (
        <div className={styles.ApplicationContainer}>
            {/* Header with applicant avatar and info */}
            <div className={styles.applicantHeader}>
                <img 
                    src={applicant.img} 
                    alt={applicant.fullName}
                    className={styles.applicantAvatar}
                    onError={(e) => { e.target.src = '/default-avatar.png'; }}
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
                <span className={styles.scoreValue}>{applicant.score?.toFixed(1) || '0.0'}</span>
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
                <span className={`${styles.detailValue} ${styles[applicant.type?.replace('-', '') || 'fulltime']}`}>
                    {applicant.type}
                </span>
            </div>

            <div className={styles.action}>
                <img 
                    src={TrashIcon} 
                    alt="Decline application" 
                    className={styles.trashIcon}
                    onClick={handleDelete}
                    style={{ cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.5 : 1 }}
                    title="Decline Application"
                />
                <button 
                    className={styles.acceptButton}
                    onClick={handleAccept}
                    disabled={isAccepting || isDeleting}
                >
                    {isAccepting ? 'Accepting...' : 'Accept'}
                </button>
            </div>
        </div>
    );
}

export default CApplication;