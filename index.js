const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

const FIREBASE_URL = "https://watchxbot-default-rtdb.firebaseio.com";
const TMDB_KEY = "YOUR_TMDB_API_KEY";

app.post('/webhook', async (req, res) => {
  const intent = req.body.queryResult.intent.displayName;
  
  if (intent === 'GetRecommendation') {
    const snapshot = await axios.get(`${FIREBASE_URL}/shows.json`);
    const shows = Object.values(snapshot.data);
    
    const genreCount = {};
    shows.forEach(show => {
      if (show.type) {
        genreCount[show.type] = (genreCount[show.type] || 0) + 1;
      }
    });
    
    const topGenre = Object.keys(genreCount)
      .sort((a,b) => genreCount[b] - genreCount[a])[0];
    
    const tmdb = await axios.get(
      `https://api.themoviedb.org/3/search/tv?api_key=${08133e4510198de680f0b5d8b148d753}&query=${topGenre}`
    );
    
    const results = tmdb.data.results.slice(0,3)
      .map(s => s.name).join(', ');
    
    res.json({
      fulfillmentText: `Based on your taste, you'll love: ${results}!`
    });
  }
});

app.listen(3000, () => console.log('Webhook running!'));
