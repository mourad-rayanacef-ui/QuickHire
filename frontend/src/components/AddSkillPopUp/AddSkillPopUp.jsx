import { useState } from "react";
import styles from "../../components/AddSkillPopUp/AddSkillPopUp.module.css";
import wrongLogo from "../../../public/wrong.svg";
import Alert from "../Alert/Alert"; // ✅ Import Alert component

const AddSkillPopUp = ({ handlingAdding, className, onClose }) => {

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  // ✅ Alert state
  const [showAlert, setShowAlert] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ type: 'error', message: '' });

  // Validation error states
  const [errors, setErrors] = useState({
    title: "",
    description: "",
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
  const validateTitle = (value) => {
    if (!value.trim()) {
      return "Skill name is required.";
    }
    if (value.trim().length < 2) {
      return "Skill name must be at least 2 characters long.";
    }
    return "";
  };

  const validateDescription = (value) => {
    if (!value.trim()) {
      return "Skill description is required.";
    }
    if (value.trim().length < 10) {
      return "Description must be at least 10 characters long.";
    }
    return "";
  };

  const validateFile = () => {
    if (!file) {
      return "Skill certificate is required.";
    }
    return "";
  };

  // Handle input changes with validation
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setTitle(value);
    setErrors(prev => ({ ...prev, title: validateTitle(value) }));
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    setErrors(prev => ({ ...prev, description: validateDescription(value) }));
  };

  const handleAddClick = () => {
    // Validate all fields
    const titleError = validateTitle(title);
    const descriptionError = validateDescription(description);
    const fileError = validateFile();

    // Update all errors
    setErrors({
      title: titleError,
      description: descriptionError,
      file: fileError
    });

    // Check if there are any errors
    if (titleError || descriptionError || fileError) {
      showNotification("Please fix all validation errors before submitting.", 'warning'); // ✅ Alert
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      file,
      adding: false
    };

    // If a handler was passed from parent, call it with the payload
    if (typeof handlingAdding === "function") {
      handlingAdding(payload);

      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      setFileName("");
      setErrors({
        title: "",
        description: "",
        file: ""
      });
      
      showNotification("Skill added successfully!", 'success'); // ✅ Alert
    }
  };

  const handleCancel = () => {
    if (typeof onClose === "function") {
      onClose(); 
    }

    // Cleanup
    setTitle("");
    setDescription("");
    setFile(null);
    setFileName("");
    setErrors({
      title: "",
      description: "",
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
          <h5>Add Skill:</h5>
          <button onClick={handleCancel}><img src={wrongLogo} alt="close" /></button>
        </div>

        <div className={styles.SkillInput}>
          <p>Skill Name:</p>
          <input
            type="text"
            placeholder="Web Design ..."
            value={title}
            onChange={handleTitleChange}
            className={errors.title ? styles.inputError : ""}
          />
          {errors.title && <span className={styles.errorText}>{errors.title}</span>}
        </div>

        <div className={styles.SkillDescription}>
          <p>Skill Description:</p>
          <input
            type="text"
            placeholder="work at a designer for 3 years ..."
            value={description}
            onChange={handleDescriptionChange}
            className={errors.description ? styles.inputError : ""}
          />
          {errors.description && <span className={styles.errorText}>{errors.description}</span>}
        </div>

        <div className={styles.UploadCertificate}>
          <p>Upload Skill Certificate:</p>

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

export default AddSkillPopUp;