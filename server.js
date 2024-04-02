const express = require("express");
const fs = require("fs");
const app = express();
const readline = require('readline');
// Middleware for logging requests
app.use((req, res, next) => {
  if (req.url === "/redirect") {
    const log = `[${new Date().toISOString()}] ${req.method} ${
      req.url
    } - Device OS: ${req.headers["user-agent"]}\n`;
    fs.appendFile("server.log", log, (err) => {
      if (err) {
        console.error("Error writing to log file:", err);
      }
    });
  }
  next();
});
// API endpoint to get hit count for each OS type
app.get("/hitcount", async (req, res) => {
  try {
    const counts = {
      iOS: 0,
      Android: 0,
      Other: 0,
    };
    const rl = readline.createInterface({
      input: fs.createReadStream('server.log'),
      crlfDelay: Infinity,
    });
    rl.on("line", (line) => {
      if (
        line.includes("iPad") ||
        line.includes("iPhone") ||
        line.includes("iPod")
      ) {
        counts["iOS"]++;
      } else if (line.toLowerCase().includes("android")) {
        counts["Android"]++;
      } else {
        counts["Other"]++;
      }
    });
    rl.on("close", () => {
      res.json(counts);
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
// Serve the HTML page with the redirection script
app.get("/redirect", async (req, res) => {
  try {
    // Detect the user agent to determine the device type
    const userAgent = req.headers["user-agent"];
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = userAgent.toLowerCase().indexOf("android") > -1;
    // Define the redirection URL based on the device
    let redirectUrl = "";
    if (isIOS) {
      redirectUrl = "https://itunes.apple.com/us/app/your-app-id";
    } else if (isAndroid) {
      redirectUrl =
        "https://play.google.com/store/apps/details?id=your.package.name";
    } else {
      redirectUrl = "https://example.com/other";
    }
    // Redirect to the appropriate URL
    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
