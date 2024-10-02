
require('dotenv').config();
const { MongoClient } = require("mongodb");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

const secrekey = process.env.JWT_SECRET || 'default_secret'; 

// Route pour l'enregistrement des utilisateurs
router.post('/register-users', async (req, res) => {
    const { name, email, password, userType } = req.body;
    const db = req.app.locals.db;  // Accéder à la base de données via app.locals
  
    try {
      // Vérifier si l'utilisateur existe déjà
      const userExists = await db.collection('users').findOne({ email });
      if (userExists) {
        return res.status(400).json({ message: 'Utilisateur déjà existant' });
      }
  
      // Hacher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insérer le nouvel utilisateur dans la base de données
      const result = await db.collection('users').insertOne({
        name,
        email,
        password: hashedPassword,
        userType
      });
  
      res.status(200).json({ message: 'Utilisateur créé avec succès', userId: result.insertedId });
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({ message: 'Erreur lors de l\'inscription', error });
    }
  });
  
  module.exports = router;