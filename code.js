const express = require('express');
const twilio = require('twilio');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());


// Configurer Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID; // SID du compte Twilio
const authToken = process.env.TWILIO_AUTH_TOKEN; // Token d'authentification
const client = twilio(accountSid, authToken);

const OTP_EXPIRY = 300000; // Durée de validité de l'OTP en ms (ici 5 minutes)
const OTP_LENGTH = 6; // Longueur de l'OTP

app.post('/api/send-otp', async (req, res) => {
  const { phoneNumber } = req.body;

  // Génération de l'OTP
  const otp = crypto.randomInt(100000, 999999); // Génère un OTP à 6 chiffres

  // Envoi de l'OTP par SMS
  try {
    await client.messages.create({
      body: `Votre code OTP est : ${otp}. Il est valide pour 5 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER, // Numéro Twilio enregistré
      to: phoneNumber,
    });

    // Sauvegarder l'OTP dans la base de données avec une expiration
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);
    const expiry = Date.now() + OTP_EXPIRY;

    // Mettre à jour l'utilisateur avec l'OTP (ici on l'associe à un téléphone dans un exemple)
    await db.collection('users').updateOne(
      { phoneNumber },
      { $set: { otp: hashedOtp, otpExpires: expiry } }
    );

    res.json({ message: 'OTP envoyé par SMS' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'OTP:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du SMS' });
  }
});

app.post('/api/verify-otp', async (req, res) => {
    const { phoneNumber, otp } = req.body;
  
    try {
      const user = await db.collection('users').findOne({ phoneNumber });
  
      if (!user || !user.otp) {
        return res.status(400).json({ message: 'Utilisateur non trouvé ou OTP non généré' });
      }
  
      // Vérifier si l'OTP a expiré
      if (user.otpExpires < Date.now()) {
        return res.status(400).json({ message: 'OTP expiré' });
      }
  
      // Vérifier l'OTP
      const isOtpValid = await bcrypt.compare(otp, user.otp);
      if (!isOtpValid) {
        return res.status(400).json({ message: 'OTP incorrect' });
      }
  
      // Si l'OTP est valide, l'utilisateur peut réinitialiser son mot de passe
      res.json({ message: 'OTP validé avec succès. Vous pouvez réinitialiser votre mot de passe.' });
  
      // Supprimer l'OTP après validation
      await db.collection('users').updateOne(
        { phoneNumber },
        { $unset: { otp: "", otpExpires: "" } }
      );
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'OTP:', error);
      res.status(500).json({ error: 'Erreur du serveur' });
    }
  });
  