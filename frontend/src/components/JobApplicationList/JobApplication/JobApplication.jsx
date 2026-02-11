import React from "react";
import companyLogo from '../../../../public/company-logo.svg';
import Vector from '../../../../public/Vector.svg';
import styles from "./JobApplication.module.css"

function JobApplication({ application }) {

    return(
        <div className={styles.ApplicationContainer}>
            {/* Header with company logo and info */}
            <div className={styles.applicationHeader}>
                <img 
                    src={application.img || companyLogo} 
                    alt={application.companyName}
                    className={styles.companyLogo}
                />
                <div className={styles.companyInfo}>
                    <span className={styles.companyName}>{application.companyName}</span>
                </div>
            </div>

            {/* Company Rating */}
            <div className={styles.rating}>
                <img
                    src={Vector} 
                    alt="Rating"
                    className={styles.ratingstar}
                />
                <span className={styles.score}>{application.score}</span>
            </div>

            {/* Job Role */}
            <div className={styles.detailItem} data-label="Role:">
                <span className={styles.detailValue}>{application.roles}</span>
            </div>
            
            {/* Application Details */}
            <div className={styles.detailItem} data-label="Date Applied:">
                <span className={styles.detailValue}>{application.dateApplied}</span>
            </div>

            <div className={styles.detailItem} data-label="Type:">
                <span className={`${styles.detailValue} ${styles[application.type.replace('-', '')]}`}>
                    {application.type}
                </span>
            </div>

            <div className={styles.detailItem} data-label="Status:">
                <span className={`${styles.status} ${styles[application.status.replace(' ', '')]}`}>
                    {application.status}
                </span>
            </div>
        </div>
    );
}

export default JobApplication;