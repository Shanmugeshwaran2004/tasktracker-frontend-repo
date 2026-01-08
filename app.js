// ======================================================================
// !!! STEP 1: CONFIGURATION !!!
// ======================================================================

const COGNITO_DOMAIN = 'https://ap-southeast-2dv95qplzd.auth.ap-southeast-2.amazoncognito.com'; 
const CLIENT_ID = '6me62dbf8t0jqaac8fr7qkfjad'; 
const REDIRECT_URI = 'https://master.d2s2un2lla3e9.amplifyapp.com/'; 
const API_BASE_URL = 'https://x55qeapauh.execute-api.ap-southeast-2.amazonaws.com/prod'; 

// ======================================================================
// !!! STEP 2: AUTHENTICATION HELPERS !!!
// ======================================================================

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
    const initialStatusSelect = document.getElementById('initial-status-select'); // New Dropdown

    const urlHash = window.location.hash;
    
    if (urlHash.includes('id_token')) {
        const params = new URLSearchParams(urlHash.substring(1));
        userToken = params.get('id_token'); 
        
        statusText.innerHTML = '✅ **Logged In!** Fetching your tasks...';
        
        loginLink.classList.add('hidden');
        logoutButton.classList.remove('hidden');
        if (taskSection) taskSection.classList.remove('hidden');

        fetchTasks();

        if (addButton) {
            addButton.onclick = async () => {
                const name = taskInput.value.trim();
                const status = initialStatusSelect.value; // Get selected status
                
                if (!name) return alert("Please enter a task name");
                
                await createTask(name, status);
                taskInput.value = ""; 
            };
        }

        logoutButton.onclick = () => { window.location.href = LOGOUT_URL; };
        history.replaceState(null, null, window.location.pathname + window.location.search);

    } else {
        loginLink.href = LOGIN_URL;
        logoutButton.classList.add('hidden');
        if (taskSection) taskSection.classList.add('hidden');
        loginLink.classList.remove('hidden');
    }
});

// ======================================================================
// !!! STEP 3: API INTERACTION FUNCTIONS !!!
// ======================================================================

// 1. GET ALL TASKS
async function fetchTasks() {
    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: { 'Authorization': userToken }
        });

        if (!response.ok) throw new Error("Failed to fetch tasks");

        const tasks = await response.json();
        displayTasks(tasks); 
        
    } catch (err) {
        console.error("Fetch Error:", err);
        document.getElementById('status-message').innerHTML = "❌ Error loading tasks.";
    }
}

// 2. CREATE A NEW TASK (POST) - Now includes Status
async function createTask(name, status) {
    const newTask = {
        task_id: "ID-" + Date.now(),
        user_id: "user123", 
        task_name: name,
        status: status // Uses the value from the top dropdown
    };

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': userToken 
            },
            body: JSON.stringify(newTask)
        });

        if (response.ok) {
            fetchTasks(); 
        } else {
            alert("Failed to save task.");
        }
    } catch (err) {
        console.error("Create Error:", err);
    }
}

// 3. RENDER TASKS (Interactive list with rewrite and status change)
function displayTasks(tasks) {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    if (tasks.length === 0) {
        taskList.innerHTML = "<li>No tasks found. Add one above!</li>";
        return;
    }

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item status-${task.status}`;
        
        li.innerHTML = `
            <div class="task-content">
                <input type="text" class="edit-input" value="${task.task_name}" 
                    onchange="updateTask('${task.task_id}', this.value, null)" />
                
                <select class="status-select" onchange="updateTask('${task.task_id}', null, this.value)">
                    <option value="pending" ${task.status === 'pending' ? 'selected' : ''}>⏳ Pending</option>
                    <option value="progress" ${task.status === 'progress' ? 'selected' : ''}>🚧 In Progress</option>
                    <option value="done" ${task.status === 'done' ? 'selected' : ''}>✅ Done</option>
                </select>
            </div>
            <button class="delete-btn" onclick="deleteTask('${task.task_id}')">Delete</button>
        `;
        taskList.appendChild(li);
    });
}

// 4. UPDATE TASK (PATCH) - Handles both text edits and status changes
async function updateTask(taskId, newName, newStatus) {
    const payload = {};
    if (newName !== null) payload.task_name = newName;
    if (newStatus !== null) payload.status = newStatus;

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': userToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            fetchTasks(); // Refresh to update visuals (like colors)
        }
    } catch (err) {
        console.error("Update failed", err);
    }
}

// 5. DELETE A TASK
async function deleteTask(id) {
    if (!confirm("Are you sure?")) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': userToken }
        });

        if (response.ok) {
            fetchTasks(); 
        }
    } catch (err) {
        console.error("Delete Error:", err);
    }
}