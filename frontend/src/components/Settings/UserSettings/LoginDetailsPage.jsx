import React, { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "../../Alert/Alert";
import api from "../../../services/api";
import styles from "./LoginDetailsPage.module.css";

// --- Helper: Auth Extraction ---
const getUserInfo = () => {
  try {
    const token = localStorage.getItem("token") || "";
    const userDataStr = localStorage.getItem("user");
    
    if (!userDataStr || userDataStr === "null") return { userId: null, token };

    const parsedUser = JSON.parse(userDataStr);
    const userId = parsedUser.User_id || parsedUser.userId || parsedUser.id || parsedUser.Company_id;

    return { userId, token };
  } catch (error) {
    console.error("Error parsing user info:", error);
    return { userId: null, token: "" };
  }
};

function LoginDetails() {
  const queryClient = useQueryClient();
  const { userId } = getUserInfo();
  
  // Refs for inputs
  const emailRef = useRef(null);
  const oldPassRef = useRef(null);
  const newPassRef = useRef(null);
  const confirmPassRef = useRef(null);

  const [currentEmail, setCurrentEmail] = useState("");
  const [passError, setPassError] = useState("");

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', message: '' });

  // Helper function to show alerts
  const showNotification = (message, type = 'success') => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  // --- 1. Fetch Profile (for Email) ---
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfileSettings', userId],
    queryFn: async () => {
      const { data } = await api.get(`/User/ProfileSettings/${userId}`);
      if (!data.success) throw new Error("Failed to load profile");
      return data.user;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (profileData?.email) {
      setCurrentEmail(profileData.email);
    }
  }, [profileData]);

  // --- 2. Mutation: Update Email ---
  const emailMutation = useMutation({
    mutationFn: async (newEmail) => {
      const { data } = await api.patch(`/User/ProfileSettings/${userId}/Email`, {
        email: newEmail
      });
      if (!data.success) throw new Error(data.error || "Failed to update email");
      return newEmail;
    },
    onSuccess: (newEmail) => {
      setCurrentEmail(newEmail);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.setQueryData(['userProfileSettings', userId], (old) => ({ ...old, email: newEmail }));
      if(emailRef.current) emailRef.current.value = "";
      showNotification("Email updated successfully!", "success");
    },
    onError: (err) => showNotification(err.message, "error")
  });

  // --- 3. Mutation: Update Password ---
  const passwordMutation = useMutation({
    mutationFn: async (passwordData) => {
      const { data } = await api.patch(`/User/ProfileSettings/${userId}/Password`, passwordData);
      if (!data.success) throw new Error(data.error || "Failed to update password");
      return data;
    },
    onSuccess: () => {
      showNotification("Password updated successfully!", "success");
      if(oldPassRef.current) oldPassRef.current.value = "";
      if(newPassRef.current) newPassRef.current.value = "";
      if(confirmPassRef.current) confirmPassRef.current.value = "";
      setPassError("");
    },
    onError: (err) => {
      setPassError(err.message);
      showNotification(err.message, "error");
    }
  });

  // --- Handlers ---
  const handleEmailChange = (e) => {
    e.preventDefault();
    const newEmail = emailRef.current.value.trim();
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return showNotification("Invalid email format", "error");
    }
    if (newEmail === currentEmail) {
      return showNotification("This is already your current email", "warning");
    }

    emailMutation.mutate(newEmail);
  };

  const handlePassChange = (e) => {
    e.preventDefault();
    const oldPass = oldPassRef.current.value;
    const newPass = newPassRef.current.value;
    const confirmPass = confirmPassRef.current.value;

    if (!oldPass || !newPass || !confirmPass) {
      setPassError("All fields are required");
      return showNotification("All fields are required", "error");
    }
    if (newPass !== confirmPass) {
      setPassError("New passwords do not match");
      return showNotification("New passwords do not match", "error");
    }
    if (newPass === oldPass) {
      setPassError("New password cannot be the same as old");
      return showNotification("New password cannot be the same as old", "warning");
    }
    if (newPass.length < 8) {
      setPassError("Password must be at least 8 characters");
      return showNotification("Password must be at least 8 characters", "warning");
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(newPass)) {
      setPassError("Password must contain uppercase, lowercase, and number");
      return showNotification("Password must contain uppercase, lowercase, and number", "warning");
    }

    passwordMutation.mutate({ oldPassword: oldPass, newPassword: newPass, confirmPassword: confirmPass });
  };

  // --- Loading Skeleton ---
  if (isLoading) {
    return (
      <div className={styles.container}>
         <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '150px' }}></div>
         <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '250px', marginBottom: '30px' }}></div>
         <div className={styles.LineBreak}></div>
         
         {/* Email Skeleton */}
         <section className={styles.EmailUpdate}>
            <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '120px', marginBottom: '10px' }}></div>
            <div className={`${styles.skeletonInput} ${styles.shimmer}`} style={{ height: '45px', marginBottom: '15px' }}></div>
            <div className={`${styles.skeletonInput} ${styles.shimmer}`} style={{ height: '40px', width: '120px' }}></div>
         </section>

         <div className={styles.LineBreak}></div>

         {/* Password Skeleton */}
         <section className={styles.PasswordUpdate}>
             <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '140px', marginBottom: '20px' }}></div>
             <div className={`${styles.skeletonInput} ${styles.shimmer}`} style={{ height: '45px', marginBottom: '15px' }}></div>
             <div className={`${styles.skeletonInput} ${styles.shimmer}`} style={{ height: '45px', marginBottom: '15px' }}></div>
             <div className={`${styles.skeletonInput} ${styles.shimmer}`} style={{ height: '45px', marginBottom: '20px' }}></div>
         </section>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Alert Component */}
      {showAlert && (
        <Alert
          type={alertConfig.type}
          message={alertConfig.message}
          onClose={() => setShowAlert(false)}
          duration={3000}
        />
      )}

      <div className={styles.description}>
        <p className={styles.pHead}>Login Details</p>
        <p className={styles.p}>This is login information that you can update anytime.</p>
      </div>

      <div className={styles.LineBreak}></div>

      {/* EMAIL UPDATE SECTION */}
      <section className={styles.EmailUpdate}>
        <div className={styles.sectionTitle}>
          <h3>Update Email</h3>
          <p>Update your email address to make sure it is safe</p>
        </div>

        <div className={styles.emailhandle}>
          <div className={styles.emailDisplay}>
            <span className={styles.pemail}>{currentEmail}</span>
          </div>

          <div className={styles.verifiedBadge}>
            Your email address is verified ✅
          </div>

          <form className={styles.Form} onSubmit={handleEmailChange}>
            <label htmlFor="emailupdate">Update Email</label>
            <input
              type="email"
              placeholder="Enter Your New Email"
              id="emailupdate"
              ref={emailRef}
              disabled={emailMutation.isPending}
              required
            />
            <button type="submit" disabled={emailMutation.isPending}>
              {emailMutation.isPending ? "Updating..." : "Update Email"}
            </button>
          </form>
        </div>
      </section>

      <div className={styles.LineBreak}></div>

      {/* PASSWORD UPDATE SECTION */}
      <section className={styles.PasswordUpdate}>
        <div className={styles.sectionTitle}>
          <h3>New Password</h3>
          <p>Manage your password to make sure it is safe</p>
        </div>

        <form className={styles.passform} onSubmit={handlePassChange}>
          <div className={styles.passinput}>
            <label htmlFor="Oldpass">Old Password</label>
            <input
              type="password"
              id="Oldpass"
              placeholder="Enter your old password"
              ref={oldPassRef}
              disabled={passwordMutation.isPending}
              required
            />
          </div>

          <div className={styles.passinput}>
            <label htmlFor="Newpass">New Password</label>
            <input
              type="password"
              id="Newpass"
              placeholder="Enter your new password"
              ref={newPassRef}
              disabled={passwordMutation.isPending}
              required
            />
          </div>

          <div className={styles.passinput}>
            <label htmlFor="Confirmpass">Confirm New Password</label>
            <input
              type="password"
              id="Confirmpass"
              placeholder="Confirm your new password"
              ref={confirmPassRef}
              disabled={passwordMutation.isPending}
              required
            />
          </div>

          <button type="submit" disabled={passwordMutation.isPending}>
            {passwordMutation.isPending ? "Changing..." : "Change Password"}
          </button>
          {passError && <p className={styles.errorText}>{passError}</p>}
        </form>
      </section>
    </div>
  );
}

export default LoginDetails;