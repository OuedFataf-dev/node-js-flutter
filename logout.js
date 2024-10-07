const express = require('express');
const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb'); // Importation de MongoClient pour MongoDB

const app = express();
const blacklist = [];
const router = express.Router();

const secretKey = process.env.JWT_SECRET || 'default_secret'; // Clé secrète pour JWT

// Middleware pour analyser les requêtes JSON
app.use(express.json());

// Fonction pour déconnecter un utilisateur et ajouter le token à la liste noire
router.post('/logout-user', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(403).send('Aucun token fourni');
  }

  // Ajouter le token à la liste noire
  blacklist.push(token);
  res.status(200).send('Déconnexion réussie.');
});

// Middleware pour authentifier le JWT et vérifier s'il est blacklisté
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(403).send('Accès refusé');
  }

  // Vérifier si le token est dans la liste noire
  if (blacklist.includes(token)) {
    return res.status(401).send('Token invalide ou expiré');
  }

  // Si le token n'est pas blacklisté, le vérifier
  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded; // Ajouter les infos de l'utilisateur au req
    next();
  } catch (err) {
    res.status(401).send('Token invalide ou expiré');
  }
};


module.exports = router;