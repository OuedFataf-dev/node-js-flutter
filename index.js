// Importations des modules
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuration de l'environnement et de Stripe
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // Clé secrète Stripe

// Importation des routes
const mealsRouter = require('./meals');
const menuRouter = require('./menu');
const loginRouter = require('./login');
const registerRouter = require('./register');
const paymentRouter = require('./payement');
const commandeRouter = require('./commande');
const ajouterRouter = require('./add');

// Initialisation de l'application
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
//app.use(express.json());
app.use(express.json()); // Middleware to parse JSON bodies


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

// Créer le dossier "uploads" s'il n'existe pas
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuration de multer pour la gestion des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Dossier de destination
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renommer le fichier avec un timestamp
  },
});

const upload = multer({ storage });

// Routes API pour les fichiers et les données
app.post('/api/upload', upload.single('file'), (req, res) => {
  const imageUrl = req.file.path;
  res.json({ url: imageUrl }); // Répondre avec l'URL de l'image
});

app.post('/api/endpoint', async (req, res) => {
  const { name, imageUrl, price, minute } = req.body;
  try {
    const mealsCollection = db.collection('meals');
    const newFileData = { name, imageUrl, price, minute };
    await mealsCollection.insertOne(newFileData);
    res.status(200).json({ message: 'Données enregistrées avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données :', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement des données' });
  }
});

// Routes pour récupérer des données par ID
app.get('/detaille/:id', async (req, res) => {
  try {
    const menuCollection = db.collection('menu');
    const menuDetail = await menuCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!menuDetail) {
      return res.status(404).json({ message: 'Menu non trouvé' });
    }
    res.json(menuDetail);
  } catch (error) {
    res.status(500).json({ message: 'Erreur du serveur', error });
  }
});

app.get('/mealsdetail/:id', async (req, res) => {
  try {
    const mealsCollection = db.collection('meals');
    const mealDetail = await mealsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!mealDetail) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    res.json(mealDetail);
  } catch (error) {
    console.error('Error retrieving meal details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route de test pour vérifier le serveur
app.get('/', (req, res) => {
  res.send('Le serveur fonctionne correctement');
});

// Route pour gérer les commandes
app.get('/commande/:id', async (req, res) => {
  try {
    const mealsCollection = db.collection('meals');
    const mealDetail = await mealsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!mealDetail) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    res.json(mealDetail);
  } catch (error) {
    console.error('Error retrieving meal details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Fonction pour la déconnexion des utilisateurs
app.post('/logout-user', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(403).send('Aucun token fourni');
  }
  res.status(200).send('Déconnexion réussie.');
});

// Middleware d'authentification JWT
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(403).send('Accès refusé');
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).send('Token invalide ou expiré');
  }
};

// Middleware et route pour l'envoi d'emails de réinitialisation de mot de passe
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;
  console.log('Email reçu :', email);  // Log l'email pour vérifier la requête
  try {
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log('Utilisateur non trouvé');
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }
    console.log('Utilisateur trouvé :', user);
    
    // Génération du token et envoi de l'e-mail
    const token = crypto.randomBytes(32).toString('hex');
    const resetPasswordExpires = Date.now() + 3600000; // 1 heure
    await db.collection('users').updateOne(
      { email },
      { $set: { resetPasswordToken: token, resetPasswordExpires } }
    );
    
    const resetUrl = `${process.env.BASE_URL}/reset-password/${token}`;
    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: 'Réinitialisation du mot de passe',
      text: `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}`,
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès');
    res.json({ message: 'Email de réinitialisation envoyé' });
  } catch (error) {
    console.error('Erreur dans la route forgot-password :', error);  // Log de l'erreur
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});
// Route pour accéder à la page de réinitialisation du mot de passe
app.get('/api/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    // Vérifier si le token est valide
    const user = await db.collection('users').findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Vérifier que le token n'a pas expiré
    });

    if (!user) {
      return res.status(400).json({ message: 'Token invalide ou expiré' });
    }

    // Si le token est valide, renvoyer une page ou un message pour permettre à l'utilisateur de réinitialiser le mot de passe
    res.status(200).send('Vous pouvez maintenant réinitialiser votre mot de passe');
    // Vous pouvez aussi rediriger vers une page frontend si vous utilisez un framework comme React, Angular, ou une autre solution pour afficher le formulaire
  } catch (error) {
    console.error('Erreur lors de la récupération du token:', error);
    res.status(500).json({ error: 'Erreur du serveur' });
  }
});
// Utilisation des routeurs importés
app.use('/meals', mealsRouter);
app.use('/menu', menuRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/payement', paymentRouter);
app.use('/commande', commandeRouter);
app.use('/add', ajouterRouter);

// Configuration du serveur
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Écouter sur toutes les interfaces

app.listen(PORT, HOST, () => {
  console.log(`Le serveur fonctionne sur http://${HOST}:${PORT}`);
});
