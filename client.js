const { WebSocket } = require('ws');
const fs = require('fs');
const child_process = require('child_process');

const ws = new WebSocket('ws://192.168.1.23:30298');
console.log("Connected");
let proc = null;

let received = 0;
let status = "loading...";

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

if (fs.existsSync("test.raw")) fs.unlinkSync("test.raw");

ws.on('message', (data) => {
    if (data.length !== 0) {
        if (status !== "playing!") status = "buffering...";
        fs.appendFileSync("test.raw", data);
    }

    received += data.length;

    if (received > 1024**2 && !proc) {
        status = "playing!";
        proc = child_process.spawn("aplay", ["-f", "cd", "test.raw"]);
    }

    process.stdout.clearLine(null);
    process.stdout.cursorTo(0);
    process.stdout.write("Received " + format(received) + ", " + status);
})

ws.on('close', () => {
    process.stdout.write("\r\n");
    if (proc) proc.kill();
})