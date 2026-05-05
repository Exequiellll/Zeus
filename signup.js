import { supabase } from './supabase-config.js';

const form = document.getElementById('signupForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const submitBtn = document.getElementById('submitBtn');
const status = document.getElementById('status');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setStatus(message, kind) {
    status.textContent = message;
    status.classList.remove('error', 'success');
    if (kind) status.classList.add(kind);
}

function validate({ username, email, password, confirmPassword }) {
    if (!username || !email || !password || !confirmPassword) {
        return 'All fields are required.';
    }
    if (username.length < 3) {
        return 'Username must be at least 3 characters.';
    }
    if (!EMAIL_RE.test(email)) {
        return 'Please enter a valid email address.';
    }
    if (password.length < 6) {
        return 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
        return 'Passwords do not match.';
    }
    return null;
}

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    const validationError = validate({ username, email, password, confirmPassword });
    if (validationError) {
        setStatus(validationError, 'error');
        return;
    }

    submitBtn.disabled = true;
    setStatus('Creating account...', null);

    try {
        console.log('[signup] checking for existing user', { username, email });
        const lookup = await supabase
            .from('users')
            .select('id')
            .or(`username.eq.${username},email.eq.${email}`)
            .maybeSingle();

        console.log('[signup] lookup response', lookup);

        if (lookup.error) {
            setStatus(`Could not check existing accounts: ${lookup.error.message}`, 'error');
            return;
        }
        if (lookup.data) {
            setStatus('An account with that username or email already exists.', 'error');
            return;
        }

        console.log('[signup] inserting new user');
        const insert = await supabase
            .from('users')
            .insert([{ username, email, password }])
            .select();

        console.log('[signup] insert response', insert);

        if (insert.error) {
            setStatus(`Sign up failed: ${insert.error.message}`, 'error');
            return;
        }

        if (!insert.data || insert.data.length === 0) {
            setStatus('Insert returned no rows. Likely an RLS policy is blocking inserts for the anon role.', 'error');
            return;
        }

        setStatus('Account created! Redirecting to login...', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1200);
    } catch (err) {
        console.error('[signup] exception', err);
        setStatus(`Network error: ${err.message}`, 'error');
    } finally {
        submitBtn.disabled = false;
    }
});
