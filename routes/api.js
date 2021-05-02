// All APIs are defined here. Normally we would break these out to separate files, but since we are not interfacing with an actual DB and using in-memory data structures I figured it would be
// best to keep this all localized.
const { v4: uuidv4 } = require('uuid');
const events = require('../middleware/events');
const permissions = require('../middleware/permissions');
const queue = require('../data/fake-queue');

// Fake DBs for scanners and permission rules
const scannerDb = new Map();
const ruleDb = new Map();

// Periodically check for scanners that do not have a heartbeat. If we were working with a database I would use a query that would return in order of most recent heartbeat.
// In this case, since it should be a trivial number of scanners, just iterate through them all.
setInterval(() => {
    scannerDb.forEach((value) => {
        // Default to creation timestamp if there is no previous heartbeat
        const lastHeartbeat = value.hasOwnProperty('lastHeartbeatTimestamp') ? value.lastHeartbeatTimestamp : value.creationTimestamp;
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
    });

    // Endpoint for creating a new rule
    app.post('/rule', permissions.validateRule, (req, res) => {
        // Generate the new rule, add it to the DB, then return the json to the caller
        const id = uuidv4();
        const rule = {
            id: id,
            scanners: req.body.scanners,
            employees: req.body.employees
        }

        // Optionally add the permitted times
        if (req.body.hasOwnProperty('permittedTimes')) {
            rule.permittedTimes = req.body.permittedTimes;
        }
 
        const msg = `Rule ${JSON.stringify(rule)} created`;
        // Convert the arrays to sets before adding to the db
        rule.employees = new Set(rule.employees);
        rule.scanners = new Set(rule.scanners);
        ruleDb.set(id, rule);
        res.send(msg);
    });

    // Endpoint for retrieving all existing rules
    app.get('/rules', (req, res) => {
        // Return all values in the fake DB, converting sets back to arrays
        res.json(Array.from(ruleDb.values()).map((rule) => {
            rule.employees = Array.from(rule.employees);
            rule.scanners = Array.from(rule.scanners);
            return rule;
        }));
    });

    // Endpoint for deleting a rule
    app.delete('/rule/:id', (req, res) => {
        let msg = ``;
        if (!ruleDb.has(req.params.id)) {
            msg = `Rule "${req.params.id}" not found`;
            res.status(404).send(msg);
        } else {
            // Delete the rule from the fake DB
            ruleDb.delete(req.params.id);
            msg = `Rule ${req.params.id} has been deleted`;
            res.send(msg);
        }
    });

    // Endpoint for submitting an event
    app.post('/event', events.validateEvent, async (req, res) => {
        console.log(`Event received: ${JSON.stringify(req.body)}`);

        // Immediately upon receiving the event, we should block until we 
        // can write it to our message queuing system for processing. This will fail a fixed percentage of time based on the configuration value provided in the .env file
        let written = false;
        while (!written) {
            try {
                await queue.writeData(req.body);
                written = true;
            } catch (e) {
                console.warn(e);
            }
        }
        
        // First check to make sure that the scanner exists
        if (!scannerDb.has(req.body.id)) {
            res.status(404).send('Scanner not found');
        } else if (req.body.event == events.EVENT_TYPES.HEARTBEAT) {
            // Update the scanner in the db with the latest heartbeat
            const scannerObj = scannerDb.get(req.body.id);
            scannerObj.lastHeartbeatTimestamp = Date.now();
            scannerDb.set(req.body.id, scannerObj);
            // Let the client know we have received the heartbeat
            res.send('Heartbeat received');
        } else {
            // This is an enter/exit event. Check to see if the employee should be here. Obviously we would want a better way of querying this but for now just iterate through all rules
            let authorized = false;
            for (const rule of ruleDb.values()) {
                if (rule.employees.has(req.body.payload.employeeId) && rule.scanners.has(req.body.id)) {
                    // If there are no values provided, then any time is allowed
                    if (!rule.hasOwnProperty('permittedTimes')) {
                        authorized = true;
                    }
                    // See if the current time falls within a permitted time range
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    const minutesIntoCurrentDay = (Date.now() - startOfDay) / 60000;
                    for (const range of rule.permittedTimes) {
                        if (minutesIntoCurrentDay >= range.startTimeMin && minutesIntoCurrentDay <= range.endTimeMin) {
                            authorized = true;
                        }
                    }
                }
            }
            // If we have not otherwise granted access, send a forbidden status code with an unauthorized message
            if (authorized) {
                const authorizedMessage = `Employee ${req.body.payload.employeeId} has been authorized to ${req.body.event} scanner ${req.body.id}`;
                console.log(authorizedMessage);
                res.send(authorizedMessage);
            } else {
                const unauthorizedMessage = `Employee ${req.body.payload.employeeId} has not been authorized to ${req.body.event} scanner ${req.body.id}`;
                console.log(unauthorizedMessage);
                res.status(403).send(unauthorizedMessage);
            }
        }
    });
};
