// app.js — lógica da simulação e UI
(function(){
  // helpers
  const $ = id => document.getElementById(id);
  const format = v => Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2, maximumFractionDigits:2});

  // HTML elements
  const form = $('simForm');
  const initialEl = $('initial');
  const monthlyEl = $('monthly');
  const annualRateEl = $('annualRate');
  const yearsEl = $('years');
  const compoundsEl = $('compoundsPerYear');
  const errorEl = $('error');
  const summaryEl = $('summary');
  const tableBody = document.querySelector('#resultsTable tbody');
  const exportBtn = $('exportBtn');

  let chart = null;

  // simulate: returns array of yearly summary
  // monthly contributions are added at end of each month
  function simulate(initial, monthly, annualRate, years, compoundsPerYear){
    // We'll compute month-by-month for accuracy (even if compoundsPerYear != 12)
    const months = years * 12;
    const monthlyRate = annualRate / 100 / 12;
    let balance = initial;
    let yearly = [];
    let contributionsThisYear = 0;
    let interestThisYear = 0;

    for(let m=1; m<=months; m++){
      // interest for this month
      const interest = balance * monthlyRate;
      balance += interest;
      interestThisYear += interest;

      // monthly contribution at end of month:
      balance += monthly;
      contributionsThisYear += monthly;

      // if end of year, record
      if(m % 12 === 0){
        const yearIndex = m / 12;
        yearly.push({
          year: yearIndex,
          aporteAno: contributionsThisYear,
          jurosAno: interestThisYear,
          saldo: balance
        });
        // reset per-year trackers
        contributionsThisYear = 0;
        interestThisYear = 0;
      }
    }
    return yearly;
  }

  function renderSummary(data, initial, monthly, annualRate){
    const totalYears = data.length;
    const last = data[data.length-1];
    summaryEl.innerHTML = '';
    const totalInvested = (initial + monthly * totalYears * 12);
    const totalInterest = last.saldo - totalInvested;

    const items = [
      {label: 'Saldo final', value: `R$ ${format(last.saldo)}`},
      {label: 'Total investido', value: `R$ ${format(totalInvested)}`},
      {label: 'Ganho (juros)', value: `R$ ${format(totalInterest)}`},
      {label: 'Taxa anual', value: `${annualRate}%`},
      {label: 'Período', value: `${totalYears} anos`}
    ];

    items.forEach(it => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<strong>${it.value}</strong><div style="color:var(--muted);margin-top:6px">${it.label}</div>`;
      summaryEl.appendChild(card);
    });
  }

  function renderTable(data){
    tableBody.innerHTML = '';
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.year}</td>
                      <td>R$ ${format(row.aporteAno)}</td>
                      <td>R$ ${format(row.jurosAno)}</td>
                      <td>R$ ${format(row.saldo)}</td>`;
      tableBody.appendChild(tr);
    });
  }

  function renderChart(data){
    const ctx = document.getElementById('balanceChart');
    const labels = data.map(d => `Ano ${d.year}`);
    const values = data.map(d => Number(d.saldo.toFixed(2)));

    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Saldo (R$)',
          data: values,
          tension: 0.25,
          fill: true,
          yAxisID: 'y'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {display:false},
          tooltip: {mode: 'index', intersect: false}
        },
        scales: {
          y: {
            ticks: {
              callback: val => Number(val).toLocaleString('pt-BR', {maximumFractionDigits:0})
            }
          }
        }
      }
    });
  }

  function showError(msg){
    errorEl.hidden = false;
    errorEl.textContent = msg;
  }

  function clearError(){
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  // exports CSV
  function toCSV(data, meta){
    const headers = ['ano','aporte_ano','juros_ano','saldo_final'];
    const lines = [headers.join(',')];
    data.forEach(r => {
      lines.push([r.year, r.aporteAno.toFixed(2), r.jurosAno.toFixed(2), r.saldo.toFixed(2)].join(','));
    });
    // prepend meta as comments
    const metaLines = [
      `# Simulação: investimento_inicial=${meta.initial},aporte_mensal=${meta.monthly},taxa_anual=${meta.annualRate},anos=${meta.years}`,
      ''
    ];
    return metaLines.concat(lines).join('\n');
  }

  // handlers
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    clearError();

    const initial = parseFloat(initialEl.value);
    const monthly = parseFloat(monthlyEl.value);
    const annualRate = parseFloat(annualRateEl.value);
    const years = parseInt(yearsEl.value, 10);
    const compoundsPerYear = parseInt(compoundsEl.value, 10);

    if(Number.isNaN(initial) || Number.isNaN(monthly) || Number.isNaN(annualRate) || Number.isNaN(years) || initial < 0 || monthly < 0 || annualRate < 0 || years < 1){
      showError('Verifique os valores — todos devem ser números positivos e anos >= 1.');
      return;
    }

    // run simulation
    const data = simulate(initial, monthly, annualRate, years, compoundsPerYear);
    renderSummary(data, initial, monthly, annualRate);
    renderTable(data);
    renderChart(data);

    // attach last data for export
    exportBtn.dataset.csv = toCSV(data, {initial, monthly, annualRate, years});
  });

  exportBtn.addEventListener('click', () => {
    const csv = exportBtn.dataset.csv;
    if(!csv){
      showError('Execute a simulação antes de exportar.');
      return;
    }
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'simulacao_investimentos.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  // run default at load
  window.addEventListener('load', () => {
    form.dispatchEvent(new Event('submit'));
  });
})();
