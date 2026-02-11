import React, { useState } from 'react';
import styles from './Managers.module.css';
import ManagerImg from '../../../../public/me.jpg';
import { ChevronLeft, ChevronRight, Mail, Linkedin } from 'lucide-react';

const TeamCarousel = ({ CompanyInfo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('next');

  const teamMembers = CompanyInfo?.CompanyManagers || [];

  const nextSlide = () => {
    setDirection('next');
    setCurrentIndex((prevIndex) =>
      prevIndex === teamMembers.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setDirection('prev');
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? teamMembers.length - 1 : prevIndex - 1
    );
  };

  if (!teamMembers.length) {
    return <div className={styles.noData}>No team members available</div>;
  }

  const getPrevIndex = () =>
    currentIndex === 0 ? teamMembers.length - 1 : currentIndex - 1;

  const getNextIndex = () =>
    currentIndex === teamMembers.length - 1 ? 0 : currentIndex + 1;

  // ✅ Function to open Gmail compose
  const handleGmailRedirect = (email) => {
    if (!email) return;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
    window.open(gmailUrl, '_blank'); // open Gmail in a new tab
  };

  return (
    <div className={styles.container}>
      <div className={styles.carouselWrapper}>
        {/* Left Arrow */}
        <button
          onClick={prevSlide}
          className={styles.arrowButton}
          aria-label="Previous team member"
        >
          <ChevronLeft size="1.5rem" />
        </button>

        <div className={styles.cardsContainer}>
          {/* Previous Card */}
          <div className={`${styles.card} ${styles.cardPrev}`}>
            <div className={styles.imageWrapper}>
              <img
                src={teamMembers[getPrevIndex()].ManagerImg || ManagerImg}
                alt={teamMembers[getPrevIndex()].ManagerName}
                className={styles.image}
                onError={(e) => {
                  e.target.src = ManagerImg;
                }}
              />
            </div>
            <div className={styles.content}>
              <h3 className={styles.name2}>
                {teamMembers[getPrevIndex()].ManagerName}
              </h3>
              <p className={styles.role}>
                {teamMembers[getPrevIndex()].ManagerRole}
              </p>
            </div>
          </div>

          {/* Active Card */}
          <div
            key={currentIndex}
            className={`${styles.card} ${styles.cardActive} ${
              direction === 'next' ? styles.slideInNext : styles.slideInPrev
            }`}
          >
            <div className={styles.imageWrapper}>
              <img
                src={teamMembers[currentIndex].ManagerImg || ManagerImg}
                alt={teamMembers[currentIndex].ManagerName}
                className={styles.image}
                onError={(e) => {
                  e.target.src = ManagerImg;
                }}
              />
            </div>

            <div className={styles.content}>
              <h3 className={styles.name}>
                {teamMembers[currentIndex].ManagerName}
              </h3>
              <p className={styles.role}>
                {teamMembers[currentIndex].ManagerRole}
              </p>

              <div className={styles.socialButtons}>
                {/* ✅ Gmail Redirect Button */}
                <button
                  type="button"
                  onClick={() =>
                    handleGmailRedirect(teamMembers[currentIndex].GmailAccount)
                  }
                  className={styles.socialButton}
                  aria-label="Send email"
                >
                  <Mail size="1rem" />
                  <span>Email</span>
                </button>

                {/* LinkedIn Button */}
                <a
                  href={teamMembers[currentIndex].LinkedInAccount}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialButton}
                  aria-label="View LinkedIn profile"
                >
                  <Linkedin size="1rem" />
                  <span>LinkedIn</span>
                </a>
              </div>
            </div>
          </div>

          {/* Next Card */}
          <div className={`${styles.card} ${styles.cardNext}`}>
            <div className={styles.imageWrapper}>
              <img
                src={teamMembers[getNextIndex()].ManagerImg || ManagerImg}
                alt={teamMembers[getNextIndex()].ManagerName}
                className={styles.image}
                onError={(e) => {
                  e.target.src = ManagerImg;
                }}
              />
            </div>
            <div className={styles.content}>
              <h3 className={styles.name2}>
                {teamMembers[getNextIndex()].ManagerName}
              </h3>
              <p className={styles.role}>
                {teamMembers[getNextIndex()].ManagerRole}
              </p>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={nextSlide}
          className={styles.arrowButton}
          aria-label="Next team member"
        >
          <ChevronRight size="1.5rem" />
        </button>
      </div>

      {/* Dots */}
      <div className={styles.dotsContainer}>
        {teamMembers.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 'next' : 'prev');
              setCurrentIndex(index);
            }}
            className={`${styles.dot} ${
              index === currentIndex ? styles.dotActive : ''
            }`}
            aria-label={`Go to team member ${index + 1}`}
          />
        ))}
      </div>

      <p className={styles.counter}>
        {currentIndex + 1} / {teamMembers.length}
      </p>
    </div>
  );
};

export default TeamCarousel;
