const { Router } = require('express');
const router = Router();

// IMPORT ALL ROUTES
const passwordRoutes = require('./rayan/passwordRoutes.js');
const AyyoubRoutes = require('./ayyoub/index.js');
const AyoubUserRoutes = require("./ayoub/UserRoutes.js");
const RayanUserRoutes = require("./rayan/UserRoutes.js");
const AminUserRoutes = require("./amin/UserRoutes.js");
const AyoubCompanyRoutes = require("./ayoub/CompanyRoutes.js");
const RayanCompanyRoutes = require("./rayan/CompanyRoutes.js");
const AminCompanyRoutes = require("./amin/CompanyRoutes.js");
const AminChatbotRoutes = require("./amin/ChatbotRoutes.js");

// ✅ PASSWORD ROUTES (ADD THIS - ONLY HERE)
router.use('/auth', passwordRoutes);

// ✅ AYYOUB'S MAIN ROUTES (Authentication, Upload, etc.)
router.use('/', AyyoubRoutes);

// ✅ USER ROUTES (All developers' user routes)
router.use("/User", AyoubUserRoutes);
router.use("/User", RayanUserRoutes);
router.use("/User", AminUserRoutes);

// ✅ COMPANY ROUTES (All developers' company routes)
router.use("/Company", AyoubCompanyRoutes);
router.use("/Company", RayanCompanyRoutes);
router.use("/Company", AminCompanyRoutes);

// ✅ CHATBOT ROUTES
router.use("/Chatbot", AminChatbotRoutes);

module.exports = router;