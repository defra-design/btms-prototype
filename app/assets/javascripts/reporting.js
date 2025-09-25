// app/assets/javascripts/reporting.js
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // ---------- small helpers ----------
  const onReady = (fn) =>
    (document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', fn, { once: true })
      : fn());

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const dd = (n) => String(n).padStart(2, '0');

  // ---------- robust time-input lookup ----------
  function getTimeInputs(groupId, namePrefix) {
    const group =
      document.getElementById(groupId) ||
      document.querySelector(`[data-time-group="${groupId}"]`) ||
      document;

    const hour =
      group.querySelector(`#${groupId}-hour`) ||
      group.querySelector(`[name="${namePrefix}-hour"]`) ||
      group.querySelector(`[name="${namePrefix}[hour]"]`) ||
      group.querySelector('input[id$="-hour"]') ||
      group.querySelector('input[name$="[hour]"], input[name$="-hour"]');

    const minute =
      group.querySelector(`#${groupId}-minute`) ||
      group.querySelector(`#${groupId}-minutes`) ||
      group.querySelector(`[name="${namePrefix}-minute"]`) ||
      group.querySelector(`[name="${namePrefix}[minute]"]`) ||
      group.querySelector('input[id$="-minute"], input[id$="-minutes"]') ||
      group.querySelector('input[name$="[minute]"], input[name$="-minute"], input[name$="-minutes"]');

    return { hour, minute };
  }

  // ---------- error UI ----------
  function getOrCreateGroupErrorBox(group) {
    let box = group.querySelector('.btms-field-errors');
    if (box) return box;

    box = document.createElement('div');
    box.className = 'btms-field-errors';

    // If it's a FIELDSET, put the group error AFTER it (outside the fieldset)
    if (group.tagName === 'FIELDSET') {
      const wrapper = group.closest('.govuk-form-group');
      if (wrapper) {
        wrapper.insertBefore(box, group.nextSibling);
      } else {
        group.parentNode.insertBefore(box, group.nextSibling);
      }
      return box;
    }

    // Otherwise, place under the legend/label if present
    const title =
      group.querySelector('.govuk-fieldset__legend') ||
      group.querySelector('.govuk-label, label');

    if (title) {
      if (title.nextSibling) title.parentNode.insertBefore(box, title.nextSibling);
      else title.parentNode.appendChild(box);
    } else {
      group.prepend(box);
    }

    return box;
  }

  // Field-specific error (rendered inline near the input)
  function showFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const group = input.closest('.govuk-form-group') || input.parentElement || document;
    group.classList.add('govuk-form-group--error');

    input.classList.add('govuk-input--error');
    input.setAttribute('aria-invalid', 'true');

    const stack = getOrCreateGroupErrorBox(group);
    const errId = `${inputId}-error`;
    let msg = stack.querySelector(`#${errId}`);
    if (!msg) {
      msg = document.createElement('p');
      msg.id = errId;
      msg.className = 'govuk-error-message';
      stack.appendChild(msg);
    }
    msg.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${message}`;

    const describedBy = (input.getAttribute('aria-describedby') || '').trim().split(/\s+/).filter(Boolean);
    if (!describedBy.includes(errId)) {
      describedBy.push(errId);
      input.setAttribute('aria-describedby', describedBy.join(' '));
    }
  }

  // Group-level error for time pairs (“Start time must include …”)
  function showTimeGroupError(groupId, message, highlightIds = []) {
    const anchor =
      document.getElementById(groupId) ||
      document.getElementById(`${groupId}-hour`) ||
      document.getElementById(`${groupId}-minute`);

    const group = anchor?.closest('.govuk-form-group') || anchor?.closest('fieldset') || anchor || document;
    group.classList.add('govuk-form-group--error');

    const stack = getOrCreateGroupErrorBox(group);

    let p = stack.querySelector(`#${groupId}-group-error`);
    if (!p) {
      p = document.createElement('p');
      p.id = `${groupId}-group-error`;
      p.className = 'govuk-error-message';
      stack.prepend(p);
    }
    p.innerHTML = `<span class="govuk-visually-hidden">Error:</span> ${message}`;

    // Highlight specific inputs and associate their aria-describedby with the group error
    highlightIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.add('govuk-input--error');
      el.setAttribute('aria-invalid', 'true');
      const describedBy = (el.getAttribute('aria-describedby') || '').trim().split(/\s+/).filter(Boolean);
      if (!describedBy.includes(`${groupId}-group-error`)) {
        describedBy.push(`${groupId}-group-error`);
        el.setAttribute('aria-describedby', describedBy.join(' '));
      }
    });
  }

  function clearErrors(container) {
    container.querySelectorAll('.govuk-form-group--error').forEach(el => el.classList.remove('govuk-form-group--error'));
    container.querySelectorAll('.govuk-input--error').forEach(el => el.classList.remove('govuk-input--error'));
    container.querySelectorAll('.btms-field-errors').forEach(el => el.remove());
    container.querySelector('.govuk-error-summary')?.remove();
    container.querySelectorAll('[aria-invalid="true"]').forEach(el => el.removeAttribute('aria-invalid'));
    container.querySelectorAll('[aria-describedby]').forEach(el => {
      const ids = (el.getAttribute('aria-describedby') || '')
        .split(/\s+/).filter(Boolean).filter(id => !/-error$/.test(id));
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
      else el.removeAttribute('aria-describedby');
    });
  }

  function renderErrorSummary(container, errorList) {
    const frag = document.createElement('div');
    frag.className = 'govuk-error-summary';
    frag.setAttribute('data-module', 'govuk-error-summary');
    frag.setAttribute('role', 'alert');
    frag.setAttribute('aria-labelledby', 'error-summary-title');

    const list = errorList.map(e => `<li><a href="${e.href}">${e.text}</a></li>`).join('');
    frag.innerHTML = `
      <h2 class="govuk-error-summary__title" id="error-summary-title">There is a problem</h2>
      <div class="govuk-error-summary__body">
        <ul class="govuk-list govuk-error-summary__list">
          ${list}
        </ul>
      </div>
    `;
    const mainCol = container.querySelector('.govuk-grid-column-three-quarters') || container.body || container;
    mainCol.prepend(frag);
    try { frag.focus(); } catch (_) {}
  }

  // ---------- parsing ----------
  function parseDate(input) {
    if (!input) return null;
    const s = input.trim();

    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) {
      const dd = Number(m[1]), mm = Number(m[2]), yy = Number(m[3]);
      const d = new Date(yy, mm - 1, dd);
      if (d.getFullYear() === yy && d.getMonth() === mm - 1 && d.getDate() === dd) return { y: yy, m: mm, d: dd };
      return null;
    }

    m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const yy = Number(m[1]), mm = Number(m[2]), dd = Number(m[3]);
      const d = new Date(yy, mm - 1, dd);
      if (d.getFullYear() === yy && d.getMonth() === mm - 1 && d.getDate() === dd) return { y: yy, m: mm, d: dd };
      return null;
    }

    return null;
  }

  // ---------- time validation ----------
  function validateTimePair(hourStr, minuteStr, allow24 = true, requireBothWhenAny = false) {
    const hS = (hourStr ?? '').trim();
    const mS = (minuteStr ?? '').trim();
    const hProvided = hS !== '';
    const mProvided = mS !== '';

    const errors = [];
    let h = null, m = null;

    // Required-if rule
    if (requireBothWhenAny) {
      if (!hProvided) errors.push({ field: 'hour', code: 'required', message: 'Enter hour' });
      if (!mProvided) errors.push({ field: 'minute', code: 'required', message: 'Enter minutes' });
    } else {
      if (mProvided && !hProvided) errors.push({ field: 'hour', code: 'required', message: 'Enter hour' });
      if (hProvided && !mProvided) errors.push({ field: 'minute', code: 'required', message: 'Enter minutes' });
    }

    // Non-numeric (only if provided)
    if (hProvided && !/^-?\d+$/.test(hS)) {
      errors.push({ field: 'hour', code: 'nan', message: 'Hour must be a number' });
    }
    if (mProvided && !/^-?\d+$/.test(mS)) {
      errors.push({ field: 'minute', code: 'nan', message: 'Minute must be a number' });
    }

    // Parse
    if (hProvided && /^\-?\d+$/.test(hS)) h = Number(hS);
    if (mProvided && /^\-?\d+$/.test(mS)) m = Number(mS);

    // Range
    if (m !== null && (m < 0 || m > 59)) {
      errors.push({ field: 'minute', code: 'range', message: 'Minute must be 59 or lower' });
    }

    if (h !== null) {
      if (allow24 && h === 24) {
        if (m !== 0) {
          errors.push({ field: 'hour', code: 'range', message: '24 is only valid with minutes set to 00.' });
        }
      } else if (h < 0 || h > 23) {
        errors.push({ field: 'hour', code: 'range', message: 'Hour must be 23 or lower.' });
      }
    }

    return { h, m, errors, hBlank: !hProvided, mBlank: !mProvided };
  }

  function toDateObj(d, t) {
    const h = t?.h ?? 0;
    const m = t?.m ?? 0;
    return new Date(d.y, d.m - 1, d.d, h, m, 0, 0);
  }

  // ---------- main ----------
  onReady(() => {
    if (!document.body || !document.body.classList.contains('reporting')) return;

    const AUTO_SUBMIT = false;

    const findForm = (startEl) =>
      document.getElementById('filter-form') ||
      (startEl && startEl.closest && startEl.closest('form')) ||
      document.querySelector('form');

    const setActionHash = (form, hash = 'summary') => {
      if (!form) return;
      const base = form.action ? form.action.split('#')[0] : window.location.pathname;
      form.action = `${base}#${hash}`;
    };

    // keep current “Update” behaviour (scroll to top)
    const submitBtn = document.querySelector('.filters button[type="submit"], button[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => {
        const form = findForm(e.target);
        if (form) setActionHash(form, 'page-top');
      });
    }

    // ---- Port counter ----
    (function () {
      const boxes   = $$('#portOfEntry-group input[name="portOfEntry"][type="checkbox"]');
      const countEl = $('#portOfEntry-count');
      if (!boxes.length || !countEl) return;
      const update  = () => { countEl.textContent = boxes.filter(b => b.checked).length + ' selected'; };
      boxes.forEach(b => b.addEventListener('change', update));
      update();
    })();

    // ---- Preset ranges (rolling, GA-style) ----
    (function () {
      const now = new Date();
      // round "now" to minutes (inputs are minute precision)
      const nowToMinute = new Date(
        now.getFullYear(), now.getMonth(), now.getDate(),
        now.getHours(), now.getMinutes()
      );

      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);

      // Yesterday: 00:00 → 23:59
      const startOfYesterday = new Date(startOfToday);
      startOfYesterday.setDate(startOfYesterday.getDate() - 1);
      const endOfYesterday = new Date(
        startOfYesterday.getFullYear(), startOfYesterday.getMonth(), startOfYesterday.getDate(), 23, 59
      );

      // Last 7 days incl. today: start 6 days ago at 00:00 → today 23:59
      const startOfLast7 = new Date(startOfToday);
      startOfLast7.setDate(startOfLast7.getDate() - 6);

      // Last 30 days incl. today: start 29 days ago at 00:00 → today 23:59
      const startOfLast30 = new Date(startOfToday);
      startOfLast30.setDate(startOfLast30.getDate() - 29);

      // Common end for week/month presets: today at 23:59
      const endTodayAt2359 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);

      const ranges = {
        'today'     : { start: startOfToday,      end: nowToMinute },     // 00:00 → now
        'yesterday' : { start: startOfYesterday,  end: endOfYesterday },  // 00:00 → 23:59
        'last-week' : { start: startOfLast7,      end: endTodayAt2359 },  // last 7 days incl. today → 23:59
        'last-month': { start: startOfLast30,     end: endTodayAt2359 }   // last 30 days incl. today → 23:59
      };

      $$('#preset-links a').forEach(link => {
        const key = link.getAttribute('data-range');
        const r = ranges[key];
        if (!r) return;

        link.addEventListener('click', (e) => {
          e.preventDefault();
          const form = findForm(link);

          const dmy = (d) => `${dd(d.getDate())}/${dd(d.getMonth()+1)}/${d.getFullYear()}`;
          $('#startDate') && ($('#startDate').value = dmy(r.start));
          $('#endDate')   && ($('#endDate').value   = dmy(r.end));

          const setIf = (sel, val) => { const el = $(sel); if (el) el.value = val; };
          setIf('[name="startTime-hour"]',   dd(r.start.getHours()));
          setIf('[name="startTime-minute"]', dd(r.start.getMinutes()));
          setIf('[name="endTime-hour"]',     dd(r.end.getHours()));
          setIf('[name="endTime-minute"]',   dd(r.end.getMinutes()));

          if (AUTO_SUBMIT && form) { setActionHash(form); form.submit(); }
        });
      });
    })();

    // ---- Clear filters ----
    (function () {
      const clearLink = document.querySelector('#clear-filters a, #btn-clear');
      if (!clearLink) return;

      clearLink.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove any existing validation UI
        clearErrors(document);

        // Clear date & time inputs
        ['startDate','endDate'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        ['startTime-hour','startTime-minute','endTime-hour','endTime-minute']
          .forEach(name => { const el = document.querySelector(`[name="${name}"]`); if (el) el.value = ''; });

        // Clear ports
        document.querySelectorAll('#portOfEntry-group input[name="portOfEntry"][type="checkbox"]')
          .forEach(b => b.checked = false);
        document.querySelectorAll('#portOfEntry-group input[name="portOfEntry"][type="hidden"]')
          .forEach(h => h.disabled = true);
        const countEl = document.getElementById('portOfEntry-count'); if (countEl) countEl.textContent = '0 selected';

        // Scroll to top and keep the #summary hash
        const topEl = document.getElementById('page-top');
        const smooth = !window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (topEl?.scrollIntoView) {
          topEl.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
          try { topEl.focus({ preventScroll: true }); } catch {}
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' });
        }
        try { history.replaceState(null, '', window.location.pathname + '#summary'); } catch { location.hash = 'summary'; }
      });
    })();

    // ---- Validation on submit ----
    (function () {
      const page = document.querySelector('.reporting');
      if (!page) return;

      const form = findForm(page) || document;
      form.addEventListener('submit', function (e) {
        const container = document;
        clearErrors(container);

        const startDateStr = $('#startDate')?.value || '';
        const endDateStr   = $('#endDate')?.value   || '';

        const startEls = getTimeInputs('start-time', 'startTime');
        const endEls   = getTimeInputs('end-time',   'endTime');

        const startHour   = startEls.hour?.value   ?? '';
        const startMinute = startEls.minute?.value ?? '';
        const endHour     = endEls.hour?.value     ?? '';
        const endMinute   = endEls.minute?.value   ?? '';

        // Ensure ids exist (needed for summary links)
        if (startEls.hour && !startEls.hour.id)     startEls.hour.id     = 'start-time-hour';
        if (startEls.minute && !startEls.minute.id) startEls.minute.id   = 'start-time-minute';
        if (endEls.hour && !endEls.hour.id)         endEls.hour.id       = 'end-time-hour';
        if (endEls.minute && !endEls.minute.id)     endEls.minute.id     = 'end-time-minute';

        const errors = [];

        // ---- Dates ----
        const hasStartDate = startDateStr.trim() !== '';
        const hasEndDate   = endDateStr.trim()   !== '';

        if (!hasStartDate) { errors.push({ text: 'Enter a start date', href: '#startDate' }); showFieldError('startDate', 'Enter a start date'); }
        if (!hasEndDate)   { errors.push({ text: 'Enter an end date',   href: '#endDate'   }); showFieldError('endDate',   'Enter an end date'); }

        let startD = null, endD = null;
        if (hasStartDate) {
          startD = parseDate(startDateStr);
          if (!startD) { errors.push({ text: 'Enter a valid start date.', href: '#startDate' }); showFieldError('startDate', 'Enter a valid start date.'); }
        }
        if (hasEndDate) {
          endD = parseDate(endDateStr);
          if (!endD) { errors.push({ text: 'Enter a valid end date.', href: '#endDate' }); showFieldError('endDate', 'Enter a valid end date.'); }
        }

        // ---- End date cannot be in the future ----
        if (endD) {
          const today = new Date();
          const todayYMD = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const endYMD   = new Date(endD.y, endD.m - 1, endD.d);
          if (endYMD.getTime() > todayYMD.getTime()) {
            const msg = 'End date must be today or in the past';
            errors.push({ text: msg, href: '#endDate' });
            showFieldError('endDate', msg);
          }
        }

        // If ANY time box anywhere is filled, require all four.
        const anyTimeProvided =
          (startHour && startHour.trim() !== '') ||
          (startMinute && startMinute.trim() !== '') ||
          (endHour && endHour.trim() !== '') ||
          (endMinute && endMinute.trim() !== '');

        // Tidy summary wording
        const summaryText = (scope, field, baseMsg, code) => {
          if (code === 'required') return `Enter ${scope.toLowerCase()} ${field}`;
          if (/^Hour\b/i.test(baseMsg))   return `${scope} hour ${baseMsg.replace(/^Hour\b:?/i, '').trim()}`;
          if (/^Minute\b/i.test(baseMsg)) return `${scope} minutes ${baseMsg.replace(/^Minute\b:?/i, '').trim()}`;
          return `${scope} ${baseMsg}`;
        };

        // ---- Start time ----
        const startCheck = validateTimePair(startHour, startMinute, true, anyTimeProvided);

        // Group-level message for required empties
        const stReqHour = startCheck.errors.some(e => e.code === 'required' && e.field === 'hour');
        const stReqMin  = startCheck.errors.some(e => e.code === 'required' && e.field === 'minute');
        if (stReqHour || stReqMin) {
          const msg =
            (stReqHour && stReqMin) ? 'Start time must include an hour and minutes.' :
            (stReqHour)             ? 'Start time must include an hour.' :
                                      'Start time must include minutes.';
          showTimeGroupError('start-time', msg, [
            stReqHour ? 'start-time-hour'   : null,
            stReqMin  ? 'start-time-minute' : null
          ].filter(Boolean));
        }

        // Still list and show field messages
        startCheck.errors.forEach(err => {
          const el = err.field === 'minute' ? startEls.minute : startEls.hour;
          if (!el) return;
          errors.push({ text: summaryText('Start time', err.field, err.message, err.code), href: `#${el.id}` });
          if (err.code !== 'required') showFieldError(el.id, err.message);
        });

        // ---- End time ----
        const endCheck = validateTimePair(endHour, endMinute, true, anyTimeProvided);

        const etReqHour = endCheck.errors.some(e => e.code === 'required' && e.field === 'hour');
        const etReqMin  = endCheck.errors.some(e => e.code === 'required' && e.field === 'minute');
        if (etReqHour || etReqMin) {
          const msg =
            (etReqHour && etReqMin) ? 'End time must include an hour and minutes.' :
            (etReqHour)             ? 'End time must include an hour.' :
                                      'End time must include minutes.';
          showTimeGroupError('end-time', msg, [
            etReqHour ? 'end-time-hour'   : null,
            etReqMin  ? 'end-time-minute' : null
          ].filter(Boolean));
        }

        endCheck.errors.forEach(err => {
          const el = err.field === 'minute' ? endEls.minute : endEls.hour;
          if (!el) return;
          errors.push({ text: summaryText('End time', err.field, err.message, err.code), href: `#${el.id}` });
          if (err.code !== 'required') showFieldError(el.id, err.message);
        });

        // Defaults for blank parts (so date-only works)
        const startTimeNorm = { h: (startCheck.h === null ? 0  : startCheck.h),
                                m: (startCheck.m === null ? 0  : startCheck.m) };
        const endTimeNorm   = { h: (endCheck.h   === null ? 23 : endCheck.h),
                                m: (endCheck.m   === null ? 59 : endCheck.m) };

        // Cross-field: start <= end
        if (startD && endD) {
          const s = toDateObj(startD, startTimeNorm);
          const t = toDateObj(endD,   endTimeNorm);

          if (s.getTime() > t.getTime()) {
            const startMsg = 'Start date must be before or the same as the end date';
            const endMsg   = 'End date must be after or the same as the start date';

            errors.push({ text: startMsg, href: '#startDate' });
            errors.push({ text: endMsg,   href: '#endDate'   });

            showFieldError('startDate', startMsg);
            showFieldError('endDate',   endMsg);
          }
        }

        if (errors.length) {
          e.preventDefault();
          renderErrorSummary(container, errors);
          container.querySelector('.govuk-error-summary')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, true);
    })();

    // ---- remember active tab ----
    (function () {
      document.addEventListener('click', function (e) {
        const a = e.target.closest?.('.govuk-tabs__tab[href^="#"]');
        if (!a) return;
        try { sessionStorage.setItem('btmsReportingActiveTab', a.getAttribute('href')); } catch (_) {}
      });
      const saved = (() => { try { return sessionStorage.getItem('btmsReportingActiveTab'); } catch (_) { return null; }})();
      if (saved && location.hash !== saved) location.hash = saved;
    })();

    // ---- Limit date pickers to last 4 months (incl. today) & initialise MOJ DatePicker ----
    (function () {
      // today at 00:00
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 4 calendar months ago (same day-of-month; Date handles wrap)
      const min = new Date(today.getFullYear(), today.getMonth() - 4, today.getDate());

      const p2  = n => String(n).padStart(2, '0');
      const ymd = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
      const minStr = ymd(min);
      const maxStr = ymd(today);

      // Apply min/max to inputs (helps both native & MOJ)
      ['startDate', 'endDate'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.setAttribute('min', minStr);
        el.setAttribute('max', maxStr);
        el.setAttribute('data-min-date', minStr);
        el.setAttribute('data-max-date', maxStr);
      });
      // ---- Limit date pickers to last 4 months (incl. today) ----
(function () {
  // today @ 00:00
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // four calendar months back from today
  const min = new Date(today.getFullYear(), today.getMonth() - 4, today.getDate());

  const p2  = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

  const minStr = ymd(min);
  const maxStr = ymd(today);

  // Apply to inputs (helps native pickers and gives hints to MOJ)
  ['startDate', 'endDate'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.setAttribute('min', minStr);
    el.setAttribute('max', maxStr);
    el.setAttribute('data-min-date', minStr);
    el.setAttribute('data-max-date', maxStr);
    // prevent typing a date outside range
    el.addEventListener('change', () => {
      const [dd, mm, yyyy] = (el.value || '').split('/');
      if (!dd || !mm || !yyyy) return;
      const typed = new Date(+yyyy, +mm - 1, +dd);
      if (typed < min) el.value = `${p2(min.getDate())}/${p2(min.getMonth()+1)}/${min.getFullYear()}`;
      if (typed > today) el.value = `${p2(today.getDate())}/${p2(today.getMonth()+1)}/${today.getFullYear()}`;
    });
  });

  // Initialise MOJ DatePicker if present (blocks selecting outside range)
  const Moj = window.MOJFrontend || window.moj?.Frontend || null;
  const pickerRoots = document.querySelectorAll('[data-module="moj-date-picker"]');
  if (Moj?.components?.DatePicker && pickerRoots.length) {
    pickerRoots.forEach(el => {
      new Moj.components.DatePicker({
        el,
        minDate: minStr,      // YYYY-MM-DD
        maxDate: maxStr
      });
    });
  }
})();


      // Initialise MOJ DatePicker if present (blocks navigating before min / after max)
      const Moj = window.MOJFrontend || window.moj?.Frontend || null;
      const pickerNodes = document.querySelectorAll('[data-module="moj-date-picker"]');
      if (Moj?.components?.DatePicker && pickerNodes.length) {
        pickerNodes.forEach(el => {
          new Moj.components.DatePicker({
            el,
            minDate: minStr,  // YYYY-MM-DD
            maxDate: maxStr
          });
        });
      } else {
        // Fallback: if only DateInput is available, initialise it so typed values still get parsed.
        const inputNodes = document.querySelectorAll('[data-module="moj-date-input"]');
        if (Moj?.components?.DateInput && inputNodes.length) {
          inputNodes.forEach(el => new Moj.components.DateInput({ el }));
        }
      }
    })();
  });
})();
