// This script defines a Node.js Express server that serves as the backend for user management.
// It handles adding admin roles to users and deleting users from Firebase Authentication.

const express = require('express');
const cors = require('cors');
const app = express();
const admin = require('firebase-admin');
const serviceAccount = require('./achieveitAdminSDK.json');
const nodemailer = require('nodemailer');

// Initialize the Firebase Admin SDK with the service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Use the CORS middleware to allow requests from a specific domain (e.g., http://localhost:3000)
app.use(cors({
  origin: 'http://localhost:3000',
}));

app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'smtp.mail.yahoo.com',
  port: 465, // Port SMTP de Yahoo
  secure: true,
  auth: {
    user: 'achieveit1@myyahoo.com',
    pass: 'TeamGoals2023',
  },
});

app.post('/execute-script', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Fetch the user by email from Firebase Authentication
    const user = await admin.auth().getUserByEmail(email);

    // Set a custom claim to make the user an admin
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    console.log(`Added admin role to user: ${email}`);
    res.status(200).json({ message: `Added admin role to user: ${email}` });
  } catch (error) {
    console.error('Error executing script:', error);
    res.status(500).json({ error: 'An error occurred while executing the script' });
  }
});

// Function to delete a user account by UID
async function deleteUserByUid(uid) {
  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    console.error(`Error deleting user ${uid}:`, error);
  }
}

// Endpoint to delete a user account by UID
app.post('/delete-user', async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    // Call the deleteUserByUid function to delete the user account
    await deleteUserByUid(uid);

    console.log(`Deleted user with UID: ${uid}`);
    res.status(200).json({ message: `Deleted user with UID: ${uid}` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'An error occurred while deleting the user' });
  }
});

// Nouvel endpoint pour envoyer un e-mail
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text } = req.body;

    if (!to || !subject || !text) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const mailOptions = {
      from: 'achieveit1@myyahoo.com',
      to: to,
      subject: subject,
      text: text,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Erreur lors de l\'envoi de l\'e-mail :', error);
        res.status(500).json({ error: 'An error occurred while sending the email' });
      } else {
        console.log('E-mail envoyé :', info.response);
        res.status(200).json({ message: 'Email sent successfully' });
      }
    });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'An error occurred while sending the email' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});