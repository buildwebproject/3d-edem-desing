async function loadComponent(selector) {
  const container = document.querySelector(selector);
  if (!container) return;

  const url = container.dataset.componentUrl;
  if (!url) return;
  if (container.children.length > 0) return;

  try {
    const res = await fetch(new URL(url, window.location.href), {
      cache: "no-cache",
    });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    container.innerHTML = await res.text();
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadComponent("#site-header");
});
