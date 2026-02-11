import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "../../Alert/Alert";
import api from "../../../api/api";
import styles from './SocialLinksPage.module.css';
import { Linkedin, Mail, Globe } from "lucide-react";

// --- Helper: Auth Extraction ---
const getUserInfo = () => {
  try {
    const token = localStorage.getItem("token") || "";
    const userDataStr = localStorage.getItem("user");
    
    if (!userDataStr || userDataStr === "null") return { userId: null, token };

    const parsedUser = JSON.parse(userDataStr);
    const userId = parsedUser.User_id || parsedUser.userId || parsedUser.id || parsedUser.Company_id;

    return { userId, token };
  } catch (error) {
    console.error("Error parsing user info:", error);
    return { userId: null, token: "" };
  }
};

function SocialLinksPage() {
    const queryClient = useQueryClient();
    const { userId } = getUserInfo();
    const [errors, setErrors] = useState({});

    // Local state to manage inputs (controlled inputs are better for async data)
    const [links, setLinks] = useState({
        linkedin: "",
        email: "",
        website: ""
    });

    // Alert state
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ type: 'success', message: '' });

    // Helper function to show alerts
    const showNotification = (message, type = 'success') => {
        setAlertConfig({ type, message });
        setShowAlert(true);
    };

    // --- 1. Fetch Data (useQuery) ---
    const { data: profileData, isLoading } = useQuery({
        queryKey: ['userProfileSettings', userId],
        queryFn: async () => {
            const { data } = await api.get(`/User/ProfileSettings/${userId}`);
            if (!data.success) throw new Error("Failed to load profile");
            return data.user;
        },
        enabled: !!userId,
    });

    // Sync Query Data to Form State
    useEffect(() => {
        if (profileData) {
            setLinks({
                linkedin: profileData.linkedInLink || "",
                email: profileData.email || "",
                website: profileData.website || "",
            });
        }
    }, [profileData]);

    // --- 2. Mutation: Save Links ---
    const updateLinksMutation = useMutation({
        mutationFn: async (newLinks) => {
            const { data } = await api.patch(`/User/ProfileSettings/${userId}/SocialLinks`, newLinks);
            if (!data.success) throw new Error(data.error || "Failed to update links");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['userProfileSettings', userId] });
            queryClient.invalidateQueries({ queryKey: ['userProfile'] });
            showNotification("Links updated successfully!", "success");
        },
        onError: (err) => {
            showNotification(err.message, "error");
        }
    });

    // --- Validation Logic ---
    const validate = () => {
        const newErrors = {};
        
        if (links.linkedin) {
            if (!links.linkedin.startsWith("http")) newErrors.linkedin = "URL must start with http:// or https://";
            else if (!links.linkedin.includes("linkedin.com")) newErrors.linkedin = "Must be a valid LinkedIn URL";
        }
        if (links.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(links.email)) {
            newErrors.email = "Invalid email format";
        }
        if (links.website) {
            if (!links.website.startsWith("http")) newErrors.website = "URL must start with http:// or https://";
            else {
                try { new URL(links.website); } catch { newErrors.website = "Invalid URL"; }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (validate()) {
            updateLinksMutation.mutate(links);
        } else {
            showNotification("Please fix the validation errors", "warning");
        }
    };

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setLinks(prev => ({ ...prev, [id]: value }));
    };

    // --- Loading Skeleton ---
    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '150px' }}></div>
                <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '300px', marginBottom: '30px' }}></div>
                
                {[1, 2, 3].map((i) => (
                    <div className={styles.inputGroup} key={i}>
                        <div className={`${styles.skeletonLabel} ${styles.shimmer}`} style={{ width: '100px' }}></div>
                        <div className={`${styles.skeletonInput} ${styles.shimmer}`} style={{ height: '45px' }}></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Alert Component */}
            {showAlert && (
                <Alert
                    type={alertConfig.type}
                    message={alertConfig.message}
                    onClose={() => setShowAlert(false)}
                    duration={3000}
                />
            )}

            <div className={styles.description}>
                <p className={styles.pHead}>Contact Links</p>
                <p className={styles.p}>
                    Add your professional contact information. All fields are optional.
                </p>
            </div>

            <form className={styles.form} onSubmit={handleSave}>
                {[
                    { id: "email", label: "Email", icon: <Mail size={18} />, placeholder: "your.email@example.com" },
                    { id: "linkedin", label: "LinkedIn", icon: <Linkedin size={18} />, placeholder: "https://linkedin.com/in/yourprofile" },
                    { id: "website", label: "Website", icon: <Globe size={18} />, placeholder: "https://yourwebsite.com" }
                ].map(({ id, label, icon, placeholder }) => (
                    <div className={styles.inputGroup} key={id}>
                        <label htmlFor={id}>
                            <span className={styles.icon}>{icon}</span> {label}
                        </label>
                        <input
                            type="text"
                            id={id}
                            value={links[id]}
                            onChange={handleInputChange}
                            placeholder={placeholder}
                            className={errors[id] ? styles.inputError : ""}
                            disabled={updateLinksMutation.isPending}
                        />
                        {errors[id] && <p className={styles.error}>{errors[id]}</p>}
                    </div>
                ))}

                <div className={styles.divider}></div>

                <div className={styles.buttonContainer}>
                    <button 
                        className={styles.saveButton} 
                        type="submit"
                        disabled={updateLinksMutation.isPending}
                    >
                        {updateLinksMutation.isPending ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SocialLinksPage;