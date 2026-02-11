import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { companyAPI } from "../../services/api";
import styles from "./CompanyProfile.module.css";
import UserProfileSocialLinks from "../../components/UserProfileSocialLinks/UserProfileSocialLinks.jsx";
import ProfileHeader from "../../components/CompanyProfileComponents/ProfileHeader/ProfileHeader.jsx";
import TeamCarousel from "../../components/CompanyProfileComponents/ManagersComponent/Managers.jsx";
import AddManagerPopUp from "../../components/AddManagerPopUp/AddManagerPopUp.jsx";
import Alert from "../../components/Alert/Alert"; // ✅ Import Alert component
import CompanyProfileIllustration from "../../../public/CompanyProfileIllustration.svg";

const CompanyProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showingJobs, SetShowingJobs] = useState(false);
  const [AddingPopUp, SetAddingPopUp] = useState(false);

  // ✅ Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', message: '' });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // ✅ Helper function to show alerts
  const showNotification = (message, type = 'success') => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  // --- 1. DATA FETCHING WITH USEQUERY ---
  const { data: CompanyInfo, isLoading, isError } = useQuery({
    queryKey: ["companyProfile"], 
    queryFn: companyAPI.getProfile,
    staleTime: 1000 * 60 * 5,
    select: (response) => {
      if (response.success) {
        return {
          Name: response.data.Name || "",
          WebsiteLink: response.data.Website || "",
          FoundedDate: formatDate(response.data.FoundationDate) || "",
          EmployeesNumber: response.data.Employees_Number ? `+${response.data.Employees_Number}` : "0",
          IndustryType: response.data.Industry || "",
          Location: response.data.MainLocation || "",
          Email: response.data.Email || "",
          LinkedInLink: response.data.LinkedInLink || "",
          GmailAccount: response.data.Email || "",
          CompanyDescription: response.data.Description || "No description available",
          Logo: response.data.Logo || "",
          CompanyManagers: response.data.Manager?.map(manager => ({
            ManagerImg: manager.Manager_Photo ||"",
            ManagerName: `${manager.FirstName || ''} ${manager.LastName || ''}`,
            ManagerRole: manager.Role || "",
            LinkedInAccount: manager.LinkedInLink || "",
            GmailAccount: manager.Email || ""
          })) || [],
          OpenPositions: response.data.Job?.map(job => ({
            CompanyImg: response.data.Logo,
            PositionName: job.Job_role || "",
            JobType: job.Type || "",
            Location: response.data.MainLocation || "",
            Skills: job.Job_Skills?.map(skill => skill.Name) || []
          })) || []
        };
      }
      return null;
    }
  });

  // --- 2. MUTATION FOR ADDING MANAGER ---
  const addManagerMutation = useMutation({
    mutationFn: async (manager) => {
      const formData = new FormData();
      const nameParts = (manager.name || '').trim().split(' ');
      formData.append('FirstName', nameParts[0] || '');
      formData.append('LastName', nameParts.slice(1).join(' ') || '');
      formData.append('Role', manager.role || '');
      formData.append('Email', manager.gmailAccount || '');
      formData.append('LinkedInLink', manager.linkedInAccount || '');
      formData.append('Manager_Photo', manager.file);

      const token = localStorage.getItem('token');
      const response = await fetch('https://quickhire-4d8p.onrender.com/api/Company/Manager', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to add manager');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["companyProfile"]);
      SetAddingPopUp(false);
      showNotification('Manager added successfully!', 'success'); // ✅ Alert
    },
    onError: (error) => {
      showNotification("Error adding manager: " + error.message, 'error'); // ✅ Alert
    }
  });

  const AddNewManager = (manager) => {
    if (!manager.file) {
      showNotification("Please select a photo for the manager.", 'warning'); // ✅ Alert
      return;
    }
    addManagerMutation.mutate(manager);
  };

  if (isLoading) {
    return (
      <div className={styles.ProfilePage}>
        <div className={styles.FirstPart}>
          {/* Header Skeleton */}
          <div className={`${styles.skeletonHeader} ${styles.shimmer}`}></div>
          <div className={styles.AboutCompanySection}>
            <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '150px', height: '24px', marginBottom: '15px' }}></div>
            <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '100%', height: '16px' }}></div>
            <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '90%', height: '16px', marginTop: '8px' }}></div>
          </div>
          <div className={styles.ManagersSection}>
             <div className={`${styles.line} ${styles.shimmer}`} style={{ width: '250px', height: '30px', marginBottom: '20px' }}></div>
             <div className={`${styles.skeletonBox} ${styles.shimmer}`} style={{ height: '200px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !CompanyInfo) {
    return (
      <>
        {/* ✅ Alert Component for error */}
        {showAlert && (
          <Alert
            type={alertConfig.type}
            message={alertConfig.message}
            onClose={() => setShowAlert(false)}
            duration={3000}
            autoClose={true}
          />
        )}
        <div className={styles.error}>Failed to load company profile</div>
      </>
    );
  }

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
          <ProfileHeader CompanyInfo={CompanyInfo} isLoading={isLoading} />

          <div className={styles.AboutCompanySection}>
            <h5>Company Profile</h5>
            <p>{CompanyInfo.CompanyDescription}</p>
          </div>

          <div className={styles.ManagersSection}>
            <div className={styles.ManagersSectionHeader}>
              <h2 className={styles.title}>Meet Our Management Team</h2>
              <button onClick={() => SetAddingPopUp(true)}>+</button>
            </div>
            <TeamCarousel CompanyInfo={CompanyInfo} />
          </div>

          <div className={styles.PostedJobs}>
            <div className={styles.PostedJobsHeader}>
              <h2 className={styles.title}>Posted Jobs</h2>
            </div>
            <div className={styles.JobsWrapper}>
              {CompanyInfo.OpenPositions.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No jobs posted yet. Post your first job to start hiring!</p>
                </div>
              ) : (
                <>
                  <div className={styles.Jobs}>
                    {(showingJobs ? CompanyInfo.OpenPositions : CompanyInfo.OpenPositions.slice(0, 3)).map((job, index) => (
                      <div key={index} className={styles.JobContainer}>
                        <div className={styles.ImgInfoSmall}>
                          <img className={styles.JobCertImg} src={job.CompanyImg} alt={job.PositionName} />
                        </div>
                        <div className={styles.JobDetails}>
                          <h5>{job.PositionName}</h5>
                          <p>
                            <span className={styles.JobType}>{job.JobType}</span> • {job.Location}
                          </p>
                          {job.Skills && (
                            <p className={styles.JobSkills}>Required: {job.Skills.join(", ")}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {CompanyInfo.OpenPositions.length > 3 && (
                    <h6 className={styles.ShowMore2} onClick={() => SetShowingJobs(!showingJobs)}>
                      {showingJobs ? "Show Less" : "Show More Jobs"}
                    </h6>
                  )}
                </>
              )}
            </div>
          </div>
          <div className={styles.void}><br /><br /></div>
        </div>

        <div className={styles.SecondPart}>
          <UserProfileSocialLinks UserInfo={CompanyInfo} />
          <img src={CompanyProfileIllustration} className={styles.illu} alt="Illustration" />
        </div>
      </div>

      {AddingPopUp && (
        <AddManagerPopUp 
          handlingAdding={AddNewManager} 
          onClose={() => SetAddingPopUp(false)} 
        />
      )}
    </>
  );
};

export default CompanyProfile;