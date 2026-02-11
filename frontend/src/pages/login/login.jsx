import React, { useState } from 'react';
import styles from './login.module.css';
import Register from "../../../public/register.svg"
import login from "../../../public/log.svg"
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../../context/AuthContext';

const LoginSignup = () => {
  const navigate = useNavigate();
  const { logIn } = useAuth();
  
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [userType, setUserType] = useState('user');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setIsSignUpMode((prevMode) => !prevMode);
    setErrors({});
  };

  const handleBackClick = () => {
    navigate("/");
  };

  // LOGIN HANDLER
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const email = document.getElementById("login-email-input").value.trim();
    const password = document.getElementById("login-password-input").value.trim();

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;

    if (!email) {
      newErrors.loginEmail = "Email is required.";
    } else if (!emailRegex.test(email)) {
      newErrors.loginEmail = "Please enter a valid email.";
    }

    if (!password) {
      newErrors.loginPassword = "Password is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      const result = await logIn({
        accountType: userType,
        Email: email,
        Password: password
      });

      if (result.success) {
        setErrors({});
        if (result.accountType === "user") {
          navigate("/User/Home");
        } else if (result.accountType === "company") {
          navigate("/Company/Home");
        }
      } else {
        setErrors({ general: result.error || "Login failed. Please try again." });
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrors({ general: "An error occurred during login. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // SIGNUP HANDLER - Collect basic info and navigate to MultiStepSignup
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (userType === 'user') {
      const firstName = document.getElementById("SignupFirstName").value.trim();
      const lastName = document.getElementById("SignupLastName").value.trim();
      const phone = document.getElementById("SignupPhone").value.trim();
      const email = document.getElementById("SignupEmail").value.trim();
      const password = document.getElementById("SignupPassword").value.trim();
      const confirmPassword = document.getElementById("SignupConfirmPassword").value.trim();

      const nameRegex = /^[A-Za-z ]+$/;
      const phoneRegex = /^[0-9+\- ]+$/;
      const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!firstName) {
        newErrors.firstName = "First name is required.";
      } else if (!nameRegex.test(firstName) || firstName.length < 2) {
        newErrors.firstName = "First name must contain only letters (minimum 2 characters).";
      }

      if (!lastName) {
        newErrors.lastName = "Last name is required.";
      } else if (!nameRegex.test(lastName) || lastName.length < 2) {
        newErrors.lastName = "Last name must contain only letters (minimum 2 characters).";
      }

      if (!phone) {
        newErrors.phone = "Phone number is required.";
      } else if (!phoneRegex.test(phone) || phone.length < 10) {
        newErrors.phone = "Phone number must be at least 10 characters.";
      }

      if (!email) {
        newErrors.email = "Email is required.";
      } else if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address.";
      }

      if (!password) {
        newErrors.password = "Password is required.";
      } else if (!passwordRegex.test(password)) {
        newErrors.password = "Password must contain at least 8 chars, uppercase, lowercase, number, and special character.";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        return;
      }

      // Navigate to multi-step signup with pre-filled data
      navigate("/signup", { 
        state: { 
          accountType: 'user',
          userData: {
            FirstName: firstName,
            LastName: lastName,
            Number: phone,
            Email: email,
            Password: password,
            confirmPassword: confirmPassword
          }
        } 
      });

    } else {
      // Company signup
      const companyName = document.getElementById("SignupCompanyName").value.trim();
      const website = document.getElementById("SignupWebsite").value.trim();
      const employeeCount = document.getElementById("SignupEmployeeCount").value.trim();
      const industry = document.getElementById("SignupIndustry").value.trim();
      const email = document.getElementById("SignupEmail").value.trim();
      const password = document.getElementById("SignupPassword").value.trim();
      const confirmPassword = document.getElementById("SignupConfirmPassword").value.trim();

      const companyNameRegex = /^[A-Za-z0-9 &.,-]+$/;
      const websiteRegex = /https?:\/\/.+\..+/;
      const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
      const industryRegex = /^[A-Za-z0-9 &.,-]+$/;
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

      if (!companyName) {
        newErrors.companyName = "Company name is required.";
      } else if (!companyNameRegex.test(companyName) || companyName.length < 2) {
        newErrors.companyName = "Please enter a valid company name.";
      }

      if (!website) {
        newErrors.website = "Website is required.";
      } else if (!websiteRegex.test(website)) {
        newErrors.website = "Please enter a valid website URL (include http:// or https://).";
      }

      if (!employeeCount) {
        newErrors.employeeCount = "Employee count is required.";
      } else if (employeeCount < 1 || employeeCount > 1000000) {
        newErrors.employeeCount = "Please enter a valid number of employees.";
      }

      if (!industry) {
        newErrors.industry = "Industry is required.";
      } else if (!industryRegex.test(industry) || industry.length < 2) {
        newErrors.industry = "Please enter a valid industry.";
      }

      if (!email) {
        newErrors.email = "Email is required.";
      } else if (!emailRegex.test(email)) {
        newErrors.email = "Please enter a valid email address.";
      }

      if (!password) {
        newErrors.password = "Password is required.";
      } else if (!passwordRegex.test(password)) {
        newErrors.password = "Password must contain at least 8 chars, uppercase, lowercase, number, and special character.";
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password.";
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match.";
      }

      setErrors(newErrors);

      if (Object.keys(newErrors).length > 0) {
        return;
      }

      // Navigate to multi-step signup with pre-filled data
      navigate("/signup", { 
        state: { 
          accountType: 'company',
          companyData: {
            Name: companyName,
            Website: website,
            Employees_Number: parseInt(employeeCount),
            Industry: industry,
            Email: email,
            Password: password,
            confirmPassword: confirmPassword
          }
        } 
      });
    }
  };

  const containerClassName = isSignUpMode
    ? `${styles.container} ${styles['sign-up-mode']}`
    : styles.container;

  return (
    <div className={containerClassName}>
      <button 
        className={styles['back-btn']} 
        onClick={handleBackClick}
        title="Go back to landing page"
      >
        <i className="fas fa-arrow-left"></i>
        <span>Back</span>
      </button>

      <div className={styles['forms-container']}>
        <div className={styles['signin-signup']}>
          
          <form className={styles['sign-in-form']} onSubmit={handleLoginSubmit}>
            <h2 className={styles.title}>Log In</h2>
            
            {errors.general && (
              <div className={styles['error-alert']}>
                {errors.general}
              </div>
            )}

            <div className={styles['user-type-toggle']}>
              <button 
                type="button"
                className={`${styles['toggle-btn']} ${userType === 'user' ? styles.active : ''}`}
                onClick={() => {
                  setUserType('user');
                  setErrors({});
                }}
                disabled={loading}
              >
                User
              </button>
              <button 
                type="button"
                className={`${styles['toggle-btn']} ${userType === 'company' ? styles.active : ''}`}
                onClick={() => {
                  setUserType('company');
                  setErrors({});
                }}
                disabled={loading}
              >
                Company
              </button>
            </div>

            <div className={styles['input-wrapper']}>
              <div className={`${styles['input-field']} ${errors.loginEmail ? styles['has-error'] : ''}`}>
                <i className="fas fa-envelope"></i>
                <input 
                  type="email" 
                  placeholder="Email" 
                  id="login-email-input"
                  disabled={loading}
                />
              </div>
              {errors.loginEmail && (
                <span className={styles['error-text']}>{errors.loginEmail}</span>
              )}
            </div>

            <div className={styles['input-wrapper']}>
              <div className={`${styles['input-field']} ${errors.loginPassword ? styles['has-error'] : ''}`}>
                <i className="fas fa-lock"></i>
                <input 
                  type="password" 
                  placeholder="Password" 
                  id="login-password-input"
                  disabled={loading}
                />
              </div>
              {errors.loginPassword && (
                <span className={styles['error-text']}>{errors.loginPassword}</span>
              )}
              
              {/* ADDED FORGOT PASSWORD LINK HERE */}
              <div style={{ marginTop: '0.5rem', textAlign: 'right' }}>
                <Link 
                  to="/forgot-password" 
                  style={{ 
                    color: '#0077B5', 
                    textDecoration: 'none', 
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    display: 'inline-block'
                  }}
                >
                  <i className="fas fa-key" style={{ marginRight: '0.3rem' }}></i>
                  Forgot Password?
                </Link>
              </div>
            </div>

            <input 
              type="submit" 
              value={loading ? "Logging in..." : "Login"} 
              className={`${styles.btn} ${styles.solid}`}
              disabled={loading}
            />
            <button
              type="button"
              className={`${styles.btn} ${styles.transparent} ${styles['toggle-form-btn']}`}
              onClick={toggleMode}
              disabled={loading}
            >
              Don't have an account? Sign Up
            </button>
          </form>

          <form className={styles['sign-up-form']} onSubmit={handleSignupSubmit}>
            <h2 className={styles.title}>Sign Up</h2>
            
            {errors.general && (
              <div className={styles['error-alert']}>
                {errors.general}
              </div>
            )}

            <div className={styles['user-type-toggle']}>
              <button 
                type="button"
                className={`${styles['toggle-btn']} ${userType === 'user' ? styles.active : ''}`}
                onClick={() => {
                  setUserType('user');
                  setErrors({});
                }}
                disabled={loading}
              >
                User
              </button>
              <button 
                type="button"
                className={`${styles['toggle-btn']} ${userType === 'company' ? styles.active : ''}`}
                onClick={() => {
                  setUserType('company');
                  setErrors({});
                }}
                disabled={loading}
              >
                Company
              </button>
            </div>

            {userType === 'user' ? (
              <>
                <div className={styles['double-field']}>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.firstName ? styles['has-error'] : ''}`}>
                      <i className="fas fa-user"></i>
                      <input type="text" placeholder="First Name" id="SignupFirstName" disabled={loading} />
                    </div>
                    {errors.firstName && <span className={styles['error-text']}>{errors.firstName}</span>}
                  </div>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.lastName ? styles['has-error'] : ''}`}>
                      <i className="fas fa-user"></i>
                      <input type="text" placeholder="Last Name" id="SignupLastName" disabled={loading} />
                    </div>
                    {errors.lastName && <span className={styles['error-text']}>{errors.lastName}</span>}
                  </div>
                </div>
                
                <div className={styles['double-field']}>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.phone ? styles['has-error'] : ''}`}>
                      <i className="fas fa-phone"></i>
                      <input type="tel" placeholder="Phone Number" id="SignupPhone" disabled={loading} />
                    </div>
                    {errors.phone && <span className={styles['error-text']}>{errors.phone}</span>}
                  </div>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.email ? styles['has-error'] : ''}`}>
                      <i className="fas fa-envelope"></i>
                      <input type="email" placeholder="Email" id="SignupEmail" disabled={loading} />
                    </div>
                    {errors.email && <span className={styles['error-text']}>{errors.email}</span>}
                  </div>
                </div>

                <div className={styles['double-field']}>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.password ? styles['has-error'] : ''}`}>
                      <i className="fas fa-lock"></i>
                      <input type="password" placeholder="Password" id="SignupPassword" disabled={loading} />
                    </div>
                    {errors.password && <span className={styles['error-text']}>{errors.password}</span>}
                  </div>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.confirmPassword ? styles['has-error'] : ''}`}>
                      <i className="fas fa-lock"></i>
                      <input type="password" placeholder="Confirm Password" id="SignupConfirmPassword" disabled={loading} />
                    </div>
                    {errors.confirmPassword && <span className={styles['error-text']}>{errors.confirmPassword}</span>}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles['double-field']}>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.companyName ? styles['has-error'] : ''}`}>
                      <i className="fas fa-building"></i>
                      <input type="text" placeholder="Company Name" id="SignupCompanyName" disabled={loading} />
                    </div>
                    {errors.companyName && <span className={styles['error-text']}>{errors.companyName}</span>}
                  </div>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.website ? styles['has-error'] : ''}`}>
                      <i className="fas fa-globe"></i>
                      <input type="url" placeholder="Website" id="SignupWebsite" disabled={loading} />
                    </div>
                    {errors.website && <span className={styles['error-text']}>{errors.website}</span>}
                  </div>
                </div>

                <div className={styles['double-field']}>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.employeeCount ? styles['has-error'] : ''}`}>
                      <i className="fas fa-users"></i>
                      <input type="number" placeholder="Number of Employees" id="SignupEmployeeCount" disabled={loading} />
                    </div>
                    {errors.employeeCount && <span className={styles['error-text']}>{errors.employeeCount}</span>}
                  </div>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.industry ? styles['has-error'] : ''}`}>
                      <i className="fas fa-industry"></i>
                      <input type="text" placeholder="Industry" id="SignupIndustry" disabled={loading} />
                    </div>
                    {errors.industry && <span className={styles['error-text']}>{errors.industry}</span>}
                  </div>
                </div>

                <div className={styles['double-field']}>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.email ? styles['has-error'] : ''}`}>
                      <i className="fas fa-envelope"></i>
                      <input type="email" placeholder="Email" id="SignupEmail" disabled={loading} />
                    </div>
                    {errors.email && <span className={styles['error-text']}>{errors.email}</span>}
                  </div>
                  <div className={styles['input-wrapper']}>
                    <div className={`${styles['input-field']} ${errors.password ? styles['has-error'] : ''}`}>
                      <i className="fas fa-lock"></i>
                      <input type="password" placeholder="Password" id="SignupPassword" disabled={loading} />
                    </div>
                    {errors.password && <span className={styles['error-text']}>{errors.password}</span>}
                  </div>
                </div>

                <div className={styles['input-wrapper']}>
                  <div className={`${styles['input-field']} ${errors.confirmPassword ? styles['has-error'] : ''}`}>
                    <i className="fas fa-lock"></i>
                    <input type="password" placeholder="Confirm Password" id="SignupConfirmPassword" disabled={loading} />
                  </div>
                  {errors.confirmPassword && <span className={styles['error-text']}>{errors.confirmPassword}</span>}
                </div>
              </>
            )}

            <input 
              type="submit" 
              value={loading ? "Processing..." : "Continue"} 
              className={`${styles.btn} ${styles.solid}`}
              disabled={loading}
            />
            <button
              type="button"
              className={`${styles.btn} ${styles.transparent} ${styles['toggle-form-btn']}`}
              onClick={toggleMode}
              disabled={loading}
            >
              Already have an account? Log In
            </button>
          </form>
        </div>
      </div>

      <div className={styles['panels-container']}>
        <div className={`${styles.panel} ${styles['left-panel']}`}>
          <div className={styles.content}>
            <h3>New here?</h3>
            <p>Please enter your information to Sign Up</p>
            <button className={`${styles.btn} ${styles.transparent}`} onClick={toggleMode}>
              Sign Up
            </button>
          </div>
          <img src={login} className={styles.image} alt="Sign In illustration" />
        </div>

        <div className={`${styles.panel} ${styles['right-panel']}`}>
          <div className={styles.content}>
            <h3>One of us?</h3>
            <p>Welcome Back! Please Login</p>
            <button className={`${styles.btn} ${styles.transparent}`} onClick={toggleMode}>
              Sign In
            </button>
          </div>
          <img src={Register} className={styles.image} alt="Sign Up illustration" />
        </div>
      </div>
    </div>
  );
};

export default LoginSignup;