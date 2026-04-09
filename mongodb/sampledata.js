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
    description: "An introduction to technology trends.",
    creationDate: new Date(),
    editDates: [],
    impressionCount: NumberLong(0),
    commentsAllowed: true,
    content: { text: "This is my first post about technology!", links: ["https://tech.example.com"], images: [] },
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