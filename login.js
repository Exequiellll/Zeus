const form = document.getElementById('loginForm');
const status = document.getElementById('status');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
        status.textContent = data.message;
        status.className = 'status success';
    } else {
        status.textContent = data.error;
        status.className = 'status error';
    }
});