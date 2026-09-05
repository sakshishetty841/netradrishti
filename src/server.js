const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('[DATABASE] Connected to SQLite/PostgreSQL database via Prisma.');

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  Diabetic Retinopathy Backend API running on port ${PORT}`);
      console.log(`  Health check: http://localhost:${PORT}/api/health`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('[FATAL] Database connection failed:', error);
    process.exit(1);
  }
}

startServer();
