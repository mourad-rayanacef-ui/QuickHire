import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Alert from "../../Alert/Alert";
import styles from './SocialLinksPage.module.css';
import { Linkedin, Mail } from "lucide-react";

// --- Helper: Auth Extraction ---
const getCompanyInfo = () => {
  try {
    const token = localStorage.getItem("token") || "";
    const userDataStr = localStorage.getItem("user");
    
    if (!userDataStr || userDataStr === "null") return { companyId: null, token };

    const parsedUser = JSON.parse(userDataStr);
    const companyId = parsedUser.Company_id || parsedUser.companyId || parsedUser.id || parsedUser.User_id;

    return { companyId, token };
  } catch (error) {
    console.error("Error parsing company info:", error);
    return { companyId: null, token: "" };
  }
};

function SocialLinksPage() {
    const queryClient = useQueryClient();
    const { companyId, token } = getCompanyInfo();
    const [links, setLinks] = useState({ linkedin: "", email: "" });
    const [errors, setErrors] = useState({});

    // Alert state
    const [showAlert, setShowAlert] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ type: 'success', message: '' });

    // Helper function to show alerts
    const showNotification = (message, type = 'success') => {
      setAlertConfig({ type, message });
      setShowAlert(true);
    };

    // --- 1. Query: Fetch Social Links ---
    const { data: profileData, isLoading } = useQuery({
        queryKey: ['companyProfileSettings', companyId],
        queryFn: async () => {
            const res = await fetch(`https://quickhire-4d8p.onrender.com/api/Company/ProfileSettings/${companyId}`, {
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` 
                },
            });
            const data = await res.json();
            if (!data.success) throw new Error("Failed to load profile");
            return data.company;
        },
        enabled: !!companyId,
    });

    useEffect(() => {
        if (profileData) {
            setLinks({
                linkedin: profileData.linkedInLink || "",
                email: profileData.email || "",
            });
        }
    }, [profileData]);

    // --- 2. Mutation: Save Links ---
    const updateLinksMutation = useMutation({
        mutationFn: async (newLinks) => {
            const res = await fetch(`https://quickhire-4d8p.onrender.com/api/Company/ProfileSettings/${companyId}/SocialLinks`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(newLinks),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || "Failed to update links");
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['companyProfileSettings', companyId] });
            queryClient.invalidateQueries({ queryKey: ['companyProfile'] });
            showNotification("Links updated successfully!", "success");
        },
        onError: (err) => showNotification(`Error: ${err.message}`, "error")
    });

    // --- Logic ---
    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setLinks(prev => ({ ...prev, [id]: value }));
        // Clear error when user starts typing
        if (errors[id]) {
            setErrors(prev => ({ ...prev, [id]: "" }));
        }
    };

    // ✅ CLEANED: Validation for optional fields
    const handleSave = (e) => {
        e.preventDefault();
        const newErrors = {};
        
        // LinkedIn: Only validate if provided
        if (links.linkedin.trim()) {
            const linkedinUrl = links.linkedin.trim();
            
            if (!linkedinUrl.startsWith("http://") && !linkedinUrl.startsWith("https://")) {
                newErrors.linkedin = "URL must start with http:// or https://";
            }
            else if (!linkedinUrl.includes("linkedin.com")) {
                newErrors.linkedin = "Please enter a valid LinkedIn URL";
            }
        }
        
        // Email: Only validate if provided
        if (links.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(links.email.trim())) {
                newErrors.email = "Please enter a valid email address";
            }
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setErrors({});
        
        // Prepare data for submission
        const dataToSend = {
            linkedin: links.linkedin.trim() || null,
            email: links.email.trim() || null
        };
        
        updateLinksMutation.mutate(dataToSend);
    };

    // --- Loading Skeleton ---
    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={`${styles.skeletonTitle} ${styles.shimmer}`} style={{ width: '150px' }}></div>
                <div className={`${styles.skeletonText} ${styles.shimmer}`} style={{ width: '300px', marginBottom: '30px' }}></div>
                
                {[1, 2].map((i) => (
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
            {/* ✅ Alert Component */}
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
                <p className={styles.p}>Add your professional contact information.</p>
            </div>

            <form className={styles.form} onSubmit={handleSave}>
                {/* LinkedIn */}
                <div className={styles.inputGroup}>
                    <label htmlFor="linkedin">
                        <span className={styles.icon}><Linkedin size={18} /></span> 
                        LinkedIn
                    </label>
                    <input
                        type="text"
                        id="linkedin"
                        value={links.linkedin}
                        onChange={handleInputChange}
                        placeholder="https://linkedin.com/company/yourcompany"
                        className={errors.linkedin ? styles.inputError : ""}
                        disabled={updateLinksMutation.isPending}
                    />
                    {errors.linkedin && <p className={styles.error}>{errors.linkedin}</p>}
                </div>

                {/* Email */}
                <div className={styles.inputGroup}>
                    <label htmlFor="email">
                        <span className={styles.icon}><Mail size={18} /></span> 
                        Email
                    </label>
                    <input
                        type="text"
                        id="email"
                        value={links.email}
                        onChange={handleInputChange}
                        placeholder="contact@company.com"
                        className={errors.email ? styles.inputError : ""}
                        disabled={updateLinksMutation.isPending}
                    />
                    {errors.email && <p className={styles.error}>{errors.email}</p>}
                </div>

                <div className={styles.divider}></div>

                <div className={styles.buttonContainer}>
                    <button className={styles.saveButton} type="submit" disabled={updateLinksMutation.isPending}>
                        {updateLinksMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default SocialLinksPage;