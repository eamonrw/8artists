// Usage: node artistServer.js [PORT NUMBER]
// Example: node artistServer.js 4000

const http = require('https');
const path = require("path");
const express = require("express");
const axios = require('axios');
const fs = require('fs');
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })

const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@8artists.28rdvyn.mongodb.net/?appName=8artists`;
const databaseAndCollection = { db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION };

const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

process.stdin.setEncoding("utf8");

if (process.argv.length != 3) {
    process.stdout.write("Usage artistServer.js portNumber");
    process.exit(1);
}

let portNumber = process.argv[2];

app.use(express.static(__dirname + '/public'));
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));

let currentUser;

app.get("/", (request, response) => {
    response.redirect("/home");
});
app.get("/home", (request, response) => {
    response.render("index");
});
app.get("/ranker", (request, response) => {
    currentUser = request.query.username;

    if (currentUser)
        response.render("ranker", {username: currentUser});
    else
        response.render("error", {errorMessage: "You can't go here without a username."})
});
app.get("/ranker/savedList", (request, response) => {
    client.db(databaseAndCollection.db)
    .collection(databaseAndCollection.collection)
    .findOne({username: currentUser})
    .then((result) => {
        response.json(result);
    });
});
app.post("/ranker", (request, response) => {
    let doc = {username: currentUser, rankings: JSON.parse(request.body.rankings)};
    client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .replaceOne({username: currentUser}, doc, {upsert: true})
        .then((result) => {
            response.render("saved", {username: currentUser})
        });
});

// /list?user=myUserName
app.get("/list", (request, response) => {
    const username = request.query.username;

    if (username) {
        client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .findOne({username: username})
        .then((result) => {
            let fList = "<h3>This user has not created a list. Sorry!</h3>";
            if (result && result.rankings) {
                fList = `<ol type="1">`;
                for (const [i, a] of result.rankings.entries()) {
                    fList += `
                        <li>
                            <div class="list-item">
                                <div class="artist-rank">${i + 1}</div>
                                <div class="artist-photo">
                                    <img alt="Artist profile picture" src="${a.photoURL}" width="120"
                                        height="120">
                                </div>
                                <div class="artist-info">
                                    <h4>${a.name}</h4>
                                    <h5>${a.monthlyListeners}</h5>
                                    <h5><a href="${a.spotifyLink}">View on Spotify</a></h5>
                                </div>
                            </div>
                        </li>
                        `;
                }
                fList += `</ol>`;
            }

            response.render("viewer", {username: username, formattedList: fList});
        });
    }
    else
        response.render("error", {errorMessage: "You can't go here without a username."})
});

app.get("/ranker/search", async (request, response) => {
    let artistData = {artists: []};

    const options = {
        method: 'GET',
        url: 'https://spotify23.p.rapidapi.com/search/',
        params: {
            q: request.query.artistName,
            type: 'artists',
            offset: '0',
            limit: '5',
            numberOfTopResults: '5'
        },
        headers: {
            'X-RapidAPI-Key': '2c150bc4a4msh832ff974a8b058ap16da21jsn4b687556470b',
            'X-RapidAPI-Host': 'spotify23.p.rapidapi.com'
        }
    };

    try {
        const res = await axios.request(options);

        for (item of res.data.artists.items) {
            let a = {name: item.data.profile.name, photoURL: item.data.visuals.avatarImage?.sources[0].url ?? '/image/default.jpg'};

            a.artistId = item.data.uri.replace("spotify:artist:", "");

            const ops = {
                method: 'GET',
                url: 'https://spotify23.p.rapidapi.com/artist_overview/',
                params: {
                  id: a.artistId
                },
                headers: {
                  'X-RapidAPI-Key': '2c150bc4a4msh832ff974a8b058ap16da21jsn4b687556470b',
                  'X-RapidAPI-Host': 'spotify23.p.rapidapi.com'
                }
            };

            try {
                const res2 = await axios.request(ops);

                a.spotifyLink = res2.data.data.artist.sharingInfo.shareUrl;
                a.monthlyListeners = res2.data.data.artist.stats.monthlyListeners ?? 0;

                artistData.artists.push(a);
            } catch (error) {
                console.error(error);
            }
        }

        response.json(artistData);
    } catch (error) {
        console.error(error);
    }
});

async function main() {
    app.listen(portNumber);
    try {
        await client.connect();
    } catch (e) {
        console.error(e);
    }
    console.log(`Web server started and running at https://eight-artists.onrender.com (Port ${portNumber})`);

    const prompt = "Stop to shutdown the server: ";
    process.stdout.write(prompt);
    process.stdin.on("readable", function () {
        let dataInput = process.stdin.read();
        if (dataInput !== null) {
            let command = dataInput.trim();

            if (command.toLowerCase() === "stop") {
                process.stdout.write("Shutting down the server\n");
                client.close().then(() => process.exit(0));
                process.exit(0);
            }
            else {
                process.stdout.write(`Invalid command: ${command}\n`);
            }

            process.stdout.write(prompt);
            process.stdin.resume();
        }
    });
}

main().catch(console.error);