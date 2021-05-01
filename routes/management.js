// Management API for managing scanners and access rules
module.exports = function(app) {
    // Fake DB to store scanner information
    const scannerDb = new Map();
    // Auto increment used for generating unique IDs for the scanner
    let scannerAutoInc = 0;

    // Endpoint for creating a new scanner
    app.post('/scanner', (req, res) => {
        // Generate the new scanner, add it to the DB, then return the json to the caller
        const scanner = {
            apiKey: `scanner-${scannerAutoInc}-api-key`,
            id: `${scannerAutoInc++}`,
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
}
