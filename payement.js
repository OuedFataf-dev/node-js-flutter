const stripe = require("stripe")("sk_test_51Od6veCXR1cwPbKYQFNKK83JD5p2LwA5rCUQWGk6wAS3d5HChpRI7dxYGGyT0L65k89Wvp4uyUYF60UnQ8ySPcF70084LHaG3X"); // Clé secrète Stripe
const express = require('express');
const router = express.Router();

// Endpoint pour créer une intention de paiement avec Stripe
router.post("/create-payment-intent", async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Le montant doit être en centimes
      currency: currency,
    });

    res.status(200).send({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Erreur lors de la création du Payment Intent", error);
    res.status(500).send({
      error: "Une erreur est survenue lors de la création de l'intention de paiement",
    });
  }
});
router.post("/create-order", async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const db = req.app.locals.db;
    const orderId = `order_${new Date().getTime()}`;
    
    const orderData = {
      amount,
      currency,
      orderId,
      createdAt: new Date(),
      status: 'en attente',
      estimate_delivery_time: '30 minutes',
    };

    const result = await db.collection('orders').insertOne(orderData);

    if (result.acknowledged) {
      res.status(200).send({
        order_id: orderId,
        message: "Commande créée avec succès",
      });
    } else {
      res.status(500).send({
        error: 'Échec de la création de la commande',
      });
    }
  } catch (error) {
    res.status(500).send({
      error: "Une erreur est survenue lors de la création de la commande",
    });
  }
});



module.exports = router;
