import React from 'react';
import Footer from '../../components/footer/Footer.jsx';
import styles from './Landingpage.module.css';
import work from '../../../public/work.svg';
 import { useNavigate } from 'react-router-dom';

const HomePage = () => {

  const navigate = useNavigate();

  const handleSignIn  = ()=>{
    navigate("/SignIn");
  }
  // Sample data (unchanged)
  const jobCategories = [
    { name: 'Technology', count: 1250, icon: '💻' },
    { name: 'Healthcare', count: 890, icon: '🏥' },
    { name: 'Finance', count: 760, icon: '💰' },
    { name: 'Education', count: 540, icon: '📚' },
    { name: 'Marketing', count: 680, icon: '📊' },
    { name: 'Design', count: 420, icon: '🎨' },
  ];

  const featuredJobs = [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      company: 'TechCorp',
      location: 'Remote',
      type: 'Full-time',
      logo: '🏢',
      posted: '2 hours ago'
    },
    {
      id: 2,
      title: 'Product Manager',
      company: 'InnovateInc',
      location: 'New York, NY',
      type: 'Full-time',
      logo: '🚀',
      posted: '5 hours ago'
    },
    {
      id: 3,
      title: 'UX Designer',
      company: 'DesignStudio',
      location: 'San Francisco, CA',
      type: 'Contract',
      logo: '🎨',
      posted: '1 day ago'
    },
  ];

  const latestJobs = [
    {
      id: 4,
      title: 'Backend Engineer',
      company: 'DataSystems',
      location: 'Austin, TX',
      type: 'Full-time',
      logo: '⚙️',
      posted: 'Just now'
    },
    {
      id: 5,
      title: 'Data Scientist',
      company: 'AnalyticsPro',
      location: 'Remote',
      type: 'Full-time',
      logo: '📈',
      posted: '30 mins ago'
    },
    {
      id: 6,
      title: 'DevOps Specialist',
      company: 'CloudTech',
      location: 'Boston, MA',
      type: 'Contract',
      logo: '☁️',
      posted: '1 hour ago'
    },
  ];

  return (
    <div className={styles.homepage}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroWelcome}>
          Welcome to QuickHire
        </div>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Explore Over<br />
            <span className={styles.highlight}>7,000+ Job</span><br />
            Opportunities
          </h1>
          <p className={styles.heroSubtitle}>
            Find your dream job from thousands of companies and grow your career
          </p>
          <div className={styles.heroActions}>
            <button  onClick={handleSignIn} className={styles.btnPrimary}>
              Sign In
            </button>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroImageContainer}>
            <img 
              src={work}
              alt="Job Opportunities"
              className={styles.heroImage}
            />
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.categories}>
        <div className={styles.sectionHeader}>
          <h2>Explore by category</h2>
          <p>Browse jobs by your field of interest</p>
        </div>
        <div className={styles.categoriesGrid}>
          {jobCategories.map((category, index) => (
            <div key={index} className={styles.categoryCard}>
              <div className={styles.categoryIcon}>{category.icon}</div>
              <div className={styles.categoryInfo}>
                <h3>{category.name}</h3>
                <span>{category.count} jobs</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Jobs Section */}
      <section className={styles.featuredJobs}>
        <div className={styles.sectionHeader}>
          <h2>Featured Jobs</h2>
          <p>Handpicked opportunities from top companies</p>
        </div>
        <div className={styles.jobsGrid}>
          {featuredJobs.map(job => (
            <div key={job.id} className={styles.jobCard}>
              <div className={styles.jobHeader}>
                <div className={styles.jobLogo}>{job.logo}</div>
                <div className={styles.jobInfo}>
                  <h3 className={styles.jobTitle}>{job.title}</h3>
                  <p className={styles.jobCompany}>{job.company}</p>
                </div>
              </div>
              <div className={styles.jobDetails}>
                <span className={styles.jobLocation}>{job.location}</span>
                <span className={styles.jobType}>{job.type}</span>
              </div>
              <div className={styles.jobFooter}>
                <span className={styles.postedTime}>{job.posted}</span>
                
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Latest Jobs Section */}
      <section className={styles.latestJobs}>
        <div className={styles.sectionHeader}>
          <h2>Latest Jobs Post</h2>
          <p>Most recent job opportunities</p>
        </div>
        <div className={styles.jobsGrid}>
          {latestJobs.map(job => (
            <div key={job.id} className={styles.jobCard}>
              <div className={styles.jobHeader}>
                <div className={styles.jobLogo}>{job.logo}</div>
                <div className={styles.jobInfo}>
                  <h3 className={styles.jobTitle}>{job.title}</h3>
                  <p className={styles.jobCompany}>{job.company}</p>
                </div>
              </div>
              <div className={styles.jobDetails}>
                <span className={styles.jobLocation}>{job.location}</span>
                <span className={styles.jobType}>{job.type}</span>
              </div>
              <div className={styles.jobFooter}>
                <span className={styles.postedTime}>{job.posted}</span>
                
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;