// Super Admin Dashboard JavaScript
class SuperAdminDashboardWhatever {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('user')) || null;
        this.token = localStorage.getItem('token') || null;
        this.currentSection = 'overview';
        
        this.init();
    }

    init() {
        if (!this.currentUser || !this.token || this.currentUser.role !== 'superadmin') {
            this.redirectToLogin();
            return;
        }

        this.setupNavigation();
        this.setupEventListeners();
        this.loadSuperAdminData();
        this.startSystemMonitoring();
    }

    setupNavigation() {
        const menuItems = document.querySelectorAll('.sidebar-menu a');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const section = item.dataset.section;
                // Si tiene data-section, es navegación interna
                if (section) {
                    e.preventDefault();
                    this.navigateToSection(section);
                }
                // Si no, es un enlace externo a otra página HTML
            });
        });
    }

    setupEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Critical actions
        document.getElementById('toggleMaintenanceBtn')?.addEventListener('click', () => this.toggleMaintenance());
        document.getElementById('emergencyStopBtn')?.addEventListener('click', () => this.emergencyStop());
        document.getElementById('backupBtn')?.addEventListener('click', () => this.performBackup());

        // Admin management
        document.getElementById('addAdminBtn')?.addEventListener('click', () => this.openAdminModal());
        document.getElementById('adminForm')?.addEventListener('submit', (e) => this.handleAdminSubmit(e));

        // Permissions
        document.getElementById('savePermissionsBtn')?.addEventListener('click', () => this.savePermissions());

        // Maintenance controls
        document.getElementById('activateMaintenanceBtn')?.addEventListener('click', () => this.activateMaintenance());
        document.getElementById('deactivateMaintenanceBtn')?.addEventListener('click', () => this.deactivateMaintenance());
        document.getElementById('saveMaintenanceMessageBtn')?.addEventListener('click', () => this.saveMaintenanceMessage());
        document.getElementById('scheduleMaintenanceBtn')?.addEventListener('click', () => this.scheduleMaintenance());

        // Logs
        document.getElementById('filterLogsBtn')?.addEventListener('click', () => this.filterLogs());
        document.getElementById('exportLogsBtn')?.addEventListener('click', () => this.exportLogs());

        // Audit
        document.getElementById('filterAuditBtn')?.addEventListener('click', () => this.filterAudit());

        // Modal handling
        this.setupModalHandlers();
    }

    setupModalHandlers() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(modal));
            }
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal);
                }
            });
        });
    }

    navigateToSection(section) {
        document.querySelectorAll('.sidebar-menu a').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        document.querySelectorAll('.dashboard-section').forEach(sec => {
            sec.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${section}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
            this.loadSectionData(section);
        }
    }

    async loadSuperAdminData() {
        try {
            const response = await fetch('/api/superadmin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateSuperAdminInfo(data.superadmin);
                this.updateDashboardStats(data.stats);
                this.updateSystemStatus(data.system_status);
            }
        } catch (error) {
            console.error('Error loading superadmin data:', error);
        }
    }

    updateSuperAdminInfo(superadmin) {
        document.getElementById('superadminName').textContent = superadmin.name;
    }

    updateDashboardStats(stats) {
        document.getElementById('totalAdmins').textContent = stats.total_admins || 0;
        document.getElementById('totalStudents').textContent = stats.total_students || 0;
        document.getElementById('systemStatus').textContent = stats.system_status || 'Operativo';
        document.getElementById('securityEvents').textContent = stats.security_events || 0;
    }

    updateSystemStatus(systemStatus) {
        document.getElementById('maintenanceStatus').textContent = systemStatus.maintenance_mode ? 'Activo' : 'Inactivo';
        document.getElementById('lastBackup').textContent = systemStatus.last_backup || '-';
        document.getElementById('uptime').textContent = systemStatus.uptime || '0h 0m';
        
        const indicator = document.getElementById('maintenanceIndicator');
        if (systemStatus.maintenance_mode) {
            indicator.style.display = 'flex';
        } else {
            indicator.style.display = 'none';
        }
    }

    async loadSectionData(section) {
        switch (section) {
            case 'admin-management':
                await this.loadAdmins();
                break;
            case 'global-permissions':
                await this.loadPermissions();
                break;
            case 'system-maintenance':
                await this.loadMaintenanceStatus();
                break;
            case 'system-logs':
                await this.loadSystemLogs();
                break;
            case 'audit':
                await this.loadAuditData();
                break;
        }
    }

    async loadAdmins() {
        try {
            const response = await fetch('/api/superadmin/admins', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderAdminsTable(data.admins);
            }
        } catch (error) {
            console.error('Error loading admins:', error);
        }
    }

    renderAdminsTable(admins) {
        const tbody = document.getElementById('adminsTableBody');
        tbody.innerHTML = '';

        admins.forEach(admin => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${admin.document_number}</td>
                <td>${admin.name}</td>
                <td>${admin.email}</td>
                <td><span class="status-badge ${admin.is_active ? 'active' : 'inactive'}">${admin.is_active ? 'Activo' : 'Inactivo'}</span></td>
                <td>${admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Nunca'}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="this.editAdmin(${admin.id})">Editar</button>
                    <button class="btn btn-sm btn-warning" onclick="this.toggleAdminStatus(${admin.id})">${admin.is_active ? 'Desactivar' : 'Activar'}</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadPermissions() {
        try {
            const response = await fetch('/api/superadmin/permissions', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updatePermissionsUI(data.permissions);
            }
        } catch (error) {
            console.error('Error loading permissions:', error);
        }
    }

    updatePermissionsUI(permissions) {
        // Update admin permissions
        document.getElementById('permManageStudents').checked = permissions.admin.manage_students;
        document.getElementById('permManageCurricula').checked = permissions.admin.manage_curricula;
        document.getElementById('permManageCourses').checked = permissions.admin.manage_courses;
        document.getElementById('permManageQueue').checked = permissions.admin.manage_queue;
        document.getElementById('permGenerateReports').checked = permissions.admin.generate_reports;

        // Update system permissions
        document.getElementById('permMaintenance').checked = permissions.system.maintenance;
        document.getElementById('permSystemLogs').checked = permissions.system.system_logs;
        document.getElementById('permAudit').checked = permissions.system.audit;
    }

    async loadMaintenanceStatus() {
        try {
            const response = await fetch('/api/superadmin/maintenance/status', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateMaintenanceUI(data);
            }
        } catch (error) {
            console.error('Error loading maintenance status:', error);
        }
    }

    updateMaintenanceUI(maintenanceData) {
        const statusText = document.getElementById('currentMaintenanceStatus');
        const indicator = document.getElementById('maintenanceIndicator2');
        
        if (maintenanceData.active) {
            statusText.textContent = 'En Mantenimiento';
            indicator.querySelector('.status-dot').classList.add('warning');
        } else {
            statusText.textContent = 'Operativo';
            indicator.querySelector('.status-dot').classList.remove('warning');
        }

        document.getElementById('maintenanceMessage').value = maintenanceData.message || '';
    }

    async loadSystemLogs() {
        try {
            const logLevel = document.getElementById('logLevel').value;
            const logDate = document.getElementById('logDate').value;

            const response = await fetch(`/api/superadmin/logs?level=${logLevel}&date=${logDate}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderSystemLogs(data.logs);
            }
        } catch (error) {
            console.error('Error loading system logs:', error);
        }
    }

    renderSystemLogs(logs) {
        const container = document.getElementById('systemLogsContainer');
        container.innerHTML = '';

        logs.forEach(log => {
            const logElement = document.createElement('div');
            logElement.className = `log-entry ${log.level.toLowerCase()}`;
            logElement.innerHTML = `
                <span class="log-time">${log.timestamp}</span>
                <span class="log-level">${log.level}</span>
                <span class="log-message">${log.message}</span>
            `;
            container.appendChild(logElement);
        });
    }

    async loadAuditData() {
        try {
            const auditAction = document.getElementById('auditAction').value;
            const startDate = document.getElementById('auditStartDate').value;
            const endDate = document.getElementById('auditEndDate').value;

            const response = await fetch(`/api/superadmin/audit?action=${auditAction}&start=${startDate}&end=${endDate}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderAuditTable(data.audit_logs);
            }
        } catch (error) {
            console.error('Error loading audit data:', error);
        }
    }

    renderAuditTable(auditLogs) {
        const tbody = document.getElementById('auditTableBody');
        tbody.innerHTML = '';

        auditLogs.forEach(log => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td>${log.user_name || 'Sistema'}</td>
                <td><span class="log-level ${log.action}">${log.action}</span></td>
                <td>${log.details}</td>
                <td>${log.ip_address}</td>
            `;
            tbody.appendChild(row);
        });
    }

    async toggleMaintenance() {
        try {
            const response = await fetch('/api/superadmin/maintenance/toggle', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                this.loadSuperAdminData();
            }
        } catch (error) {
            console.error('Error toggling maintenance:', error);
            alert('Error al cambiar modo de mantenimiento');
        }
    }

    async emergencyStop() {
        if (!confirm('¿Está seguro de realizar una parada de emergencia? Esto detendrá todas las operaciones del sistema.')) {
            return;
        }

        try {
            const response = await fetch('/api/superadmin/emergency-stop', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Parada de emergencia ejecutada');
            }
        } catch (error) {
            console.error('Error performing emergency stop:', error);
            alert('Error al ejecutar parada de emergencia');
        }
    }

    async performBackup() {
        try {
            const response = await fetch('/api/superadmin/backup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
                this.loadSuperAdminData();
            }
        } catch (error) {
            console.error('Error performing backup:', error);
            alert('Error al realizar backup');
        }
    }

    openAdminModal() {
        const modal = document.getElementById('adminModal');
        modal.style.display = 'block';
    }

    async handleAdminSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const adminData = {
            document_number: formData.get('adminDocument'),
            name: formData.get('adminName'),
            email: formData.get('adminEmail'),
            phone: formData.get('adminPhone'),
            password: formData.get('adminPassword')
        };

        try {
            const response = await fetch('/api/superadmin/admins', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(adminData)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert('Administrador agregado exitosamente');
                    this.closeModal(document.getElementById('adminModal'));
                    this.loadAdmins();
                } else {
                    alert(data.message);
                }
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            alert('Error al agregar administrador');
        }
    }

    async savePermissions() {
        const permissions = {
            admin: {
                manage_students: document.getElementById('permManageStudents').checked,
                manage_curricula: document.getElementById('permManageCurricula').checked,
                manage_courses: document.getElementById('permManageCourses').checked,
                manage_queue: document.getElementById('permManageQueue').checked,
                generate_reports: document.getElementById('permGenerateReports').checked
            },
            system: {
                maintenance: document.getElementById('permMaintenance').checked,
                system_logs: document.getElementById('permSystemLogs').checked,
                audit: document.getElementById('permAudit').checked
            }
        };

        try {
            const response = await fetch('/api/superadmin/permissions', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ permissions })
            });

            if (response.ok) {
                alert('Permisos guardados exitosamente');
            }
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert('Error al guardar permisos');
        }
    }

    async activateMaintenance() {
        try {
            const response = await fetch('/api/superadmin/maintenance/activate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Modo mantenimiento activado');
                this.loadMaintenanceStatus();
            }
        } catch (error) {
            console.error('Error activating maintenance:', error);
            alert('Error al activar modo mantenimiento');
        }
    }

    async deactivateMaintenance() {
        try {
            const response = await fetch('/api/superadmin/maintenance/deactivate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Modo mantenimiento desactivado');
                this.loadMaintenanceStatus();
            }
        } catch (error) {
            console.error('Error deactivating maintenance:', error);
            alert('Error al desactivar modo mantenimiento');
        }
    }

    async saveMaintenanceMessage() {
        const message = document.getElementById('maintenanceMessage').value;

        try {
            const response = await fetch('/api/superadmin/maintenance/message', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                alert('Mensaje de mantenimiento guardado');
            }
        } catch (error) {
            console.error('Error saving maintenance message:', error);
            alert('Error al guardar mensaje de mantenimiento');
        }
    }

    async scheduleMaintenance() {
        const schedule = document.getElementById('maintenanceSchedule').value;
        const duration = document.getElementById('maintenanceDuration').value;

        if (!schedule) {
            alert('Por favor seleccione una fecha y hora');
            return;
        }

        try {
            const response = await fetch('/api/superadmin/maintenance/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ schedule, duration })
            });

            if (response.ok) {
                alert('Mantenimiento programado exitosamente');
            }
        } catch (error) {
            console.error('Error scheduling maintenance:', error);
            alert('Error al programar mantenimiento');
        }
    }

    filterLogs() {
        this.loadSystemLogs();
    }

    async exportLogs() {
        try {
            const response = await fetch('/api/superadmin/logs/export', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `system-logs-${new Date().toISOString()}.log`;
                a.click();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error exporting logs:', error);
            alert('Error al exportar logs');
        }
    }

    filterAudit() {
        this.loadAuditData();
    }

    startSystemMonitoring() {
        setInterval(() => {
            this.loadSuperAdminData();
        }, 30000); // Update every 30 seconds
    }

    openModal(modal) {
        modal.style.display = 'block';
    }

    closeModal(modal) {
        modal.style.display = 'none';
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

// Initialize Super Admin Dashboard Whatever when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SuperAdminDashboardWhatever();
});
