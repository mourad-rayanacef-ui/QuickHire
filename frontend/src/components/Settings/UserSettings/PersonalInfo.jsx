import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "../../Alert/Alert";
import styles from "./PersonalInfo.module.css";

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

function PersonalInfo() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const { userId, token } = getUserInfo();

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: 'success',
    message: ''
  });

  // Helper function to show alerts
  const showNotification = (type, message) => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  // --- Local Form State ---
  const [formData, setFormData] = useState({
    fullName: "",
    address: "", // ✅ Changed from Address to address
    phoneNumber: "",
    email: "",
    description: "",
  });
  
  const [characterCount, setCharacterCount] = useState(0);
  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);

  // --- 1. Fetch Profile Data (useQuery) --- 
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfileSettings', userId],
    queryFn: async () => {
      if (!userId) throw new Error("No User ID found");
      const res = await fetch(`https://quickhire-4d8p.onrender.com/api/User/ProfileSettings/${userId}`, {
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch profile");
      return data.user;
    },
    enabled: !!userId,
  });

  // --- Sync Query Data to Local Form State ---
  useEffect(() => {
    if (profileData) {
      setFormData({
        fullName: profileData.fullName || "",
        address: profileData.address || "", // ✅ Changed to match backend field
        phoneNumber: profileData.phoneNumber || "",
        email: profileData.email || "",
        description: profileData.description || "",
      });
      setCharacterCount(profileData.description?.length || 0);
      if (profileData.photo) {
        setImagePreview(profileData.photo);
      }
    }
  }, [profileData]);

  // --- 2. Mutation: Update Profile ---
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await fetch(`https://quickhire-4d8p.onrender.com/api/User/ProfileSettings/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
             fullName: updatedData.fullName,
             address: updatedData.address, // ✅ Changed to match backend field
             phoneNumber: updatedData.phoneNumber,
             email: updatedData.email,
             description: updatedData.description,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to update");
      return data.user;
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.setQueryData(['userProfileSettings', userId] , updatedUser);
      showNotification('success', 'Profile changes saved successfully!');
    },
    onError: (err) => {
      showNotification('error', `Failed to save changes: ${err.message}`);
    }
  });

  // --- 3. Mutation: Upload Image ---
  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('accountType', 'user');
      formData.append('id', userId);

      const res = await fetch('https://quickhire-4d8p.onrender.com/api/User/Profile/Image', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
      return data.data?.imageUrl;
    },
    onSuccess: (newUrl) => {
      if(newUrl) setImagePreview(newUrl);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfileSettings', userId] });
      showNotification('success', 'Profile image uploaded successfully!');
    },
    onError: (err) => {
      showNotification('error', `Upload failed: ${err.message}`);
      if (profileData?.photo) setImagePreview(profileData.photo);
      else setImagePreview(null);
    }
  });

  // --- 4. Mutation: Delete Image ---
  const deleteImageMutation = useMutation({
    mutationFn: async () => {
      const emptyImage = new File(
        [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 11, 73, 68, 65, 84, 120, 1, 99, 248, 207, 64, 1, 0, 9, 251, 3, 253, 55, 76, 213, 113, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130])],
        'empty.png', { type: 'image/png' }
      );
      
      const formData = new FormData();
      formData.append('image', emptyImage);
      formData.append('accountType', 'user');
      formData.append('id', userId);

      const res = await fetch('https://quickhire-4d8p.onrender.com/api/User/Profile/Image', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      setImagePreview(null);
        queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['userProfileSettings', userId] });
      showNotification('success', 'Profile image removed successfully!');
    },
    onError: (err) => {
      showNotification('error', `Failed to remove image: ${err.message}`);
    }
  });

  // ✅ UPDATED: Validate Form (with optional fields)
  const validateForm = () => {
    const newErrors = {};
    
    // ✅ REQUIRED FIELDS
    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }
    
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // ✅ OPTIONAL FIELDS (only validate if provided)
    if (formData.address.trim() && formData.address.length < 5) {
      newErrors.address = "Address must be at least 5 characters if provided";
    }
    
    if (formData.phoneNumber.trim() && formData.phoneNumber.length < 8) {
      newErrors.phoneNumber = "Phone number must be at least 8 digits if provided";
    }
    
    if (formData.description.trim() && formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters if provided";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // --- Handlers ---
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ["image/svg+xml", "image/png", "image/jpeg", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showNotification('error', 'Invalid file type. Please upload SVG, PNG, JPG, GIF, or WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('error', 'File size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);

    uploadImageMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = () => {
    if (validateForm()) {
      updateProfileMutation.mutate(formData);
    } else {
      showNotification('warning', 'Please fix the errors in the form before saving.');
    }
  };

  // --- LOADING SKELETON ---
  const SkeletonInput = ({ width = '100%', height = '45px', labelWidth = '100px' }) => (
    <div className={styles.formGroup}>
        <div className={`${styles.skeletonLabel} ${styles.shimmer}`} style={{ width: labelWidth }}></div>
        <div className={`${styles.skeletonInput} ${styles.shimmer}`} style={{ width, height }}></div>
    </div>
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <section className={styles.section}>
            <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '150px' }}></div>
            <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '300px', marginBottom: '20px' }}></div>
            
            <div className={styles.imageUploadBox} style={{ border: 'none', background: 'transparent' }}>
                <div className={`${styles.skeletonCircle} ${styles.shimmer}`}></div>
            </div>
        </section>

        <section className={styles.section}>
            <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '180px', marginBottom: '20px' }}></div>
            <div className={styles.formGrid}>
                <SkeletonInput labelWidth="80px" />
                <SkeletonInput labelWidth="70px" />
                <div className={styles.doubleColumn}>
                    <SkeletonInput labelWidth="100px" />
                    <SkeletonInput labelWidth="50px" />
                </div>
            </div>
        </section>

        <section className={styles.section}>
             <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '120px', marginBottom: '20px' }}></div>
             <div className={`${styles.skeletonInput} ${styles.shimmer}`} style={{ height: '150px', borderRadius: '12px' }}></div>
        </section>
      </div>
    );
  }

  // --- REAL CONTENT ---
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

      {/* Profile Picture (Optional) */}
      <section className={styles.section}>
        <h2 className={styles.sectionSubtitle}>Profile Picture (Optional)</h2>
        <p className={styles.description}>
          This image will be shown publicly as your profile picture.
          <br /><small>Supported formats: SVG, PNG, JPG, GIF, WEBP (max 5MB)</small>
        </p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".svg,.png,.jpg,.jpeg,.gif,.webp"
          className={styles.fileInput}
          disabled={uploadImageMutation.isPending}
        />

        <div
          className={`${styles.imageUploadBox} ${uploadImageMutation.isPending ? styles.uploading : ''}`}
          onClick={() => !imagePreview && !uploadImageMutation.isPending && fileInputRef.current?.click()}
        >
          {uploadImageMutation.isPending ? (
            <div className={styles.uploadingContainer}>
              <div className={styles.spinner}></div>
              <p>Uploading...</p>
            </div>
          ) : imagePreview ? (
            <div className={styles.imagePreviewContainer}>
              <img 
                src={imagePreview} 
                alt="Profile" 
                className={styles.previewImage} 
                onError={(e) => { e.target.src = "https://via.placeholder.com/200x200?text=Profile"; }}
              />
              <div className={styles.imageOverlay}>
                <button 
                  className={styles.changeImageButton}
                  onClick={() => fileInputRef.current?.click()}
                > Change </button>
                <button 
                  className={styles.deleteImageButton} 
                  onClick={() => { if(window.confirm("Remove image?")) deleteImageMutation.mutate(); }}
                > Remove </button>
              </div>
            </div>
          ) : (
            <div className={styles.placeholder}>
              <div className={styles.uploadIcon}>📷</div>
              <p>Click to upload profile picture (Optional)</p>
            </div>
          )}
        </div>
      </section>

      {/* Personal Details */}
      <section className={styles.section}>
        <h2 className={styles.sectionSubtitle}>Personal Details</h2>

        <div className={styles.formGrid}>
          {/* Full Name (Required) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Full Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className={`${styles.input} ${errors.fullName ? styles.inputError : ""}`}
              placeholder="Enter your full name"
            />
            {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
          </div>

          {/* Address (Optional) */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              className={`${styles.input} ${errors.address ? styles.inputError : ""}`}
              placeholder="Enter your address (Optional)"
            />
            {errors.address && <span className={styles.errorText}>{errors.address}</span>}
          </div>

          <div className={styles.doubleColumn}>
            {/* Phone Number (Optional) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                className={`${styles.input} ${errors.phoneNumber ? styles.inputError : ""}`}
                placeholder="Enter your phone number (Optional)"
              />
              {errors.phoneNumber && <span className={styles.errorText}>{errors.phoneNumber}</span>}
            </div>

            {/* Email (Required) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Email <span className={styles.required}>*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`${styles.input} ${errors.email ? styles.inputError : ""}`}
                placeholder="Enter your email"
              />
              {errors.email && <span className={styles.errorText}>{errors.email}</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Description (Optional) */}
      <section className={styles.section}>
        <h2 className={styles.sectionSubtitle}>About User (Optional)</h2>
        <textarea
          value={formData.description}
          onChange={(e) => {
            handleInputChange("description", e.target.value);
            setCharacterCount(e.target.value.length);
          }}
          className={`${styles.textarea} ${errors.description ? styles.inputError : ""}`}
          rows="6"
          maxLength="1000"
          placeholder="Describe yourself (Optional)"
        />
        <div className={styles.textareaFooter}>
          <p className={styles.characterCounter}>{characterCount} / 1000 characters</p>
          {errors.description && <span className={styles.errorText}>{errors.description}</span>}
        </div>
      </section>

      <div className={styles.saveButtonContainer}>
        <button 
          className={styles.saveButton} 
          onClick={handleSave} 
          disabled={updateProfileMutation.isPending || uploadImageMutation.isPending}
        >
          {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default PersonalInfo;