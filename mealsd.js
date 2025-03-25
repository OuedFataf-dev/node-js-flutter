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


// Lancer le serveur après la connexion à MongoDB
connectToMongoDB().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => {
  console.error('Error starting the server:', err);
});
