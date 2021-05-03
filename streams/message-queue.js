// Function to simulate a call to our message queuing system
const messageLatency = process.env.NETWORK_LATENCY || 10;
const failPercentage = process.env.MESSAGE_WRITE_FAIL_RATE_PCT || 10;

const writeData = async (jsonData) => {
    // Simulate a call to our message queue
    return new Promise((res, rej) => {
        console.log(`Writing ${JSON.stringify(jsonData)} to message queue`);
        // Succeed or fail randomly based on the configured fail percentage
        setTimeout(() => {
            if (Math.floor(Math.random() * 100) > failPercentage) {
                res('Message successfully written to queue');
            } else {
                rej('Message failed to write to queue');
            }
        }, messageLatency);
    });
}

module.exports = { writeData };
