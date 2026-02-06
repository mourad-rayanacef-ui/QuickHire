import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "../../Alert/Alert";
import styles from './PersonalInformation.module.css';

// --- CONSTANTS (Move these to the top) ---
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 70 }, (_, i) => (currentYear - i).toString());
const employeeRanges = ['1 - 10', '11 - 50', '51 - 100', '101 - 200', '201 - 500', '501 - 1000', '1001 - 5000', '5000+'];
const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

// --- Helper Functions ---
const isValidDate = (day, month, year) => {
  if (!day || !month || !year) return false;
  
  const monthIndex = months.findIndex(m => m === month);
  if (monthIndex === -1) return false;
  
  const date = new Date(year, monthIndex, day);
  return (
    date.getFullYear() === parseInt(year) &&
    date.getMonth() === monthIndex &&
    date.getDate() === parseInt(day)
  );
};

const getDaysForMonth = (month, year) => {
  if (!month || !year) return days; // Use the global days array
  
  const monthIndex = months.findIndex(m => m === month);
  if (monthIndex === -1) return days; // Use the global days array
  
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
};

// --- Helper: Auth Extraction ---
const getCompanyInfo = () => {
  try {
    const token = localStorage.getItem("token") || "";
    const userDataStr = localStorage.getItem("user");
    
    if (!userDataStr || userDataStr === "null") return { companyId: null, token };

    const parsedUser = JSON.parse(userDataStr);
    const companyId = parsedUser.Company_id || parsedUser.companyId || parsedUser.id || parsedUser.User_id;

    return { companyId, token };
  } catch (error) {
    console.error("Error parsing company info:", error);
    return { companyId: null, token: "" };
  }
};

export default function PersonalInformation() {
  const queryClient = useQueryClient();
  const { companyId, token } = getCompanyInfo();
  const fileInputRef = useRef(null);

  // --- Local State ---
  const [companyData, setCompanyData] = useState({
    companyName: '',
    website: '',
    employee: '',
    industry: '',
    techStack: [],
    description: '',
    mainLocation: '',
  });

  const [dateFounded, setDateFounded] = useState({ day: '', month: '', year: '' });
  const [errors, setErrors] = useState({});
  const [characterCount, setCharacterCount] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);

  // Dropdown UI states
  const [isDayOpen, setIsDayOpen] = useState(false);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  
  // Dynamic days based on selected month/year
  const [availableDays, setAvailableDays] = useState(days);

  // Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'success', message: '' });

  // ✅ FIXED: Update available days when month or year changes
  useEffect(() => {
    if (dateFounded.month && dateFounded.year) {
      const daysForMonth = getDaysForMonth(dateFounded.month, dateFounded.year);
      setAvailableDays(daysForMonth);
      
      // Reset day if it's invalid for the selected month
      if (dateFounded.day && !daysForMonth.includes(dateFounded.day)) {
        setDateFounded(prev => ({ ...prev, day: '' }));
      }
    } else {
      setAvailableDays(days);
    }
  }, [dateFounded.month, dateFounded.year]);

  // Helper function to show alerts
  const showNotification = (message, type = 'success') => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  // --- 1. Query: Fetch Company Data ---
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['companyProfile', companyId],
    queryFn: async () => {
      const res = await fetch(`https://quickhire-4d8p.onrender.com/api/Company/ProfileSettings/${companyId}`, {
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error("Failed to load company profile");
      return data.company;
    },
    enabled: !!companyId,
  });

  // Sync data
  useEffect(() => {
    if (profileData) {
      setCompanyData({
        companyName: profileData.companyName || '',
        website: profileData.website || '',
        employee: profileData.employee || '',
        industry: profileData.industry || '',
        techStack: [],
        description: profileData.description || '',
        mainLocation: profileData.mainLocation || '',
      });

      if (profileData.dateFounded) {
        setDateFounded({
          day: profileData.dateFounded.day || '',
          month: profileData.dateFounded.month || '',
          year: profileData.dateFounded.year || '',
        });
      }
      setCharacterCount(profileData.description?.length || 0);
      if (profileData.logo) setImagePreview(profileData.logo);
    }
  }, [profileData]);

  // --- 2. Mutation: Update Profile ---
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      const res = await fetch(`https://quickhire-4d8p.onrender.com/api/Company/ProfileSettings/${companyId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save changes");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyProfile', companyId]);
      showNotification("Company profile saved successfully!", "success");
    },
    onError: (err) => showNotification(`Error: ${err.message}`, "error")
  });

  // --- 3. Mutation: Upload Image ---
  const uploadImageMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('accountType', 'company');
      formData.append('id', companyId);

      const res = await fetch('https://quickhire-4d8p.onrender.com/api/Company/Profile/Image', {
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
        showNotification("Company logo uploaded successfully!", "success");
    },
    onError: (err) => {
        showNotification(`Error: ${err.message}`, "error");
        if(profileData?.logo) setImagePreview(profileData.logo);
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
        formData.append('accountType', 'company');
        formData.append('id', companyId);

        const res = await fetch('https://quickhire-4d8p.onrender.com/api/Company/Profile/Image', {
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
        showNotification("Company logo removed!", "success");
    },
    onError: (err) => showNotification(`Error: ${err.message}`, "error")
  });

  // ✅ UPDATED: Validate Form
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!companyData.companyName.trim()) newErrors.companyName = 'Company name is required';
    if (!companyData.industry.trim()) newErrors.industry = 'Industry is required';
    if (!companyData.employee) newErrors.employee = 'Employee range is required';
    
    // Optional fields with validation
    if (companyData.website && !/^https?:\/\/.+/.test(companyData.website)) {
      newErrors.website = 'Please enter a valid URL starting with http:// or https://';
    }
    
    // Date validation
    if (!dateFounded.day || !dateFounded.month || !dateFounded.year) {
      newErrors.dateFounded = 'Date founded is required';
    } else if (!isValidDate(dateFounded.day, dateFounded.month, dateFounded.year)) {
      newErrors.dateFounded = 'Please select a valid date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setCompanyData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleDateSelect = (type, value) => {
    const newDate = { ...dateFounded, [type]: value };
    setDateFounded(newDate);
    
    // Close dropdown
    if (type === 'day') setIsDayOpen(false);
    if (type === 'month') setIsMonthOpen(false);
    if (type === 'year') setIsYearOpen(false);
    
    // Clear date error when all fields are filled
    if (newDate.day && newDate.month && newDate.year && errors.dateFounded) {
      setErrors(prev => ({ ...prev, dateFounded: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        uploadImageMutation.mutate(file);
    }
  };

  const handleSaveChanges = () => {
    if (validateForm()) {
        updateProfileMutation.mutate({
            ...companyData,
            dateFounded: { 
              day: dateFounded.day, 
              month: dateFounded.month, 
              year: dateFounded.year 
            }
        });
    }
  };

  const handleDeleteImage = () => {
    if (window.confirm("Remove company logo?")) {
      deleteImageMutation.mutate();
    }
  };

  // --- Loading Skeleton ---
  if (isLoading) {
    return (
        <div className={styles.container}>
            {/* Basic Info Skeleton */}
            <section className={styles.section}>
                <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '200px', marginBottom: '20px' }}></div>
                <div className={styles.formGrid}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className={styles.formGroup}>
                            <div className={`${styles.skeletonLabel} ${styles.shimmer}`} style={{ width: '80px' }}></div>
                            <div className={`${styles.skeletonInput} ${styles.shimmer}`} style={{ height: '45px' }}></div>
                        </div>
                    ))}
                </div>
            </section>
            
            <div className={styles.divider} />
            
            {/* Logo Skeleton */}
            <section className={styles.section}>
                <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '150px' }}></div>
                <div className={styles.imageUploadBox} style={{ border: 'none' }}>
                    <div className={`${styles.skeletonCircle} ${styles.shimmer}`}></div>
                </div>
            </section>
        </div>
    );
  }

  // --- Render ---
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

      {/* Basic Info */}
      <section className={styles.section}>
        <h2 className={styles.sectionSubtitle}>Basic Information</h2>
        <div className={styles.formGrid}>
          <div className={styles.formGroup} data-field="companyName">
            <label className={styles.label}>
              Company Name <span className={styles.required}>*</span>
            </label>
            <input 
              type="text" 
              value={companyData.companyName} 
              onChange={(e) => handleInputChange('companyName', e.target.value)} 
              className={`${styles.input} ${errors.companyName ? styles.inputError : ''}`} 
              placeholder="Enter company name" 
            />
            {errors.companyName && <span className={styles.errorText}>{errors.companyName}</span>}
          </div>
          
          <div className={styles.formGroup} data-field="website">
            <label className={styles.label}>Website</label>
            <input 
              type="url" 
              value={companyData.website} 
              onChange={(e) => handleInputChange('website', e.target.value)} 
              className={`${styles.input} ${errors.website ? styles.inputError : ''}`} 
              placeholder="https://example.com" 
            />
            {errors.website && <span className={styles.errorText}>{errors.website}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Main Location</label>
            <input 
              type="text" 
              value={companyData.mainLocation} 
              onChange={(e) => handleInputChange('mainLocation', e.target.value)} 
              className={styles.input} 
              placeholder="e.g., San Francisco, CA" 
            />
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* Logo */}
      <section className={styles.section}>
        <h2 className={styles.sectionSubtitle}>Company Logo</h2>
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".svg,.png,.jpg,.webp" className={styles.fileInput} />
        <div className={`${styles.imageUploadBox} ${uploadImageMutation.isPending ? styles.uploading : ''}`} onClick={() => !uploadImageMutation.isPending && fileInputRef.current?.click()}>
          {uploadImageMutation.isPending ? (
            <div className={styles.uploadingContainer}><div className={styles.spinner}></div><p>Uploading...</p></div>
          ) : imagePreview ? (
            <div className={styles.imagePreviewContainer}>
                <img src={imagePreview} alt="Logo" className={styles.previewImage} onError={(e) => e.target.src = "https://via.placeholder.com/200"} />
                <div className={styles.imageOverlay}>
                    <button className={styles.changeImageButton} onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Change</button>
                    <button className={styles.deleteImageButton} onClick={(e) => { e.stopPropagation(); handleDeleteImage(); }}>Remove</button>
                </div>
            </div>
          ) : (
            <div className={styles.placeholder}><div className={styles.uploadIcon}>🏢</div><p>Click to upload</p></div>
          )}
        </div>
      </section>

      <div className={styles.divider} />

      {/* Company Details */}
      <section className={styles.section}>
        <h2 className={styles.sectionSubtitle}>Company Details</h2>
        <div className={styles.formGrid}>
          {/* Employee Dropdown */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Employee Range <span className={styles.required}>*</span>
            </label>
            <div className={styles.dropdownContainer}>
                <div className={styles.dropdownHeader} onClick={() => setIsEmployeeOpen(!isEmployeeOpen)}>
                    <span>{companyData.employee || 'Select range'}</span>
                    <span className={styles.arrow}>{isEmployeeOpen ? '▲' : '▼'}</span>
                </div>
                {isEmployeeOpen && (
                  <div className={styles.dropdownList}>
                    {employeeRanges.map(r => (
                      <div key={r} className={styles.dropdownItem} onClick={() => { 
                        setCompanyData(p => ({...p, employee: r})); 
                        setIsEmployeeOpen(false); 
                        if (errors.employee) setErrors(prev => ({ ...prev, employee: '' }));
                      }}>
                        {r}
                      </div>
                    ))}
                  </div>
                )}
            </div>
            {errors.employee && <span className={styles.errorText}>{errors.employee}</span>}
          </div>
          
          {/* Industry */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Industry <span className={styles.required}>*</span>
            </label>
            <input 
              type="text" 
              value={companyData.industry} 
              onChange={(e) => handleInputChange('industry', e.target.value)} 
              className={`${styles.input} ${errors.industry ? styles.inputError : ''}`} 
              placeholder="Enter industry" 
            />
            {errors.industry && <span className={styles.errorText}>{errors.industry}</span>}
          </div>

          {/* Date Founded */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Date Founded <span className={styles.required}>*</span>
            </label>
            <div className={styles.dateInputs}>
                {/* Day Dropdown */}
                <div className={styles.dropdownContainer}>
                    <div 
                      className={styles.dropdownHeader} 
                      onClick={() => setIsDayOpen(!isDayOpen)}
                    >
                      {dateFounded.day || 'Day'}
                    </div>
                    {isDayOpen && (
                      <div className={styles.dropdownList}>
                        {availableDays.map(d => (
                          <div key={d} className={styles.dropdownItem} onClick={() => handleDateSelect('day', d)}>
                            {d}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                
                {/* Month Dropdown */}
                <div className={styles.dropdownContainer}>
                    <div 
                      className={styles.dropdownHeader} 
                      onClick={() => setIsMonthOpen(!isMonthOpen)}
                    >
                      {dateFounded.month || 'Month'}
                    </div>
                    {isMonthOpen && (
                      <div className={styles.dropdownList}>
                        {months.map(m => (
                          <div key={m} className={styles.dropdownItem} onClick={() => handleDateSelect('month', m)}>
                            {m}
                          </div>
                        ))}
                      </div>
                    )}
                </div>
                
                {/* Year Dropdown */}
                <div className={styles.dropdownContainer}>
                    <div 
                      className={styles.dropdownHeader} 
                      onClick={() => setIsYearOpen(!isYearOpen)}
                    >
                      {dateFounded.year || 'Year'}
                    </div>
                    {isYearOpen && (
                      <div className={styles.dropdownList}>
                        {years.map(y => (
                          <div key={y} className={styles.dropdownItem} onClick={() => handleDateSelect('year', y)}>
                            {y}
                        </div>
                        ))}
                      </div>
                    )}
                </div>
            </div>
            {errors.dateFounded && <span className={styles.errorText}>{errors.dateFounded}</span>}
          </div>
        </div>
      </section>

      <div className={styles.divider} />

      {/* Description */}
      <section className={styles.section}>
        <h2 className={styles.sectionSubtitle}>About Company (Optional)</h2>
        <textarea 
          value={companyData.description} 
          onChange={(e) => { 
            handleInputChange('description', e.target.value); 
            setCharacterCount(e.target.value.length); 
          }} 
          className={styles.textarea} 
          rows="6" 
          maxLength="1000" 
          placeholder="Describe your company (optional)" 
        />
        <p className={styles.characterCounter}>{characterCount} / 1000</p>
      </section>
      
      <div className={styles.actions}>
        <button 
          className={styles.saveButton} 
          onClick={handleSaveChanges} 
          disabled={updateProfileMutation.isPending || uploadImageMutation.isPending}
        >
          {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}