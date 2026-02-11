import styles from "./ProfileHeader.module.css";
import ProfileImg from "../../../../public/company.svg";
import FlagLog from "../../../../public/Flagsvg.svg";

const ProfileHeader = ({ CompanyInfo, isLoading }) => {
  // --- LOADING STATE (Line-by-Line Shimmer) ---
  if (isLoading) {
    return (
      <div className={styles.ProfileHeroSection}>
        {/* Photo Skeleton */}
        <div className={`${styles.CompanyProfilePhoto} ${styles.shimmer}`}></div>

        <div className={styles.FirstPart}>
          {/* Company Name Skeleton */}
          <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '250px', height: '40px', marginBottom: '10px' }}></div>
          {/* Website Skeleton */}
          <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '180px', height: '16px', marginBottom: '20px' }}></div>

          <div className={styles.SmallInfos}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.SmallInfo}>
                <div className={`${styles.skeletonIcon} ${styles.shimmer}`}></div>
                <div>
                  <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '60px', height: '12px', marginBottom: '5px' }}></div>
                  <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '40px', height: '10px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- DATA STATE ---
  return (
    <div className={styles.ProfileHeroSection}>
      <img
        className={styles.CompanyProfilePhoto}
        src={CompanyInfo.Logo || ProfileImg}
        alt={CompanyInfo.Name}
        onError={(e) => {
          e.target.src = ProfileImg;
        }}
      />

      <div className={styles.FirstPart}>
        <h1>{CompanyInfo.Name}</h1>

        <a href={CompanyInfo.WebsiteLink} target="_blank" rel="noreferrer" className={styles.companywebsite}>
          {CompanyInfo.WebsiteLink}
        </a>

        <div className={styles.SmallInfos}>
          <div className={styles.SmallInfo}>
            <img src={FlagLog} alt="icon" />
            <div>
              <p className={styles.p1}>Founded</p>
              <p className={styles.p2}>{CompanyInfo.FoundedDate}</p>
            </div>
          </div>

          <div className={styles.SmallInfo}>
            <img src={FlagLog} alt="icon" />
            <div>
              <p className={styles.p1}>Employees</p>
              <p className={styles.p2}>{CompanyInfo.EmployeesNumber}</p>
            </div>
          </div>

          <div className={styles.SmallInfo}>
            <img src={FlagLog} alt="icon" />
            <div>
              <p className={styles.p1}>Industry</p>
              <p className={styles.p2}>{CompanyInfo.IndustryType}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;