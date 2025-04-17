const { WebSocket, WebSocketServer } = require('ws');
const fs = require('fs');
const child_process = require("child_process");

//let size = 2048;
const clients = [];

const wss = new WebSocketServer({
    port: 30298,
    perMessageDeflate: {
        zlibDeflateOptions: {
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        concurrencyLimit: 20,
        threshold: 10
    }
});

function format(received) {
    if (received > 1024) {
        if (received > 1024**2) {
            return (received / 1024**2).toFixed(2) + "M";
        } else {
            return (received / 1024).toFixed(2) + "K";
        }
    } else {
        return received;
    }
}

let canSend = false;
const bitrate = 1411000*0.125;
size = bitrate;

fs.promises.open("./test.raw").then((fd) => {
    const stream = fd.createReadStream();
    canSend = true;
    let total = 0;

    setInterval(() => {
        if (!canSend) return;

        process.stdout.clearLine(null);
        process.stdout.cursorTo(0);
        process.stdout.write("Sent " + format(total) + ", " + clients.length + " clients");

        for (let ws of clients) {
            ws.send(stream.read(size));
        }

        total += size;
    }, 1000);

    stream.on('end', () => {
        canSend = false;
    })
})

wss.on('connection', function connection(ws) {
    clients.push(ws);

    ws.on('close', () => {
        clients.splice(clients.indexOf(ws), 1);
    })
});