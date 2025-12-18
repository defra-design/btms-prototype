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
    const map = { FNAO: "FNAO", HMI: "HMI", PHSI: "PHSI", POAO: "POAO", IUU: "IUU", APHA: "APHA" };
    return map[auth] || "";
  }

  const ci = s => (s || "").toLowerCase();
  const includesCI = (hay, needle) => ci(hay).includes(ci(needle));

  function ensureNoDataMsg(container, text) {
    let msg = container.querySelector(".no-data-message");
    if (!msg) {
      msg = document.createElement("p");
      msg.className = "no-data-message govuk-body";
      msg.setAttribute("aria-live", "polite");
      msg.style.display = "none";
      msg.textContent = text;
      (container.querySelector(".commodity-table") || container).appendChild(msg);
    }
    return msg;
  }

function applyMrnFilters() {
  const matchValue = matchFilter?.value ?? "show-all";
  const decisionValue = decisionFilter?.value ?? "show-all";
  const authValue = authFilter?.value ?? "show-all";

  mrnContainers.forEach(container => {
    const table = container.querySelector(".govuk-table");
    if (!table) return;

    const rows = container.querySelectorAll("tbody tr");
    const tableHead = table.querySelector(".govuk-table__head") || table.querySelector("thead");
    let visibleRowFound = false;

    const noDataMsg = ensureNoDataMsg(container, "There are no items that match the filters selected.");

    rows.forEach(row => {
      let matches = true;

      // Reset filter classes
      row.classList.remove(
        "filtered-match-match",
        "filtered-match-no-match",
        "filtered-decision-release",
        "filtered-decision-hold",
        "filtered-decision-refused",
        "filtered-auth-FNAO","filtered-auth-HMI","filtered-auth-PHSI",
        "filtered-auth-POAO","filtered-auth-IUU","filtered-auth-APHA"
      );

      // Match filter
      if (matchValue !== "show-all") {
        row.classList.add(`filtered-match-${matchValue}`);
        const isMatch = matchValue === "match"
          ? row.classList.contains("match")
          : row.classList.contains("no-match");
        if (!isMatch) matches = false;
      }

      // For rows with multiple authority/decision pairs, we'll check visibility at the list item level
      // Skip row-level decision and authority checks if the row has list items
      const decisionCells = row.querySelectorAll("td.decision");
      const authorityCell = decisionCells[0]; // First .decision cell is Authority
      const decisionCell = decisionCells[decisionCells.length - 1]; // Last .decision cell is Decision

      const authorityItems = authorityCell ? authorityCell.querySelectorAll("li") : [];
      const decisionItems = decisionCell ? decisionCell.querySelectorAll("li") : [];

      const hasListItems = decisionItems.length > 0;

      // Only do row-level filtering if there are NO list items
      if (!hasListItems) {
        // Decision filter - check both row classes AND text content
        if (matches && decisionValue !== "show-all") {
          row.classList.add(`filtered-decision-${decisionValue}`);

          const decisionText = Array.from(decisionCells)
            .map(cell => cell.textContent.toLowerCase())
            .join(" ");

          let hasDecision = false;

          if (decisionValue === "release") {
            hasDecision = row.classList.contains("release") ||
                         decisionText.includes("release");
          } else if (decisionValue === "hold") {
            hasDecision = row.classList.contains("hold") ||
                         decisionText.includes("hold") ||
                         decisionText.includes("awaiting");
          } else if (decisionValue === "refused") {
            hasDecision = row.classList.contains("refused") ||
                         decisionText.includes("refused") ||
                         decisionText.includes("refuse");
          }

          if (!hasDecision) matches = false;
        }

        // Authority filter - check row classes, cell classes, AND text content
        if (matches && authValue !== "show-all") {
          row.classList.add(`filtered-auth-${authValue}`);

          const hasRowClass = row.classList.contains(authValue) ||
                             row.classList.contains(authValue.toUpperCase());

          const hasAuthInText = Array.from(decisionCells).some(cell =>
            includesCI(cell.textContent, authValue)
          );

          if (!hasRowClass && !hasAuthInText) {
            matches = false;
          }
        }
      }

      // Handle visibility of decision and authority list items
      if (hasListItems && authorityItems.length > 0) {
        // For continuation rows, check row-level authority class first
        // This prevents showing continuation rows with wrong authority (e.g., PHSI row when filtering HMI)
        if (row.classList.contains("item-continuation") && authValue !== "show-all") {
          const rowAuthClasses = ['FNAO', 'HMI', 'PHSI', 'POAO', 'IUU', 'APHA'];
          const rowAuthClass = rowAuthClasses.find(authClass => row.classList.contains(authClass));
          // If row has an authority class that doesn't match the filter, hide the row
          if (rowAuthClass && rowAuthClass.toUpperCase() !== authValue.toUpperCase()) {
            matches = false;
          }
        }

        let anyVisibleDecision = false;

        // Process each decision item and its corresponding authority item
        decisionItems.forEach((decisionLi, index) => {
          let showLi = true;

          // Get corresponding authority item (they should match by index)
          const authorityLi = authorityItems[index];

          // Check authority match - must check the authority cell, not the decision cell
          if (authValue !== "show-all") {
            let liMatchesAuth = false;

            // Check the corresponding authority list item
            if (authorityLi) {
              liMatchesAuth =
                authorityLi.classList.contains(authValue) ||
                authorityLi.classList.contains(authValue.toUpperCase()) ||
                includesCI(authorityLi.textContent, authValue);
            }

            // Also check the decision li classes (for backwards compatibility)
            if (!liMatchesAuth) {
              liMatchesAuth =
                decisionLi.classList.contains(authValue) ||
                decisionLi.classList.contains(authValue.toUpperCase());
            }

            if (!liMatchesAuth) showLi = false;
          }

          // Check decision match for this li
          if (showLi && decisionValue !== "show-all") {
            const liText = decisionLi.textContent.toLowerCase();
            let liMatchesDecision = false;

            if (decisionValue === "release") {
              liMatchesDecision = liText.includes("release");
            } else if (decisionValue === "hold") {
              liMatchesDecision = liText.includes("hold") || liText.includes("awaiting");
            } else if (decisionValue === "refused") {
              liMatchesDecision = liText.includes("refuse");
            }

            if (!liMatchesDecision) showLi = false;
          }

          // Hide/show both decision and authority list items together
          decisionLi.style.display = showLi ? "" : "none";
          if (authorityLi) {
            authorityLi.style.display = showLi ? "" : "none";
          }

          if (showLi) anyVisibleDecision = true;
        });

        // If filtering decisions/authority and no decision items are visible, hide the row
        if ((authValue !== "show-all" || decisionValue !== "show-all") && !anyVisibleDecision) {
          matches = false;
        }
      } else if (hasListItems) {
        // Handle case where there are decision items but no authority items (shouldn't happen in your HTML)
        let anyVisibleDecision = false;

        decisionItems.forEach(li => {
          let showLi = true;

          if (authValue !== "show-all") {
            const liMatchesAuth =
              li.classList.contains(authValue) ||
              li.classList.contains(authValue.toUpperCase()) ||
              includesCI(li.textContent, authValue);
            if (!liMatchesAuth) showLi = false;
          }

          if (showLi && decisionValue !== "show-all") {
            const liText = li.textContent.toLowerCase();
            let liMatchesDecision = false;

            if (decisionValue === "release") {
              liMatchesDecision = liText.includes("release");
            } else if (decisionValue === "hold") {
              liMatchesDecision = liText.includes("hold") || liText.includes("awaiting");
            } else if (decisionValue === "refused") {
              liMatchesDecision = liText.includes("refuse");
            }

            if (!liMatchesDecision) showLi = false;
          }

          li.style.display = showLi ? "" : "none";
          if (showLi) anyVisibleDecision = true;
        });

        if ((authValue !== "show-all" || decisionValue !== "show-all") && !anyVisibleDecision) {
          matches = false;
        }
      }

      // Show/hide the row
      if (matches) {
        row.style.display = "";
        visibleRowFound = true;
      } else {
        row.style.display = "none";
      }
    });

    // Show/hide blank cells for no-match rows
    const showBlank = matchValue === "no-match";
    container.querySelectorAll(".blank-cell").forEach(cell => {
      cell.style.color = showBlank ? "" : "transparent";
    });

    // Show/hide table header and no data message
    if (tableHead) tableHead.style.display = visibleRowFound ? "" : "none";
    noDataMsg.style.display = visibleRowFound ? "none" : "block";
  });

  // Toggle "clear filters" link
  if (clearFiltersLink) {
    clearFiltersLink.style.display =
      (matchFilter && matchFilter.value !== "show-all") ||
      (decisionFilter && decisionFilter.value !== "show-all") ||
      (authFilter && authFilter.value !== "show-all")
        ? "inline-block" : "none";
  }
}


  function applyChedFilters() {
    const authValue = authChedFilter?.value ?? "show-all";
    const authLabel = getAuthorityDisplayName(authValue);

    chedContainers.forEach(container => {
      const table = container.querySelector(".govuk-table");
      if (!table) return;

      const rows = container.querySelectorAll("tbody tr");
      const tableHead = table.querySelector(".govuk-table__head") || table.querySelector("thead");
      let visibleRowFound = false;

      const noDataMsg = ensureNoDataMsg(container, "There are no commodities that match the filters selected.");

      rows.forEach(row => {
        // This table uses plain text cells rather than <li>s:
        // Authority in col 5, Decision in col 6 (0-indexed).
        const authorityText = row.cells[4]?.textContent || "";
        const decisionText  = row.cells[5]?.textContent || "";

        const matches =
          authValue === "show-all"
          || row.classList.contains(authValue)   // if you add HMI/PHSI classes to rows
          || includesCI(authorityText, authLabel)
          || includesCI(decisionText, authLabel);

        row.style.display = matches ? "" : "none";
        if (matches) visibleRowFound = true;
      });

      if (tableHead) tableHead.style.display = visibleRowFound ? "" : "none";
      noDataMsg.style.display = visibleRowFound ? "none" : "block";
    });

    if (clearChedFilterLink) {
      clearChedFilterLink.style.display = authValue !== "show-all" ? "inline-block" : "none";
    }
  }

  // Re-enable the sync you intended
  function syncAuthorityToChed() {
    if (authFilter && authChedFilter) {
      const selected = authFilter.value;
      if (authChedFilter.value !== selected) {
        authChedFilter.value = selected;
        authChedFilter.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

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
    }
    applyMrnFilters();
    applyChedFilters();
  });

  clearChedFilterLink?.addEventListener("click", (e) => {
    e.preventDefault();
    if (authChedFilter) {
      authChedFilter.value = "show-all";
      authChedFilter.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  // Initialise
  applyMrnFilters();
  applyChedFilters();
});
