const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

// Configuration d'Express
const app = express();
const port = process.env.PORT || 5000; // Port par défaut

// Middleware pour gérer les requêtes JSON
app.use(express.json());

// Configuration MongoDB et variables de connexion
const uri = process.env.MONGO_URI || "mongodb+srv://fataf1391:A4jWuwk14MsmpfdN@cluster0.palkq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let db;
let client;

// Fonction pour se connecter à MongoDB
async function connectToMongoDB() {
  try {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db('maBaseDeDonnees'); // Nom de la base de données
    app.locals.db = db; // Passe la base de données via app.locals
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Connection error to MongoDB:', err);
    process.exit(1); // Quitter en cas d'échec de la connexion
  }
}

// Endpoint API pour obtenir les détails d'un repas par ID
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

// Lancer le serveur après la connexion à MongoDB
connectToMongoDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => {
  console.error('Error starting the server:', err);
});
