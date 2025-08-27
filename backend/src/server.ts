// Server setup and initialization
import app from './app';
import { initModels } from './models';

// Server port configuration
const BACKEND_PORT = process.env.BACKEND_PORT || 3000;

// Server start function
const startServer = async () => {
    try {
        // Database models initialization
        await initModels();
        console.log('Database models initialized successfully.');

        // Server listening 
        app.listen(BACKEND_PORT, () => {
            console.log('Server listening on port ${BACKEND_PORT}');
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
};

// Invoke server start
startServer();