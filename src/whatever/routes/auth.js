const express = require('express');
const router = express.Router();
const AuthService = require('../Services/AuthService');

// Register new user (admin only typically)
router.post('/register', async (req, res) => {
  try {
    const result = await AuthService.registerUser(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { document_number, password } = req.body;
    const result = await AuthService.login(document_number, password);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en login',
      error: error.message
    });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const result = await AuthService.verifyOTP(userId, otp);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar OTP',
      error: error.message
    });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await AuthService.requestEnrollmentOTP(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al reenviar OTP',
      error: error.message
    });
  }
});

// Request enrollment OTP
router.post('/request-enrollment-otp', async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await AuthService.requestEnrollmentOTP(userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al solicitar OTP de matrícula',
      error: error.message
    });
  }
});

// Verify enrollment OTP
router.post('/verify-enrollment-otp', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { otp } = req.body;
    const result = await AuthService.verifyEnrollmentOTP(userId, otp);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar OTP de matrícula',
      error: error.message
    });
  }
});

module.exports = router;
