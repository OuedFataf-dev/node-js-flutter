const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');


const port = 5000;
const router = express.Router();

// Middleware pour analyser le JSON


// Configuration de la base de données et des clés secrètes
const uri = process.env.MONGO_URI || "mongodb+srv://fataf1391:A4jWuwk14MsmpfdN@cluster0.palkq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let db;
let client;

// Fonction pour se connecter à MongoDB
async function connectToMongoDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('maBaseDeDonnees');  // Nom de la base de données
    app.locals.db = db; // Ajoutez cette ligne
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);  // Quitter en cas d'échec de connexion
  }
}

// Route pour obtenir le statut d'une commande
router.get("/order-status/:orderId", async (req, res) => {
    const { orderId } = req.params;

    try {
        const commande = await db.collection('orders').findOne({ _id: new ObjectId(orderId) });
        if (commande) {
            res.json({
                order_id: commande._id,
                status: commande.status,
                estimate_delivery_time: commande.estimate_delivery_time || '30 minutes', // Valeur par défaut si non défini
            });
        } else {
            res.status(404).json({ message: "Commande non trouvée" });
        }
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération du statut" });
    }
});

// Route pour mettre à jour le statut d'une commande
router.put("/update-status/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const result = await db.collection('orders').updateOne(
            { _id: new ObjectId(orderId) },
            { $set: { status: status } }
        );

        if (result.matchedCount > 0) {
            res.json({ message: "Statut de la commande mis à jour avec succès" });
        } else {
            res.status(404).json({ message: "Commande non trouvée" });
        }
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
});


module.exports = router;