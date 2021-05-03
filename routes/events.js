const events = require('../middleware/events');
const auth = require('../middleware/scanner-auth');

// Fake messaging queue
const queue = require('../streams/message-queue');

// Fake DBs for scanners and permission rules
const scannerDb = require('../database/scanner-database');
const ruleDb = require('../database/permissions-database');

module.exports = function(app) {
    // Endpoint for submitting an event
    app.post('/event', auth.validateApiKey, events.validateEvent, async (req, res) => {
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
                // Wait before trying again
                await new Promise(resolve => setTimeout(resolve, process.env.MESSAGE_RETRY_MS || 500));
            }
        }
        
        // First check to make sure that the scanner exists
        const scanner = await scannerDb.getScannerById(req.body.id);
        if (scanner == null) {
            res.status(404).send('Scanner not found');
        } else if (req.body.event == events.EVENT_TYPES.HEARTBEAT) {
            // Update the scanner in the db with the latest heartbeat
            scanner.lastHeartbeatTimestamp = Date.now();
            await scannerDb.updateScanner(scanner);
            // Let the client know we have received the heartbeat
            res.send('Heartbeat received');
        } else {
            // This is an enter/exit event. Check to see if the employee is authorized to be here
            const authorized = await ruleDb.isEmployeeAuthorized(req.body.payload.employeeId, req.body.id);
            // Notify the client
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
}