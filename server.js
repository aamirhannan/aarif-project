require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const causeRoutes = require('./routes/cause');
const sponsorRoutes = require('./routes/sponsor');
const claimerRoutes = require('./routes/claimer');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

// Uncaught exception handler
process.on('uncaughtException', (err) => {
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(err.name, err.message, err.stack);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json({ limit: '10kb' }));
app.use(morgan('dev'));

// Routes
app.use('/api/v1', authRoutes);
app.use('/api/v1', causeRoutes);
app.use('/api/v1/sponsor', sponsorRoutes);
app.use('/api/v1/claimer', claimerRoutes);

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

// Database connection with retry logic
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/aarif-project');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        // Retry after 5 seconds
        console.log('Retrying connection in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

// Connect to database and start server
connectDB().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
        console.error('UNHANDLED REJECTION! 💥 Shutting down...');
        console.error(err.name, err.message);
        // Gracefully close server before exiting
        server.close(() => {
            process.exit(1);
        });
    });
}); 