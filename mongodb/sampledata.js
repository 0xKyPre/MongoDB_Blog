use blog;

// Users
db.User.insertMany([
    { _id: "alice", displayName: "Alice Johnson", password: "password123", birthday: new Date("1990-04-15"), country: "USA" },
    { _id: "bob", displayName: "Bob Smith", password: "securePass", birthday: new Date("1985-09-20"), country: "Canada" }
]);

// Categories (ObjectIds auto-generated)
const techCat = db.Category.insertOne({ category: "Technology" }).insertedId;
const travelCat = db.Category.insertOne({ category: "Travel" }).insertedId;
const foodCat = db.Category.insertOne({ category: "Food" }).insertedId;

// Entries (ObjectIds auto-generated)
const entry1Id = db.Entry.insertOne({
    title: "My First Tech Blog",
    description: "An introduction to technology trends",
    creationDate: new Date(),
    editDates: [],
    impressionCount: NumberLong(0),
    commentsAllowed: true,
    content: { text: "This is my first post about technology!, My First Tech Blog", links: ["https://tech.example.com"], images: [] },
    authorId: "alice",       // string
    categoryId: techCat      // ObjectId
}).insertedId;

const entry2Id = db.Entry.insertOne({
    title: "Exploring Italy",
    description: "Travel diary of my Italy trip.",
    creationDate: new Date(),
    editDates: [],
    impressionCount: NumberLong(0),
    commentsAllowed: true,
    content: { text: "Italy is amazing! Here’s what I saw...", links: [], images: ["base64image1","base64image2"] },
    authorId: "bob",
    categoryId: travelCat
}).insertedId;

// Comments
db.Comment.insertMany([
    { text: "Great post, very informative!", likes: NumberLong(3), creationDate: new Date(), entryId: entry1Id, authorId: "bob" },
    { text: "Thanks for sharing your travel experience!", likes: NumberLong(5), creationDate: new Date(), entryId: entry2Id, authorId: "alice" }
]);

// -----------------------
// Additional Users
// -----------------------
db.User.insertMany([
    { _id: "carol", displayName: "Carol White", password: "passCarol1", birthday: new Date("1992-07-10"), country: "UK" },
    { _id: "dave", displayName: "Dave Brown", password: "davePass99", birthday: new Date("1988-02-25"), country: "Australia" },
    { _id: "eve", displayName: "Eve Black", password: "evePass77", birthday: new Date("1995-11-05"), country: "Germany" }
]);

// -----------------------
// Additional Entry for Alice
// -----------------------
const entry3Id = db.Entry.insertOne({
    title: "Advanced Tech Thoughts",
    description: "Alice shares advanced insights on tech trends.",
    creationDate: new Date(),
    editDates: [],
    impressionCount: NumberLong(0),
    commentsAllowed: true,
    content: {
        text: "Let’s explore some deep tech insights in AI and blockchain...",
        links: ["https://advancedtech.example.com"],
        images: []
    },
    authorId: "alice",
    categoryId: db.Category.findOne({ category: "Technology" })._id
}).insertedId;

// -----------------------
// Comments on original posts
// -----------------------
db.Comment.insertMany([
    // Comments on "My First Tech Blog" (Alice)
    { text: "Interesting introduction to tech!", likes: NumberLong(2), creationDate: new Date(), entryId: db.Entry.findOne({ title: "My First Tech Blog" })._id, authorId: "carol" },
    { text: "Thanks Alice, very helpful!", likes: NumberLong(1), creationDate: new Date(), entryId: db.Entry.findOne({ title: "My First Tech Blog" })._id, authorId: "dave" },

    // Comments on "Exploring Italy" (Bob)
    { text: "Looks like a fun trip!", likes: NumberLong(3), creationDate: new Date(), entryId: db.Entry.findOne({ title: "Exploring Italy" })._id, authorId: "carol" },
    { text: "I want to visit Italy too!", likes: NumberLong(2), creationDate: new Date(), entryId: db.Entry.findOne({ title: "Exploring Italy" })._id, authorId: "eve" },

    // Comments on Alice’s new post
    { text: "Great insights, Alice!", likes: NumberLong(5), creationDate: new Date(), entryId: entry3Id, authorId: "bob" },
    { text: "Loved the deep dive into AI!", likes: NumberLong(4), creationDate: new Date(), entryId: entry3Id, authorId: "eve" }
]);