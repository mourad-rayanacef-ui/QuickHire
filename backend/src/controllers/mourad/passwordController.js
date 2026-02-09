require('dotenv').config();
const prisma = require("../../config/prisma.js");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Mailjet = require('node-mailjet');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// ✅ INITIALIZE MAILJET
const mailjet = Mailjet.apiConnect(
  process.env.MAILJET_API_KEY,
  process.env.MAILJET_SECRET_KEY
);

/* =========================
   TOKEN HELPERS
========================= */

// Generate reset token (1 hour)
const generateResetToken = (email, accountType, userId) => {
  return jwt.sign(
    { email, accountType, userId, purpose: 'password_reset' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.purpose === 'password_reset' ? decoded : null;
  } catch {
    return null;
  }
};

/* =========================
   SEND RESET EMAIL (MAILJET)
========================= */

const sendResetEmail = async (email, resetToken, accountType) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  try {
    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.EMAIL_FROM,
            Name: process.env.EMAIL_FROM_NAME || 'AQuickHire',
          },
          To: [
            {
              Email: email,
              Name: email.split('@')[0],
            },
          ],
          Subject: 'Password Reset Request - AQuickHire',
          HTMLPart: `
            <div style="font-family:Arial;background:#f5f5f5;padding:30px">
              <div style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:8px">
                <h2 style="color:#0077B5">AQuickHire – Password Reset</h2>
                <p>We received a request to reset your <b>${accountType}</b> account password.</p>

                <div style="text-align:center;margin:30px 0">
                  <a href="${resetUrl}" 
                     style="background:#0077B5;color:white;padding:12px 25px;
                            text-decoration:none;border-radius:5px;font-weight:bold">
                    Reset Password
                  </a>
                </div>

                <p>If the button doesn’t work, copy this link:</p>
                <p style="font-family:monospace;background:#eee;padding:10px;border-radius:5px">
                  ${resetUrl}
                </p>

                <p><b>This link expires in 1 hour.</b></p>
                <p>If you did not request this, you can safely ignore this email.</p>

                <hr />
                <small>© AQuickHire – Automated message</small>
              </div>
            </div>
          `,
        },
      ],
    });

    console.log('✅ Mailjet email sent to:', email);
  } catch (error) {
    console.error('❌ Mailjet error:', error.response?.body || error);
    throw new Error('Email send failed');
  }
};

/* =========================
   STEP 1 – FORGOT PASSWORD
========================= */

exports.forgotPassword = async (req, res) => {
  try {
    const { accountType, Email } = req.body;

    if (!accountType || !Email) {
      return res.status(400).json({
        success: false,
        error: 'Account type and email are required',
      });
    }

    let account, userId;

    if (accountType === 'user') {
      account = await prisma.user.findFirst({
        where: { Email },
        select: { User_id: true },
      });
      userId = account?.User_id;
    } else if (accountType === 'company') {
      account = await prisma.company.findFirst({
        where: { Email },
        select: { Company_id: true },
      });
      userId = account?.Company_id;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid account type',
      });
    }

    // 🔒 Security: always return success
    if (!account) {
      return res.json({
        success: true,
        message: 'If the email exists, a reset link was sent.',
      });
    }

    const token = generateResetToken(Email, accountType, userId);
    await sendResetEmail(Email, token, accountType);

    res.json({
      success: true,
      message: 'Password reset link sent to your email',
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Failed to process request',
    });
  }
};

/* =========================
   STEP 2 – VERIFY TOKEN
========================= */

exports.verifyResetToken = async (req, res) => {
  const decoded = verifyResetToken(req.params.token);

  if (!decoded) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }

  res.json({
    success: true,
    email: decoded.email,
    accountType: decoded.accountType,
  });
};

/* =========================
   STEP 3 – RESET PASSWORD
========================= */

exports.resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  if (!token || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, error: 'Missing fields' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ success: false, error: 'Passwords do not match' });
  }

  const decoded = verifyResetToken(token);
  if (!decoded) {
    return res.status(400).json({ success: false, error: 'Invalid or expired token' });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  if (decoded.accountType === 'user') {
    await prisma.user.update({
      where: { User_id: decoded.userId },
      data: { Password: hashedPassword },
    });
  } else {
    await prisma.company.update({
      where: { Company_id: decoded.userId },
      data: { Password: hashedPassword },
    });
  }

  res.json({
    success: true,
    message: 'Password reset successful',
  });
};
