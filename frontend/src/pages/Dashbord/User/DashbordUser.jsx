import React from 'react';
import { useQuery } from '@tanstack/react-query';
import styles from './DashbordUser.module.css';
import NavBar from '../../../components/NavBar/NavBar.jsx';
import SideBar from '../../../components/SideBar/SideBar.jsx';
import { userAPI } from '../../../services/api';

const UserDashboard = () => {

  // --- 1. Fetch Stats ---
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: userAPI.getDashboardStats,
    // Match backend property names: companiesWorked, activeProjects
    select: (res) => (res.success ? res.data : { companiesWorked: 0, activeProjects: 0 }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // --- 2. Fetch Companies ---
  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ['workedCompanies'],
    queryFn: userAPI.getCompaniesWorked,
    select: (res) => (res.success ? res.data : []),
    staleTime: 1000 * 60 * 5,
  });

  // Combined variables to match your original naming
  const loading = statsLoading || companiesLoading;
  const stats = statsData || { companiesWorked: 0, activeProjects: 0 };
  const workedCompanies = companiesData || [];

  return (
    <>
      <NavBar />
      <SideBar />
      <div className={styles.userDashboard}>

        {/* Header Section */}
        <div className={styles.dashboardHeader}>
          <br />
          <h1>Dashboard</h1>

          <div className={styles.statsContainer}>
            {loading ? (
              // --- SKELETON: STATS ---
              <>
                <div className={`${styles.statCard} ${styles.shimmerBox}`}>
                  <div className={`${styles.line} ${styles.shimmer}`} style={{ height: '40px', width: '60px', marginBottom: '10px' }}></div>
                  <div className={`${styles.line} ${styles.shimmer}`} style={{ height: '16px', width: '120px' }}></div>
                </div>
                <div className={`${styles.statCard} ${styles.shimmerBox}`}>
                  <div className={`${styles.line} ${styles.shimmer}`} style={{ height: '40px', width: '60px', marginBottom: '10px' }}></div>
                  <div className={`${styles.line} ${styles.shimmer}`} style={{ height: '16px', width: '100px' }}></div>
                </div>
              </>
            ) : (
              // --- REAL DATA: STATS ---
              <>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.companiesWorked}</div>
                  <div className={styles.statLabel}>Companies Worked With</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statNumber}>{stats.activeProjects}</div>
                  <div className={styles.statLabel}>Active Jobs</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Companies Worked With Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Companies You've Worked With</h2>
          </div>

          <div className={styles.gridContainer}>
            {loading ? (
              // --- SKELETON: COMPANIES (Render 3 dummy cards) ---
              [1, 2, 3].map((i) => (
                <div key={i} className={`${styles.companyCard} ${styles.shimmerBox}`}>
                  <div className={styles.companyContent}>
                    {/* Title Line */}
                    <div className={`${styles.line} ${styles.shimmer}`} style={{ height: '24px', width: '70%', marginBottom: '15px' }}></div>
                    {/* Position Line */}
                    <div className={`${styles.line} ${styles.shimmer}`} style={{ height: '16px', width: '50%', marginBottom: '10px' }}></div>
                    {/* Duration Line */}
                    <div className={`${styles.line} ${styles.shimmer}`} style={{ height: '14px', width: '40%', marginBottom: '20px' }}></div>
                    {/* Status Badge */}
                    <div className={`${styles.line} ${styles.shimmer}`} style={{ height: '24px', width: '80px', borderRadius: '15px' }}></div>
                  </div>
                </div>
              ))
            ) : (
              // --- REAL DATA: COMPANIES ---
              workedCompanies.map(company => (
                <div key={company.id} className={styles.companyCard}>
                  <div className={styles.companyContent}>
                    <h3 className={styles.companyName}>{company.name}</h3>
                    <p className={styles.position}>{company.position}</p>
                    <p className={styles.duration}>{company.duration}</p>
                    <span className={`${styles.statusBadge} ${styles[company.status.toLowerCase()]}`}>
                      {company.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDashboard;