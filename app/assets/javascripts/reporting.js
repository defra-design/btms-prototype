  // app/assets/javascripts/reporting.js
(function () {
  // Only run on reporting pages
  if (!document.body.classList.contains('reporting')) return;

  // ---- whatever you moved out of the template goes here ----
  // Example: the presets + charts code you had inline

  // Lazy-load Chart.js if needed
  function ensureChartJs(cb){
    if (window.Chart) return cb();
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    s.onload = cb;
    document.head.appendChild(s);
  }






  document.addEventListener('DOMContentLoaded', () => {
    "use strict";

    // --- toggle: set true if you want presets/clear to auto-submit (page refresh)
    const AUTO_SUBMIT = false;

    const $  = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const pad = n => String(n).padStart(2, '0');

    const findForm = (startEl) =>
      document.getElementById('filter-form') ||
      (startEl && startEl.closest('form')) ||
      document.querySelector('form');

    const setActionHash = (form, hash = 'summary') => {
      if (!form) return;
      const base = form.action ? form.action.split('#')[0] : window.location.pathname;
      form.action = `${base}#${hash}`;
    };
    // Attach to update button
document.querySelector('button[type="submit"]').addEventListener('click', e => {
  const form = findForm(e.target);
  if (form) setActionHash(form, 'page-top');
});

    // ---- Port counter
    (function () {
      const boxes   = $$('#portOfEntry-group input[name="portOfEntry"][type="checkbox"]');
      const countEl = $('#portOfEntry-count');
      const update  = () => { if (countEl) countEl.textContent = boxes.filter(b => b.checked).length + ' selected'; };
      boxes.forEach(b => b.addEventListener('change', update));
      update();
    })();

    // ---- Preset ranges (populate only unless AUTO_SUBMIT === true)
    (function () {
      const fmtISO = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
      const endOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);
      const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday   = new Date(endOfToday);   endOfYesterday.setDate(endOfYesterday.getDate() - 1);
      const startOfLastWeek  = new Date(startOfToday); startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
      const startOfLastMonth = new Date(startOfToday); startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

      const ranges = {
        'today'     : { start: startOfToday,     end: endOfToday },
        'yesterday' : { start: startOfYesterday, end: endOfYesterday },
        'last-week' : { start: startOfLastWeek,  end: endOfToday },
        'last-month': { start: startOfLastMonth, end: endOfToday }
      };

      $$('#preset-links a').forEach(link => {
        const key = link.getAttribute('data-range');
        if (!ranges[key]) return;

        const { start, end } = ranges[key];
        link.dataset.start = fmtISO(start);
        link.dataset.end   = fmtISO(end);

        link.addEventListener('click', e => {
          e.preventDefault();
          const form  = findForm(link);
          const s = new Date(link.dataset.start);
          const t = new Date(link.dataset.end);
          if (isNaN(s) || isNaN(t)) return;

          const dd = n => String(n).padStart(2, '0');
          const dmy = d => `${dd(d.getDate())}/${dd(d.getMonth()+1)}/${d.getFullYear()}`;
          $('#startDate') && ($('#startDate').value = dmy(s));
          $('#endDate')   && ($('#endDate').value   = dmy(t));
          $('[name="startTime-hour"]')   && ($('[name="startTime-hour"]').value   = dd(s.getHours()));
          $('[name="startTime-minute"]') && ($('[name="startTime-minute"]').value = dd(s.getMinutes()));
          $('[name="endTime-hour"]')     && ($('[name="endTime-hour"]').value     = dd(t.getHours()));
          $('[name="endTime-minute"]')   && ($('[name="endTime-minute"]').value   = dd(t.getMinutes()));

          if (AUTO_SUBMIT && form) { setActionHash(form); form.submit(); }
        });
      });
    })();

    // ---- Clear filters (populate only unless AUTO_SUBMIT === true)
    (function () {
      const clearLink = $('#clear-filters a, #btn-clear');
      if (!clearLink) return;

      const scrollToTop = () => {
        const topEl = document.getElementById('page-top');
        const smooth = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (topEl?.scrollIntoView) {
          topEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
          try { topEl.focus({ preventScroll: true }); } catch (_) {}
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' });
        }
        // Keep URL hash on summary tab (optional)
        try { history.replaceState(null, '', window.location.pathname + '#summary'); } catch (_) { window.location.hash = 'summary'; }
      };

      clearLink.addEventListener('click', e => {
        e.preventDefault();
        const form = findForm(clearLink);

        // Clear fields
        $('#startDate') && ($('#startDate').value = '');
        $('#endDate')   && ($('#endDate').value   = '');
        ['startTime-hour','startTime-minute','endTime-hour','endTime-minute'].forEach(n => {
          const el = document.querySelector(`[name="${n}"]`);
          if (el) el.value = '';
        });

        $$('#portOfEntry-group input[name="portOfEntry"][type="checkbox"]').forEach(b => b.checked = false);
        $$('#portOfEntry-group input[name="portOfEntry"][type="hidden"]').forEach(h => h.disabled = true);
        const countEl = $('#portOfEntry-count'); if (countEl) countEl.textContent = '0 selected';

        // Scroll/focus top now
        scrollToTop();

        // If auto-submit is enabled, submit and land on #summary
        if (AUTO_SUBMIT && form) {
          setActionHash(form, 'summary');
          form.submit();
        }
      });
    })();
  });
(function(){
  // save tab when clicked
  document.addEventListener('click', function(e){
    const a = e.target.closest('.govuk-tabs__tab[href^="#"]');
    if (!a) return;
    sessionStorage.setItem('btmsReportingActiveTab', a.getAttribute('href'));
  });

  // restore tab on load (after GOV.UK tabs enhance)
  const apply = () => {
    const saved = sessionStorage.getItem('btmsReportingActiveTab');
    if (!saved) return;
    if (location.hash !== saved) {
      // setting the hash is enough; GOV.UK tabs will show the right panel
      location.hash = saved;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();

  window.GOVUKPrototypeKit?.documentReady?.(() => {
    const Moj = window.MOJFrontend || window.moj?.Frontend || null;
    const nodes = document.querySelectorAll('[data-module="moj-date-input"]');
    if (Moj?.components?.DateInput) nodes.forEach(el => new Moj.components.DateInput({ el }));
  });
  // ...rest of your reporting scripts...
})();