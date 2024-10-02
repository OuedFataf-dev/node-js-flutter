// menu.js
const express = require('express');
const router = express.Router();

// Fonction pour insérer un menu dans la base de données
async function ajouterMenu(menu, db) {
    try {
        const collection = db.collection('menu');
        const result = await collection.insertOne(menu);
        return result;
    } catch (error) {
        console.error('Erreur lors de l\'ajout du menu:', error);
        throw error;
    }
}

// Fonction pour récupérer tous les menus dans la base de données
async function recupererMenu(db) {
    try {
        const collection = db.collection('menu');
        const menu = await collection.find({}).toArray();
        return menu;
    } catch (error) {
        console.error('Erreur lors de la récupération des menus:', error);
        throw error;
    }
}

// Point de terminaison pour ajouter un menu
router.post('/ajouter-menu', async (req, res) => {
    const { name, price, minute, cuisineType, rating, chefId, popular } = req.body;
    const nouveauMenu = { name, price, minute, cuisineType, rating, chefId, popular };

    try {
        const result = await ajouterMenu(nouveauMenu, req.app.locals.db);
        res.status(200).json({ message: 'Menu enregistré avec succès', menu: result });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'enregistrement du menu', error });
    }
});

// Point de terminaison pour récupérer tous les menus
router.get('/recuperer-menu', async (req, res) => {
    console.log('Requête reçue pour /recuperer-menu'); // Log de débogage
    try {
        const menu = await recupererMenu(req.app.locals.db);
        res.status(200).json({ message: 'Menus récupérés avec succès', menu});
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des menu', error });
    }
});

module.exports = router;
