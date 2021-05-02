// All APIs are defined here. Normally we would break these out to separate files, but since we are not interfacing with an actual DB and using in-memory data structures I figured it would be
// best to keep this all localized.
const { v4: uuidv4 } = require('uuid');
const events = require('../middleware/events');

// Fake DB to store scanner information
const scannerDb = new Map();

// Periodically check for scanners that do not have a heartbeat. If we were working with a database I would use a query that would return in order of most recent heartbeat.
// In this case, since it should be a trivial number of scanners, just iterate through them all.
setInterval(() => {
    scannerDb.forEach((value) => {
        const lastHeartbeat = value.hasOwnProperty('lastHeartbeatTimestamp') ? value.lastHeartbeatTimestamp : value.creationTimestamp;
        console.log(`Last: ${lastHeartbeat}`);
        if (Date.now() - lastHeartbeat >= process.env.HEARTBEAT_INTERVAL_MS) {
            console.warn(`No heartbeat received from scanner ${value.id} in the past ${process.env.HEARTBEAT_INTERVAL_MS} ms`);
        }
    });
}, process.env.PULSE_CHECK_INTERVAL_MS || 5000);

module.exports = function(app) {
    // Endpoint for creating a new scanner
    app.post('/scanner', (req, res) => {
        // Generate the new scanner, add it to the DB, then return the json to the caller
        const id = uuidv4();
        const scanner = {
            apiKey: `scanner-${id}-api-key`,
            id: id,
            creationTimestamp: Date.now()
        };

        scannerDb.set(scanner.id, scanner);
        console.log(`Scanner ${JSON.stringify(scanner)} created`);
        res.json(scanner);
    });

    // Endpoint for retrieving all scanners in the system
    app.get('/scanners', (req, res) => {
        // Return all values in the fake DB
        res.json(Array.from(scannerDb.values()));
    });

    // Endpoint for deleting a scanner
    app.delete('/scanner/:id', (req, res) => {
        let msg = ``;
        if (!scannerDb.has(req.params.id)) {
            msg = `Scanner "${req.params.id}" not found`;
            res.status(404).send(msg);
        } else {
            // Delete the scanner from the fake DB
            scannerDb.delete(req.params.id);
            msg = `Scanner ${req.params.id} has been deleted`;
            res.send(msg);
        }
        console.log(msg);
    });

    // Endpoint for creating a new rule
    app.post('/rule', (req, res) => {
        res.send('New rule created');
    });

    // Endpoint for updating an existing rule
    app.put('/rule', (req, res) => {
        res.send('Existing rule updated');
    });

    // Endpoint for retrieving all existing rules
    app.get('/rules', (req, res) => {
        res.send('Rules retrieved');
    });

    // Endpoint for deleting a rule
    app.delete('/rule', (req, res) => {
        res.send('Rule deleted');
    });

    // Endpoint for submitting an event
    app.post('/event', events.validateEvent, (req, res) => {
        const msg = `Event submitted: ${JSON.stringify(req.body)}`;
        if (req.body.event == events.EVENT_TYPES.HEARTBEAT) {
            // Update the scanner in the db with the latest heartbeat
            const scannerObj = scannerDb.get(req.body.id);
            scannerObj.lastHeartbeatTimestamp = Date.now();
            scannerDb.set(req.body.id, scannerObj);
        }
        console.log(msg);
        res.send(msg)
    });
};
