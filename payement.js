require('dotenv').config(); // Assure-toi de charger les variables d'environnement
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // Utiliser la clé Stripe depuis l'environnement
const express = require('express');
const router = express.Router();

// Endpoint pour créer une intention de paiement avec Stripe
router.post('/create-payment-intent', async (req, res) => {
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
    console.error('Erreur lors de la création du Payment Intent', error);
    res.status(500).send({
      error: 'Une erreur est survenue lors de la création de l\'intention de paiement',
    });
  }
});

// Endpoint pour créer une commande dans la base de données
router.post('/create-order', async (req, res) => {
  const { amount, currency } = req.body;

  try {
    const db = req.app.locals.db;

    // Créez un ID de commande unique
    const orderId = `order_${new Date().getTime()}`;

    // Préparez les données de la commande
    const orderData = {
      amount,
      currency,
      order_id: orderId, // Utilisez 'order_id' pour que cela soit cohérent lors de la recherche
      createdAt: new Date(),
      status: 'en attente', // Changer le statut ici si nécessaire
      estimate_delivery_time: '30 minutes',
    };

    // Insérez la commande dans la base de données
    const result = await db.collection('orders').insertOne(orderData);

    if (result.acknowledged) {
      res.status(200).send({
        order_id: orderId, // Renvoie l'ID de commande
        message: 'Commande créée avec succès',
      });
    } else {
      res.status(500).send({
        error: 'Échec de la création de la commande',
      });
    }
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).send({
      error: 'Une erreur est survenue lors de la création de la commande',
    });
  }
});

module.exports = router;
