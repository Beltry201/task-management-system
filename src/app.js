const express = require('express');
const app = express();

const authRoutes = require('./routes/auth');
const errorHandler = require('./middleware/errorHandler');

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Task Management API', version: '1.0.0' });
});

app.use('/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorHandler);

module.exports = app;