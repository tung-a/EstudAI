// Load local .env into process.env so Expo/Metro sees EXPO_PUBLIC_* variables
// Usage: copy `.env.example` to `.env` and fill the values before running.
require('dotenv').config();

const appJson = require('./app.json');

module.exports = () => {
  // Return the expo config (we keep app.json's expo object). The important
  // part is that dotenv runs above and populates process.env for the bundler.
  return {
    ...appJson.expo,
    // keep any existing extras
    extra: {
      ...(appJson.expo.extra || {}),
    },
  };
};
