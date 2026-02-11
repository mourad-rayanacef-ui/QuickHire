import React from 'react';
import JobInvitation from "./JobInvitation/JobInvitation.jsx";
import styles from './JobInvitationList.module.css';
import defaultLogo from '../../../public/company-logo.svg'; // ✅ Only one default logo

function JobInvitationList({ invitations = [], onAccept }) {
  // If no invitations are passed, show a message
  if (!invitations || invitations.length === 0) {
    return (
      <div className={styles.applicationsList}>
        <div className={styles.noInvitations}>
          No invitations found.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.applicationsList}>
      {/* Table Header */}
      <div className={styles.tableHeader}>
        <div>Company Name</div>
        <div>Score</div>
        <div>Roles</div>
        <div>Date Received</div>
        <div>Type</div>
        <div>Status</div>
      </div>

      {/* Invitations List */}
      <div className={styles.applicationsContainer}>
        {invitations.map(invitation => (
          <JobInvitation
            key={invitation.id}
            application={{
              id: invitation.id,
              img: invitation.companyLogo || defaultLogo, // ✅ Use actual logo from database
              companyName: invitation.companyName,
              companyId: invitation.companyId, // ✅ For notifications
              score: invitation.score,
              roles: invitation.roles,
              dateApplied: invitation.dateReceived,
              type: invitation.type,
              status: invitation.status
            }}
            onAccept={onAccept}
          />
        ))}
      </div>
    </div>
  );
}

export default JobInvitationList;