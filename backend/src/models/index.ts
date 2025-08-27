// Database models initialization and export
import Database from '../utils/database';

// Get the singleton Sequelize instance
const sequelize = Database.getInstance();

// Inserire relazioni tra modelli

// Export the database object containing Sequelize instance and models
const db = {
    sequelize
};

// Function to initialize and sync all models with the database
export const initModels = async () => {
    // Sync all defined models to the DB and apply any necessary alterations
    await sequelize.sync({ alter: true });
    console.log("Database synchronized successfully.");
};

// Export the db object
export default { db };