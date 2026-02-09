import "./components/NavBar/NavBar.jsx"
import './App.css'

import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from './context/AuthContext';
import ForgotPassword from "./pages/login/ForgotPassword"; // ADD THIS
import ResetPassword from "./pages/login/ResetPassword";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import UserDetailsPage from "./pages/Company/UserDetailsPage/UserDetailsPage.jsx";
import UserMessagesPage from "./pages/User/MessagePage/MesssagePage.jsx";
import UserProfilePage from "./pages/User/ProfilePage/ProfilePage.jsx";

import CompanyMessagesPage from "./pages/Company/CompanyMessagesPage.jsx";
import CompanyProfilePage from "./pages/Company/ProfilePage/ProfilePage.jsx";

import LoginSignup from "./pages/login/login.jsx";

import CApplicationsLayoutPage from "./pages/Company/CApplicationLayoutPage.jsx" 
import UApplicationLayoutPage from "./pages/User/UApplicationLayoutPage.jsx"

import JobDetailsPage from "../src/pages/User/PostDescription/PostDescriptionPage.jsx"
import JobPage from "../src/pages/User/JobPostPage/JobPostPage.jsx"


import CSettingsLayout from "./pages/Company/CompanySettingsPage/CSettingsLayout.jsx"

import TermsAndConditions from "./pages/TermsandConditions/TermsAndConditions.jsx";
import JobPosting from './pages/postjob/JobPosting.jsx' 

import HomePage from './pages/landingpage/Landingpage.jsx'

import NotFoundPage from "./pages/error/NotFound.jsx"
import Notifications from "./pages/notifications/Notifications.jsx";

import CandidatePage from "./pages/Company/UserPostPage/UserPostPage.jsx";
import USettings from "./pages/User/UserSettingsPage/SettingsLayout.jsx"

import CompanyDashboard from "./pages/Dashbord/Company/DashbordCompany.jsx";
import UserDashboard from "./pages/Dashbord/User/DashbordUser.jsx";

import MultiStepSignup from './pages/login/MultiStepSignup';

function App() {
  return (

    <AuthProvider>

      <BrowserRouter>
        <Routes>

          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/SignIn" element={<LoginSignup />} />
          <Route path="/signup" element={<MultiStepSignup />} />
             <Route path="/forgot-password" element={<ForgotPassword />} /> {/* ADD THIS */}
          <Route path="/reset-password/:token" element={<ResetPassword />} /> {/* ADD THIS */}
          {/* --------------------------- */}
          {/*   PROTECTED USER ROUTES    */}
          {/* --------------------------- */}
          <Route
            path="/User"
            element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="Messages" element={<UserMessagesPage />} />
            <Route path="Profile" element={<UserProfilePage />} />
            <Route path="Notifications" element={<Notifications />} />
            <Route path="job-details/:jobId" element={<JobDetailsPage />} />
            <Route path="Settings" element={<USettings />} />
            <Route path="Publications" element={<JobPage />} />
            <Route path="Applications" element={<UApplicationLayoutPage />} />
            <Route path="Home" element={<UserDashboard />} />
          </Route>


          {/* --------------------------- */}
          {/*  PROTECTED COMPANY ROUTES   */}
          {/* --------------------------- */}
          <Route
            path="/Company"
            element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="Messages" element={<CompanyMessagesPage />} />
            <Route path="Profile" element={<CompanyProfilePage />} />
            <Route path="candidate-details/:userId" element={<UserDetailsPage />} />
            <Route path="Notifications" element={<Notifications />} />
            <Route path="Publications" element={<CandidatePage />} />
            <Route path="Settings" element={<CSettingsLayout />} />
            <Route path="Applications" element={<CApplicationsLayoutPage />} />
            <Route path="Home" element={<CompanyDashboard />} />
            <Route path="PostJob" element={<JobPosting />} />
          </Route>



          {/* --------------------------- */}
          {/*  PROTECTED COMPANY ROUTES   */}
          {/* --------------------------- */}
          <Route
            path="/Company"
            element={
              <ProtectedRoute>
                <Outlet />
              </ProtectedRoute>
            }
          >
            <Route path="Messages" element={<CompanyMessagesPage />} />
            <Route path="candidate-details/:userId" element={<UserDetailsPage />} />
            <Route path="Profile" element={<CompanyProfilePage />} />
            
            <Route path="Notifications" element={<Notifications />} />
            <Route path="Publications" element={<CandidatePage />} />
            <Route path="Settings" element={<CSettingsLayout />} />
            <Route path="Applications" element={<CApplicationsLayoutPage />} />
            <Route path="Home" element={<CompanyDashboard />} />
            <Route path="PostJob" element={<JobPosting />} />
          </Route>



          <Route path="/Terms&Conditions" element={<TermsAndConditions />} />
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </BrowserRouter>

    </AuthProvider>
  );
}

export default App;

