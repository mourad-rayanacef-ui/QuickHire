import React from 'react';
import CApplication from "../CApplications/CApplications.jsx";
import styles from './CApplicationList.module.css';
import defaultAvatar from '../../../../public/applicantss/applicant1.svg';

function CApplicationsList({ applicants = [], onDelete, onAccept, onStatusChange }) {
  console.log('CApplicationsList received applicants:', applicants);

  if (!applicants || applicants.length === 0) {
    return (
      <div className={styles.applicationsList}>
        <div className={styles.noApplications}>
          No applicants found for the selected filter.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.applicationsList}>
      {/* Table Header */}
      <div className={styles.tableHeader}>
        <div>Full Name</div>
        <div>Score</div>
        <div>Job Role</div>
        <div>Applied Date</div>
        <div>Type</div>
        <div>Action</div>
      </div>

      {/* Applicants List */}
      <div className={styles.applicationsContainer}>
        {applicants.map((applicant) => (
          <CApplication
            key={applicant.id}
            applicant={{
              // ✅ CRITICAL: Pass all required IDs for backend operations
              applicationId: applicant.id,           // For DELETE from Job_Applications
              userId: applicant.userId,              // For ACCEPT to Job_Hiring_History
              jobId: applicant.jobId,                // For ACCEPT to get job details
              // ✅ Display data
              img: applicant.photo || defaultAvatar,
              fullName: applicant.name,
              score: applicant.score,
              roles: applicant.jobRole,
              dateApplied: applicant.appliedDate,
              type: applicant.type,
              status: applicant.status
            }}
            onDelete={onDelete}
            onAccept={onAccept}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

export default CApplicationsList;