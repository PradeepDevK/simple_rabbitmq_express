const express = require('express');
const connectToRabbitMQ = require('./rabbitmq');

const app = express();
app.use(express.json());

let channel;

// Intialize RabbitMQ
(async () => {
    const { channel: ch } = await connectToRabbitMQ();
    channel = ch;
})();

// Publish Message
app.post('/publish', (req, res) => {
    const { queue, message } = req.body;
    if (!queue || !message) return res.status(400).send(`Queue and message are required.`);

    channel.assertQueue(queue);
    channel.sendToQueue(queue, Buffer.from(message));
    res.send(`Message sent to queue: ${queue}`);
});

// Consume Message
app.get('/consume/:queue', async(req, res) => {
    const { queue } = req.params;
    channel.assertQueue(queue);

    channel.consume(queue, (msg) => {
        if(msg !== null) {
            console.log(`Recieved Message: ${msg.content.toString()}`);
            channel.ack(msg);
        }
    });

    res.send(`Consuming messages from queue: ${queue}`);
});

app.listen(3000, () => {
    console.log(`Server running on http://localhost:3000`);
});