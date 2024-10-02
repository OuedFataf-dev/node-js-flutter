require('dotenv').config();
const { MongoClient } = require("mongodb");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');

// Initialisez l'application
const app = express();
app.use(express.json()); // Middleware pour parser les requêtes JSON

// Configuration de la base de données
const uri = process.env.MONGO_URI || "mongodb+srv://fataf1391:A4jWuwk14MsmpfdN@cluster0.palkq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let db;

const secrekey = process.env.JWT_SECRET || 'default_secret'; // Remplacez par votre secret réel

// Fonction pour se connecter à MongoDB
async function connectToMongoDB() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db('maBaseDeDonnees');  // Nom de la base de données
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);  // Quitter en cas d'échec de connexion
  }
}
//Route pour l'enregistrement des utilisateurs
router.post('/register', async (req, res) => {
  const { name, email, password, userType } = req.body;
  const db = req.app.locals.db;  // Accéder à la base de données via app.locals

  try {
    // Vérifier si l'utilisateur existe déjà
    const userExists = await db.collection('users').findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Utilisateur déjà existant' });
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insérer le nouvel utilisateur dans la base de données
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      userType
    });

    res.status(201).json({ message: 'Utilisateur créé avec succès', userId: result.insertedId });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error });
  }
});
// Route pour la connexion des utilisateurs
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const db = req.app.locals.db;

  try {
    // Trouver l'utilisateur dans la base de données
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Utilisateur non trouvé' });
    }

    // Comparer le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mot de passe incorrect' });
    }

    // Générer un token JWT
    const token = jwt.sign({ userId: user._id, userType: user.userType }, secrekey, { expiresIn: '1h' });

    res.json({ message: 'Connexion réussie', token });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion', error });
  }
});


// Démarrer le serveur
const startServer = async () => {
  await connectToMongoDB(); // Connexion à MongoDB
  initAuthRoutes(); // Initialiser les routes d'authentification

  // Démarrer le serveur
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
  });
};

// Appeler la fonction pour démarrer le serveur
startServer();
