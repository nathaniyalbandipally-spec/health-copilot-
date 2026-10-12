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
      renderOrganizedReport(extractedText);

currentReport = true;
analyzedCount++;
recordCount.textContent = analyzedCount;

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

function renderOrganizedReport(text) {
  const summary = document.getElementById("summary");
  const details = document.getElementById("details");

  summary.replaceChildren();
  details.replaceChildren();

  const clean = text.replace(/\s+/g, " ").trim();
  const lower = clean.toLowerCase();

  // 1. Patient and report details
  const patientSection = makeSection(
    details,
    "👤 Patient & Report Details"
  );

  addItem(patientSection, "Report type", detectReportType(lower));
  addItem(patientSection, "Report date", findValue(clean, /Report Date\s*[:|]?\s*([\d]{1,2}-[A-Za-z]{3}-[\d]{4})/i));
  addItem(patientSection, "Sample type", findValue(clean, /Sample Type\s*[:|]?\s*([A-Za-z ()]+)/i, 50));
  addItem(patientSection, "Age", findValue(clean, /Age\s*\/?\s*Sex\s*[:|]?\s*(\d+\s*Years?)/i));

  // 2. Extract test result lines
  const tests = extractTests(clean, lower);
  const testSection = makeSection(details, "🧪 Test Results");

  if (tests.length) {
    tests.forEach(test => {
      addItem(testSection, test.name, test.value);
    });
  } else {
    addItem(
      testSection,
      "Results",
      "Test names could not be reliably separated. Check the original report."
    );
  }

  // 3. Explain the test in plain language
  const meaningSection = makeSection(details, "📘 What It Means");

  if (lower.includes("widal") || lower.includes("typhi")) {
    addParagraph(
      meaningSection,
      "The Widal test looks for antibodies associated with Salmonella bacteria. Antibodies can remain after earlier exposure, and results can be affected by other factors."
    );

    addParagraph(
      meaningSection,
      "A single Widal result cannot reliably confirm an active typhoid infection. A doctor must consider symptoms and other appropriate tests."
    );
  } else {
    addParagraph(
      meaningSection,
      "This section explains the purpose of the test where recognized. Compare every result with the reference range printed by the laboratory."
    );
  }

  // 4. Final report summary
  const finalSection = makeSection(summary, "✅ Final Health Summary");

  addParagraph(
    finalSection,
    "Report type: " + detectReportType(lower)
  );

  if (lower.includes("widal") || lower.includes("typhi")) {
    addParagraph(
      finalSection,
      "Main finding: The text contains S. Typhi O and H antibody titres. The report itself describes them as suggestive of infection, but these results alone do not prove that you currently have typhoid."
    );

    addParagraph(
      finalSection,
      "What to do: Discuss the report with a qualified doctor, especially if you have fever, stomach pain, weakness or other symptoms. The doctor can decide whether additional testing is needed."
    );
  } else {
    addParagraph(
      finalSection,
      "The report text has been organized, but the app could not safely determine an overall medical conclusion. Ask a healthcare professional to review the results and reference ranges."
    );
  }

  addParagraph(
    finalSection,
    "Important: OCR can misread numbers and test names. Verify all extracted details against the original report. This summary is educational, not a diagnosis."
  );

  // Keep the complete OCR text available for verification
  const originalSection = makeSection(details, "📄 Original Extracted Text");
  const original = document.createElement("details");
  const toggle = document.createElement("summary");
  toggle.textContent = "Show full OCR text";
  const pre = document.createElement("pre");

  pre.textContent = text;
  pre.style.whiteSpace = "pre-wrap";
  pre.style.overflowWrap = "anywhere";

  original.append(toggle, pre);
  originalSection.appendChild(original);
}

function makeSection(parent, title) {
  const section = document.createElement("section");
  section.style.cssText =
    "background:#fff;padding:16px;margin:12px 0;border:1px solid #e0ebe7;border-radius:14px;";

  const heading = document.createElement("h3");
  heading.textContent = title;
  heading.style.marginTop = "0";

  section.appendChild(heading);
  parent.appendChild(section);

  return section;
}

function addItem(parent, label, value) {
  if (!value) return;

  const row = document.createElement("p");
  const strong = document.createElement("strong");
  strong.textContent = label + ": ";

  row.append(strong, document.createTextNode(value));
  parent.appendChild(row);
}

function addParagraph(parent, text) {
  const p = document.createElement("p");
  p.textContent = text;
  parent.appendChild(p);
}

function findValue(text, regex, maxLength = 80) {
  const match = text.match(regex);
  return match ? match[1].trim().slice(0, maxLength) : "";
}

function detectReportType(text) {
  if (text.includes("widal") || text.includes("typhi")) {
    return "Widal antibody test";
  }
  if (text.includes("hemoglobin") || text.includes("haemoglobin")) {
    return "Blood test";
  }
  if (text.includes("glucose") || text.includes("hba1c")) {
    return "Blood sugar test";
  }
  return "Medical laboratory report";
}

function extractTests(text, lower) {
  const tests = [];

  if (lower.includes("widal") || lower.includes("typhi")) {
    const patterns = [
      ["S. Typhi O antibody", /S\.?\s*Typhi\s*O\s*Antigen\s*\(TO\)\s*([0-9:./]+)/i],
      ["S. Typhi H antibody", /S\.?\s*Typhi\s*H\s*Antigen\s*\(TH\)\s*([0-9:./]+)/i],
      ["S. Paratyphi A antibody", /S\.?\s*Paratyphi\s*A\s*\(AH\)\s*([0-9:./]+)/i],
      ["S. Paratyphi B antibody", /S\.?\s*Paratyphi\s*B\s*\(BH\)\s*([0-9:./]+)/i]
    ];

    patterns.forEach(([name, regex]) => {
      const match = text.match(regex);
      if (match) {
        tests.push({
          name,
          value: match[1] + " titre (verify against original)"
        });
      }
    });

    const range = text.match(/Reference Range\s*Method\s*\|?\s*([^|]{0,40})/i);
    if (range) {
      tests.push({
        name: "Reference range",
        value: "Check the original report; OCR may not preserve it correctly."
      });
    }
  }

  return tests;
}


