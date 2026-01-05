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

// Cached DOM elements
const selectedListEl = document.getElementById("selectedCoursesList");
const selectedCountEl = document.getElementById("selectedCoursesCount");
const clearBtn = document.getElementById("clearSelectedCourses");

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
function renderSelected() {
  if (!selectedListEl || !selectedCountEl || !clearBtn) return;

  // Update selected count label
  selectedCountEl.textContent = String(selected.size);

  // Disable clear button if nothing is selected
  clearBtn.disabled = selected.size === 0;

  // Clear the existing list before re-rendering
  selectedListEl.innerHTML = "";

  // Build one row per selected course
  for (const course of selected.values()) {
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
                <span class="selected-course-price-label">Tuition</span>
                <span class="selected-course-price-value">$${course.price}</span>
            </div>
            <button
                type="button"
                class="selected-course-remove"
                aria-label="Remove ${course.code}"
            >✕</button>
        `;

    // Wire up the remove button inside this row
    const removeBtn = row.querySelector(".selected-course-remove");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        // Remove from Map
        selected.delete(course.code);
        // Show course again in the available list
        setAvailableCardVisibility(course.code, false);
        // Re-render panel
        renderSelected();
      });
    }
    // Add this course row to the selected-courses list in the UI
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
  renderSelected();
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
  renderSelected();
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
    const price = Number(card.dataset.coursePrice || "0");
    const faculty = card.dataset.courseFaculty || "";

    // When a card is clicked, add that course
    card.addEventListener("click", () => {
      addCourse({ code, title, points, price, faculty });
    });
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

  renderSelected();
}

// Run init once the DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTuitionSelection);
} else {
  initTuitionSelection();
}

/**
 * Attach event listeners to form and perform course price update.
 */
document.querySelectorAll('input[name="learner_type"]').forEach((radio) => {
  radio.addEventListener("change", async function (e) {
    e.preventDefault();
    const value = this.value;
    localStorage.setItem("learner_type", value);
    updatePrices(value);
  });
});

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
}

/**
 * Save learner_type value on page refresh
 */
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("learner_type") || "domestic";

  const radio = document.querySelector(
    `input[name="learner_type"][value="${saved}"]`
  );
  if (radio) radio.checked = true;

  updatePrices(saved);
});
