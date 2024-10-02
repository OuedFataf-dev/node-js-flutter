require('dotenv').config();
const { MongoClient } = require("mongodb");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
//const mealsRouter = require('./meals');
//const mealRoutajout=require('./images');
 // Assurez-vous que ce fichier exporte correctement un routeur

// Configuration de l'application Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static files from the "uploads" directory
app.use('/uploads', express.static('uploads'));

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
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);  // Quitter en cas d'échec de connexion
  }
}

// Partager la connexion MongoDB avec les routes
app.use((req, res, next) => {
  req.app.locals.db = db; // Partager la connexion MongoDB via app.locals
  next();
});

// Utilisation du routeur meals
//app.use('/meals', mealsRouter);
//app.use('/images', mealRoutajout);

// Démarrer le serveur
async function startServer() {
  await connectToMongoDB();
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
  });
}

startServer();


