const Validator = require('jsonschema').Validator;
const v = new Validator();

// Enum for the different types of events
const EVENT_TYPES = {
    HEARTBEAT: 'heartbeat',
    ENTER: 'enter',
    EXIT: 'exit'
}

// A schema to use for event validation with the jsonschema module
const eventSchema = {
    type: "object",
    properties: {
        id: { type: "string"},
        event: { type: "string"},
        payload: {
            type: "object",
            properties: {
                employeeId: { type: "number" }
            },
            required: ["employeeId"]
        }
    },
    required: ["id", "event"]
}

// Middleware function to validate the event format
const validateEvent = (req, res, next) => {
    // First validate the event against the schema
    let validEvent = v.validate(req.body, eventSchema).valid;
    // Next, make sure that it is a valid event type
    validEvent = validEvent && Object.values(EVENT_TYPES).includes(req.body.event);
    // Lastly, do some validation based on whether this is an enter/exit event or a heartbeat
    if (req.body.hasOwnProperty('payload')) {
        validEvent = validEvent && (req.body.event == EVENT_TYPES.ENTER || req.body.event == EVENT_TYPES.EXIT) && req.body.payload.employeeId > 0;
    } else {
        validEvent = validEvent && req.body.event == EVENT_TYPES.HEARTBEAT;
    }
    // If this is not a valid event, send a 400 status code, otherwise continue
    if (!validEvent) {
        res.status(400).send('Invalid event format');
    } else {
        next();
    }
}

module.exports = { validateEvent, EVENT_TYPES };
