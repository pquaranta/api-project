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
require('./routes/management')(app);
require('./routes/events')(app);

// Periodically check for scanners that do not have a heartbeat. If we were working with a database I would use a query that would return in order of most recent heartbeat.
// In this case, since it should be a trivial number of scanners, just iterate through them all.
const scanners = require('./database/scanner-database').database;
setInterval(() => {
    scanners.forEach((value) => {
        // Default to creation timestamp if there is no previous heartbeat
        const lastHeartbeat = value.hasOwnProperty('lastHeartbeatTimestamp') ? value.lastHeartbeatTimestamp : value.creationTimestamp;
        if (Date.now() - lastHeartbeat >= process.env.HEARTBEAT_INTERVAL_MS) {
            console.warn(`No heartbeat received from scanner ${value.id} in the past ${process.env.HEARTBEAT_INTERVAL_MS} ms`);
        }
    });
}, process.env.PULSE_CHECK_INTERVAL_MS || 5000);

// Start the app
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
