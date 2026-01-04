"use strict";

/**
 * @file Tuition calculator UI logic.
 * @description Handles course selection and cost breakdown for the tuition calculator page.
 * @author Regan Williams & Rhys Findlater
 */

// Map of selected courses:
// Key = cource code
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