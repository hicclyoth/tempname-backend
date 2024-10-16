// server.js
const express = require('express');
const {Pool} = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const pool = new Pool({
    connectionString: 'postgresql://postgres:dXCgawKyhMnhjQiJxFQvohWJZrodBObg@junction.proxy.rlwy.net:16274/railway'
})

// CORS configuration
const corsOptions = {
    origin: 'http://127.0.0.1:5500', // Replace with your frontend URL
    credentials: true // Allow credentials (cookies, authorization headers)
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(session({
    store: new pgSession({
      pool: pool, // Reuse the database pool
      tableName: 'session' // You'll need to create this table
    }),
    secret: 'ict202',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    }
  }));
  
  

//Test Server Availability

app.get('/api/test', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM "users"');
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });

app.use(session({
    secret: 'ict202',  // Replace with your own secret
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }  // Set to true if using https
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
            req.session.user = { id: user.id, username: user.username };
            console.log('Session created:', req.session);
            return res.json({ message: 'Login successful' });
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
app.get('/api/dashboard', (req, res) => {
    console.log('Session data on /api/dashboard:', req.session);
    if (req.session && req.session.user) {
      return res.json({
        message: `Welcome to your dashboard, ${req.session.user.username}!`,
        userData: req.session.user
      });
    } else {
      console.log('No user found in session. Returning 401.');
      return res.status(401).json({ message: 'Please log in to access this page.' });
    }
  });  

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});