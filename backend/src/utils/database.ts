// Database connection setup using Sequelize
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Environment variables loading
dotenv.config();

// Singleton Database class implementation
class Database {
    // Static instance of Sequelize
    private static instance: Sequelize;

    // Private constructor to prevent direct instantiation
    private constructor() {}

    // Method to get the singleton instance of Sequelize
    public static getInstance(): Sequelize {
        if (!Database.instance) {
            const dbName: string = process.env.DB_NAME || '';
            const dbUser: string = process.env.DB_USER || '';
            const dbPassword: string = process.env.DB_PASSWORD || '';
            const dbHost: string = process.env.DB_HOST || '';
            const dbPort: number = Number(process.env.DB_PORT || 5432);

            // Initialize Sequelize instance
            Database.instance = new Sequelize({
                database: dbName,
                username: dbUser,
                password: dbPassword,
                host: dbHost,
                port: dbPort,
                dialect: 'postgres',
                pool: {
                    max: 5,
                    min: 0,
                    acquire: 30000,
                    idle: 10000,
                },
            });
        }
        return Database.instance;
    }
}

// Export the Database class
export default Database;
