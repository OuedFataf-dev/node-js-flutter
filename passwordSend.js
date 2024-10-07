// Importation des modules requis
const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Chargement des variables d'environnement

// Initialisation de l'application Express
const app = express();
//const app = express();
app.use(express.json());

app.use(express.json()); // Middleware pour analyser les corps de requête JSON

// Configuration de MongoDB
const uri = process.env.MONGO_URI;
let db;
let client;

// Fonction pour se connecter à MongoDB
async function connectToMongoDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('maBaseDeDonnees'); // Nom de la base de données
    app.locals.db = db; // Passer la base de données dans app.locals
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1); // Quitter en cas d'échec de connexion
  }
}

// Connecter à MongoDB
connectToMongoDB();

// Configuration du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Routes pour la réinitialisation de mot de passe
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Vérification de l'existence de l'utilisateur
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    // Génération du token de réinitialisation
    const token = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = Date.now() + 3600000; // 1 heure

    // Mise à jour du token et expiration dans la base de données
    await db.collection('users').updateOne(
      { email },
      { $set: { resetPasswordToken: token, resetPasswordExpires } }
    );

    // Génération de l'URL de réinitialisation
    const resetUrl = `${process.env.BASE_URL}/reset-password/${token}`;

    // Envoi de l'email
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Réinitialisation du mot de passe',
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Email de réinitialisation envoyé' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});
app.post('/api/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await db.collection('users').findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('users').updateOne(
      { resetPasswordToken: token },
      {
        $set: { password: hashedPassword },
        $unset: { resetPasswordToken: "", resetPasswordExpires: "" },
      }
    );

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});

// Configuration du serveur
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Écouter sur toutes les interfaces

app.listen(PORT, HOST, () => {
  console.log(`Le serveur fonctionne sur http://${HOST}:${PORT}`);
});
