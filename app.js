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

// ... (keep Step 1 Configuration as is) ...

// 1. CREATE A NEW TASK (Defaults to pending)
async function createTask(name) {
    const newTask = {
        task_id: "ID-" + Date.now(),
        user_id: "user123", 
        task_name: name,
        status: "pending" // Always starts as pending
    };

    try {
        await fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': userToken },
            body: JSON.stringify(newTask)
        });
        fetchTasks();
    } catch (err) {
        console.error("Create Error:", err);
    }
}

// 2. RENDER TASKS
function displayTasks(tasks) {
    const taskList = document.getElementById('task-list');
    taskList.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        // This line connects the status (pending/progress/done) to the CSS colors
        li.className = `task-item status-${task.status}`;
        
        li.innerHTML = `
            <div class="task-info">
                <strong>${task.task_name}</strong>
                <small>${task.status.toUpperCase()}</small>
            </div>
            <div class="task-buttons">
                <button class="edit-btn" onclick="openEditMenu('${task.task_id}', '${task.task_name}')">Edit</button>
                <button class="delete-btn" onclick="deleteTask('${task.task_id}')">Delete</button>
            </div>
        `;
        taskList.appendChild(li);
    });
}
// 3. EDIT MENU (Acts like a checklist selection)
async function openEditMenu(id, currentName) {
    // Part 1: Edit Name
    const newName = prompt("Update Task Name:", currentName);
    if (newName === null) return;

    // Part 2: Choose Status from a "List"
    const choice = prompt(
        "Select Status Number:\n1. Pending ⏳\n2. In Progress 🚧\n3. Done ✅"
    );

    let newStatus;
    if (choice === "1") newStatus = "pending";
    else if (choice === "2") newStatus = "progress";
    else if (choice === "3") newStatus = "done";
    else {
        alert("Invalid choice. Status not changed.");
        newStatus = null; 
    }

    const payload = { task_name: newName };
    if (newStatus) payload.status = newStatus;

    await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': userToken, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    fetchTasks();
}

// ... (keep delete function as is) ...

async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': userToken }
    });
    fetchTasks();
}