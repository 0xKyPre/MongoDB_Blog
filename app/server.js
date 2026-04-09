const express = require('express');
const { MongoClient, ObjectId, Long } = require('mongodb');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
// Pfad für statische Dateien angepasst (stellt sicher, dass index.html gefunden wird)
app.use(express.static(path.join(__dirname, 'public'))); 

const url = 'mongodb://localhost:27018'; // Dein Port 27018 laut Schema-Script
const dbName = 'blog';
let db;

// wahl a billa
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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

app.post('/api/users/register', async (req, res) => {
    try {
        const { username, password, displayName, birthday, country } = req.body;
        const newUser = {
            _id: username, 
            password,
            displayName,
            birthday: new Date(birthday),
            country: country || ""
        };
        await db.collection('User').insertOne(newUser);
        res.status(201).json({ message: "User erstellt" });
    } catch (err) {
        res.status(400).json({ error: "Registrierung fehlgeschlagen", details: err.message });
    }
});

app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.collection('User').findOne({ _id: username, password: password });
    if (user) {
        res.json({ success: true, user: { displayName: user.displayName, username: user._id } });
    } else {
        res.status(401).json({ success: false, message: "Login fehlgeschlagen" });
    }
});

// --- BLOG ROUTES ---

app.get('/api/entries', async (req, res) => {
    try {
        const entries = await db.collection('Entry').find().toArray();
        res.json(entries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/entries', async (req, res) => {
    try {
        const { title, description, content, commentsAllowed, authorId, categoryId } = req.body;

        // Wir bauen das Dokument Schritt für Schritt auf
        const newEntry = {
            title: title,
            description: description,
            creationDate: new Date(),
            editDates: [], // Muss laut Schema ein Array sein
            impressionCount: Long.fromNumber(0), // Muss Long sein
            commentsAllowed: Boolean(commentsAllowed),
            content: {
                text: content.text || "",
                links: content.links || [],
                images: content.images || []
            },
            authorId: authorId // Muss ein String sein
        };

        // WICHTIG: categoryId nur hinzufügen, wenn sie wirklich existiert und valide ist
        if (categoryId && categoryId.length === 24) {
            newEntry.categoryId = new ObjectId(categoryId);
        }
        // Falls du kein NULL im Schema erlaubt hast, darf das Feld hier NICHT auftauchen,
        // wenn keine Kategorie gewählt wurde.

        const result = await db.collection('Entry').insertOne(newEntry);
        res.status(201).json(result);
    } catch (err) {
        console.error(err); // Damit du im Terminal genau siehst, was schief geht
        res.status(400).json({ error: "Validierungsfehler (Schema)", details: err.message });
    }
});

// --- COMMENT ROUTES ---

app.post('/api/comments', async (req, res) => {
    try {
        const { text, entryId, authorId } = req.body;
        const newComment = {
            text,
            likes: Long.fromNumber(0),
            creationDate: new Date(),
            entryId: new ObjectId(entryId),
            authorId: authorId // String
        };
        const result = await db.collection('Comment').insertOne(newComment);
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: "Kommentar konnte nicht gespeichert werden", details: err.message });
    }
});

// --- CATEGORY ROUTES ---

app.get('/api/categories', async (req, res) => {
    const categories = await db.collection('Category').find().toArray();
    res.json(categories);
});

app.post('/api/categories', async (req, res) => {
    try {
        const result = await db.collection('Category').insertOne({ category: req.body.category });
        res.status(201).json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

connectDB().then(() => {
    app.listen(5000, () => console.log("Server läuft auf http://localhost:5000"));
});