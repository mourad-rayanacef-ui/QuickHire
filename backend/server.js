const dns = require('node:dns');

try {
  dns.setDefaultResultOrder('ipv4first');
  console.log("✅ DNS Resolution set to: IPv4 First");
} catch (e) {
  console.warn("⚠️ Could not set DNS order (Node version might be old)", e);
}

require('dotenv').config(); 
const express = require('express'); 
const compression = require('compression');
const BgCron = require("./src/cron/BgTasks.js");

const app = express();
const PORT = process.env.PORT || 3000;
const cors = require("cors");
const http = require("http");
const Routes = require("./src/routes/index.js");

// ✅ UPDATED CORS CONFIGURATION FOR PRODUCTION
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL, // Your production frontend
      'http://localhost:5173',   // Local development
      'http://localhost:3000',   // Local development alternative
      'http://localhost:4173',   // Vite preview
    ].filter(Boolean); // Remove any undefined values

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authorization headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers.upgrade === 'websocket') {
      return false;
    }
    return compression.filter(req, res);
  },
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Apply CORS with options
app.use(cors(corsOptions));

const {initSocket} = require("./src/socket/index.js");

// Background jobs
BgCron();

// Routes
app.use('/api', Routes);

// Health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  };
  
  res.status(200).json(healthData);
});

// Root endpoint 
app.get('/', (req, res) => { 
  res.json({ 
    message: 'AQuickHire API Server is running', 
    version: '1.0.0',
    endpoints: { 
      health: '/health',
      api: '/api',
      root: '/' 
    },
    environment: process.env.NODE_ENV || 'development'
  }); 
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    requestedPath: req.originalUrl,
    availableEndpoints: ['/', '/health', '/api']
  });
});

const server = http.createServer(app);

initSocket(server);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'Not set'}`);
  console.log('========================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});