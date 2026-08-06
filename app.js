/**
 * JGH Retailer Scan Intelligence & Executive Dashboard Logic
 * 100% Fully Dynamic Filtering across all Charts, KPIs, Banners, and Tables.
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Global State
  let dashboardData = null;
  let allScans = [];
  let filteredScans = [];
  let currentPage = 1;
  const rowsPerPage = 25;

  // Chart instances
  let charts = {
    dailyTrend: null,
    stateAnalysis: null,
    category: null,
    dow: null,
    retailerTier: null,
    uomMix: null
  };

  // DOM Elements
  const elThemeToggle = document.getElementById('btnThemeToggle');
  const elThemeIcon = document.getElementById('themeIcon');
  const elFilterStartDate = document.getElementById('filterStartDate');
  const elFilterEndDate = document.getElementById('filterEndDate');
  const elFilterState = document.getElementById('filterState');
  const elFilterCat = document.getElementById('filterCategory');
  const elFilterUOM = document.getElementById('filterUOM');
  const elSearch = document.getElementById('searchQuery');
  const elBtnClearSearch = document.getElementById('btnClearSearch');
  const elBtnReset = document.getElementById('btnResetFilters');
  const elBtnExportExcel = document.getElementById('btnExportExcel');
  const elBtnExportCSV = document.getElementById('btnExportCSV');
  const elBtnPrint = document.getElementById('btnPrint');

  // Category High/Low Highlights Elements
  const elCatHighName = document.getElementById('catHighName');
  const elCatHighShare = document.getElementById('catHighShare');
  const elCatHighScans = document.getElementById('catHighScans');
  const elCatHighBoxPct = document.getElementById('catHighBoxPct');
  const elCatHighRetailers = document.getElementById('catHighRetailers');
  const elCatLowName = document.getElementById('catLowName');
  const elCatLowShare = document.getElementById('catLowShare');
  const elCatLowScans = document.getElementById('catLowScans');
  const elCatLowBoxPct = document.getElementById('catLowBoxPct');
  const elCatLowRetailers = document.getElementById('catLowRetailers');

  // Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // Load Dashboard Data
  async function loadData() {
    if (window.INLINE_DASHBOARD_DATA) {
      dashboardData = window.INLINE_DASHBOARD_DATA;
    } else {
      try {
        const resp = await fetch('dashboard_data.json?t=' + new Date().getTime());
        if (!resp.ok) throw new Error('Could not load dashboard_data.json');
        dashboardData = await resp.json();
      } catch (err) {
        console.warn('Loading fallback embedded intelligence data...', err);
        dashboardData = getFallbackData();
      }
    }

    allScans = dashboardData.all_scans || dashboardData.detailed_sample || [];
    initFilters();
    applyFilters();
    setupEventListeners();
  }

  // Populate Dropdown Filters
  function initFilters() {
    const states = [...new Set(allScans.map(s => s.State_Name).filter(Boolean))].sort();
    elFilterState.innerHTML = '<option value="ALL">All States (Pan-India)</option>';
    states.forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      elFilterState.appendChild(opt);
    });

    const cats = [...new Set(allScans.map(c => c.Category_Name).filter(Boolean))].sort();
    elFilterCat.innerHTML = '<option value="ALL">All Categories</option>';
    cats.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      elFilterCat.appendChild(opt);
    });
  }

  // Filter & Process Data
  function applyFilters() {
    const selectedState = elFilterState.value;
    const selectedCat = elFilterCat.value;
    const selectedUOM = elFilterUOM.value;
    const startDate = elFilterStartDate ? elFilterStartDate.value : '';
    const endDate = elFilterEndDate ? elFilterEndDate.value : '';
    const searchVal = elSearch.value.trim().toLowerCase();

    // Show/hide clear button
    elBtnClearSearch.style.display = searchVal ? 'block' : 'none';

    // Filter all scans dynamically
    filteredScans = allScans.filter(item => {
      const scanDate = item.scan_date || (item.retailer_scanned_at ? String(item.retailer_scanned_at).slice(0, 10) : '');
      if (startDate && scanDate && scanDate < startDate) return false;
      if (endDate && scanDate && scanDate > endDate) return false;

      const matchState = (selectedState === 'ALL' || item.State_Name === selectedState);
      const matchCat = (selectedCat === 'ALL' || item.Category_Name === selectedCat);
      const matchUOM = (selectedUOM === 'ALL' || item.uom === selectedUOM);
      const matchSearch = !searchVal || (
        (item.retailer_name && item.retailer_name.toLowerCase().includes(searchVal)) ||
        (item.city && item.city.toLowerCase().includes(searchVal)) ||
        (item.mobile_number && item.mobile_number.includes(searchVal)) ||
        (item.pincode && String(item.pincode).includes(searchVal)) ||
        (item.sku_code && item.sku_code.toLowerCase().includes(searchVal)) ||
        (item.status_retailer_id && String(item.status_retailer_id).includes(searchVal)) ||
        (item.retailer_id && String(item.retailer_id).includes(searchVal))
      );
      return matchState && matchCat && matchUOM && matchSearch;
    });

    // Update KPI metrics & Executive insights
    updateKPIs();
    updateExecutiveInsights();

    // Render Charts
    renderCharts();

    // Render Tables
    currentPage = 1;
    renderAllTables();
  }

  // Update KPI Cards
  function updateKPIs() {
    const totalFilteredScans = filteredScans.length;
    const totalFilteredB5 = filteredScans.filter(s => s.uom === 'B5').length;
    const totalFilteredB10 = filteredScans.filter(s => s.uom === 'B10').length;
    const totalCalculatedBoxes = (totalFilteredB5 * 0.5) + (totalFilteredB10 * 1.0);
    const uniqueRetailers = new Set(filteredScans.map(s => s.status_retailer_id || s.retailer_id)).size;
    const uniqueDays = Math.max(1, new Set(filteredScans.map(s => s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : ''))).size);
    const dailyAvg = (totalFilteredScans / uniqueDays).toFixed(1);
    const retAvg = uniqueRetailers > 0 ? (totalFilteredScans / uniqueRetailers).toFixed(1) : '0.0';

    // Top Category in filtered set
    const catCounts = {};
    filteredScans.forEach(s => {
      catCounts[s.Category_Name] = (catCounts[s.Category_Name] || 0) + 1;
    });
    let topCatName = '--';
    let topCatCount = 0;
    Object.entries(catCounts).forEach(([name, count]) => {
      if (count > topCatCount) {
        topCatCount = count;
        topCatName = name;
      }
    });
    const topCatShare = totalFilteredScans > 0 ? ((topCatCount / totalFilteredScans) * 100).toFixed(1) : '0.0';

    // Top State in filtered set
    const stateCounts = {};
    filteredScans.forEach(s => {
      stateCounts[s.State_Name] = (stateCounts[s.State_Name] || 0) + 1;
    });
    let topStateName = '--';
    let topStateCount = 0;
    Object.entries(stateCounts).forEach(([name, count]) => {
      if (count > topStateCount) {
        topStateCount = count;
        topStateName = name;
      }
    });
    const topStateShare = totalFilteredScans > 0 ? ((topStateCount / totalFilteredScans) * 100).toFixed(1) : '0.0';

    const elTotScans = document.getElementById('kpiTotalScans');
    const elTotBoxes = document.getElementById('kpiTotalBoxes');
    const elBoxShare = document.getElementById('kpiBoxShareSub');
    const elTotRet = document.getElementById('kpiTotalRetailers');
    const elDailyAvg = document.getElementById('kpiAvgPerDay') || document.getElementById('kpiDailyAvg');
    const elRetAvg = document.getElementById('kpiAvgPerRetailer') || document.getElementById('kpiRetailerAvg');

    if (elTotScans) elTotScans.textContent = totalFilteredScans.toLocaleString();
    if (elTotBoxes) elTotBoxes.textContent = totalCalculatedBoxes.toFixed(1);
    if (elBoxShare) elBoxShare.textContent = `B5: ${totalFilteredB5.toLocaleString()} | B10: ${totalFilteredB10.toLocaleString()}`;
    if (elTotRet) elTotRet.textContent = uniqueRetailers.toLocaleString();
    if (elDailyAvg) elDailyAvg.textContent = dailyAvg;
    if (elRetAvg) elRetAvg.textContent = retAvg;

    const elTopCat = document.getElementById('kpiTopCategory');
    const elTopCatScans = document.getElementById('kpiTopCatScans');
    if (elTopCat) {
      if (elFilterCat.value !== 'ALL') {
        elTopCat.textContent = elFilterCat.value;
        if (elTopCatScans) elTopCatScans.textContent = `${totalFilteredScans.toLocaleString()} Scans (Selected)`;
      } else {
        elTopCat.textContent = topCatName;
        if (elTopCatScans) elTopCatScans.textContent = `${topCatCount.toLocaleString()} Scans (${topCatShare}%)`;
      }
    }
  }

  // Update Top Banner Callouts
  function updateExecutiveInsights() {
    const totalFilteredScans = filteredScans.length;
    const totalFilteredB5 = filteredScans.filter(s => s.uom === 'B5').length;
    const totalFilteredB10 = filteredScans.filter(s => s.uom === 'B10').length;
    const uniqueRetailers = new Set(filteredScans.map(s => s.status_retailer_id || s.retailer_id)).size;
    const dailyAvg = (totalFilteredScans / 31).toFixed(1);
    const retAvg = uniqueRetailers > 0 ? (totalFilteredScans / uniqueRetailers).toFixed(1) : '0.0';
    const b5Pct = totalFilteredScans > 0 ? ((totalFilteredB5 / totalFilteredScans) * 100).toFixed(1) : '0.0';

    // Daily peak in filtered set
    const dayCounts = {};
    filteredScans.forEach(s => {
      const d = (s.scan_date || String(s.retailer_scanned_at).slice(0, 10));
      dayCounts[d] = (dayCounts[d] || 0) + 1;
    });
    let peakDay = '--';
    let peakCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
      if (count > peakCount) {
        peakCount = count;
        peakDay = day;
      }
    });

    // State analysis
    const stateCounts = {};
    const stateRetMap = {};
    filteredScans.forEach(s => {
      const st = s.State_Name;
      stateCounts[st] = (stateCounts[st] || 0) + 1;
      if (!stateRetMap[st]) stateRetMap[st] = new Set();
      stateRetMap[st].add(s.status_retailer_id || s.retailer_id);
    });

    let topStateVol = '--';
    let topStateVolCount = 0;
    Object.entries(stateCounts).forEach(([st, count]) => {
      if (count > topStateVolCount) {
        topStateVolCount = count;
        topStateVol = st;
      }
    });
    const topStateVolShare = totalFilteredScans > 0 ? ((topStateVolCount / totalFilteredScans) * 100).toFixed(1) : '0.0';

    let topStateInt = '--';
    let topStateIntAvg = 0;
    Object.entries(stateCounts).forEach(([st, count]) => {
      const rets = stateRetMap[st] ? stateRetMap[st].size : 1;
      const intensity = count / rets;
      if (intensity > topStateIntAvg) {
        topStateIntAvg = intensity;
        topStateInt = st;
      }
    });

    // Category analysis
    const catCounts = {};
    filteredScans.forEach(s => {
      catCounts[s.Category_Name] = (catCounts[s.Category_Name] || 0) + 1;
    });
    let topCatName = '--';
    let topCatCount = 0;
    Object.entries(catCounts).forEach(([name, count]) => {
      if (count > topCatCount) {
        topCatCount = count;
        topCatName = name;
      }
    });
    const topCatShare = totalFilteredScans > 0 ? ((topCatCount / totalFilteredScans) * 100).toFixed(1) : '0.0';

    // Pareto 80/20
    const retScans = {};
    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      retScans[rid] = (retScans[rid] || 0) + 1;
    });
    const sortedRetCounts = Object.values(retScans).sort((a, b) => b - a);
    const top20Count = Math.max(1, Math.ceil(0.20 * sortedRetCounts.length));
    const top20Volume = sortedRetCounts.slice(0, top20Count).reduce((a, b) => a + b, 0);
    const paretoShare = totalFilteredScans > 0 ? ((top20Volume / totalFilteredScans) * 100).toFixed(1) : '0.0';

    const elInsDailyAvg = document.getElementById('insDailyAvg');
    const elInsRetAvg = document.getElementById('insRetailerAvg');
    const elInsPeakDay = document.getElementById('insPeakDay');
    const elInsTopStateVol = document.getElementById('insTopStateVol');
    const elInsTopStateVolShare = document.getElementById('insTopStateVolShare');
    const elInsTopStateInt = document.getElementById('insTopStateInt');
    const elInsTopStateIntAvg = document.getElementById('insTopStateIntAvg');
    const elInsTopCat = document.getElementById('insTopCategory');
    const elInsTopCatShare = document.getElementById('insTopCatShare');
    const elInsBoxRatio = document.getElementById('insBoxRatio');
    const elInsPareto = document.getElementById('insPareto');

    if (elInsDailyAvg) elInsDailyAvg.textContent = `${dailyAvg} scans/day`;
    if (elInsRetAvg) elInsRetAvg.textContent = `${retAvg} scans/ret`;
    if (elInsPeakDay) elInsPeakDay.textContent = peakDay;
    if (elInsTopStateVol) elInsTopStateVol.textContent = elFilterState.value !== 'ALL' ? elFilterState.value : topStateVol;
    if (elInsTopStateVolShare) elInsTopStateVolShare.textContent = elFilterState.value !== 'ALL' ? '100%' : `${topStateVolShare}%`;
    if (elInsTopStateInt) elInsTopStateInt.textContent = topStateInt;
    if (elInsTopStateIntAvg) elInsTopStateIntAvg.textContent = `${topStateIntAvg.toFixed(1)} scans/ret`;
    if (elInsTopCat) elInsTopCat.textContent = elFilterCat.value !== 'ALL' ? elFilterCat.value : topCatName;
    if (elInsTopCatShare) elInsTopCatShare.textContent = elFilterCat.value !== 'ALL' ? '100%' : `${topCatShare}%`;
    if (elInsBoxRatio) elInsBoxRatio.textContent = `${b5Pct}%`;
    if (elInsPareto) elInsPareto.textContent = `${paretoShare}%`;

    const badge = document.getElementById('badgePeakDay');
    if (badge) {
      badge.textContent = `Peak Day: ${peakDay} (${peakCount.toLocaleString()} scans)`;
    }
  }

  // Setup Theme Styles for Chart.js
  function getChartThemeColors() {
    const isLight = document.body.classList.contains('theme-light');
    return {
      textColor: isLight ? '#475569' : '#94A3B8',
      gridColor: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)',
      tooltipBg: isLight ? '#FFFFFF' : '#1E293B',
      tooltipText: isLight ? '#0F172A' : '#F8FAFC'
    };
  }

  // Render All Interactive Charts Dynamically
  function renderCharts() {
    const theme = getChartThemeColors();

    // -------------------------------------------------------------
    // 1. Dynamic Daily Trend Chart (July 01 - July 31)
    // -------------------------------------------------------------
    const dailyMap = {};
    for (let day = 1; day <= 31; day++) {
      const dateStr = `2026-07-${String(day).padStart(2, '0')}`;
      dailyMap[dateStr] = { total: 0, b5: 0, b10: 0 };
    }

    filteredScans.forEach(s => {
      const d = s.scan_date || String(s.retailer_scanned_at).slice(0, 10);
      if (dailyMap[d]) {
        dailyMap[d].total += 1;
        if (s.uom === 'B5') dailyMap[d].b5 += 1;
        else dailyMap[d].b10 += 1;
      }
    });

    const dailyLabels = Object.keys(dailyMap).map(d => `Jul ${parseInt(d.slice(8), 10)}`);
    const dailyTotals = Object.values(dailyMap).map(v => v.total);
    const dailyB5 = Object.values(dailyMap).map(v => v.b5);
    const dailyB10 = Object.values(dailyMap).map(v => v.b10);

    // 7-day rolling moving average
    const ma7 = [];
    for (let i = 0; i < dailyTotals.length; i++) {
      const start = Math.max(0, i - 6);
      const sub = dailyTotals.slice(start, i + 1);
      const avg = sub.reduce((a, b) => a + b, 0) / sub.length;
      ma7.push(Math.round(avg));
    }

    if (charts.dailyTrend) charts.dailyTrend.destroy();
    const ctxDaily = document.getElementById('dailyTrendChart').getContext('2d');
    charts.dailyTrend = new Chart(ctxDaily, {
      type: 'bar',
      data: {
        labels: dailyLabels,
        datasets: [
          {
            type: 'line',
            label: '7-Day Moving Average',
            data: ma7,
            borderColor: '#F59E0B',
            borderWidth: 3,
            fill: false,
            tension: 0.3,
            pointRadius: 2,
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'B5 Scans (0.5 Box)',
            data: dailyB5,
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderRadius: 4,
            stack: 'combined',
            yAxisID: 'y'
          },
          {
            type: 'bar',
            label: 'B10 Scans (1.0 Box)',
            data: dailyB10,
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderRadius: 4,
            stack: 'combined',
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { color: theme.textColor, font: { family: 'Inter', size: 11 } } }
        },
        scales: {
          x: { grid: { color: theme.gridColor }, ticks: { color: theme.textColor, font: { size: 10 } } },
          y: { grid: { color: theme.gridColor }, ticks: { color: theme.textColor, font: { size: 10 } }, title: { display: true, text: 'Scan Volume', color: theme.textColor } }
        }
      }
    });

    // -------------------------------------------------------------
    // 2. Dynamic State Analysis Chart (or City breakdown if state selected)
    // -------------------------------------------------------------
    const selectedState = elFilterState.value;
    let stateLabels = [];
    let stateVolumes = [];
    let stateIntensity = [];

    if (selectedState === 'ALL') {
      const stateMap = {};
      filteredScans.forEach(s => {
        const st = s.State_Name || 'Unknown';
        if (!stateMap[st]) {
          stateMap[st] = { total: 0, retailers: new Set() };
        }
        stateMap[st].total += 1;
        stateMap[st].retailers.add(s.status_retailer_id || s.retailer_id);
      });

      const sortedStates = Object.entries(stateMap)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);

      stateLabels = sortedStates.map(s => s[0]);
      stateVolumes = sortedStates.map(s => s[1].total);
      stateIntensity = sortedStates.map(s => (s[1].total / (s[1].retailers.size || 1)).toFixed(1));
    } else {
      const cityMap = {};
      filteredScans.forEach(s => {
        const city = s.city || 'Unknown';
        if (!cityMap[city]) {
          cityMap[city] = { total: 0, retailers: new Set() };
        }
        cityMap[city].total += 1;
        cityMap[city].retailers.add(s.status_retailer_id || s.retailer_id);
      });

      const sortedCities = Object.entries(cityMap)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 10);

      stateLabels = sortedCities.map(c => c[0]);
      stateVolumes = sortedCities.map(c => c[1].total);
      stateIntensity = sortedCities.map(c => (c[1].total / (c[1].retailers.size || 1)).toFixed(1));
    }

    if (charts.stateAnalysis) charts.stateAnalysis.destroy();
    const ctxState = document.getElementById('stateAnalysisChart').getContext('2d');
    charts.stateAnalysis = new Chart(ctxState, {
      type: 'bar',
      data: {
        labels: stateLabels,
        datasets: [
          {
            label: 'Total Scans',
            data: stateVolumes,
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 6,
            yAxisID: 'y'
          },
          {
            type: 'line',
            label: 'Avg Scans / Retailer',
            data: stateIntensity,
            borderColor: '#8B5CF6',
            borderWidth: 2,
            pointBackgroundColor: '#8B5CF6',
            fill: false,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: theme.textColor, font: { size: 11 } } }
        },
        scales: {
          x: { grid: { color: theme.gridColor }, ticks: { color: theme.textColor, font: { size: 10 } } },
          y: { grid: { color: theme.gridColor }, ticks: { color: theme.textColor }, title: { display: true, text: 'Total Scans', color: theme.textColor } },
          y1: { position: 'right', grid: { drawOnChartArea: false }, ticks: { color: '#8B5CF6' }, title: { display: true, text: 'Avg Scans/Ret', color: '#8B5CF6' } }
        }
      }
    });

    // -------------------------------------------------------------
    // 3. Dynamic Category Performance Doughnut Chart
    // -------------------------------------------------------------
    const catMap = {};
    filteredScans.forEach(s => {
      const cat = s.Category_Name || 'Other';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const catLabels = sortedCats.map(c => c[0]);
    const catVolumes = sortedCats.map(c => c[1]);
    const catPalette = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#6366F1', '#14B8A6', '#F97316', '#A855F7', '#64748B'];

    if (charts.category) charts.category.destroy();
    const ctxCat = document.getElementById('categoryChart').getContext('2d');
    charts.category = new Chart(ctxCat, {
      type: 'doughnut',
      data: {
        labels: catLabels,
        datasets: [{
          data: catVolumes,
          backgroundColor: catPalette.slice(0, catLabels.length),
          borderWidth: 2,
          borderColor: document.body.classList.contains('theme-light') ? '#FFFFFF' : '#131B2E'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: theme.textColor, font: { size: 10 }, boxWidth: 12 } }
        },
        cutout: '60%'
      }
    });

    // -------------------------------------------------------------
    // 4. Dynamic Day of Week Chart
    // -------------------------------------------------------------
    const dowOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const dowMap = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0, Sunday: 0 };
    filteredScans.forEach(s => {
      let dayName = s.day_name;
      if (!dayName && s.retailer_scanned_at) {
        const d = new Date(s.retailer_scanned_at);
        dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      }
      if (dayName && dowMap[dayName] !== undefined) {
        dowMap[dayName] += 1;
      }
    });

    if (charts.dow) charts.dow.destroy();
    const ctxDow = document.getElementById('dowChart').getContext('2d');
    charts.dow = new Chart(ctxDow, {
      type: 'bar',
      data: {
        labels: dowOrder.map(d => d.substring(0, 3)),
        datasets: [{
          label: 'Scans by Weekday',
          data: dowOrder.map(d => dowMap[d]),
          backgroundColor: 'rgba(245, 158, 11, 0.75)',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: theme.gridColor }, ticks: { color: theme.textColor, font: { size: 10 } } },
          y: { grid: { color: theme.gridColor }, ticks: { color: theme.textColor, font: { size: 10 } } }
        }
      }
    });

    // -------------------------------------------------------------
    // 5. Dynamic Retailer Tier Segmentation Chart
    // -------------------------------------------------------------
    const retScansMap = {};
    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      retScansMap[rid] = (retScansMap[rid] || 0) + 1;
    });
    const tiers = { "Gold (>50)": 0, "Silver (21-50)": 0, "Bronze (5-20)": 0, "Low (<5)": 0 };
    Object.values(retScansMap).forEach(count => {
      if (count > 50) tiers["Gold (>50)"]++;
      else if (count >= 21) tiers["Silver (21-50)"]++;
      else if (count >= 5) tiers["Bronze (5-20)"]++;
      else tiers["Low (<5)"]++;
    });

    if (charts.retailerTier) charts.retailerTier.destroy();
    const ctxTier = document.getElementById('retailerTierChart').getContext('2d');
    charts.retailerTier = new Chart(ctxTier, {
      type: 'pie',
      data: {
        labels: Object.keys(tiers),
        datasets: [{
          data: Object.values(tiers),
          backgroundColor: ['#F59E0B', '#94A3B8', '#D97706', '#64748B'],
          borderWidth: 2,
          borderColor: document.body.classList.contains('theme-light') ? '#FFFFFF' : '#131B2E'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { color: theme.textColor, font: { size: 10 }, boxWidth: 10 } }
        }
      }
    });

    // -------------------------------------------------------------
    // 6. Dynamic Packaging UOM Mix Chart (B5 vs B10)
    // -------------------------------------------------------------
    const totalB5 = filteredScans.filter(s => s.uom === 'B5').length;
    const totalB10 = filteredScans.filter(s => s.uom === 'B10').length;

    if (charts.uomMix) charts.uomMix.destroy();
    const ctxUom = document.getElementById('uomMixChart').getContext('2d');
    charts.uomMix = new Chart(ctxUom, {
      type: 'doughnut',
      data: {
        labels: ['Box of 5 (B5 = 0.5 Box)', 'Box of 10 (B10 = 1.0 Box)'],
        datasets: [{
          data: [totalB5, totalB10],
          backgroundColor: ['#10B981', '#3B82F6'],
          borderWidth: 2,
          borderColor: document.body.classList.contains('theme-light') ? '#FFFFFF' : '#131B2E'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: theme.textColor, font: { size: 10 } } }
        },
        cutout: '65%'
      }
    });
  }

  // Render All Tables Dynamically
  function renderAllTables() {
    renderQuery1Table();
    renderRetailersTable();
    renderStatesTable();
    renderCategoriesTable();
  }

  // Tab 1: Query 1 Detailed Table with Pagination
  function renderQuery1Table() {
    const tbody = document.getElementById('tblQuery1Body');
    tbody.innerHTML = '';

    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageItems = filteredScans.slice(start, end);

    document.getElementById('tableRecordCount').textContent = `Showing ${filteredScans.length.toLocaleString()} total scans`;

    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="12" style="text-align: center; padding: 24px; color: var(--text-muted);">No scan records match the current filter selection.</td></tr>`;
      renderPagination(0);
      return;
    }

    pageItems.forEach(row => {
      const boxCount = row.Box_count !== undefined ? row.Box_count : (row.uom === 'B5' ? 0.5 : 1.0);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHTML(row.retailer_name)}</strong></td>
        <td>${row.mobile_number}</td>
        <td>${escapeHTML(row.city)}</td>
        <td>${escapeHTML(row.State_Name)}</td>
        <td>${escapeHTML(row.Category_Name)}</td>
        <td><code>${row.sku_code || '--'}</code></td>
        <td><span class="badge ${row.uom === 'B5' ? 'pill-emerald' : 'pill-blue'}">${row.uom}</span></td>
        <td>₹${Number(row.mrp || 0).toFixed(2)}</td>
        <td>₹${Number(row.unit_price || 0).toFixed(2)}</td>
        <td style="color: var(--accent-amber); font-weight: 700;">${boxCount}</td>
        <td>${row.retailer_scanned_at}</td>
      `;
      tbody.appendChild(tr);
    });

    renderPagination(filteredScans.length);
  }

  // Pagination for Query 1
  function renderPagination(totalCount) {
    const pagContainer = document.getElementById('pagQuery1');
    pagContainer.innerHTML = '';
    const totalPages = Math.ceil(totalCount / rowsPerPage);
    if (totalPages <= 1) return;

    const btnPrev = document.createElement('button');
    btnPrev.className = 'btn-page';
    btnPrev.innerHTML = '<i class="fa-solid fa-chevron-left"></i> Prev';
    btnPrev.disabled = (currentPage === 1);
    btnPrev.onclick = () => { currentPage--; renderQuery1Table(); };
    pagContainer.appendChild(btnPrev);

    const spanInfo = document.createElement('span');
    spanInfo.style.fontSize = '12px';
    spanInfo.style.color = 'var(--text-secondary)';
    spanInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    pagContainer.appendChild(spanInfo);

    const btnNext = document.createElement('button');
    btnNext.className = 'btn-page';
    btnNext.innerHTML = 'Next <i class="fa-solid fa-chevron-right"></i>';
    btnNext.disabled = (currentPage === totalPages);
    btnNext.onclick = () => { currentPage++; renderQuery1Table(); };
    pagContainer.appendChild(btnNext);
  }

  // Tab 2: Retailer Summary (Query 2) Dynamically Aggregated
  function renderRetailersTable() {
    const tbody = document.getElementById('tblRetailersBody');
    tbody.innerHTML = '';

    // Group filteredScans by retailer
    const retMap = {};
    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      if (!retMap[rid]) {
        retMap[rid] = {
          retailer_id: rid,
          retailer_name: s.retailer_name,
          mobile_number: s.mobile_number,
          city: s.city,
          State_Name: s.State_Name,
          total_scans: 0,
          box_count: 0,
          b5_scans: 0,
          b10_scans: 0,
          dates: new Set()
        };
      }
      retMap[rid].total_scans += 1;
      const weight = (s.uom === 'B5' ? 0.5 : 1.0);
      retMap[rid].box_count += weight;
      if (s.uom === 'B5') retMap[rid].b5_scans += 1;
      else retMap[rid].b10_scans += 1;
      const d = s.scan_date || String(s.retailer_scanned_at).slice(0, 10);
      if (d) retMap[rid].dates.add(d);
    });

    const items = Object.values(retMap).sort((a, b) => b.total_scans - a.total_scans);

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px;">No retailers match the current filter selection.</td></tr>`;
      return;
    }

    items.forEach(ret => {
      const tier = ret.total_scans > 50 ? 'Gold (>50)' :
                   ret.total_scans >= 21 ? 'Silver (21-50)' :
                   ret.total_scans >= 5 ? 'Bronze (5-20)' : 'Low (<5)';
      const tierClass = tier.includes('Gold') ? 'tier-gold' :
                        tier.includes('Silver') ? 'tier-silver' :
                        tier.includes('Bronze') ? 'tier-bronze' : 'tier-low';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><code>${ret.retailer_id}</code></td>
        <td><strong>${escapeHTML(ret.retailer_name)}</strong></td>
        <td>${ret.mobile_number}</td>
        <td>${escapeHTML(ret.city)}</td>
        <td>${escapeHTML(ret.State_Name)}</td>
        <td><strong>${ret.total_scans}</strong></td>
        <td style="color: var(--accent-amber); font-weight: 700;">${ret.box_count.toFixed(1)}</td>
        <td>${ret.b5_scans}</td>
        <td>${ret.b10_scans}</td>
        <td>${ret.dates.size}</td>
        <td><span class="badge-tier ${tierClass}">${tier}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Tab 3: State Rankings Table Dynamically Aggregated
  function renderStatesTable() {
    const tbody = document.getElementById('tblStatesBody');
    tbody.innerHTML = '';

    const stateMap = {};
    const totalScansAll = Math.max(1, filteredScans.length);

    filteredScans.forEach(s => {
      const st = s.State_Name || 'Unknown';
      if (!stateMap[st]) {
        stateMap[st] = { State_Name: st, total_scans: 0, b5_scans: 0, b10_scans: 0, calculated_box_count: 0, retailers: new Set() };
      }
      stateMap[st].total_scans += 1;
      const weight = (s.uom === 'B5' ? 0.5 : 1.0);
      stateMap[st].calculated_box_count += weight;
      if (s.uom === 'B5') stateMap[st].b5_scans += 1;
      else stateMap[st].b10_scans += 1;
      stateMap[st].retailers.add(s.status_retailer_id || s.retailer_id);
    });

    const stateList = Object.values(stateMap).sort((a, b) => b.total_scans - a.total_scans);

    if (stateList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">No state data available for current filter.</td></tr>`;
      return;
    }

    stateList.forEach(st => {
      const retCount = st.retailers.size;
      const intensity = (st.total_scans / (retCount || 1)).toFixed(2);
      const scanShare = ((st.total_scans / totalScansAll) * 100).toFixed(2);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHTML(st.State_Name)}</strong></td>
        <td><strong>${st.total_scans.toLocaleString()}</strong></td>
        <td>${st.b5_scans.toLocaleString()}</td>
        <td>${st.b10_scans.toLocaleString()}</td>
        <td style="color: var(--accent-amber); font-weight: 700;">${st.calculated_box_count.toFixed(1)}</td>
        <td>${retCount}</td>
        <td><span class="badge pill-purple">${intensity}</span></td>
        <td>${scanShare}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Tab 4: Category Breakdown Table Dynamically Aggregated with High/Low Analysis
  function renderCategoriesTable() {
    const tbody = document.getElementById('tblCategoriesBody');
    tbody.innerHTML = '';

    const catMap = {};
    const totalScansAll = Math.max(1, filteredScans.length);

    filteredScans.forEach(s => {
      const cat = s.Category_Name || 'Unknown';
      if (!catMap[cat]) {
        catMap[cat] = { Category_Name: cat, total_scans: 0, b5_scans: 0, b10_scans: 0, calculated_box_count: 0, retailers: new Set() };
      }
      catMap[cat].total_scans += 1;
      const weight = (s.uom === 'B5' ? 0.5 : 1.0);
      catMap[cat].calculated_box_count += weight;
      if (s.uom === 'B5') catMap[cat].b5_scans += 1;
      else catMap[cat].b10_scans += 1;
      catMap[cat].retailers.add(s.status_retailer_id || s.retailer_id);
    });

    const catList = Object.values(catMap).sort((a, b) => b.total_scans - a.total_scans);

    if (catList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px;">No category data available for current filter.</td></tr>`;
      if (elCatHighName) elCatHighName.textContent = 'None';
      if (elCatLowName) elCatLowName.textContent = 'None';
      return;
    }

    // Update Category High vs Low Highlights Cards
    const highest = catList[0];
    const lowest = catList[catList.length - 1];

    if (elCatHighName) elCatHighName.textContent = highest.Category_Name;
    if (elCatHighShare) elCatHighShare.textContent = `${((highest.total_scans / totalScansAll) * 100).toFixed(1)}% Share`;
    if (elCatHighScans) elCatHighScans.textContent = highest.total_scans.toLocaleString();
    if (elCatHighBoxPct) elCatHighBoxPct.textContent = `${((highest.b5_scans / (highest.total_scans || 1)) * 100).toFixed(1)}%`;

    if (elCatLowName) elCatLowName.textContent = lowest.Category_Name;
    if (elCatLowShare) elCatLowShare.textContent = `${((lowest.total_scans / totalScansAll) * 100).toFixed(1)}% Share`;
    if (elCatLowScans) elCatLowScans.textContent = lowest.total_scans.toLocaleString();
    if (elCatLowRetailers) elCatLowRetailers.textContent = `${lowest.retailers.size} Outlets`;

    catList.forEach((cat, idx) => {
      const scanShare = ((cat.total_scans / totalScansAll) * 100).toFixed(2);
      const b5Contrib = ((cat.b5_scans / (cat.total_scans || 1)) * 100).toFixed(2);
      
      let statusBadge = '<span class="badge pill-mid">STABLE</span>';
      if (idx === 0) {
        statusBadge = '<span class="badge pill-highest"><i class="fa-solid fa-crown"></i> HIGHEST</span>';
      } else if (idx === catList.length - 1 && catList.length > 1) {
        statusBadge = '<span class="badge pill-lowest"><i class="fa-solid fa-arrow-trend-down"></i> LOWEST</span>';
      } else if (idx < 3) {
        statusBadge = '<span class="badge pill-core"><i class="fa-solid fa-fire"></i> CORE</span>';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHTML(cat.Category_Name)}</strong></td>
        <td>${statusBadge}</td>
        <td><strong>${cat.total_scans.toLocaleString()}</strong></td>
        <td>${cat.b5_scans.toLocaleString()}</td>
        <td>${cat.b10_scans.toLocaleString()}</td>
        <td style="color: var(--accent-amber); font-weight: 700;">${cat.calculated_box_count.toFixed(1)}</td>
        <td>${cat.retailers.size}</td>
        <td>${scanShare}%</td>
        <td><span class="badge pill-emerald">${b5Contrib}%</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Event Listeners
  function setupEventListeners() {
    // Theme Toggle
    elThemeToggle.addEventListener('click', () => {
      document.body.classList.toggle('theme-light');
      const isLight = document.body.classList.contains('theme-light');
      elThemeIcon.className = isLight ? 'fa-solid fa-moon' : 'fa-solid fa-sun';
      renderCharts();
    });

    // Filters Change
    if (elFilterStartDate) elFilterStartDate.addEventListener('change', applyFilters);
    if (elFilterEndDate) elFilterEndDate.addEventListener('change', applyFilters);
    elFilterState.addEventListener('change', applyFilters);
    elFilterCat.addEventListener('change', applyFilters);
    elFilterUOM.addEventListener('change', applyFilters);
    elSearch.addEventListener('input', applyFilters);

    elBtnClearSearch.addEventListener('click', () => {
      elSearch.value = '';
      applyFilters();
    });

    elBtnReset.addEventListener('click', () => {
      if (elFilterStartDate) elFilterStartDate.value = '2026-07-01';
      if (elFilterEndDate) elFilterEndDate.value = '2026-07-31';
      elFilterState.value = 'ALL';
      elFilterCat.value = 'ALL';
      elFilterUOM.value = 'ALL';
      elSearch.value = '';
      applyFilters();
    });

    // Tabs switching
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active');
      });
    });

    // Export Buttons
    elBtnExportExcel.addEventListener('click', () => {
      window.location.href = 'Retailer_Scan_Insights_July2026.xlsx';
    });

    elBtnExportCSV.addEventListener('click', exportCSV);
    elBtnPrint.addEventListener('click', () => window.print());
  }

  // CSV Export Utility with Filtered Insights
  function exportCSV() {
    if (filteredScans.length === 0) {
      alert('No data available to export.');
      return;
    }
    const headers = ["retailer_id", "status_retailer_id", "retailer_name", "mobile_number", "pincode", "city", "State_Name", "Category_Name", "sku_code", "uom", "mrp", "unit_price", "Box_count", "retailer_scanned_at", "scan_date"];
    let csv = headers.join(',') + '\n';
    filteredScans.forEach(row => {
      const line = headers.map(h => `"${String(row[h] !== undefined ? row[h] : '').replace(/"/g, '""')}"`).join(',');
      csv += line + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const startStr = elFilterStartDate && elFilterStartDate.value ? elFilterStartDate.value : '2026-07-01';
    const endStr = elFilterEndDate && elFilterEndDate.value ? elFilterEndDate.value : '2026-07-31';
    link.download = `Retailer_Scans_${startStr}_to_${endStr}.csv`;
    link.click();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Fallback Data
  function getFallbackData() {
    return {
      summary: {
        total_scans: 6844,
        total_boxes: 3986,
        total_retailers: 250,
        total_days: 31,
        avg_scans_per_day: 220.77,
        avg_boxes_per_day: 128.58,
        avg_scans_per_retailer: 27.38,
        avg_boxes_per_retailer: 15.94,
        top_state_vol: "Uttar Pradesh",
        top_state_vol_scans: 1015,
        top_state_vol_share: 14.83,
        top_state_int: "Telangana",
        top_state_int_avg: 49.0,
        top_category: "Comfy Trunk & Briefs",
        top_cat_scans: 1459,
        top_cat_share: 21.32,
        peak_scan_date: "2026-07-16",
        peak_scan_count: 241,
        lowest_scan_date: "2026-07-02",
        lowest_scan_count: 198,
        pareto_share_pct: 50.54
      },
      all_scans: []
    };
  }

  // Initialize
  loadData();
});
