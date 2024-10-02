const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); 
const router = express.Router();// Import MongoDB Client

const app = express();
app.use(express.json());

const port = process.env.PORT || 5000; // Port par défaut

// Configuration de la base de données et des clés secrètes
const uri = process.env.MONGO_URI || "mongodb+srv://fataf1391:A4jWuwk14MsmpfdN@cluster0.palkq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
let db;
let client;

// Fonction pour se connecter à MongoDB
async function connectToMongoDB() {
  try {
    client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db('maBaseDeDonnees');  // Nom de la base de données
    app.locals.db = db;  // Passer la db aux routes via app.locals
    console.log('Connecté à MongoDB');
  } catch (err) {
    console.error('Erreur de connexion à MongoDB:', err);
    process.exit(1);  // Quitter en cas d'échec de connexion
  }
}
app.get('/detaille/:id', async (req, res) => {
    const menuCollection = db.collection('menu'); // Collection "menus"
    
    try {
      const menuDetail = await menuCollection.findOne({ _id: new ObjectId(req.params.id) }); // Trouver le menu par son ID
      if (!menuDetail) {
        return res.status(404).json({ message: 'Menu non trouvé' });
      }
      res.json(menuDetail); // Retourner le détail du menu
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du menu:', error); // Ajoutez cette ligne
      res.status(500).json({ message: 'Erreur du serveur', error });
    }
  });
  

// Démarrez le serveur
connectToMongoDB().then(() => {
  app.listen(port, () => {
    console.log(`Le serveur fonctionne sur le port ${port}`);
  });
}).catch(err => {
  console.error('Erreur lors du démarrage du serveur:', err);
});
