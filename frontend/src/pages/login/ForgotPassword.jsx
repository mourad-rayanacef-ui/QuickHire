import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import styles from './login.module.css';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: success message
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    accountType: 'user',
    Email: ''
  });

  const handleBackClick = () => {
    navigate('/SignIn');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAccountTypeChange = (type) => {
    setFormData(prev => ({ ...prev, accountType: type }));
    setErrors({});
  };

  const validateEmail = () => {
    const newErrors = {};
    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!formData.Email.trim()) {
      newErrors.Email = 'Email is required.';
    } else if (!emailRegex.test(formData.Email)) {
      newErrors.Email = 'Please enter a valid email address.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateEmail();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const responseData = await authAPI.forgotPassword(formData);
      
      if (responseData.success || responseData.message) {
        setStep(2);
      } else {
        setErrors({ 
          general: responseData.error || responseData.message || 'Failed to send reset email'
        });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'An error occurred. Please try again.';
      
      if (error.response?.data) {
        errorMessage = 
          error.response.data.error ||
          error.response.data.message ||
          error.response.data.detail ||
          `Server error (${error.response.status})`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || 'An unexpected error occurred.';
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles['back-btn']} 
        onClick={handleBackClick}
        title="Go back to login"
      >
        <i className="fas fa-arrow-left"></i>
        <span>Back to Login</span>
      </button>

      <div className={styles['forms-container']}>
        <div className={styles['signin-signup']}>
          {step === 1 ? (
            <form className={styles['sign-in-form']} onSubmit={handleSubmit}>
              <h2 className={styles.title}>Reset Password</h2>
              
              {errors.general && (
                <div className={styles['error-alert']}>
                  {errors.general}
                </div>
              )}

              <p className={styles['form-description']}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <div className={styles['user-type-toggle']}>
                <button 
                  type="button"
                  className={`${styles['toggle-btn']} ${formData.accountType === 'user' ? styles.active : ''}`}
                  onClick={() => handleAccountTypeChange('user')}
                  disabled={loading}
                >
                  User
                </button>
                <button 
                  type="button"
                  className={`${styles['toggle-btn']} ${formData.accountType === 'company' ? styles.active : ''}`}
                  onClick={() => handleAccountTypeChange('company')}
                  disabled={loading}
                >
                  Company
                </button>
              </div>

              <div className={styles['input-wrapper']}>
                <div className={`${styles['input-field']} ${errors.Email ? styles['has-error'] : ''}`}>
                  <i className="fas fa-envelope"></i>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    name="Email"
                    value={formData.Email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
                {errors.Email && (
                  <span className={styles['error-text']}>{errors.Email}</span>
                )}
              </div>

              <input 
                type="submit" 
                value={loading ? "Sending..." : "Send Reset Link"} 
                className={`${styles.btn} ${styles.solid}`}
                disabled={loading}
              />

              <Link to="/SignIn" className={styles['link-btn']}>
                <button type="button" className={`${styles.btn} ${styles.transparent}`}>
                  Back to Login
                </button>
              </Link>
            </form>
          ) : (
            <div className={styles['sign-in-form']}>
              <div className={styles['success-container']}>
                <i className={`fas fa-envelope-circle-check ${styles['email-icon-large']}`}></i>
                
                <h2 className={styles.title}>Check Your Email</h2>
                
                <p className={styles['success-message']}>
                  We've sent a password reset link to <strong>{formData.Email}</strong>. 
                  Please check your email and click the link to reset your password.
                </p>
                
                <p className={styles['expiry-notice']}>
                  <i className="fas fa-clock"></i> The link will expire in 1 hour.
                </p>

                <div className={styles['button-container']}>
                  <button 
                    onClick={handleSubmit}
                    className={`${styles.btn} ${styles.transparent}`}
                    disabled={loading}
                  >
                    <i className="fas fa-redo"></i> Resend Link
                  </button>
                  
                  <Link to="/SignIn" className={styles['link-btn']}>
                    <button type="button" className={`${styles.btn} ${styles.solid}`}>
                      Return to Login
                    </button>
                  </Link>
                </div>

                <p className={styles['help-text']}>
                  Didn't receive the email? Check your spam folder or try again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles['panels-container']}>
        <div className={`${styles.panel} ${styles['left-panel']}`}>
          <div className={styles.content}>
            <h3>Forgot Your Password?</h3>
            <p>Don't worry, we'll help you reset it.</p>
          </div>
          <img 
            src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" 
            className={styles.image} 
            alt="Forgot password illustration" 
          />
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;