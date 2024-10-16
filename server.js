// server.js
const express = require('express');
const {Pool} = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtSecret = 'ict202';
const session = require('express-session');
const pool = new Pool({
    connectionString: 'postgresql://postgres:dXCgawKyhMnhjQiJxFQvohWJZrodBObg@junction.proxy.rlwy.net:16274/railway'
})
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

    if (token) {
        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user; // Store user info in request object
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

// CORS configuration
const corsOptions = {
    origin: 'https://tempname.vercel.app/', // Replace with your frontend URL
    credentials: true // Allow credentials (cookies, authorization headers)
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(session({
    secret: 'ict202', // A secret key for session encryption
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: true, // Set to true if using HTTPS
      sameSite: 'lax' // Helps with session handling in cross-origin scenarios
    }
  }));
  


//Register

app.post('/api/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const result = await pool.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', 
            [username, hashedPassword]
        );
        res.status(201).json({ message: 'User registered', user: result.rows[0] });
        } catch (err) {
            console.error('Error registering user:', err);
            if (err.code === '23505') { 
                res.status(400).json({ message: 'Username already exists' });
            } else {
                res.status(500).json({ message: 'Server error' });
            }
        }
});

app.post('/api/signin', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            // User authenticated, generate JWT
            const token = jwt.sign({ id: user.id, username: user.username }, jwtSecret, { expiresIn: '30d' });
            return res.json({ message: 'Login successful', token });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error signing in' });
    }
});


// Logout 
app.post('/api/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Error logging out' });
        }
        res.json({ message: 'Logged out successfully' });
    });
});

// Protected Route 
app.get('/api/dashboard', authenticateJWT, (req, res) => {
    return res.json({
        message: `Welcome to your dashboard, ${req.user.username}!`,
        userData: req.user
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});