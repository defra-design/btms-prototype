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
  const matchValue = matchFilter?.value ?? "show-all";         // "show-all" | "match" | "no-match"
  const decisionValue = decisionFilter?.value ?? "show-all";   // "show-all" | "release" | "hold" | "refused"
  const authValue = authFilter?.value ?? "show-all";           // "show-all" | authority code

  mrnContainers.forEach(container => {
    const table = container.querySelector(".govuk-table");
    if (!table) return;

    const rows = container.querySelectorAll("tbody tr");
    const tableHead = table.querySelector(".govuk-table__head") || table.querySelector("thead");
    let visibleRowFound = false;

    const noDataMsg = ensureNoDataMsg(container, "There are no items that match the filters selected.");

    rows.forEach(row => {
      // Only check decision items in the last decision <td>
      const decisionItems = row.querySelectorAll("td.decision:last-child li");
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

      // Match filter (row has "match" or "no-match")
      if (matchValue !== "show-all") {
        row.classList.add(`filtered-match-${matchValue}`);
        matches = matchValue === "match"
          ? row.classList.contains("match")
          : row.classList.contains("no-match");
      }

      // Decision filter (row has "release" | "hold" | "refused")
      if (matches && decisionValue !== "show-all") {
        row.classList.add(`filtered-decision-${decisionValue}`);
        if (!row.classList.contains(decisionValue)) matches = false;
      }

      // Authority filter (row must have an authority somewhere)
      if (matches && authValue !== "show-all") {
        row.classList.add(`filtered-auth-${authValue}`);
        const hasAuth =
          row.classList.contains(authValue) ||
          Array.from(row.querySelectorAll("td.decision")).some(td =>
            td.classList.contains(authValue) || includesCI(td.textContent, authValue)
          );
        if (!hasAuth) matches = false;
      }

      // Per-LI visibility inside decision cells
      decisionItems.forEach(li => {
        const matchesAuth = authValue === "show-all"
          || li.classList.contains(authValue)
          || includesCI(li.textContent, authValue);

        const matchesDecision = decisionValue === "show-all"
          || li.classList.contains(decisionValue)
          || includesCI(li.textContent, decisionValue)
          || (decisionValue === "refused" && includesCI(li.textContent, "refuse")); // tolerate "Refuse" vs "Refused"

        li.style.display = (matchesAuth && matchesDecision) ? "" : "none";
      });

      const anyVisibleDecision = Array.from(decisionItems).some(li => li.style.display !== "none");

      if (matches && (!decisionItems.length || anyVisibleDecision)) {
        row.style.display = "";
        visibleRowFound = true;
      } else {
        row.style.display = "none";
      }
    });

    // Only reveal .blank-cell when "no-match" is selected
    const showBlank = matchValue === "no-match";
    container.querySelectorAll(".blank-cell").forEach(cell => {
      cell.style.color = showBlank ? "" : "transparent";
    });

    if (tableHead) tableHead.style.display = visibleRowFound ? "" : "none";
    noDataMsg.style.display = visibleRowFound ? "none" : "block";
  });

  // Toggle "clear filters" link
  if (clearFiltersLink) {
    clearFiltersLink.style.display =
      (matchFilter && matchFilter.value !== "show-all")
      || (decisionFilter && decisionFilter.value !== "show-all")
      || (authFilter && authFilter.value !== "show-all")
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
