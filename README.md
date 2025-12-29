# 8Artists

A simple web app to build and share your personal Top 8 music artists. Create a username, search for artists, add them to your list, reorder them, and save to view later or share.

Important: The RapidAPI Spotify API used for artist search has been deprecated and is no longer supported. As a result, the search feature is currently non-functional. See Known Issues below.

## Live Site
- Hosted URL: https://eight-artists.onrender.com

## Overview
- Create a user list and rank up to 8 favorite artists.
- Save your rankings to MongoDB and retrieve them later.
- Share a read-only view of any user's saved list.

## Tech Stack
- **Runtime:** Node.js
- **Server:** Express
- **Views:** EJS templates
- **Database:** MongoDB Atlas
- **HTTP:** Axios
- **Config:** dotenv

## Project Structure
- [artistServer.js](artistServer.js): Express server, routes, MongoDB integration, RapidAPI calls.
- [templates/](templates): EJS views (`index.ejs`, `ranker.ejs`, `viewer.ejs`, `saved.ejs`, `error.ejs`).
- [public/](public): Static assets (CSS, images).
- [credentialsDontPost/](credentialsDontPost): Local-only `.env` file with MongoDB credentials (not committed).

## Setup
1. Install dependencies:

```bash
npm install
```

2. Create your environment file at [credentialsDontPost/.env](credentialsDontPost/.env) with the following variables:

```env
MONGO_DB_USERNAME=yourMongoUsername
MONGO_DB_PASSWORD=yourMongoPassword
MONGO_DB_NAME=yourDatabaseName
MONGO_COLLECTION=yourCollectionName
```

3. Start the server (choose a port, e.g. 4000):

```bash
node artistServer.js 4000
```

4. Open the app:
- Home: http://localhost:4000/home
- Ranker (requires username): http://localhost:4000/ranker?username=YOUR_NAME
- Viewer (read-only): http://localhost:4000/list?username=ANY_NAME

## Usage
- From Home, enter a username to build your list.
- On the Ranker page, add artists to your list (up to 8), reorder, and save.
- Use the Viewer page to see any saved list by username.

## Routes
- `GET /home`: Landing page.
- `GET /ranker?username=YOUR_NAME`: Ranking interface for a given user.
- `GET /ranker/savedList`: Returns the current user's saved rankings as JSON.
- `POST /ranker`: Saves or updates the current user's rankings.
- `GET /list?username=ANY_NAME`: Read-only view of an existing user's list.
- `GET /ranker/search?artistName=QUERY`: Artist search (currently disabled; see below).

## Known Issues
- **RapidAPI Spotify Deprecated:** The app previously used RapidAPI’s `spotify23` endpoints for search and artist overview. These endpoints are no longer supported, so the search feature does not return results at this time.
- **Next Steps:** To restore search, consider migrating to:
	- Spotify Web API (requires OAuth and proper authorization flow)
	- Alternative public datasets/APIs (e.g., MusicBrainz for artist data) plus links/embeds to Spotify

## Deployment Notes
- The server prints a banner message referencing a hosted URL; when running locally, use `http://localhost:PORT`.
- The server listens on the port you pass as an argument (e.g., `4000`).

## License
This project is licensed under the ISC License. See [LICENSE](LICENSE).
