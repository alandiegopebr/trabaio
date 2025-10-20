// app.js - WealthFlow - Simulador de Investimentos Profissional
(function(){
  'use strict';

  // ===== CONSTANTES E CONFIGURAÇÕES =====
  const CONFIG = {
    STORAGE_KEYS: {
      USERS: 'wealthflow_users',
      CURRENT_USER: 'wealthflow_current_user',
      SIMULATIONS: 'wealthflow_simulations',
      PREFERENCES: 'wealthflow_preferences'
    },
    DEFAULTS: {
      INITIAL: 10000,
      MONTHLY: 500,
      RATE: 8,
      YEARS: 20,
      COMPOUNDS: 12
    },
    THEMES: {
      LIGHT: 'light',
      DARK: 'dark'
    }
  };

  // ===== SELEÇÃO DE ELEMENTOS =====
  const elements = {
    // Loading
    loadingScreen: document.getElementById('loadingScreen'),
    
    // Navegação
    navLinks: document.querySelectorAll('.nav-link'),
    authButtons: document.getElementById('authButtons'),
    userMenu: document.getElementById('userMenu'),
    userName: document.getElementById('userName'),
    userAvatar: document.getElementById('userAvatar'),
    themeToggle: document.getElementById('themeToggle'),
    mobileToggle: document.getElementById('mobileToggle'),
    
    // Modais
    loginModal: document.getElementById('loginModal'),
    registerModal: document.getElementById('registerModal'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    loginError: document.getElementById('loginError'),
    registerError: document.getElementById('registerError'),
    
    // Formulário principal
    simForm: document.getElementById('simForm'),
    initial: document.getElementById('initial'),
    monthly: document.getElementById('monthly'),
    annualRate: document.getElementById('annualRate'),
    years: document.getElementById('years'),
    compoundsPerYear: document.getElementById('compoundsPerYear'),
    
    // Sliders
    initialRange: document.getElementById('initialRange'),
    monthlyRange: document.getElementById('monthlyRange'),
    annualRateRange: document.getElementById('annualRateRange'),
    yearsRange: document.getElementById('yearsRange'),
    
    // Botões de ação
    saveBtn: document.getElementById('saveBtn'),
    resetBtn: document.getElementById('resetBtn'),
    exportBtn: document.getElementById('exportBtn'),
    logoutBtn: document.getElementById('logoutBtn'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    
    // Resultados
    summary: document.getElementById('summary'),
    tableBody: document.getElementById('tableBody'),
    error: document.getElementById('error'),
    
    // Seções
    sections: document.querySelectorAll('.content-section'),
    
    // Histórico
    savedSimulations: document.getElementById('savedSimulations'),
    favoritesList: document.getElementById('favoritesList'),
    
    // Perfil
    profileName: document.getElementById('profileName'),
    profileEmail: document.getElementById('profileEmail'),
    profileAvatar: document.getElementById('profileAvatar'),
    simulationsCount: document.getElementById('simulationsCount'),
    favoritesCount: document.getElementById('favoritesCount'),
    profileForm: document.getElementById('profileForm')
  };

  // ===== ESTADO DA APLICAÇÃO =====
  let state = {
    currentUser: null,
    currentSimulation: null,
    chart: null,
    preferences: {
      theme: CONFIG.THEMES.LIGHT,
      autoSave: true
    }
  };

  // ===== INICIALIZAÇÃO =====
  function init() {
    loadPreferences();
    initEventListeners();
    loadUserState();
    syncSliders();
    simulateDefault();
    
    // Esconder loading screen
    setTimeout(() => {
      elements.loadingScreen.style.opacity = '0';
      setTimeout(() => {
        elements.loadingScreen.style.display = 'none';
      }, 500);
    }, 1000);
  }

  // ===== SISTEMA DE PREFERÊNCIAS =====
  function loadPreferences() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.PREFERENCES);
    if (saved) {
      state.preferences = { ...state.preferences, ...JSON.parse(saved) };
    }
    applyPreferences();
  }

  function savePreferences() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.PREFERENCES, JSON.stringify(state.preferences));
  }

  function applyPreferences() {
    // Aplicar tema
    document.documentElement.setAttribute('data-theme', state.preferences.theme);
    elements.themeToggle.innerHTML = state.preferences.theme === CONFIG.THEMES.DARK ? 
      '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }

  // ===== SISTEMA DE AUTENTICAÇÃO =====
  function loadUserState() {
    const userJson = localStorage.getItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
    if (userJson) {
      state.currentUser = JSON.parse(userJson);
      updateUIForUser();
    }
  }

  function getUsers() {
    const usersJson = localStorage.getItem(CONFIG.STORAGE_KEYS.USERS);
    return usersJson ? JSON.parse(usersJson) : [];
  }

  function saveUsers(users) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      state.currentUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || generateAvatar(user.name)
      };
      localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
      updateUIForUser();
      hideModal('loginModal');
      showSuccess('Login realizado com sucesso!');
      return true;
    }
    return false;
  }

  function register(name, email, password) {
    const users = getUsers();
    
    if (users.find(u => u.email === email)) {
      return false;
    }
    
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      avatar: generateAvatar(name),
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveUsers(users);
    
    state.currentUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      avatar: newUser.avatar
    };
    localStorage.setItem(CONFIG.STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
    updateUIForUser();
    hideModal('registerModal');
    showSuccess('Conta criada com sucesso!');
    return true;
  }

  function logout() {
    state.currentUser = null;
    localStorage.removeItem(CONFIG.STORAGE_KEYS.CURRENT_USER);
    updateUIForUser();
    switchSection('mainContent');
    showSuccess('Logout realizado com sucesso!');
  }

  function generateAvatar(name) {
    const colors = ['#2563eb', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
    
    return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}"/><text x="50" y="50" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">${initials}</text></svg>`;
  }

  // ===== INTERFACE DO USUÁRIO =====
  function updateUIForUser() {
    if (state.currentUser) {
      elements.authButtons.style.display = 'none';
      elements.userMenu.style.display = 'block';
      elements.userName.textContent = state.currentUser.name;
      elements.userAvatar.src = state.currentUser.avatar;
      elements.saveBtn.style.display = 'flex';
      
      // Atualizar navegação
      document.getElementById('historyNav').style.display = 'flex';
      
      // Atualizar perfil
      updateProfileUI();
    } else {
      elements.authButtons.style.display = 'flex';
      elements.userMenu.style.display = 'none';
      elements.saveBtn.style.display = 'none';
      document.getElementById('historyNav').style.display = 'none';
    }
  }

  function updateProfileUI() {
    if (!state.currentUser) return;
    
    elements.profileName.textContent = state.currentUser.name;
    elements.profileEmail.textContent = state.currentUser.email;
    elements.profileAvatar.src = state.currentUser.avatar;
    
    // Atualizar contadores
    const simulations = getUserSimulations();
    const favorites = simulations.filter(s => s.favorite);
    
    elements.simulationsCount.textContent = simulations.length;
    elements.favoritesCount.textContent = favorites.length;
  }

  function switchSection(sectionId) {
    elements.sections.forEach(section => {
      section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.add('active');
    }
    
    // Atualizar navegação
    elements.navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-section') === sectionId) {
        link.classList.add('active');
      }
    });

    // Carregar dados específicos da seção
    if (sectionId === 'historySection' || sectionId === 'favoritesSection') {
      loadSimulations();
    }
  }

  // ===== SISTEMA DE MODAIS =====
  function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
    }
  }

  function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.hidden = true;
      document.body.style.overflow = '';
    }
    clearErrors();
  }

  function clearErrors() {
    if (elements.loginError) elements.loginError.hidden = true;
    if (elements.registerError) elements.registerError.hidden = true;
    if (elements.error) elements.error.hidden = true;
  }

  // ===== SISTEMA DE SIMULAÇÕES =====
  function simulate(initial, monthly, annualRate, years, compoundsPerYear) {
    const months = years * 12;
    const monthlyRate = annualRate / 100 / 12;
    let balance = initial;
    let yearly = [];
    let totalInvested = initial;
    let totalInterest = 0;

    for (let m = 1; m <= months; m++) {
      const interest = balance * monthlyRate;
      balance += interest;
      totalInterest += interest;

      // Adicionar aporte mensal
      balance += monthly;
      totalInvested += monthly;

      // Fim do ano
      if (m % 12 === 0) {
        const yearIndex = m / 12;
        yearly.push({
          year: yearIndex,
          totalInvested: totalInvested,
          interest: totalInterest,
          balance: balance,
          roi: ((balance - totalInvested) / totalInvested) * 100
        });
        
        // Resetar juros anuais
        totalInterest = 0;
      }
    }

    return yearly;
  }

  function simulateDefault() {
    if (elements.initial && elements.monthly && elements.annualRate && elements.years && elements.compoundsPerYear) {
      elements.initial.value = CONFIG.DEFAULTS.INITIAL;
      elements.monthly.value = CONFIG.DEFAULTS.MONTHLY;
      elements.annualRate.value = CONFIG.DEFAULTS.RATE;
      elements.years.value = CONFIG.DEFAULTS.YEARS;
      elements.compoundsPerYear.value = CONFIG.DEFAULTS.COMPOUNDS;
      
      syncSliders();
      runSimulation();
    }
  }

  function runSimulation() {
    clearErrors();

    const initial = parseFloat(elements.initial.value);
    const monthly = parseFloat(elements.monthly.value);
    const annualRate = parseFloat(elements.annualRate.value);
    const years = parseInt(elements.years.value, 10);
    const compoundsPerYear = parseInt(elements.compoundsPerYear.value, 10);

    if (!validateInputs(initial, monthly, annualRate, years)) {
      return;
    }

    const data = simulate(initial, monthly, annualRate, years, compoundsPerYear);
    renderSummary(data, initial, monthly, annualRate, years);
    renderTable(data);
    renderChart(data);

    state.currentSimulation = {
      initial,
      monthly,
      annualRate,
      years,
      compoundsPerYear,
      data,
      timestamp: new Date().toISOString()
    };

    // Salvar automaticamente se preferido
    if (state.currentUser && state.preferences.autoSave) {
      setTimeout(() => saveSimulation(), 1000);
    }
  }

  function validateInputs(initial, monthly, rate, years) {
    if (isNaN(initial) || initial < 0) {
      showError('Investimento inicial deve ser um número positivo.');
      return false;
    }
    if (isNaN(monthly) || monthly < 0) {
      showError('Aporte mensal deve ser um número positivo.');
      return false;
    }
    if (isNaN(rate) || rate < 0) {
      showError('Taxa de juros deve ser um número positivo.');
      return false;
    }
    if (isNaN(years) || years < 1 || years > 50) {
      showError('Período deve ser entre 1 e 50 anos.');
      return false;
    }
    return true;
  }

  // ===== RENDERIZAÇÃO DE RESULTADOS =====
  function renderSummary(data, initial, monthly, annualRate, years) {
    if (!data.length || !elements.summary) return;

    const last = data[data.length - 1];
    const totalInvested = last.totalInvested;
    const totalInterest = last.balance - totalInvested;
    const totalROI = (totalInterest / totalInvested) * 100;

    elements.summary.innerHTML = `
      <div class="summary-card">
        <h3>Saldo Final</h3>
        <div class="value">R$ ${formatCurrency(last.balance)}</div>
      </div>
      <div class="summary-card">
        <h3>Total Investido</h3>
        <div class="value">R$ ${formatCurrency(totalInvested)}</div>
      </div>
      <div class="summary-card">
        <h3>Juros Acumulados</h3>
        <div class="value">R$ ${formatCurrency(totalInterest)}</div>
      </div>
      <div class="summary-card">
        <h3>Rentabilidade Total</h3>
        <div class="value">${formatPercentage(totalROI)}</div>
      </div>
    `;
  }

  function renderTable(data) {
    if (!elements.tableBody) return;
    
    elements.tableBody.innerHTML = '';
    
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.year}</td>
        <td>R$ ${formatCurrency(row.totalInvested)}</td>
        <td>R$ ${formatCurrency(row.interest)}</td>
        <td>R$ ${formatCurrency(row.balance)}</td>
        <td>${formatPercentage(row.roi)}</td>
      `;
      elements.tableBody.appendChild(tr);
    });
  }

  function renderChart(data) {
    const ctx = document.getElementById('balanceChart');
    if (!ctx) return;

    const labels = data.map(d => `Ano ${d.year}`);
    const balances = data.map(d => d.balance);
    const invested = data.map(d => d.totalInvested);

    if (state.chart) {
      state.chart.destroy();
    }

    state.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Saldo Total',
            data: balances,
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Total Investido',
            data: invested,
            borderColor: '#10b981',
            borderDash: [5, 5],
            tension: 0.4,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += 'R$ ' + formatCurrency(context.parsed.y);
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R$ ' + formatCurrency(value);
              }
            }
          }
        }
      }
    });
  }

  // ===== SISTEMA DE SLIDERS =====
  function syncSliders() {
    // Sincronizar inputs com sliders
    const syncPairs = [
      { input: elements.initial, slider: elements.initialRange },
      { input: elements.monthly, slider: elements.monthlyRange },
      { input: elements.annualRate, slider: elements.annualRateRange },
      { input: elements.years, slider: elements.yearsRange }
    ];

    syncPairs.forEach(pair => {
      if (!pair.input || !pair.slider) return;

      pair.input.addEventListener('input', () => {
        pair.slider.value = pair.input.value;
      });

      pair.slider.addEventListener('input', () => {
        pair.input.value = pair.slider.value;
      });

      // Sincronizar valores iniciais
      pair.slider.value = pair.input.value;
    });
  }

  // ===== SISTEMA DE SALVAMENTO =====
  function getUserSimulations() {
    const simulationsJson = localStorage.getItem(CONFIG.STORAGE_KEYS.SIMULATIONS);
    const allSimulations = simulationsJson ? JSON.parse(simulationsJson) : [];
    return allSimulations.filter(s => s.userId === state.currentUser?.id);
  }

  function saveUserSimulations(simulations) {
    const allSimulationsJson = localStorage.getItem(CONFIG.STORAGE_KEYS.SIMULATIONS);
    const allSimulations = allSimulationsJson ? JSON.parse(allSimulationsJson) : [];
    
    // Remover simulações antigas do usuário
    const filtered = allSimulations.filter(s => s.userId !== state.currentUser.id);
    const updated = [...filtered, ...simulations];
    
    localStorage.setItem(CONFIG.STORAGE_KEYS.SIMULATIONS, JSON.stringify(updated));
  }

  function saveSimulation() {
    if (!state.currentUser || !state.currentSimulation) {
      showError('Nenhuma simulação para salvar.');
      return;
    }

    const simulations = getUserSimulations();
    const newSimulation = {
      id: Date.now().toString(),
      userId: state.currentUser.id,
      ...state.currentSimulation,
      favorite: false,
      name: `Simulação ${new Date().toLocaleDateString('pt-BR')}`
    };

    simulations.push(newSimulation);
    saveUserSimulations(simulations);
    
    showSuccess('Simulação salva com sucesso!');
    updateProfileUI();
  }

  function loadSimulations() {
    if (!state.currentUser) return;
    
    const simulations = getUserSimulations();
    renderSimulations(simulations, elements.savedSimulations);
    
    const favorites = simulations.filter(s => s.favorite);
    renderSimulations(favorites, elements.favoritesList, true);
  }

  function renderSimulations(simulations, container, isFavorites = false) {
    if (!container) return;

    if (simulations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-inbox"></i>
          <h3>Nenhuma simulação ${isFavorites ? 'favoritada' : 'salva'}</h3>
          <p>${isFavorites ? 'Marque simulações como favoritas para vê-las aqui.' : 'Execute e salve simulações para vê-las aqui.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = simulations.map(sim => `
      <div class="simulation-card ${sim.favorite ? 'favorite' : ''}" data-id="${sim.id}">
        <div class="simulation-header">
          <div>
            <div class="simulation-title">${sim.name}</div>
            <div class="simulation-date">${new Date(sim.timestamp).toLocaleDateString('pt-BR')}</div>
          </div>
          <div class="simulation-actions">
            <button class="btn-icon favorite-btn" title="${sim.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
              <i class="fas fa-star ${sim.favorite ? 'active' : ''}"></i>
            </button>
            <button class="btn-icon load-btn" title="Carregar simulação">
              <i class="fas fa-play"></i>
            </button>
            <button class="btn-icon delete-btn" title="Excluir simulação">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="simulation-stats">
          <div class="stat">
            <div class="stat-value">R$ ${formatCurrency(sim.initial)}</div>
            <div class="stat-label">Inicial</div>
          </div>
          <div class="stat">
            <div class="stat-value">R$ ${formatCurrency(sim.monthly)}</div>
            <div class="stat-label">Mensal</div>
          </div>
          <div class="stat">
            <div class="stat-value">${sim.annualRate}%</div>
            <div class="stat-label">Taxa</div>
          </div>
          <div class="stat">
            <div class="stat-value">${sim.years}a</div>
            <div class="stat-label">Período</div>
          </div>
        </div>
        
        <div class="simulation-footer">
          <div class="final-balance">
            <strong>R$ ${formatCurrency(sim.data[sim.data.length - 1].balance)}</strong>
          </div>
          <button class="btn-outline export-single-btn">
            <i class="fas fa-download"></i>
            Exportar
          </button>
        </div>
      </div>
    `).join('');

    // Adicionar event listeners
    container.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.simulation-card');
        toggleFavorite(card.dataset.id);
      });
    });

    container.querySelectorAll('.load-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.simulation-card');
        loadSavedSimulation(card.dataset.id);
      });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.simulation-card');
        deleteSimulation(card.dataset.id);
      });
    });

    container.querySelectorAll('.export-single-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const card = e.target.closest('.simulation-card');
        exportSingleSimulation(card.dataset.id);
      });
    });
  }

  function toggleFavorite(simId) {
    const simulations = getUserSimulations();
    const simulation = simulations.find(s => s.id === simId);
    
    if (simulation) {
      simulation.favorite = !simulation.favorite;
      saveUserSimulations(simulations);
      loadSimulations();
      updateProfileUI();
    }
  }

  function loadSavedSimulation(simId) {
    const simulations = getUserSimulations();
    const simulation = simulations.find(s => s.id === simId);
    
    if (simulation) {
      elements.initial.value = simulation.initial;
      elements.monthly.value = simulation.monthly;
      elements.annualRate.value = simulation.annualRate;
      elements.years.value = simulation.years;
      elements.compoundsPerYear.value = simulation.compoundsPerYear;
      
      syncSliders();
      runSimulation();
      switchSection('mainContent');
      
      showSuccess('Simulação carregada com sucesso!');
    }
  }

  function deleteSimulation(simId) {
    if (!confirm('Tem certeza que deseja excluir esta simulação?')) return;
    
    const simulations = getUserSimulations();
    const updated = simulations.filter(s => s.id !== simId);
    saveUserSimulations(updated);
    loadSimulations();
    updateProfileUI();
    
    showSuccess('Simulação excluída com sucesso!');
  }

  // ===== SISTEMA DE EXPORTAÇÃO =====
  function exportToCSV() {
    if (!state.currentSimulation) {
      showError('Execute uma simulação antes de exportar.');
      return;
    }

    const { data, initial, monthly, annualRate, years } = state.currentSimulation;
    const headers = ['Ano', 'Total Investido (R$)', 'Juros do Ano (R$)', 'Saldo Final (R$)', 'Rentabilidade (%)'];
    const lines = [headers.join(',')];
    
    data.forEach(row => {
      lines.push([
        row.year,
        row.totalInvested.toFixed(2),
        row.interest.toFixed(2),
        row.balance.toFixed(2),
        row.roi.toFixed(2)
      ].join(','));
    });

    const meta = [
      `# WealthFlow - Simulação de Investimentos`,
      `# Data: ${new Date().toLocaleDateString('pt-BR')}`,
      `# Investimento Inicial: R$ ${formatCurrency(initial)}`,
      `# Aporte Mensal: R$ ${formatCurrency(monthly)}`,
      `# Taxa Anual: ${annualRate}%`,
      `# Período: ${years} anos`,
      `# Saldo Final: R$ ${formatCurrency(data[data.length - 1].balance)}`,
      ''
    ];

    const csv = meta.join('\n') + lines.join('\n');
    downloadFile(csv, 'wealthflow-simulacao.csv', 'text/csv');
  }

  function exportSingleSimulation(simId) {
    const simulations = getUserSimulations();
    const simulation = simulations.find(s => s.id === simId);
    
    if (!simulation) return;
    
    const { data, initial, monthly, annualRate, years, name } = simulation;
    const headers = ['Ano', 'Total Investido (R$)', 'Juros do Ano (R$)', 'Saldo Final (R$)', 'Rentabilidade (%)'];
    const lines = [headers.join(',')];
    
    data.forEach(row => {
      lines.push([
        row.year,
        row.totalInvested.toFixed(2),
        row.interest.toFixed(2),
        row.balance.toFixed(2),
        row.roi.toFixed(2)
      ].join(','));
    });

    const meta = [
      `# WealthFlow - Simulação de Investimentos`,
      `# Nome: ${name}`,
      `# Data: ${new Date(simulation.timestamp).toLocaleDateString('pt-BR')}`,
      `# Investimento Inicial: R$ ${formatCurrency(initial)}`,
      `# Aporte Mensal: R$ ${formatCurrency(monthly)}`,
      `# Taxa Anual: ${annualRate}%`,
      `# Período: ${years} anos`,
      `# Saldo Final: R$ ${formatCurrency(data[data.length - 1].balance)}`,
      ''
    ];

    const csv = meta.join('\n') + lines.join('\n');
    downloadFile(csv, `wealthflow-${name.toLowerCase().replace(/\s+/g, '-')}.csv`, 'text/csv');
  }

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ===== UTILITÁRIOS =====
  function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  function formatPercentage(value) {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value) + '%';
  }

  function showError(message) {
    if (elements.error) {
      elements.error.textContent = message;
      elements.error.hidden = false;
      elements.error.className = 'error-message';
    }
  }

  function showSuccess(message) {
    // Criar notificação toast
    const toast = document.createElement('div');
    toast.className = 'toast success';
    toast.innerHTML = `
      <i class="fas fa-check-circle"></i>
      <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // ===== EVENT LISTENERS =====
  function initEventListeners() {
    // Navegação
    elements.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('data-section');
        switchSection(sectionId);
      });
    });

    // Autenticação
    if (elements.loginBtn) {
      elements.loginBtn.addEventListener('click', () => showModal('loginModal'));
    }
    
    if (elements.registerBtn) {
      elements.registerBtn.addEventListener('click', () => showModal('registerModal'));
    }
    
    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener('click', logout);
    }

    // Modais
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.target.closest('.modal-close').getAttribute('data-modal');
        hideModal(modalId);
      });
    });

    document.querySelectorAll('.text-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const fromModal = e.target.getAttribute('data-from');
        const toModal = e.target.getAttribute('data-to');
        hideModal(fromModal);
        showModal(toModal);
      });
    });

    // Fechar modal ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.hidden = true;
          document.body.style.overflow = '';
        }
      });
    });

    // Formulários de autenticação
    if (elements.loginForm) {
      elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!login(email, password)) {
          if (elements.loginError) {
            elements.loginError.textContent = 'Email ou senha incorretos.';
            elements.loginError.hidden = false;
          }
        }
      });
    }

    if (elements.registerForm) {
      elements.registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        
        if (password !== confirmPassword) {
          if (elements.registerError) {
            elements.registerError.textContent = 'As senhas não coincidem.';
            elements.registerError.hidden = false;
          }
          return;
        }
        
        if (!register(name, email, password)) {
          if (elements.registerError) {
            elements.registerError.textContent = 'Este email já está em uso.';
            elements.registerError.hidden = false;
          }
        }
      });
    }

    // Simulação principal
    if (elements.simForm) {
      elements.simForm.addEventListener('submit', (e) => {
        e.preventDefault();
        runSimulation();
      });
    }

    // Botões de ação
    if (elements.saveBtn) {
      elements.saveBtn.addEventListener('click', saveSimulation);
    }
    
    if (elements.resetBtn) {
      elements.resetBtn.addEventListener('click', simulateDefault);
    }
    
    if (elements.exportBtn) {
      elements.exportBtn.addEventListener('click', exportToCSV);
    }

    // Tema
    if (elements.themeToggle) {
      elements.themeToggle.addEventListener('click', () => {
        state.preferences.theme = state.preferences.theme === CONFIG.THEMES.LIGHT ? 
          CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT;
        applyPreferences();
        savePreferences();
      });
    }

    // Mobile menu
    if (elements.mobileToggle) {
      elements.mobileToggle.addEventListener('click', () => {
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
          navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
        }
      });
    }
  }

  // ===== INICIALIZAÇÃO =====
  window.addEventListener('load', init);
})();