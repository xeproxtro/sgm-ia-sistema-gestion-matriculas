// Admin Dashboard JavaScript
class AdminDashboardWhatever {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('user')) || null;
        this.token = localStorage.getItem('token') || null;
        this.currentSection = 'overview';
        
        this.init();
    }

    init() {
        if (!this.currentUser || !this.token || this.currentUser.role !== 'admin') {
            this.redirectToLogin();
            return;
        }

        this.setupNavigation();
        this.setupEventListeners();
        this.loadAdminData();
        this.startMonitoringPolling();
    }

    setupNavigation() {
        const menuItems = document.querySelectorAll('.sidebar-menu a');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateToSection(section);
            });
        });
    }

    setupEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Quick actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Student management
        document.getElementById('addStudentBtn')?.addEventListener('click', () => this.openStudentModal());
        document.getElementById('studentForm')?.addEventListener('submit', (e) => this.handleStudentSubmit(e));

        // Queue management
        document.getElementById('startQueueBtn')?.addEventListener('click', () => this.startQueue());
        document.getElementById('stopQueueBtn')?.addEventListener('click', () => this.stopQueue());
        document.getElementById('resetQueueBtn')?.addEventListener('click', () => this.resetQueue());

        // Reports
        document.getElementById('generateReportBtn')?.addEventListener('click', () => this.generateReport());

        // Maintenance toggle
        document.getElementById('maintenanceMode')?.addEventListener('change', (e) => {
            this.toggleMaintenanceMode(e.target.checked);
        });

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

    async loadAdminData() {
        try {
            const response = await fetch('/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateAdminInfo(data.admin);
                this.updateDashboardStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        }
    }

    updateAdminInfo(admin) {
        document.getElementById('adminName').textContent = admin.name;
    }

    updateDashboardStats(stats) {
        document.getElementById('totalStudents').textContent = stats.total_students || 0;
        document.getElementById('totalInQueue').textContent = stats.total_in_queue || 0;
        document.getElementById('activeStudents').textContent = stats.active_students || 0;
        document.getElementById('enrolledStudents').textContent = stats.enrolled_students || 0;
    }

    async loadSectionData(section) {
        switch (section) {
            case 'students':
                await this.loadStudents();
                break;
            case 'curricula':
                await this.loadCurricula();
                break;
            case 'courses':
                await this.loadCourses();
                break;
            case 'queue-management':
                await this.loadQueueData();
                break;
            case 'reports':
                // Reports section loads on demand
                break;
            case 'monitoring':
                await this.loadMonitoringData();
                break;
        }
    }

    async loadStudents() {
        try {
            const response = await fetch('/api/admin/students', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderStudentsTable(data.students);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    }

    renderStudentsTable(students) {
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '';

        students.forEach(student => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.student_code}</td>
                <td>${student.name}</td>
                <td>${student.program}</td>
                <td>${student.semester}</td>
                <td><span class="status-badge ${student.academic_status}">${this.translateStatus(student.academic_status)}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="this.editStudent(${student.id})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="this.deleteStudent(${student.id})">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadCurricula() {
        try {
            const response = await fetch('/api/admin/curricula', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderCurriculaList(data.curricula);
            }
        } catch (error) {
            console.error('Error loading curricula:', error);
        }
    }

    renderCurriculaList(curricula) {
        const container = document.getElementById('curriculaList');
        container.innerHTML = '';

        curricula.forEach(curriculum => {
            const curriculumElement = document.createElement('div');
            curriculumElement.className = 'card';
            curriculumElement.innerHTML = `
                <h4>${curriculum.program} - Versión ${curriculum.version}</h4>
                <p>Créditos totales: ${curriculum.total_credits}</p>
                <p>Duración: ${curriculum.duration_semesters} semestres</p>
                <button class="btn btn-sm btn-primary">Ver Detalles</button>
            `;
            container.appendChild(curriculumElement);
        });
    }

    async loadCourses() {
        try {
            const response = await fetch('/api/admin/courses', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderCoursesTable(data.courses);
            }
        } catch (error) {
            console.error('Error loading courses:', error);
        }
    }

    renderCoursesTable(courses) {
        const tbody = document.getElementById('coursesTableBody');
        tbody.innerHTML = '';

        courses.forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.subject_code}</td>
                <td>${course.subject_name}</td>
                <td>${course.group_number}</td>
                <td>${course.teacher}</td>
                <td>${course.capacity}</td>
                <td>${course.enrolled}</td>
                <td><span class="status-badge ${course.is_available ? 'available' : 'unavailable'}">${course.is_available ? 'Disponible' : 'No disponible'}</span></td>
                <td>
                    <button class="btn btn-sm btn-primary">Editar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadQueueData() {
        try {
            const response = await fetch('/api/admin/queue', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateQueueStatistics(data.statistics);
                this.renderQueueTable(data.queue);
            }
        } catch (error) {
            console.error('Error loading queue data:', error);
        }
    }

    updateQueueStatistics(stats) {
        document.getElementById('currentBatch').textContent = stats.current_batch || 1;
        document.getElementById('waitingCount').textContent = stats.total_waiting || 0;
        document.getElementById('activeCount').textContent = stats.total_active || 0;
        document.getElementById('completedCount').textContent = stats.total_completed || 0;
    }

    renderQueueTable(queue) {
        const tbody = document.getElementById('queueTableBody');
        tbody.innerHTML = '';

        queue.forEach(entry => {
            const row = document.createElement('tr');
            const waitTime = this.calculateWaitTime(entry.entered_at);
            
            row.innerHTML = `
                <td>${entry.student_name}</td>
                <td>${entry.batch_number}</td>
                <td>${entry.position_in_batch}</td>
                <td><span class="status-badge ${entry.status}">${this.translateStatus(entry.status)}</span></td>
                <td>${waitTime}</td>
                <td>
                    <button class="btn btn-sm btn-success" onclick="this.activateQueueEntry(${entry.id})">Activar</button>
                    <button class="btn btn-sm btn-warning" onclick="this.skipQueueEntry(${entry.id})">Saltar</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    calculateWaitTime(enteredAt) {
        const now = new Date();
        const entered = new Date(enteredAt);
        const diff = now - entered;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }

    async loadMonitoringData() {
        try {
            const response = await fetch('/api/admin/monitoring', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateMonitoringMetrics(data.metrics);
                this.updateSystemLogs(data.logs);
            }
        } catch (error) {
            console.error('Error loading monitoring data:', error);
        }
    }

    updateMonitoringMetrics(metrics) {
        document.getElementById('serverLoad').textContent = `${metrics.server_load}%`;
        document.getElementById('serverLoadBar').style.width = `${metrics.server_load}%`;
        
        document.getElementById('memoryUsage').textContent = `${metrics.memory_usage} MB`;
        document.getElementById('memoryBar').style.width = `${(metrics.memory_usage / metrics.memory_total) * 100}%`;
        
        document.getElementById('concurrency').textContent = `${metrics.concurrent_users} usuarios`;
        document.getElementById('concurrencyBar').style.width = `${(metrics.concurrent_users / metrics.max_concurrent) * 100}%`;
        
        document.getElementById('responseTime').textContent = `${metrics.response_time} ms`;
        document.getElementById('responseTimeBar').style.width = `${Math.min(metrics.response_time / 10, 100)}%`;
    }

    updateSystemLogs(logs) {
        const container = document.getElementById('systemLogs');
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

    handleQuickAction(action) {
        switch (action) {
            case 'add-student':
                this.openStudentModal();
                break;
            case 'view-queue':
                this.navigateToSection('queue-management');
                break;
            case 'generate-report':
                this.navigateToSection('reports');
                break;
        }
    }

    openStudentModal() {
        const modal = document.getElementById('studentModal');
        modal.style.display = 'block';
    }

    async handleStudentSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const studentData = {
            document_number: formData.get('studentDocument'),
            name: formData.get('studentName'),
            email: formData.get('studentEmail'),
            phone: formData.get('studentPhone'),
            program: formData.get('studentProgram'),
            semester: parseInt(formData.get('studentSemester')),
            password: formData.get('studentPassword')
        };

        try {
            const response = await fetch('/api/admin/students', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(studentData)
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert('Estudiante agregado exitosamente');
                    this.closeModal(document.getElementById('studentModal'));
                    this.loadStudents();
                } else {
                    alert(data.message);
                }
            }
        } catch (error) {
            console.error('Error adding student:', error);
            alert('Error al agregar estudiante');
        }
    }

    async startQueue() {
        try {
            const response = await fetch('/api/admin/queue/start', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Cola iniciada exitosamente');
                this.loadQueueData();
            }
        } catch (error) {
            console.error('Error starting queue:', error);
            alert('Error al iniciar la cola');
        }
    }

    async stopQueue() {
        try {
            const response = await fetch('/api/admin/queue/stop', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Cola detenida exitosamente');
                this.loadQueueData();
            }
        } catch (error) {
            console.error('Error stopping queue:', error);
            alert('Error al detener la cola');
        }
    }

    async resetQueue() {
        if (!confirm('¿Está seguro de reiniciar la cola? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/queue/reset', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                alert('Cola reiniciada exitosamente');
                this.loadQueueData();
            }
        } catch (error) {
            console.error('Error resetting queue:', error);
            alert('Error al reiniciar la cola');
        }
    }

    async generateReport() {
        const reportType = document.getElementById('reportType').value;
        const period = document.getElementById('reportPeriod').value;

        try {
            const response = await fetch('/api/admin/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ type: reportType, period })
            });

            if (response.ok) {
                const data = await response.json();
                this.renderReportResults(data.report);
            }
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Error al generar reporte');
        }
    }

    renderReportResults(report) {
        const container = document.getElementById('reportResults');
        container.innerHTML = `<pre>${JSON.stringify(report, null, 2)}</pre>`;
    }

    async toggleMaintenanceMode(enabled) {
        try {
            const response = await fetch('/api/admin/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ enabled })
            });

            if (response.ok) {
                const data = await response.json();
                alert(data.message);
            }
        } catch (error) {
            console.error('Error toggling maintenance mode:', error);
            alert('Error al cambiar modo de mantenimiento');
        }
    }

    startMonitoringPolling() {
        setInterval(() => {
            if (this.currentSection === 'monitoring') {
                this.loadMonitoringData();
            }
        }, 5000); // Poll every 5 seconds
    }

    openModal(modal) {
        modal.style.display = 'block';
    }

    closeModal(modal) {
        modal.style.display = 'none';
    }

    translateStatus(status) {
        const statusMap = {
            'active': 'Activo',
            'suspended': 'Suspendido',
            'graduated': 'Graduado',
            'withdrawn': 'Retirado',
            'waiting': 'En espera',
            'active_queue': 'Activo',
            'completed': 'Completado',
            'skipped': 'Saltado',
            'available': 'Disponible',
            'unavailable': 'No disponible'
        };
        return statusMap[status] || status;
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

// Initialize Admin Dashboard Whatever when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new AdminDashboardWhatever();
});
