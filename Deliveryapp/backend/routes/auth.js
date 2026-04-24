const express = require('express');
const router = express.Router();
const DeliveryUser = require('../models/DeliveryUser');
const twilio = require('twilio');
const crypto = require('crypto');

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;
const TWILIO_VERIFY_CHANNEL = process.env.TWILIO_VERIFY_CHANNEL || 'sms';
const TWILIO_VERIFY_CODE_LENGTH = Number(process.env.TWILIO_VERIFY_CODE_LENGTH || 4);

const ALLOWED_CHANNELS = new Set(['sms', 'whatsapp']);
let twilioClient;
let verifyServiceConfigured = false;

const isTwilioConfigured = () =>
  Boolean(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_VERIFY_SERVICE_SID);

const getTwilioClient = () => {
  if (!twilioClient) {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

const getOtpLength = () => {
  if (Number.isInteger(TWILIO_VERIFY_CODE_LENGTH) && TWILIO_VERIFY_CODE_LENGTH >= 4 && TWILIO_VERIFY_CODE_LENGTH <= 10) {
    return TWILIO_VERIFY_CODE_LENGTH;
  }
  return 4;
};

const ensureVerifyServiceCodeLength = async () => {
  if (verifyServiceConfigured) return;

  const expectedLength = getOtpLength();
  const serviceApi = getTwilioClient().verify.v2.services(TWILIO_VERIFY_SERVICE_SID);
  const service = await serviceApi.fetch();

  if (service.codeLength !== expectedLength) {
    await serviceApi.update({ codeLength: expectedLength });
    console.log(`ℹ️ Verify service code length updated to ${expectedLength}.`);
  }

  verifyServiceConfigured = true;
};

/**
 * Normalises a phone input to E.164 for India (+91XXXXXXXXXX).
 * Accepts:  9876543210 | 919876543210 | +919876543210 | +91 98765 43210
 * Returns:  +91XXXXXXXXXX  or  '' if invalid.
 */
const toE164 = (phone) => {
  const raw = String(phone || '').trim();
  if (!raw) return '';

  // Strip everything except digits (keep leading + handled separately)
  const digits = raw.replace(/\D/g, '');

  // 10-digit Indian mobile number (no country code)
  if (digits.length === 10) {
    return `+91${digits}`;
  }
  // 12-digit with country code 91 (no +)
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  // 13-char E.164 with leading + already stripped by replace above won't happen
  // Handle the original +91XXXXXXXXXX (13 digits starting 91 after stripping +)
  if (raw.startsWith('+') && digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return '';
};

/**
 * Returns true only if the normalised phone is a valid Indian mobile number.
 * Format: +91 followed by 10 digits, starting with 6-9.
 */
const isValidIndianPhone = (e164) => {
  return /^\+91[6-9]\d{9}$/.test(e164);
};

const hashPassword = (password, salt) =>
  crypto.scryptSync(String(password), String(salt), 64).toString('hex');

const safeEquals = (a, b) => {
  const aBuf = Buffer.from(String(a), 'hex');
  const bBuf = Buffer.from(String(b), 'hex');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
};

// POST /api/auth/send-otp
// Sends an OTP using Twilio Verify
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, channel } = req.body;
    const to = toE164(phone);
    const selectedChannel = String(channel || TWILIO_VERIFY_CHANNEL).toLowerCase();

    if (!to || !isValidIndianPhone(to)) {
      return res.status(400).json({ success: false, message: 'Only valid Indian mobile numbers (+91) are allowed' });
    }

    if (!ALLOWED_CHANNELS.has(selectedChannel)) {
      return res.status(400).json({ success: false, message: 'Channel must be sms or whatsapp' });
    }

    if (!isTwilioConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Twilio Verify is not configured on server',
      });
    }

    await ensureVerifyServiceCodeLength();

    const verification = await getTwilioClient()
      .verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({ to, channel: selectedChannel });

    return res.json({
      success: true,
      message: `OTP sent via ${selectedChannel}`,
      data: {
        sid: verification.sid,
        status: verification.status,
        to,
      },
    });
  } catch (err) {
    console.error('🔴 ERROR sending OTP:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/verify-otp
// Validates OTP with Twilio Verify and logs in/registers user
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;
    const to = toE164(phone);
    const otp = String(code || '').trim();
    const expectedLength = getOtpLength();

    if (!to || !isValidIndianPhone(to)) {
      return res.status(400).json({ success: false, message: 'Only valid Indian mobile numbers (+91) are allowed' });
    }

    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP code is required' });
    }

    const otpRegex = new RegExp(`^\\d{${expectedLength}}$`);
    if (!otpRegex.test(otp)) {
      return res.status(400).json({ success: false, message: `OTP must be ${expectedLength} digits` });
    }

    if (!isTwilioConfigured()) {
      return res.status(500).json({
        success: false,
        message: 'Twilio Verify is not configured on server',
      });
    }

    const verificationCheck = await getTwilioClient()
      .verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({ to, code: otp });

    if (verificationCheck.status !== 'approved') {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await DeliveryUser.findOneAndUpdate(
      { phone: to },
      { $set: { lastLogin: new Date() } },
      { new: true, upsert: true }
    );

    console.log(`✅ Verify: Phone ${to} approved and user logged in.`);

    return res.json({ success: true, data: user });
  } catch (err) {
    console.error('🔴 ERROR verifying OTP:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login
// Upserts the delivery user by phone number
router.post('/login', async (req, res) => {
  try {
    const { phone } = req.body;
    const normalizedPhone = toE164(phone);
    
    if (!normalizedPhone || !isValidIndianPhone(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Only valid Indian mobile numbers (+91) are allowed' });
    }

    // Upsert means: find by phone. If exists, update lastLogin. If not, create it.
    const user = await DeliveryUser.findOneAndUpdate(
      { phone: normalizedPhone },
      { $set: { lastLogin: new Date() } },
      { new: true, upsert: true }
    );

    console.log(`👤 Auth: Delivery user ${normalizedPhone} successfully logged in / registered in delivery_users collection.`);

    res.json({ success: true, data: user });
  } catch (err) {
    console.error('🔴 ERROR logging in delivery user:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/login-credentials
// Login using production credentials stored in delivery_users collection
router.post('/login-credentials', async (req, res) => {
  try {
    const { loginId, password } = req.body;
    const normalizedLoginId = String(loginId || '').trim().toLowerCase();
    const rawPassword = String(password || '');

    if (!normalizedLoginId || !rawPassword) {
      return res.status(400).json({ success: false, message: 'loginId and password are required' });
    }

    const user = await DeliveryUser.findOne({ loginId: normalizedLoginId });
    if (!user || !user.passwordHash || !user.passwordSalt) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const computedHash = hashPassword(rawPassword, user.passwordSalt);
    if (!safeEquals(computedHash, user.passwordHash)) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    return res.json({
      success: true,
      data: {
        _id: user._id,
        loginId: user.loginId,
        phone: user.phone,
        name: user.name,
        email: user.email,
        isProductionAccount: user.isProductionAccount,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error('🔴 ERROR logging in with credentials:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/profile/:phone
router.get('/profile/:phone', async (req, res) => {
  try {
    const normalizedPhone = toE164(req.params.phone);
    const user = await DeliveryUser.findOne({ phone: normalizedPhone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', async (req, res) => {
  try {
    const { phone, name, email, profilePicBase64 } = req.body;
    const normalizedPhone = toE164(phone);
    if (!normalizedPhone || !isValidIndianPhone(normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Only valid Indian mobile numbers (+91) are allowed' });
    }
    const user = await DeliveryUser.findOneAndUpdate(
      { phone: normalizedPhone },
      { $set: { name, email, profilePicBase64 } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;
