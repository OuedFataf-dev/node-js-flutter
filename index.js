const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const multer = require('multer');
const cors = require('cors');

require('dotenv').config();
const stripe = require("stripe")("sk_test_51Od6veCXR1cwPbKYQFNKK83JD5p2LwA5rCUQWGk6wAS3d5HChpRI7dxYGGyT0L65k89Wvp4uyUYF60UnQ8ySPcF70084LHaG3X"); // Clé secrète Stripe
//const { MongoClient } = require("mongodb");
const bodyParser = require('body-parser');

const path = require('path');
const fs = require('fs');
const mealsRouter = require('./meals');
const menuRouter = require('./menu');
const loginRouter = require('./login');
const registerRouter = require('./register');
const paymentRouter = require('./payement');
const commandeRouter = require('./commande');
//const ordersRouter = require('./orders');
//const menuRouter = require('./user');
//const authentificationRouter = require('./authentification'); // Im
 // Assurez-vous d'importer le fichier contenant les routes utilisateur



// Initialisez l'application
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Middleware pour servir des fichiers statiques
app.use('/uploads', express.static('uploads'));
app.use('/images', express.static('images'));

 // Serve les fichiers du dossier 'uploads'

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
    app.locals.db = db;  // Pass db to routes via app.locals
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);  // Quitter en cas d'échec de connexion
  }
}

// Appelez la fonction pour se connecter à MongoDB avant de gérer les requêtes
connectToMongoDB();

// Créez le dossier "uploads" s'il n'existe pas
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configurez multer pour les téléchargements de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Répertoire pour stocker les fichiers téléchargés
  },
  filename: (req, file, cb) => { 
    cb(null, Date.now() + path.extname(file.originalname)); // Ajoutez un timestamp pour éviter les conflits de noms
  },
});

const upload = multer({ storage });

// Point de terminaison pour gérer les téléchargements de fichiers
app.post('/api/upload', upload.single('file'), (req, res) => {
  const imageUrl = req.file.path; // Obtenez le chemin du fichier téléchargé
  res.json({ url: imageUrl }); // Répondez avec l'URL de l'image
});

// Point de terminaison pour recevoir des données et les enregistrer dans MongoDB
app.post('/api/endpoint', async (req, res) => {
  const { name, imageUrl, price, minute } = req.body;

  try {
    const mealsCollection = db.collection('meals'); // Collection 'meals' dans MongoDB
    const newFileData = {
      name,
      imageUrl,
      price,
      minute,
    };
    console.log("Nom du repas:", name);
    // Insérer les données dans la collection 'meals'
    await mealsCollection.insertOne(newFileData);
    res.status(200).json({ message: 'Données enregistrées avec succès dans meals' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données :', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement des données' });
  }
});

// Middleware pour gérer les JSON
app.use(express.json());

// Route pour récupérer les détails d'un menu via son ID
app.get('/detaille/:id', async (req, res) => {
  const menuCollection = db.collection('menu'); // Collection "menus"
  
  try {
    const menuDetail = await menuCollection.findOne({ _id: new ObjectId(req.params.id) }); // Trouver le menu par son ID
    if (!menuDetail) {
      return res.status(404).json({ message: 'Menu non trouvé' });
    }
    res.json(menuDetail); // Retourner le détail du menu
  } catch (error) {
    res.status(500).json({ message: 'Erreur du serveur', error });
  }
});


// Endpoint API pour obtenir les détails d'un repas detaille par ID
app.get('/mealsdetail/:id', async (req, res) => {
  const menuCollection = db.collection('meals'); // Collection "meals"
  
  try {
    // Trouver le repas par son ID
    const mealDetail = await menuCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!mealDetail) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Retourner les détails du repas
    res.json(mealDetail);
  } catch (error) {
    console.error('Error retrieving meal details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Route de test pour vérifier le bon fonctionnement du serveur
app.get('/', (req, res) => {
  res.send('Le serveur fonctionne correctement');
});
app.get('/commande/:id', async (req, res) => {
  const db = req.app.locals.db; // Récupérer la base de données
  const menuCollection = db.collection('meals'); // Collection "meals"

  try {
    // Trouver le repas par son ID
    const mealDetail = await menuCollection.findOne({ _id: new ObjectId(req.params.id) });

    if (!mealDetail) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    // Retourner les détails du repas
    res.json(mealDetail);
  } catch (error) {
    console.error('Error retrieving meal details:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});



// Utiliser le mealsRouter pour gérer les routes "/meals"
app.use('/meals', mealsRouter);
app.use('/menu', menuRouter);
app.use('/login', loginRouter);
app.use('/register', registerRouter);
app.use('/payement', paymentRouter);
app.use('/commande', commandeRouter);
//app.use('/orders', ordersRouter);
//const loginRouter = require('./login');


const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Écouter sur toutes les interfaces

app.listen(PORT, HOST, () => {
  console.log(`Le serveur fonctionne sur http://${HOST}:${PORT}`);
});
