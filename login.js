// Point this at your coworker's backend endpoint.
const LOGIN_ENDPOINT = 'http://localhost:3000/api/login';

const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const rememberInput = document.getElementById('remember');
const submitBtn = document.getElementById('submitBtn');
const status = document.getElementById('status');

function setStatus(message, kind) {
    status.textContent = message;
    status.classList.remove('error', 'success');
    if (kind) status.classList.add(kind);
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
        setStatus('Please enter both username and password.', 'error');
        return;
    }

    submitBtn.disabled = true;
    setStatus('Signing in...', null);

    try {
        const response = await fetch(LOGIN_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username,
                password,
                remember: rememberInput.checked,
            }),
        });

        let data = null;
        try {
            data = await response.json();
        } catch {
            // backend may return empty body or non-JSON
        }

        if (response.ok) {
            setStatus(data?.message || 'Logged in successfully.', 'success');
            if (data?.token) {
                const store = rememberInput.checked ? localStorage : sessionStorage;
                store.setItem('authToken', data.token);
            }
            // window.location.href = '/dashboard.html';
        } else {
            const msg = data?.error || data?.message || `Login failed (${response.status}).`;
            setStatus(msg, 'error');
        }
    } catch (err) {
        setStatus(`Network error: ${err.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
    }
});