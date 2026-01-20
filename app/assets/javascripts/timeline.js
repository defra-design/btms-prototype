//
// Timeline functionality for search results pages
// Timeline data should be defined in the HTML file as window.timelineData or window.timelineDataByMrn
//

// Format date for display (DD Month YYYY, HH:MM:SS)
function formatDateForDisplay(dateString) {
  try {
    const date = new Date(dateString);
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: 'long',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day').value;
    const month = parts.find(p => p.type === 'month').value;
    const year = parts.find(p => p.type === 'year').value;
    const hour = parts.find(p => p.type === 'hour').value;
    const minute = parts.find(p => p.type === 'minute').value;
    const second = parts.find(p => p.type === 'second').value;
    return `${day} ${month} ${year}, ${hour}:${minute}:${second}`;
  } catch (e) {
    return dateString;
  }
}

// Process timeline events
function processTimelineEvents(timelineData, eventType, sortBy) {
  let filteredEvents = timelineData;
  
  // Filter by event type
  if (eventType !== 'all') {
    filteredEvents = timelineData.filter(event => {
      // Get main title (before " - ") for filtering
      const mainTitle = event.title.split(' - ')[0];
      if (eventType === 'finalisation') return mainTitle === 'CDS finalisation';
      if (eventType === 'clearance-decision') return mainTitle === 'BTMS decision';
      if (eventType === 'clearance-request') return mainTitle === 'CDS decision request';
      if (eventType === 'error') return mainTitle === 'Error' || mainTitle === 'CDS processing error' || mainTitle === 'BTMS processing error';
      if (eventType === 'ched') return event.title.startsWith('CHED');
      return true;
    });
  }

  // Format dates
  filteredEvents = filteredEvents.map(event => ({
    ...event,
    createdFormatted: formatDateForDisplay(event.created)
  }));

  // Sort by date
  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.created).getTime();
    const dateB = new Date(b.created).getTime();
    if (dateA !== dateB) {
      return sortBy === 'ascending' ? dateA - dateB : dateB - dateA;
    }
    return a.title.localeCompare(b.title);
  });

  return filteredEvents;
}

// Render timeline
function renderTimeline(events) {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = '<div class="govuk-inset-text"><p class="govuk-body">No timeline events found.</p></div>';
    return;
  }

  let html = '<div class="moj-timeline">';
  events.forEach(event => {
    // Split title by " - " to separate main title from subheader
    const titleParts = event.title.split(' - ');
    const mainTitle = titleParts[0];
    const subheader = titleParts.length > 1 ? titleParts[1] : null;
    // Check if this is an error (Error or Processing error)
    const isError = mainTitle === 'Error' || mainTitle === 'CDS processing error' || mainTitle === 'BTMS processing error';
    
    html += `<div class="moj-timeline__item">
      <div class="moj-timeline__header">
        <h2 class="moj-timeline__title ${isError ? 'govuk-!-color-red processing-error-title' : ''}" ${isError ? 'style="color: #d4351c !important;"' : ''}>
          ${mainTitle}
        </h2>`;
    
    if (subheader) {
      html += `<p class="govuk-body govuk-!-margin-bottom-0 subheader" >${subheader}</p>`;
    }
    
    html += `</div>
      <div class="moj-timeline__description">`;

    if (event.cdsStatus) {
      let tagClass = '';
      if (event.cdsStatus === 'Finalised - Released' || event.cdsStatus === 'Finalised - Manually released') tagClass = 'govuk-tag--green';
      else if (event.cdsStatus === 'Finalised - Cancelled after arrival') tagClass = 'govuk-tag--red';
      else if (event.cdsStatus.includes('In progress') || event.cdsStatus.includes('Hold')) tagClass = 'govuk-tag--yellow';
      html += `<div class="timeline-detail-row">
        <span class="timeline-detail-label">CDS status</span>
        <span class="govuk-tag ${tagClass}">${event.cdsStatus}</span>
      </div>`;
    }

    if (event.version && event.title !== 'BTMS decision') {
      html += `<div class="timeline-detail-row">
        <span class="timeline-detail-label">Version</span>
        <span>${event.version}</span>
      </div>`;
    }

    if (event.error) {
      html += `<div class="timeline-detail-row">
        <span class="timeline-detail-label">Error</span>
        <span>${event.error}</span>
      </div>`;
    }

    if (event.message) {
      html += `<div class="timeline-detail-row">
        <span class="timeline-detail-label">Message</span>
        <span class="timeline-message">${event.message}</span>
      </div>`;
    }

    if (event.chedStatus) {
      let tagClass = '';
      let tagHtml = event.chedStatus;
      if (event.chedStatus === 'Valid') {
        tagHtml = `<span class="govuk-tag govuk-tag--green">${event.chedStatus}</span>`;
      } else if (event.chedStatus === 'In progress') {
        tagHtml = `<span class="govuk-tag govuk-tag--yellow">${event.chedStatus}</span>`;
      } else if (event.chedStatus === 'Submitted') {
        tagHtml = `<span class="govuk-tag govuk-tag--grey">${event.chedStatus}</span>`;
      }
      html += `<div class="timeline-detail-row">
        <span class="timeline-detail-label">CHED status</span>
        ${tagHtml}
      </div>`;
    }

    if (event.decision) {
      // For BTMS decision entries, show as "Version" instead of "Decision"
      const isBTMSDecision = mainTitle === 'BTMS decision';
      const label = isBTMSDecision ? 'Version' : 'Decision';
      const decisionValue = typeof event.decision === 'string' && event.decision.includes('Decision ') 
        ? event.decision.replace('Decision ', '') 
        : event.decision;
      html += `<div class="timeline-detail-row">
        <span class="timeline-detail-label">${label}</span>
        <span>${decisionValue}</span>
      </div>`;
    }

    if (event.gmrStatus) {
      html += `<div class="timeline-detail-row">
        <span class="timeline-detail-label">GMR status</span>
        <span class="govuk-tag govuk-tag--green">${event.gmrStatus}</span>
      </div>`;
    }

    if (event.match) {
      html += `<div class="timeline-detail-row">
        <span class="timeline-detail-label">Match</span>
        <span class="govuk-tag govuk-tag--red">${event.match}</span>
      </div>`;
    }

    if (event.created) {
      html += `<div class="timeline-detail-row">
        <span class="timeline-detail-label">Created</span>
        <time datetime="${event.created}">${event.createdFormatted || formatDateForDisplay(event.created)}</time>
      </div>`;
    }

    if (event.hasDetails && event.detailsHtml) {
      html += `<details class="govuk-details">
        <summary class="govuk-details__summary">
          <span class="govuk-details__summary-text">${event.hasDetails === true ? 'More details' : 'View details'}</span>
        </summary>
        <div class="govuk-details__text">${event.detailsHtml}</div>
      </details>`;
    }

    html += `</div></div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

// Initialize timeline (for single MRN pages)
function initializeTimeline(timelineData) {
  const urlParams = new URLSearchParams(window.location.search);
  const eventType = urlParams.get('eventType') || 'all';
  const sortBy = urlParams.get('sortBy') || 'descending';
  
  // Update form selects
  const eventTypeSelect = document.getElementById('eventType');
  const sortBySelect = document.getElementById('sortBy');
  if (eventTypeSelect) eventTypeSelect.value = eventType;
  if (sortBySelect) sortBySelect.value = sortBy;

  // Process and render
  const events = processTimelineEvents(timelineData, eventType, sortBy);
  renderTimeline(events);
}

// Handle filter changes (for single MRN pages)
function handleFilterChange(timelineData) {
  const eventType = document.getElementById('eventType')?.value || 'all';
  const sortBy = document.getElementById('sortBy')?.value || 'descending';
  const events = processTimelineEvents(timelineData, eventType, sortBy);
  renderTimeline(events);
  
  // Update URL without reload
  const url = new URL(window.location);
  url.searchParams.set('eventType', eventType);
  url.searchParams.set('sortBy', sortBy);
  window.history.pushState({}, '', url);
}

// Initialize timeline for multiple MRN pages (like search-results-cancel.html)
function initializeTimelineForMrn(timelineDataByMrn, defaultMrn) {
  const urlParams = new URLSearchParams(window.location.search);
  const mrnFilter = urlParams.get('mrnFilter') || document.getElementById('mrnFilter')?.value || defaultMrn;
  const eventType = urlParams.get('eventType') || 'all';
  const sortBy = urlParams.get('sortBy') || 'descending';
  
  // Get timeline data for selected MRN
  const getTimelineDataForMrn = (mrn) => {
    return timelineDataByMrn[mrn] || timelineDataByMrn[defaultMrn] || [];
  };
  
  // Update form selects
  const mrnFilterSelect = document.getElementById('mrnFilter');
  const eventTypeSelect = document.getElementById('eventType');
  const sortBySelect = document.getElementById('sortBy');
  if (mrnFilterSelect) mrnFilterSelect.value = mrnFilter;
  if (eventTypeSelect) eventTypeSelect.value = eventType;
  if (sortBySelect) sortBySelect.value = sortBy;

  // Process and render
  const timelineData = getTimelineDataForMrn(mrnFilter);
  const events = processTimelineEvents(timelineData, eventType, sortBy);
  renderTimeline(events);
}

// Handle filter changes for multiple MRN pages
function handleFilterChangeForMrn(timelineDataByMrn, defaultMrn) {
  const mrnFilter = document.getElementById('mrnFilter')?.value || defaultMrn;
  const eventType = document.getElementById('eventType')?.value || 'all';
  const sortBy = document.getElementById('sortBy')?.value || 'descending';
  
  // Get timeline data for selected MRN
  const getTimelineDataForMrn = (mrn) => {
    return timelineDataByMrn[mrn] || timelineDataByMrn[defaultMrn] || [];
  };
  
  const timelineData = getTimelineDataForMrn(mrnFilter);
  const events = processTimelineEvents(timelineData, eventType, sortBy);
  renderTimeline(events);
  
  // Update URL without reload
  const url = new URL(window.location);
  url.searchParams.set('mrnFilter', mrnFilter);
  url.searchParams.set('eventType', eventType);
  url.searchParams.set('sortBy', sortBy);
  window.history.pushState({}, '', url);
}

// Auto-initialize timeline if timelineData or timelineDataByMrn is defined in the page
document.addEventListener('DOMContentLoaded', function() {
  // Check for single MRN timeline data
  if (typeof window.timelineData !== 'undefined' && Array.isArray(window.timelineData)) {
    initializeTimeline(window.timelineData);
    
    // Set up filter change handler - wrap in a function that captures timelineData
    const timelineDataRef = window.timelineData;
    window.handleFilterChange = function() {
      handleFilterChange(timelineDataRef);
    };
  }
  
  // Check for multiple MRN timeline data
  if (typeof window.timelineDataByMrn !== 'undefined' && typeof window.defaultMrn !== 'undefined') {
    initializeTimelineForMrn(window.timelineDataByMrn, window.defaultMrn);
    
    // Set up filter change handler - wrap in a function that captures the data
    const timelineDataByMrnRef = window.timelineDataByMrn;
    const defaultMrnRef = window.defaultMrn;
    window.handleFilterChange = function() {
      handleFilterChangeForMrn(timelineDataByMrnRef, defaultMrnRef);
    };
  }
});

// Make functions available globally
window.TimelineUtils = {
  formatDateForDisplay,
  processTimelineEvents,
  renderTimeline,
  initializeTimeline,
  handleFilterChange,
  initializeTimelineForMrn,
  handleFilterChangeForMrn
};
