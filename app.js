const express = require('express');
const bp = require('body-parser');
const morgan = require('morgan');
const port = process.env.PORT || 8000;

// Use dotenv for app config
require('dotenv').config();

const app = express();

// Use bodyparser middleware
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));

// Use logging middleware. Can be made more verbose later, but this should be fine for now
app.use(morgan('tiny'));

// Import the separated routes
require('./routes/api')(app);

// Start the app
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
