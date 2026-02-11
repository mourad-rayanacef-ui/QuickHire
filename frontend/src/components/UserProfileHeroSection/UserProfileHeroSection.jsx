import styles from "./UserProfileHeroSection.module.css";
import ProfileImg from "../../../public/UserProfileImg.webp";
import locationLogo from "../../../public/location.svg";
import FlagLog from "../../../public/Flagsvg.svg";
import Flag2Log from "../../../public/Flag2svg.svg";
import { useNavigate } from 'react-router-dom';

const UserProfileHeroSection = ({ UserInfo, isLoading }) => {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    navigate("../Settings");
  };

  // --- SKELETON STATE (Line-by-Line) ---
  if (isLoading) {
    return (
      <div className={styles.UserPrifileHeroSection}>
        <div className={`${styles.SmallProfileBg} ${styles.shimmer}`}></div>
        <div className={styles.UserDetails}>
          {/* Circular Photo Skeleton */}
          <div className={`${styles.UserProfilePhoto} ${styles.shimmer}`}></div>
          
          <div className={styles.FirstPart}>
            <div>
              {/* Name Line */}
              <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '180px', height: '24px', marginBottom: '12px' }}></div>
              {/* Status Line */}
              <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '140px', height: '16px', marginBottom: '8px' }}></div>
              {/* Location Line */}
              <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '100px', height: '16px', marginBottom: '15px' }}></div>
              {/* Badge/Flag Line */}
              <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '160px', height: '30px', borderRadius: '20px' }}></div>
            </div>
            {/* Button Skeleton */}
            <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '100px', height: '40px', borderRadius: '8px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // --- ACTUAL DATA STATE ---
  return (
    <div className={styles.UserPrifileHeroSection}>
      <div className={styles.SmallProfileBg}></div>
      <div className={styles.UserDetails}>
        <img
          className={styles.UserProfilePhoto}
          src={UserInfo.Photo || ProfileImg}
          alt={UserInfo.Name}
          onError={(e) => { e.target.src = ProfileImg; }}
        />
        <div className={styles.FirstPart}>
          <div>
            <h5>{UserInfo.Name}</h5>
            {!UserInfo.CurrentlyWorking ? (
              <p>Job <span> Seeker</span></p>
            ) : (
              <p>Employee at <span> {UserInfo.Company}</span></p>
            )}
            <p>
              <img src={locationLogo} alt="loc" />
              {UserInfo.Location}
            </p>
            {!UserInfo.CurrentlyWorking ? (
              <h6 className={styles.OpenForOpp}>
                <img src={FlagLog} alt="flag" /> Open for Opportunities
              </h6>
            ) : (
              <h6 className={styles.CurrentlyWork}>
                <img src={Flag2Log} alt="flag" /> CURRENTLY WORKING
              </h6>
            )}
          </div>
          <button onClick={handleGoToSettings}>Edit Profile</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileHeroSection;