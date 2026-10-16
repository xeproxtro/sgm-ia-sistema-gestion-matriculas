// Student Dashboard JavaScript
class StudentDashboardWhatever {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('user')) || null;
        this.token = localStorage.getItem('token') || null;
        this.currentSection = 'overview';
        this.selectedCourses = []; // Array to store selected courses for enrollment
        this.enrolledCourses = []; // Array to store already enrolled courses
        
        this.init();
    }

    init() {
        console.log('Initializing Student Dashboard...');
        console.log('Current user:', this.currentUser);
        console.log('Token exists:', !!this.token);
        
        if (!this.currentUser || !this.token) {
            console.log('No user or token, redirecting to login');
            this.redirectToLogin();
            return;
        }

        this.setupNavigation();
        this.setupEventListeners();
        this.loadStudentData();
        this.startQueueStatusPolling();
    }

    setupNavigation() {
        const menuItems = document.querySelectorAll('.sidebar-menu a');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                if (section) {
                    this.navigateToSection(section);
                }
            });
        });
    }

    setupEventListeners() {
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        document.getElementById('askAI').addEventListener('click', () => this.askAI());
        
        // Electives filters
        const electiveSearch = document.getElementById('electiveSearch');
        const electiveType = document.getElementById('electiveType');
        
        if (electiveSearch) {
            electiveSearch.addEventListener('input', () => this.filterElectives());
        }
        
        if (electiveType) {
            electiveType.addEventListener('change', () => this.filterElectives());
        }
        
        // Modal handling
        const modal = document.getElementById('otpModal');
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.closeModal(modal));
        
        // OTP form
        const otpForm = document.getElementById('enrollmentOtpForm');
        otpForm.addEventListener('submit', (e) => this.handleEnrollmentOTP(e));
        
        // Add enroll button listener
        const enrollBtn = document.getElementById('enrollButton');
        if (enrollBtn) {
            enrollBtn.addEventListener('click', () => this.startEnrollment());
        }
    }

    navigateToSection(section) {
        // Update menu active state
        document.querySelectorAll('.sidebar-menu a').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Show/hide sections
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

    async loadStudentData() {
        try {
            console.log('Loading student data...');
            console.log('Token:', this.token ? this.token.substring(0, 20) + '...' : 'none');
            
            const response = await fetch('/api/student/profile', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Student data loaded:', data);
                this.updateStudentInfo(data.student);
                this.updateStats(data.stats);
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                alert('Error al cargar datos del estudiante: ' + (errorData.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error loading student data:', error);
            alert('Error de conexión al cargar datos del estudiante');
        }
    }

    updateStudentInfo(student) {
        document.getElementById('studentName').textContent = student.name;
        document.getElementById('studentProgram').textContent = student.program;
    }

    updateStats(stats) {
        document.getElementById('totalCredits').textContent = stats.credits_completed || 0;
        document.getElementById('gpa').textContent = stats.gpa || '0.0';
        document.getElementById('currentSemester').textContent = stats.semester || 1;
        document.getElementById('pendingSubjects').textContent = stats.pending_subjects || 0;
    }

    async loadSectionData(section) {
        switch (section) {
            case 'queue':
                await this.loadQueueStatus();
                break;
            case 'enrollment':
                await this.loadAvailableSubjects();
                break;
            case 'schedule':
                await this.loadSchedule();
                break;
            case 'curriculum':
                await this.loadCurriculum();
                break;
            case 'history':
                await this.loadAcademicHistory();
                break;
            case 'electives':
                await this.loadElectives();
                break;
        }
    }

    async loadQueueStatus() {
        try {
            const response = await fetch('/api/queue/status', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateQueueStatus(data);
            }
        } catch (error) {
            console.error('Error loading queue status:', error);
        }
    }

    updateQueueStatus(queueData) {
        document.getElementById('batchNumber').textContent = queueData.batch_number || '-';
        document.getElementById('queuePosition').textContent = queueData.position_in_batch || '-';
        document.getElementById('queueStatusText').textContent = this.translateStatus(queueData.status);
        
        const progress = queueData.batch_info ? 
            ((queueData.batch_info.completed_in_batch / queueData.batch_info.total_in_batch) * 100).toFixed(0) : 0;
        
        document.getElementById('queueProgress').style.width = `${progress}%`;
        document.getElementById('queueProgressText').textContent = `${progress}%`;
    }

    translateStatus(status) {
        const statusMap = {
            'waiting': 'En espera',
            'active': 'Activo',
            'completed': 'Completado',
            'skipped': 'Saltado'
        };
        return statusMap[status] || status;
    }

    startQueueStatusPolling() {
        setInterval(() => {
            if (this.currentSection === 'queue') {
                this.loadQueueStatus();
            }
        }, 10000); // Poll every 10 seconds
    }

    async loadAvailableSubjects() {
        try {
            console.log('Loading available subjects...');
            
            // Load enrolled courses first
            const enrolledResponse = await fetch('/api/enrollment/current', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (enrolledResponse.ok) {
                const enrolledData = await enrolledResponse.json();
                this.enrolledCourses = enrolledData.enrollments || [];
                console.log('Enrolled courses:', this.enrolledCourses);
            }

            // Load available subjects
            const response = await fetch('/api/enrollment/available-subjects', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Available subjects response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Available subjects data:', data);
                this.renderAvailableSubjects(data.subjects);
            } else {
                const errorData = await response.json();
                console.error('Available subjects error:', errorData);
                document.getElementById('availableSubjects').innerHTML = '<p class="error">Error al cargar materias disponibles: ' + (errorData.message || 'Error desconocido') + '</p>';
            }
        } catch (error) {
            console.error('Error loading available subjects:', error);
            document.getElementById('availableSubjects').innerHTML = '<p class="error">Error de conexión al cargar materias disponibles</p>';
        }
    }

    renderAvailableSubjects(subjects) {
        const container = document.getElementById('availableSubjects');
        container.innerHTML = '';

        subjects.forEach(subject => {
            // Check if this course is already enrolled
            const isEnrolled = this.enrolledCourses.some(enrolled => 
                enrolled.subject_code === subject.code || 
                enrolled.course_id === subject.id
            );

            const subjectElement = document.createElement('div');
            subjectElement.className = `subject-item ${isEnrolled ? 'enrolled' : ''}`;
            
            if (isEnrolled) {
                // Render enrolled course (greyed out with overlay)
                subjectElement.innerHTML = `
                    <div class="enrolled-overlay">
                        <div class="enrolled-badge">✓ Ya Matriculada</div>
                    </div>
                    <div class="subject-checkbox disabled">
                        <input type="checkbox" id="subject-${subject.id}" value="${subject.id}" disabled checked>
                        <label for="subject-${subject.id}">Seleccionar</label>
                    </div>
                    <h4>${subject.name} (${subject.code})</h4>
                    <p>Créditos: ${subject.credits}</p>
                    <p>Grupo: ${subject.group_number}</p>
                    <p>Docente: ${subject.teacher}</p>
                    <p>Cupos: ${subject.capacity - subject.enrolled}/${subject.capacity}</p>
                `;
            } else {
                // Render available course
                subjectElement.innerHTML = `
                    <div class="subject-checkbox">
                        <input type="checkbox" id="subject-${subject.id}" value="${subject.id}" data-course="${JSON.stringify(subject)}">
                        <label for="subject-${subject.id}">Seleccionar</label>
                    </div>
                    <h4>${subject.name} (${subject.code})</h4>
                    <p>Créditos: ${subject.credits}</p>
                    <p>Grupo: ${subject.group_number}</p>
                    <p>Docente: ${subject.teacher}</p>
                    <p>Cupos: ${subject.capacity - subject.enrolled}/${subject.capacity}</p>
                `;
                
                // Add checkbox change listener
                const checkbox = subjectElement.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', (e) => this.toggleSubjectSelection(e, subject));
            }
            
            container.appendChild(subjectElement);
        });
        
        // Add enroll button if not exists
        if (!document.getElementById('enrollButton')) {
            const enrollBtn = document.createElement('button');
            enrollBtn.id = 'enrollButton';
            enrollBtn.className = 'btn btn-primary btn-block mt-3';
            enrollBtn.textContent = 'Matricular Materias Seleccionadas';
            enrollBtn.disabled = true;
            container.parentNode.appendChild(enrollBtn);
            
            enrollBtn.addEventListener('click', () => this.startEnrollment());
        }
    }

    selectSubject(subject) {
        // Toggle selection
        const element = event.currentTarget;
        element.classList.toggle('selected');
        
        // Update enrollment selection
        // This would be expanded to handle multiple selections
    }
    
    toggleSubjectSelection(e, subject) {
        const checkbox = e.target;
        if (checkbox.checked) {
            this.selectedCourses.push(subject);
        } else {
            this.selectedCourses = this.selectedCourses.filter(c => c.id !== subject.id);
        }
        
        // Enable/disable enroll button
        const enrollBtn = document.getElementById('enrollButton');
        if (enrollBtn) {
            enrollBtn.disabled = this.selectedCourses.length === 0;
            enrollBtn.textContent = this.selectedCourses.length > 0 
                ? `Matricular ${this.selectedCourses.length} Materia(s)` 
                : 'Matricular Materias Seleccionadas';
        }
    }
    
    async startEnrollment() {
        if (this.selectedCourses.length === 0) {
            alert('Por favor seleccione al menos una materia');
            return;
        }
        
        try {
            // Enroll in each selected course directly without OTP
            let successCount = 0;
            let errorCount = 0;
            let enrolledCourses = [];
            
            for (const course of this.selectedCourses) {
                const response = await fetch('/api/enrollment/enroll', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.token}`
                    },
                    body: JSON.stringify({ course_id: course.id })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        successCount++;
                        enrolledCourses.push(course);
                        // Disable the checkbox for this course
                        const checkbox = document.getElementById(`subject-${course.id}`);
                        if (checkbox) {
                            checkbox.disabled = true;
                            checkbox.checked = false;
                        }
                    } else {
                        errorCount++;
                        console.error(`Error al matricular ${course.name}:`, data.message);
                    }
                } else {
                    errorCount++;
                    const errorData = await response.json();
                    console.error(`Error al matricular ${course.name}:`, errorData.message);
                }
            }
            
            if (successCount > 0) {
                alert(`Matrícula completada exitosamente: ${successCount} materia(s) matriculada(s)${errorCount > 0 ? `, ${errorCount} con errores` : ''}`);
                this.selectedCourses = [];
                
                // Update the enroll button state
                const enrollBtn = document.getElementById('enrollButton');
                if (enrollBtn) {
                    enrollBtn.disabled = true;
                    enrollBtn.textContent = 'Matricular Materias Seleccionadas';
                }
                
                // Load the schedule
                this.loadSchedule();
            } else {
                alert('Error al matricular materias. Por favor intenta nuevamente.');
            }
        } catch (error) {
            console.error('Error starting enrollment:', error);
            alert('Error al iniciar proceso de matrícula');
        }
    }
    
    async loadSchedule() {
        try {
            console.log('Loading schedule...');
            const response = await fetch('/api/enrollment/current', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Schedule response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Schedule data:', data);
                this.renderSchedule(data.enrollments);
            } else {
                const errorData = await response.json();
                console.error('Schedule error:', errorData);
                document.getElementById('scheduleView').innerHTML = '<p class="error">Error al cargar horario: ' + (errorData.message || 'Error desconocido') + '</p>';
            }
        } catch (error) {
            console.error('Error loading schedule:', error);
            document.getElementById('scheduleView').innerHTML = '<p class="error">Error de conexión al cargar horario</p>';
        }
    }
    
    renderSchedule(enrollments) {
        const container = document.getElementById('scheduleView');
        if (!container) {
            console.error('Schedule container not found');
            return;
        }
        
        container.innerHTML = '';
        
        if (!enrollments || enrollments.length === 0) {
            container.innerHTML = '<p class="no-data">No hay materias matriculadas aún.</p>';
            return;
        }
        
        // Create schedule table
        const table = document.createElement('table');
        table.className = 'schedule-table';
        
        // Table header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Materia</th>
                <th>Código</th>
                <th>Día</th>
                <th>Hora</th>
                <th>Duración</th>
                <th>Docente</th>
                <th>Salón</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Table body
        const tbody = document.createElement('tbody');
        
        enrollments.forEach(enrollment => {
            const row = document.createElement('tr');
            
            // Parse schedule
            let scheduleText = 'No disponible';
            let day = 'No disponible';
            let time = 'No disponible';
            let duration = 'No disponible';
            
            if (enrollment.schedule) {
                try {
                    const schedule = typeof enrollment.schedule === 'string' 
                        ? JSON.parse(enrollment.schedule) 
                        : enrollment.schedule;
                    
                    if (schedule.days && schedule.times) {
                        day = schedule.days.join(', ');
                        time = schedule.times.join(', ');
                        duration = `${schedule.times.length} horas`;
                        scheduleText = `${day}: ${time}`;
                    }
                } catch (e) {
                    console.error('Error parsing schedule:', e);
                }
            }
            
            row.innerHTML = `
                <td><strong>${enrollment.subject_name || 'N/A'}</strong></td>
                <td>${enrollment.subject_code || 'N/A'}</td>
                <td>${day}</td>
                <td>${time}</td>
                <td>${duration}</td>
                <td>${enrollment.teacher || 'N/A'}</td>
                <td>${enrollment.classroom || 'N/A'}</td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        container.appendChild(table);
    }

    async askAI() {
        const query = document.getElementById('aiQuery').value;
        if (!query.trim()) {
            alert('Por favor ingresa una consulta');
            return;
        }

        // Add user message to chat
        this.addChatMessage(query, 'user');
        
        // Clear input
        document.getElementById('aiQuery').value = '';
        
        // Add loading message
        const loadingId = this.addChatMessage('Analizando tu consulta...', 'system', true);

        try {
            const response = await fetch('/api/ai/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ query })
            });

            // Remove loading message
            this.removeChatMessage(loadingId);

            console.log('AI response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('AI response data:', data);
                
                // Limpiar la respuesta de metadatos
                let cleanResponse = data.response || 'No response from AI';
                if (typeof cleanResponse === 'string') {
                    // Eliminar metadatos de seguridad u otros patrones no deseados
                    cleanResponse = cleanResponse
                        .replace(/User Safety: safe/gi, '')
                        .replace(/Safety Rating: safe/gi, '')
                        .replace(/Content Safety: safe/gi, '')
                        .trim();
                }
                
                this.addChatMessage(cleanResponse, 'system');
            } else {
                const errorData = await response.json();
                console.error('AI error response:', errorData);
                
                // Show detailed error message
                const errorMessage = errorData.error || errorData.message || 'Error desconocido';
                const errorDetails = errorData.details ? `\n\nDetalles: ${errorData.details}` : '';
                this.addChatMessage(`Error: ${errorMessage}${errorDetails}`, 'system');
            }
        } catch (error) {
            console.error('Error asking AI:', error);
            this.removeChatMessage(loadingId);
            this.addChatMessage(`Error de conexión: ${error.message}`, 'system');
        }
    }
    
    addChatMessage(content, type, isLoading = false) {
        const messagesContainer = document.getElementById('aiChatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${type}`;
        if (isLoading) {
            messageDiv.id = 'loading-' + Date.now();
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'ai-message-content';
        contentDiv.innerHTML = `<p>${content}</p>`;
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        return messageDiv.id;
    }
    
    removeChatMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.remove();
        }
    }

    async loadCurriculum() {
        try {
            console.log('Loading curriculum...');
            const response = await fetch('/api/curriculum/student', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Curriculum response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Curriculum data:', data);
                this.renderCurriculum(data.curriculum);
            } else {
                const errorData = await response.json();
                console.error('Curriculum error:', errorData);
                document.getElementById('curriculumView').innerHTML = '<p class="error">Error al cargar malla curricular: ' + (errorData.message || 'Error desconocido') + '</p>';
            }
        } catch (error) {
            console.error('Error loading curriculum:', error);
            document.getElementById('curriculumView').innerHTML = '<p class="error">Error de conexión al cargar malla curricular</p>';
        }
    }

    renderCurriculum(curriculum) {
        const container = document.getElementById('curriculumView');
        container.innerHTML = '';
        
        // Crear header de la malla curricular
        const header = document.createElement('div');
        header.className = 'curriculum-header';
        header.innerHTML = `
            <h3>Malla Curricular: ${curriculum.program}</h3>
            <p>Versión: ${curriculum.version}</p>
            <p>Créditos Totales: ${curriculum.total_credits}</p>
            ${curriculum.file_name ? `
                <div class="curriculum-file">
                    <span class="file-indicator">📎 ${curriculum.file_name}</span>
                    <button class="btn btn-info btn-sm curriculum-preview-btn" data-curriculum-id="${curriculum.id}">
                        👁️ Previsualizar
                    </button>
                </div>
            ` : ''}
        `;
        container.appendChild(header);
        
        // Add event listener for curriculum preview button
        const curriculumPreviewBtn = header.querySelector('.curriculum-preview-btn');
        if (curriculumPreviewBtn) {
            curriculumPreviewBtn.addEventListener('click', () => this.previewCurriculumFile(curriculum.id));
        }
        
        // Agrupar materias por semestre
        const subjectsBySemester = {};
        curriculum.subjects.forEach(subject => {
            if (!subjectsBySemester[subject.semester]) {
                subjectsBySemester[subject.semester] = [];
            }
            subjectsBySemester[subject.semester].push(subject);
        });
        
        // Renderizar materias por semestre
        Object.keys(subjectsBySemester).sort((a, b) => a - b).forEach(semester => {
            const semesterSection = document.createElement('div');
            semesterSection.className = 'semester-section';
            semesterSection.innerHTML = `<h4>Semestre ${semester}</h4>`;
            
            const subjectsContainer = document.createElement('div');
            subjectsContainer.className = 'subjects-container';
            
            subjectsBySemester[semester].forEach(subject => {
                const subjectCard = document.createElement('div');
                subjectCard.className = `subject-card ${subject.status}`;
                subjectCard.innerHTML = `
                    <h5>${subject.name} (${subject.code})</h5>
                    <p>Créditos: ${subject.credits}</p>
                    <p>Tipo: ${this.translateType(subject.type)}</p>
                    <p>Estado: ${this.translateStatus(subject.status)}</p>
                    ${subject.grade ? `<p>Nota: ${subject.grade}</p>` : ''}
                    ${subject.file_name ? `
                        <div class="subject-file">
                            <span class="file-indicator">📎 ${subject.file_name}</span>
                            <button class="btn btn-info btn-sm subject-preview-btn" data-subject-id="${subject.id}">
                                👁️ Previsualizar
                            </button>
                        </div>
                    ` : ''}
                `;
                subjectsContainer.appendChild(subjectCard);
                
                // Add event listener for subject preview button
                const subjectPreviewBtn = subjectCard.querySelector('.subject-preview-btn');
                if (subjectPreviewBtn) {
                    subjectPreviewBtn.addEventListener('click', () => this.previewSubjectFile(subject.id));
                }
            });
            
            semesterSection.appendChild(subjectsContainer);
            container.appendChild(semesterSection);
        });
    }
    
    translateType(type) {
        const typeMap = {
            'mandatory': 'Obligatoria',
            'elective': 'Electiva',
            'optional': 'Optativa'
        };
        return typeMap[type] || type;
    }
    
    previewCurriculumFile(curriculumId) {
        window.open(`/api/curriculum/curriculum/${curriculumId}/file`, '_blank');
    }
    
    previewSubjectFile(subjectId) {
        window.open(`/api/curriculum/subject/${subjectId}/file`, '_blank');
    }

    async loadAcademicHistory() {
        try {
            const response = await fetch('/api/student/history', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderAcademicHistory(data.history);
            }
        } catch (error) {
            console.error('Error loading academic history:', error);
        }
    }

    renderAcademicHistory(history) {
        const tbody = document.getElementById('historyTableBody');
        tbody.innerHTML = '';

        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay registros académicos disponibles</td></tr>';
            return;
        }

        history.forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.subject_code || 'N/A'}</td>
                <td>${record.subject_name || 'N/A'}</td>
                <td>${record.credits || 0}</td>
                <td>${record.semester_taken}</td>
                <td>${this.translateStatus(record.status)}</td>
                <td>${record.grade || '-'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    async loadElectives() {
        try {
            console.log('Loading electives...');
            const response = await fetch('/api/curriculum/electives', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            console.log('Electives response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('Electives data:', data);
                this.renderElectives(data.electives);
            } else {
                const errorData = await response.json();
                console.error('Electives error:', errorData);
                document.getElementById('electivesList').innerHTML = '<p class="error">Error al cargar electivas: ' + (errorData.message || 'Error desconocido') + '</p>';
            }
        } catch (error) {
            console.error('Error loading electives:', error);
            document.getElementById('electivesList').innerHTML = '<p class="error">Error de conexión al cargar electivas</p>';
        }
    }

    renderElectives(electives) {
        const container = document.getElementById('electivesList');
        container.innerHTML = '';

        electives.forEach(elective => {
            // Check if this elective is already enrolled
            const isEnrolled = this.enrolledCourses.some(enrolled => 
                enrolled.subject_code === elective.code || 
                enrolled.course_id === elective.id
            );

            const electiveElement = document.createElement('div');
            electiveElement.className = `elective-item ${isEnrolled ? 'enrolled' : ''}`;
            
            if (isEnrolled) {
                // Render enrolled elective (greyed out with overlay)
                electiveElement.innerHTML = `
                    <div class="enrolled-overlay">
                        <div class="enrolled-badge">✓ Ya Matriculada</div>
                    </div>
                    <div class="subject-checkbox disabled">
                        <input type="checkbox" id="elective-${elective.id}" value="${elective.id}" disabled checked>
                        <label for="elective-${elective.id}">Seleccionar</label>
                    </div>
                    <h4>${elective.name} (${elective.code})</h4>
                    <p>Créditos: ${elective.credits}</p>
                    <p>Tipo: ${this.translateType(elective.type)}</p>
                `;
            } else {
                // Render available elective
                electiveElement.innerHTML = `
                    <div class="subject-checkbox">
                        <input type="checkbox" id="elective-${elective.id}" value="${elective.id}" data-course="${JSON.stringify(elective)}">
                        <label for="elective-${elective.id}">Seleccionar</label>
                    </div>
                    <h4>${elective.name} (${elective.code})</h4>
                    <p>Créditos: ${elective.credits}</p>
                    <p>Tipo: ${this.translateType(elective.type)}</p>
                `;
                
                // Add checkbox change listener
                const checkbox = electiveElement.querySelector('input[type="checkbox"]');
                checkbox.addEventListener('change', (e) => this.toggleSubjectSelection(e, elective));
            }
            
            container.appendChild(electiveElement);
        });
        
        // Add enroll button for electives if not exists
        if (!document.getElementById('enrollElectivesButton')) {
            const enrollBtn = document.createElement('button');
            enrollBtn.id = 'enrollElectivesButton';
            enrollBtn.className = 'btn btn-primary btn-block mt-3';
            enrollBtn.textContent = 'Matricular Electivas Seleccionadas';
            enrollBtn.disabled = true;
            container.parentNode.appendChild(enrollBtn);
            
            enrollBtn.addEventListener('click', () => this.startEnrollment());
        }
        
        // Store electives for filtering
        this.electives = electives;
    }
    
    filterElectives() {
        const searchTerm = document.getElementById('electiveSearch').value.toLowerCase();
        const typeFilter = document.getElementById('electiveType').value;
        
        const filtered = this.electives.filter(elective => {
            const matchesSearch = elective.name.toLowerCase().includes(searchTerm) || 
                                 elective.code.toLowerCase().includes(searchTerm);
            const matchesType = typeFilter === 'all' || elective.type === typeFilter;
            return matchesSearch && matchesType;
        });
        
        this.renderElectives(filtered);
    }

    async handleEnrollmentOTP(e) {
        e.preventDefault();
        const otp = document.getElementById('enrollmentOtp').value;

        try {
            const response = await fetch('/api/enrollment/confirm-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ otp })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    alert('Matrícula confirmada exitosamente');
                    this.closeModal(document.getElementById('otpModal'));
                } else {
                    alert(data.message);
                }
            }
        } catch (error) {
            console.error('Error confirming enrollment OTP:', error);
            alert('Error al confirmar la matrícula');
        }
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

// Initialize Student Dashboard Whatever when DOM is ready
let studentDashboard;
document.addEventListener('DOMContentLoaded', () => {
    studentDashboard = new StudentDashboardWhatever();
});
