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



});
