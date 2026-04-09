const express = require('express');
const { MongoClient, ObjectId, Long } = require('mongodb'); // Long für das Schema wichtig
const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const url = 'mongodb://localhost:27017';
const dbName = 'blog'; // Geändert auf 'blog' passend zu deinem Skript
let db;

async function connectDB() {
    try {
        const client = await MongoClient.connect(url);
        db = client.db(dbName);
        console.log("Verbunden mit Datenbank: " + dbName);
    } catch (err) {
        console.error("Datenbankverbindung fehlgeschlagen:", err);
    }
}

// --- USER ROUTES ---

// Registrierung
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, password, displayName, birthday, country } = req.body;
        
        const newUser = {
            _id: username, // Laut deinem Schema ist username die _id
            password: password,
            displayName: displayName,
            birthday: new Date(birthday),
            country: country || ""
        };

        const result = await db.collection('User').insertOne(newUser);
        res.status(201).json({ message: "User erstellt", id: result.insertedId });
    } catch (err) {
        res.status(400).json({ error: "Registrierung fehlgeschlagen (Schema-Validierung oder User existiert bereits)", details: err.message });
    }
});

// Login
app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.collection('User').findOne({ _id: username, password: password });
    
    if (user) {
        res.json({ success: true, user: { displayName: user.displayName, username: user._id } });
    } else {
        res.status(401).json({ success: false, message: "Ungültige Anmeldedaten" });
    }
});

// --- BLOG ROUTES ---

// Alle Einträge holen
app.get('/api/entries', async (req, res) => {
    try {
        const entries = await db.collection('Entry').find().toArray();
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Neuen Blog-Eintrag erstellen (Schema-konform)
app.post('/api/entries', async (req, res) => {
    try {
        const { title, description, content, commentsAllowed } = req.body;

        const newEntry = {
            title: title,
            description: description,
            creationDate: new Date(),
            editDates: [],
            // impressionCount muss 'long' sein laut deinem Schema!
            impressionCount: Long.fromNumber(0), 
            commentsAllowed: commentsAllowed === true,
            content: {
                text: content.text || "",
                links: content.links || [],
                images: content.images || [] // Base64 Strings
            }
        };

        const result = await db.collection('Entry').insertOne(newEntry);
        res.status(201).json(result);
    } catch (err) {
        // Gibt detaillierte Fehler aus, wenn das Schema nicht passt
        res.status(400).json({ error: "Validierungsfehler", details: err.message });
    }
});

// --- CATEGORY ROUTES ---

app.get('/api/categories', async (req, res) => {
    const categories = await db.collection('Category').find().toArray();
    res.json(categories);
});

connectDB().then(() => {
    app.listen(3000, () => console.log("Server läuft auf http://localhost:3000"));
});