import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import styles from './login.module.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [accountType, setAccountType] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setVerifying(false);
      setValidToken(false);
      return;
    }

    try {
      const response = await authAPI.verifyResetToken(token);
      if (response.data.success) {
        setValidToken(true);
        setAccountType(response.data.accountType);
        setEmail(response.data.email);
      } else {
        setValidToken(false);
      }
    } catch (error) {
      console.error('Token verification error:', error);
      setValidToken(false);
    } finally {
      setVerifying(false);
    }
  };

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

  const validateForm = () => {
    const newErrors = {};
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (!passwordRegex.test(formData.newPassword)) {
      newErrors.newPassword = 'Password must contain at least 8 characters, uppercase, lowercase, number and special character.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      
      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/SignIn', { 
            state: { message: 'Password reset successfully! Please login with your new password.' }
          });
        }, 3000);
      } else {
        setErrors({ general: response.data.error || 'Failed to reset password' });
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setErrors({ 
        general: error.response?.data?.error || 'An error occurred. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Verifying state
  if (verifying) {
    return (
      <div className={styles.container}>
        <div className={styles['forms-container']}>
          <div className={styles['signin-signup']}>
            <div className={styles['sign-in-form']}>
              <div className={styles['spinner-container']}>
                <div className={styles.spinner}></div>
                <p className={styles['loading-text']}>Verifying reset link...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!validToken) {
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
            <div className={styles['sign-in-form']}>
              <div className={styles['invalid-token-container']}>
                <i className={`fas fa-exclamation-triangle ${styles['invalid-token-icon']}`}></i>
                
                <h2 className={styles.title}>Invalid Reset Link</h2>
                
                <p className={styles['invalid-token-message']}>
                  This password reset link is invalid or has expired. 
                  Please request a new reset link.
                </p>

                <div className={styles['button-container']}>
                  <Link to="/forgot-password" className={styles['link-btn']}>
                    <button type="button" className={`${styles.btn} ${styles.solid}`}>
                      Request New Reset Link
                    </button>
                  </Link>
                  
                  <Link to="/SignIn" className={styles['link-btn']}>
                    <button type="button" className={`${styles.btn} ${styles.transparent}`}>
                      Back to Login
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles['panels-container']}>
          <div className={`${styles.panel} ${styles['left-panel']}`}>
            <div className={styles.content}>
              <h3>Reset Link Issue</h3>
              <p>Please request a new reset link to continue.</p>
            </div>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/594/594598.png" 
              className={styles.image} 
              alt="Error illustration" 
            />
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles['forms-container']}>
          <div className={styles['signin-signup']}>
            <div className={styles['sign-in-form']}>
              <div className={styles['success-container']}>
                <i className={`fas fa-check-circle ${styles['success-check-icon']}`}></i>
                
                <h2 className={styles.title}>Password Reset Successful!</h2>
                
                <p className={styles['success-message']}>
                  Your password has been reset successfully. 
                  You will be redirected to the login page shortly.
                </p>
                
                <div className={styles['user-info-box']}>
                  <i className="fas fa-user-circle"></i>
                  <p>Account: <strong>{email}</strong> ({accountType})</p>
                </div>
                
                <div className={styles['progress-bar-container']}>
                  <div className={styles['progress-bar-fill']}></div>
                </div>

                <Link to="/SignIn" className={styles['link-btn']}>
                  <button type="button" className={`${styles.btn} ${styles.solid}`}>
                    Go to Login Now
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className={styles['panels-container']}>
          <div className={`${styles.panel} ${styles['left-panel']}`}>
            <div className={styles.content}>
              <h3>All Set!</h3>
              <p>Your password has been updated successfully.</p>
            </div>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/190/190411.png" 
              className={styles.image} 
              alt="Success illustration" 
            />
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
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
          <form className={styles['sign-in-form']} onSubmit={handleSubmit}>
            <h2 className={styles.title}>Set New Password</h2>
            
            {errors.general && (
              <div className={styles['error-alert']}>
                {errors.general}
              </div>
            )}

            <div className={styles['password-info-box']}>
              <p>
                <i className="fas fa-user-circle"></i> Resetting password for: <strong>{email}</strong> ({accountType})
              </p>
            </div>

            <p className={styles['form-description']}>
              Create a new password for your account.
            </p>

            <div className={styles['input-wrapper']}>
              <div className={`${styles['input-field']} ${errors.newPassword ? styles['has-error'] : ''}`}>
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  placeholder="New Password" 
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.newPassword && (
                <span className={styles['error-text']}>{errors.newPassword}</span>
              )}
              <small className={styles['input-help-text']}>
                Must be 8+ characters with uppercase, lowercase, number & special character
              </small>
            </div>

            <div className={styles['input-wrapper']}>
              <div className={`${styles['input-field']} ${errors.confirmPassword ? styles['has-error'] : ''}`}>
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  placeholder="Confirm New Password" 
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              {errors.confirmPassword && (
                <span className={styles['error-text']}>{errors.confirmPassword}</span>
              )}
            </div>

            <input 
              type="submit" 
              value={loading ? "Resetting..." : "Reset Password"} 
              className={`${styles.btn} ${styles.solid}`}
              disabled={loading}
            />

            <Link to="/SignIn" className={styles['link-btn']}>
              <button type="button" className={`${styles.btn} ${styles.transparent}`}>
                Cancel
              </button>
            </Link>
          </form>
        </div>
      </div>

      <div className={styles['panels-container']}>
        <div className={`${styles.panel} ${styles['left-panel']}`}>
          <div className={styles.content}>
            <h3>Create New Password</h3>
            <p>Make sure it's strong and secure.</p>
          </div>
          <img 
            src="https://cdn-icons-png.flaticon.com/512/3067/3067256.png" 
            className={styles.image} 
            alt="Reset password illustration" 
          />
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;