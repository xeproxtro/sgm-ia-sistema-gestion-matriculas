// Admin Curricula Management JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login.html';
        return;
    }

    // Cargar nombre del admin
    loadAdminName();
    
    // Cargar fecha actual
    loadCurrentDate();
    
    // Cargar mallas curriculares
    loadCurricula();
    
    // Event listeners
    setupEventListeners();
});

function loadAdminName() {
    fetch('/api/admin/dashboard', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('adminName').textContent = data.admin.name;
        }
    })
    .catch(error => console.error('Error loading admin data:', error));
}

function loadCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = now.toLocaleDateString('es-ES', options);
}

function loadCurricula() {
    fetch('/api/admin/curricula', {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            renderCurricula(data.curricula);
        }
    })
    .catch(error => console.error('Error loading curricula:', error));
}

function renderCurricula(curricula) {
    const grid = document.getElementById('curriculaGrid');
    grid.innerHTML = '';
    
    curricula.forEach(curriculum => {
        const card = document.createElement('div');
        card.className = 'curriculum-card';
        card.innerHTML = `
            <div class="curriculum-info">
                <h3>${curriculum.program}</h3>
                <p>Versión: ${curriculum.version}</p>
                <p>Créditos: ${curriculum.total_credits}</p>
                <p>Duración: ${curriculum.duration_semesters} semestres</p>
                ${curriculum.file_name ? `<p class="file-indicator">📎 ${curriculum.file_name}</p>` : ''}
            </div>
            <div class="curriculum-actions">
                <button class="btn btn-primary btn-sm" onclick="viewCurriculum(${curriculum.id})">Ver Detalles</button>
                <button class="btn btn-secondary btn-sm" onclick="uploadCurriculumFile(${curriculum.id})">📁 Subir Archivo</button>
                ${curriculum.file_path ? `<button class="btn btn-info btn-sm" onclick="previewCurriculumFile(${curriculum.id})">👁️ Ver Archivo</button>` : ''}
                ${curriculum.file_path ? `<button class="btn btn-danger btn-sm" onclick="deleteCurriculumFile(${curriculum.id})">🗑️ Eliminar Archivo</button>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });
}

function viewCurriculum(curriculumId) {
    // Implementar visualización de detalles de malla curricular
    console.log('View curriculum:', curriculumId);
}

function uploadCurriculumFile(curriculumId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.gif';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const formData = new FormData();
        formData.append('file', file);
        
        fetch(`/api/curriculum/curriculum/${curriculumId}/file`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Archivo cargado exitosamente');
                loadCurricula();
            } else {
                alert('Error al cargar archivo: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            alert('Error al cargar archivo');
        });
    };
    
    input.click();
}

function previewCurriculumFile(curriculumId) {
    window.open(`/api/curriculum/curriculum/${curriculumId}/file`, '_blank');
}

function deleteCurriculumFile(curriculumId) {
    if (!confirm('¿Está seguro de eliminar este archivo?')) return;
    
    fetch(`/api/curriculum/curriculum/${curriculumId}/file`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Archivo eliminado exitosamente');
            loadCurricula();
        } else {
            alert('Error al eliminar archivo: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error deleting file:', error);
        alert('Error al eliminar archivo');
    });
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
    
    // Add curriculum button
    document.getElementById('addCurriculumBtn').addEventListener('click', function() {
        // Implementar modal para agregar nueva malla curricular
        alert('Funcionalidad de agregar malla curricular pendiente de implementar');
    });
}