document.querySelectorAll('input[name="learner_type"]').forEach((radio) => {
  radio.addEventListener("change", async function (e) {
    e.preventDefault();
    const value = this.value;
    localStorage.setItem("learner_type", value);
    updatePrices(value);
  });
});

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

window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("learner_type") || "domestic";

  const radio = document.querySelector(
    `input[name="learner_type"][value="${saved}"]`
  );
  if (radio) radio.checked = true;

  updatePrices(saved);
});
