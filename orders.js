// Import des modules nécessaires
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configuration de la base de données
const uri = process.env.MONGO_URI || "mongodb+srv://fataf1391:A4jWuwk14MsmpfdN@cluster0.palkq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let db;
let client;

// Fonction pour se connecter à MongoDB
async function connectToMongoDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db('maBaseDeDonnees');  // Nom de la base de données
    app.locals.db = db;  // Stocker la base de données dans app.locals pour la rendre disponible dans les routes
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);  // Quitter en cas d'échec de connexion
  }
}

// Middleware pour parser le JSON
//app.use(express.json());
app.use(express.json());


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


// Lancer le serveur après la connexion à MongoDB
connectToMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
  });
});
