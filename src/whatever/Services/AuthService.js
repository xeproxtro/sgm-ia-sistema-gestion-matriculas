const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { models } = require('../../Model');
const { User, Student } = models;
const { Op } = require('sequelize');
const OTPService = require('./OTPService');
require('dotenv').config();

class AuthService {
  async registerUser(userData) {
    try {
      const { document_number, name, email, phone, role, password } = userData;

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [
            { document_number },
            { email }
          ]
        }
      });

      if (existingUser) {
        return {
          success: false,
          message: 'El usuario ya existe con este documento o correo'
        };
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await User.create({
        document_number,
        name,
        email,
        phone,
        role: role || 'student',
        password_hash: passwordHash
      });

      if (role === 'student') {
        await Student.create({
          user_id: user.id,
          student_code: this.generateStudentCode(document_number),
          program: userData.program || 'Por asignar',
          semester: userData.semester || 1
        });
      }

      return {
        success: true,
        message: 'Usuario registrado exitosamente',
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      return {
        success: false,
        message: 'Error al registrar usuario',
        error: error.message
      };
    }
  }

  async login(document_number, password) {
    try {
      const user = await User.findOne({
        where: { 
          [Op.or]: [
            { document_number },
            { email: document_number }
          ]
        },
        include: [{ model: Student, as: 'student' }]
      });

      if (!user) {
        return {
          success: false,
          message: 'Credenciales inválidas'
        };
      }

      if (!user.is_active) {
        return {
          success: false,
          message: 'Usuario inactivo'
        };
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return {
          success: false,
          message: 'Credenciales inválidas'
        };
      }

      const otpResult = await OTPService.sendLoginOTP(user.email);

      if (!otpResult.success) {
        return {
          success: false,
          message: 'Error al enviar código OTP',
          error: otpResult.error
        };
      }

      user.otp_code = otpResult.otp;
      user.otp_expires_at = otpResult.expiresAt;
      await user.save();

      return {
        success: true,
        message: 'OTP enviado al correo electrónico',
        requiresOTP: true,
        userId: user.id
      };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error en login',
        error: error.message
      };
    }
  }

  async verifyOTP(userId, otp) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      const verification = await OTPService.verifyOTP(
        user.otp_code,
        otp,
        user.otp_expires_at
      );

      if (!verification.valid) {
        return {
          success: false,
          message: verification.message
        };
      }

      user.otp_code = null;
      user.otp_expires_at = null;
      user.last_login = new Date();
      await user.save();

      const token = this.generateToken(user);

      return {
        success: true,
        message: 'Autenticación exitosa',
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      console.error('Error al verificar OTP:', error);
      return {
        success: false,
        message: 'Error al verificar OTP',
        error: error.message
      };
    }
  }

  async verifyEnrollmentOTP(userId, otp) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      const verification = await OTPService.verifyOTP(
        user.otp_code,
        otp,
        user.otp_expires_at
      );

      if (!verification.valid) {
        return {
          success: false,
          message: verification.message
        };
      }

      user.otp_code = null;
      user.otp_expires_at = null;
      await user.save();

      return {
        success: true,
        message: 'OTP de matrícula verificado exitosamente'
      };
    } catch (error) {
      console.error('Error al verificar OTP de matrícula:', error);
      return {
        success: false,
        message: 'Error al verificar OTP de matrícula',
        error: error.message
      };
    }
  }

  async requestEnrollmentOTP(userId) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      const otpResult = await OTPService.sendEnrollmentConfirmationOTP(user.email);

      if (!otpResult.success) {
        return {
          success: false,
          message: 'Error al enviar código OTP',
          error: otpResult.error
        };
      }

      user.otp_code = otpResult.otp;
      user.otp_expires_at = otpResult.expiresAt;
      await user.save();

      return {
        success: true,
        message: 'OTP de confirmación enviado al correo electrónico',
        expiresAt: otpResult.expiresAt
      };
    } catch (error) {
      console.error('Error al solicitar OTP de matrícula:', error);
      return {
        success: false,
        message: 'Error al solicitar OTP de matrícula',
        error: error.message
      };
    }
  }

  generateToken(user) {
    const payload = {
      userId: user.id,
      documentNumber: user.document_number,
      role: user.role,
      email: user.email
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });
  }

  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return {
        valid: true,
        decoded
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Token inválido o expirado'
      };
    }
  }

  sanitizeUser(user) {
    const { password_hash, otp_code, otp_expires_at, ...sanitized } = user.toJSON();
    return sanitized;
  }

  generateStudentCode(documentNumber) {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${year}${documentNumber.slice(-4)}${randomSuffix}`;
  }

  async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      if (updateData.password) {
        updateData.password_hash = await bcrypt.hash(updateData.password, 10);
        delete updateData.password;
      }

      await user.update(updateData);

      return {
        success: true,
        message: 'Usuario actualizado exitosamente',
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return {
        success: false,
        message: 'Error al actualizar usuario',
        error: error.message
      };
    }
  }

  async deactivateUser(userId) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      user.is_active = false;
      await user.save();

      return {
        success: true,
        message: 'Usuario desactivado exitosamente'
      };
    } catch (error) {
      console.error('Error al desactivar usuario:', error);
      return {
        success: false,
        message: 'Error al desactivar usuario',
        error: error.message
      };
    }
  }
}

module.exports = new AuthService();
