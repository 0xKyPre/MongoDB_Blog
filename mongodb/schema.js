use blog;
db.User.drop();
db.Entry.drop();
db.Category.drop();
db.Comment.drop();

db.createCollection("User", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            title: "User Object Validation",
            additionalProperties: false,
            required: ["_id", "displayName", "password", "birthday"],
            properties: {
                _id: {
                    bsonType: "string",
                    description: "'_id' must be a string and is required"
                },
                password: {
                    bsonType: "string",
                    description: "'password' must be a string and is required"
                },
                displayName: {
                    bsonType: "string",
                    description: "'displayName' must be a string and is required"
                },
                birthday: {
                    bsonType: "date",
                    description: "'birthday' must be a date and is required"
                },
                country: {
                    bsonType: "string",
                    description: "'country' must be a string"
                }
            }
        }
    }
});

db.createCollection("Entry", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            title: "Entry Object Validation",
            additionalProperties: false,
            required: ["title", "description", "creationDate", "editDates", "impressionCount", "content", "commentsAllowed"],
            properties: {
                title: {
                    bsonType: "string",
                    description: "'title' must be a string and is required"
                },
                description: {
                    bsonType: "string",
                    description: "'description' must be a string and is required"
                },
                creationDate: {
                    bsonType: "date",
                    description: "'creationDate' must be a date and is required"
                },
                editDates: {
                    bsonType: "array",
                    items: {
                        bsonType: "date"
                    },
                    description: "'editDates' must be an array of dates and is required"
                },
                impressionCount: {
                    bsonType: "long",
                    description: "'impressionCount' must be a number and is required"
                },
                commentsAllowed: {
                    bsonType: "bool",
                    description: "'commentsAllowed' must be a bool and is required"
                },
                content: {
                    bsonType: "object",
                    additionalProperties: false,
                    required: ["text"],
                    properties: {
                        text: {
                            bsonType: "string",
                            description: "'text' must be a string and is required"
                        },
                        links: {
                            bsonType: "array",
                            items: {
                                bsonType: "string"
                            },
                            description: "'links' must be an array of strings"
                        },
                        images: {
                            bsonType: "array",
                            items: {
                                bsonType: "string"
                            },
                            description: "'images' must be an array of base64 encoded images"
                        }
                    }
                },
                authorId: { bsonType: "string" },    // foreign key User._id
                categoryId: { bsonType: "string" }   // foreign key Category._id
            }
        }
    }
});

db.createCollection("Category", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            title: "Category Object Validation",
            additionalProperties: false,
            required: ["category"],
            properties: {
                category: {
                    bsonType: "string",
                    description: "'category' must be a string and is required"
                }
            }
        }
    }
});

db.createCollection("Comment", {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            title: "Comment Object Validation",
            additionalProperties: false,
            required: ["text", "likes", "creationDate"],
            properties: {
                text: {
                    bsonType: "string",
                    description: "'text' must be a string and is required"
                },
                likes: {
                    bsonType: "long",
                    description: "'likes' must be a long and is required"
                },
                creationDate: {
                    bsonType: "date",
                    description: "'creationDate' must be a date and is required"
                },
                entryId: { bsonType: "string" },     // foreign key Entry._id
                authorId: { bsonType: "string" }     // foreign key User._id
            }
        }
    }
});

db.User.createIndex({ _id: 1 }, { unique: true });

db.Entry.createIndex({ title: 1, authorId: 1 }, { unique: true });