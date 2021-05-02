const express = require('express');
const bp = require('body-parser')
const port = process.env.PORT || 8000;

// Use dotenv for app config
require('dotenv').config();

const app = express();

app.use(bp.json())
app.use(bp.urlencoded({ extended: true }))

// Import the separated routes
require('./routes/api')(app);

// Start the app
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
