
function toggleSearchSuggestions(isHidden) {
  const suggestions = document.querySelector(
    ".ytSearchboxComponentSuggestionsContainer"
  );

  toggleVisibility(suggestions, isHidden);
}