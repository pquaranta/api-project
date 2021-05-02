const permissions = require('../middleware/permissions');

// Fake DBs for scanners and permission rules
const scannerDb = require('../database/scanner-database');
const ruleDb = require('../database/permissions-database');

module.exports = function(app) {
    // Endpoint for creating a new scanner
    app.post('/scanner', async (req, res) => {
        const scanner = await scannerDb.createScanner();
        res.json(scanner);
    });

    // Endpoint for retrieving all scanners in the system
    app.get('/scanners', async (req, res) => {
        // Return all values in the fake DB
        const scanners = await scannerDb.getScanners();
        res.json(scanners);
    });

    // Endpoint for deleting a scanner
    app.delete('/scanner/:id', async (req, res) => {
        try {
            const msg = await scannerDb.deleteScanner(req.params.id);
            res.send(msg);
        } catch (e) {
            res.status(404).send(e);
        }
    });

    // Endpoint for creating a new rule
    app.post('/rule', permissions.validateRule, async (req, res) => {
        // Generate the new rule, add it to the DB, then return the json to the caller
        const rule = await ruleDb.createRule(req.body);
        res.send(`Rule ${JSON.stringify(rule)} created`);
    });

    // Endpoint for retrieving all existing rules
    app.get('/rules', async (req, res) => {
        const rules = await ruleDb.getRules();
        res.json(rules);
    });

    // Endpoint for deleting a rule
    app.delete('/rule/:id', async (req, res) => {
        try {
            const msg = await ruleDb.deleteRule(req.params.id);
            res.send(msg);
        } catch (e) {
            res.status(404).send(e);
        }
    });
};
