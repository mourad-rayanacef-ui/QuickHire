import React from 'react';
import styles from './NotFound.module.css'; 
import Footer from '../../components/footer/Footer.jsx';
import LOGO from '../../../public/LOGO.svg'; 
import robotImage from '../../../public/illustration.svg'; 

import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {


  const navigate = useNavigate();
  const handleBackToHome = () => {
    // Add your navigation logic here
    navigate("/");
  };

  return (
    <div className={styles.notFoundContainer}>
      <div className={styles.notFoundContent}>
        <header className={styles.notFoundHeader}>
          <img 
            src={LOGO} 
            alt="QuickHire" 
            className={styles.logo}
          />
        </header>

        <main className={styles.notFoundMain}>
          <div className={styles.robotSection}>
            <img 
              src={robotImage} 
              alt="404 illustration - page not found" 
              className={styles.robotImage}
            />
          </div>
          
          <div className={styles.errorContent}>
            <h1 className={styles.errorTitle}>Oppsi Page not found</h1>
            <p className={styles.errorDescription}>
              Something went wrong. It's look like the first is broken or the page is removed.
            </p>
            <button 
              className={styles.homeButton}
              onClick={handleBackToHome}
            >
              Back to homepage
            </button>
          </div>
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFoundPage;