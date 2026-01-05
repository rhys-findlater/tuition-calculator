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

