// Login Check
db.users.find({ username: "testuser", password: "securepassword" });

// Entries mit mehr als einem Bild (Content ist ein Array oder Objekt)
db.entries.find({ "content.images.1": { $exists: true } });

// Title im Content enthalten (Regex)
db.entries.find({ $expr: { $regexMatch: { input: "$content.text", regex: "$title", options: "i" } } });

// Zweitältester Eintrag
db.entries.find().sort({ creationDate: 1 }).skip(1).limit(1);

// Indexe setzen
db.users.createIndex({ username: 1 }, { unique: true });
db.entries.createIndex({ title: 1, "author.username": 1 }, { unique: true });

// Upsert eines Eintrags
db.entries.updateOne(
  { title: "Mein Blog", "author.username": "admin" },
  { $set: { description: "Update text...", editDates: [new Date()] } },
  { upsert: true }
);