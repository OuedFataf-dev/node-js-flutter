const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const router = express.Router();
// Route pour obtenir le statut d'une commande
router.get("/order-status/:orderId", async (req, res) => {
    const { orderId } = req.params;

    try {
        const db = req.app.locals.db;

        // Recherchez par 'order_id'
        const commande = await db.collection('orders').findOne({ order_id: orderId });

        if (commande) {
            res.json({
                order_id: commande.order_id, // Utilisez le même champ que lors de l'insertion
                status: commande.status,
                estimate_delivery_time: commande.estimate_delivery_time || '30 minutes',
            });
        } else {
            res.status(404).json({ message: "Commande non trouvée" });
        }
    } catch (error) {
        console.error("Erreur lors de la récupération du statut:", error);
        res.status(500).json({ message: "Erreur lors de la récupération du statut" });
    } 
});


// Route pour mettre à jour le statut d'une commande
router.put("/update-status/:orderId", async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const db = req.app.locals.db;
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
        console.error("Erreur lors de la mise à jour du statut:", error);
        res.status(500).json({ message: "Erreur lors de la mise à jour du statut" });
    }
});

module.exports = router; // N'oubliez pas d'exporter le routeur
