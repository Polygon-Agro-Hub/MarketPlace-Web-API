const express = require('express');
require('dotenv').config();
const cors = require('cors');


const { admin, plantcare, collectionofficer, marketPlace, dash } = require('./startup/database');

//routers
const authRoutes = require('./routes/Auth');

const app = express();
const port = process.env.PORT || 3200;
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//DB connections
admin.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (admin):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js (admin).');
  connection.release();
});

plantcare.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (plantcare):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js (plantcare).');
  connection.release();
});

collectionofficer.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (collectionofficer):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js.(collectionofficer)');
  connection.release();
});

marketPlace.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (marketPlace):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js.(marketPlace)');
  connection.release();
});

dash.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to the database in index.js (dash):', err);
    return;
  }
  console.log('Connected to the MySQL database in server.js.(dash)');
  connection.release();
});


app.use('/api/auth', authRoutes);


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

module.exports = app;