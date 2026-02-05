import React, { useState } from "react";
import styles from "./CSettingsLayout.module.css";
import PersonalInformation from "../../../components/Settings/CompanySettings/PersonalInformation";
import SocialLinksPage from "../../../components/Settings/CompanySettings/SocialLinksPage";
import CompanyLoginDetails from "../../../components/Settings/CompanySettings/CompanyLoginDetails"; // ← ADD THIS IMPORT
import SideBarCompany from "../../../components/SideBar/SideBarCompany";
import NavBarCompany from "../../../components/NavBarCompany/NavBarCompany.jsx";

export default function CSettingsLayout() {
  const [activeTab, setActiveTab] = useState("personal");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case "personal":
        return <PersonalInformation />;
      case "social":
        return <SocialLinksPage />;
      case "login": // ← ADD THIS CASE
        return <CompanyLoginDetails />;
      default:
        return <PersonalInformation />;
    }
  };

  return (
    <div className={styles.layout}>
      {/* NavBar with toggle */}
      <NavBarCompany toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

      {/* Mobile overlay */}
      <div
        className={`${styles.overlay} ${isSidebarOpen ? "show" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>

      <div className={styles.mainSection}>
        {/* Sidebar */}
        <SideBarCompany className={`sidebar-mobile ${isSidebarOpen ? "open" : ""}`} />

        <div className={styles.settingsContainer}>
          <header className={styles.header}>
            <h1 className={styles.title}>Settings</h1>
          </header>

          <div className={styles.personalInfoHeader}>
            <span
              className={`${styles.navLink} ${activeTab === "personal" ? styles.active : ""}`}
              onClick={() => setActiveTab("personal")}
            >
              Personal Information
            </span>
            <span
              className={`${styles.navLink} ${activeTab === "social" ? styles.active : ""}`}
              onClick={() => setActiveTab("social")}
            >
              Social Links
            </span>
            {/* ← ADD THIS TAB */}
            <span
              className={`${styles.navLink} ${activeTab === "login" ? styles.active : ""}`}
              onClick={() => setActiveTab("login")}
            >
              Login Details
            </span>
          </div>

          <div className={styles.divider}></div>

          {renderActiveTab()}
        </div>
      </div>
    </div>
  );
}
