const express = require('express');
const app = express();

// Import the separated routes
require('./routes/management')(app)
require('./routes/events')(app)

// Start the app on port 3000
app.listen(3000, () => {
    console.log('App running on port 3000');
});
