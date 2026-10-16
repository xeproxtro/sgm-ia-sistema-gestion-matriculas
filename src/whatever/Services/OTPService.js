const nodemailer = require('nodemailer');
require('dotenv').config();

class OTPService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTP(email, otp, purpose = 'login') {
    try {
      const subject = purpose === 'enrollment' 
        ? 'SGM-IA - Código de Confirmación de Matrícula'
        : 'SGM-IA - Código de Verificación';
      
      const validityTime = purpose === 'enrollment' ? '10 minutos' : '5 minutos';
      
      // Mostrar OTP en consola para desarrollo (sin configuración de correo)
      console.log('==========================================');
      console.log(`OTP GENERADO para ${email}`);
      console.log(`Propósito: ${purpose}`);
      console.log(`Código: ${otp}`);
      console.log(`Válido por: ${validityTime}`);
      console.log('==========================================');
      
      return { success: true, messageId: 'console-log' };
    } catch (error) {
      console.error('Error al generar OTP:', error);
      return { success: false, error: error.message };
    }
  }

  generateOTPEmailTemplate(otp, validityTime, purpose) {
    const purposeText = purpose === 'enrollment' 
      ? 'confirmación de matrícula' 
      : 'verificación de identidad';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SGM-IA - Código de Verificación</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
          }
          .otp-code {
            background-color: #0066cc;
            color: white;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 5px;
            padding: 20px;
            text-align: center;
            border-radius: 8px;
            margin: 30px 0;
          }
          .warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">SGM-IA - UTS</div>
            <h2>Código de ${purposeText.charAt(0).toUpperCase() + purposeText.slice(1)}</h2>
          </div>
          
          <p>Estimado usuario,</p>
          
          <p>Ha solicitado un código de ${purposeText} para el Sistema de Gestión de Matrículas con Inteligencia Artificial de las Unidades Tecnológicas de Santander.</p>
          
          <div class="otp-code">${otp}</div>
          
          <p>Este código es válido por <strong>${validityTime}</strong>.</p>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Nunca comparta este código con nadie</li>
              <li>El equipo de SGM-IA nunca le solicitará este código</li>
              <li>Si no solicitó este código, ignore este mensaje</li>
            </ul>
          </div>
          
          <p>Si tiene alguna pregunta o necesita asistencia, contacte al soporte técnico.</p>
          
          <div class="footer">
            <p>© 2026 Unidades Tecnológicas de Santander - SGM-IA</p>
            <p>Este es un mensaje automático, por favor no responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async verifyOTP(storedOTP, providedOTP, expiresAt) {
    if (!storedOTP || !providedOTP) {
      return { valid: false, message: 'Código no proporcionado' };
    }

    if (new Date() > new Date(expiresAt)) {
      return { valid: false, message: 'Código expirado' };
    }

    if (storedOTP !== providedOTP) {
      return { valid: false, message: 'Código incorrecto' };
    }

    return { valid: true, message: 'Código verificado exitosamente' };
  }

  async sendLoginOTP(email) {
    const otp = this.generateOTP();
    const result = await this.sendOTP(email, otp, 'login');
    
    if (result.success) {
      return { success: true, otp, expiresAt: new Date(Date.now() + 5 * 60 * 1000) };
    }
    
    return result;
  }

  async sendEnrollmentConfirmationOTP(email) {
    const otp = this.generateOTP();
    const result = await this.sendOTP(email, otp, 'enrollment');
    
    if (result.success) {
      return { success: true, otp, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
    }
    
    return result;
  }

  async testEmailConnection() {
    try {
      await this.transporter.verify();
      console.log('Conexión con servidor de correo establecida exitosamente');
      return { success: true };
    } catch (error) {
      console.error('Error al conectar con servidor de correo:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new OTPService();
