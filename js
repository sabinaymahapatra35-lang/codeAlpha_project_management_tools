const API_URL = 'http://localhost:5000/api';

// Set token
function setToken(token) {
    localStorage.setItem('pm_token', token);
}

// Get token
function getToken() {
    return localStorage.getItem('pm_token');
}

// Clear token
function logout() {
    localStorage.removeItem('pm_token');
    localStorage.removeItem('pm_user');
    window.location.href = 'index.html';
}

// Generic API request function
async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function checkAuth(isRequired = true) {
    const token = getToken();
    const currentPage = window.location.pathname.split('/').pop();
    
    if (isRequired && !token) {
        window.location.href = 'index.html';
    }
    
    if (!isRequired && token && (currentPage === 'index.html' || currentPage === '')) {
        window.location.href = 'dashboard.html';
    }
}
