// Super Admin Portal Inspection JavaScript
class SuperAdminInspectionWhatever {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('user')) || null;
        this.token = localStorage.getItem('token') || null;
        this.currentPortal = null;
        this.inspectionStartTime = null;
        
        this.init();
    }

    init() {
        if (!this.currentUser || !this.token || this.currentUser.role !== 'superadmin') {
            this.redirectToLogin();
            return;
        }

        this.setupEventListeners();
        this.loadInspectionHistory();
        this.updateInspectionStats();
        this.updateUserInfo();
        this.updateCurrentDate();
    }

    setupEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Portal selection
        document.querySelectorAll('.portal-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const portal = e.currentTarget.dataset.portal;
                this.selectPortal(portal);
            });
        });

        // Inspection controls
        document.getElementById('refreshViewBtn').addEventListener('click', () => this.refreshInspectionView());
        document.getElementById('closeInspectionBtn').addEventListener('click', () => this.closeInspectionView());
        document.getElementById('takeSnapshotBtn').addEventListener('click', () => this.takeSnapshot());
        document.getElementById('exportViewBtn').addEventListener('click', () => this.exportView());

        // User and page selection
        document.getElementById('userSelect').addEventListener('change', () => this.updateInspectionView());
        document.getElementById('pageSelect').addEventListener('change', () => this.updateInspectionView());
    }

    async selectPortal(portal) {
        this.currentPortal = portal;
        
        // Show inspection view
        document.getElementById('inspectionViewCard').style.display = 'block';
        
        // Update page select options based on portal
        const pageSelect = document.getElementById('pageSelect');
        pageSelect.innerHTML = '<option value="dashboard">Dashboard Principal</option>';
        
        if (portal === 'student') {
            pageSelect.innerHTML += `
                <option value="enrollment-process">Proceso de Matrícula</option>
                <option value="ai-schedule">Horario con IA</option>
                <option value="academic-history">Historial Académico</option>
            `;
            document.getElementById('inspectionTitle').textContent = 'Inspección: Portal de Estudiantes';
            document.getElementById('viewingPortal').textContent = 'Portal de Estudiantes';
        } else if (portal === 'admin') {
            pageSelect.innerHTML += `
                <option value="students-management">Gestión de Estudiantes</option>
                <option value="curricula-management">Gestión de Mallas Curriculares</option>
                <option value="queue-monitoring">Monitoreo de Colas</option>
            `;
            document.getElementById('inspectionTitle').textContent = 'Inspección: Portal de Administradores';
            document.getElementById('viewingPortal').textContent = 'Portal de Administradores';
        }

        // Load users for the selected portal
        await this.loadUsersForPortal(portal);
        
        // Start inspection timer
        this.inspectionStartTime = new Date();
        
        // Load initial view
        this.updateInspectionView();
    }

    async loadUsersForPortal(portal) {
        try {
            const userSelect = document.getElementById('userSelect');
            userSelect.innerHTML = '<option value="">Seleccionar usuario específico...</option>';

            if (portal === 'student') {
                const response = await fetch('/api/superadmin/students', {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    data.students.forEach(student => {
                        const option = document.createElement('option');
                        option.value = student.id;
                        option.textContent = `${student.name} (${student.email})`;
                        userSelect.appendChild(option);
                    });
                }
            } else if (portal === 'admin') {
                const response = await fetch('/api/superadmin/admins', {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    data.admins.forEach(admin => {
                        const option = document.createElement('option');
                        option.value = admin.id;
                        option.textContent = `${admin.name} (${admin.email})`;
                        userSelect.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    updateInspectionView() {
        const page = document.getElementById('pageSelect').value;
        const userId = document.getElementById('userSelect').value;
        
        const iframe = document.getElementById('inspectionFrame');
        let src = '';

        if (this.currentPortal === 'student') {
            switch (page) {
                case 'dashboard':
                    src = '/student-dashboard.html';
                    break;
                case 'enrollment-process':
                    src = '/student/enrollment-process.html';
                    break;
                case 'ai-schedule':
                    src = '/student/ai-schedule.html';
                    break;
                case 'academic-history':
                    src = '/student/academic-history.html';
                    break;
            }
        } else if (this.currentPortal === 'admin') {
            switch (page) {
                case 'dashboard':
                    src = '/admin-dashboard.html';
                    break;
                case 'students-management':
                    src = '/admin/students-management.html';
                    break;
                case 'curricula-management':
                    src = '/admin/curricula-management.html';
                    break;
                case 'queue-monitoring':
                    src = '/admin/queue-monitoring.html';
                    break;
            }
        }

        // Update viewing user info
        const userSelect = document.getElementById('userSelect');
        const selectedOption = userSelect.options[userSelect.selectedIndex];
        document.getElementById('viewingUser').textContent = selectedOption.text || 'Todos los usuarios';

        iframe.src = src;
    }

    refreshInspectionView() {
        this.updateInspectionView();
    }

    closeInspectionView() {
        document.getElementById('inspectionViewCard').style.display = 'none';
        document.getElementById('inspectionFrame').src = '';
        
        // Log inspection duration
        if (this.inspectionStartTime) {
            const duration = Math.round((new Date() - this.inspectionStartTime) / 1000 / 60); // minutes
            this.logInspection(duration);
        }
        
        this.currentPortal = null;
        this.inspectionStartTime = null;
    }

    takeSnapshot() {
        alert('Función de captura de pantalla implementada. En producción, esto generaría una imagen de la vista actual.');
    }

    exportView() {
        alert('Función de exportación implementada. En producción, esto exportaría el estado actual de la vista.');
    }

    async loadInspectionHistory() {
        try {
            const response = await fetch('/api/superadmin/inspection-history', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderInspectionHistory(data.history);
            }
        } catch (error) {
            console.error('Error loading inspection history:', error);
        }
    }

    renderInspectionHistory(history) {
        const container = document.getElementById('inspectionHistory');
        container.innerHTML = '';

        if (history.length === 0) {
            container.innerHTML = '<p class="text-center">No hay inspecciones recientes</p>';
            return;
        }

        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-info">
                    <span class="history-time">${new Date(item.timestamp).toLocaleString()}</span>
                    <span class="history-portal">${item.portal}</span>
                    <span class="history-user">Usuario: ${item.user}</span>
                    <span class="history-page">Página: ${item.page}</span>
                </div>
                <span class="history-duration">${item.duration} min</span>
            `;
            container.appendChild(historyItem);
        });
    }

    async updateInspectionStats() {
        try {
            const response = await fetch('/api/superadmin/inspection-stats', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                document.getElementById('totalInspections').textContent = data.total_inspections || 0;
                document.getElementById('studentPortalInspections').textContent = data.student_inspections || 0;
                document.getElementById('adminPortalInspections').textContent = data.admin_inspections || 0;
                document.getElementById('avgInspectionTime').textContent = `${data.avg_time || 0} min`;
            }
        } catch (error) {
            console.error('Error loading inspection stats:', error);
        }
    }

    async logInspection(duration) {
        try {
            const page = document.getElementById('pageSelect').value;
            const userSelect = document.getElementById('userSelect');
            const selectedOption = userSelect.options[userSelect.selectedIndex];
            
            await fetch('/api/superadmin/log-inspection', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    portal: this.currentPortal,
                    page: page,
                    user: selectedOption.text || 'Sistema',
                    duration: duration
                })
            });
        } catch (error) {
            console.error('Error logging inspection:', error);
        }
    }

    updateUserInfo() {
        document.getElementById('superadminName').textContent = this.currentUser.name;
    }

    updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('es-ES', options);
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }

    redirectToLogin() {
        window.location.href = '/login.html';
    }
}

// Initialize the whatever
let superAdminInspection;
document.addEventListener('DOMContentLoaded', () => {
    superAdminInspection = new SuperAdminInspectionWhatever();
});