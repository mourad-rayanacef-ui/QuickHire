import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { userAPI } from "../../services/api";
import UserProfileHeroSection from "../../components/UserProfileHeroSection/UserProfileHeroSection";
import AdditionalContainer from "../../components/UserProfileAdditionalContainer/AdditionalContainer";
import styles from "./UserProfile.module.css";
import UserProfileSocialLinks from "../../components/UserProfileSocialLinks/UserProfileSocialLinks.jsx";
import Experience from "../../components/UserProfileComponents/Experience/Experience.jsx";
import companyLogo from "../../../public/CompanyLogo.png";
import wrongLogo from "../../../public/wrong.svg";

import AddSkillPopUp from "../../components/AddSkillPopUp/AddSkillPopUp.jsx";
import AddExperiencePopUp from "../../components/AddExperiencePopUp/AddExperiencePopUp.jsx";
import Alert from "../../components/Alert/Alert"; // ✅ Import Alert component

const UserProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [ShowingExp, SetShowingExp] = useState(false);
  const [showingSkill, SetShowingSkill] = useState(false);
  const [AddingPopUp, SetAddingPopUp] = useState(false);
  const [AddingPopUp2, SetAddingPopUp2] = useState(false);

  // ✅ Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', message: '' });

  // Helper function for dates
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // ✅ Helper function to show alerts
  const showNotification = (message, type = 'success') => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  
  // --- 1. DATA FETCHING WITH USEQUERY ---
 const { data: userInfo, isLoading, isError } = useQuery({
    queryKey: ["userProfile"],
    queryFn: userAPI.getProfile,
    staleTime: 1000 * 60 * 5, 
    select: (response) => {
      if (response.success) {
        return {
          Name: `${response.data.FirstName || ''} ${response.data.LastName || ''}`,
          CurrentlyWorking: response.data.Status == 'CurrentlyWorking',
          Company: response.data.CompanyName ,
          Location: response.data.Location || "",
          Email: response.data.Email || "",
          Number: response.data.Number || "",
          Languages: response.data.Languages || null,
          LinkedInLink: response.data.LinkedInLink || "",
          WebsiteLink: response.data.Website || "",
          AboutUser: response.data.Description || "No description available",
          Photo: response.data.Photo || "",
          Experiences: response.data.User_Experience?.map(exp => ({
            CompanyImg: exp.Company_logo || companyLogo,
            JobTitle: exp.Title || "",
            Company: exp.Company_Name || "",
            JobType: exp.Job_type || "",
            date: `${formatDate(exp.Start_date)} - ${exp.End_date ? formatDate(exp.End_date) : 'Present'}`,
            Location: exp.Company_location || "",
            JobDescription: exp.Description || ""
          })) || [],
          Skills: response.data.User_Skills?.map(skill => ({
            SkillImg: skill.Skill_Certification || "https://placehold.co/70x30" ,
            Title: skill.Title || "",
            Description: skill.Description || "" 
          })) || []
        };
      }
      showNotification('Failed to load profile data', 'error'); // ✅ Alert for API error
      return null;
    }
  });

  // --- 2. MUTATIONS (Adding Data) ---

  // Mutation for Adding Skill
  const addSkillMutation = useMutation({
    mutationFn: (skillData) => userAPI.addSkill(skillData),
    onSuccess: () => {
      queryClient.invalidateQueries(["userProfile"]);
      SetAddingPopUp(false);
      showNotification('Skill added successfully!', 'success'); // ✅ Alert
    },
    onError: (error) => {
      console.error('Error adding skill:', error);
      showNotification('Failed to add skill. Please try again.', 'error'); // ✅ Alert
    }
  });

  // Mutation for Adding Experience
  const addExperienceMutation = useMutation({
    mutationFn: (formData) => userAPI.addExperience(formData),
    onSuccess: () => {
      queryClient.invalidateQueries(["userProfile"]);
      SetAddingPopUp2(false);
      showNotification('Experience added successfully!', 'success'); // ✅ Alert
    },
    onError: (error) => {
      console.error('Error adding experience:', error);
      showNotification('Failed to add experience. Please try again.', 'error'); // ✅ Alert
    }
  });

  // Handlers utilizing mutations
const AddNewSkill = (skill) => {
  const formData = new FormData();

  formData.append('Title', skill.title);
  formData.append('Description', skill.description);
  // Append uploaded file if provided (AddSkillPopUp sends it as `file`)
  if (skill && skill.file) {
    formData.append('SkillImg', skill.file); // backend checks req.file or req.body.SkillImg
  }

  addSkillMutation.mutate(formData);
};



  const AddNewExperience = (experience) => {
    if (!experience) {
      showNotification('Invalid experience data provided.', 'error'); // ✅ Alert
      return;
    }
    const formData = {
      Title: experience.JobTitle,
      Company_Name: experience.Company,
      Company_location: experience.Location,
      Job_type: experience.JobType,
      Start_date: experience.startDate || new Date().toISOString(),
      End_date: experience.endDate || null,
      Description: experience.JobDescription,
      Company_logo: experience.CompanyImg
    };
    addExperienceMutation.mutate(formData);
  };

  // Logic handlers
  const hideManyExperiences = () => SetShowingExp(false);
  const handleShowingMore = () => SetShowingExp(true);
  const handleShowingMore2 = () => SetShowingSkill(true);
  const hideManySkills = () => SetShowingSkill(false);
  const handleShowingLess = () => SetShowingExp(false);
  const handleShowingLess2 = () => SetShowingSkill(false);

  const handleDownload = (SkillCerImg) => {
    try {
      const link = document.createElement("a");
      link.href = SkillCerImg;
      link.download = "certificate.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Certificate downloaded successfully!', 'success'); // ✅ Alert
    } catch (error) {
      console.error('Error downloading certificate:', error);
      showNotification('Failed to download certificate.', 'error'); // ✅ Alert
    }
  };

  // --- 3. SKELETON LOADING STATE ---
  if (isLoading) {
    return (
      <div className={styles.SkeletonContainer}>
        <div className={styles.SkeletonLeft}>
          {/* Hero Skeleton */}
          <div className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{height: '250px'}}></div>
          
          {/* About Skeleton */}
          <div className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{height: '100px'}}></div>
          
          {/* Experience Skeleton */}
          <div className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{height: '300px'}}></div>
        </div>
        <div className={styles.SkeletonRight}>
          {/* Side Info Skeleton */}
          <div className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{height: '200px'}}></div>
          <div className={`${styles.skeleton} ${styles.skeletonBlock}`} style={{height: '150px'}}></div>
        </div>
      </div>
    );
  }

  if (isError || !userInfo) {
    return (
      <>
        {/* ✅ Alert Component for error state */}
        {showAlert && (
          <Alert
            type={alertConfig.type}
            message={alertConfig.message}
            onClose={() => setShowAlert(false)}
            duration={3000}
            autoClose={true}
          />
        )}
        <div className={styles.error}>Failed to load profile</div>
      </>
    );
  }

  // --- 4. MAIN RENDER ---
  return (
    <>
      {/* ✅ Alert Component */}
      {showAlert && (
        <Alert
          type={alertConfig.type}
          message={alertConfig.message}
          onClose={() => setShowAlert(false)}
          duration={3000}
          autoClose={true}
        />
      )}

      <div className={AddingPopUp ? styles.ProfilePage2 : styles.ProfilePage}>
        <div className={styles.FirstPart}>
          <UserProfileHeroSection UserInfo={userInfo} isLoading={isLoading} />

          <div className={styles.AboutUserSection}>
            <h5>About Me</h5>
            <p>{userInfo.AboutUser}</p>
          </div>

          <div className={styles.ExperiencesSection}>
            <div className={styles.ExperiencesHeader}>
              <h5>Experiences</h5>
              {ShowingExp ? (
                <button onClick={hideManyExperiences}>
                  <img src={wrongLogo} alt="Hide" />
                </button>
              ) : (
                <button onClick={() => SetAddingPopUp2(true)}>+</button>
              )}
            </div>

            <div
              className={`${styles.ExperiencesList} ${
                ShowingExp ? styles.expand : styles.collapse
              }`}
            >
              {userInfo.Experiences.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No experiences added yet. Click the + button to add your first experience!</p>
                </div>
              ) : ShowingExp ? (
                <div className={styles.MoreExperiences}>
                  {userInfo.Experiences.map((Exp, index) => (
                    <Experience key={index} Experience={Exp} />
                  ))}
                  {userInfo.Experiences.length > 3 && (
                    <h6 className={styles.ShowMore} onClick={handleShowingLess}>
                      Show Less
                    </h6>
                  )}
                </div>
              ) : (
                <div className={styles.ThreeExperiences}>
                  {userInfo.Experiences.slice(0, 3).map((Exp, index) => (
                    <Experience key={index} Experience={Exp} />
                  ))}
                  {userInfo.Experiences.length > 3 && (
                    <h6 className={styles.ShowMore} onClick={handleShowingMore}>
                      Show More Experiences
                    </h6>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Skills Section */}
          <div className={styles.SkillsSection}>
            <div className={styles.SkillsHeader}>
              <h5>Skills</h5>
              {showingSkill ? (
                <button onClick={hideManySkills}>
                  <img src={wrongLogo} alt="Hide" />
                </button>
              ) : (
                <button onClick={() => SetAddingPopUp(true)}>+</button>
              )}
            </div>

            {!showingSkill ? (
              <div className={styles.Skills}>
                {userInfo.Skills.length === 0 ? (
                  <div className={styles.emptyState}>
                    <p>No skills added yet. Click the + button to add your first skill!</p>
                  </div>
                ) : (
                  <>
                    {userInfo.Skills.slice(0, 3).map((skill, index) => (
                      <div key={index} className={styles.SkillContainer}>
                        <div className={styles.SkillDetails}>
                          <h5>{skill.Title}</h5>
                          <p className={styles.SkillDescription}>{skill.Description}</p>
                        </div>
                        <div className={styles.ImgInfo}>
                          <img className={styles.SkillCerImg} src={skill.SkillImg} alt="Skill" />
                          <p
                            onClick={() => handleDownload(skill.SkillImg)}
                            className={styles.downloadBtn}
                          >
                            Download Image
                          </p>
                        </div>
                      </div>
                    ))}
                    {userInfo.Skills.length > 3 && (
                      <h6 className={styles.ShowMore2} onClick={handleShowingMore2}>
                        Show More Skills
                      </h6>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className={styles.Skills}>
                {userInfo.Skills.map((skill, index) => (
                  <div key={index} className={styles.SkillContainer}>
                    <div className={styles.SkillDetails}>
                      <h5>{skill.Title}</h5>
                      <p className={styles.SkillDescription}>{skill.Description}</p>
                    </div>
                    <div className={styles.ImgInfo}>
                      <img className={styles.SkillCerImg} src={skill.SkillImg} alt="Skill" />
                      <p
                        onClick={() => handleDownload(skill.SkillImg)}
                        className={styles.downloadBtn}
                      >
                        Download Image
                      </p>
                    </div>
                  </div>
                ))}
                {userInfo.Skills.length > 3 && (
                  <h6 className={styles.ShowMore2} onClick={handleShowingLess2}>
                    Show Less
                  </h6>
                )}
              </div>
            )}

            <div className={styles.VoidContent}></div>
          </div>

          <div className={styles.LastVoidDiv}>.</div>
        </div>

        <div className={styles.SecondPart}>
          <AdditionalContainer UserInfo={userInfo} />
          <UserProfileSocialLinks UserInfo={userInfo} />
          <div className={styles.LastVoidDiv}>.</div>
          <br />
        </div>
      </div>

      {AddingPopUp && (
        <AddSkillPopUp
          handlingAdding={AddNewSkill}
          onClose={() => SetAddingPopUp(false)}
        />
      )}

      {AddingPopUp2 && (
        <AddExperiencePopUp
          handlingAdding={AddNewExperience}
          onClose={() => SetAddingPopUp2(false)}
        />
      )}
    </>
  );
};

export default UserProfile;