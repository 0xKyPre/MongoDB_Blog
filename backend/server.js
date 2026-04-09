const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const app = express();

app.use(express.json({ limit: '10mb' })); // Für Base64 Bilder
app.use(express.static('public'));

const url = 'mongodb://localhost:27017';
const dbName = 'blogSystem';
let db;

async function connectDB() {
    const client = await MongoClient.connect(url);
    db = client.db(dbName);
    console.log("Connected to MongoDB");
}

// Route: Alle Einträge holen
app.get('/api/entries', async (req, res) => {
    const entries = await db.collection('entries').find().toArray();
    res.json(entries);
});

// Route: Neuen Eintrag erstellen
app.post('/api/entries', async (req, res) => {
    const newEntry = {
        ...req.body,
        creationDate: new Date(),
        editDates: [],
        impressionCount: 0,
        comments: []
    };
    const result = await db.collection('entries').insertOne(newEntry);
    res.json(result);
});

connectDB().then(() => app.listen(3000, () => console.log("Server läuft auf Port 3000")));