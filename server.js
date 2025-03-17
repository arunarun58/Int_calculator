const express = require("express");
const path = require("path");

const app = express();
const port = 3000;

// Serve static files like HTML, CSS, and JavaScript
app.use(express.static(path.join(__dirname, "public")));

// Example route for BS date (if needed)
app.get("/bs-date", (req, res) => {
  const bsDate = "2081-11-19"; // Manually set the BS date or compute dynamically
  res.json({ bsDate });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
