

const fileInput = document.getElementById("reportFile");
const analyzeBtn = document.getElementById("analyzeBtn");
const sampleBtn = document.getElementById("sampleBtn");
const statusText = document.getElementById("status");
const summary = document.getElementById("summary");
const details = document.getElementById("details");
const language = document.getElementById("language");
const recordCount = document.getElementById("recordCount");

let currentReport = null;
let analyzedCount = 0;

const sampleReport = {
  type: "DEMO REPORT",
  date: "12 October 2026",
  values: [
    { name: "Hemoglobin", value: "12.5 g/dL" },
    { name: "Fasting glucose", value: "95 mg/dL" },
    { name: "Vitamin D", value: "20 ng/mL" }
  ]
};

sampleBtn.addEventListener("click", () => {
  currentReport = sampleReport;
  fileInput.value = "";
  showReport();
});

analyzeBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file && !currentReport) {
    statusText.textContent =
      "Please upload a report or choose Try Sample Report.";
    return;
  }

  if (file) {
    statusText.textContent =
      "Reading file details. OCR processing will be added next.";

    currentReport = {
      type: "UPLOADED FILE — NOT YET ANALYZED",
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      values: []
    };
  }

  showReport();
});

function showReport() {
  const isTelugu = language.value === "te";

  summary.replaceChildren();
  details.replaceChildren();

  if (currentReport.type === "DEMO REPORT") {
    const heading = document.createElement("strong");
    heading.textContent = isTelugu
      ? "ఇది నమూనా ఆరోగ్య నివేదిక."
      : "This is a sample health report.";
    summary.appendChild(heading);

    const note = document.createElement("p");
    note.textContent = isTelugu
      ? "ఇవి ఉదాహరణ విలువలు మాత్రమే. నిజమైన రోగి ఫలితాలు కావు."
      : "These are illustrative values, not real patient results.";
    summary.appendChild(note);

    currentReport.values.forEach((item) => {
      const row = document.createElement("p");
      row.textContent = `${item.name}: ${item.value}`;
      details.appendChild(row);
    });

    const vitDNote = document.createElement("p");
    vitDNote.textContent = isTelugu
      ? "విటమిన్ D విలువకు సరైన అర్థం తెలుసుకోవడానికి నివేదికలోని రిఫరెన్స్ పరిధిని పరిశీలించాలి."
      : "For Vitamin D, check the report's reference range before interpreting the value.";
    details.appendChild(vitDNote);
  } else {
    const note = document.createElement("p");
    note.textContent =
      "File received: " + (currentReport.name || "Unknown file");
    summary.appendChild(note);

    const warning = document.createElement("p");
    warning.textContent =
      "The file has not been read or medically analyzed yet. OCR and report extraction are not implemented.";
    details.appendChild(warning);
  }

  analyzedCount++;
  recordCount.textContent = analyzedCount;
  statusText.textContent =
    "Demo displayed. No diagnosis or real medical analysis was performed.";
}

language.addEventListener("change", () => {
  if (currentReport) showReport();
});
