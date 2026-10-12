
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

sampleBtn.addEventListener("click", () => {
  currentReport = true;
  fileInput.value = "";

  summary.textContent =
    "Sample report selected. These are illustrative values, not real patient results.";

  details.textContent =
    "Hemoglobin: 12.5 g/dL\n" +
    "Fasting glucose: 95 mg/dL\n" +
    "Vitamin D: 20 ng/mL\n\n" +
    "Sample values only. Check the original report's reference ranges.";

  statusText.textContent = "Sample report displayed. No real medical analysis performed.";
});

analyzeBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];

  if (!file) {
    statusText.textContent = "Please select a PNG, JPG, or JPEG image.";
    return;
  }

  if (!["image/png", "image/jpeg"].includes(file.type)) {
    statusText.textContent =
      "Image OCR only for now. PDF support will be added separately.";
    return;
  }

  if (!window.Tesseract) {
    statusText.textContent =
      "OCR library failed to load. Check your internet connection and reload.";
    return;
  }

  analyzeBtn.disabled = true;
  sampleBtn.disabled = true;
  summary.textContent = "OCR is starting...";
  details.textContent = "";
  statusText.textContent = "Reading text from your image. Please wait.";

  try {
    const result = await Tesseract.recognize(file, "eng", {
      logger: (message) => {
        if (message.status === "recognizing text") {
          statusText.textContent =
            `Recognizing text: ${Math.round(message.progress * 100)}%`;
        }
      }
    });

    const extractedText = result.data.text.trim();

    if (!extractedText) {
      summary.textContent = "No readable text found.";
      details.textContent =
        "Try a clearer, well-lit image with printed text.";
    } else {
      summary.textContent =
        "OCR completed. Extracted text is shown below. Verify it against the original report.";

      details.textContent = extractedText;
      currentReport = true;
      analyzedCount++;
      recordCount.textContent = analyzedCount;
    }

    statusText.textContent =
      "OCR finished. No diagnosis or medical interpretation was performed.";
  } catch (error) {
    console.error(error);
    statusText.textContent =
      "OCR failed. Try a clearer image or reload the page and try again.";
  } finally {
    analyzeBtn.disabled = false;
    sampleBtn.disabled = false;
  }
});

language.addEventListener("change", () => {
  if (language.value === "te") {
    statusText.textContent =
      "Telugu interface translation is partial. OCR currently recognizes English text only.";
  }
});

async function checkBackend() {
  try {
    const response = await fetch("/api/health");
    if (!response.ok) throw new Error("Backend unavailable");

    const data = await response.json();
    if (data.success) {
      console.log("Health Copilot backend connected:", data.project);
    }
  } catch (error) {
    console.warn("Backend health check failed:", error);
  }
}

checkBackend();

