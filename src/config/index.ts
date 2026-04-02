import dotenv from 'dotenv';

dotenv.config();

const config = {
    PORT: process.env['PORT'] ?? 3000,
    NODE_ENV: process.env['NODE_ENV'],
    ALLOW_ORIGINS: ['*'],
    DATABASE_URL: process.env['DATABASE_URL'],
    LOG_LEVEL: process.env['LOG_LEVEL'] || "info",
}

export default config;