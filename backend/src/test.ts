import db, { initModels } from './models';

(async () => {
  try {
    // 1️⃣ Test connessione
    await db.sequelize.authenticate();
    console.log("✅ DB connection OK");

    // 2️⃣ Inizializza i modelli
    await initModels();
    console.log("✅ Models initialized");

    // 3️⃣ Test query minima
    const user = await db.User.findOne();
    const product = await db.Product.findOne();
    console.log("User:", user?.email);
    console.log("Product:", product?.title);

    console.log("🎉 All basic tests passed");

  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await db.sequelize.close();
  }
})();