// Usage: node artistServer.js [PORT NUMBER]
// Example: node artistServer.js 4000

const http = require('https');
const path = require("path");
const express = require("express");
const fs = require('fs');
const app = express();
const bodyParser = require("body-parser");
require("dotenv").config({ path: path.resolve(__dirname, 'credentialsDontPost/.env') })

const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.lhbz01p.mongodb.net/?retryWrites=true&w=majority`;
const databaseAndCollection = { db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION };

const { MongoClient, ServerApiVersion } = require('mongodb');
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

process.stdin.setEncoding("utf8");

if (process.argv.length != 3) {
    process.stdout.write("Usage artistServer.js portNumber");
    process.exit(1);
}

let portNumber = process.argv[2];

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (request, response) => {
    response.render("index");
});
app.get("/apply", (request, response) => {
    response.render("application");
});
app.post("/processApplication", (request, response) => {
    const doc = { name: request.body.name, email: request.body.email, gpa: request.body.gpa, info: request.body.info };
    client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .insertOne(doc)
        .then((result) => {
            const variables = { ...doc, timestamp: new Date() };
            response.render("appconfirmation", variables);
        });
});
app.get("/reviewApplication", (request, response) => {
    response.render("reviewapp");
});
app.get("/processReviewApplication", (request, response) => {
    const email = request.query.email;
    let filter = { email: email };
    client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .findOne(filter)
        .then((result) => {
            if (result) {
                const variables = { ...result, timestamp: new Date() };
                response.render("appconfirmation", variables);
            }
            else {
                const variables = { name: 'NONE', email: 'NONE', gpa: 'NONE', info: 'NONE', timestamp: new Date() };
                response.render("appconfirmation", variables);
            }
        });
});
app.get("/adminGPA", (request, response) => {
    response.render("bygpa");
});
app.get("/processAdminGPA", (request, response) => {
    const gpa = request.query.gpa;
    let filter = { gpa: { $gte: gpa } };
    const cursor = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find(filter);
    cursor.toArray().then((result) => {
        let table = `<table border="1"><tr><th>Name</th><th>GPA</th></tr>`
        result.forEach(doc => table += `<tr><td>${doc.name}</td><td>${doc.gpa}</td></tr>`);
        table += `<table>`;

        const variables = { resultsTable: table };
        response.render("processgpa", variables);
    });
});
app.get("/adminRemove", (request, response) => {
    response.render("removeall");
});
app.post("/processAdminRemove", (request, response) => {
    client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({})
        .then((result) => {
            const variables = { numApps: result.deletedCount };
            response.render("removed", variables);
        });
});

async function main() {
    app.listen(portNumber);
    try {
        await client.connect();
    } catch (e) {
        console.error(e);
    }
    console.log(`Web server started and running at http://localhost:${portNumber}`);

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