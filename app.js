const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

// Use dotenv for app config
require('dotenv').config();

// Import the separated routes
require('./routes/management')(app);
require('./routes/events')(app);

// Start the app
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
