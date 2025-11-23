// ===============================
//  CLASS 12 STUDY PLANNER SCRIPT
//  Loads subjects.json
//  Handles UI + Logic
// ===============================

// GLOBAL STATE (saved in localStorage)
let state = JSON.parse(localStorage.getItem("study_state") || "{}");

if (!state.combo) state.combo = "PCMB";
if (!state.checked) state.checked = {};

function saveState() {
  localStorage.setItem("study_state", JSON.stringify(state));
}

// GLOBAL DATA (loaded from subjects.json)
let SUBJECTS = {};


// ===============================
//  LOAD SUBJECT DATA
// ===============================

fetch("subjects.json")
  .then(res => res.json())
  .then(data => {
    SUBJECTS = data;
    renderSubjects();
    updateDashboard();
  })
  .catch(err => {
    console.error("Error loading subjects.json", err);
    alert("Could not load subjects.json — ensure the file exists!");
  });


// ===============================
//  UI ELEMENTS
// ===============================

const subjectsContainer = document.getElementById("subjectsContainer");
const sheet = document.getElementById("bottomSheet");
const sheetOverlay = document.getElementById("sheetOverlay");
const sheetTitle = document.getElementById("sheetTitle");
const sheetContent = document.getElementById("sheetContent");


// ===============================
//  RENDER SUBJECTS + CHAPTERS
// ===============================

function renderSubjects() {
  subjectsContainer.innerHTML = "";
  const combo = state.combo;

  const order = ["Physics", "Chemistry", "Maths", "Biology"];

  order.forEach(subject => {

    // combo filter
    if (subject === "Maths" && !combo.includes("M")) return;
    if (subject === "Biology" && !combo.includes("B")) return;

    const wrap = document.createElement("div");
    wrap.className = "subject";

    // subject header
    const head = document.createElement("h3");
    head.textContent = subject;
    head.onclick = () => head.classList.toggle("open");
    wrap.appendChild(head);

    // chapter list
    const chapters = SUBJECTS[subject];
    for (let chapter in chapters) {
      const row = document.createElement("div");
      row.className = "chapter";
      row.innerHTML = `<span>${chapter}</span> <span>▶</span>`;
      row.onclick = () => openSheet(subject, chapter);
      wrap.appendChild(row);
    }

    subjectsContainer.appendChild(wrap);
  });
}
// ===============================
//  BOTTOM SHEET (Slide-up + Drag)
// ===============================

let startY = 0;
let currentY = 0;

function openSheet(subject, chapter) {
  sheetTitle.textContent = chapter;
  sheetContent.innerHTML = "";

  const topics = SUBJECTS[subject][chapter];

  topics.forEach(topic => {
    const id = `${subject}||${chapter}||${topic}`;

    const row = document.createElement("div");
    row.innerHTML = `
      <input type="checkbox" ${state.checked[id] ? "checked" : ""}>
      <label>${topic}</label>
    `;

    row.querySelector("input").onchange = () => {
      state.checked[id] = row.querySelector("input").checked;
      saveState();
      updateDashboard();
    };

    sheetContent.appendChild(row);
  });

  sheet.classList.remove("hidden");
  sheetOverlay.classList.remove("hidden");

  // animate in
  requestAnimationFrame(() => {
    sheet.style.bottom = "0px";
  });
}

function closeSheet() {
  sheet.style.bottom = "-100%";
  sheetOverlay.classList.add("hidden");

  setTimeout(() => {
    sheet.classList.add("hidden");
  }, 300);
}

sheetOverlay.onclick = closeSheet;

// -------- DRAG EVENTS --------

sheet.addEventListener("touchstart", e => {
  startY = e.touches[0].clientY;
});

sheet.addEventListener("touchmove", e => {
  currentY = e.touches[0].clientY - startY;

  if (currentY > 0) {
    sheet.style.bottom = `-${currentY}px`;
  }
});

sheet.addEventListener("touchend", e => {
  if (currentY > 100) {
    closeSheet();
  } else {
    sheet.style.bottom = "0px";
  }
});
// ===============================
//  DASHBOARD CALCULATIONS
// ===============================

function calc(subject) {
  const chapters = SUBJECTS[subject];
  let total = 0;
  let done = 0;

  for (let chap in chapters) {
    chapters[chap].forEach(topic => {
      total++;
      if (state.checked[`${subject}||${chap}||${topic}`]) {
        done++;
      }
    });
  }

  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

function updateDashboard() {
  const combo = state.combo;

  // subject percentages
  document.getElementById("phyPercent").textContent = calc("Physics") + "%";
  document.getElementById("chemPercent").textContent = calc("Chemistry") + "%";

  if (combo.includes("M")) {
    document.getElementById("mathPercent").textContent = calc("Maths") + "%";
  } else {
    document.getElementById("mathPercent").textContent = "N/A";
  }

  if (combo.includes("B")) {
    document.getElementById("bioPercent").textContent = calc("Biology") + "%";
  } else {
    document.getElementById("bioPercent").textContent = "N/A";
  }

  // overall calculation
  let included = [];

  if (combo.includes("P")) included.push("Physics");
  if (combo.includes("C")) included.push("Chemistry");
  if (combo.includes("M")) included.push("Maths");
  if (combo.includes("B")) included.push("Biology");

  let total = 0;
  let done = 0;

  included.forEach(sub => {
    for (let ch in SUBJECTS[sub]) {
      SUBJECTS[sub][ch].forEach(topic => {
        total++;
        if (state.checked[`${sub}||${ch}||${topic}`]) {
          done++;
        }
      });
    }
  });

  let percent = total === 0 ? 0 : Math.round((done / total) * 100);

  document.getElementById("overallPercent").textContent = percent + "%";
}
// ===============================
//  APPLY SUBJECT COMBO (PCMB/PCM/PCB)
// ===============================

document.getElementById("applyCombo").onclick = () => {
  const selected = document.querySelector('input[name="combo"]:checked').value;
  state.combo = selected;
  saveState();
  renderSubjects();
  updateDashboard();
};


// ===============================
//  PERSONALISED PLAN UI TOGGLE
// ===============================

document.getElementById("wantPlan").onchange = () => {
  const box = document.getElementById("wantPlan").value;
  document.getElementById("planPrefs").classList.toggle("hidden", box === "no");
};


// ===============================
//  SEND WHATSAPP MESSAGE
// ===============================

document.getElementById("sendBtn").onclick = () => {
  const name = document.getElementById("studentName").value;
  const email = document.getElementById("studentEmail").value;
  const hours = document.getElementById("hoursPerDay").value;
  const examDate = document.getElementById("examDate").value;

  const overall = document.getElementById("overallPercent").textContent;

  // 🔥 YOUR WHATSAPP NUMBER HERE (with country code)
  const phone = "91XXXXXXXXXX"; // ← replace with your number

  const msg = `
*Personalised Study Plan Request*
------------------------------------
Name: ${name}
Email: ${email}
Hours/Day: ${hours}
Exam Date: ${examDate}

Overall Completion: ${overall}

Please send personalised study plan.
`;

  const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  window.open(url, "_blank");
};
// ===============================
//  INITIAL STARTUP
// ===============================

function init() {
  // Restore correct combo selection
  const comboRadios = document.querySelectorAll('input[name="combo"]');
  comboRadios.forEach(r => {
    r.checked = (r.value === state.combo);
  });

  // Subjects will be rendered AFTER subjects.json loads
}

init();

