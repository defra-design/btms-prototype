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



// filters 

document.addEventListener("DOMContentLoaded", function () {
  // Existing selectors
  const matchSelect = document.getElementById("match");
  const decisionSelect = document.getElementById("decision");
  const authSelect = document.getElementById("auth");
  const clearFilterLink = document.querySelector(".clear-filter");
  const mrnContainers = document.querySelectorAll(".mrn-container");
  
  // New CHED specific selectors
  const authChedSelect = document.getElementById("authChed");
  const clearChedFilterLink = document.querySelector(".ched-header + .inline-form-group .clear-filter");
  const chedContainers = document.querySelectorAll(".ched-container");
  
  // Flag to prevent infinite loops when synchronizing selects
  let isSynchronizing = false;
  
  // Original MRN container filtering function (unchanged)
  function filterRows() {
    let allRowsHidden = true;

    mrnContainers.forEach(container => {
      const table = container.querySelector(".govuk-table");
      const tableHead = table.querySelector(".govuk-table__head");
      const tableRows = container.querySelectorAll(".govuk-table__body tr");
      const matchValue = matchSelect.value;
      const decisionValue = decisionSelect.value;
      const authValue = authSelect.value;
      let containerHidden = true;
      let noDataMessage = container.querySelector(".no-data-message");

      if (!noDataMessage) {
        noDataMessage = document.createElement("p");
        noDataMessage.className = "no-data-message govuk-body";
        noDataMessage.innerText = "There are no items that match the filters selected.";
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

              // Only apply class if authValue is one of the valid authorities
              if (authValue === "FNAO" || authValue === "HMI" || authValue === "PHSI" || authValue === "POAO" || authValue === "IUU" ) {
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

  // NEW: Function to filter CHED containers
// Function to filter CHED containers
function filterChedRows() {
  chedContainers.forEach(container => {
    const table = container.querySelector(".govuk-table");
    const tableHead = table.querySelector(".govuk-table__head");
    const tableRows = container.querySelectorAll(".govuk-table__body tr");
    const authValue = authChedSelect.value;
    let containerHidden = true;
    let noDataMessage = container.querySelector(".no-data-message");

    if (!noDataMessage) {
      noDataMessage = document.createElement("p");
      noDataMessage.className = "no-data-message govuk-body";
      noDataMessage.innerText = "There are no commodities that match the filters selected.";
      noDataMessage.style.display = "none";
      container.appendChild(noDataMessage);
    }

    // Process each row
    tableRows.forEach(row => {
      const isHMIRow = row.classList.contains("HMI");
      const isPHSIRow = row.classList.contains("PHSI");
      const isFNAORow = row.classList.contains("FNAO");
      const isIUURow = row.classList.contains("IUU");
      const isAPHARow = row.classList.contains("APHA");
      const isPOAORow = row.classList.contains("POAO");
      
      // Authority filter for CHED section
      const authFilter =
        authValue === "show-all" ||
        (authValue === "PHSI" && isPHSIRow) ||
        (authValue === "FNAO" && isFNAORow) ||
        (authValue === "IUU" && isIUURow) ||
        (authValue === "POAO" && isPOAORow) ||
        (authValue === "APHA" && isAPHARow) ||
        (authValue === "HMI" && isHMIRow);

      if (authFilter) {
        row.style.display = "";
        containerHidden = false;
        
        // Hide or show <li> elements based on the selected authority filter (for multi-auth cases)
        const decisionItems = row.querySelectorAll(".decision li");
        decisionItems.forEach(li => {
          if (authValue === "show-all" || li.textContent.includes(getAuthorityDisplayName(authValue))) {
            li.style.display = ""; // Show matching authorities
            
            // Add visible-li class when authValue is a valid authority
            if (authValue === "FNAO" || authValue === "HMI" || authValue === "PHSI" || authValue === "POAO" || authValue === "APHA" || authValue === "IUU") {
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

    // Show/hide no data message and table head as needed
    if (containerHidden) {
      tableHead.style.display = "none";
      noDataMessage.style.display = "block";
    } else {
      tableHead.style.display = "";
      noDataMessage.style.display = "none";
    }
  });

  // Show or hide the CHED "Clear filters" link
  clearChedFilterLink.style.display = 
    authChedSelect.value !== "show-all" ? "inline-block" : "none";
}
  
  // Helper function to get display name of authority
  function getAuthorityDisplayName(authValue) {
    switch(authValue) {
      case "FNAO": return "PHA-FNAO";
      case "HMI": return "PP-HMI";
      case "PHSI": return "PP-PHSI";
      case "IUU": return "PHA-IUU";
      case "POAO": return "PHA-POAO";
      case "APHA": return "APHA";
      default: return "";
    }
  }
  
  // Function to synchronize authority selection from MRN to CHED (one-way)
  function syncAuthority() {
    if (!isSynchronizing) {
      isSynchronizing = true;
      
      // Set CHED authority to match MRN authority
      authChedSelect.value = authSelect.value;
      
      // Trigger CHED filtering with the new value
      filterChedRows();
      
      isSynchronizing = false;
    }
  }

  // Add event listeners to existing filters
  matchSelect.addEventListener("change", filterRows);
  decisionSelect.addEventListener("change", filterRows);
  
  // Add event listener to the MRN authority filter with synchronization
  authSelect.addEventListener("change", function() {
    filterRows();
    syncAuthority(); // Synchronize the CHED authority dropdown
  });
  
  // Add event listener to CHED authority filter (no synchronization back to MRN)
  authChedSelect.addEventListener("change", filterChedRows);

  // Clear filters functionality for existing filters
  clearFilterLink.addEventListener("click", function (e) {
    e.preventDefault();
    matchSelect.value = "show-all";
    decisionSelect.value = "show-all";
    authSelect.value = "show-all";
    
    // Also reset the CHED authority filter
    authChedSelect.value = "show-all";
    
    filterRows();
    filterChedRows();
  });
  
  // Clear filter functionality for CHED authority filter (only resets CHED filter)
  clearChedFilterLink.addEventListener("click", function (e) {
    e.preventDefault();
    authChedSelect.value = "show-all";
    filterChedRows();
  });

  // Initial filtering on page load
  filterRows();
  filterChedRows();
});






