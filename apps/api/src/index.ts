import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { createServer } from 'http';
import { errorHandler } from "./middleware/errorHandler.js";
import * as trpcExpress from '@trpc/server/adapters/express';
import { appRouter } from './routes/index.js';
export type { AppRouter } from './routes/index.js';
import { setupSocketServer } from './sockets/index.js';
import { serverConfig, clientConfig } from '@repo/config';
import { withAuth } from './middleware/auth.js';
import { createContext } from './context.js';
import webhookRouter from './routes/webhooks.js';

const app: Express = express();
const port = serverConfig.port;

// Security and performance middleware
app.use(helmet());

// CORS configuration with dynamic origins
const corsOrigins = [
  'http://localhost:5193', // Main web app
  'http://localhost:5613', // VS-web app
  'http://localhost:5614', // VS-web app alt port
  'http://52.90.23.181:5613', // EC2 web app
  'http://52.90.23.181:5614', // EC2 web app (current port)
  'http://52.90.23.181:3001', // EC2 API
  'http://robovibe.raspyaspie.com', // Domain name for web app
  'http://api.raspyaspie.com', // Domain name for API
  'https://robovibe.raspyaspie.com', // HTTPS domain for web app
  'https://api.raspyaspie.com', // HTTPS domain for API
];

// Add production URLs if they exist
if (clientConfig.url && !clientConfig.url.includes('localhost')) {
  corsOrigins.push(clientConfig.url);
}
if (process.env.CLIENT_URL && !process.env.CLIENT_URL.includes('localhost')) {
  corsOrigins.push(process.env.CLIENT_URL);
}

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(compression());

// Webhook routes (must be before body parsing middleware for raw body)
app.use('/webhooks', webhookRouter);

// Body parsing middleware (after webhooks which need raw body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Apply Clerk auth middleware to all routes
// This adds auth info but doesn't require authentication
app.use(withAuth);

// tRPC API setup with auth context
app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);


// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware (must be last)
app.use(errorHandler);




if (!serverConfig.isTest) {
  // Create HTTP server for both Express and Socket.IO
  const server = createServer(app);
  
  // Setup Socket.IO with organized handlers
  setupSocketServer(server, {
    corsOrigin: corsOrigins
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${String(port)}`);
    console.log(`Socket.IO server ready for streaming`);
    console.log(`External access: http://52.90.23.181:${String(port)}`);
  });
}

export default app;
