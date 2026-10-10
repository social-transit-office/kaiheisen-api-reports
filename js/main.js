(function() {
  var saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  document.addEventListener('DOMContentLoaded', function() {
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        btn.textContent = next === 'light' ? '🌙 Dark' : '☀️ Light';
      });
    }

    document.querySelectorAll('th[data-sort]').forEach(function(th) {
      th.addEventListener('click', function() {
        var table = th.closest('table');
        var tbody = table.querySelector('tbody');
        var rows = Array.from(tbody.querySelectorAll('tr'));
        var idx = Array.from(th.parentNode.children).indexOf(th);
        var type = th.getAttribute('data-sort');
        var asc = th.classList.toggle('sort-asc');
        th.parentNode.querySelectorAll('th').forEach(function(h) { if (h !== th) h.classList.remove('sort-asc', 'sort-desc'); });
        if (!asc) th.classList.add('sort-desc');
        rows.sort(function(a, b) {
          var va = a.children[idx].textContent.trim();
          var vb = b.children[idx].textContent.trim();
          if (type === 'num') { va = parseFloat(va) || 0; vb = parseFloat(vb) || 0; }
          if (va < vb) return asc ? -1 : 1;
          if (va > vb) return asc ? 1 : -1;
          return 0;
        });
        rows.forEach(function(r) { tbody.appendChild(r); });
      });
    });

    initCharts();
  });

  function initCharts() {
    var progressCanvas = document.getElementById('progress-chart');
    var coverageCanvas = document.getElementById('coverage-chart');
    if (!progressCanvas && !coverageCanvas) return;

    fetch('./data/progress-history.json')
      .then(function(r) { return r.ok ? r.json() : []; })
      .then(function(data) { renderCharts(data, progressCanvas, coverageCanvas); })
      .catch(function() { showPlaceholder(progressCanvas); showPlaceholder(coverageCanvas); });
  }

  function showPlaceholder(canvas) {
    if (!canvas) return;
    var p = canvas.parentElement.querySelector('.chart-placeholder');
    if (p) p.style.display = 'block';
    canvas.style.display = 'none';
  }

  function renderCharts(data, progressCanvas, coverageCanvas) {
    if (!data || data.length === 0) {
      showPlaceholder(progressCanvas);
      showPlaceholder(coverageCanvas);
      return;
    }

    var labels = data.map(function(d) { return d.date; });
    var style = getComputedStyle(document.documentElement);
    var fg = style.getPropertyValue('--fg-secondary').trim() || '#8b949e';
    var gridColor = 'rgba(255,255,255,0.06)';

    if (progressCanvas && typeof Chart !== 'undefined') {
      new Chart(progressCanvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            { label: 'BFF', data: data.map(function(d) { return (d.layers.BFF || {}).coded || 0; }),
              borderColor: '#f0883e', backgroundColor: 'rgba(240,136,62,0.1)', fill: true, tension: 0.3 },
            { label: 'MA', data: data.map(function(d) { return (d.layers.MA || {}).coded || 0; }),
              borderColor: '#bc8cff', backgroundColor: 'rgba(188,140,255,0.1)', fill: true, tension: 0.3 },
            { label: 'SV', data: data.map(function(d) { return (d.layers.SV || {}).coded || 0; }),
              borderColor: '#3fb950', backgroundColor: 'rgba(63,185,80,0.1)', fill: true, tension: 0.3 },
            { label: 'DA', data: data.map(function(d) { return (d.layers.DA || {}).coded || 0; }),
              borderColor: '#58a6ff', backgroundColor: 'rgba(88,166,255,0.1)', fill: true, tension: 0.3 }
          ]
        },
        options: {
          responsive: true, plugins: { legend: { labels: { color: fg } } },
          scales: {
            x: { ticks: { color: fg }, grid: { color: gridColor } },
            y: { ticks: { color: fg }, grid: { color: gridColor }, beginAtZero: true }
          }
        }
      });
    }

    if (coverageCanvas && typeof Chart !== 'undefined') {
      new Chart(coverageCanvas, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            { label: '行カバレッジ', data: data.map(function(d) { return (d.summary || {}).line_coverage || 0; }),
              borderColor: '#79c0ff', borderWidth: 2, tension: 0.3, fill: false },
            { label: '分岐カバレッジ', data: data.map(function(d) { return (d.summary || {}).branch_coverage || 0; }),
              borderColor: '#79c0ff', borderDash: [5, 5], borderWidth: 2, tension: 0.3, fill: false }
          ]
        },
        options: {
          responsive: true, plugins: { legend: { labels: { color: fg } } },
          scales: {
            x: { ticks: { color: fg }, grid: { color: gridColor } },
            y: { ticks: { color: fg }, grid: { color: gridColor }, beginAtZero: true, max: 100 }
          }
        }
      });
    }
  }
})();
