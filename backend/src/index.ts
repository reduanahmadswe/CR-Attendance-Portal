import app from './app';
import connectDB from './config/database';

// Initialize database connection
connectDB().catch(err => {
  console.error('Database connection failed:', err);
});

// Export the Express app for Vercel
export default app;
