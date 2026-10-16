// Login Page JavaScript
class LoginWhatever {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.otpSection = document.getElementById('otpSection');
        this.otpForm = document.getElementById('otpForm');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        this.resendOtpBtn = document.getElementById('resendOtp');
        
        this.currentUserId = null;
        this.init();
    }

    init() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.otpForm.addEventListener('submit', (e) => this.handleOTPVerification(e));
        this.resendOtpBtn.addEventListener('click', () => this.resendOTP());
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(this.loginForm);
        const loginData = {
            document_number: formData.get('documentNumber'),
            password: formData.get('password')
        };

        this.setLoading(true);
        this.hideMessages();

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                if (result.requiresOTP) {
                    this.currentUserId = result.userId;
                    this.showOTPSection();
                    this.showSuccess(result.message);
                } else {
                    this.showError('Error: Se requiere verificación OTP');
                }
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Error de conexión. Por favor intente nuevamente.');
        } finally {
            this.setLoading(false);
        }
    }

    async handleOTPVerification(e) {
        e.preventDefault();
        
        const otpCode = document.getElementById('otpCode').value;
        
        if (!otpCode || otpCode.length !== 6) {
            this.showError('Por favor ingrese un código OTP válido de 6 dígitos');
            return;
        }

        this.setLoading(true);
        this.hideMessages();

        try {
            const response = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUserId,
                    otp: otpCode
                })
            });

            const result = await response.json();

            if (result.success) {
                localStorage.setItem('token', result.token);
                localStorage.setItem('user', JSON.stringify(result.user));
                this.redirectBasedOnRole(result.user.role);
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Error de conexión. Por favor intente nuevamente.');
        } finally {
            this.setLoading(false);
        }
    }

    async resendOTP() {
        if (!this.currentUserId) {
            this.showError('Error: No hay sesión activa');
            return;
        }

        this.setLoading(true);
        this.hideMessages();

        try {
            const response = await fetch('/api/auth/resend-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.currentUserId
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Nuevo código OTP enviado a su teléfono');
            } else {
                this.showError(result.message);
            }
        } catch (error) {
            this.showError('Error de conexión. Por favor intente nuevamente.');
        } finally {
            this.setLoading(false);
        }
    }

    showOTPSection() {
        this.loginForm.style.display = 'none';
        this.otpSection.style.display = 'block';
    }

    redirectBasedOnRole(role) {
        const roleRoutes = {
            'student': '/student-dashboard.html',
            'admin': '/admin-dashboard.html',
            'superadmin': '/superadmin-dashboard.html'
        };

        const redirectUrl = roleRoutes[role] || '/student-dashboard.html';
        window.location.href = redirectUrl;
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
    }

    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }

    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }

    setLoading(isLoading) {
        const submitBtns = document.querySelectorAll('button[type="submit"]');
        submitBtns.forEach(btn => {
            const btnText = btn.querySelector('.btn-text');
            const btnLoader = btn.querySelector('.btn-loader');
            
            if (isLoading) {
                btn.disabled = true;
                if (btnText) btnText.style.display = 'none';
                if (btnLoader) btnLoader.style.display = 'inline-block';
            } else {
                btn.disabled = false;
                if (btnText) btnText.style.display = 'inline';
                if (btnLoader) btnLoader.style.display = 'none';
            }
        });
    }
}

// Initialize Login Whatever when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new LoginWhatever();
});
