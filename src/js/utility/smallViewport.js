// Based on breakpoints declared in CSS
function smallViewport() {
  const cssValue = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--bp-small");
  const maxWidth = parseInt(cssValue);
  return window.innerWidth < maxWidth;
}

export default smallViewport;
