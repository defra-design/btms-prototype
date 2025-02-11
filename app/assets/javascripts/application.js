//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

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
  
    // Filters
  document.addEventListener("DOMContentLoaded", function () {
    const matchSelect = document.getElementById("match");
    const decisionSelect = document.getElementById("decision");
    const clearFilterLink = document.querySelector(".clear-filter");
    const mrnContainers = document.querySelectorAll(".mrn-container");
    const insetText = document.querySelector(".govuk-inset-text"); // Reference to the inset text
  
    // Function to filter rows based on both dropdowns
    function filterRows() {
      let allRowsHidden = true; // Assume all rows are hidden initially
  
      mrnContainers.forEach(container => {
        const tableRows = container.querySelectorAll(".govuk-table__body tr");
        const matchValue = matchSelect.value;
        const decisionValue = decisionSelect.value;
        let containerHidden = true; // Assume all rows in this container are hidden
  
        tableRows.forEach(row => {
          const isMatchRow = row.classList.contains("match");
          const isNoMatchRow = row.classList.contains("no-match");
          const isHoldRow = row.classList.contains("hold");
          const isReleaseRow = row.classList.contains("release");
  
          // Match filter logic
          const matchFilter =
            matchValue === "show-all" ||
            (matchValue === "match" && isMatchRow) ||
            (matchValue === "noMatch" && isNoMatchRow);
  
          // Decision filter logic
          const decisionFilter =
            decisionValue === "show-all" ||
            (decisionValue === "hold" && isHoldRow) ||
            (decisionValue === "release" && isReleaseRow);
  
          // Show or hide the row based on both filters
          if (matchFilter && decisionFilter) {
            row.style.display = "";
            containerHidden = false; // At least one row is visible
            allRowsHidden = false; // At least one row in any container is visible
          } else {
            row.style.display = "none";
          }
        });
  
        // Hide or show the container based on whether any rows are visible
        if (containerHidden) {
          container.style.display = "none";
        } else {
          container.style.display = "";
        }
      });
  
      // Show or hide the inset text based on whether all rows are hidden
      if (allRowsHidden) {
        insetText.style.display = "block"; // Show the inset text
      } else {
        insetText.style.display = "none"; // Hide the inset text
      }
  
      // Show or hide the "Clear filters" link
      if (matchSelect.value !== "show-all" || decisionSelect.value !== "show-all") {
        clearFilterLink.style.display = "inline-block";
      } else {
        clearFilterLink.style.display = "none";
      }
    }
  
    // Add event listeners to both dropdowns
    matchSelect.addEventListener("change", filterRows);
    decisionSelect.addEventListener("change", filterRows);
  
    // Clear filters functionality
    clearFilterLink.addEventListener("click", function (e) {
      e.preventDefault(); // Prevent the default link behavior
      matchSelect.value = "show-all"; // Reset the "Match" dropdown
      decisionSelect.value = "show-all"; // Reset the "Decision" dropdown
      filterRows(); // Trigger the filtering logic
    });
  
    // Initial check in case filtering is applied on page load
    filterRows();
  });

});
