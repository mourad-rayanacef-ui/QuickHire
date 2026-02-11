import React from 'react';
import CInvitation from "../CInvitations/CInvitation.jsx";
import styles from './CInvitationList.module.css';
import defaultAvatar from '../../../../public/applicantss/applicant1.svg'; // ✅ Only one default

function CInvitationList({ applicants = [], onDelete }) {
  if (!applicants || applicants.length === 0) {
    return (
      <div className={styles.applicationsList}>
        <div className={styles.noApplications}>
          No invitations found for the selected filter.
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

      {/* Invitations List */}
      <div className={styles.applicationsContainer}>
        {applicants.map(applicant => (
          <CInvitation
            key={applicant.id}
            applicant={{
              id: applicant.id,
              img: applicant.photo || defaultAvatar, // ✅ Use actual photo from database
              fullName: applicant.name,
              score: applicant.score,
              roles: applicant.jobRole,
              dateApplied: applicant.appliedDate,
              type: applicant.type,
            }}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

export default CInvitationList;