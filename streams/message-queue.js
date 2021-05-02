// Function to simulate a call to our message queuing system
const messageLatency = process.env.IO_LATENCY || 10;

const writeData = async (jsonData) => {
    const failPercentage = process.env.MESSAGE_WRITE_FAIL_RATE_PCT || 10;

    // Simulate a call to our message queue which will take 100 ms to respond
    return new Promise((res, rej) => {
        console.log(`Writing ${JSON.stringify(jsonData)} to message queue`);
        // After 100 ms, succeed or fail randomly based on the configured fail percentage
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
