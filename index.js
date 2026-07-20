const express = require('express');
const path = require('path');
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const axios = require("axios");
const WebSocket = require("ws");
const log = require("./logger/log.js");
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// === 1. KEEP ALIVE SERVER ===
app.get("/", (req, res) => res.send("✅ GoatBot is Online 24/7"));
setInterval(() => {
    http.get(`http://localhost:${port}`);
}, 240000);

// Ensure log storage 
if (!fs.existsSync("./cache")) fs.mkdirSync("./cache");
const logPath = path.join(__dirname, "cache", "logs.txt");
fs.writeFileSync(logPath, "", { flag: "a" });
const logStream = fs.createWriteStream(logPath, { flags: "a" });
let clients = [];

const originalLog = console.log;
console.log = (...args) => {
    const logMsg = args.map(arg => (typeof arg === "object" ? JSON.stringify(arg) : String(arg))).join(" ");
    originalLog(logMsg);
    logStream.write(logMsg + "\n");
    clients.forEach(ws => ws.readyState === 1 && ws.send(logMsg));
};

// === 2. FIX GLOBAL API ===
global.GoatBot = global.GoatBot || {};
global.data = global.data || {};
global.utils = global.utils || {};

if (!global.api) global.api = {};
if (!global.api.changeThreadTitle) {
    global.api.changeThreadTitle = async function(title, threadID) {
        return this.sendMessage({ body: "", attachment: [] }, threadID, null, { title: title });
    }
}

if (!global.utils.getStreamFromURL) {
    global.utils.getStreamFromURL = async function(url, filename = "file.jpg") {
        const filePath = path.join(__dirname, "cache", filename);
        const res = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, res.data);
        return fs.createReadStream(filePath);
    }
}
console.log("[FIXED] Global API Patched Successfully");

// WebSocket for live logs 
const wss = new WebSocket.Server({ server });
wss.on("connection", ws => {
    clients.push(ws);
    ws.send("[Connected] ✅ GoatBot log viewer active");
    ws.on("close", () => {
        clients = clients.filter(c => c !== ws);
    });
});

app.get('/test', (req, res) => {
    res.sendFile(path.join(__dirname, 'test.html'));
});

// Route: /logs viewer (تم تصحيح دالة colorize هنا)
app.get("/logs", (req, res) => {
    res.send(`
 <html>
 <head>
 <title>GoatBot Logs</title>
 <style>
 body { font-family: monospace; background: #000; color: #0f0; padding: 10px; }
 #log { height: 80vh; overflow-y: scroll; white-space: pre-wrap; border: 1px solid #444; padding: 10px; margin-bottom: 10px; }
 .error { color: red; }
 </style>
 </head>
 <body>
 <h2>📜 GoatBot Logs (Realtime)</h2>
 <div id="log">Loading...</div>
 <script>
 function colorize(text) {
    return text.replace(/\\n/g, "<br>").replace(/\\[.*?ERROR.*?\\]/gi, function(match) {
        return '<span class="error">' + match + '</span>';
    });
 }
 const log = document.getElementById("log");
 fetch("/logs.txt").then(r => r.text()).then(t => { log.innerHTML = colorize(t); });
 const ws = new WebSocket("wss://" + location.host);
 ws.onmessage = e => { log.innerHTML += "<br>" + colorize(e.data); log.scrollTop = log.scrollHeight; };
 </script>
 </body>
 </html>
 `);
});

app.use("/logs.txt", express.static(logPath));

server.listen(port, () => {
    console.log(`📡 Web server running at http://localhost:${port}`);
});

function startProject() {
    console.log("[DEBUG] Starting Bot...");
    const child = spawn("node", ["Goat.js"], { cwd: __dirname, shell: true });
    child.stdout.on("data", (data) => console.log("[Arafat Sarder]", data.toString().trim()));
    child.stderr.on("data", (data) => console.log("[CMD LOADING]", data.toString().trim()));
    child.on("close", (code) => {
        if (code == 2) startProject();
    });
}
startProject();
