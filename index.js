const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const FIREBASE_URL = "https://watchxbot-default-rtdb.firebaseio.com";
const TMDB_KEY = "08133e4510198de680f0b5d8b148d753";

app.post('/webhook', async (req, res) => {
  try {

    console.log("Incoming request:", req.body);

    const intent = req.body.queryResult.intent.displayName;

    // Check correct Dialogflow intent
    if (intent === 'GetUserTaste') {

      // Get shows from Firebase
      const snapshot = await axios.get(`${FIREBASE_URL}/shows.json`);

      console.log("Firebase data loaded");

      const shows = snapshot.data
        ? Object.values(snapshot.data)
        : [];

      console.log("Total shows:", shows.length);

      // Count genres/types
      const genreCount = {};

      shows.forEach(show => {
        if (!show) return;
        if (show.type) {
          genreCount[show.type] = (genreCount[show.type] || 0) + 1;
          }
       });
      console.log("Genre count:", genreCount);

      // Find top genre
      const topGenre = Object.keys(genreCount)
        .sort((a, b) => genreCount[b] - genreCount[a])[0];

      console.log("Top genre:", topGenre);

      // TMDB API request
      const tmdb = await axios.get(
        `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${topGenre}`
      );

      console.log("TMDB success");

      // Extract results safely
      const results = tmdb.data.results
        ?.slice(0, 3)
        ?.map(item => item.name || item.title)
        ?.filter(Boolean)
        ?.join(', ') || "No recommendations found";

      console.log("Results:", results);

      // Send Dialogflow response
      return res.json({
        fulfillmentText: `Based on your taste, you'll love: ${results}!`
      });

    } else {

      return res.json({
        fulfillmentText: "Intent matched, but not GetUserTaste."
      });

    }

  } catch (err) {

    console.error(
      "FULL ERROR:",
      err.response?.data || err.message || err
    );

    return res.json({
      fulfillmentText: `Error: ${err.message}`
    });

  }
});

// Health check route
app.get('/', (req, res) => {
  res.send("WatchXBot webhook is running!");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Webhook running on port ${PORT}`);
});
