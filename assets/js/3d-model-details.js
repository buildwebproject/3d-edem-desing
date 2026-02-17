function initModelDetailsGallery(root) {
  if (!(root instanceof HTMLElement)) return;

  const viewer = root.querySelector("[data-model-details-viewer]");
  const viewerImg = viewer ? viewer.querySelector("img") : null;
  const thumbs = Array.from(
    root.querySelectorAll("[data-model-details-thumb]")
  );
  if (!(viewer instanceof HTMLElement) || !(viewerImg instanceof HTMLImageElement)) return;
  if (thumbs.length === 0) return;

  const setActive = (button) => {
    const img = button.querySelector("img");
    if (!(img instanceof HTMLImageElement)) return;
    const nextSrc = img.getAttribute("data-full-src") || img.getAttribute("src");
    if (!nextSrc) return;

    viewerImg.setAttribute("src", nextSrc);
    const alt = img.getAttribute("alt");
    if (alt) viewerImg.setAttribute("alt", alt);

    for (const thumb of thumbs) {
      thumb.setAttribute("aria-current", thumb === button ? "true" : "false");
    }
  };

  for (const button of thumbs) {
    if (!(button instanceof HTMLButtonElement)) continue;
    button.addEventListener("click", () => setActive(button));
  }

  const initial =
    thumbs.find((t) => t.getAttribute("aria-current") === "true") || thumbs[0];
  if (initial instanceof HTMLButtonElement) setActive(initial);
}

document.addEventListener("DOMContentLoaded", () => {
  const pages = Array.from(document.querySelectorAll("[data-model-details]"));
  for (const page of pages) initModelDetailsGallery(page);
});
