// controllers/authController.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendWelcomeEmail, sendAdminUserRegisteredEmail } = require('../services/emailService');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const register = async (req, res, next) => {
  try {
    const { name, email, password, organization } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, organization });

    // Welcome notification — safe, won't crash
    try {
      await Notification.create({
        recipient: user._id,
        title:     'Welcome to NGO Events! 🌍',
        message:   `Hi ${name}, welcome aboard! Browse events and start volunteering.`,
        type:      'system',
      });
    } catch (e) { console.error('Notification create failed:', e.message); }

    // Emails — fire and forget, NEVER block the response
    sendWelcomeEmail(user).catch(e => console.error('Welcome email failed:', e.message));
    sendAdminUserRegisteredEmail(user).catch(e => console.error('Admin email failed:', e.message));

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id:          user._id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        organization: user.organization,
      },
    });
  } catch (err) {
    console.error('Register error:', err.message);
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        _id:          user._id,
        name:         user.name,
        email:        user.email,
        role:         user.role,
        organization: user.organization,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    next(err);
  }
};

const getMe = async (req, res) => res.json({ success: true, user: req.user });

const updateProfile = async (req, res, next) => {
  try {
    const { name, organization, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, organization, avatar },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json({ success: true, users, count: users.length });
  } catch (err) { next(err); }
};

module.exports = { register, login, getMe, updateProfile, getAllUsers };
