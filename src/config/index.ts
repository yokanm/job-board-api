// src/config/index.ts
import dotenv from 'dotenv';
dotenv.config();

import type { StringValue } from 'ms';

const config = {
    PORT: process.env['PORT'] ?? 3000,
    NODE_ENV: process.env['NODE_ENV'] ?? 'development',
    ALLOW_ORIGINS: ['*'],
    DATABASE_URL: process.env['DATABASE_URL'],
    LOG_LEVEL: process.env['LOG_LEVEL'] ?? 'info',
    JWT_ACCESS_SECRET: process.env['JWT_ACCESS_SECRET']!,
    JWT_REFRESH_SECRET: process.env['JWT_REFRESH_SECRET']!,
    ACCESS_TOKEN_EXPIRES: (process.env['ACCESS_EXPIRES'] ?? '15m') as StringValue,
    REFRESH_TOKEN_EXPIRES: (process.env['REFRESH_EXPIRES'] ?? '7d') as StringValue,
    
};

export default config;