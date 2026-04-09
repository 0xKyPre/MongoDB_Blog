const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Verbindung
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blogDB';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB verbunden'))
  .catch(err => console.error('Verbindungsfehler:', err));

// Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true }
  },
  email: { type: String, required: true },
  password: { type: String, required: true }
});

const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const blogEntrySchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    name: {
      firstname: { type: String },
      lastname: { type: String }
    }
  },
  description: { type: String },
  creationDate: { type: Date, default: Date.now },
  editDates: [{ type: Date }],
  impressionCount: { type: Number, default: 0 },
  categories: [{ type: String }],
  content: [{
    type: { type: String, required: true }, // 'text', 'link', 'image'
    data: { type: mongoose.Schema.Types.Mixed, required: true }
  }],
  commentsAllowed: { type: Boolean, default: true },
  comments: [commentSchema]
});

// Indexes
blogEntrySchema.index({ 'author.username': 1 });
blogEntrySchema.index({ title: 1, 'author.username': 1 }, { unique: true });

// Models
const User = mongoose.model('User', userSchema);
const BlogEntry = mongoose.model('BlogEntry', blogEntrySchema);

// Routes

// Users
app.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const userResponse = user.toObject();
    delete userResponse.password;
    res.status(201).json(userResponse);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Blog Entries
app.get('/entries', async (req, res) => {
  try {
    const entries = await BlogEntry.find().sort({ creationDate: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/entries/:id', async (req, res) => {
  try {
    const entry = await BlogEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    // Increment impression count
    entry.impressionCount += 1;
    await entry.save();

    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/entries', async (req, res) => {
  try {
    // Get author details
    const author = await User.findById(req.body.author);
    if (!author) {
      return res.status(400).json({ error: 'Autor nicht gefunden' });
    }

    const entryData = {
      ...req.body,
      author: {
        _id: author._id,
        username: author.username,
        name: {
          firstname: author.name.firstname,
          lastname: author.name.lastname
        }
      }
    };

    const entry = new BlogEntry(entryData);
    await entry.save();
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/entries/:id', async (req, res) => {
  try {
    const entry = await BlogEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    // Update edit dates
    entry.editDates.push(new Date());

    // Update other fields
    Object.keys(req.body).forEach(key => {
      if (key !== '_id' && key !== 'creationDate' && key !== 'impressionCount') {
        entry[key] = req.body[key];
      }
    });

    await entry.save();
    res.json(entry);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/entries/:id', async (req, res) => {
  try {
    const entry = await BlogEntry.findByIdAndDelete(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }
    res.json({ message: 'Eintrag gelöscht' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Comments
app.post('/entries/:id/comments', async (req, res) => {
  try {
    const entry = await BlogEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ error: 'Eintrag nicht gefunden' });
    }

    if (!entry.commentsAllowed) {
      return res.status(400).json({ error: 'Kommentare sind für diesen Eintrag deaktiviert' });
    }

    entry.comments.push(req.body);
    await entry.save();

    res.status(201).json(entry.comments[entry.comments.length - 1]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Query endpoints for the exercise requirements
app.get('/queries/users/login', async (req, res) => {
  try {
    const { username, password } = req.query;
    const user = await User.findOne({ username, password });
    res.json(user ? { found: true, user } : { found: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/entries/by-author/:username', async (req, res) => {
  try {
    const entries = await BlogEntry.find({ 'author.username': req.params.username });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/entries/no-additional-fields', async (req, res) => {
  try {
    // Find entries where content array has only text type or is empty
    const entries = await BlogEntry.find({
      $or: [
        { content: { $exists: false } },
        { content: { $size: 0 } },
        { content: { $all: [{ type: 'text' }] } }
      ]
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/entries/multiple-images', async (req, res) => {
  try {
    const entries = await BlogEntry.aggregate([
      {
        $addFields: {
          imageCount: {
            $size: {
              $filter: {
                input: '$content',
                cond: { $eq: ['$$this.type', 'image'] }
              }
            }
          }
        }
      },
      { $match: { imageCount: { $gt: 1 } } }
    ]);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/entries/with-images', async (req, res) => {
  try {
    const entries = await BlogEntry.find({
      content: {
        $elemMatch: { type: 'image' }
      }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/entries/author-lastname-or-admin', async (req, res) => {
  try {
    const entries = await BlogEntry.find({
      $or: [
        { 'author.name.lastname': req.query.lastname },
        { 'author.username': 'admin' }
      ]
    }).find({
      'author.username': { $ne: 'Guest' }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/entries/title-in-content', async (req, res) => {
  try {
    const entries = await BlogEntry.find({
      $expr: {
        $gt: [
          { $indexOfCP: ['$content', '$title'] },
          -1
        ]
      }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/users/sorted', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ username: 1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/entries/newest/:count', async (req, res) => {
  try {
    const count = parseInt(req.params.count) || 2;
    const entries = await BlogEntry.find()
      .sort({ creationDate: -1 })
      .limit(count);
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/entries/second-oldest', async (req, res) => {
  try {
    const entries = await BlogEntry.find()
      .sort({ creationDate: 1 })
      .limit(2);
    res.json(entries[1] || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/entries/last-week-with-links', async (req, res) => {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const entries = await BlogEntry.find({
      creationDate: { $gte: oneWeekAgo },
      content: {
        $elemMatch: { type: 'link' }
      }
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/queries/comments/newest/:username', async (req, res) => {
  try {
    const entries = await BlogEntry.find({ 'author.username': req.params.username });
    const comments = [];

    entries.forEach(entry => {
      entry.comments.forEach(comment => {
        comments.push({
          ...comment.toObject(),
          entryTitle: entry.title,
          entryId: entry._id
        });
      });
    });

    comments.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(comments.slice(0, 2));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Backend läuft auf http://localhost:${PORT}`));