const express = require('express');
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Créez le dossier "images" s'il n'existe pas
const uploadDir = 'images/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configurez multer pour les téléchargements de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Renomme le fichier avec un timestamp
  },
});

const upload = multer({ storage });

// Middleware pour servir les fichiers statiques du dossier "images"
router.use('/images', express.static(path.join(__dirname, uploadDir)));

// Point de terminaison pour gérer les téléchargements de fichiers
router.post('/api', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Aucun fichier téléchargé' });
  }
  
  const imageUrl = `/images/${req.file.filename}`;
  res.json({ url: imageUrl }); // Retourne l'URL publique de l'image
});

// Point de terminaison pour recevoir des données et les enregistrer dans MongoDB
router.post('/endpoint', async (req, res) => {
  const { imageUrl, price, description, availability, ingredients, rating, chefId } = req.body;

  // Validation des données requises
  if (!imageUrl || !price || !description || !availability || !ingredients || !chefId) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  // Accédez à la base de données à partir de req.app.locals
  const db = req.app.locals.db;

  try {
    const mealsCollection = db.collection('menu'); // Collection 'menu' dans MongoDB
    const newFileData = {
      imageUrl,
      price,
      description,
      availability,
      ingredients,
      rating: rating || null, // Le rating peut être facultatif
      chefId,
    };

    // Insérer les données dans la collection 'menu'
    await mealsCollection.insertOne(newFileData);
    res.status(200).json({ message: 'Données enregistrées avec succès dans menu' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement des données :', error);
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement des données' });
  }
});

module.exports = router;
