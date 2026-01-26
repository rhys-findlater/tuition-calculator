"use strict";

/**
 * @file Tuition calculator UI logic.
 * @description Handles course selection and cost breakdown for the tuition calculator page.
 * @author
 */

// State maps
const selectedCourses = new Map();
const selectedDegrees = new Map();

let currentCourseFaculty = "All Faculties";
let currentDegreeFaculty = "All Faculties";

// Courses
const selectedCoursesHeaderEl = document.querySelector(
  ".selected-courses-header",
);
const selectedCoursesListEl = document.getElementById("selectedCoursesList");
const selectedCoursesCountEl = document.getElementById("selectedCoursesCount");
const clearCoursesBtnEl = document.getElementById("clearSelectedCourses");
const showAllCoursesBtnEl = document.getElementById("showAllCourses");
const showLessCoursesBtnEl = document.getElementById("showLessCourses");

// Degrees
const selectedDegreesHeaderEl = document.querySelector(
  ".selected-degrees-header",
);
const selectedDegreesListEl = document.getElementById("selectedDegreesList");
const selectedDegreesCountEl = document.getElementById("selectedDegreesCount");
const clearDegreesBtnEl = document.getElementById("clearSelectedDegrees");
const showAllDegreesBtnEl = document.getElementById("showAllDegrees");
const showLessDegreesBtnEl = document.getElementById("showLessDegrees");

// Cost summary
const costSummaryPillTypeEl = document.getElementById("costSummaryPillType");
const costSummaryItemNameEl = document.getElementById("costSummaryItemName");
const costSummaryPillLocationEl = document.getElementById(
  "costSummaryPillLocation",
);
const gstInfoTooltipEl = document.getElementById("GstInfoToolTip");
const costSummaryCoursesSelectedEl = document.getElementById(
  "costSummaryCoursesSelected",
);
const costSummaryTotalPointsEl = document.getElementById(
  "costSummaryTotalPoints",
);
const costSummaryTotalCostEl = document.getElementById("costSummaryCourseFees");
const costSummaryLevyEl = document.getElementById("costSummaryLevy");
const costSummaryLevyNoteEl = document.getElementById("costSummaryLevyNote");
const costSummarySubtotalEl = document.getElementById("costSummarySubtotal");
const costSummaryGstEl = document.getElementById("costSummaryGst");
const costSummaryTotalEl = document.getElementById("costSummaryTotal");

// Dropdowns
const degreeDropdownBtnEl = document.getElementById("tabDegreesBtn");
const courseDropdownBtnEl = document.getElementById("tabCoursesBtn");
const degreeBodyEl = document.getElementById("degreeBodyContainer");
const courseBodyEl = document.getElementById("courseBodyContainer");

// Get elements
const exportPDFButtonEl = document.getElementById("exportPDFButton");

const pdfPromptEl = document.getElementById("pdfPrompt");
const pdfPromptInputEl = document.getElementById("pdfPromptInput");
const pdfPromptCancelBtnEl = document.getElementById("pdfPromptCancelBtn");
const pdfPromptExportBtnEl = document.getElementById("pdfPromptExportBtn");
const pdfPromptCloseBtnEl = document.getElementById("pdfPromptCloseBtn");
const pdfPromptCoursesPillEl = document.getElementById("pdfPromptCoursesPill");
const pdfPromptTotalCostEl = document.getElementById("pdfPromptTotalCost");

// Central config per type
const selectionConfigs = {
  course: {
    name: "course",
    items: selectedCourses,
    cardSelector: ".selection-course",
    toggleAttr: "data-course-toggle",
    dataKey: "course-code",
    attributeKey: "courseCode",
    headerEl: selectedCoursesHeaderEl,
    listEl: selectedCoursesListEl,
    countEl: selectedCoursesCountEl,
    clearBtnEl: clearCoursesBtnEl,
    showAllBtnEl: showAllCoursesBtnEl,
    showLessBtnEl: showLessCoursesBtnEl,
    datasetKeys: {
      code: "courseCode",
      title: "courseTitle",
      points: "coursePoints",
      domPrice: "courseDomPrice",
      intPrice: "courseIntPrice",
      faculty: "courseFaculty",
    },
    searchInputId: "course-search",
    searchClearId: "searchClearCourse",
    facultyBtnSelector: ".faculty-btn-course",
    allFacultyAttr: "[data-course-faculty='All Faculties']",
  },
  degree: {
    name: "degree",
    items: selectedDegrees,
    cardSelector: ".selection-degree",
    toggleAttr: "data-degree-toggle",
    dataKey: "degree-code",
    attributeKey: "degreeCode",
    headerEl: selectedDegreesHeaderEl,
    listEl: selectedDegreesListEl,
    countEl: selectedDegreesCountEl,
    clearBtnEl: clearDegreesBtnEl,
    showAllBtnEl: showAllDegreesBtnEl,
    showLessBtnEl: showLessDegreesBtnEl,
    datasetKeys: {
      code: "degreeCode",
      title: "degreeTitle",
      points: "degreePoints",
      domPrice: "degreeDomPrice",
      intPrice: "degreeIntPrice",
      faculty: "degreeFaculty",
    },
    searchInputId: "degree-search",
    searchClearId: "searchClearDegree",
    facultyBtnSelector: ".faculty-btn-degree",
    allFacultyAttr: "[data-degree-faculty='All Faculties']",
  },
};

/* -------------------- Shared helpers -------------------- */

function toggleDropdown(courseBtnEl, degreeBtnEl, courseEl, degreeEl) {
  if (!courseBtnEl || !degreeBtnEl || !courseEl || !degreeEl) return;

  let pressed = false;

  courseBtnEl.addEventListener("click", () => {
    if (pressed) {
      degreeEl.classList.toggle("selection-body-container-idle");
      degreeBtnEl.classList.toggle("tab-btn-active");

      // selectedDegrees.clear();
      // renderSelection("degree");
      // renderSummary(selectedCourses);

      courseEl.classList.toggle("selection-body-container-idle");
      courseBtnEl.classList.toggle("tab-btn-active");

      pressed = false;
    }
  });

  degreeBtnEl.addEventListener("click", () => {
    if (!pressed) {
      courseEl.classList.toggle("selection-body-container-idle");
      courseBtnEl.classList.toggle("tab-btn-active");

      // selectedCourses.clear();
      // renderSelection("course");
      // renderSummary(selectedCourses);

      degreeEl.classList.toggle("selection-body-container-idle");
      degreeBtnEl.classList.toggle("tab-btn-active");

      pressed = true;
    }
  });
}

function enablePopupDismiss(popupEl, closeFn) {
  if (!popupEl || typeof closeFn !== "function") return;

  // Click on the backdrop only
  popupEl.addEventListener(
    "click",
    (e) => {
      if (e.target === popupEl) closeFn();
    },
    { once: true },
  );

  // ESC
  document.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Escape") closeFn();
    },
    { once: true },
  );
}

function openDegreeLimitPopup(
  degreeLimitPopup,
  currentTitle,
  newTitle,
  onReplace,
) {
  if (!degreeLimitPopup) return;

  const currentEl = document.getElementById("currentDegreeName");
  const newEl = document.getElementById("newDegreeName");

  const cancelBtn = document.getElementById("degreeLimitCancelBtn");
  const replaceBtn = document.getElementById("degreeLimitReplaceBtn");

  if (currentEl) currentEl.textContent = currentTitle || "";
  if (newEl) newEl.textContent = newTitle || "";

  openBackdropModal(degreeLimitPopup);
  const close = () => closeBackdropModal(degreeLimitPopup);
  enablePopupDismiss(degreeLimitPopup, close);

  cancelBtn?.addEventListener("click", close, { once: true });

  replaceBtn?.addEventListener(
    "click",
    () => {
      close();
      if (typeof onReplace === "function") onReplace();
    },
    { once: true },
  );
}

function getPotentialVisibleCount(
  selector,
  selected,
  { facultyKey, codeKey },
  currentFaculty,
) {
  return Array.from(document.querySelectorAll(selector)).filter((card) => {
    const cardFaculty = card.dataset[facultyKey];
    const facultyMatch =
      currentFaculty === "All Faculties" || cardFaculty === currentFaculty;
    const isSelected = selected.has(card.dataset[codeKey]);
    return facultyMatch && !isSelected;
  }).length;
}

function limitItems(selector, initialLimit = 5) {
  const cards = document.querySelectorAll(selector);
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

function refreshCourses() {
  fetch("/api/courses")
    .then((response) => response.json())
    .then((data) => {
      // Clear existing courses
      selectedCourses.clear();

      // Re-render the course cards with new data
      // You'll need to update your HTML to reflect the new courses
      // This is a simplified example - adjust based on your HTML structure
      location.reload(); // Simple approach: reload the page
    })
    .catch((error) => {
      console.error("Failed to refresh courses:", error);
    });
}

function getCurrentLearnerType() {
  const checked = document.querySelector('input[name="learner_type"]:checked');
  return checked ? checked.value : "domestic";
}

function getCurrentLearnerLocation() {
  const checked = document.querySelector(
    'input[name="learner_location"]:checked',
  );
  return checked ? checked.value : "onshore";
}

function setAvailableCardVisibility(selector, dataKey, code, isSelected) {
  const card = document.querySelector(`${selector}[data-${dataKey}="${code}"]`);

  if (!card) return;
  card.style.display = isSelected ? "none" : "flex";
}

function collectPdfData() {
  const nameInput = (
    document.getElementById("pdfPromptInput")?.value || ""
  ).trim();
  const learner_type = getCurrentLearnerType();
  const learner_location = getCurrentLearnerLocation();
  const gst_applicable = learner_location === "onshore";

  const activeItems =
    selectedCourses.size > 0 ? selectedCourses : selectedDegrees;
  const itemType = activeItems === selectedCourses ? "course" : "degree";

  // Build the courses array from selectedCourses map
  const courses = Array.from(activeItems.values()).map((course) => ({
    code: course.code,
    name: course.title,
    points: course.points,
    fee: (learner_type === "domestic"
      ? course.domPrice
      : course.intPrice
    ).toLocaleString("en-NZ", {
      style: "currency",
      currency: "NZD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  }));

  // Read the displayed summary numbers from the UI so PDF matches inputs
  const courseFeesText = costSummaryTotalCostEl?.textContent?.trim() || "";
  const levyText = costSummaryLevyEl?.textContent?.trim() || "";
  const subTotalText = costSummarySubtotalEl?.textContent?.trim() || "";
  const gstText = costSummaryGstEl?.textContent?.trim() || "";
  const totalText = costSummaryTotalEl?.textContent?.trim() || "";
  const totalPointsText = costSummaryTotalPointsEl?.textContent?.trim() || "";

  const generateddate = new Date().toLocaleString("en-NZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    nameInput,
    generateddate,
    learner_type,
    learner_location,
    gst_applicable,
    courses,
    course_fees: courseFeesText,
    points: Number(totalPointsText) || 0,
    levy: levyText,
    subTotal: subTotalText,
    gst: gstText,
    totalCost: totalText,
    itemType,
  };
}

async function exportToPDF() {
  const payload = collectPdfData();

  // Sends an HTTP request and waits for a response
  const response = await fetch("/export-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // If status is not in the 200-299 range, failed. Surface the server message
  if (!response.ok) {
    throw new Error(
      `Export failed: ${response.status} ${await response.text()}`,
    );
  }

  // Turns the PDF response into a downloadable file
  const pdfBlob = await response.blob();
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // Todays date ("DD-MM-YYYY"), to attach to the file name
  const today = new Date().toLocaleDateString("en-NZ").replaceAll("/", "-");

  // Trigger a download in the browser
  const link = Object.assign(document.createElement("a"), {
    href: pdfUrl,
    download: `Course_Plan_Generated_${today}.pdf`,
  });

  link.click();
  URL.revokeObjectURL(pdfUrl);
}

/* -------------------- Search -------------------- */

function applySearch(searchInputId, type) {
  const cfg = selectionConfigs[type];
  const searchInput = document.getElementById(searchInputId);
  if (!cfg || !searchInput) return;

  const query = searchInput.value.trim().toLowerCase();
  const { items, cardSelector, datasetKeys } = cfg;

  const currentFaculty =
    type === "course" ? currentCourseFaculty : currentDegreeFaculty;

  document.querySelectorAll(cardSelector).forEach((card) => {
    const code = (card.dataset[datasetKeys.code] || "").toLowerCase();
    const title = (card.dataset[datasetKeys.title] || "").toLowerCase();
    const matches =
      query === "" || code.includes(query) || title.includes(query);

    const cardFaculty = card.dataset[datasetKeys.faculty];
    const facultyMatch =
      currentFaculty === "All Faculties" || cardFaculty === currentFaculty;

    const id =
      card.dataset[datasetKeys.code] ?? card.dataset[datasetKeys.title];
    const isSelected = items.has(id);

    card.style.display =
      matches && facultyMatch && !isSelected ? "flex" : "none";
  });

  const showAllBtnEl = cfg.showAllBtnEl;
  const showLessBtnEl = cfg.showLessBtnEl;

  if (query === "") {
    const potentialVisible = getPotentialVisibleCount(
      cardSelector,
      items,
      {
        facultyKey: datasetKeys.faculty,
        codeKey: datasetKeys.code,
      },
      currentFaculty,
    );
    const needsShowAll = potentialVisible > 5;

    limitItems(cardSelector);

    if (showAllBtnEl) {
      showAllBtnEl.style.display = needsShowAll ? "block" : "none";
      showAllBtnEl.disabled = !needsShowAll;
    }
    if (showLessBtnEl) {
      showLessBtnEl.style.display = "none";
      showLessBtnEl.disabled = true;
    }
  } else {
    if (showAllBtnEl) showAllBtnEl.style.display = "none";
    if (showLessBtnEl) showLessBtnEl.style.display = "none";
  }
}

function initSearch(type) {
  const cfg = selectionConfigs[type];
  if (!cfg) return;

  const searchInput = document.getElementById(cfg.searchInputId);
  const clearBtn = document.getElementById(cfg.searchClearId);
  const searchForm = searchInput ? searchInput.closest("form") : null;
  if (!searchInput) return;

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => e.preventDefault());
  }

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") e.preventDefault();
  });

  searchInput.addEventListener("input", () =>
    applySearch(cfg.searchInputId, type),
  );

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchInput.focus();
      applySearch(cfg.searchInputId, type);
    });
  }
}

/* -------------------- Rendering selected lists -------------------- */

function renderSelected(
  selector,
  dataKey,
  attributeKey,
  headerEl,
  listEl,
  countEl,
  clearBtnEl,
  showAllBtnEl,
  showLessBtnEl,
  selected,
  learnerType = getCurrentLearnerType(),
) {
  if (!listEl || !countEl || !clearBtnEl) return;

  const isDomestic = learnerType === "domestic";
  countEl.textContent = String(selected.size);
  clearBtnEl.disabled = selected.size === 0;

  if (headerEl) {
    headerEl.style.display = selected.size === 0 ? "none" : "flex";
  }

  listEl.innerHTML = "";

  for (const item of selected.values()) {
    const displayPrice = isDomestic ? item.domPrice : item.intPrice;

    const row = document.createElement("div");
    row.className = "selected-item-row";
    row.dataset[attributeKey] = item.code;

    row.innerHTML = `
      <div class="selected-item-main">
        <div class="selected-item-title">
          <span class="selected-item-code">${item.code}</span>
          <span class="selected-item-name">${item.title}</span>
        </div>
        <div class="selected-item-meta">
          <span class="selected-item-points">${item.points} points</span>
          <span class="selected-item-faculty">${item.faculty}</span>
        </div>
      </div>
      <div class="selected-item-price">
        <span class="selected-item-price-label"></span>
        <span class="selected-item-price-value">${displayPrice.toLocaleString(
          "en-NZ",
          {
            style: "currency",
            currency: "NZD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          },
        )}</span>
      </div>
      <button type="button" class="selected-item-remove" aria-label="Remove ${
        item.code
      }">✕</button>
    `;

    const removeBtnEl = row.querySelector(".selected-item-remove");
    if (removeBtnEl) {
      removeBtnEl.addEventListener("click", () => {
        selected.delete(item.code);
        setAvailableCardVisibility(selector, dataKey, item.code, false);
        renderSelected(
          selector,
          dataKey,
          attributeKey,
          headerEl,
          listEl,
          countEl,
          clearBtnEl,
          showAllBtnEl,
          showLessBtnEl,
          selected,
        );
        renderSummary();
      });
    }

    listEl.appendChild(row);
  }

  renderSummary();
}

function renderSelection(type, learnerType = getCurrentLearnerType()) {
  const cfg = selectionConfigs[type];
  if (!cfg) return;

  renderSelected(
    cfg.cardSelector,
    cfg.dataKey,
    cfg.attributeKey,
    cfg.headerEl,
    cfg.listEl,
    cfg.countEl,
    cfg.clearBtnEl,
    cfg.showAllBtnEl,
    cfg.showLessBtnEl,
    cfg.items,
    learnerType,
  );
}

/* -------------------- Add / clear -------------------- */

function addItem(type, item) {
  const cfg = selectionConfigs[type];
  if (!cfg) return;

  let altType;
  type === "degree" ? (altType = "course") : (altType = "degree");

  const altCfg = selectionConfigs[altType];

  const modalCourse = document.getElementById("errorModalCourse");
  const modalDegree = document.getElementById("errorModalDegree");
  const replaceBtnCourse = document.getElementById("errorReplaceCourseBtn");
  const closeBtnCourse = document.getElementById("errorCloseCourseBtn");
  const replaceBtnDegree = document.getElementById("errorReplaceDegreeBtn");
  const closeBtnDegree = document.getElementById("errorCloseDegreeBtn");

  if (altCfg.items.size >= 1) {
    const activeModal = altType === "degree" ? modalCourse : modalDegree;

    openBackdropModal(activeModal);

    enablePopupDismiss(activeModal, () => {
      closeBackdropModal(activeModal);
    });

    replaceBtnCourse.onclick = () => {
      closeBackdropModal(modalCourse);

      for (const altItem of altCfg.items.values()) {
        setAvailableCardVisibility(
          altCfg.cardSelector,
          altCfg.dataKey,
          altItem.code,
          false,
        );
      }

      altCfg.items.clear();
      renderSelection(altType);

      cfg.items.set(item.code, item);
      setAvailableCardVisibility(
        cfg.cardSelector,
        cfg.dataKey,
        item.code,
        true,
      );
      renderSelection(type);
      renderSummary();
    };

    closeBtnCourse.onclick = () => {
      closeBackdropModal(modalCourse);
    };

    replaceBtnDegree.onclick = () => {
      modalDegree.setAttribute("hidden", "");

      for (const altItem of altCfg.items.values()) {
        setAvailableCardVisibility(
          altCfg.cardSelector,
          altCfg.dataKey,
          altItem.code,
          false,
        );
      }

      altCfg.items.clear();
      renderSelection(altType);

      cfg.items.set(item.code, item);
      setAvailableCardVisibility(
        cfg.cardSelector,
        cfg.dataKey,
        item.code,
        true,
      );
      renderSelection(type);
      renderSummary();
    };

    closeBtnDegree.onclick = () => {
      modalDegree.setAttribute("hidden", "");
    };

    return;
  }

  if (cfg) cfg.items.set(item.code, item);

  setAvailableCardVisibility(cfg.cardSelector, cfg.dataKey, item.code, true);
  renderSelection(type);
}

function clearSelection(type) {
  const cfg = selectionConfigs[type];
  if (!cfg) return;

  for (const course of cfg.items.values()) {
    setAvailableCardVisibility(
      cfg.cardSelector,
      cfg.dataKey,
      course.code,
      false,
    );
  }

  cfg.items.clear();
  renderSelection(type);
}

/* -------------------- Init available cards -------------------- */

function initAvailableCards(type) {
  const cfg = selectionConfigs[type];
  if (!cfg) return;

  const { cardSelector, toggleAttr, datasetKeys } = cfg;
  const cards = document.querySelectorAll(cardSelector);

  cards.forEach((card) => {
    const code = card.dataset[datasetKeys.code];
    const title = card.dataset[datasetKeys.title];
    const points = Number(card.dataset[datasetKeys.points] || "0");
    const domPrice = Number(card.dataset[datasetKeys.domPrice] || "0");
    const intPrice = Number(card.dataset[datasetKeys.intPrice] || "0");
    const faculty = card.dataset[datasetKeys.faculty] || "";

    const addBtnEl = card.querySelector(`[${toggleAttr}]`);

    if (!addBtnEl) return;

    addBtnEl.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const degreeLimitPopup = document.getElementById("degreeLimitPopup");

      if (cfg.name === "degree" && cfg.items.size >= 1) {
        const existing = Array.from(cfg.items.values())[0];
        const currentTitle = existing?.title;

        openDegreeLimitPopup(
          degreeLimitPopup,
          currentTitle,
          title, // clicked degree title
          () => {
            // remove existing degree
            for (const old of cfg.items.values()) {
              setAvailableCardVisibility(
                cfg.cardSelector,
                cfg.dataKey,
                old.code,
                false,
              );
            }
            cfg.items.clear();
            renderSelection("degree");

            addItem("degree", {
              code,
              title,
              points,
              domPrice,
              intPrice,
              faculty,
            });
          },
        );

        return;
      }

      addItem(type, { code, title, points, domPrice, intPrice, faculty });
    });
  });
}

/* -------------------- Prices -------------------- */

function updatePrices(value) {
  const isDomestic = value === "domestic";

  document.querySelectorAll(".selection-course").forEach((card) => {
    const courseDomPrice = parseFloat(card.dataset.courseDomPrice);
    const courseIntPrice = parseFloat(card.dataset.courseIntPrice);
    const selectedPrice = isDomestic ? courseDomPrice : courseIntPrice;

    card.dataset.coursePrice = selectedPrice;

    const priceEl = card.querySelector(".item-button-container p");
    if (priceEl) {
      priceEl.textContent = selectedPrice.toLocaleString("en-NZ", {
        style: "currency",
        currency: "NZD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  });

  document.querySelectorAll(".selection-degree").forEach((card) => {
    const degreeDomPrice = parseFloat(card.dataset.degreeDomPrice);
    const degreeIntPrice = parseFloat(card.dataset.degreeIntPrice);
    const selectedPrice = isDomestic ? degreeDomPrice : degreeIntPrice;

    card.dataset.degreePrice = selectedPrice;

    const priceEl = card.querySelector(".item-button-container p");
    if (priceEl) {
      priceEl.textContent = selectedPrice.toLocaleString("en-NZ", {
        style: "currency",
        currency: "NZD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
  });

  renderSelection("course", value);
  renderSelection("degree", value);
}

/* -------------------- Summary -------------------- */

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function calculateLevy(selectedCoursesSize, totalCoursePoints) {
  return totalCoursePoints * 2.06;
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
  learnerType = getCurrentLearnerType(),
  learnerLocation = getCurrentLearnerLocation(),
) {
  if (!costSummaryTotalEl) return;

  const activeItems =
    selectedCourses.size > 0 ? selectedCourses : selectedDegrees;
  const isIdle = activeItems.size === 0;

  const costSummaryContainerEl = document.getElementById("costSummary");
  costSummaryContainerEl.classList.toggle("cost-summary-idle", isIdle);
  if (isIdle) return;

  const isDomestic = learnerType === "domestic";

  costSummaryPillTypeEl.textContent = capitalize(learnerType);
  costSummaryPillLocationEl.textContent = capitalize(learnerLocation);

  gstInfoTooltipEl.textContent =
    learnerLocation === "offshore"
      ? "GST does not apply to offshore learners"
      : "GST is calculated at 15% of the subtotal excluding the levy.";

  if (costSummaryItemNameEl) {
    costSummaryItemNameEl.textContent =
      activeItems === selectedCourses ? "Courses selected" : "Degrees selected";
  }

  costSummaryCoursesSelectedEl.textContent = String(activeItems.size);

  const { points: totalCoursePoints, cost: totalCourseCost } =
    calculateCoursesTotals(activeItems, isDomestic);

  costSummaryTotalPointsEl.textContent = String(totalCoursePoints);
  costSummaryTotalCostEl.textContent = totalCourseCost.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const levy = calculateLevy(activeItems.size, totalCoursePoints);
  costSummaryLevyEl.textContent =
    levy === "TBD"
      ? "TBD"
      : Number(levy).toLocaleString("en-NZ", {
          style: "currency",
          currency: "NZD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  costSummaryLevyNoteEl.textContent = `Based on ${totalCoursePoints} points`;

  const levyAmount = levy === "TBD" ? 0 : Number(levy);
  const subTotal = levyAmount + totalCourseCost;
  costSummarySubtotalEl.textContent = subTotal.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const gst = learnerLocation === "onshore" ? subTotal * 0.15 : 0;
  costSummaryGstEl.textContent = gst.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const totalCost = subTotal + gst;
  costSummaryTotalEl.textContent = totalCost.toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* -------------------- Init -------------------- */

function initTuitionSelection() {
  initAvailableCards("course");
  initAvailableCards("degree");

  if (clearCoursesBtnEl) {
    clearCoursesBtnEl.addEventListener("click", () => clearSelection("course"));
  }

  if (clearDegreesBtnEl) {
    clearDegreesBtnEl.addEventListener("click", () => clearSelection("degree"));
  }

  renderSelection("course", "domestic");
  limitItems(selectionConfigs.course.cardSelector);

  renderSelection("degree", "domestic");
  limitItems(selectionConfigs.degree.cardSelector);

  applySearch(selectionConfigs.degree.searchInputId, "degree");

  document
    .querySelectorAll(selectionConfigs.course.facultyBtnSelector)
    .forEach((pill) =>
      pill.classList.remove("selection-faculty-filter-active"),
    );
  const allCoursePillEl = document.querySelector(
    selectionConfigs.course.allFacultyAttr,
  );
  if (allCoursePillEl)
    allCoursePillEl.classList.add("selection-faculty-filter-active");

  document
    .querySelectorAll(selectionConfigs.degree.facultyBtnSelector)
    .forEach((pill) =>
      pill.classList.remove("selection-faculty-filter-active"),
    );
  const allDegreePillEl = document.querySelector(
    selectionConfigs.degree.allFacultyAttr,
  );
  if (allDegreePillEl)
    allDegreePillEl.classList.add("selection-faculty-filter-active");

  initSearch("course");
  initSearch("degree");

  toggleDropdown(
    courseDropdownBtnEl,
    degreeDropdownBtnEl,
    courseBodyEl,
    degreeBodyEl,
  );

  document.querySelectorAll('input[name="learner_type"]').forEach((radio) => {
    radio.addEventListener("change", function (e) {
      e.preventDefault();
      updatePrices(this.value);
    });
  });

  document
    .querySelectorAll('input[name="learner_location"]')
    .forEach((radio) => {
      radio.addEventListener("change", function () {
        renderSummary();
      });
    });

  document.querySelectorAll(".faculty-btn-course").forEach((btnEl) => {
    btnEl.addEventListener("click", () => {
      document
        .querySelectorAll(".faculty-btn-course")
        .forEach((pill) =>
          pill.classList.remove("selection-faculty-filter-active"),
        );
      btnEl.classList.add("selection-faculty-filter-active");

      currentCourseFaculty = btnEl.dataset.courseFaculty;

      applySearch(selectionConfigs.course.searchInputId, "course");
    });
  });

  document.querySelectorAll(".faculty-btn-degree").forEach((btnEl) => {
    btnEl.addEventListener("click", () => {
      document
        .querySelectorAll(".faculty-btn-degree")
        .forEach((pill) =>
          pill.classList.remove("selection-faculty-filter-active"),
        );
      btnEl.classList.add("selection-faculty-filter-active");

      currentDegreeFaculty = btnEl.dataset.degreeFaculty;

      applySearch(selectionConfigs.degree.searchInputId, "degree");
    });
  });

  if (showAllCoursesBtnEl) {
    showAllCoursesBtnEl.addEventListener("click", () => {
      document.querySelectorAll(".selection-course").forEach((card) => {
        const code = card.dataset.courseCode;
        const cardFaculty = card.dataset.courseFaculty;
        const facultyMatch =
          currentCourseFaculty === "All Faculties" ||
          cardFaculty === currentCourseFaculty;
        const isSelected = selectedCourses.has(code);
        card.style.display = facultyMatch && !isSelected ? "flex" : "none";
      });

      showAllCoursesBtnEl.style.display = "none";
      showLessCoursesBtnEl.style.display = "block";
      showLessCoursesBtnEl.disabled = false;
    });
  }

  if (showLessCoursesBtnEl) {
    showLessCoursesBtnEl.addEventListener("click", () => {
      // Reapply current filters (faculty + selection)
      applySearch(selectionConfigs.course.searchInputId, "course");

      const potentialVisible = getPotentialVisibleCount(
        ".selection-course",
        selectedCourses,
        {
          facultyKey: "courseFaculty",
          codeKey: "courseCode",
        },
        currentCourseFaculty,
      );
      const needsShowAll = potentialVisible > 5;

      limitItems(".selection-course"); // will hide beyond 5 among currently visible

      showLessCoursesBtnEl.style.display = "none";
      showLessCoursesBtnEl.disabled = true;

      if (showAllCoursesBtnEl) {
        showAllCoursesBtnEl.style.display = needsShowAll ? "block" : "none";
        showAllCoursesBtnEl.disabled = !needsShowAll;
      }
    });
  }

  if (showAllDegreesBtnEl) {
    showAllDegreesBtnEl.addEventListener("click", () => {
      document.querySelectorAll(".selection-degree").forEach((card) => {
        const code = card.dataset.degreeCode;
        const cardFaculty = card.dataset.degreeFaculty;
        const facultyMatch =
          currentDegreeFaculty === "All Faculties" ||
          cardFaculty === currentDegreeFaculty;
        const isSelected = selectedDegrees.has(code);

        card.style.display = facultyMatch && !isSelected ? "flex" : "none";
      });

      showAllDegreesBtnEl.style.display = "none";
      showLessDegreesBtnEl.style.display = "block";
      showLessDegreesBtnEl.disabled = false;
    });
  }

  if (showLessDegreesBtnEl) {
    showLessDegreesBtnEl.addEventListener("click", () => {
      applySearch(selectionConfigs.degree.searchInputId, "degree");

      const potentialVisible = getPotentialVisibleCount(
        ".selection-degree",
        selectedDegrees,
        {
          facultyKey: "degreeFaculty",
          codeKey: "degreeTitle",
        },
        currentDegreeFaculty,
      );
      const needsShowAll = potentialVisible > 5;

      limitItems(".selection-degree");

      showLessDegreesBtnEl.style.display = "none";
      showLessDegreesBtnEl.disabled = true;

      if (showAllDegreesBtnEl) {
        showAllDegreesBtnEl.style.display = needsShowAll ? "block" : "none";
        showAllDegreesBtnEl.disabled = !needsShowAll;
      }
    });
  }

  function openPdfPrompt() {
    if (!pdfPromptEl) return; // Guard clause

    const activeItems =
      selectedCourses.size > 0 ? selectedCourses : selectedDegrees;

    if (pdfPromptTotalCostEl && costSummaryTotalEl) {
      pdfPromptTotalCostEl.textContent = costSummaryTotalEl.textContent; // Copy the displayed total cost text from the main summary
    }

    if (pdfPromptCoursesPillEl) {
      const count = activeItems.size;
      const item = activeItems === selectedCourses ? "course" : "degree";
      pdfPromptCoursesPillEl.textContent = `${count} ${item}${
        count === 1 ? "" : "s"
      }`;
    }

    pdfPromptEl.classList.add("is-open");
    if (pdfPromptInputEl) {
      pdfPromptInputEl.value = "";
      pdfPromptInputEl.focus();
    }
  }

  // Hide the popup
  function closePdfPrompt() {
    pdfPromptEl.classList.remove("is-open");
  }

  // Open prompt on click of main "Export to PDF" btn
  if (exportPDFButtonEl) {
    exportPDFButtonEl.addEventListener("click", () => {
      openPdfPrompt();
    });
  }

  // Cancel, closes
  if (pdfPromptCancelBtnEl) {
    pdfPromptCancelBtnEl.addEventListener("click", closePdfPrompt);
  }

  // X button, closes
  if (pdfPromptCloseBtnEl) {
    pdfPromptCloseBtnEl.addEventListener("click", closePdfPrompt);
  }

  // Export: read name, close prompt, export PDF
  if (pdfPromptExportBtnEl) {
    pdfPromptExportBtnEl.addEventListener("click", async (e) => {
      const planFor = (pdfPromptInputEl?.value || "").trim();
      closePdfPrompt();
      await exportToPDF(planFor);
    });
  }

  // Press Enter in input
  if (pdfPromptInputEl) {
    pdfPromptInputEl.addEventListener("keydown", async (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();

      const planFor = (pdfPromptInputEl.value || "").trim();
      closePdfPrompt();
      await exportToPDF(planFor);
    });
  }

  // Click outside the prompt to close it
  if (pdfPromptEl) {
    pdfPromptEl.addEventListener("click", (e) => {
      if (e.target === pdfPromptEl) closePdfPrompt();
    });
  }

  // Press Escape to close prompt
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePdfPrompt();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTuitionSelection);
} else {
  initTuitionSelection();
}
