// Super Admin Maintenance JavaScript
class SuperAdminMaintenanceWhatever {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('user')) || null;
        this.token = localStorage.getItem('token') || null;
        
        this.init();
    }

    init() {
        if (!this.currentUser || !this.token || this.currentUser.role !== 'superadmin') {
            this.redirectToLogin();
            return;
        }

        this.setupEventListeners();
        this.loadMaintenanceStatus();
        this.loadScheduledMaintenance();
        this.loadMaintenanceLogs();
        this.updateUserInfo();
        this.updateCurrentDate();
    }

    setupEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Maintenance controls
        document.getElementById('activateMaintenanceBtn').addEventListener('click', () => this.activateMaintenance());
        document.getElementById('deactivateMaintenanceBtn').addEventListener('click', () => this.deactivateMaintenance());
        document.getElementById('maintenanceToggle').addEventListener('change', (e) => this.handleMaintenanceToggle(e));
        
        // Message update
        document.getElementById('maintenanceMessageInput').addEventListener('change', () => this.updateMaintenanceMessage());
        
        // Scheduling
        document.getElementById('scheduleMaintenanceBtn').addEventListener('click', () => this.scheduleMaintenance());
        
        // System operations
        document.getElementById('backupBtn').addEventListener('click', () => this.performBackup());
        document.getElementById('restartServicesBtn').addEventListener('click', () => this.restartServices());
        document.getElementById('clearCacheBtn').addEventListener('click', () => this.clearCache());
        document.getElementById('emergencyStopBtn').addEventListener('click', () => this.emergencyStop());
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

    updateMaintenanceUI(data) {
        const statusBadge = document.getElementById('maintenanceStatus');
        const toggle = document.getElementById('maintenanceToggle');
        
        if (data.active) {
            statusBadge.textContent = 'ACTIVO';
            statusBadge.className = 'status-badge active';
            toggle.checked = true;
        } else {
            statusBadge.textContent = 'INACTIVO';
            statusBadge.className = 'status-badge inactive';
            toggle.checked = false;
        }

        document.getElementById('maintenanceMessage').textContent = data.message || 'Sistema operativo normal';
        document.getElementById('maintenanceMessageInput').value = data.message || '';
    }

    async activateMaintenance() {
        if (!confirm('¿Está seguro de activar el modo de mantenimiento? Esto bloqueará el acceso de los usuarios.')) {
            return;
        }

        try {
            const response = await fetch('/api/superadmin/maintenance/activate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                alert('Modo mantenimiento activado');
                this.loadMaintenanceStatus();
                this.addMaintenanceLog('MANTENIMIENTO_ACTIVADO', 'Modo mantenimiento activado manualmente');
            } else {
                alert(result.message || 'Error al activar modo mantenimiento');
            }
        } catch (error) {
            console.error('Error activating maintenance:', error);
            alert('Error al activar modo mantenimiento');
        }
    }

    async deactivateMaintenance() {
        if (!confirm('¿Está seguro de desactivar el modo de mantenimiento?')) {
            return;
        }

        try {
            const response = await fetch('/api/superadmin/maintenance/deactivate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                alert('Modo mantenimiento desactivado');
                this.loadMaintenanceStatus();
                this.addMaintenanceLog('MANTENIMIENTO_DESACTIVADO', 'Sistema restaurado a operación normal');
            } else {
                alert(result.message || 'Error al desactivar modo mantenimiento');
            }
        } catch (error) {
            console.error('Error deactivating maintenance:', error);
            alert('Error al desactivar modo mantenimiento');
        }
    }

    handleMaintenanceToggle(e) {
        if (e.target.checked) {
            this.activateMaintenance();
        } else {
            this.deactivateMaintenance();
        }
    }

    async updateMaintenanceMessage() {
        const message = document.getElementById('maintenanceMessageInput').value;

        try {
            const response = await fetch('/api/superadmin/maintenance/message', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ message })
            });

            const result = await response.json();

            if (result.success) {
                document.getElementById('maintenanceMessage').textContent = message;
                this.addMaintenanceLog('MENSAJE_ACTUALIZADO', `Mensaje de mantenimiento actualizado: ${message}`);
            } else {
                alert(result.message || 'Error al actualizar mensaje');
            }
        } catch (error) {
            console.error('Error updating maintenance message:', error);
            alert('Error al actualizar mensaje de mantenimiento');
        }
    }

    async scheduleMaintenance() {
        const date = document.getElementById('scheduleDate').value;
        const time = document.getElementById('scheduleTime').value;
        const duration = document.getElementById('scheduleDuration').value;
        const message = document.getElementById('scheduleMessage').value;

        if (!date || !time) {
            alert('Por favor seleccione fecha y hora para el mantenimiento');
            return;
        }

        try {
            const response = await fetch('/api/superadmin/maintenance/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({
                    schedule: `${date}T${time}`,
                    duration: parseInt(duration),
                    message: message || 'Mantenimiento programado'
                })
            });

            const result = await response.json();

            if (result.success) {
                alert('Mantenimiento programado exitosamente');
                this.loadScheduledMaintenance();
                this.addMaintenanceLog('MANTENIMIENTO_PROGRAMADO', `Mantenimiento programado para ${date} ${time}`);
            } else {
                alert(result.message || 'Error al programar mantenimiento');
            }
        } catch (error) {
            console.error('Error scheduling maintenance:', error);
            alert('Error al programar mantenimiento');
        }
    }

    async loadScheduledMaintenance() {
        try {
            const response = await fetch('/api/superadmin/maintenance/scheduled', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderScheduledMaintenance(data.scheduled);
            }
        } catch (error) {
            console.error('Error loading scheduled maintenance:', error);
        }
    }

    renderScheduledMaintenance(scheduled) {
        const container = document.getElementById('scheduledList');
        container.innerHTML = '';

        if (!scheduled || scheduled.length === 0) {
            container.innerHTML = '<p class="text-center">No hay mantenimientos programados</p>';
            return;
        }

        scheduled.forEach(item => {
            const div = document.createElement('div');
            div.className = 'scheduled-item';
            div.innerHTML = `
                <div class="scheduled-info">
                    <span class="scheduled-date">${item.schedule}</span>
                    <span class="scheduled-duration">${item.duration} minutos</span>
                    <span class="scheduled-message">${item.message}</span>
                </div>
                <button class="btn btn-danger btn-sm" onclick="superAdminMaintenance.cancelScheduled('${item.id}')">Cancelar</button>
            `;
            container.appendChild(div);
        });
    }

    async cancelScheduled(id) {
        if (!confirm('¿Está seguro de cancelar este mantenimiento programado?')) {
            return;
        }

        try {
            const response = await fetch(`/api/superadmin/maintenance/scheduled/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Mantenimiento cancelado');
                this.loadScheduledMaintenance();
                this.addMaintenanceLog('MANTENIMIENTO_CANCELADO', `Mantenimiento programado cancelado`);
            } else {
                alert('Error al cancelar mantenimiento');
            }
        } catch (error) {
            console.error('Error canceling scheduled maintenance:', error);
            alert('Error al cancelar mantenimiento');
        }
    }

    async performBackup() {
        if (!confirm('¿Está seguro de realizar un backup de la base de datos?')) {
            return;
        }

        try {
            const response = await fetch('/api/superadmin/backup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                alert(`Backup realizado exitosamente\nArchivo: ${result.backup_info.filename}\nTamaño: ${result.backup_info.size}`);
                this.updateLastBackup();
                this.addMaintenanceLog('BACKUP_COMPLETADO', `Backup realizado: ${result.backup_info.filename}`);
            } else {
                alert(result.message || 'Error al realizar backup');
            }
        } catch (error) {
            console.error('Error performing backup:', error);
            alert('Error al realizar backup');
        }
    }

    async restartServices() {
        if (!confirm('¿Está seguro de reiniciar los servicios? Esto puede interrumpir operaciones en curso.')) {
            return;
        }

        try {
            const response = await fetch('/api/superadmin/restart-services', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                alert('Servicios reiniciados exitosamente');
                this.addMaintenanceLog('SERVICIOS_REINICIADOS', 'Servicios del sistema reiniciados');
            } else {
                alert(result.message || 'Error al reiniciar servicios');
            }
        } catch (error) {
            console.error('Error restarting services:', error);
            alert('Error al reiniciar servicios');
        }
    }

    async clearCache() {
        if (!confirm('¿Está seguro de limpiar el caché? Esto cerrará todas las sesiones activas.')) {
            return;
        }

        try {
            const response = await fetch('/api/superadmin/clear-cache', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                alert('Caché limpiado exitosamente');
                this.addMaintenanceLog('CACHE_LIMPIADO', 'Caché del sistema limpiado');
            } else {
                alert(result.message || 'Error al limpiar caché');
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
            alert('Error al limpiar caché');
        }
    }

    async emergencyStop() {
        if (!confirm('⚠️ PARADA DE EMERGENCIA ⚠️\n\n¿Está ABSOLUTAMENTE seguro? Esto detendrá TODOS los servicios del sistema inmediatamente.')) {
            return;
        }

        if (!confirm('⚠️ CONFIRMACIÓN FINAL ⚠️\n\nEsta acción no se puede deshacer. ¿Continuar?')) {
            return;
        }

        try {
            const response = await fetch('/api/superadmin/emergency-stop', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            const result = await response.json();

            if (result.success) {
                alert('⚠️ PARADA DE EMERGENCIA EJECUTADA ⚠️\n\nTodos los servicios han sido detenidos.');
                this.addMaintenanceLog('PARADA_EMERGENCIA', 'Parada de emergencia ejecutada');
            } else {
                alert(result.message || 'Error al ejecutar parada de emergencia');
            }
        } catch (error) {
            console.error('Error performing emergency stop:', error);
            alert('Error al ejecutar parada de emergencia');
        }
    }

    async loadMaintenanceLogs() {
        try {
            const response = await fetch('/api/superadmin/maintenance/logs', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderMaintenanceLogs(data.logs);
            }
        } catch (error) {
            console.error('Error loading maintenance logs:', error);
        }
    }

    renderMaintenanceLogs(logs) {
        const container = document.getElementById('maintenanceLogs');
        container.innerHTML = '';

        if (!logs || logs.length === 0) {
            container.innerHTML = '<p class="text-center">No hay registros de mantenimiento</p>';
            return;
        }

        logs.forEach(log => {
            const div = document.createElement('div');
            div.className = `log-entry ${log.level || 'info'}`;
            div.innerHTML = `
                <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                <span class="log-action">${log.action}</span>
                <span class="log-message">${log.message}</span>
            `;
            container.appendChild(div);
        });
    }

    addMaintenanceLog(action, message) {
        const container = document.getElementById('maintenanceLogs');
        const div = document.createElement('div');
        div.className = 'log-entry info';
        div.innerHTML = `
            <span class="log-time">${new Date().toLocaleString()}</span>
            <span class="log-action">${action}</span>
            <span class="log-message">${message}</span>
        `;
        container.insertBefore(div, container.firstChild);
    }

    updateLastBackup() {
        const now = new Date();
        document.getElementById('lastBackup').textContent = now.toLocaleString();
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
let superAdminMaintenance;
document.addEventListener('DOMContentLoaded', () => {
    superAdminMaintenance = new SuperAdminMaintenanceWhatever();
});