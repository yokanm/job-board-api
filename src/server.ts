import express from 'express';
import config from '@/config';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import limiter from '@/lib/express_rate_limit';
import { connectDb, disconnectDb } from '@/lib/prisma';
import logger from '@/lib/winston';
/**
 * TYPE
 */

import type { CorsOptions } from 'cors';
/**
 * Route
 */
import routeV1 from '@/routes/v1';
import authRouter from '@/routes/v1'


const app = express();

const corsOptions: CorsOptions = {
  origin(Origin, callback) {
    if (
      config.NODE_ENV === 'development' ||
      !origin ||
      config.ALLOW_ORIGINS.includes(origin)
    )
      callback(null, true);
    else {
      callback(new Error(`CORS: Origin ${origin} not allowed`), false);
      logger.warn(`CORS: Origin ${origin} not allowed`);
    }
  },
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  compression({
    threshold: 1024,
  }),
);
app.use(helmet());
app.use(limiter);



(async () => {
  try {
      app.use('/api/v1', routeV1);
      app.use('/', authRouter)
    await connectDb();
    app.listen(config.PORT, () => {
      logger.info(`Server is running on http://localhost:${config.PORT}`);
    });
  } catch (error) {
   logger.error('Failed to start server:', error);

    if (config.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
})();

/**
 * Handles server shutdown gracefully by disconnecting from the database.
 * Exist the process with status code (0) which indicates a successful shutdown.
 */

const handleServerShutdown = async (): Promise<void> => {
  try {
    await disconnectDb();
    logger.warn('Server SHUTDOWN');
    process.exit(0);
  } catch (error) {
    logger.error('Error during server SHUTDOWN', error);
  }
};

/**
 * Listen for Termination signals (`SIGTERM` & `SIGINT`)
 */

process.on('SIGTERM', handleServerShutdown);
process.on('SIGINT', handleServerShutdown);
