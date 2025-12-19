// ======================================================================
// !!! STEP 1: REPLACE THESE WITH YOUR ACTUAL AWS COGNITO VALUES !!!
// ======================================================================

// 1. Your Cognito Domain URL (e.g., https://tasktracker-prod-123.auth.us-east-1.amazoncognito.com)
const COGNITO_DOMAIN = 'https://ap-southeast-2dv95qplzd.auth.ap-southeast-2.amazoncognito.com'; 

// 2. Your Cognito App Client ID (Found in App Clients section of User Pool)
const CLIENT_ID = '6me62dbf8t0jqaac8fr7qkfjad'; 

// 3. Your S3 Website Endpoint (e.g., http://tasktracker-yourname-frontend.s3-website-us-east-1.amazonaws.com)
const REDIRECT_URI = 'https://master.d2s2un2lla3e9.amplifyapp.com/'; 

// ======================================================================
// !!! STEP 2: DO NOT CHANGE CODE BELOW THIS LINE !!!
// ======================================================================

// Defines the URL for the Cognito Hosted UI Login Page
// response_type=token is used for the Implicit Grant flow
const LOGIN_URL = `${COGNITO_DOMAIN}/login?response_type=token&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=openid%20email`;

// Defines the URL for logging out
const LOGOUT_URL = `${COGNITO_DOMAIN}/logout?client_id=${CLIENT_ID}&logout_uri=${REDIRECT_URI}`;

document.addEventListener('DOMContentLoaded', () => {
    const loginLink = document.getElementById('login-link');
    const logoutButton = document.getElementById('logout-button');
    const statusText = document.getElementById('status-message');
    
    // Check the URL hash for authentication tokens
    const urlHash = window.location.hash;
    
    if (urlHash.includes('id_token')) {
        // --- LOGGED IN STATE ---
        
        // Extract parameters from the hash (e.g., #id_token=...&access_token=...)
        const params = new URLSearchParams(urlHash.substring(1));
        
        const idToken = params.get('id_token');
        const accessToken = params.get('access_token');
        
        // Display success status
        statusText.classList.add('status-success');
        statusText.classList.remove('status-initial');
        statusText.innerHTML = '✅ **Logged In!** Token received. Ready to call the API.';
        
        // Hide Login link and show Logout button
        loginLink.classList.add('hidden');
        logoutButton.classList.remove('hidden');
        
        // Set the Logout button action
        logoutButton.onclick = () => {
            window.location.href = LOGOUT_URL;
        };

        // *In a real app, you would now store these tokens securely in Session/Local Storage*
        // For demonstration:
        console.log('ID Token (Proof of Identity):', idToken.substring(0, 30) + '...');
        console.log('Access Token (API Access):', accessToken.substring(0, 30) + '...');

        // Clean the URL hash for security (to prevent tokens from staying in browser history)
        history.replaceState(null, null, window.location.pathname + window.location.search);

    } else {
        // --- LOGGED OUT STATE ---
        
        // Configure the Login link to redirect to the Cognito Hosted UI
        loginLink.href = LOGIN_URL;
        logoutButton.classList.add('hidden');
        loginLink.classList.remove('hidden');
    }
});