require('dotenv').config();
const { MongoClient } = require("mongodb");
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs'); // Import the fs module
const multer = require('multer'); // Import the multer module
const path = require('path'); // Import the path module

// Configuration de l'application Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

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

// Créez le dossier "images" s'il n'existe pas
const uploadDir = 'images/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configurez multer pour les téléchargements de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Répertoire pour stocker les fichiers téléchargés
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Ajoutez un timestamp pour éviter les conflits de noms
  },
});

const upload = multer({ storage });

// Point de terminaison pour gérer les téléchargements de fichiers
app.post('/api', upload.single('file'), (req, res) => {
  const imageUrl = req.file.path; // Obtenez le chemin du fichier téléchargé
  res.json({ url: imageUrl }); // Répondez avec l'URL de l'image
});

// Point de terminaison pour recevoir des données et les enregistrer dans MongoDB
app.post('/endpoint', async (req, res) => {
  const { imageUrl, price } = req.body;

  try {
    const mealsCollection = db.collection('menu'); // Collection 'meals' dans MongoDB
    const newFileData = {
      imageUrl,
      price,
    };

    // Insérer les données dans la collection 'meals'
    await mealsCollection.insertOne(newFileData);
    res.status(200).json({ message: 'Données enregistrées avec succès dans meals' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données :', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement des données' });
  }
});

// Démarrer le serveur
async function startServer() {
  await connectToMongoDB();
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
  });
}

startServer();
