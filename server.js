// server.js
const express = require('express');
const {Pool} = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;
const cors = require('cors');

app.use(cors());

const pool = new Pool({
    connectionString: 'postgresql://postgres:dXCgawKyhMnhjQiJxFQvohWJZrodBObg@postgres.railway.internal:5432/railway'
})

app.use(express.json());

app.get('/api/data', async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM your_table_name'); // Replace with your actual table name
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});