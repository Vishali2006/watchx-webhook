const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const FIREBASE_URL = "https://watchxbot-default-rtdb.firebaseio.com";
const TMDB_KEY = "08133e4510198de680f0b5d8b148d753";

app.post('/webhook', async (req, res) => {
  try {
    const intent = req.body.queryResult.intent.displayName;
    
    if (intent === 'GetUserTaste') {
      const snapshot = await axios.get(`${FIREBASE_URL}/shows.json`);
      console.log(snapshot.data);
      const shows = snapshot.data ? Object.values(snapshot.data) : [];
      
      const genreCount = {};
      shows.forEach(show => {
        if (show.type) {
          genreCount[show.type] = (genreCount[show.type] || 0) + 1;
        }
      });
      
      const topGenre = Object.keys(genreCount)
        .sort((a,b) => genreCount[b] - genreCount[a])[0];
      
      const tmdb = await axios.get(
        `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_KEY}&query=${topGenre}`
      );
      
      const results = tmdb.data.results
        ?.slice(0,3)
        ?.map(s => s.name || s.title)
        ?.filter(Boolean)
        ?.join(', ') || "No recommendations found";
      
      res.json({
        fulfillmentText: `Based on your taste, you'll love: ${results}!`
      });
    } else {
      res.json({
        fulfillmentText: "Hey! Tell me what kind of shows you like!"
      });
    }
  } catch(err) {
    console.error(err);
    res.json({
      fulfillmentText: "Sorry something went wrong!"
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Webhook running on port ${PORT}`));
