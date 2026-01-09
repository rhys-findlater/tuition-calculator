"use strict";

/**
 * @file Tuition calculator UI logic.
 * @description Handles course selection and cost breakdown for the tuition calculator page.
 * @author Regan Williams & Rhys Findlater
 */

// Map of selected courses:
// Key = course code
// Value = { code, title, points, price, faculty}
const selected = new Map();
let currentFaculty = "All Faculties";

// Cached DOM elements
const selectedListEl = document.getElementById("selectedCoursesList");
const selectedCountEl = document.getElementById("selectedCoursesCount");
const clearBtnEl = document.getElementById("clearSelectedCourses");
const showAllBtnEl = document.getElementById("showAllCourses");
const showLessBtnEl = document.getElementById("showLessCourses");

const costSummaryPillTypeEl = document.getElementById("costSummaryPillType");
const costSummaryPillLocationEl = document.getElementById(
  "costSummaryPillLocation"
);
const gstInfoTooltipEl = document.getElementById("GstInfoToolTip");
const costSummaryCoursesSelectedEl = document.getElementById(
  "costSummaryCoursesSelected"
);
const costSummaryTotalPointsEl = document.getElementById(
  "costSummaryTotalPoints"
);
const costSummaryTotalCostEl = document.getElementById("costSummaryCourseFees");
const costSummaryLevyEl = document.getElementById("costSummaryLevy");
const costSummaryLevyNoteEl = document.getElementById("costSummaryLevyNote");
const costSummarySubtotalEl = document.getElementById("costSummarySubtotal");
const costSummaryGstEl = document.getElementById("costSummaryGst");
const costSummaryTotalEl = document.getElementById("costSummaryTotal");

function limitCourses(initialLimit = 5) {
  const cards = document.querySelectorAll(".course-selection-course");
  let shown = 0;
  cards.forEach((card) => {
    if (card.style.display === "none") return;
    if (shown < initialLimit) {
      card.style.display = "flex";
      shown++;
    } else {
      card.style.display = "none";
    }
  });
}

function getCurrentLearnerType() {
  const checked = document.querySelector('input[name="learner_type"]:checked');
  return checked ? checked.value : "domestic";
}

function getCurrentLearnerLocation() {
  const checked = document.querySelector(
    'input[name="learner_location"]:checked'
  );
  return checked ? checked.value : "onshore";
}

const selectedHeaderEl = document.querySelector(".selected-courses-header");

/**
 * Show or hide a course card in the "Available courses" list.
 *
 * @param code - Course code.
 * @param isSelected - Whether this course is currently selected.
 */
function setAvailableCardVisibility(code, isSelected) {
  const card = document.querySelector(
    `.course-selection-course[data-course-code="${code}"]`
  );

  if (!card) return;

  // Hide card if selected, show card if not selected
  card.style.display = isSelected ? "none" : "flex";
}

/**
 * Re-render the "Selected courses" panel.
 * - Updates the count
 * - Enables/disables the Clear button
 * - Rebuilds the list of selected courses
 */
function renderSelected(learnerType = getCurrentLearnerType()) {
  if (!selectedListEl || !selectedCountEl || !clearBtnEl) return;

  const isDomestic = learnerType === "domestic";
  selectedCountEl.textContent = String(selected.size);
  clearBtnEl.disabled = selected.size === 0;

  // If no courses selected, hide clear all button and selected courses count
  if (selectedHeaderEl) {
    selectedHeaderEl.style.display = selected.size === 0 ? "none" : "flex";
  }

  selectedListEl.innerHTML = "";

  for (const course of selected.values()) {
    const displayPrice = isDomestic ? course.domPrice : course.intPrice;

    const row = document.createElement("div");
    row.className = "selected-course-row";
    row.dataset.courseCode = course.code;

    row.innerHTML = `
      <div class="selected-course-main">
        <div class="selected-course-title">
          <span class="selected-course-code">${course.code}</span>
          <span class="selected-course-name">${course.title}</span>
        </div>
        <div class="selected-course-meta">
          <span class="selected-course-points">${course.points} points</span>
          <span class="selected-course-faculty">${course.faculty}</span>
        </div>
      </div>
      <div class="selected-course-price">
        <span class="selected-course-price-label"></span>
        <span class="selected-course-price-value">$${displayPrice.toFixed(
          2
        )}</span>
      </div>
      <button type="button" class="selected-course-remove" aria-label="Remove ${
        course.code
      }">✕</button>
    `;

    const removeBtnEl = row.querySelector(".selected-course-remove");
    if (removeBtnEl) {
      removeBtnEl.addEventListener("click", () => {
        selected.delete(course.code);
        setAvailableCardVisibility(course.code, false);
        renderSelected();
      });
    }
    selectedListEl.appendChild(row);
  }

  renderSummary(selected);
}

/**
 * Add a course to the selected Map and update the UI.
 *
 * @param course - Course data.
 */
function addCourse(course) {
  selected.set(course.code, course);
  setAvailableCardVisibility(course.code, true);
  renderSelected(getCurrentLearnerType());
}

/**
 * Clear all selected courses.
 */
function clearSelected() {
  // Show all course cards again
  for (const course of selected.values()) {
    setAvailableCardVisibility(course.code, false);
  }

  // Empty the Map and re-render
  selected.clear();
  renderSelected(getCurrentLearnerType());
}

/**
 * Initialise click handlers for each course card
 * in the "Available courses" section.
 */
function initAvailableCourseCards() {
  const cards = document.querySelectorAll(".course-selection-course");
  cards.forEach((card) => {
    const code = card.dataset.courseCode;
    const title = card.dataset.courseTitle;
    const points = Number(card.dataset.coursePoints || "0");
    const domPrice = Number(card.dataset.domPrice || "0");
    const intPrice = Number(card.dataset.intPrice || "0");
    const faculty = card.dataset.courseFaculty || "";

    // Direct button handler only—no outer card click to avoid duplicates
    const addBtnEl = card.querySelector("[data-course-toggle]");
    if (addBtnEl) {
      addBtnEl.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        addCourse({ code, title, points, domPrice, intPrice, faculty });
      });
    }
  });
}

/**
 * Attach event listeners to buttons and perform initial render.
 */
function initTuitionSelection() {
  initAvailableCourseCards();

  if (clearBtnEl) {
    clearBtnEl.addEventListener("click", clearSelected);
  }

  renderSelected("domestic");
  limitCourses();

  // Initial active pill only
  document
    .querySelectorAll(".course-degree-filter")
    .forEach((pill) => pill.classList.remove("course-degree-filter-active"));
  const allPillEl = document.querySelector("[data-faculty='All Faculties']");
  if (allPillEl) allPillEl.classList.add("course-degree-filter-active");
}

/**
 * Update course prices based on form value.
 * @param value - learner_type value
 */
function updatePrices(value) {
  const isDomestic = value === "domestic";

  document.querySelectorAll(".course-selection-course").forEach((card) => {
    const domPrice = parseFloat(card.dataset.domPrice);
    const intPrice = parseFloat(card.dataset.intPrice);

    const selectedPrice = isDomestic ? domPrice : intPrice;

    card.dataset.coursePrice = selectedPrice;

    const priceEl = card.querySelector(
      ".course-selection-course-button-container p"
    );
    if (priceEl) {
      priceEl.textContent = `$${selectedPrice.toFixed(2)}`;
    }
  });

  renderSelected(value);
}

document.querySelectorAll('input[name="learner_type"]').forEach((radio) => {
  radio.addEventListener("change", function (e) {
    e.preventDefault();
    updatePrices(this.value);
  });
});

document.querySelectorAll('input[name="learner_location"]').forEach((radio) => {
  radio.addEventListener("change", function () {
    // Just re-render summary with updated location
    renderSummary(selected);
  });
});

/**
 * Pill filtering functionality
 */
document.querySelectorAll(".course-degree-filter").forEach((btnEl) => {
  btnEl.addEventListener("click", () => {
    // Active state
    document
      .querySelectorAll(".course-degree-filter")
      .forEach((pill) => pill.classList.remove("course-degree-filter-active"));
    btnEl.classList.add("course-degree-filter-active");

    currentFaculty = btnEl.dataset.faculty;

    // Filter + hide selected
    document.querySelectorAll(".course-selection-course").forEach((card) => {
      const code = card.dataset.courseCode;
      const cardFaculty = card.dataset.courseFaculty;
      const facultyMatch =
        currentFaculty === "All Faculties" || cardFaculty === currentFaculty;
      const isSelected = selected.has(code);
      card.style.display = facultyMatch && !isSelected ? "flex" : "none";
    });

    limitCourses(); // Limit visible to 5

    // Reset buttons to correct state for NEW faculty
    showLessBtnEl.style.display = "none"; // Always hide Show Less on pill switch

    const totalMatching =
      Array.from(document.querySelectorAll(".course-selection-course")).filter(
        (card) => {
          const cardFaculty = card.dataset.courseFaculty;
          return (
            currentFaculty === "All Faculties" || cardFaculty === currentFaculty
          );
        }
      ).length - selected.size;

    if (showAllBtnEl) {
      const needsShowAll = totalMatching > 5;
      showAllBtnEl.style.display = needsShowAll ? "block" : "none";
      showAllBtnEl.disabled = !needsShowAll;
    }
  });
});

// Global Show All/Show Less handlers (run once)
if (showAllBtnEl) {
  showAllBtnEl.addEventListener("click", () => {
    document.querySelectorAll(".course-selection-course").forEach((card) => {
      const code = card.dataset.courseCode;
      const cardFaculty = card.dataset.courseFaculty;
      const facultyMatch =
        currentFaculty === "All Faculties" || cardFaculty === currentFaculty;
      const isSelected = selected.has(code);
      card.style.display = facultyMatch && !isSelected ? "flex" : "none";
    });

    // Always hide Show All, show Show Less
    showAllBtnEl.style.display = "none";
    showLessBtnEl.style.display = "block";
    showLessBtnEl.disabled = false;
  });
}

if (showLessBtnEl) {
  showLessBtnEl.addEventListener("click", () => {
    limitCourses();

    // Always reset to limited state + correct Show All visibility
    showLessBtnEl.style.display = "none";

    const totalMatching =
      Array.from(document.querySelectorAll(".course-selection-course")).filter(
        (card) => {
          const cardFaculty = card.dataset.courseFaculty;
          return (
            currentFaculty === "All Faculties" || cardFaculty === currentFaculty
          );
        }
      ).length - selected.size;

    const needsShowAll = totalMatching > 5;
    if (showAllBtnEl) {
      showAllBtnEl.style.display = needsShowAll ? "block" : "none";
      showAllBtnEl.disabled = !needsShowAll;
    }
  });
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function calculateLevy(selectedCoursesSize, totalCoursePoints) {
  if (selectedCoursesSize === 1 && totalCoursePoints === 15) return 29.1;
  if (totalCoursePoints === 60) return 116.4;
  if (totalCoursePoints === 120) return 232.8;
  return "TBD";
}

function calculateCoursesTotals(selectedCourses, isDomestic) {
  let points = 0;
  let cost = 0;

  for (const course of selectedCourses.values()) {
    const coursePrice = isDomestic ? course.domPrice : course.intPrice;
    points += course.points;
    cost += coursePrice;
  }

  return { points, cost };
}

function renderSummary(
  selectedCourses,
  learnerType = getCurrentLearnerType(),
  learnerLocation = getCurrentLearnerLocation()
) {
  if (!costSummaryTotalEl) return; // using one known element as guard

  const isIdle = selectedCourses.size === 0;
  const costSummaryContainerEl = document.getElementById("costSummary");
  costSummaryContainerEl.classList.toggle("cost-summary-idle", isIdle);
  if (isIdle) return;

  const isDomestic = learnerType === "domestic";

  // Header pills
  costSummaryPillTypeEl.textContent = capitalize(learnerType);
  costSummaryPillLocationEl.textContent = capitalize(learnerLocation);

  // GST tooltip
  gstInfoTooltipEl.textContent =
    learnerLocation === "offshore"
      ? "GST does not apply to offshore learners"
      : "GST is calculated at 15% of the subtotal excluding the levy.";

  costSummaryCoursesSelectedEl.textContent = String(selectedCourses.size);

  // Course totals
  const { points: totalCoursePoints, cost: totalCourseCost } =
    calculateCoursesTotals(selectedCourses, isDomestic);

  costSummaryTotalPointsEl.textContent = String(totalCoursePoints);
  costSummaryTotalCostEl.textContent = `$${totalCourseCost.toFixed(2)}`;

  // Levy
  const levy = calculateLevy(selectedCourses.size, totalCoursePoints);
  costSummaryLevyEl.textContent =
    levy === "TBD" ? "TBD" : `$${levy.toFixed(2)}`;
  costSummaryLevyNoteEl.textContent = `Based on ${totalCoursePoints} points`;

  // Subtotal
  const levyAmount = levy === "TBD" ? 0 : Number(levy);
  const subTotal = levyAmount + totalCourseCost;
  costSummarySubtotalEl.textContent = `$${subTotal.toFixed(2)}`;

  // GST
  const gst = learnerLocation === "onshore" ? subTotal * 0.15 : 0;
  costSummaryGstEl.textContent = `$${gst.toFixed(2)}`;

  // Total
  const totalCost = subTotal + gst;
  costSummaryTotalEl.textContent = `$${totalCost.toFixed(2)}`;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTuitionSelection);
} else {
  initTuitionSelection();
}
