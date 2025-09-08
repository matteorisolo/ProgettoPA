// Database models initialization and export
import Database from '../utils/database';
import AppUser from './appUser';
import Product from './product';
import Purchase from './purchase';
import Download from './download';

// Get the singleton Sequelize instance
const sequelize = Database.getInstance();

// Define model associations
// A User can make many Purchases (as buyer)
AppUser.hasMany(Purchase, { foreignKey: 'buyerId', as: 'purchases' });
Purchase.belongsTo(AppUser, { foreignKey: 'buyerId', as: 'buyer' });

// A user can receive many Purchases (as recipient, for gifts)
AppUser.hasMany(Purchase, { foreignKey: 'recipientId', as: 'giftsReceived' });
Purchase.belongsTo(AppUser, { foreignKey: 'recipientId', as: 'recipient' });

// A product can be purchased many times (bought by many users)
Product.hasMany(Purchase, { foreignKey: 'assetId', as: 'purchases' });
Purchase.belongsTo(Product, { foreignKey: 'assetId', as: 'product' });

// A Purchase can have many Downloads (associated download links)
Purchase.hasMany(Download, { foreignKey: 'purchaseId', as: 'downloads' });
Download.belongsTo(Purchase, { foreignKey: 'purchaseId', as: 'purchase' });

// Export the database object containing Sequelize instance and models
const db = {
  sequelize,
  AppUser,
  Product,
  Purchase,
  Download,
};

// Function to initialize and sync all models with the database
export const initModels = async () => {
  // Sync all defined models to the DB and apply any necessary alterations
  await sequelize.sync({ alter: true });
  console.log('Database synchronized successfully.');
};

// Export the db object
export default db;
