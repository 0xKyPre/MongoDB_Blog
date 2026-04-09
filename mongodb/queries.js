use blog;

//Query 1: all blog-users where username & password match given values
db.User.find({_id: "alice", password:"password123"});

//Query 2: all blog-entries being written by a certain blog-user (username)
db.Entry.find({ authorId: "alice" });

//Query 3: all blog-entries that does not contain ANY information in one of your additional fields (one of the additionalfields you added to your content).
db.Entry.find({"content.links": {$size: 0}});

//Query 4: all blog-entries where the entry has more than 1 image
db.Entry.find({"content.images": {$exists: true, $type: 'array', $ne: [] }});

//Query 5 ???: all blog-entries where the entry contains image(s) and links
db.Entry.find({"content.images": {$exists: true, $type: 'array', $ne: [] }, "content.links": {$exists: true, $type: "array", $ne: []}});

//Query 6: all blog-entries whose author either has a given lastname (we don't have lastname so we use displayName) or has the value ‘admin’ but not ‘Guest’
db.Entry.aggregate(
    [
        {
            $lookup: {
                from: "User",
                localField: "authorId",
                foreignField: "_id",
                as: "author"
            }
        },
        {
            $match: {

                $or: [
                        { "author.displayName": "Alice Johnson" },
                        {$and: [
                            { "author.displayName": {$ne: "Guest"}},
                            {authorId: "admin"}
                        ]}
                    ]
            }
        },
        {
            $project: {
                author: 0
            }
        }
    ]
);

//Query 7: all blog-entries where the title is mentioned in the content as well.
db.Entry.aggregate([
        {
            $match: {
                $expr: {
                    $regexMatch: {
                        input: "$content.text",
                        regex: "$title",
                        options: "i"
                    }
                }
            }
        }
    ]
);


//Query 8: all BlogUser sorted ascending by username.
db.User.aggregate(
    [
        {
            $sort: {_id: 1}
        }
    ]
);

//Query 9: the newest (creationDate) 2 blog-entries.
db.Entry.aggregate(
    [
        {
            $sort: {creationDate: -1}
        },
        {
            $limit: 1
        }
    ]
);

//Query 10: second oldest blog entry
db.Entry.aggregate(
    [
        {
            $sort: {creationDate: 1}
        },
        {
            $skip: 1
        },
        {
            $limit: 1
        }

    ]
);

//all blog-entries created within the last week containing a link
db.Entry.find(
    {
        creationDate: {$gt: new Date(new Date().getTime() - 1000*60*60*24*7)},
        "content.links": {$exists: 1, $type: "array",  $ne: []}
    }
);

//the 2 newest blog-comments added to a given username’s entries.
db.User.aggregate(
    [
        {
            $match: {
                _id: "alice"
            }
        },
        {
            $lookup: {
                from: "Entry",
                localField: "_id",
                foreignField: "authorId",
                as: "entries"
            }
        },
        {
            $lookup: {
                from: "Comment",
                localField: "entries._id",
                foreignField: "entryId",
                as: "comments"
            }
        },
        {
            $unwind: "$comments"
        },
        {
            $sort: {
                "comments.creationDate": -1
            }
        },
        {
            $limit: 2
        },
        {
            $project: {
                _id: 0,
                comments: 1
            }
        }
    ]
);