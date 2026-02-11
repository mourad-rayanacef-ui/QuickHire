import styles from "./AdditionalCotainer.module.css"
import emailLogo from "../../../public/email.svg"
import phoneLogo from "../../../public/phone.svg"
import LanguageLogo from "../../../public/language.svg"

const AdditionalContainer = ({ UserInfo }) => {
  // Debug logging
  console.log('AdditionalContainer - UserInfo received:', UserInfo);
  
  // Don't render if no UserInfo
  if (!UserInfo) {
    console.log('AdditionalContainer - No UserInfo, not rendering');
    return null;
  }

  // Parse languages from JSON string
  let languages = [];
  if (UserInfo.Languages) {
    try {
      languages = typeof UserInfo.Languages === 'string' 
        ? JSON.parse(UserInfo.Languages) 
        : (Array.isArray(UserInfo.Languages) ? UserInfo.Languages : []);
    } catch (e) {
      console.error('Error parsing languages:', e);
      languages = [];
    }
  }

  // Get phone number - check both Number and Phone fields
  const phone = UserInfo.Number || UserInfo.Phone || null;
  
  console.log('AdditionalContainer - Extracted data:', {
    email: UserInfo.Email,
    phone: phone,
    languages: languages
  });
  
  const hasData = UserInfo.Email || phone || languages.length > 0;
  
  if (!hasData) {
    console.log('AdditionalContainer - No data to display');
    return null;
  }

  return (
    <div className={styles.AdditionalContainer}>
      <h5>Additional Details</h5>
      <div className={styles.SubDetails}>
        
        {/* Email - Only show if exists */}
        {UserInfo.Email && (
          <div>
            <p className={styles.p1}>
              <img src={emailLogo} alt="Email" />
              Email
            </p>
            <p className={styles.p2}>{UserInfo.Email}</p>
          </div>
        )}

        {/* Phone - Only show if exists - NO LINK, PLAIN TEXT */}
        {phone && (
          <div>
            <p className={styles.p1}>
              <img src={phoneLogo} alt="Phone" />
              Phone
            </p>
            <p className={styles.p2}>{phone}</p>
          </div>
        )}

        {/* Languages - Only show if exists */}
        {languages.length > 0 && (
          <div>
            <p className={styles.p1}>
              <img src={LanguageLogo} alt="Languages" />
              Languages
            </p>
            <p className={styles.p2}>
              {languages.join(', ')}
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default AdditionalContainer