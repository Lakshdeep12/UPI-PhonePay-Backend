require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const swaggerUi = require('swagger-ui-express');

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const txnRoutes = require('./src/routes/transactionRoutes');
const walletRoutes = require('./src/routes/walletRoutes'); // New Routes

let swaggerDocument = {};
try {
  swaggerDocument = require('./swagger-out.json');
} catch (e) {
  console.log("Swagger doc not generated yet. Run 'npm run swagger'");
}

const app = express();
connectDB();

app.use(helmet());
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send('PhonePe Clone Backend is running...');
});

// App Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', txnRoutes);
app.use('/api/wallet', walletRoutes); // Integrated Wallet Routes

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
});