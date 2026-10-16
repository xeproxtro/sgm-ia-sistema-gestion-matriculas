// Super Admin Management JavaScript
class SuperAdminManagementWhatever {
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
        this.loadAdminData();
        this.updateUserInfo();
        this.updateCurrentDate();
    }

    setupEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('addAdminBtn').addEventListener('click', () => this.openAdminModal());
        document.getElementById('adminForm').addEventListener('submit', (e) => this.handleAdminSubmit(e));
        document.getElementById('closeModal').addEventListener('click', () => this.closeAdminModal());
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeAdminModal());
        document.getElementById('savePermissionsBtn')?.addEventListener('click', () => this.savePermissions());
    }

    async loadAdminData() {
        try {
            const response = await fetch('/api/superadmin/admins', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderAdminsTable(data.admins);
                this.updateAdminStats(data.admins);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }

    renderAdminsTable(admins) {
        const tbody = document.getElementById('adminsTableBody');
        tbody.innerHTML = '';

        if (admins.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay administradores registrados</td></tr>';
            return;
        }

        admins.forEach(admin => {
            const row = document.createElement('tr');
            
            // Create edit button
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-sm btn-primary';
            editBtn.textContent = 'Editar';
            editBtn.addEventListener('click', () => this.editAdmin(admin.id));
            
            // Create toggle status button
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn btn-sm btn-warning';
            toggleBtn.textContent = admin.is_active ? 'Desactivar' : 'Activar';
            toggleBtn.addEventListener('click', () => this.toggleAdminStatus(admin.id));
            
            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger';
            deleteBtn.textContent = 'Eliminar';
            deleteBtn.addEventListener('click', () => this.deleteAdmin(admin.id));
            
            // Create actions cell
            const actionsCell = document.createElement('td');
            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(toggleBtn);
            actionsCell.appendChild(deleteBtn);
            
            row.innerHTML = `
                <td>${admin.id}</td>
                <td>${admin.name}</td>
                <td>${admin.email}</td>
                <td>${admin.document_number}</td>
                <td><span class="role-badge admin">Admin</span></td>
                <td><span class="status-badge ${admin.is_active ? 'active' : 'inactive'}">${admin.is_active ? 'Activo' : 'Inactivo'}</span></td>
                <td>${admin.last_login ? new Date(admin.last_login).toLocaleString() : 'Nunca'}</td>
            `;
            row.appendChild(actionsCell);
            tbody.appendChild(row);
        });
    }

    updateAdminStats(admins) {
        const totalAdmins = admins.length;
        const activeAdmins = admins.filter(a => a.is_active).length;
        const inactiveAdmins = totalAdmins - activeAdmins;
        
        // Calculate recent logins (last 24 hours)
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentLogins = admins.filter(a => a.last_login && new Date(a.last_login) > oneDayAgo).length;

        document.getElementById('totalAdmins').textContent = totalAdmins;
        document.getElementById('activeAdmins').textContent = activeAdmins;
        document.getElementById('inactiveAdmins').textContent = inactiveAdmins;
        document.getElementById('recentLogins').textContent = recentLogins;
    }

    openAdminModal() {
        document.getElementById('adminModal').style.display = 'block';
        document.getElementById('modalTitle').textContent = 'Agregar Administrador';
        document.getElementById('adminForm').reset();
    }

    closeAdminModal() {
        document.getElementById('adminModal').style.display = 'none';
    }

    async handleAdminSubmit(e) {
        e.preventDefault();
        
        const adminData = {
            document_number: document.getElementById('documentNumber').value,
            name: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            password: document.getElementById('password').value
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

            const result = await response.json();

            if (result.success) {
                alert('Administrador agregado exitosamente');
                this.closeAdminModal();
                this.loadAdminData();
            } else {
                alert(result.message || 'Error al agregar administrador');
            }
        } catch (error) {
            console.error('Error adding admin:', error);
            alert('Error al agregar administrador');
        }
    }

    async editAdmin(adminId) {
        try {
            const response = await fetch(`/api/superadmin/admins/${adminId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const admin = data.admin;
                
                document.getElementById('documentNumber').value = admin.document_number;
                document.getElementById('fullName').value = admin.name;
                document.getElementById('email').value = admin.email;
                document.getElementById('phone').value = admin.phone;
                document.getElementById('password').value = '';
                
                document.getElementById('modalTitle').textContent = 'Editar Administrador';
                document.getElementById('adminModal').style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading admin:', error);
            alert('Error al cargar datos del administrador');
        }
    }

    async toggleAdminStatus(adminId) {
        if (!confirm('¿Está seguro de cambiar el estado de este administrador?')) {
            return;
        }

        try {
            const response = await fetch(`/api/superadmin/admins/${adminId}/toggle-status`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                this.loadAdminData();
            } else {
                alert('Error al cambiar estado del administrador');
            }
        } catch (error) {
            console.error('Error toggling admin status:', error);
            alert('Error al cambiar estado del administrador');
        }
    }

    async deleteAdmin(adminId) {
        if (!confirm('¿Está seguro de eliminar este administrador? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch(`/api/superadmin/admins/${adminId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Administrador eliminado exitosamente');
                this.loadAdminData();
            } else {
                alert('Error al eliminar administrador');
            }
        } catch (error) {
            console.error('Error deleting admin:', error);
            alert('Error al eliminar administrador');
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

            const result = await response.json();

            if (result.success) {
                alert('Permisos guardados exitosamente');
            } else {
                alert(result.message || 'Error al guardar permisos');
            }
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert('Error al guardar permisos');
        }
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
let superAdminManagement;
document.addEventListener('DOMContentLoaded', () => {
    superAdminManagement = new SuperAdminManagementWhatever();
});