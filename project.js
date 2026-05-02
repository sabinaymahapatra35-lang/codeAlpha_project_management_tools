let socket;
let projectId;
let currentBoards = [];
let assignableUsers = [];
let user;

document.addEventListener('DOMContentLoaded', () => {
    checkAuth(true);

    const urlParams = new URLSearchParams(window.location.search);
    projectId = urlParams.get('id');
    if (!projectId) {
        window.location.href = 'dashboard.html';
        return;
    }

    user = JSON.parse(localStorage.getItem('pm_user') || '{}');
    document.getElementById('user-avatar').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;

    // Init Socket
    socket = io('http://localhost:5000');
    socket.emit('join', user.id);

    // Socket Handlers
    socket.on('task_updated', (data) => {
        if (data.projectId === projectId) {
            loadBoard(); // Reload board on update
        }
    });

    socket.on('notification', (data) => {
        addNotification(data.message, new Date());
    });

    socket.on('comment_added', (data) => {
        const taskId = document.getElementById('task-id').value;
        if (taskId === data.taskId) {
            appendComment(data);
        }
    });

    // Form Event Listeners
    document.getElementById('board-form').addEventListener('submit', createBoard);
    document.getElementById('task-form').addEventListener('submit', saveTask);
    document.getElementById('comment-form').addEventListener('submit', addComment);

    document.getElementById('modal-backdrop').addEventListener('click', closeAllModals);

    // Notifications toggle
    document.getElementById('notifications-dropdown').addEventListener('click', (e) => {
        if (e.target.closest('.dropdown-menu')) return; // Ignore clicks inside menu
        document.getElementById('notifications-list').classList.toggle('hidden');
    });

    loadProjectDetails();
    loadUsers();
    loadBoard();
});

async function loadProjectDetails() {
    try {
        const project = await apiRequest(`/projects/${projectId}`);
        document.getElementById('board-project-title').textContent = project.name;
    } catch (err) {
        alert('Failed to load project details');
    }
}

async function loadUsers() {
    try {
        assignableUsers = await apiRequest('/auth/users');
        const select = document.getElementById('task-assignee');
        assignableUsers.forEach(u => {
            select.innerHTML += `<option value="${u._id}">${u.name}</option>`;
        });
    } catch (err) {
        console.error('Failed to load users', err);
    }
}

async function loadBoard() {
    const kanban = document.getElementById('kanban-board');
    try {
        const boardsData = await apiRequest(`/projects/${projectId}/boards`);
        const tasksData = await apiRequest(`/projects/${projectId}/tasks`);
        
        currentBoards = boardsData;
        
        kanban.innerHTML = '';
        
        boardsData.forEach(board => {
            const col = document.createElement('div');
            col.className = 'kanban-col';
            col.dataset.id = board._id;

            const tasksForBoard = tasksData.filter(t => t.boardId === board._id);

            col.innerHTML = `
                <div class="kanban-col-header">
                    <h3>${board.name} <span class="task-count">${tasksForBoard.length}</span></h3>
                </div>
                <div class="kanban-tasks" id="board-${board._id}">
                    ${tasksForBoard.map(createTaskHTML).join('')}
                </div>
                <div class="kanban-col-footer">
                    <button class="add-task-btn" onclick="openTaskModal('${board._id}')">
                        <i class="fa-solid fa-plus"></i> Add Task
                    </button>
                </div>
            `;
            kanban.appendChild(col);

            // Initialize Sortable
            new Sortable(col.querySelector('.kanban-tasks'), {
                group: 'kanban',
                animation: 150,
                ghostClass: 'sortable-ghost',
                onEnd: async function (evt) {
                    const taskId = evt.item.dataset.id;
                    const toBoardId = evt.to.id.replace('board-', '');
                    
                    try {
                        const token = getToken();
                        await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ boardId: toBoardId })
                        });
                        
                        // Notify others
                        socket.emit('task_moved', { projectId, taskId, toBoardId });
                        loadBoard(); // Reload to update counts
                    } catch(e) {
                        console.error('Failed to move task');
                        loadBoard(); // Revert on failure
                    }
                }
            });
        });

        const addColBtn = document.createElement('div');
        addColBtn.className = 'add-col-btn';
        addColBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Column';
        addColBtn.onclick = () => openModal('board-modal');
        kanban.appendChild(addColBtn);

    } catch (err) {
        kanban.innerHTML = `<p style="color: var(--danger)">Failed to load board: ${err.message}</p>`;
    }
}

function createTaskHTML(task) {
    const dateStr = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '';
    const labelClass = `label-${task.priority.toLowerCase()}`;
    const assigneeName = task.assignedTo ? task.assignedTo.name : 'Unassigned';
    
    return `
        <div class="task-card" data-id="${task._id}" onclick="viewTaskDetails('${task._id}')">
            <div class="task-labels">
                <span class="label ${labelClass}">${task.priority}</span>
            </div>
            <h4>${task.title}</h4>
            <div class="task-desc">${task.description || ''}</div>
            <div class="task-meta">
                <span><i class="fa-regular fa-calendar"></i> ${dateStr}</span>
                <span title="${assigneeName}"><i class="fa-regular fa-user"></i></span>
            </div>
        </div>
    `;
}

async function createBoard(e) {
    e.preventDefault();
    const name = document.getElementById('board-name').value;
    try {
        await apiRequest(`/projects/${projectId}/boards`, 'POST', { name });
        closeAllModals();
        loadBoard();
    } catch(err) {
        alert(err.message);
    }
}

function openTaskModal(boardId, task = null) {
    document.getElementById('task-form').reset();
    document.getElementById('task-board-id').value = boardId;
    document.getElementById('task-id').value = '';
    
    document.getElementById('comments-section').style.display = 'none';

    if (task) {
        document.getElementById('task-modal-title').textContent = 'Edit Task';
        document.getElementById('task-id').value = task._id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-desc').value = task.description || '';
        document.getElementById('task-assignee').value = task.assignedTo ? task.assignedTo._id : '';
        document.getElementById('task-priority').value = task.priority;
        if (task.dueDate) {
            document.getElementById('task-due').value = task.dueDate.split('T')[0];
        }
        
        document.getElementById('comments-section').style.display = 'flex';
        loadComments(task._id);
    } else {
        document.getElementById('task-modal-title').textContent = 'New Task';
    }

    openModal('task-modal');
}

async function viewTaskDetails(taskId) {
    try {
        // Find task from loaded data (we can optimize by fetching single task if needed)
        const tasksData = await apiRequest(`/projects/${projectId}/tasks`);
        const task = tasksData.find(t => t._id === taskId);
        if (task) openTaskModal(task.boardId, task);
    } catch (err) {
        console.error(err);
    }
}

async function saveTask(e) {
    e.preventDefault();
    const taskId = document.getElementById('task-id').value;
    const boardId = document.getElementById('task-board-id').value;
    const data = {
        title: document.getElementById('task-title').value,
        description: document.getElementById('task-desc').value,
        assignedTo: document.getElementById('task-assignee').value || null,
        priority: document.getElementById('task-priority').value,
        dueDate: document.getElementById('task-due').value || null,
        projectId: projectId
    };

    try {
        if (taskId) {
            await apiRequest(`/tasks/${taskId}`, 'PUT', data);
        } else {
            data.boardId = boardId;
            await apiRequest('/tasks', 'POST', data);
        }
        
        socket.emit('task_moved', { projectId }); // Generic notify board changed
        closeAllModals();
        loadBoard();
    } catch (err) {
        alert(err.message);
    }
}

async function loadComments(taskId) {
    const list = document.getElementById('comments-list');
    list.innerHTML = 'Loading comments...';
    try {
        const comments = await apiRequest(`/tasks/${taskId}/comments`);
        list.innerHTML = '';
        comments.forEach(appendComment);
    } catch(err) {
        list.innerHTML = 'Failed to load comments';
    }
}

async function addComment(e) {
    e.preventDefault();
    const taskId = document.getElementById('task-id').value;
    const text = document.getElementById('comment-input').value;
    if(!taskId || !text) return;

    try {
        const _comment = await apiRequest(`/tasks/${taskId}/comments`, 'POST', { text });
        // Socket event covers appending
        document.getElementById('comment-input').value = '';
    } catch (err) {
        alert(err.message);
    }
}

function appendComment(comment) {
    const list = document.getElementById('comments-list');
    const date = new Date(comment.createdAt).toLocaleString();
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML = `
        <h5>${comment.userId.name} <span style="font-size:0.7rem; color: #888">${date}</span></h5>
        <p>${comment.text}</p>
    `;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
}

function addNotification(msg, date) {
    const badge = document.getElementById('noti-badge');
    const list = document.getElementById('notifications-list');
    
    badge.style.display = 'block';
    badge.textContent = parseInt(badge.textContent) + 1;
    
    const div = document.createElement('div');
    div.className = 'noti-item';
    div.innerHTML = `
        ${msg}
        <span class="noti-time">${new Date(date).toLocaleString()}</span>
    `;
    list.prepend(div);
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    document.getElementById('modal-backdrop').classList.remove('hidden');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('modal-backdrop').classList.add('hidden');
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById('modal-backdrop').classList.add('hidden');
}
