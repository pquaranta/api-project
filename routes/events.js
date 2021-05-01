// Events API for managing incoming events from scanners
module.exports = function(app) {
    // Endpoint for submitting an event
    app.post('/event', (req, res) => {
        res.send('Event submitted');
    });
}
