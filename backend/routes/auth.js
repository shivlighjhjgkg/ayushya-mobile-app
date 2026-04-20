const express = require('express');
const User = require('../models/User');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and name',
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create new user
    user = new User({
      name,
      email,
      password_hash: password,
    });

    // Save user (password gets hashed by pre-save hook)
    await user.save();

    // Generate a simple token (userId_timestamp format for now)
    // TODO: Replace with proper JWT token generation
    const token = `${user._id}_${Date.now()}`;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: token,
      userId: user._id,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt starting...');
    const { email, password } = req.body;
    console.log('📧 Email:', email);

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user (include password since it's select: false in schema)
    console.log('🔍 Finding user in database...');
    const user = await User.findOne({ email }).select('+password_hash');
    console.log('✅ Database query completed');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Email not found',
      });
    }

    console.log('✅ User found, comparing passwords...');
    // Check if password matches
    const isPasswordValid = await user.comparePassword(password);
    console.log('✅ Password comparison completed:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Generate a simple token (userId_timestamp format for now)
    // TODO: Replace with proper JWT token generation
    const token = `${user._id}_${Date.now()}`;
    console.log('✅ Token generated:', token);

    // Success - return user info
    console.log('✅ Login successful for:', email);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      userId: user._id,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user (validate token)
// @access  Private
router.get('/me', async (req, res) => {
  try {
    // Parse token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Simple token validation (userId_timestamp format)
    // TODO: Replace with proper JWT verification
    if (!token.includes('_')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token format',
      });
    }

    const userId = token.split('_')[0];

    // Get user from database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Token validation failed',
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (frontend cleanup)
// @access  Private
router.post('/logout', (req, res) => {
  // With token-based auth, logout is handled by the frontend deleting the token
  // This endpoint is mainly for server-side cleanup if needed
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

module.exports = router;
