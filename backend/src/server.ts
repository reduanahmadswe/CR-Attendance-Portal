import { Server } from 'http';
import app from './app';
import connectDB from './config/database';
import dotenv from "dotenv";

dotenv.config();
let server: Server;

const start = async () => {
  try {
    await connectDB();
    server = app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  } catch (err) {
    console.error('Server failed to start', err);
    process.exit(1);
  }
};

start();

process.on('SIGTERM', () => server?.close(() => process.exit(0)));
process.on('uncaughtException', () => server?.close(() => process.exit(1)));
process.on('unhandledRejection', () => server?.close(() => process.exit(1)));

export { app, server };
