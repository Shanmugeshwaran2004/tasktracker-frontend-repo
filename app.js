const COGNITO_DOMAIN = 'https://ap-southeast-2dv95qplzd.auth.ap-southeast-2.amazoncognito.com'; 
const CLIENT_ID = '6me62dbf8t0jqaac8fr7qkfjad'; 
const REDIRECT_URI = 'https://master.d2s2un2lla3e9.amplifyapp.com/'; 
const API_BASE_URL = 'https://x55qeapauh.execute-api.ap-southeast-2.amazonaws.com/prod'; 

const LOGIN_URL = `${COGNITO_DOMAIN}/login?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid%20email`;
const LOGOUT_URL = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${REDIRECT_URI}`;

let userToken = null;

document.addEventListener('DOMContentLoaded', () => {
    const loginLink = document.getElementById('login-link');
    const logoutButton = document.getElementById('logout-button');
    const statusText = document.getElementById('status-message');
    const taskSection = document.getElementById('task-section'); 
    const addButton = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('task-input');

    const urlHash = window.location.hash;
    
    if (urlHash.includes('id_token')) {
        const params = new URLSearchParams(urlHash.substring(1));
        userToken = params.get('id_token'); 
        statusText.innerHTML = '✅ **Logged In!**';
        
        loginLink.classList.add('hidden');
        logoutButton.classList.remove('hidden');
        if (taskSection) taskSection.classList.remove('hidden');

        fetchTasks();

        addButton.onclick = async () => {
            const name = taskInput.value.trim();
            if (!name) return alert("Please enter a task name");
            await createTask(name);
            taskInput.value = ""; 
        };

        logoutButton.onclick = () => { window.location.href = LOGOUT_URL; };
        history.replaceState(null, null, window.location.pathname + window.location.search);
    } else {
        loginLink.href = LOGIN_URL;
        logoutButton.classList.add('hidden');
        if (taskSection) taskSection.classList.add('hidden');
        loginLink.classList.remove('hidden');
    }
});

async function fetchTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: { 'Authorization': userToken }
        });
        const tasks = await response.json();
        displayTasks(tasks);
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

async function createTask(name) {
    const newTask = {
        task_id: "ID-" + Date.now(),
        user_id: "user123", 
        task_name: name,
        status: "pending" 
    };
    await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': userToken },
        body: JSON.stringify(newTask)
    });
    fetchTasks();
}

function displayTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item status-${task.status}`;
        
        li.innerHTML = `
            <div class="task-info">
                <strong>${task.task_name}</strong> <small>(${task.status})</small>
            </div>
            <div class="task-buttons">
                <button class="edit-btn" onclick="openEditModal('${task.task_id}', '${task.task_name}', '${task.status}')">Edit</button>
                <button class="delete-btn" onclick="deleteTask('${task.task_id}')">Delete</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}

// THE NEW EDIT PROCESS
async function openEditModal(id, currentName, currentStatus) {
    const newName = prompt("Edit Task Name:", currentName);
    if (newName === null) return; // Cancelled

    const newStatus = prompt("Edit Status (pending, progress, done):", currentStatus);
    if (newStatus === null) return; // Cancelled

    const payload = { task_name: newName, status: newStatus.toLowerCase() };

    await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': userToken, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    fetchTasks();
}

async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': userToken }
    });
    fetchTasks();
}