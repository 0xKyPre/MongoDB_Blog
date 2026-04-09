const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Verbindung
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/blogDB';
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB verbunden');
    await seedDatabase();
  })
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

// schema to track if the database has been seeded
const seedSchema = new mongoose.Schema({
  seeded: { type: Boolean, default: false },
  seedDate: { type: Date }
});

// Models
const User = mongoose.model('User', userSchema);
const BlogEntry = mongoose.model('BlogEntry', blogEntrySchema);
const Seed = mongoose.model('Seed', seedSchema);

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
    if (error.code === 11000) { // duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ error: `${field} already exists` });
    }
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

async function seedDatabase() {
  try {
    const seedRecord = await Seed.findOne();
    if (seedRecord && seedRecord.seeded) {
      console.log('✓ Database already seeded on ' + seedRecord.seedDate);
      return;
    }

    console.log('Seeding database with sample data...');

    const users = await User.insertMany([
      { username: 'alice', name: { firstname: 'Alice', lastname: 'Johnson' }, email: 'alice@example.com', password: 'pass123' },
      { username: 'bob', name: { firstname: 'Bob', lastname: 'Smith' }, email: 'bob@example.com', password: 'pass123' },
      { username: 'charlie', name: { firstname: 'Charlie', lastname: 'Brown' }, email: 'charlie@example.com', password: 'pass123' },
      { username: 'diana', name: { firstname: 'Diana', lastname: 'Prince' }, email: 'diana@example.com', password: 'pass123' },
      { username: 'eve', name: { firstname: 'Eve', lastname: 'Wilson' }, email: 'eve@example.com', password: 'pass123' },
      { username: 'admin', name: { firstname: 'Admin', lastname: 'User' }, email: 'admin@example.com', password: 'admin123' }
    ]);

    const entries = await BlogEntry.insertMany([
      {
        title: 'Getting Started with MongoDB',
        author: { _id: users[0]._id, username: 'alice', name: users[0].name },
        description: 'A beginner guide to MongoDB databases',
        categories: ['database', 'mongodb', 'tutorial'],
        content: [
          { type: 'text', data: 'MongoDB is a popular NoSQL database...' },
          { type: 'text', data: 'It stores data in JSON-like documents.' },
          { type: 'link', data: 'https://www.mongodb.com' }
        ],
        commentsAllowed: true,
        comments: [
          { author: 'bob', text: 'Great tutorial!', date: new Date() },
          { author: 'charlie', text: 'Very helpful', date: new Date() }
        ]
      },
      {
        title: 'Web Development Best Practices',
        author: { _id: users[1]._id, username: 'bob', name: users[1].name },
        description: 'Learn the best practices for modern web development',
        categories: ['web', 'development', 'best-practices'],
        content: [
          { type: 'text', data: 'Always use HTTPS for secure communications.' },
          { type: 'text', data: 'Implement proper error handling.' },
          { type: 'link', data: 'https://developer.mozilla.org' }
        ],
        commentsAllowed: true,
        comments: [
          { author: 'alice', text: 'Excellent points', date: new Date() },
          { author: 'diana', text: 'Following these myself', date: new Date() }
        ]
      },
      {
        title: 'The Art of Photography',
        author: { _id: users[2]._id, username: 'charlie', name: users[2].name },
        description: 'Discover the beauty of photography',
        categories: ['photography', 'art', 'creative'],
        content: [
          { type: 'text', data: 'Photography captures moments in time.' },
          { type: 'image', data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k' }
        ],
        commentsAllowed: true
      },
      {
        title: 'Travel Guide: Europe',
        author: { _id: users[3]._id, username: 'diana', name: users[3].name },
        description: 'Explore the wonders of Europe',
        categories: ['travel', 'europe', 'guide'],
        content: [
          { type: 'text', data: 'Europe offers diverse cultures and beautiful landscapes.' },
          { type: 'link', data: 'https://www.lonelyplanet.com/europe' },
          { type: 'text', data: 'Visit Paris, Rome, Barcelona and more!' }
        ],
        commentsAllowed: true,
        comments: [
          { author: 'eve', text: 'Planning my trip now!', date: new Date() }
        ]
      },
      {
        title: 'Advanced JavaScript Techniques',
        author: { _id: users[4]._id, username: 'eve', name: users[4].name },
        description: 'Master advanced JavaScript concepts',
        categories: ['javascript', 'programming', 'advanced'],
        content: [
          { type: 'text', data: 'Higher-order functions allow for powerful abstractions.' },
          { type: 'text', data: 'Closures enable private state in JavaScript.' },
          { type: 'link', data: 'https://javascript.info' }
        ],
        commentsAllowed: false
      },
      {
        title: 'Cooking Italian Pasta',
        author: { _id: users[5]._id, username: 'admin', name: users[5].name },
        description: 'Learn to make authentic Italian pasta',
        categories: ['cooking', 'italian', 'food'],
        content: [
          { type: 'text', data: 'Traditional pasta is made with durum wheat semolina.' },
          { type: 'text', data: 'The pasta making process is an art form.' },
          { type: 'image', data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k' }
        ],
        commentsAllowed: true,
        comments: []
      }
    ]);

    await Seed.deleteMany({});
    await Seed.create({ seeded: true, seedDate: new Date() });

    console.log('Database seeded successfully!');
    console.log(` - ${users.length} users created`);
    console.log(` - ${entries.length} blog entries created`);
    console.log(' - 5 comments added');
  } catch (error) {
    if (error.code === 11000) {
      console.log('Database already has data, skipping seed');
    } else {
      console.error('Error seeding database:', error.message);
    }
  }
}