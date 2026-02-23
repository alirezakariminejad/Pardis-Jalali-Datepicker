/* ================================================================
   APP — Demo Page
   ================================================================ */
(() => {
  const themeSwitcher = document.getElementById('themeSwitcher');
  // ── Event Log (no-op if Dev Panel is removed; playground has its own log) ──
  function logEvent(tag, label, payload) {
    // Intentionally empty — playground.js handles event logging
  }

  // ── Helper ──
  function jalaliOf(p) {
    if (p && p.jalali) return p.jalali;
    if (p && p.year !== undefined) return p;
    return null;
  }

  function showOutput(elId, payload) {
    const el = document.getElementById(elId);
    if (!el) return;
    const j = jalaliOf(payload);
    if (j) {
      el.innerHTML = `<span class="out-jalali">${j.formattedPersian || j.formatted}</span>` +
        (payload.gregorian ? ` <span class="out-greg">${payload.gregorian.formatted}</span>` : '');
    } else if (payload && payload.start) {
      const js = jalaliOf(payload.start);
      const je = jalaliOf(payload.end);
      el.innerHTML = js && je
        ? `<span class="out-jalali">${js.formattedPersian}</span> ← <span class="out-jalali">${je.formattedPersian}</span>`
        : '—';
    } else {
      el.textContent = '—';
    }
  }

  // ── Multi-instance Popover ──
  const dp1 = new PardisDatepicker('#input1', {
    outputFormat: 'both',
    onChange: (p) => { showOutput('out1', p); logEvent('select', `input1 — ${jalaliOf(p).formatted}`, p); },
    onClear:  ()  => { document.getElementById('out1').textContent = '—'; },
  });

  const dp2 = new PardisDatepicker('#input2', {
    outputFormat: 'both',
    onChange: (p) => { showOutput('out2', p); logEvent('select', `input2 — ${jalaliOf(p).formatted}`, p); },
    onClear:  ()  => { document.getElementById('out2').textContent = '—'; },
  });

  const dp3 = new PardisDatepicker('#input3', {
    rangeMode: true,
    outputFormat: 'both',
    onRangeSelect: (p) => {
      showOutput('out3', p);
      const s = p.start.jalali.formatted;
      const e = p.end.jalali.formatted;
      logEvent('range', `input3 — ${s} → ${e}`, p);
    },
    onClear: () => { document.getElementById('out3').textContent = '—'; },
  });

  // ── Inline Instances ──
  const dpInline1 = new PardisDatepicker('#inlineHost1', {
    inline: true,
    outputFormat: 'both',
    onChange: (p) => { showOutput('outInline1', p); logEvent('select', `inline1 — ${jalaliOf(p).formatted}`, p); },
    onClear:  ()  => { document.getElementById('outInline1').textContent = '—'; },
  });

  const dpInline2 = new PardisDatepicker('#inlineHost2', {
    inline: true,
    rangeMode: true,
    outputFormat: 'both',
    onRangeSelect: (p) => {
      showOutput('outInline2', p);
      logEvent('range', `inline2 — ${p.start.jalali.formatted} → ${p.end.jalali.formatted}`, p);
    },
    onClear: () => { document.getElementById('outInline2').textContent = '—'; },
  });

  // ── Theme Switcher ──
  const themeMap = {
    modern:  { attr: null,      body: 'theme-modern'  },
    glass:   { attr: 'glass',   body: 'theme-glass'   },
    classic: { attr: 'classic', body: 'theme-classic' },
  };

  themeSwitcher.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      themeSwitcher.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const theme = btn.dataset.theme;
      const config = themeMap[theme];
      if (config.attr) {
        document.documentElement.setAttribute('data-pardis-theme', config.attr);
      } else {
        document.documentElement.removeAttribute('data-pardis-theme');
      }
      document.body.className = config.body;
      // Sync playground theme cards
      document.querySelectorAll('.pg-theme-card').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-checked', 'false');
      });
      const pgMatch = document.querySelector(`.pg-theme-card[data-theme="${theme}"]`);
      if (pgMatch) { pgMatch.classList.add('active'); pgMatch.setAttribute('aria-checked', 'true'); }
      logEvent('view', `تم: ${theme}`);
    });
  });

})();
