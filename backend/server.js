require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors({ origin: "*" }));
// Parse incoming request bodies in a middleware before your handlers
app.use(bodyParser.json());
app.use(express.json()); // Built-in middleware for parsing JSON

// MongoDB connection
connectDB();

const PORT = process.env.PORT || 5000;

// Routes
const donationRoutes = require('./routes/donationRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const documentRequestRoutes = require('./routes/documentRequestRoutes');
const razorpayRoutes = require('./routes/razorpayRoutes');

// Mount routes
app.use('/api/donations', donationRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/document-requests', documentRequestRoutes);
app.use('/api', razorpayRoutes);

// Basic test route
app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
