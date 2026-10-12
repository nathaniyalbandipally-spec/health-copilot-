const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    project: "AI Health Copilot",
    mode: "DEMO",
    abdmConnected: false,
    features: [
      "Medical Record OCR",
      "AI Health Summary",
      "Unified Health Profile",
      "Telugu and English",
      "Mock ABHA and FHIR"
    ]
  });
});

app.listen(PORT, () => {
  console.log(`Health Copilot running on port ${PORT}`);
});