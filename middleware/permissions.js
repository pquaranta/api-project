const Validator = require('jsonschema').Validator;
const v = new Validator();

// A schema to use for rule validation with the jsonschema module
const ruleSchema = {
    type: "object",
    properties: {
        scanners: { 
            type: "array",
            items: { type: "string" }
        },
        employees: { 
            type: "array",
            items: { type: "number" }
        },
        permittedTimes: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    startTimeMin: { type: "number" },
                    endTimeMin: { type: "number" }
                },
                required: ["startTimeMin", "endTimeMin"]
            }
        }
    },
    required: ["scanners", "employees"]
}

// Middleware function to validate the rule format
const validateRule = (req, res, next) => {
    // First validate the permission rule against the schema
    let validRule = v.validate(req.body, ruleSchema).valid;
    // Check to make sure the times are non negative and reasonable
    if (req.body.hasOwnProperty('permittedTimes')) {
        for (const time of req.body.permittedTimes) {
            validRule = validRule && time.startTimeMin >= 0 && time.startTimeMin <= 1440 && time.endTimeMin >= time.startTimeMin && time.endTimeMin <= 1440
        }
    }
    // If this is not a valid rule, send a 400 status code, otherwise continue
    if (!validRule) {
        res.status(400).send('Invalid rule format');
    } else {
        next();
    }
}

module.exports = { validateRule };
