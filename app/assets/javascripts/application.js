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


// filters
document.addEventListener("DOMContentLoaded", function () {
  const matchFilter = document.getElementById("match");
  const decisionFilter = document.getElementById("decision");
  const authFilter = document.getElementById("auth");
  const authChedFilter = document.getElementById("authChed");

  const clearFiltersLink = document.querySelector('[data-clear="mrn"]');
  const clearChedFilterLink = document.querySelector('[data-clear="ched"]');

  const mrnContainers = document.querySelectorAll(".mrn-container");
  const chedContainers = document.querySelectorAll(".ched-container");

  function getAuthorityDisplayName(auth) {
    const map = {
      FNAO: "FNAO",
      HMI: "HMI",
      PHSI: "PHSI",
      POAO: "POAO",
      IUU: "IUU",
      APHA: "APHA"
    };
    return map[auth] || "";
  }

  function applyMrnFilters() {
    const matchValue = matchFilter?.value ?? "show-all";
    const decisionValue = decisionFilter?.value ?? "show-all";
    const authValue = authFilter?.value ?? "show-all";

    mrnContainers.forEach(container => {
      const table = container.querySelector(".govuk-table");
      const rows = container.querySelectorAll("tbody tr");
      const tableHead = table.querySelector(".govuk-table__head");
      let visibleRowFound = false;

      let noDataMsg = container.querySelector(".no-data-message");
      if (!noDataMsg) {
        noDataMsg = document.createElement("p");
        noDataMsg.className = "no-data-message govuk-body";
        noDataMsg.textContent = "There are no items that match the filters selected.";
        noDataMsg.style.display = "none";
        container.querySelector(".commodity-table")?.appendChild(noDataMsg);
      }

      rows.forEach(row => {
        const decisionItems = row.querySelectorAll("li");
        let matches = true;

        // Remove previous filter classes
        row.classList.remove(
          "filtered-match-match",
          "filtered-match-no-match",
          ...["release", "hold", "refused"].map(d => `filtered-decision-${d}`),
          ...["FNAO", "HMI", "PHSI", "POAO", "IUU", "APHA"].map(a => `filtered-auth-${a}`)
        );

        // Match filter
        if (matchValue !== "show-all") {
          row.classList.add(`filtered-match-${matchValue}`);
          matches = matchValue === "match"
            ? row.classList.contains("match")
            : row.classList.contains("no-match");
        }

        // Decision filter
        if (matches && decisionValue !== "show-all") {
          row.classList.add(`filtered-decision-${decisionValue}`);
          if (!row.classList.contains(decisionValue)) {
            matches = false;
          }
        }

        // Authority filter (via LI classes or text)
        if (matches && authValue !== "show-all") {
          row.classList.add(`filtered-auth-${authValue}`);
          const matchesAuthorityInList = Array.from(decisionItems).some(li =>
            li.classList.contains(authValue) || li.textContent.includes(authValue)
          );
          if (!matchesAuthorityInList) {
            matches = false;
          }
        }

   // Filter individual <li>s in the decision cell based on selected filters
        decisionItems.forEach(li => {
          const matchesAuth = authValue === "show-all" || li.classList.contains(authValue) || li.textContent.includes(authValue);
          const matchesDecision = decisionValue === "show-all" || li.classList.contains(decisionValue) || li.textContent.toLowerCase().includes(decisionValue.toLowerCase());

          li.style.display = matchesAuth && matchesDecision ? "" : "none";
        });

        const anyVisibleDecision = Array.from(decisionItems).some(li => li.style.display !== "none");

        if (matches && (!decisionItems.length || anyVisibleDecision)) {
          row.style.display = "";
          visibleRowFound = true;
        } else {
          row.style.display = "none";
        }
      });

      const showBlank = matchValue === "noMatch";
      const blankCells = container.querySelectorAll(".blank-cell");
      blankCells.forEach(cell => {
        cell.style.color = showBlank ? "" : "transparent";
      });

      tableHead.style.display = visibleRowFound ? "" : "none";
      noDataMsg.style.display = visibleRowFound ? "none" : "block";
    });

    if (clearFiltersLink) {
      clearFiltersLink.style.display =
        matchValue !== "show-all" || decisionValue !== "show-all" || authValue !== "show-all"
          ? "inline-block"
          : "none";
    }
  }


  function applyChedFilters() {
    const authValue = authChedFilter?.value ?? "show-all";
    const authLabel = getAuthorityDisplayName(authValue);

    chedContainers.forEach(container => {
      const table = container.querySelector(".govuk-table");
      const rows = container.querySelectorAll("tbody tr");
      const tableHead = table.querySelector(".govuk-table__head");
      let visibleRowFound = false;

      let noDataMsg = container.querySelector(".no-data-message");
      if (!noDataMsg) {
        noDataMsg = document.createElement("p");
        noDataMsg.className = "no-data-message govuk-body";
        noDataMsg.textContent = "There are no commodities that match the filters selected.";
        noDataMsg.style.display = "none";
        container.querySelector(".commodity-table")?.appendChild(noDataMsg);
      }

      rows.forEach(row => {
        const decisionItems = row.querySelectorAll("li");
        const matches = authValue === "show-all" || row.classList.contains(authValue) ||
          Array.from(decisionItems).some(li => li.textContent.includes(authLabel));

        decisionItems.forEach(li => {
          const matchesText = li.textContent.includes(authLabel);
          li.style.display = authValue === "show-all" || matchesText ? "" : "none";
        });

        const anyVisible = Array.from(decisionItems).some(li => li.style.display !== "none");

        if (matches && (!decisionItems.length || anyVisible)) {
          row.style.display = "";
          visibleRowFound = true;
        } else {
          row.style.display = "none";
        }
      });

      tableHead.style.display = visibleRowFound ? "" : "none";
      noDataMsg.style.display = visibleRowFound ? "none" : "block";
    });

    if (clearChedFilterLink) {
      clearChedFilterLink.style.display = authValue !== "show-all" ? "inline-block" : "none";
    }
  }

  // function syncAuthorityToChed() {
  //   if (authFilter && authChedFilter) {
  //     const selected = authFilter.value;

  //     if (authChedFilter.value !== selected) {
  //       authChedFilter.value = selected;
  //       authChedFilter.dispatchEvent(new Event("change", { bubbles: true }));
  //       authChedFilter.dispatchEvent(new Event("input", { bubbles: true }));
  //     }
  //   }
  // }

  // Event listeners
  matchFilter?.addEventListener("change", applyMrnFilters);
  decisionFilter?.addEventListener("change", applyMrnFilters);
  authFilter?.addEventListener("change", () => {
    applyMrnFilters();
    syncAuthorityToChed();
  });

  authChedFilter?.addEventListener("change", applyChedFilters);

  clearFiltersLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (matchFilter) matchFilter.value = "show-all";
    if (decisionFilter) decisionFilter.value = "show-all";
    if (authFilter) authFilter.value = "show-all";
    if (authChedFilter) {
      authChedFilter.value = "show-all";
      authChedFilter.dispatchEvent(new Event("change", { bubbles: true }));
      authChedFilter.dispatchEvent(new Event("input", { bubbles: true }));
    }

    applyMrnFilters();
    applyChedFilters();
  });


  clearChedFilterLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (authChedFilter) {
      authChedFilter.value = "show-all";
      authChedFilter.dispatchEvent(new Event("change", { bubbles: true }));
      authChedFilter.dispatchEvent(new Event("input", { bubbles: true }));
      applyChedFilters();
    }
  });

  // Initialise
  applyMrnFilters();
  applyChedFilters();
});




