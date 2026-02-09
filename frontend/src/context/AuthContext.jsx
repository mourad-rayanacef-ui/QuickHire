import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";
import { authAPI } from "../services/api";

import defaultImg from "../assets/LOGO.svg";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [accountType, setAccountType] = useState(null);
  const [image, setImage] = useState(defaultImg);
  const [loading, setLoading] = useState(true);

  // ✅ BOOTSTRAP FROM localStorage (SAFE)
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedAccountType = localStorage.getItem("accountType");
    const storedImage = localStorage.getItem("Image");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);

        setToken(storedToken);
        setUser(parsedUser);
        setAccountType(storedAccountType);
        setImage(storedImage || defaultImg);
      } catch (err) {
        console.error("Invalid stored auth data, clearing storage", err);
        localStorage.clear();
      }
    } 

    setLoading(false);
  }, []);

  // ✅ SIGN UP
  const signUp = async (payload) => {
    try {
      const response = await authAPI.signUp(payload);

      if (!response?.success) {
        return { success: false, error: response?.error || "Registration failed" };
      }

      const { token, accountType, image: backendImage } = response.data;

      const userData =
        accountType === "user"
          ? response.data.user
          : response.data.company;

      const safeImage = backendImage || defaultImg;

      setToken(token);
      setUser(userData);
      setAccountType(accountType);
      setImage(safeImage);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("accountType", accountType);
      localStorage.setItem("Image", safeImage);

      return { success: true, accountType };
    } catch (error) {
      console.error("SignUp error:", error);
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      };
    }
  };

  // ✅ LOGIN - FIXED VERSION
  const logIn = async (credentials) => {
    try {
      const response = await authAPI.logIn(credentials);

      // First check if the response itself indicates failure
      if (response?.success === false) {
        return { success: false, error: response.error || "Login failed" };
      }

      // If we get here, response.success should be true
      const { token, accountType, image: backendImage } = response.data;

      const userData =
        accountType === "user"
          ? response.data.user
          : response.data.company;

      const safeImage = backendImage || defaultImg;

      setToken(token);
      setUser(userData);
      setAccountType(accountType);
      setImage(safeImage);

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("accountType", accountType);
      localStorage.setItem("Image", safeImage);

      return { success: true, accountType };
    } catch (error) {
      console.error("Login error:", error);
      // Handle axios error (including 500 status)
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
      };
    }
  };

  // ✅ LOGOUT
  const logOut = async () => {
    try {
      await authAPI.logOut();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setToken(null);
      setUser(null);
      setAccountType(null);
      setImage(defaultImg);

      localStorage.clear();
    }
  };

  // ✅ USER UPDATE (PROFILE EDIT)
  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const value = {
    user,
    image,
    token,
    accountType,
    loading,
    isAuthenticated: Boolean(token),
    isUser: accountType === "user",
    isCompany: accountType === "company",
    signUp,
    logIn,
    logOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};