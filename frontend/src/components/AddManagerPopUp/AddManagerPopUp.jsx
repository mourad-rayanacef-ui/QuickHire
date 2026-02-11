import { useState } from "react";
import styles from "./AddManagerPopUp.module.css";
import wrongLogo from "../../../public/wrong.svg";
import Alert from "../Alert/Alert"; // ✅ Import Alert component

const AddManagerPopUp = ({ handlingAdding, className, onClose }) => {

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [linkedInAccount, setLinkedInAccount] = useState("");
  const [gmailAccount, setGmailAccount] = useState("");
  
  // ✅ Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'error', message: '' });

  // Validation error states
  const [errors, setErrors] = useState({
    name: "",
    role: "",
    linkedInAccount: "",
    gmailAccount: "",
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

      setTimeout(() => {
     
      }, 0);
    } else {
      console.warn("Invalid file selected:", uploadedFile);
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

  // Validation functions
  const validateName = (value) => {
    if (!value.trim()) {
      return "Manager name is required.";
    }
    if (value.trim().length < 3) {
      return "Name must be at least 3 characters long.";
    }
    return "";
  };

  const validateRole = (value) => {
    if (!value.trim()) {
      return "Manager role is required.";
    }
    if (value.trim().length < 2) {
      return "Role must be at least 2 characters long.";
    }
    return "";
  };

  const validateLinkedIn = (value) => {
    if (!value.trim()) {
      return "LinkedIn account is required.";
    }
    const linkedInPattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/;
    if (!linkedInPattern.test(value.trim())) {
      return "Please enter a valid LinkedIn profile URL.";
    }
    return "";
  };

  const validateEmail = (value) => {
    if (!value.trim()) {
      return "Email is required.";
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value.trim())) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const validateFile = () => {
    if (!file) {
      return "Manager photo is required.";
    }
    return "";
  };

  // Handle input changes with validation
  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    setErrors(prev => ({ ...prev, name: validateName(value) }));
  };

  const handleRoleChange = (e) => {
    const value = e.target.value;
    setRole(value);
    setErrors(prev => ({ ...prev, role: validateRole(value) }));
  };

  const handleLinkedInChange = (e) => {
    const value = e.target.value;
    setLinkedInAccount(value);
    setErrors(prev => ({ ...prev, linkedInAccount: validateLinkedIn(value) }));
  };

  const handleGmailChange = (e) => {
    const value = e.target.value;
    setGmailAccount(value);
    setErrors(prev => ({ ...prev, gmailAccount: validateEmail(value) }));
  };

  const handleAddClick = () => {
    // Validate all fields
    const nameError = validateName(name);
    const roleError = validateRole(role);
    const linkedInError = validateLinkedIn(linkedInAccount);
    const gmailError = validateEmail(gmailAccount);
    const fileError = validateFile();

    // Update all errors
    setErrors({
      name: nameError,
      role: roleError,
      linkedInAccount: linkedInError,
      gmailAccount: gmailError,
      file: fileError
    });

    // Check if there are any errors
    if (nameError || roleError || linkedInError || gmailError || fileError) {
      showNotification("Please fix all validation errors before submitting.", 'warning'); // ✅ Alert
      return;
    }

    const payload = {
      name: name.trim(),
      role: role.trim(),
      linkedInAccount: linkedInAccount.trim(),
      gmailAccount: gmailAccount.trim(),
      file,
      adding: false
    };



    if (typeof handlingAdding === "function") {
      handlingAdding(payload);

      // Reset form
      setName("");
      setRole("");
      setLinkedInAccount("");
      setGmailAccount("");
      setFile(null);
      setFileName("");
      setErrors({
        name: "",
        role: "",
        linkedInAccount: "",
        gmailAccount: "",
        file: ""
      });
      
      showNotification("Manager added successfully!", 'success'); // ✅ Alert
    }
  };

  const handleCancel = () => {
    if (typeof onClose === "function") {
      onClose(); 
    }

    // Cleanup
    setName("");
    setRole("");
    setLinkedInAccount("");
    setGmailAccount("");
    setFile(null);
    setFileName("");
    setErrors({
      name: "",
      role: "",
      linkedInAccount: "",
      gmailAccount: "",
      file: ""
    });
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

      <div className={`${styles.AddSkillPopUp} ${className || ""}`}>
        <div className={styles.Header}>
          <h5>Add Manager:</h5>
          <button onClick={handleCancel}><img src={wrongLogo} alt="close" /></button>
        </div>
            
        <div className={styles.managerInfo}>
          <div className={styles.SkillInput}>
            <p>Manager Name:</p>
            <input
              type="text"
              placeholder="Ayyoub Acef ..."
              value={name}
              onChange={handleNameChange}
              className={errors.name ? styles.inputError : ""}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.SkillRole}>
            <p>Manager Role:</p>
            <input
              type="text"
              placeholder="Vice President"
              value={role}
              onChange={handleRoleChange}
              className={errors.role ? styles.inputError : ""}
            />
            {errors.role && <span className={styles.errorText}>{errors.role}</span>}
          </div>
        </div>

        <div className={styles.mediaInfo}>
          <div className={styles.mediaContainer}>
            <p>Manager LinkedIn:</p>
            <input
              type="url"
              placeholder="https://linkedin.com/in/username"
              value={linkedInAccount}
              onChange={handleLinkedInChange}
              className={errors.linkedInAccount ? styles.inputError : ""}
            />    
            {errors.linkedInAccount && <span className={styles.errorText}>{errors.linkedInAccount}</span>}
          </div>
          
          <div className={styles.mediaContainer}>
            <p>Gmail:</p>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={gmailAccount}
              onChange={handleGmailChange}
              className={errors.gmailAccount ? styles.inputError : ""}
            />    
            {errors.gmailAccount && <span className={styles.errorText}>{errors.gmailAccount}</span>}
          </div>
        </div>
          
        <div className={styles.UploadCertificate}>
          <p>Upload Manager Photo:</p>

          <div
            className={`${styles.UploadBox} ${errors.file ? styles.uploadError : ""}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              id="fileInput"
              onChange={handleFileChange}
              hidden
            />
            <label htmlFor="fileInput" className={styles.UploadLabel}>
              <div className={styles.UploadIcon}>⬆️</div>
              <p>
                {fileName ? (
                  <strong>{fileName}</strong>
                ) : (
                  <>
                    <strong>Browse Image</strong> or drop here
                  </>
                )}
              </p>
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

export default AddManagerPopUp;