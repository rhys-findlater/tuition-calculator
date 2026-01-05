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
const clearBtn = document.getElementById("clearSelectedCourses");
const showAllBtn = document.getElementById("showAllCourses");
const showLessBtn = document.getElementById("showLessCourses");

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
  if (!selectedListEl || !selectedCountEl || !clearBtn) return;

  const isDomestic = learnerType === "domestic";
  selectedCountEl.textContent = String(selected.size);
  clearBtn.disabled = selected.size === 0;

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

    const removeBtn = row.querySelector(".selected-course-remove");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        selected.delete(course.code);
        setAvailableCardVisibility(course.code, false);
        renderSelected();
      });
    }
    selectedListEl.appendChild(row);
  }
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
    const addBtn = card.querySelector("[data-course-toggle]");
    if (addBtn) {
      addBtn.addEventListener("click", (e) => {
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

  if (clearBtn) {
    clearBtn.addEventListener("click", clearSelected);
  }

  renderSelected("domestic");
  limitCourses();

  // Initial active pill only
  document
    .querySelectorAll(".course-degree-filter")
    .forEach((pill) => pill.classList.remove("course-degree-filter-active"));
  const allPill = document.querySelector("[data-faculty='All Faculties']");
  if (allPill) allPill.classList.add("course-degree-filter-active");
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

/**
 * Pill filtering functionality
 */
document.querySelectorAll(".course-degree-filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    // Active state
    document
      .querySelectorAll(".course-degree-filter")
      .forEach((pill) => pill.classList.remove("course-degree-filter-active"));
    btn.classList.add("course-degree-filter-active");

    currentFaculty = btn.dataset.faculty;

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
    showLessBtn.style.display = "none"; // Always hide Show Less on pill switch

    const totalMatching =
      Array.from(document.querySelectorAll(".course-selection-course")).filter(
        (card) => {
          const cardFaculty = card.dataset.courseFaculty;
          return (
            currentFaculty === "All Faculties" || cardFaculty === currentFaculty
          );
        }
      ).length - selected.size;

    if (showAllBtn) {
      const needsShowAll = totalMatching > 5;
      showAllBtn.style.display = needsShowAll ? "block" : "none";
      showAllBtn.disabled = !needsShowAll;
    }
  });
});

// Global Show All/Show Less handlers (run once)
if (showAllBtn) {
  showAllBtn.addEventListener("click", () => {
    document.querySelectorAll(".course-selection-course").forEach((card) => {
      const code = card.dataset.courseCode;
      const cardFaculty = card.dataset.courseFaculty;
      const facultyMatch =
        currentFaculty === "All Faculties" || cardFaculty === currentFaculty;
      const isSelected = selected.has(code);
      card.style.display = facultyMatch && !isSelected ? "flex" : "none";
    });

    // Always hide Show All, show Show Less
    showAllBtn.style.display = "none";
    showLessBtn.style.display = "block";
    showLessBtn.disabled = false;
  });
}

if (showLessBtn) {
  showLessBtn.addEventListener("click", () => {
    limitCourses();

    // Always reset to limited state + correct Show All visibility
    showLessBtn.style.display = "none";

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
    if (showAllBtn) {
      showAllBtn.style.display = needsShowAll ? "block" : "none";
      showAllBtn.disabled = !needsShowAll;
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTuitionSelection);
} else {
  initTuitionSelection();
}
