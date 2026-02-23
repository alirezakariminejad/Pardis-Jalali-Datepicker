/* ============================================================
   PLAYGROUND — Interactive Feature Tester
   ============================================================ */
(() => {
  // ── State ──
  let pgInstance = null;

  // ── DOM Refs ──
  const previewBox    = document.getElementById('pgPreview');
  const logList       = document.getElementById('pgLogList');
  const toast         = document.getElementById('pgToast');
  const codeOutput    = document.getElementById('pgCodeOutput');
  const codeCopyBtn   = document.getElementById('pgCodeCopy');

  // Controls
  const ctrlInline       = document.getElementById('pgInline');
  const ctrlRange        = document.getElementById('pgRange');
  const ctrlFormat       = document.getElementById('pgFormat');
  const ctrlYear         = document.getElementById('pgYear');
  const ctrlMonth        = document.getElementById('pgMonth');
  const ctrlMinToggle    = document.getElementById('pgMinToggle');
  const ctrlMinY         = document.getElementById('pgMinY');
  const ctrlMinM         = document.getElementById('pgMinM');
  const ctrlMinD         = document.getElementById('pgMinD');
  const ctrlMaxToggle    = document.getElementById('pgMaxToggle');
  const ctrlMaxY         = document.getElementById('pgMaxY');
  const ctrlMaxM         = document.getElementById('pgMaxM');
  const ctrlMaxD         = document.getElementById('pgMaxD');

  // Helper inputs
  const hlpBuildY   = document.getElementById('pgHlpBuildY');
  const hlpBuildM   = document.getElementById('pgHlpBuildM');
  const hlpBuildD   = document.getElementById('pgHlpBuildD');
  const hlpBuildFmt = document.getElementById('pgHlpBuildFmt');
  const hlpBuildRes = document.getElementById('pgHlpBuildRes');
  const hlpFmtY     = document.getElementById('pgHlpFmtY');
  const hlpFmtM     = document.getElementById('pgHlpFmtM');
  const hlpFmtD     = document.getElementById('pgHlpFmtD');
  const hlpFmtRes   = document.getElementById('pgHlpFmtRes');
  const hlpNumIn    = document.getElementById('pgHlpNumIn');
  const hlpNumRes   = document.getElementById('pgHlpNumRes');
  const hlpFromIn   = document.getElementById('pgHlpFromIn');
  const hlpFromRes  = document.getElementById('pgHlpFromRes');

  // setValue inputs
  const svY = document.getElementById('pgSvY');
  const svM = document.getElementById('pgSvM');
  const svD = document.getElementById('pgSvD');

  // ── Tabs ──
  const tabs = document.querySelectorAll('.pg-tab');
  const panels = document.querySelectorAll('.pg-tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      panels.forEach(p => { p.classList.remove('active'); p.hidden = true; });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) { panel.classList.add('active'); panel.hidden = false; }
    });
  });

  // ── Toast ──
  let toastTimer = null;
  function showToast(text) {
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
  }

  // ── Log ──
  function logEvent(tag, label, payload) {
    const empty = logList.querySelector('.pg-log-empty');
    if (empty) empty.remove();

    const item = document.createElement('div');
    item.className = 'pg-log-item';

    const time = new Date().toLocaleTimeString('fa-IR');
    const json = payload !== undefined
      ? JSON.stringify(payload, (k, v) => v instanceof Date ? v.toISOString() : v, 2)
      : null;

    item.innerHTML = `
      <div class="pg-log-row">
        <span class="pg-log-tag ${tag}">${tag}</span>
        <span class="pg-log-label">${label}</span>
        <span class="pg-log-time">${time}</span>
      </div>
      ${json ? `<pre class="pg-log-payload">${escapeHtml(json)}</pre>` : ''}
    `;

    if (json) {
      item.addEventListener('click', () => item.classList.toggle('expanded'));
    }

    logList.prepend(item);
    while (logList.children.length > 30) {
      logList.removeChild(logList.lastChild);
    }
  }

  function escapeHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  document.getElementById('pgLogClear').addEventListener('click', () => {
    logList.innerHTML = '<div class="pg-log-empty">هنوز رویدادی ثبت نشده — یک تاریخ انتخاب کنید</div>';
  });

  // ── Syntax Highlight Helpers ──
  // ck=keyword, cs=string, cc=comment, cf=function, cn=number, cp=property
  function hk(s) { return '<span class="ck">' + s + '</span>'; }
  function hs(s) { return '<span class="cs">\'' + s + '\'</span>'; }
  function hc(s) { return '<span class="cc">// ' + s + '</span>'; }
  function hf(s) { return '<span class="cf">' + s + '</span>'; }
  function hn(s) { return '<span class="cn">' + s + '</span>'; }
  function hp(s) { return '<span class="cp">' + s + '</span>'; }

  // ── Code Generator ──
  let lastRawCode = '';

  function generateCode() {
    const isInline = ctrlInline.checked;
    const isRange  = ctrlRange.checked;
    const fmt      = ctrlFormat.value;
    const y        = parseInt(ctrlYear.value);
    const m        = parseInt(ctrlMonth.value);
    const hasMin   = ctrlMinToggle.checked;
    const hasMax   = ctrlMaxToggle.checked;

    const lines = [];
    const rawLines = [];

    // HTML comment
    lines.push(hc('HTML'));
    rawLines.push('// HTML');
    if (isInline) {
      lines.push('&lt;' + hf('div') + ' ' + hp('id') + '=' + hs('myCalendar') + '&gt;&lt;/' + hf('div') + '&gt;');
      rawLines.push('<div id="myCalendar"></div>');
    } else {
      lines.push('&lt;' + hf('input') + ' ' + hp('id') + '=' + hs('myInput') + ' ' + hp('type') + '=' + hs('text') + ' /&gt;');
      rawLines.push('<input id="myInput" type="text" />');
    }
    lines.push('');
    rawLines.push('');

    // JS
    lines.push(hc('JavaScript'));
    rawLines.push('// JavaScript');

    const target = isInline ? '#myCalendar' : '#myInput';
    lines.push(hk('const') + ' dp = ' + hk('new') + ' ' + hf('PardisDatepicker') + '(' + hs(target) + ', {');
    rawLines.push(`const dp = new PardisDatepicker('${target}', {`);

    // Options
    if (isInline) {
      lines.push('  ' + hp('inline') + ': ' + hk('true') + ',');
      rawLines.push('  inline: true,');
    }
    if (isRange) {
      lines.push('  ' + hp('rangeMode') + ': ' + hk('true') + ',');
      rawLines.push('  rangeMode: true,');
    }
    if (fmt !== 'both') {
      lines.push('  ' + hp('outputFormat') + ': ' + hs(fmt) + ',');
      rawLines.push(`  outputFormat: '${fmt}',`);
    }
    if (!isNaN(y) && y >= 1 && y <= 3177) {
      lines.push('  ' + hp('initialYear') + ': ' + hn(y) + ',');
      rawLines.push(`  initialYear: ${y},`);
    }
    if (!isNaN(m) && m >= 1 && m <= 12) {
      lines.push('  ' + hp('initialMonth') + ': ' + hn(m) + ',');
      rawLines.push(`  initialMonth: ${m},`);
    }
    if (hasMin) {
      const my = ctrlMinY.value, mm = ctrlMinM.value, md = ctrlMinD.value;
      lines.push('  ' + hp('minDate') + ': { ' + hp('jy') + ': ' + hn(my) + ', ' + hp('jm') + ': ' + hn(mm) + ', ' + hp('jd') + ': ' + hn(md) + ' },');
      rawLines.push(`  minDate: { jy: ${my}, jm: ${mm}, jd: ${md} },`);
    }
    if (hasMax) {
      const my = ctrlMaxY.value, mm = ctrlMaxM.value, md = ctrlMaxD.value;
      lines.push('  ' + hp('maxDate') + ': { ' + hp('jy') + ': ' + hn(my) + ', ' + hp('jm') + ': ' + hn(mm) + ', ' + hp('jd') + ': ' + hn(md) + ' },');
      rawLines.push(`  maxDate: { jy: ${my}, jm: ${mm}, jd: ${md} },`);
    }

    // Callbacks
    if (isRange) {
      lines.push('  ' + hp('onRangeSelect') + ': (' + hf('range') + ') => {');
      rawLines.push('  onRangeSelect: (range) => {');
      lines.push('    console.' + hf('log') + '(range.' + hp('start') + ', range.' + hp('end') + ');');
      rawLines.push('    console.log(range.start, range.end);');
      lines.push('  },');
      rawLines.push('  },');
    } else {
      lines.push('  ' + hp('onChange') + ': (' + hf('payload') + ') => {');
      rawLines.push('  onChange: (payload) => {');
      if (fmt === 'jalali') {
        lines.push('    console.' + hf('log') + '(payload.' + hp('formatted') + ');');
        rawLines.push('    console.log(payload.formatted);');
      } else if (fmt === 'gregorian') {
        lines.push('    console.' + hf('log') + '(payload.' + hp('formatted') + ');');
        rawLines.push('    console.log(payload.formatted);');
      } else {
        lines.push('    console.' + hf('log') + '(payload.' + hp('jalali') + '.' + hp('formatted') + ');');
        rawLines.push('    console.log(payload.jalali.formatted);');
        lines.push('    console.' + hf('log') + '(payload.' + hp('gregorian') + '.' + hp('formatted') + ');');
        rawLines.push('    console.log(payload.gregorian.formatted);');
      }
      lines.push('  },');
      rawLines.push('  },');
    }

    lines.push('  ' + hp('onClear') + ': () => {');
    rawLines.push('  onClear: () => {');
    lines.push('    console.' + hf('log') + '(' + hs('cleared') + ');');
    rawLines.push("    console.log('cleared');");
    lines.push('  },');
    rawLines.push('  },');

    lines.push('});');
    rawLines.push('});');

    codeOutput.innerHTML = lines.join('\n');
    lastRawCode = rawLines.join('\n');
  }

  // ── Copy Code ──
  codeCopyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(lastRawCode).then(() => {
      codeCopyBtn.textContent = '✅';
      codeCopyBtn.classList.add('copied');
      setTimeout(() => {
        codeCopyBtn.textContent = '📋';
        codeCopyBtn.classList.remove('copied');
      }, 2000);
    });
  });

  // ── Build Options from Controls ──
  function buildOptions() {
    const opts = {
      inline: ctrlInline.checked,
      rangeMode: ctrlRange.checked,
      outputFormat: ctrlFormat.value,
      onChange: (p) => {
        logEvent('select', jalaliLabel(p), p);
      },
      onRangeStart: (p) => {
        logEvent('rangeStart', jalaliLabel(p), p);
      },
      onRangeSelect: (p) => {
        const sl = jalaliLabel(p.start);
        const el = jalaliLabel(p.end);
        logEvent('rangeSelect', `${sl} \u2192 ${el}`, p);
      },
      onClear: () => {
        logEvent('clear', '\u0627\u0646\u062a\u062e\u0627\u0628 \u067e\u0627\u06a9 \u0634\u062f');
      },
    };

    const y = parseInt(ctrlYear.value);
    const m = parseInt(ctrlMonth.value);
    if (!isNaN(y) && y >= 1 && y <= 3177) opts.initialYear = y;
    if (!isNaN(m) && m >= 1 && m <= 12) opts.initialMonth = m;

    if (ctrlMinToggle.checked) {
      const my = parseInt(ctrlMinY.value);
      const mm = parseInt(ctrlMinM.value);
      const md = parseInt(ctrlMinD.value);
      if (!isNaN(my) && !isNaN(mm) && !isNaN(md)) {
        opts.minDate = { jy: my, jm: mm, jd: md };
      }
    }

    if (ctrlMaxToggle.checked) {
      const my = parseInt(ctrlMaxY.value);
      const mm = parseInt(ctrlMaxM.value);
      const md = parseInt(ctrlMaxD.value);
      if (!isNaN(my) && !isNaN(mm) && !isNaN(md)) {
        opts.maxDate = { jy: my, jm: mm, jd: md };
      }
    }

    return opts;
  }

  function jalaliLabel(p) {
    if (p && p.jalali) return p.jalali.formattedPersian || p.jalali.formatted;
    if (p && p.formattedPersian) return p.formattedPersian;
    if (p && p.formatted) return p.formatted;
    if (p && p.year !== undefined) return `${p.year}/${p.month}/${p.day}`;
    return '\u2014';
  }

  // ── Create / Recreate Instance ──
  function recreate() {
    if (pgInstance) {
      try { pgInstance.destroy(); } catch(e) {}
      pgInstance = null;
    }

    previewBox.innerHTML = '';
    previewBox.classList.remove('active');

    const opts = buildOptions();

    if (opts.inline) {
      const host = document.createElement('div');
      host.id = 'pgInlineHost';
      previewBox.appendChild(host);
      previewBox.classList.add('active');
      pgInstance = new PardisDatepicker('#pgInlineHost', opts);
    } else {
      const wrap = document.createElement('div');
      wrap.className = 'pg-popover-wrap';
      wrap.innerHTML = `
        <div class="pardis-input-wrapper">
          <input class="pardis-input" id="pgPopoverInput" type="text" placeholder="\u06F1\u06F4\u06F0\u06F4/\u06F0\u06F1/\u06F0\u06F1" autocomplete="off">
          <span class="pardis-input-icon">\uD83D\uDCC5</span>
        </div>
      `;
      previewBox.appendChild(wrap);
      previewBox.classList.add('active');
      pgInstance = new PardisDatepicker('#pgPopoverInput', opts);
    }

    if (pgInstance && pgInstance.engine) {
      pgInstance.engine.on('viewChange', (info) => {
        logEvent('viewChange', `${info.monthName} ${PardisEngine.toPersianNum(info.year)} (${info.viewMode})`, info);
      });
    }

    generateCode();
    logEvent('api', 'Instance created', opts.inline ? {mode:'inline'} : {mode:'popover'});
  }

  // ── Auto-recreate on option change ──
  const autoRecreateEls = [ctrlInline, ctrlRange, ctrlFormat, ctrlMinToggle, ctrlMaxToggle];
  autoRecreateEls.forEach(el => {
    el.addEventListener('change', recreate);
  });

  let debounceTimer = null;
  const debouncedRecreate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(recreate, 600);
  };
  [ctrlYear, ctrlMinY, ctrlMinM, ctrlMinD, ctrlMaxY, ctrlMaxM, ctrlMaxD].forEach(el => {
    el.addEventListener('input', debouncedRecreate);
  });
  ctrlMonth.addEventListener('change', recreate);

  // ── Theme Cards ──
  document.querySelectorAll('.pg-theme-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.pg-theme-card').forEach(c => {
        c.classList.remove('active');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('active');
      card.setAttribute('aria-checked', 'true');
      const theme = card.dataset.theme;
      if (theme === 'modern') {
        document.documentElement.removeAttribute('data-pardis-theme');
        document.body.className = 'theme-modern';
      } else if (theme === 'glass') {
        document.documentElement.setAttribute('data-pardis-theme', 'glass');
        document.body.className = 'theme-glass';
      } else {
        document.documentElement.setAttribute('data-pardis-theme', 'classic');
        document.body.className = 'theme-classic';
      }
      const pageSwitcher = document.getElementById('themeSwitcher');
      if (pageSwitcher) {
        pageSwitcher.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        const match = pageSwitcher.querySelector(`[data-theme="${theme}"]`);
        if (match) match.classList.add('active');
      }
      logEvent('api', `Theme: ${theme}`);
    });
  });

  // ── API Action Buttons ──
  document.getElementById('pgBtnOpen').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.open();
    logEvent('api', 'open()');
  });

  document.getElementById('pgBtnClose').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.close();
    logEvent('api', 'close()');
  });

  document.getElementById('pgBtnGetValue').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    const val = pgInstance.getValue();
    const json = JSON.stringify(val, (k,v) => v instanceof Date ? v.toISOString() : v, 2);
    showToast(json || 'null');
    logEvent('api', 'getValue()', val);
  });

  document.getElementById('pgBtnSetValue').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    const y = parseInt(svY.value);
    const m = parseInt(svM.value);
    const d = parseInt(svD.value);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return showToast('Enter valid jy, jm, jd');
    pgInstance.setValue(y, m, d);
    logEvent('api', `setValue(${y}, ${m}, ${d})`);
  });

  document.getElementById('pgBtnClear').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.clear();
    logEvent('api', 'clear()');
  });

  document.getElementById('pgBtnDestroy').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.destroy();
    pgInstance = null;
    previewBox.innerHTML = '<div class="pg-preview-placeholder"><span class="pg-placeholder-icon">\uD83D\uDCA5</span>Instance destroyed</div>';
    previewBox.classList.remove('active');
    logEvent('api', 'destroy()');
  });

  // Engine buttons
  document.getElementById('pgBtnToday').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.engine.goToToday();
    logEvent('api', 'engine.goToToday()');
  });

  document.getElementById('pgBtnNextMonth').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.engine.goToNextMonth();
  });

  document.getElementById('pgBtnPrevMonth').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.engine.goToPrevMonth();
  });

  document.getElementById('pgBtnNextYear').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.engine.goToNextYear();
  });

  document.getElementById('pgBtnPrevYear').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.engine.goToPrevYear();
  });

  document.getElementById('pgBtnViewDay').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.engine.setViewMode('day');
  });

  document.getElementById('pgBtnViewMonth').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.engine.setViewMode('month');
  });

  document.getElementById('pgBtnViewYear').addEventListener('click', () => {
    if (!pgInstance) return showToast('Instance not created');
    pgInstance.engine.setViewMode('year');
  });

  // ── Static Helpers ──
  document.getElementById('pgHlpBuildRun').addEventListener('click', () => {
    try {
      const y = parseInt(hlpBuildY.value);
      const m = parseInt(hlpBuildM.value);
      const d = parseInt(hlpBuildD.value);
      const fmt = hlpBuildFmt.value;
      if (isNaN(y) || isNaN(m) || isNaN(d)) throw new Error('Enter valid jy, jm, jd');
      const result = PardisEngine.buildDatePayload(y, m, d, fmt);
      const json = JSON.stringify(result, (k,v) => v instanceof Date ? v.toISOString() : v, 2);
      hlpBuildRes.textContent = json;
      hlpBuildRes.classList.add('visible');
      logEvent('helper', `buildDatePayload(${y}, ${m}, ${d}, '${fmt}')`, result);
    } catch(e) {
      hlpBuildRes.textContent = 'Error: ' + e.message;
      hlpBuildRes.classList.add('visible');
    }
  });

  document.getElementById('pgHlpFmtRun').addEventListener('click', () => {
    try {
      const y = parseInt(hlpFmtY.value);
      const m = parseInt(hlpFmtM.value);
      const d = parseInt(hlpFmtD.value);
      if (isNaN(y) || isNaN(m) || isNaN(d)) throw new Error('Enter valid jy, jm, jd');
      const result = PardisEngine.formatPersian(y, m, d);
      hlpFmtRes.textContent = result;
      hlpFmtRes.classList.add('visible');
      logEvent('helper', `formatPersian(${y}, ${m}, ${d}) \u2192 ${result}`);
    } catch(e) {
      hlpFmtRes.textContent = 'Error: ' + e.message;
      hlpFmtRes.classList.add('visible');
    }
  });

  document.getElementById('pgHlpNumRun').addEventListener('click', () => {
    const val = hlpNumIn.value;
    const result = PardisEngine.toPersianNum(val);
    hlpNumRes.textContent = result;
    hlpNumRes.classList.add('visible');
    logEvent('helper', `toPersianNum('${val}') \u2192 ${result}`);
  });

  document.getElementById('pgHlpFromRun').addEventListener('click', () => {
    const val = hlpFromIn.value;
    const result = PardisEngine.fromPersianNum(val);
    hlpFromRes.textContent = result;
    hlpFromRes.classList.add('visible');
    logEvent('helper', `fromPersianNum('${val}') \u2192 ${result}`);
  });

  // ── Init ──
  const today = JalaaliUtil.todayJalaali();
  ctrlYear.value = today.jy;
  ctrlMonth.value = today.jm;

  hlpBuildY.value = today.jy;
  hlpBuildM.value = today.jm;
  hlpBuildD.value = today.jd;
  hlpFmtY.value = today.jy;
  hlpFmtM.value = today.jm;
  hlpFmtD.value = today.jd;
  hlpNumIn.value = '1404';
  hlpFromIn.value = '\u06F1\u06F4\u06F0\u06F4';

  recreate();
})();
