import styles from "./UserProfileSocialLinks.module.css"
import emailLogo from "../../../public/email.svg"
import LinkedInLogo from "../../../public/phone.svg" // Kept your import path
import WebsiteImg from "../../../public/website.svg"

const UserProfileSocialLinks = ({ UserInfo }) => {
  // Provide default values if UserInfo is not loaded yet
  const email = UserInfo?.Email || "Not provided";
  const linkedIn = UserInfo?.LinkedInLink || "Not provided";
  const website = UserInfo?.WebsiteLink || "Not provided";

  return (
    <div className={styles.AdditionalContainer}>
      <h5>Social Links</h5>
      <div className={styles.SubDetails}>
        
        {/* Email Section - Always renders */}
        <div>
          <p className={styles.p1}>
            <img src={emailLogo} alt="Email" />
            Email
          </p>
          <p className={styles.p2}>
            {UserInfo?.Email ? (
              <a 
                href={`mailto:${email}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {email}
              </a>
            ) : (
              email
            )}
          </p>
        </div>

        {/* LinkedIn Section - Always renders */}
        <div>
          <p className={styles.p1}>
            <img src={LinkedInLogo} alt="LinkedIn" />
            LinkedIn        
          </p>
          <p className={styles.p2}>
            {UserInfo?.LinkedInLink ? (
              <a 
                href={linkedIn}
                target="_blank"
                rel="noopener noreferrer"
              >
                {linkedIn}
              </a>
            ) : (
              linkedIn
            )}
          </p>
        </div>

        {/* Website Section - Always renders */}
        <div>
          <p className={styles.p1}>
            <img src={WebsiteImg} alt="Website" />
            Website 
          </p>
          <p className={styles.p2}>
            {UserInfo?.WebsiteLink ? (
              <a 
                href={website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {website}
              </a>
            ) : (
              website
            )}
          </p>
        </div>

      </div>
    </div>
  )
}

export default UserProfileSocialLinks