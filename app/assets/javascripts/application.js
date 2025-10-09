//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//
  //tooltips
//= require matches-chart

import './reporting.js';
import './filters.js';



window.GOVUKPrototypeKit.documentReady(() => {
    document.querySelectorAll('.govuk-table__cell').forEach(cell => {
      // Check if the cell has the data-tooltip attribute
      if (cell.hasAttribute('data-tooltip')) {
        // Add cursor style
        cell.style.cursor = 'help';

        cell.addEventListener('mouseenter', function() {
          const tooltipText = cell.getAttribute('data-tooltip'); // Get the tooltip content
          const tooltip = document.createElement('span');
          tooltip.classList.add('tooltip');
          tooltip.innerHTML = tooltipText; // Use innerHTML to allow HTML content
          cell.appendChild(tooltip);

          // Check for a <span> or <strong> inside the cell
          const contentElement = cell.querySelector('span, strong'); // Target either <span> or <strong> inside the cell

          if (contentElement) {
            const contentRect = contentElement.getBoundingClientRect(); // Get the position of the content element (either <span> or <strong>)

            // Position the tooltip beneath the content element
            tooltip.style.position = 'absolute';
            tooltip.style.left = `${contentRect.left}px`; // Align tooltip with the left of the content element
            tooltip.style.top = `${contentRect.bottom + window.scrollY + 2}px`; // Position the tooltip just below the content element (adjusted gap)
            tooltip.style.background = '#f3f2f1';
            tooltip.style.color = '##0b0c0c';
            tooltip.style.padding = '10px';
            tooltip.style.fontSize = '14px';
            tooltip.style.width = '300px';
            tooltip.style.boxShadow = '2px 2px 8px rgba(0, 0, 0, 0.3)';

          }
        });

        cell.addEventListener('mouseleave', function() {
          const tooltip = cell.querySelector('.tooltip');
          if (tooltip) {
            tooltip.remove();
          }
        });
      }
    });

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".btms-clear__button").addEventListener("click", function () {
      document.getElementById("searchTerm").value = "";
    });
  });

  //filters js functionality


});

//clear search
document.addEventListener('DOMContentLoaded', function () {

  const input = document.getElementById('searchTerm');
  const clearButton = document.getElementById('clearButton');

  function toggleClearButton() {
    clearButton.style.display = input.value.trim() ? 'block' : 'none';
  }

  input.addEventListener('input', toggleClearButton);
  clearButton.addEventListener('click', function () {
    input.value = '';
    toggleClearButton();
    input.focus();
  });

  toggleClearButton(); // Ensure correct initial state
});
document.addEventListener("DOMContentLoaded", function () {
  setTimeout(function () {
      document.getElementById("searchTerm").focus();
  }, 100); // Small delay to ensure rendering is complete
});






// toggle js
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".toggle-area").forEach(function (toggleArea) {
    const targetId = toggleArea.getAttribute("data-target");
    const content = document.getElementById(targetId);
    const toggleArrow = toggleArea.querySelector("#toggleArrow");
    const toggleArrowContainer = toggleArea.querySelector("#toggleArrowContainer");
    const shouldCollapse = toggleArea.getAttribute("data-collapsed") === "true";

    if (content && toggleArrowContainer) {
      // Set initial state
      content.style.display = shouldCollapse ? "none" : "block";
      toggleArrow.classList.add(shouldCollapse ? "fa-chevron-down" : "fa-chevron-up");

      // Accessibility
      toggleArrowContainer.setAttribute("tabindex", "0");
      toggleArrowContainer.setAttribute("role", "button");
      toggleArrowContainer.setAttribute("aria-expanded", !shouldCollapse);
      toggleArrowContainer.setAttribute("aria-controls", targetId);

      const toggleContent = () => {
        const isHidden = content.style.display === "none";
        content.style.display = isHidden ? "block" : "none";
        toggleArrow.classList.toggle("fa-chevron-up", isHidden);
        toggleArrow.classList.toggle("fa-chevron-down", !isHidden);
        toggleArrowContainer.setAttribute("aria-expanded", isHidden);
      };

      toggleArrowContainer.addEventListener("click", toggleContent);

      toggleArrowContainer.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleContent();
        }
      });
    }
  });
});







