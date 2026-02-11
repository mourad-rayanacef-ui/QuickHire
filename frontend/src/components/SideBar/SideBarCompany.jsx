import styles from "../SideBar/SideBar.module.css";
import AccountImg from "../../../public/company.svg";
import Home from "../../../public/Home.svg";
import Message from "../../../public/Message.svg";
import Appplications from "../../../public/MyApplications.svg";
import Publications from "../../../public/Publications.svg";
import Profile from "../../../public/Profile.svg";
import Settings from "../../../public/Settings.svg";
import Logout from "../../../public/Logout.svg";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom'; // Add useLocation
import { useAuth } from '../../context/AuthContext';

function SideBarCompany() {
    const navigate = useNavigate();
    const location = useLocation(); // Add this hook
    const { user, image } = useAuth();
    
    const companyName = user?.Name || "no name";
    const companyEmail = user?.Email || "no_email@example.com";
    const companyImage = image || AccountImg;

    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activePage, setActivePage] = useState("");

    // FIXED: Set active page based on current URL - runs when location changes
    useEffect(() => {
        const path = location.pathname;
        console.log("Current path:", path); // Debug log
        
        if (path.includes('/Messages')) setActivePage("Messages");
        else if (path.includes('/Applications')) setActivePage("Applications");
        else if (path.includes('/Publications')) setActivePage("Publications");
        else if (path.includes('/Profile')) setActivePage("Profile");
        else if (path.includes('/Settings')) setActivePage("Settings");
        else if (path.includes('/Home') || path === '/' || path === '') setActivePage("Home");
        else setActivePage(""); // Or "Home" as default
    }, [location]); // Dependency on location

    // Screen size detection
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);

        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobile && isSidebarOpen && !event.target.closest(`.${styles.SideBar}`) && !event.target.closest(`.${styles.Hamburger}`)) {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isMobile, isSidebarOpen]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const handleNavClick = () => {
        if (isMobile) {
            setIsSidebarOpen(false);
        }
    };

    // Updated click handlers with active page state
    const handleMessagesClick = () => {
        setActivePage("Messages");
        navigate("/company/Messages"); // Use absolute path
        handleNavClick();
    }

    const handleHomeClick = () => {
        setActivePage("Home");
        navigate("/company/Home"); // Use absolute path
        handleNavClick();
    }

    const handleApplicationsClick = () => {
        setActivePage("Applications");
        navigate("/company/Applications"); // Use absolute path
        handleNavClick();
    }

    const handleProfileClick = () => {
        setActivePage("Profile");
        navigate("/company/Profile"); // Use absolute path
        handleNavClick();
    }

    const handlePublicationsClick = () => {
        setActivePage("Publications");
        navigate("/company/Publications"); // Use absolute path
        handleNavClick();
    }

    const handleSettingsClick = () => {
        setActivePage("Settings");
        navigate("/company/Settings"); // Use absolute path
        handleNavClick();
    }

    const handleLogoutClick = () => {
        localStorage.clear();
        navigate("/SignIn");
    }

    // Debug: Add this to see what's happening
    useEffect(() => {
        console.log("Active page:", activePage);
    }, [activePage]);

    return (
        <>
            {/* Hamburger Menu for Mobile */}
            {isMobile && (
                <button 
                    className={styles.Hamburger}
                    onClick={toggleSidebar}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            )}

            {/* Overlay for Mobile */}
            {isMobile && isSidebarOpen && (
                <div 
                    className={styles.Overlay}
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* SideBar */}
            <div className={`
                ${styles.SideBar} 
                ${isMobile ? styles.MobileSidebar : ''}
                ${isMobile && isSidebarOpen ? styles.MobileSidebarOpen : ''}
            `}>
                <div className={styles.Pages}>
                    <button 
                        className={`${styles.PageSection} ${activePage === "Home" ? styles.PageSectionClicked : ''}`} 
                        onClick={handleHomeClick}
                    >
                        <img src={Home} alt="Home" />
                        Home
                    </button>
                    <button 
                        className={`${styles.PageSection} ${activePage === "Messages" ? styles.PageSectionClicked : ''}`} 
                        onClick={handleMessagesClick}
                    >
                        <img src={Message} alt="Message" />
                        Message
                    </button>
                    <button 
                        className={`${styles.PageSection} ${activePage === "Applications" ? styles.PageSectionClicked : ''}`} 
                        onClick={handleApplicationsClick}
                    >
                        <img src={Appplications} alt="Applications" />
                        Applications
                    </button>
                    <button 
                        className={`${styles.PageSection} ${activePage === "Publications" ? styles.PageSectionClicked : ''}`} 
                        onClick={handlePublicationsClick}
                    >
                        <img src={Publications} alt="Publications" />
                        Publications
                    </button>
                    <button 
                        className={`${styles.PageSection} ${activePage === "Profile" ? styles.PageSectionClicked : ''}`} 
                        onClick={handleProfileClick}
                    >
                        <img src={Profile} alt="Profile" />
                        Profile
                    </button>
                </div>

                <div className={styles.Settings}>
                    <button 
                        className={`${styles.PageSection} ${activePage === "Settings" ? styles.PageSectionClicked : ''}`} 
                        onClick={handleSettingsClick}
                    >
                        <img src={Settings} alt="Settings" />
                        Settings
                    </button>
                </div>

                <button className={styles.LogOutButton} onClick={handleLogoutClick}>
                    <img src={Logout} alt="Logout" />
                    Logout 
                </button>

                <div className={styles.AccountInfo}>
                    <img className={styles.AcountImg} src={companyImage} alt={companyName} />
                    <div className={styles.User}>
                        <h5>{companyName || ""}</h5>
                        <p className="small-text">{companyEmail || ""}</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SideBarCompany;