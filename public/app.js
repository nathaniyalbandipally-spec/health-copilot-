
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
      summary.replaceChildren();

const heading = document.createElement("strong");
heading.textContent = "Your report in simple words";
summary.appendChild(heading);

const explanation = document.createElement("p");
explanation.textContent = createSimpleSummary(extractedText);
summary.appendChild(explanation);

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

function createSimpleSummary(text) {
  const lower = text.toLowerCase();
  const explanations = [];

  if (/haemoglobin|hemoglobin|\bhb\b/.test(lower)) {
    explanations.push(
      "Hemoglobin (Hb): This protein in your blood carries oxygen around your body. Check its result against the reference range printed on your report."
    );
  }

  if (/glucose|blood sugar|hba1c/.test(lower)) {
    explanations.push(
      "Blood sugar: These tests help show the amount of sugar in your blood or your average blood sugar. The meaning depends on the type of test and its reference range."
    );
  }

  if (/vitamin\s*d|25.?oh vitamin d/.test(lower)) {
    explanations.push(
      "Vitamin D: This test checks your vitamin D level, which helps your body maintain healthy bones. Use the laboratory's reference range to understand the result."
    );
  }

  if (/cholesterol|triglyceride|lipid profile/.test(lower)) {
    explanations.push(
      "Cholesterol and fats: These tests measure fats in your blood and help assess heart health. Review each result with its reference range."
    );
  }

  if (/creatinine|urea|egfr/.test(lower)) {
    explanations.push(
      "Kidney tests: These results help assess how your kidneys are working. A healthcare professional can interpret them alongside your other results."
    );
  }

  if (/tsh|thyroid/.test(lower)) {
    explanations.push(
      "Thyroid test: These results help assess thyroid function. Their meaning depends on the specific test and its reference range."
    );
  }

  if (/wbc|white blood cell|leukocyte/.test(lower)) {
    explanations.push(
      "White blood cells: These cells help your body fight infections. The result needs to be compared with the laboratory's reference range."
    );
  }

  if (/rbc|red blood cell|platelet/.test(lower)) {
    explanations.push(
      "Blood cell count: These tests measure different types of blood cells that perform important jobs in your body. Check each result against its reference range."
    );
  }

  const flaggedLines = text
    .split(/\r?\n/)
    .filter(line =>
      /\b(high|low|abnormal|critical|positive|negative)\b/i.test(line)
    )
    .slice(0, 5);

  if (flaggedLines.length > 0) {
    explanations.push(
      "The report contains lines marked High, Low, Abnormal, Critical, Positive, or Negative. Review those lines with a healthcare professional; these words mean different things for different tests."
    );
  }

  if (explanations.length === 0) {
    return "The text was extracted, but the report type or test names were not recognized. Check the extracted text below and ask a healthcare professional to explain the results.";
  }

  return explanations.join("\n\n") +
    "\n\nImportant: This is a basic explanation of test names, not a diagnosis. OCR can make mistakes. Verify the values and reference ranges against the original report.";
}


