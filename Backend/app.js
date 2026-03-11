const express = require("express");
const connectDB = require("./config/database");

const app = express();

connectDB();

app.get("/", (req, res) => {
  res.send("API running");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});