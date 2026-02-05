import React, { useState, useEffect } from 'react';
import styles from './JobPosting.module.css';
import ChatBot from '../../components/chatbot/ChatBot.jsx';
import Navbarcompany from '../../components/navbarcompany/navbarcompany.jsx';
import SideBarCompany from '../../components/SideBar/SideBarCompany.jsx';
import { companyAPI } from '../../services/api';

import bagIcon from '../../assets/bag.svg';
import paperIcon from '../../assets/paper.svg';
import JobSuccessPopup from '../../components/popups/JobSuccessPopup.jsx';

const JobPosting = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [jobData, setJobData] = useState({
    jobTitle: '',
    employmentTypes: '',
    category: '',
    skills: [],
    jobDescription: '',
    responsibilities: '',
    whoYouAre: '',
    niceToHaves: ''
  });

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [errors, setErrors] = useState({});

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [currentStep]);

  const employmentOptions = ['Full-Time', 'Part-Time', 'Remote', 'Internship', 'Contract'];

  const categoryOptions = [
    'Software Development',
    'Design & Creative',
    'Marketing',
    'Sales',
    'Customer Service',
    'Business',
    'Finance & Accounting',
    'HR & Recruiting',
    'Operations',
    'Other'
  ];

  // Validation functions
  const validateStep1 = () => {
    const newErrors = {};

    if (!jobData.jobTitle.trim()) {
      newErrors.jobTitle = 'Job title is required';
    }

    if (!jobData.employmentTypes) {
      newErrors.employmentTypes = 'Employment type is required';
    }

    if (!jobData.category) {
      newErrors.category = 'Category is required';
    }

    if (jobData.skills.length === 0) {
      newErrors.skills = 'At least one skill is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!jobData.jobDescription.trim()) {
      newErrors.jobDescription = 'Job description is required';
    }

    if (!jobData.responsibilities.trim()) {
      newErrors.responsibilities = 'Responsibilities are required';
    }

    if (!jobData.whoYouAre.trim()) {
      newErrors.whoYouAre = 'Who you are section is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmploymentTypeChange = (type) => {
    setJobData(prev => {
      return {
        ...prev,
        employmentTypes: prev.employmentTypes === type ? '' : type
      };
    });
    // Clear error when user selects an option
    if (errors.employmentTypes) {
      setErrors(prev => ({ ...prev, employmentTypes: '' }));
    }
  };

  const handleCategoryChange = (category) => {
    setJobData(prev => ({
      ...prev,
      category: prev.category === category ? '' : category
    }));
    setIsCategoryDropdownOpen(false);
    // Clear error when user selects an option
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: '' }));
    }
  };

  const handleAddSkill = () => {
    if (currentSkill.trim() && !jobData.skills.includes(currentSkill.trim())) {
      setJobData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
      // Clear error when user adds a skill
      if (errors.skills) {
        setErrors(prev => ({ ...prev, skills: '' }));
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setJobData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const toggleCategoryDropdown = () => {
    setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
  };

  const getDropdownLabel = () => {
    if (!jobData.category) {
      return 'Select Job Category';
    }
    return jobData.category;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(1);
  };

  const handlePostJob = async () => {
    if (validateStep2()) {
      try {
        setErrors({}); // Clear any previous errors

        // Transform frontend state to backend expected format
        const payload = {
          Job_role: jobData.jobTitle,
          Type: jobData.employmentTypes,
          Category: jobData.category,
          Skills: jobData.skills,
          Description: jobData.jobDescription,
          Responsibilities: jobData.responsibilities,
          WhoYouAre: jobData.whoYouAre,
          NiceToHave: jobData.niceToHaves
        };

        const response = await companyAPI.createJob(payload);

        if (response.success) {
          setShowSuccessPopup(true);
        } else {
          setErrors({ general: response.error || 'Failed to post job' });
        }
      } catch (error) {
        console.error('Error posting job:', error);
        setErrors({ general: error.response?.data?.error || 'An unexpected error occurred' });
      }
    }
  };

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
  };

  const handleViewDashboard = () => {
    // Navigate to dashboard
    console.log('Navigating to dashboard...');
    setShowSuccessPopup(false);
    // Add your navigation logic here
  };

  const handlePostAnotherJob = () => {
    // Reset form and prepare for another job post
    console.log('Preparing for another job post...');
    setShowSuccessPopup(false);
    // Reset form data if needed
    setJobData({
      jobTitle: '',
      employmentTypes: '',
      category: '',
      skills: [],
      jobDescription: '',
      responsibilities: '',
      whoYouAre: '',
      niceToHaves: ''
    });
    setErrors({});
    setCurrentStep(1);
  };

  const handleTextareaChange = (field, value) => {
    if (value.length <= 500) {
      setJobData(prev => ({
        ...prev,
        [field]: value
      }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: '' }));
      }
    }
  };

  const getCharacterCount = (text) => {
    return text.length;
  };

  // Helper function to handle input changes and clear errors
  const handleInputChange = (field, value) => {
    setJobData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>

      <Navbarcompany />
      <SideBarCompany />
      <ChatBot />
      <div className={styles.container}>

        <br></br>
        <br></br>
        <br></br>
        <br></br>
        <h3> Post a job </h3>
        <br></br>

        {/* Progress Header with Icons */}
        <div className={styles.progressHeader}>
          <div className={styles.progressSteps}>
            {/* Step 1 - Job Information with Bag Icon */}
            <div className={`${styles.step} ${currentStep === 1 ? styles.active : styles.bothActive}`}>
              <div className={styles.stepContent}>
                <div className={styles.stepIconArea}>
                  <div className={styles.iconContainer}>
                    <img src={bagIcon} alt="Job Information" className={styles.stepIcon} />
                  </div>
                  <div className={styles.stepNumber}>1</div>
                </div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepLabel}>Step 1/2</div>
                  <div className={styles.stepTitle}>Job Information</div>
                </div>
              </div>
            </div>

            {/* Step 2 - Job Description with Paper Icon */}
            <div className={`${styles.step} ${currentStep === 2 ? styles.bothActive : styles.inactive}`}>
              <div className={styles.stepContent}>
                <div className={styles.stepIconArea}>
                  <div className={styles.iconContainer}>
                    <img src={paperIcon} alt="Job Description" className={styles.stepIcon} />
                  </div>
                  <div className={styles.stepNumber}>2</div>
                </div>
                <div className={styles.stepInfo}>
                  <div className={styles.stepLabel}>Step 2/2</div>
                  <div className={styles.stepTitle}>Job Description</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            ></div>
          </div>
        </div>

        {/* Form Content - Added top-aligned styling */}
        <div className={`${styles.formContent} ${styles.topAligned}`}>
          {currentStep === 1 ? (
            <div className={styles.stepForm}>
              <h2>Basic Information</h2>
              <p className={styles.sectionDescription}>This information will be displayed publicly</p>

              {/* Job Title */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Job Title</label>
                <p className={styles.fieldDescription}>Job titles must describe one position</p>
                <input
                  type="text"
                  className={`${styles.formInput} ${errors.jobTitle ? styles.inputError : ''}`}
                  placeholder="e.g. Software Engineer"
                  value={jobData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                />
                {errors.jobTitle && <span className={styles.errorText}>{errors.jobTitle}</span>}
              </div>

              {/* Type of Employment - Single Selection */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Type of Employment</label>
                <p className={styles.fieldDescription}>Select one type of employment</p>
                <div className={styles.checkboxGrid}>
                  {employmentOptions.map((type) => (
                    <label key={type} className={styles.checkboxLabel}>
                      <input
                        type="radio"
                        name="employment-type"
                        checked={jobData.employmentTypes === type}
                        onChange={() => handleEmploymentTypeChange(type)}
                        className={styles.checkboxInput}
                      />
                      <span className={styles.checkmark}></span>
                      {type}
                    </label>
                  ))}
                </div>
                {errors.employmentTypes && <span className={styles.errorText}>{errors.employmentTypes}</span>}
              </div>

              {/* Categories */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category</label>
                <p className={styles.fieldDescription}>Select one job category</p>
                <div className={styles.categoriesContainer}>
                  <div className={styles.categoriesSelector}>
                    <div
                      className={`${styles.dropdownHeader} ${isCategoryDropdownOpen ? styles.dropdownOpen : ''} ${errors.category ? styles.inputError : ''}`}
                      onClick={toggleCategoryDropdown}
                    >
                      <span className={styles.dropdownLabelText}>
                        {getDropdownLabel()}
                      </span>
                      <span className={styles.dropdownCaret}>▼</span>
                    </div>

                    <div className={`${styles.dropdownOptionsContainer} ${isCategoryDropdownOpen ? styles.dropdownVisible : ''}`}>
                      <div className={styles.categoriesOptions}>
                        {categoryOptions.map((category) => (
                          <label key={category} className={styles.categoryLabel}>
                            <input
                              type="radio"
                              name="job-category"
                              checked={jobData.category === category}
                              onChange={() => handleCategoryChange(category)}
                              className={styles.categoryRadio}
                            />
                            <span className={styles.categoryRadioMark}></span>
                            {category}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {errors.category && <span className={styles.errorText}>{errors.category}</span>}
              </div>

              {/* Skills Section */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Required Skills</label>
                <p className={styles.fieldDescription}>Add skills required for this position</p>

                <div className={styles.skillsInputContainer}>
                  <input
                    type="text"
                    className={`${styles.skillsInput} ${errors.skills ? styles.inputError : ''}`}
                    placeholder="e.g. JavaScript, Communication, Leadership"
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <button
                    type="button"
                    className={styles.addSkillBtn}
                    onClick={handleAddSkill}
                    disabled={!currentSkill.trim()}
                  >
                    + Add Skill
                  </button>
                </div>

                {/* Skills List */}
                {jobData.skills.length > 0 && (
                  <div className={styles.skillsList}>
                    {jobData.skills.map((skill, index) => (
                      <div key={index} className={styles.skillTag}>
                        {skill}
                        <button
                          type="button"
                          className={styles.removeSkillBtn}
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {errors.skills && <span className={styles.errorText}>{errors.skills}</span>}
              </div>

              {/* Navigation */}
              <div className={styles.formNavigation}>
                <button
                  className={styles.nextBtn}
                  onClick={handleNext}
                  disabled={!jobData.jobTitle || !jobData.employmentTypes || !jobData.category || jobData.skills.length === 0}
                >
                  Next Step →
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.stepForm}>
              <h2>Job Details</h2>
              <p className={styles.sectionDescription}>Add the description of the job, responsibilities, who you are, and nice-to-haves.</p>

              {/* Job Description */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Job Description</label>
                <p className={styles.fieldDescription}>Describe the role and its purpose</p>
                <textarea
                  className={`${styles.descriptionTextarea} ${errors.jobDescription ? styles.inputError : ''}`}
                  placeholder="Enter job description"
                  value={jobData.jobDescription}
                  onChange={(e) => handleTextareaChange('jobDescription', e.target.value)}
                  rows={6}
                />
                <div className={styles.characterCount}>
                  {getCharacterCount(jobData.jobDescription)} / 500
                </div>
                {errors.jobDescription && <span className={styles.errorText}>{errors.jobDescription}</span>}
              </div>

              {/* Responsibilities */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Responsibilities</label>
                <p className={styles.fieldDescription}>Outline the core responsibilities of the position</p>
                <textarea
                  className={`${styles.descriptionTextarea} ${errors.responsibilities ? styles.inputError : ''}`}
                  placeholder="Enter job responsibilities"
                  value={jobData.responsibilities}
                  onChange={(e) => handleTextareaChange('responsibilities', e.target.value)}
                  rows={6}
                />
                <div className={styles.characterCount}>
                  {getCharacterCount(jobData.responsibilities)} / 500
                </div>
                {errors.responsibilities && <span className={styles.errorText}>{errors.responsibilities}</span>}
              </div>

              {/* Who You Are */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Who You Are</label>
                <p className={styles.fieldDescription}>Add your preferred candidate's qualifications</p>
                <textarea
                  className={`${styles.descriptionTextarea} ${errors.whoYouAre ? styles.inputError : ''}`}
                  placeholder="Enter qualifications"
                  value={jobData.whoYouAre}
                  onChange={(e) => handleTextareaChange('whoYouAre', e.target.value)}
                  rows={6}
                />
                <div className={styles.characterCount}>
                  {getCharacterCount(jobData.whoYouAre)} / 500
                </div>
                {errors.whoYouAre && <span className={styles.errorText}>{errors.whoYouAre}</span>}
              </div>

              {/* Nice-to-Haves */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nice-to-Haves</label>
                <p className={styles.fieldDescription}>Add nice-to-have skills and qualifications</p>
                <textarea
                  className={styles.descriptionTextarea}
                  placeholder="Enter nice-to-haves"
                  value={jobData.niceToHaves}
                  onChange={(e) => handleTextareaChange('niceToHaves', e.target.value)}
                  rows={6}
                />
                <div className={styles.characterCount}>
                  {getCharacterCount(jobData.niceToHaves)} / 500
                </div>
              </div>

              {/* Navigation */}
              <div className={styles.formNavigation}>
                <button className={styles.previousBtn} onClick={handlePrevious}>
                  ← Previous
                </button>
                <button
                  className={styles.postJobBtn}
                  onClick={handlePostJob}
                  disabled={!jobData.jobDescription || !jobData.responsibilities || !jobData.whoYouAre}
                >
                  POST JOB
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Success Popup */}
        <JobSuccessPopup
          isVisible={showSuccessPopup}
          onClose={handleClosePopup}
          onViewDashboard={handleViewDashboard}
          onPostAnotherJob={handlePostAnotherJob}
        />
      </div>

    </>
  );
};

export default JobPosting;