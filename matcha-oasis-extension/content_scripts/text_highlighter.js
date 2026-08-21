// content_scripts/text_highlighter.js

document.addEventListener('mouseup', () => {
  const selection = window.getSelection().toString().trim();
  if (selection.length > 0 && selection.length < 50) {
    console.log("Matcha Extension selected word: ", selection);
    // Optionally show a quick tooltip icon next to selection
  }
});
