const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Read environment variables from api.env
const env = {};
try {
    const envFile = fs.readFileSync('api.env', 'utf8');
    envFile.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            env[key] = value;
        }
    });
} catch (e) {
    console.error('Could not read api.env file. Make sure it exists.');
}

const SUPABASE_URL = env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = env.SUPABASE_SECRET_KEY; // Using secret key for backend auth bypassing RLS

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// MIME types for static file serving
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

// Helper: parse JSON body from request
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try { resolve(JSON.parse(body)); }
            catch (e) { reject(new Error('Invalid JSON')); }
        });
        req.on('error', reject);
    });
}

// Helper: send JSON response
function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

// Helper: parse query string
function parseQuery(url) {
    const idx = url.indexOf('?');
    if (idx === -1) return {};
    const qs = url.substring(idx + 1);
    const params = {};
    qs.split('&').forEach(pair => {
        const [k, v] = pair.split('=');
        if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    });
    return params;
}

// Helper: get URL path without query
function getPath(url) {
    const idx = url.indexOf('?');
    return idx === -1 ? url : url.substring(0, idx);
}

// Helper: serve a static file
function serveFile(res, filePath) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
}

const server = http.createServer(async (req, res) => {
    // Enable CORS for frontend requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const urlPath = getPath(req.url);

    // ==========================================
    // API Routes
    // ==========================================

    // POST /api/login
    if (req.method === 'POST' && urlPath === '/api/login') {
        try {
            const { username, password } = await parseBody(req);

            if (!username || !password) {
                return sendJSON(res, 400, { error: 'Username and password are required' });
            }

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .or(`username.eq.${username}`)
                .single();

            if (error || !data) {
                return sendJSON(res, 401, { error: 'Invalid username or password' });
            }

            // Check password (plain text for mock, use bcrypt in production)
            if (data.password !== password) {
                return sendJSON(res, 401, { error: 'Invalid username or password' });
            }

            // Successful login — return user info
            return sendJSON(res, 200, {
                message: 'Logged in successfully.',
                token: 'zeus-token-' + data.id,
                user: {
                    id: data.id,
                    uid: data.uid,
                    username: data.username
                }
            });
        } catch (err) {
            console.error('Login error:', err);
            return sendJSON(res, 500, { error: 'Internal server error' });
        }
    }

    // POST /api/register — Create a new user with automatic unique UID generation
    if (req.method === 'POST' && urlPath === '/api/register') {
        try {
            const { username, password } = await parseBody(req);

            if (!username || !password) {
                return sendJSON(res, 400, { error: 'username and password are required' });
            }

            // Check if username already exists
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('username', username.trim())
                .maybeSingle();

            if (existingUser) {
                return sendJSON(res, 409, { error: 'Username is already taken' });
            }

            // Generate unique UID
            let uidNum;
            let isUnique = false;
            while (!isUnique) {
                uidNum = Math.floor(100000 + Math.random() * 900000); // 6-digit random number
                const { data: existingUid } = await supabase
                    .from('users')
                    .select('id')
                    .eq('uid', uidNum)
                    .maybeSingle();
                
                if (!existingUid) {
                    isUnique = true;
                }
            }

            // Insert the new user
            const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({ username: username.trim(), uid: uidNum, password })
                .select()
                .single();

            if (insertError) {
                console.error('Register insert error:', insertError);
                // Handle unique constraint violation
                if (insertError.code === '23505') {
                    return sendJSON(res, 409, { error: 'Username or UID already exists' });
                }
                return sendJSON(res, 500, { error: 'Failed to create account: ' + insertError.message });
            }

            console.log('New user registered:', newUser.username, '| UID:', newUser.uid);
            return sendJSON(res, 201, {
                message: 'Account created successfully!',
                user: { id: newUser.id, uid: newUser.uid, username: newUser.username }
            });
        } catch (err) {
            console.error('Register error:', err);
            return sendJSON(res, 500, { error: 'Internal server error' });
        }
    }

    // GET /api/products
    if (req.method === 'GET' && urlPath === '/api/products') {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('pid', { ascending: true });

            if (error) {
                console.error('Products fetch error:', error);
                return sendJSON(res, 500, { error: 'Failed to fetch products' });
            }

            return sendJSON(res, 200, { products: data || [] });
        } catch (err) {
            console.error('Products error:', err);
            return sendJSON(res, 500, { error: 'Internal server error' });
        }
    }

    // POST /api/checkout — Instant purchase (creates orders)
    if (req.method === 'POST' && urlPath === '/api/checkout') {
        try {
            const { uid, items } = await parseBody(req);

            if (!uid || !items || !Array.isArray(items) || items.length === 0) {
                return sendJSON(res, 400, { error: 'uid and items[] are required' });
            }

            // Calculate total price of the purchase
            const si_total = items.reduce((sum, item) => sum + (item.product_price * item.qty), 0);

            // Generate a shared sales_id for this purchase batch
            const sales_id = Math.floor(100000 + Math.random() * 900000);

            const now = new Date();
            const purchaseTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

            // Create one order row per cart item
            const orderRows = items.map(item => ({
                purchase_date: purchaseTime,
                purchased_by: uid,
                po_product: item.product_num,
                sales_id: sales_id,
                si_total: si_total,
                si_quantity: item.qty
            }));

            const { data, error } = await supabase
                .from('orders')
                .insert(orderRows)
                .select();

            if (error) {
                console.error('Checkout insert error:', error);
                return sendJSON(res, 500, { error: 'Failed to create order: ' + error.message });
            }

            console.log('Order placed — Sales ID:', sales_id, '| Items:', items.length);
            return sendJSON(res, 200, {
                message: 'Purchase successful',
                sales_id: sales_id,
                orders: data
            });
        } catch (err) {
            console.error('Checkout error:', err);
            return sendJSON(res, 500, { error: 'Internal server error' });
        }
    }

    // GET /api/orders?uid=<uid>
    if (req.method === 'GET' && urlPath === '/api/orders') {
        try {
            const query = parseQuery(req.url);
            const uid = parseInt(query.uid);

            if (!uid) {
                return sendJSON(res, 400, { error: 'uid query parameter is required' });
            }

            // Fetch orders for this user, join with products to get name/price
            const { data, error } = await supabase
                .from('orders')
                .select('poid, created_at, purchase_date, purchased_by, po_product, sales_id, si_quantity, si_total, products(product_name, product_price)')
                .eq('purchased_by', uid)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Orders fetch error:', error);
                // Fallback: fetch without join
                const { data: fallbackData, error: fbError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('purchased_by', uid)
                    .order('created_at', { ascending: false });

                if (fbError) {
                    return sendJSON(res, 500, { error: 'Failed to fetch orders' });
                }
                return sendJSON(res, 200, { orders: fallbackData || [] });
            }

            // Flatten the joined data
            const orders = (data || []).map(o => ({
                poid: o.poid,
                created_at: o.created_at,
                purchase_date: o.purchase_date,
                purchased_by: o.purchased_by,
                po_product: o.po_product,
                sales_id: o.sales_id,
                product_name: o.products ? o.products.product_name : null,
                product_price: o.products ? o.products.product_price : null
            }));

            return sendJSON(res, 200, { orders });
        } catch (err) {
            console.error('Orders error:', err);
            return sendJSON(res, 500, { error: 'Internal server error' });
        }
    }

    // ==========================================
    // Static File Serving (src/ folder)
    // ==========================================

    // Serve files from /src directory
    let filePath;
    if (urlPath === '/' || urlPath === '') {
        filePath = path.join(__dirname, 'src', 'landing.html');
    } else {
        filePath = path.join(__dirname, 'src', urlPath);
    }

    // Security: prevent directory traversal
    const srcDir = path.join(__dirname, 'src');
    const rootDir = path.resolve(__dirname);
    const resolved = path.resolve(filePath);

    // Try serving from src/ if the file exists there
    if (resolved.startsWith(srcDir) && fs.existsSync(resolved)) {
        return serveFile(res, resolved);
    }

    // Fallback: serve allowed root-level files (login.html, login.css, login.js)
    const rootFile = path.join(__dirname, urlPath);
    const resolvedRoot = path.resolve(rootFile);
    const allowedRootFiles = ['login.html', 'login.css', 'login.js'];
    const basename = path.basename(resolvedRoot);

    if (resolvedRoot.startsWith(rootDir) && allowedRootFiles.includes(basename) && fs.existsSync(resolvedRoot)) {
        return serveFile(res, resolvedRoot);
    }

    sendJSON(res, 404, { error: 'Not found' });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Zeus Store server running at http://localhost:${PORT}`);
    console.log(`Landing page:  http://localhost:${PORT}/`);
    console.log(`Products page: http://localhost:${PORT}/products.html`);
    console.log(`Cart page:     http://localhost:${PORT}/cart.html`);
    console.log(`Orders page:   http://localhost:${PORT}/orders.html`);
});
