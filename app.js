// ======================================================================
// !!! STEP 1: CONFIGURATION !!!
// ======================================================================

// 1. Your Cognito Details (Already Provided)
const COGNITO_DOMAIN = 'https://ap-southeast-2dv95qplzd.auth.ap-southeast-2.amazoncognito.com'; 
const CLIENT_ID = '6me62dbf8t0jqaac8fr7qkfjad'; 
const REDIRECT_URI = 'https://master.d2s2un2lla3e9.amplifyapp.com/'; 

// 2. YOUR API GATEWAY URL (Paste your Invoke URL here)
// Example: 'https://abc123xyz.execute-api.ap-southeast-2.amazonaws.com/prod'
const API_BASE_URL = 'https://x55qeapauh.execute-api.ap-southeast-2.amazonaws.com/prod'; 

// ======================================================================
// !!! STEP 2: AUTHENTICATION HELPERS !!!
// ======================================================================

const LOGIN_URL = `${COGNITO_DOMAIN}/login?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid%20email`;
const LOGOUT_URL = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${REDIRECT_URI}`;

// Global variable to store the token for API calls
let userToken = null;

document.addEventListener('DOMContentLoaded', () => {
    const loginLink = document.getElementById('login-link');
    const logoutButton = document.getElementById('logout-button');
    const statusText = document.getElementById('status-message');
    const taskSection = document.getElementById('task-section'); // Make sure this exists in HTML
    const addButton = document.getElementById('add-task-btn');
    const taskInput = document.getElementById('task-input');

    // Check the URL hash for authentication tokens
    const urlHash = window.location.hash;
    
    if (urlHash.includes('id_token')) {
        // --- LOGGED IN STATE ---
        const params = new URLSearchParams(urlHash.substring(1));
        userToken = params.get('id_token'); // Capture the token
        
        statusText.innerHTML = '✅ **Logged In!** Fetching your tasks...';
        
        // UI Toggles
        loginLink.classList.add('hidden');
        logoutButton.classList.remove('hidden');
        if (taskSection) taskSection.classList.remove('hidden');

        // Load initial data
        fetchTasks();

        // Handle Add Task Button
        if (addButton) {
            addButton.onclick = async () => {
                const name = taskInput.value.trim();
                if (!name) return alert("Please enter a task name");
                await createTask(name);
                taskInput.value = ""; // Clear input after adding
            };
        }

        logoutButton.onclick = () => { window.location.href = LOGOUT_URL; };

        // Clean URL for security
        history.replaceState(null, null, window.location.pathname + window.location.search);

    } else {
        // --- LOGGED OUT STATE ---
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
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    try {
        const response = await fetch(`${API_BASE_URL}/tasks`, {
            method: 'GET',
            headers: { 
                'Authorization': userToken // Sending token for future Authorizer setup
            }
        });

        if (!response.ok) throw new Error("Failed to fetch tasks");

        const tasks = await response.json();
        
        // Render tasks to the screen
        if (tasks.length === 0) {
            taskList.innerHTML = "<li>No tasks found. Add one above!</li>";
        } else {
            taskList.innerHTML = tasks.map(t => `
                <li class="task-item">
                    <span><strong>${t.task_name}</strong> (${t.status})</span>
                    <button onclick="deleteTask('${t.task_id}')" class="delete-btn">Delete</button>
                </li>
            `).join('');
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        document.getElementById('status-message').innerHTML = "❌ Error loading tasks.";
    }
}

// 2. CREATE A NEW TASK (POST)
async function createTask(name) {
    const newTask = {
        task_id: "ID-" + Date.now(), // Generate a unique ID based on timestamp
        user_id: "user123",          // In a real app, this comes from the token
        task_name: name
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
            fetchTasks(); // Refresh list immediately
        } else {
            alert("Failed to save task.");
        }
    } catch (err) {
        console.error("Create Error:", err);
    }
}

// 3. DELETE A TASK
async function deleteTask(id) {
    if (!confirm("Are you sure?")) return;

    try {
        // Note: Using your sibling layout /prod/{id}
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': userToken }
        });

        if (response.ok) {
            fetchTasks(); // Refresh list
        }
    } catch (err) {
        console.error("Delete Error:", err);
    }
}