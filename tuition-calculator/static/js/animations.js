const MODAL_ANIM_MS = 200;

function openBackdropModal(backdropEl) {
  if (!backdropEl) return;
  backdropEl.removeAttribute("hidden");

  requestAnimationFrame(() => {
    backdropEl.classList.add("is-open");
  });
}

function closeBackdropModal(backdropEl) {
  if (!backdropEl) return;

  backdropEl.classList.remove("is-open");

  window.setTimeout(() => {
    backdropEl.setAttribute("hidden", "hidden");
  }, MODAL_ANIM_MS);
}

window.openBackdropModal = openBackdropModal;
window.closeBackdropModal = closeBackdropModal;
