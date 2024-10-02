require('dotenv').config();
const { MongoClient } = require("mongodb");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const secrekey = process.env.JWT_SECRET || 'default_secret'; 

// Route pour la connexion des utilisateurs
router.post('/login-users', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Accéder à la base de données via req.app.locals.db
    const db = req.app.locals.db;
    
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

module.exports = router;
