import config from "@/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import logger from "@/lib/winston";

const connectionString = `${config.DATABASE_URL}`

const adapter = new PrismaPg({connectionString}) 
export const prisma = new PrismaClient({adapter});

export const connectDb = async (): Promise<void> => {
    if (!connectionString) {
        throw new Error("PrismaDb URL is not defined in the configuration")
    }
    try {
        await prisma.$connect();
       logger.info('Database connected successfully')
    } catch (error) {
        logger.error('Database connection Failed:', error);
        
    }
}

export const disconnectDb = async ():Promise<void> => {
    try {
        await prisma.$disconnect();
        logger.info('Database disconnected')
    } catch (error) {
        logger.error('Error disconnecting DB:', error);
    }
}

/** npm install prisma @types/pg --save-dev @prisma/adapter-pg pg */