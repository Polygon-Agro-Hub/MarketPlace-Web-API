const express = require('express');
const db = require('./startup/database'); 
const routes = require('./routes/Auth');
require('dotenv').config();
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3200;


app.use(cors({origin:'*'}));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

db.connect(err => {
  if (err) {
    console.error('Error connecting to the database in index.js:', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js.');
});

app.use(cors());

app.use(process.env.AUTHOR, routes);

app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
