import { useState } from "react";
import styles from "../../components/AddExperiencePopUp/AddExperiencePopUp.module.css";
import wrongLogo from "../../../public/wrong.svg";
import Alert from "../Alert/Alert" // ✅ Import Alert component

// Regex for valid date range
const dateRangeRegex =
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4} - ((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}|Present)$/;

const AddExperiencePopUp = ({ handlingAdding, className, onClose }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobType, setJobType] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [location, setLocation] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  // Improved single-cell date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startMonth, setStartMonth] = useState(""); // YYYY-MM
  const [endMonth, setEndMonth] = useState(""); // YYYY-MM
  const [isPresent, setIsPresent] = useState(false);

  // ✅ Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'error', message: '' });

  const [errors, setErrors] = useState({
    jobTitle: "",
    company: "",
    jobType: "",
    dateRange: "",
    location: "",
    jobDescription: "",
    file: ""
  });

  // ✅ Helper function to show alerts
  const showNotification = (message, type = 'error') => {
    setAlertConfig({ type, message });
    setShowAlert(true);
  };

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type.startsWith("image/")) {
      setFile(uploadedFile);
      setFileName(uploadedFile.name);
      setErrors(prev => ({ ...prev, file: "" }));
    } else {
      setErrors(prev => ({ ...prev, file: "Please upload an image file (PNG, JPG, JPEG)." }));
      showNotification("Please upload an image file (PNG, JPG, JPEG).", 'error'); // ✅ Alert
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setFileName(droppedFile.name);
      setErrors(prev => ({ ...prev, file: "" }));
    } else {
      setErrors(prev => ({ ...prev, file: "Only image files are allowed (PNG, JPG, JPEG)." }));
      showNotification("Only image files are allowed (PNG, JPG, JPEG).", 'error'); // ✅ Alert
    }
  };

  // Validation Functions
  const validateJobTitle = (value) => {
    if (!value.trim()) return "Job title is required.";
    if (value.trim().length < 3) return "Job title must be at least 3 characters long.";
    return "";
  };

  const validateCompany = (value) => {
    if (!value.trim()) return "Company name is required.";
    if (value.trim().length < 2) return "Company name must be at least 2 characters long.";
    return "";
  };

  const validateJobType = (value) => {
    if (!value.trim()) return "Job type is required.";
    return "";
  };

  // NEW — enhanced date-range validation
 const validateDateRange = (value) => {
  if (!value.trim()) return "Date range is required.";

  // Basic format validation
  if (!dateRangeRegex.test(value))
    return "Invalid format. Example: Jun 2019 - Present";

  // --- Chronological validation ---
  const [start, end] = value.split(" - ");

  const months = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
  };

  // Parse start date
  const [startMonthTxt, startYearTxt] = start.split(" ");
  const startMonth = months[startMonthTxt];
  const startYear = parseInt(startYearTxt);

  // Check "Present"
  if (end === "Present") return "";

  // Parse end date
  const [endMonthTxt, endYearTxt] = end.split(" ");
  const endMonth = months[endMonthTxt];
  const endYear = parseInt(endYearTxt);

  // Compare year then month
  if (endYear < startYear) return "End date must be after start date.";
  if (endYear === startYear && endMonth < startMonth)
    return "End date must be after start date.";

  return "";
};

  const validateLocation = (value) => {
    if (!value.trim()) return "Location is required.";
    return "";
  };

  const validateJobDescription = (value) => {
    if (!value.trim()) return "Job description is required.";
    if (value.trim().length < 10) return "Description must be at least 10 characters long.";
    return "";
  };

  const validateFile = () => {
    if (!file) return "Company logo/image is required.";
    return "";
  };

  // Input Handlers
  const handleJobTitleChange = (e) => {
    const value = e.target.value;
    setJobTitle(value);
    setErrors(prev => ({ ...prev, jobTitle: validateJobTitle(value) }));
  };

  const handleCompanyChange = (e) => {
    const value = e.target.value;
    setCompany(value);
    setErrors(prev => ({ ...prev, company: validateCompany(value) }));
  };

  const handleJobTypeChange = (e) => {
    const value = e.target.value;
    setJobType(value);
    setErrors(prev => ({ ...prev, jobType: validateJobType(value) }));
  };

  // NEW — validate while typing + maxLength
  const handleDateRangeChange = (e) => {
    const value = e.target.value;
    setDateRange(value);
    setErrors(prev => ({ ...prev, dateRange: validateDateRange(value) }));
  };

  // Helpers for month-picker (type="month")
  const monthsShort = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const monthInputToDisplay = (val) => {
    if (!val) return "";
    const [y, m] = val.split('-');
    const monthIdx = parseInt(m, 10) - 1;
    return `${monthsShort[monthIdx]} ${y}`;
  };

  const handleStartMonthChange = (e) => {
    const val = e.target.value; // YYYY-MM
    setStartMonth(val);
    const startDisplay = monthInputToDisplay(val);
    const endDisplay = isPresent ? 'Present' : monthInputToDisplay(endMonth);
    const combined = startDisplay && (endDisplay ? `${startDisplay} - ${endDisplay}` : startDisplay);
    setDateRange(combined);
    setErrors(prev => ({ ...prev, dateRange: validateDateRange(combined) }));
  };

  const handleEndMonthChange = (e) => {
    const val = e.target.value;
    setEndMonth(val);
    const startDisplay = monthInputToDisplay(startMonth);
    const endDisplay = isPresent ? 'Present' : monthInputToDisplay(val);
    const combined = startDisplay && (endDisplay ? `${startDisplay} - ${endDisplay}` : startDisplay);
    setDateRange(combined);
    setErrors(prev => ({ ...prev, dateRange: validateDateRange(combined) }));
  };

  const togglePresent = () => {
    setIsPresent(prev => {
      const next = !prev;
      const startDisplay = monthInputToDisplay(startMonth);
      const endDisplay = next ? 'Present' : monthInputToDisplay(endMonth);
      const combined = startDisplay && (endDisplay ? `${startDisplay} - ${endDisplay}` : startDisplay);
      setDateRange(combined);
      setErrors(prevErr => ({ ...prevErr, dateRange: validateDateRange(combined) }));
      return next;
    });
  };

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocation(value);
    setErrors(prev => ({ ...prev, location: validateLocation(value) }));
  };

  const handleJobDescriptionChange = (e) => {
    const value = e.target.value;
    setJobDescription(value);
    setErrors(prev => ({ ...prev, jobDescription: validateJobDescription(value) }));
  };

  const handleAddClick = () => {
    const jobTitleError = validateJobTitle(jobTitle);
    const companyError = validateCompany(company);
    const jobTypeError = validateJobType(jobType);
    const dateRangeError = validateDateRange(dateRange);
    const locationError = validateLocation(location);
    const jobDescriptionError = validateJobDescription(jobDescription);
    const fileError = validateFile();

    setErrors({
      jobTitle: jobTitleError,
      company: companyError,
      jobType: jobTypeError,
      dateRange: dateRangeError,
      location: locationError,
      jobDescription: jobDescriptionError,
      file: fileError
    });

    if (jobTitleError || companyError || jobTypeError || dateRangeError || locationError || jobDescriptionError || fileError) {
      showNotification("Please fix all validation errors before submitting.", 'warning'); // ✅ Alert
      return;
    }

    const payload = {
      CompanyImg: file,
      JobTitle: jobTitle.trim(),
      Company: company.trim(),
      JobType: jobType.trim(),
      date: dateRange.trim(),
      // include ISO start/end dates so parent can persist correctly
      startDate: startMonth ? new Date(startMonth + "-01").toISOString() : null,
      endDate: isPresent ? null : (endMonth ? new Date(endMonth + "-01").toISOString() : null),
      Location: location.trim(),
      JobDescription: jobDescription.trim(),
      adding: false,
    };

    if (typeof handlingAdding === "function") {
      handlingAdding(payload);
      setJobTitle(""); setCompany(""); setJobType(""); setDateRange("");
      setLocation(""); setJobDescription(""); setFile(null); setFileName("");
      setErrors({ jobTitle:"",company:"",jobType:"",dateRange:"",location:"",jobDescription:"",file:"" });
      showNotification("Experience added successfully!", 'success'); // ✅ Alert
    }
  };

  const handleCancel = () => {
    if (typeof onClose === "function") onClose();
    else if (typeof handlingAdding === "function") handlingAdding({ adding: false });

    setJobTitle(""); setCompany(""); setJobType(""); setDateRange("");
    setLocation(""); setJobDescription(""); setFile(null); setFileName("");
    setErrors({ jobTitle:"",company:"",jobType:"",dateRange:"",location:"",jobDescription:"",file:"" });
  };

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

      <div className={`${styles.AddExperiencePopUp} ${className || ""}`}>
        <div className={styles.Header}>
          <h5>Add Experience:</h5>
          <button onClick={handleCancel}>
            <img src={wrongLogo} alt="close" />
          </button>
        </div>

        <div className={styles.RowInputs}>
          <div className={styles.Col}>
            <p>Job Title:</p>
            <input 
              type="text"
              placeholder="Product Designer" 
              value={jobTitle} 
              onChange={handleJobTitleChange}
              className={errors.jobTitle ? styles.inputError : ""}
            />
            {errors.jobTitle && <span className={styles.errorText}>{errors.jobTitle}</span>}

            <p>Company:</p>
            <input 
              type="text"
              placeholder="Twitter" 
              value={company} 
              onChange={handleCompanyChange}
              className={errors.company ? styles.inputError : ""}
            />
            {errors.company && <span className={styles.errorText}>{errors.company}</span>}

            <p>Job Type:</p>
            <input 
              type="text"
              placeholder="Full Time" 
              value={jobType} 
              onChange={handleJobTypeChange}
              className={errors.jobType ? styles.inputError : ""}
            />
            {errors.jobType && <span className={styles.errorText}>{errors.jobType}</span>}
          </div>

          <div className={styles.Col}>
            <p>Date Range:</p>
            <div style={{ position: 'relative' }}>
              <input 
                type="text"
                placeholder="Jun 2019 - Present"
                maxLength={30}
                value={dateRange}
                onChange={handleDateRangeChange}
                onFocus={() => setShowDatePicker(true)}
                className={errors.dateRange ? styles.inputError : ""}
                readOnly={false}
              />

              {/* Popover with two month inputs (keeps visible UI as single cell) */}
              {showDatePicker && (
                <div className={styles.datePickerPopover} onMouseDown={(e) => e.preventDefault()}>
                  <div className={styles.monthRow}>
                    <label>Start</label>
                    <input type="month" value={startMonth} onChange={handleStartMonthChange} />
                  </div>

                  <div className={styles.monthRow}>
                    <label>End</label>
                    <input type="month" value={endMonth} onChange={handleEndMonthChange} disabled={isPresent} />
                  </div>

                  <div className={styles.presentRow}>
                    <label>
                      <input type="checkbox" checked={isPresent} onChange={togglePresent} /> Present
                    </label>
                    <div className={styles.pickerButtons}>
                      <button type="button" onClick={() => setShowDatePicker(false)}>Done</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {errors.dateRange && <span className={styles.errorText}>{errors.dateRange}</span>}

            <p>Location:</p>
            <input 
              type="text"
              placeholder="Damous-Algeria" 
              value={location}
              onChange={handleLocationChange}
              className={errors.location ? styles.inputError : ""}
            />
            {errors.location && <span className={styles.errorText}>{errors.location}</span>}

            <p>Job Description:</p>
            <input 
              type="text"
              placeholder="Describe the role..." 
              value={jobDescription}
              onChange={handleJobDescriptionChange}
              className={errors.jobDescription ? styles.inputError : ""}
            />
            {errors.jobDescription && <span className={styles.errorText}>{errors.jobDescription}</span>}
          </div>
        </div>

        <div className={styles.UploadCertificate}>
          <p>Upload Company Logo / Image:</p>

          <div 
            className={`${styles.UploadBox} ${errors.file ? styles.uploadError : ""}`}
            onDragOver={handleDragOver} 
            onDrop={handleDrop}
          >
            <input 
              type="file" 
              accept="image/*" 
              id="expFileInput" 
              onChange={handleFileChange} 
              hidden 
            />
            <label htmlFor="expFileInput" className={styles.UploadLabel}>
              <div className={styles.UploadIcon}>⬆️</div>
              <p>{fileName ? <strong>{fileName}</strong> : <><strong>Browse Image</strong> or drop here</>}</p>
              <small>Only image files allowed (PNG, JPG, JPEG). Max file size 12 MB.</small>
            </label>
          </div>
          {errors.file && <span className={styles.errorText}>{errors.file}</span>}
        </div>

        <div className={styles.TwoButtons}>
          <button className={styles.btn1} onClick={handleCancel}>Cancel</button>
          <button className={styles.btn2} onClick={handleAddClick}>Add</button>
        </div>
      </div>
    </>
  );
};

export default AddExperiencePopUp;