import React from 'react';
import JobApplication from "./JobApplication/JobApplication.jsx";
import styles from './JobApplicationList.module.css';
import defaultLogo from '../../../public/company-logo.svg'; // ✅ Only one default logo

function JobApplicationsList({ applications = [] }) {
  // If no applications are passed, show a message
  if (!applications || applications.length === 0) {
    return (
      <div className={styles.applicationsList}>
        <div className={styles.noApplications}>
          No applications found for the selected filter.
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
        <div>Date Applied</div>
        <div>Type</div>
        <div>Status</div>
      </div>

      {/* Applications List */}
      <div className={styles.applicationsContainer}>
        {applications.map(application => (
          <JobApplication
            key={application.id}
            application={{
              id: application.id,
              img: application.CompanyLogo || defaultLogo, // ✅ Use actual logo from database
              companyName: application.CompanyName,
              score: application.Score,
              roles: application.Roles,
              dateApplied: application.DateApplied,
              type: application.Type,
              status: application.Status
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default JobApplicationsList;