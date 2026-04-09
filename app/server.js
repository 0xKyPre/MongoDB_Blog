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

        const newEntry = {
            title: title,
            description: description,
            creationDate: new Date(),
            editDates: [],
            impressionCount: Long.fromNumber(0),
            commentsAllowed: Boolean(commentsAllowed),
            content: {
                text: content.text || "",
                links: content.links || [],
                images: content.images || []
            },
            authorId: authorId
        };

        if (categoryId && categoryId.trim() !== "" && categoryId.length === 24) {
            newEntry.categoryId = new ObjectId(categoryId);
        }

        const result = await db.collection('Entry').insertOne(newEntry);
        res.status(201).json(result);
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Validierungsfehler (Schema)", details: err.message });
    }
});

app.put('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({ error: "Ungültige Entry-ID" });
        }

        const existing = await db.collection('Entry').findOne({ _id: new ObjectId(id) });
        if (!existing) {
            return res.status(404).json({ error: "Beitrag nicht gefunden" });
        }

        const { title, description, content, commentsAllowed, authorId, categoryId } = req.body;

        if (!authorId || existing.authorId !== authorId) {
            return res.status(403).json({ error: "Nicht berechtigt, diesen Beitrag zu bearbeiten" });
        }

        const setDoc = {
            title: title,
            description: description,
            commentsAllowed: Boolean(commentsAllowed),
            'content.text': (content && content.text) ? content.text : "",
            'content.links': (content && Array.isArray(content.links)) ? content.links : []
        };

        if (content && Object.prototype.hasOwnProperty.call(content, 'images')) {
            setDoc['content.images'] = Array.isArray(content.images) ? content.images : [];
        }

        const update = {
            $set: setDoc,
            $push: { editDates: new Date() }
        };

        if (categoryId && typeof categoryId === 'string' && categoryId.trim() !== "" && categoryId.length === 24 && ObjectId.isValid(categoryId)) {
            update.$set.categoryId = new ObjectId(categoryId);
        } else {
            update.$unset = { categoryId: "" };
        }

        const result = await db.collection('Entry').findOneAndUpdate(
            { _id: new ObjectId(id) },
            update,
            { returnDocument: 'after' }
        );

        res.json({ success: true, entry: result.value });
    } catch (err) {
        console.error(err);
        res.status(400).json({ error: "Update fehlgeschlagen", details: err.message });
    }
});

// --- COMMENT ROUTES ---

app.get('/api/comments', async (req, res) => {
    try {
        const { entryId } = req.query;
        const filter = {};

        if (entryId) {
            if (!ObjectId.isValid(entryId)) {
                return res.status(400).json({ error: "Ungültige Entry-ID" });
            }
            filter.entryId = new ObjectId(entryId);
        }

        const comments = await db
            .collection('Comment')
            .find(filter)
            .sort({ creationDate: 1 })
            .toArray();

        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/comments', async (req, res) => {
    try {
        const { text, entryId, authorId } = req.body;
        const trimmedText = (text || "").toString().trim();

        if (!trimmedText) {
            return res.status(400).json({ error: "Kommentartext fehlt" });
        }

        if (!entryId || !ObjectId.isValid(entryId)) {
            return res.status(400).json({ error: "Ungültige Entry-ID" });
        }

        const entry = await db.collection('Entry').findOne({ _id: new ObjectId(entryId) });
        if (!entry) {
            return res.status(404).json({ error: "Beitrag nicht gefunden" });
        }
        if (!entry.commentsAllowed) {
            return res.status(403).json({ error: "Kommentare sind für diesen Beitrag deaktiviert" });
        }

        if (!authorId) {
            return res.status(400).json({ error: "authorId fehlt" });
        }

        const newComment = {
            text: trimmedText,
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