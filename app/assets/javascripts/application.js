//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//
  //tooltips 

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
  
  document.addEventListener("DOMContentLoaded", function () {
      const matchSelect = document.getElementById("match");
      const decisionSelect = document.getElementById("decision");
      const authSelect = document.getElementById("auth"); // Authority filter
      const clearFilterLink = document.querySelector(".clear-filter");
      const mrnContainers = document.querySelectorAll(".mrn-container");
  
      function filterRows() {
          let allRowsHidden = true;
  
          mrnContainers.forEach(container => {
              const table = container.querySelector(".govuk-table");
              const tableHead = table.querySelector(".govuk-table__head");
              const tableRows = container.querySelectorAll(".govuk-table__body tr");
              const matchValue = matchSelect.value;
              const decisionValue = decisionSelect.value;
              const authValue = authSelect.value; // Authority filter value
              let containerHidden = true;
              let noDataMessage = container.querySelector(".no-data-message");
  
              if (!noDataMessage) {
                  noDataMessage = document.createElement("p");
                  noDataMessage.className = "no-data-message govuk-body";
                  noDataMessage.innerText = "There are no commodities that match the filters selected.";
                  noDataMessage.style.display = "none";
                  container.appendChild(noDataMessage);
              }
  
              tableRows.forEach(row => {
                  const isMatchRow = row.classList.contains("match");
                  const isNoMatchRow = row.classList.contains("no-match");
                  const isHoldRow = row.classList.contains("hold");
                  const isReleaseRow = row.classList.contains("release");
                  const isPOAORow = row.classList.contains("POAO");
                  const isHMIRow = row.classList.contains("HMI");
                  const isPHSIRow = row.classList.contains("PHSI");
                  const isFNAORow = row.classList.contains("FNAO");
                  const isIUURow = row.classList.contains("IUU");
  
                  // Filter conditions
                  const matchFilter =
                      matchValue === "show-all" ||
                      (matchValue === "match" && isMatchRow) ||
                      (matchValue === "noMatch" && isNoMatchRow);
  
                  const authFilter =
                      authValue === "show-all" ||
                      (authValue === "POAO" && isPOAORow) ||
                      (authValue === "PHSI" && isPHSIRow) ||
                      (authValue === "FNAO" && isFNAORow) ||
                      (authValue === "HMI" && isHMIRow) ||
                      (authValue === "IUU" && isIUURow);
  
                  const decisionFilter =
                      decisionValue === "show-all" ||
                      (decisionValue === "hold" && isHoldRow) ||
                      (decisionValue === "release" && isReleaseRow);
  
                  if (matchFilter && decisionFilter && authFilter) {
                      row.style.display = "";
                      containerHidden = false;
                      allRowsHidden = false;
  
                      // Hide or show <li> elements based on the selected authority filter
                      const decisionItems = row.querySelectorAll(".decision li");
                      decisionItems.forEach(li => {
                          if (authValue === "show-all" || li.classList.contains(authValue)) {
                              li.style.display = ""; // Show matching authorities
  
                              // Only apply class if authValue is FNAO or HMI
                              if (authValue === "FNAO" || authValue === "HMI" || authValue === "FNAO" || authValue === "PHSI" || authValue === "POAO" || authValue === "IUU") {
                                  li.classList.add("visible-li");
                              } else {
                                  li.classList.remove("visible-li");
                              }
                          } else {
                              li.style.display = "none"; // Hide non-matching authorities
                              li.classList.remove("visible-li");
                          }
                      });
                  } else {
                      row.style.display = "none";
                  }
              });
  
              if (containerHidden) {
                  tableHead.style.display = "none";
                  noDataMessage.style.display = "block";
              } else {
                  tableHead.style.display = "";
                  noDataMessage.style.display = "none";
              }
          });
  
          // Show or hide the "Clear filters" link based on filter selections
          clearFilterLink.style.display =
              matchSelect.value !== "show-all" ||
              decisionSelect.value !== "show-all" ||
              authSelect.value !== "show-all"
                  ? "inline-block"
                  : "none";
      }
  
      // Add event listeners to all dropdowns
      matchSelect.addEventListener("change", filterRows);
      decisionSelect.addEventListener("change", filterRows);
      authSelect.addEventListener("change", filterRows); // Authority filter listener
  
      // Clear filters functionality
      clearFilterLink.addEventListener("click", function (e) {
          e.preventDefault(); // Prevent the default link behavior
          matchSelect.value = "show-all"; // Reset the "Match" dropdown
          decisionSelect.value = "show-all"; // Reset the "Decision" dropdown
          authSelect.value = "show-all"; // Reset the "Authority" dropdown
          filterRows(); // Trigger the filtering logic
      });
  
      // Initial check to hide the "Clear Filters" link when page loads
      filterRows();
  });
  
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

