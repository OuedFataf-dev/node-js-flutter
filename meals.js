const express = require('express');
const router = express.Router();

// Function to insert a meal into the database
async function ajouterRepas(repas, db) {
    try {
        const collection = db.collection('meals');
        const result = await collection.insertOne(repas);
        return result;
    } catch (error) {
        console.error('Erreur lors de l\'ajout du repas:', error);
        throw error;
    }
}

// Function to retrieve all meals from the database
async function recupererRepas(db) {
    try {
        const collection = db.collection('meals');
        const meals = await collection.find({}).toArray();
        return meals;
    } catch (error) {
        console.error('Erreur lors de la récupération des repas:', error);
        throw error;
    }
}

// Endpoint to add a meal
router.post('/ajouter-meals', async (req, res) => {
    const { name, price, minute, imageUrl,note } = req.body;
    const nouveauRepas = { name, price, minute, imageUrl ,note};

    try {
        const result = await ajouterRepas(nouveauRepas, req.app.locals.db);
        res.status(200).json({ message: 'Repas enregistré avec succès', repas: result });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'enregistrement du repas', error });
    }
});

// Endpoint to retrieve all meals
router.get('/recuperer-meals', async (req, res) => {
    try {
        const meals = await recupererRepas(req.app.locals.db);
        res.status(200).json({ message: 'Repas récupérés avec succès', meals });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la récupération des repas', error });
    }
});

// Export the router
module.exports = router;
