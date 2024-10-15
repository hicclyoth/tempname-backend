// server.js
const express = require('express');
const {Pool} = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = new Pool({
    connectionString: 'postgresql://postgres:dXCgawKyhMnhjQiJxFQvohWJZrodBObg@junction.proxy.rlwy.net:16274/railway'
})

app.use(cors());

app.use(express.json());

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
        } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/signin', async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password)) {
            res.status(200).json({ message: 'Sign in successful' });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error signing in' });
    }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});