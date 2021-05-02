// Module to mock interactions with a database, instead this will all be done in-memory in a map
const { v4: uuidv4 } = require('uuid');
const database = new Map();
// Simulate some latency with the db
const databaseLatency = process.env.IO_LATENCY || 10;

const createRule = async function(json) {
    return new Promise((res) => {
        setTimeout(() => {
            // Generate the new rule, add it to the DB, then return the json to the caller
            const id = uuidv4();
            const rule = {
                id: id,
                scanners: json.scanners,
                employees: json.employees
            }

            // Optionally add the permitted times
            if (json.hasOwnProperty('permittedTimes')) {
                rule.permittedTimes = json.permittedTimes;
            }

            // Convert the arrays to sets before adding to the db
            rule.employees = new Set(rule.employees);
            rule.scanners = new Set(rule.scanners);

            // Add to the db
            database.set(id, rule);
            console.log(`Rule ${id} created`);

            res(rule);
        }, databaseLatency);
    });
}

const getRules = async function() {
    return new Promise((res, rej) => {
        setTimeout(() => {
            // Return all values in the fake DB, converting sets back to arrays
            res(Array.from(database.values()).map((rule) => {
                rule.employees = Array.from(rule.employees);
                rule.scanners = Array.from(rule.scanners);
                return rule;
            }));
        }, databaseLatency);
    });
}

// Delete a rule by ID
const deleteRule = async function(id) {
    return new Promise((res, rej) => {
        console.log(`Deleting rule ${id} from the database`);
        setTimeout(() => {
            if (database.has(id)) {
                database.delete(id);
                console.log(`Rule ${id} deleted`);
                res(`Rule ${id} successfully removed from the database`);
            } else {
                console.log(`Rule ${id} not found`);
                rej(`Rule ${id} not found in the database`);
            }
        }, databaseLatency);
    });
}

const isEmployeeAuthorized = async function(employeeId, scannerId) {
    return new Promise((res) => {
        setTimeout(() => {
            // This is an enter/exit event. Check to see if the employee should be here. Obviously we would want a better way of querying this but for now just iterate through all rules
            for (const rule of database.values()) {
                if (rule.employees.has(employeeId) && rule.scanners.has(scannerId)) {
                    // If there are no values provided, then any time is allowed
                    if (!rule.hasOwnProperty('permittedTimes')) {
                        res(true);
                    }
                    // See if the current time falls within a permitted time range
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    const minutesIntoCurrentDay = (Date.now() - startOfDay) / 60000;
                    for (const range of rule.permittedTimes) {
                        if (minutesIntoCurrentDay >= range.startTimeMin && minutesIntoCurrentDay <= range.endTimeMin) {
                            res(true);
                        }
                    }
                }
            }
            res(false);
        }, databaseLatency);
    });
}

module.exports = { database, createRule, getRules, deleteRule, isEmployeeAuthorized };