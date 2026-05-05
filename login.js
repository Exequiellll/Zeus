import { supabase } from './supabase-config.js';

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

    const identifier = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!identifier || !password) {
        setStatus('Please enter both username and password.', 'error');
        return;
    }

    submitBtn.disabled = true;
    setStatus('Signing in...', null);

    try {
        console.log('[login] querying supabase for', identifier);
        const { data, error, status: httpStatus } = await supabase
            .from('users')
            .select('*')
            .or(`username.eq.${identifier},email.eq.${identifier}`)
            .maybeSingle();

        console.log('[login] supabase response', { data, error, httpStatus });

        if (error) {
            setStatus(`Login error: ${error.message}`, 'error');
            return;
        }

        if (!data) {
            setStatus('No matching user found. (If you just signed up, check Supabase RLS policies — the SELECT may be blocked.)', 'error');
            return;
        }

        if (data.password !== password) {
            setStatus('Wrong password.', 'error');
            return;
        }

        setStatus('Logged in successfully.', 'success');

        const token = 'session-' + data.id + '-' + Date.now();
        const store = rememberInput.checked ? localStorage : sessionStorage;
        store.setItem('authToken', token);
        store.setItem('authUser', JSON.stringify({ id: data.id, username: data.username, email: data.email }));
    } catch (err) {
        console.error('[login] exception', err);
        setStatus(`Network error: ${err.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
    }
});
