// server.js
const express = require('express');
const {Pool} = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


app.use(cors());

const pool = new Pool({
    connectionString: 'postgresql://postgres:dXCgawKyhMnhjQiJxFQvohWJZrodBObg@junction.proxy.rlwy.net:16274/railway'
})

app.use(express.json());

app.get('/api/data', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM "logindb"'); // Replace with your actual table name
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});