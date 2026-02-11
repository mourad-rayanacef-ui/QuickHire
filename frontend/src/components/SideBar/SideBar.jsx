import styles from "../SideBar/SideBar.module.css";
import AccountImg from "../../../public/UserProfileImg.webp";
import Home from "../../../public/Home.svg";
import Message from "../../../public/Message.svg";
import Appplications from "../../../public/MyApplications.svg";
import Publications from "../../../public/Publications.svg";
import Profile from "../../../public/Profile.svg";
import Settings from "../../../public/Settings.svg";
import Logout from "../../../public/Logout.svg";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function SideBar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, image } = useAuth();

    const userName = user
        ? `${user.FirstName || ""} ${user.LastName || ""}`.trim()
        : "User";
    const userEmail = user?.Email || "user@example.com";
    const userImage = image || AccountImg;

    const userData = {
        Img: userImage,
        Name: userName,
        email: userEmail,
    };

    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activePage, setActivePage] = useState("");

    /* ---------- detect active page from URL ---------- */
    useEffect(() => {
        const path = location.pathname;

        if (path.includes("/Messages")) setActivePage("Messages");
        else if (path.includes("/Applications")) setActivePage("Applications");
        else if (path.includes("/Publications")) setActivePage("Publications");
        else if (path.includes("/Profile")) setActivePage("Profile");
        else if (path.includes("/Settings")) setActivePage("Settings");
        else if (path.includes("/Home")) setActivePage("Home");
        else setActivePage("");
    }, [location]);

    /* ---------- screen size ---------- */
    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    /* ---------- close sidebar on outside click ---------- */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isMobile &&
                isSidebarOpen &&
                !event.target.closest(`.${styles.SideBar}`) &&
                !event.target.closest(`.${styles.Hamburger}`)
            ) {
                setIsSidebarOpen(false);
            }
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isMobile, isSidebarOpen]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    /* ---------- navigation handlers ---------- */
    const handleHomeClick = () => {
        setActivePage("Home");
        navigate("../Home");
    };

    const handleMessagesClick = () => {
        setActivePage("Messages");
        navigate("../Messages");
    };

    const handleApplicationsClick = () => {
        setActivePage("Applications");
        navigate("../Applications");
    };

    const handlePublicationsClick = () => {
        setActivePage("Publications");
        navigate("../Publications");
    };

    const handleProfileClick = () => {
        setActivePage("Profile");
        navigate("../Profile");
    };

    const handleSettingsClick = () => {
        setActivePage("Settings");
        navigate("../Settings");
    };

    const handleLogoutClick = () => {
        localStorage.clear();
        navigate("/SignIn");
    };

    return (
        <>
            {/* Hamburger */}
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

            {/* Overlay */}
            {isMobile && isSidebarOpen && (
                <div
                    className={styles.Overlay}
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div
                className={`
                    ${styles.SideBar}
                    ${isMobile ? styles.MobileSidebar : ""}
                    ${isMobile && isSidebarOpen ? styles.MobileSidebarOpen : ""}
                `}
            >
                <div className={styles.Pages}>
                    <button
                        className={`${styles.PageSection} ${
                            activePage === "Home" ? styles.PageSectionClicked : ""
                        }`}
                        onClick={handleHomeClick}
                    >
                        <img src={Home} alt="Home" />
                        Home
                    </button>

                    <button
                        className={`${styles.PageSection} ${
                            activePage === "Messages" ? styles.PageSectionClicked : ""
                        }`}
                        onClick={handleMessagesClick}
                    >
                        <img src={Message} alt="Message" />
                        Message
                    </button>

                    <button
                        className={`${styles.PageSection} ${
                            activePage === "Applications" ? styles.PageSectionClicked : ""
                        }`}
                        onClick={handleApplicationsClick}
                    >
                        <img src={Appplications} alt="My Applications" />
                        My Applications
                    </button>

                    <button
                        className={`${styles.PageSection} ${
                            activePage === "Publications" ? styles.PageSectionClicked : ""
                        }`}
                        onClick={handlePublicationsClick}
                    >
                        <img src={Publications} alt="Publications" />
                        Publications
                    </button>

                    <button
                        className={`${styles.PageSection} ${
                            activePage === "Profile" ? styles.PageSectionClicked : ""
                        }`}
                        onClick={handleProfileClick}
                    >
                        <img src={Profile} alt="Profile" />
                        Profile
                    </button>
                </div>

                <div className={styles.Settings}>
                    <button
                        className={`${styles.PageSection} ${
                            activePage === "Settings" ? styles.PageSectionClicked : ""
                        }`}
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
                    <img
                        className={styles.AcountImg}
                        src={userData.Img}
                        alt={userData.Name}
                    />
                    <div className={styles.User}>
                        <h5>{userData.Name}</h5>
                        <p className="small-text">{userData.email}</p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default SideBar;
