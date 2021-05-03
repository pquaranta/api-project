// Module to mock interactions with a database, instead this will all be done in-memory in a map
const { v4: uuidv4 } = require('uuid');
const database = new Map();
// Simulate some latency with the db
const databaseLatency = process.env.NETWORK_LATENCY || 10;

// Create and return a scanner
const createScanner = async function() {
    return new Promise((res) => {
        console.log(`Creating new scanner in the database`);
        setTimeout(() => {
            // Generate the new scanner, add it to the DB
            const id = uuidv4();
            const scanner = {
                id: id,
                creationTimestamp: Date.now()
            };

            database.set(id, scanner);
            console.log(`Scanner ${id} created`);
            res(scanner);
        }, databaseLatency);
    });
}

const updateScanner = async function(scannerJson) {
    return new Promise((res) => {
        setTimeout(() => {
            database.set(scannerJson.id, scannerJson);
            console.log(`Scanner ${scannerJson.id} updated`);
            res(scannerJson);
        }, databaseLatency);
    });
}

const getScanners = async function() {
    return new Promise((res) => {
        setTimeout(() => {
            res(Array.from(database.values()));
        }, databaseLatency);
    });
}

const getScannerById = async function(id) {
    return new Promise((res) => {
        setTimeout(() => {
            if (database.has(id)) {
                res(database.get(id));
            } else {
                res(null);
            }
        }, databaseLatency);
    });
}

// Delete a scanner by ID
const deleteScanner = async function(id) {
    return new Promise((res, rej) => {
        console.log(`Deleting scanner ${id} from the database`);
        setTimeout(() => {
            if (database.has(id)) {
                database.delete(id);
                console.log(`Scanner ${id} deleted`);
                res(`Scanner ${id} successfully removed from the database`);
            } else {
                console.log(`Scanner ${id} not found`);
                rej(`Scanner ${id} not found in the database`);
            }
        }, databaseLatency);
    });
}

module.exports = { database, createScanner, updateScanner, getScanners, getScannerById, deleteScanner };