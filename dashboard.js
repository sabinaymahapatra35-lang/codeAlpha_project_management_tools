document.addEventListener('DOMContentLoaded', () => {
    checkAuth(true);

    const user = JSON.parse(localStorage.getItem('pm_user') || '{}');
    if (user.name) {
        document.getElementById('user-greeting').textContent = `Hello, ${user.name}`;
    }

    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Create Project Form
    document.getElementById('create-project-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('project-name').value;
        const description = document.getElementById('project-desc').value;
        const errorDiv = document.getElementById('project-error');
        
        try {
            await apiRequest('/projects', 'POST', { name, description });
            closeModal('create-project-modal');
            document.getElementById('create-project-form').reset();
            loadProjects();
        } catch (err) {
            errorDiv.textContent = err.message;
        }
    });

    // Close Modals on click outside
    document.getElementById('modal-backdrop').addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
        document.getElementById('modal-backdrop').classList.add('hidden');
    });

    loadProjects();
});

async function loadProjects() {
    const container = document.getElementById('projects-container');
    container.innerHTML = '<div class="loading-spinner"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>';
    
    try {
        const data = await apiRequest('/projects');
        
        container.innerHTML = '';
        if (data.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted)">You don\'t have any projects yet. Create one to get started!</p>';
            return;
        }

        data.forEach(project => {
            const card = document.createElement('div');
            card.className = 'project-card';
            card.onclick = () => window.location.href = `project.html?id=${project._id}`;
            
            const date = new Date(project.createdAt).toLocaleDateString();
            
            card.innerHTML = `
                <h3>${project.name}</h3>
                <p>${project.description || 'No description provided.'}</p>
                <div class="project-meta">
                    <span><i class="fa-regular fa-user"></i> ${project.members.length} Members</span>
                    <span><i class="fa-regular fa-calendar"></i> ${date}</span>
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        container.innerHTML = `<p style="color: var(--danger)">Failed to load projects: ${err.message}</p>`;
    }
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    document.getElementById('modal-backdrop').classList.remove('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById('modal-backdrop').classList.add('hidden');
}
