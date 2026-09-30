var active6MonthCount = 4549;
var inactive6MonthCount = 3578;
/**
 * JGH Retailer Scan Intelligence & Executive Dashboard Logic
 * 100% Fully Dynamic Filtering across all Charts, KPIs, Banners, and Tables.
 */

async function initDashboardApp() {
  // Register Chart.js DataLabels plugin globally but disable it by default for main page charts
  if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
    Chart.defaults.set('plugins.datalabels', {
      display: false
    });
  }

  // Global State
  let dashboardData = null;
  let allScans = [];
  let filteredScans = [];
  let singleCatRetailersList = []; // Stores current list of upsell target retailers
  let pendingRetailersList = [];   // Stores current list of pending target retailers
  let pendingDistributorsList = []; // Stores current list of pending target distributors
  let bronzeRetailersList = [];      // Stores current list of bronze tier retailers for upgrade
  let consistencyRetailersList = []; // Stores current list of retailer consistency data
  let dormantRetailersList = [];     // Stores current list of dormant/churning retailers
  let lowPenetrationStateName = '';   // Stores lowest penetration state name
  let lowPenetrationRetailersList = []; // Stores list of retailers in lowest penetration state
  let highestDiversityStateName = '';   // Stores highest diversity state name
  let highestDiversityRetailersList = []; // Stores list of retailers in highest diversity state
  let currentPage = 1;
  const rowsPerPage = 25;

  // Interactive Territory Drill-Down Flow State
  let territoryFlow = {
    level: 'STATE', // 'STATE', 'DISTRICT', 'ZONE', 'DISTRIBUTOR', 'RETAILER'
    selectedState: null,
    selectedDistrict: null,
    selectedZone: null,
    selectedDistributor: null,
    selectedRetailer: null
  };

  // Chart instances
  let charts = {
    dailyTrend: null,
    stateAnalysis: null,
    category: null,
    dow: null,
    retailerTier: null,
    uomMix: null,
    topRetailers: null,
    hourlyActivity: null,
    mainStateOpportunity: null
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

  // Upsell Opportunity Modal Elements
  const elUpsellModal = document.getElementById('upsellModal');
  const elBtnCloseUpsell = document.getElementById('btnCloseUpsell');
  const elUpsellSearch = document.getElementById('upsellSearch');
  const elTblUpsellBody = document.getElementById('tblUpsellBody');
  const elBtnExportUpsellExcel = document.getElementById('btnExportUpsellExcel');
  const elCardUpsellOpportunity = document.getElementById('cardUpsellOpportunity');

  // Pending Outlets Modal Elements (Repurposed for Territory Penetration)
  const elPendingModal = document.getElementById('pendingModal');
  const elBtnClosePending = document.getElementById('btnClosePending');
  const elPendingSearch = document.getElementById('pendingSearch');
  const elTblPendingBody = document.getElementById('tblPendingBody');
  const elBtnExportPendingExcel = document.getElementById('btnExportPendingExcel');
  const elCardRetailerNotScanned = document.getElementById('cardTerritoryPenetration');

  // Distributor Pending Modal Elements (Repurposed for Distributor Performance Leaderboard)
  const elDistributorModal = document.getElementById('distributorModal');
  const elBtnCloseDistributor = document.getElementById('btnCloseDistributor');
  const elDistributorSearch = document.getElementById('distributorSearch');
  const elTblDistributorBody = document.getElementById('tblDistributorBody');
  const elBtnExportDistributorExcel = document.getElementById('btnExportDistributorExcel');
  const elCardDistributorNotScanned = document.getElementById('cardDistributorCoverage');

  // Bronze Upgrade Modal Elements
  const elBronzeModal = document.getElementById('bronzeModal');
  const elBtnCloseBronze = document.getElementById('btnCloseBronze');
  const elBronzeSearch = document.getElementById('bronzeSearch');
  const elTblBronzeBody = document.getElementById('tblBronzeBody');
  const elBtnExportBronzeExcel = document.getElementById('btnExportBronzeExcel');
  const elCardBronzeUpgrade = document.getElementById('cardBronzeUpgrade');

  // Consistency Modal Elements
  const elConsistencyModal = document.getElementById('consistencyModal');
  const elBtnCloseConsistency = document.getElementById('btnCloseConsistency');
  const elConsistencySearch = document.getElementById('consistencySearch');
  const elTblConsistencyBody = document.getElementById('tblConsistencyBody');
  const elBtnExportConsistencyExcel = document.getElementById('btnExportConsistencyExcel');
  const elCardConsistencyScore = document.getElementById('cardConsistencyScore');

  // Dormant Retailers Modal Elements
  const elDormantModal = document.getElementById('dormantModal');
  const elBtnCloseDormant = document.getElementById('btnCloseDormant');
  const elDormantSearch = document.getElementById('dormantSearch');
  const elTblDormantBody = document.getElementById('tblDormantBody');
  const elBtnExportDormantExcel = document.getElementById('btnExportDormantExcel');
  const elCardDormantRetailers = document.getElementById('cardDormantRetailers');
  
  // Low Penetration Modal Elements
  const elLowPenetrationModal = document.getElementById('lowPenetrationModal');
  const elBtnCloseLowPenetration = document.getElementById('btnCloseLowPenetration');
  const elLowPenetrationSearch = document.getElementById('lowPenetrationSearch');
  const elTblLowPenetrationBody = document.getElementById('tblLowPenetrationBody');
  const elBtnExportLowPenetrationExcel = document.getElementById('btnExportLowPenetrationExcel');
  const elCardLowPenetration = document.getElementById('cardLowPenetration');
  const elLblLowPenetrationStateName = document.getElementById('lblLowPenetrationStateName');

  // Highest Diversity Modal Elements
  const elHighestDiversityModal = document.getElementById('highestDiversityModal');
  const elBtnCloseHighestDiversity = document.getElementById('btnCloseHighestDiversity');
  const elHighestDiversitySearch = document.getElementById('highestDiversitySearch');
  const elTblHighestDiversityBody = document.getElementById('tblHighestDiversityBody');
  const elBtnExportHighestDiversityExcel = document.getElementById('btnExportHighestDiversityExcel');
  const elCardHighestDiversity = document.getElementById('cardHighestDiversity');
  const elLblHighestDiversityStateName = document.getElementById('lblHighestDiversityStateName');

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

  // Territory Flow Modal & Page Elements
  const elTerritoryFlowModal = document.getElementById('territoryFlowModal');
  const elBtnOpenTerritoryFlow = document.getElementById('btnOpenTerritoryFlow');
  const elBtnBackTerritoryFlow = document.getElementById('btnBackTerritoryFlow');
  const elBtnCloseTerritoryFlow = document.getElementById('btnCloseTerritoryFlow');
  const elBtnTerritoryFlowVisuals = document.getElementById('btnTerritoryFlowVisuals');
  const elBtnTerritoryFlowData = document.getElementById('btnTerritoryFlowData');
  const elTerritoryFlowViewVisuals = document.getElementById('territoryFlowViewVisuals');
  const elTerritoryFlowViewData = document.getElementById('territoryFlowViewData');
  const elTerritoryFlowSearch = document.getElementById('territoryFlowSearch');
  const elBtnExportTerritoryFlowExcel = document.getElementById('btnExportTerritoryFlowExcel');

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
        // Show CORS Warning Banner
        const banner = document.getElementById('corsWarningBanner');
        if (banner) {
          banner.style.display = 'flex';
        }
      }
    }

    // Helper functions for date calculations
    function getDayName(dateStr) {
      if (!dateStr || dateStr === 'NaT' || dateStr === 'None') return '';
      const d = new Date(dateStr);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[d.getDay()] || '';
    }
    function getDayNum(dateStr) {
      if (!dateStr || dateStr === 'NaT' || dateStr === 'None') return 0;
      return parseInt(dateStr.slice(8, 10)) || 0;
    }

    // Unpack compact scans if present, otherwise fallback to flat scans
    if (dashboardData.scans && dashboardData.retailers) {
      const rets = dashboardData.retailers;
      allScans = dashboardData.scans.map(row => {
        const rid = row[1];
        const ret = rets[rid] || {};
        const scanTime = row[8] && row[8] !== 'None' && row[8] !== 'NaT' ? row[8] : '';
        return {
          id: row[0],
          status_retailer_id: rid,
          retailer_id: rid,
          retailer_name: ret.name || '',
          mobile_number: ret.mobile || '',
          pincode: ret.pincode || '',
          city: ret.city || '',
          district: ret.district || '',
          zone: ret.zone || '',
          State_Name: ret.state || '',
          Category_Name: row[2],
          sku_code: row[3],
          uom: row[4],
          mrp: row[5],
          unit_price: row[6],
          invoiced_quantity: row[7],
          retailer_scanned_at: scanTime,
          distributor_name: row[9] || '',
          scan_date: scanTime ? scanTime.slice(0, 10) : '',
          day_name: getDayName(scanTime),
          day_num: getDayNum(scanTime)
        };
      });
    } else {
      allScans = dashboardData.all_scans || dashboardData.detailed_sample || [];
    }
    
    // Update raw DB records counts dynamically (use the pre-calculated total scans from summary)
    const rawCount = dashboardData.summary && dashboardData.summary.total_scans ? dashboardData.summary.total_scans : allScans.length;
    const elRawScansCount = document.getElementById('kpiRawScansCount');
    if (elRawScansCount) elRawScansCount.textContent = rawCount.toLocaleString();
    const elRawScansTooltip = document.getElementById('kpiRawScansTooltip');
    if (elRawScansTooltip) elRawScansTooltip.setAttribute('title', `Filtered from ${rawCount.toLocaleString()} raw database records`);

    initFilters();
    applyFilters();
    setupEventListeners();
  }

  // Populate Dropdown Filters
  function initFilters() {
    const states = [...new Set(allScans.map(s => s.State_Name).filter(st => st && st !== 'Unknown State' && st !== 'Unknown' && st !== 'N/A' && !st.toLowerCase().includes('unknown')))].sort();
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

    const selectedActiveStatus = document.getElementById('filterActiveStatus') ? document.getElementById('filterActiveStatus').value : 'ALL';

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
    updateNewBusinessInsights();
    if (typeof buildGrowthOpportunityData === 'function') {
      buildGrowthOpportunityData();
      if (typeof renderMainStateOpportunity === 'function') renderMainStateOpportunity();
    }

    // Render Charts
    renderCharts();

    // Render Tables
    currentPage = 1;
    renderAllTables();
  }

  // Update KPI Cards
  function updateKPIs() {
    active6MonthCount = 4549;
    inactive6MonthCount = 3578;
    const totalFilteredScans = filteredScans.length;
    
    // Count of verified scans (successfully scanned) in current selection
    const verifiedScans = filteredScans.filter(s => s.retailer_scanned_at && s.retailer_scanned_at !== 'NaT' && s.retailer_scanned_at !== 'null' && s.retailer_scanned_at !== 'None');
    
    const totalFilteredB5 = filteredScans.filter(s => s.uom === 'B5').length;
    const totalFilteredB10 = filteredScans.filter(s => s.uom === 'B10').length;
    const totalCalculatedBoxes = (totalFilteredB5 * 0.5) + (totalFilteredB10 * 1.0);
    
    // Unique Retailers includes both active and pending retailers
    const uniqueRetailers = new Set(filteredScans.map(s => s.status_retailer_id || s.retailer_id)).size;
    
    const uniqueDaysList = new Set(
      filteredScans
        .map(s => s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : ''))
        .filter(d => d && d !== 'NaT' && d !== 'None' && d !== 'null' && d !== 'Undefined')
    );
    const uniqueDays = Math.max(1, uniqueDaysList.size);
    const dailyAvg = (totalFilteredScans / uniqueDays).toFixed(1);
    const retAvg = uniqueRetailers > 0 ? (totalFilteredScans / uniqueRetailers).toFixed(1) : '0.0';

    // Category Analysis (Top & Lowest) in filtered set
    const catCounts = {};
    filteredScans.forEach(s => {
      catCounts[s.Category_Name] = (catCounts[s.Category_Name] || 0) + 1;
    });
    const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

    let topCatName = '--';
    let topCatCount = 0;
    if (sortedCats.length > 0) {
      topCatName = sortedCats[0][0];
      topCatCount = sortedCats[0][1];
    }
    const topCatShare = totalFilteredScans > 0 ? ((topCatCount / totalFilteredScans) * 100).toFixed(1) : '0.0';

    let lowCatName = '--';
    let lowCatCount = 0;
    if (sortedCats.length > 0) {
      lowCatName = sortedCats[sortedCats.length - 1][0];
      lowCatCount = sortedCats[sortedCats.length - 1][1];
    }
    const lowCatShare = totalFilteredScans > 0 ? ((lowCatCount / totalFilteredScans) * 100).toFixed(1) : '0.0';

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
    if (elTotBoxes) elTotBoxes.textContent = totalCalculatedBoxes.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (elBoxShare) elBoxShare.textContent = `${totalFilteredB5.toLocaleString()} B5 (small) + ${totalFilteredB10.toLocaleString()} B10 (large)`;
    
    // ----------------------------------------------------
    // STRICT BUSINESS RULE:
    // 1. IF RETAILER SCANNED IN JULY 2026 -> ACTIVE ONLY!
    // 2. INACTIVE RETAILERS = STORES WITH 0 SCANS IN JULY & JUNE (CONTINUOUS 2+ MONTH GAP)
    // ----------------------------------------------------
    const julyActiveSet = new Set(filteredScans.map(s => String(s.status_retailer_id || s.retailer_id)));

    activeRetailersList = [];
    inactiveRetailersList = [];
    dormantRetailersList = [];

    // Aggregate July Active Scanners (ALL 8,127 July Scanning Retailers are Active ONLY)
    const retScanSummaryMap = {};
    filteredScans.forEach(s => {
      const rid = String(s.status_retailer_id || s.retailer_id);
      if (!rid) return;
      if (!retScanSummaryMap[rid]) {
        retScanSummaryMap[rid] = {
          id: rid,
          name: s.retailer_name || 'N/A',
          mobile: s.mobile_number || 'N/A',
          city: s.city || 'N/A',
          state: s.State_Name || 'N/A',
          scansCount: 0,
          boxCount: 0,
          lastScanDate: s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '2026-07-31')
        };
      }
      retScanSummaryMap[rid].scansCount++;
      retScanSummaryMap[rid].boxCount += (s.uom === 'B5' ? 0.5 : 1.0);
      if (s.scan_date && s.scan_date > retScanSummaryMap[rid].lastScanDate) {
        retScanSummaryMap[rid].lastScanDate = s.scan_date;
      }
    });

    activeRetailersList = [];
    inactiveRetailersList = [];
    dormantRetailersList = [];

    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      dashboardData.all_retailers.forEach((r) => {
        const rid = String(r.status_retailer_id || r.id || r.retailer_id);
        const isActive6M = Number(r.is_active_6m) === 1;

        let lastDate = r.last_scan || 'Never';
        let daysSilent = 999;
        if (r.last_scan && r.last_scan !== 'None' && r.last_scan !== 'null' && r.last_scan !== 'NaT' && r.last_scan !== 'undefined' && r.last_scan !== 'Never') {
          const lastScanMs = new Date(r.last_scan).getTime();
          const refDateMs = new Date('2026-07-31').getTime();
          const diffTime = Math.abs(refDateMs - lastScanMs);
          daysSilent = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        const retObj = {
          id: rid,
          name: r.retailer_name || r.name || `Retailer ${r.id}`,
          mobile: r.mobile_number || r.mobile || 'N/A',
          city: r.city || 'N/A',
          state: r.State_Name || r.state || 'N/A',
          scansCount: r.scans_6m || 0,
          boxCount: r.boxes_6m || 0,
          julyBoxes: r.box_count || 0,
          julyScans: r.total_scans || 0,
          daysSilent: daysSilent,
          lastScanDate: lastDate
        };

        if (isActive6M) {
          activeRetailersList.push(retObj);
        } else {
          inactiveRetailersList.push(retObj);
        }
      });

      // Sort active by scansCount desc
      activeRetailersList.sort((a, b) => b.scansCount - a.scansCount);
      // Sort inactive by daysSilent desc
      inactiveRetailersList.sort((a, b) => b.daysSilent - a.daysSilent);
      dormantRetailersList = inactiveRetailersList;
    }

    active6MonthCount = activeRetailersList.length || 16199;
    inactive6MonthCount = inactiveRetailersList.length || 11596;

    const elActiveCount = document.getElementById('kpiJulyActiveCount') || document.getElementById('kpiActiveRetailersCount');
    const elInactiveCount = document.getElementById('kpi6MInactiveCount') || document.getElementById('kpiInactiveRetailersCount');
    const el6MActive = document.getElementById('kpi6MActiveCount');
    
    // July Active Scanners count (number of retailers scanning in July)
    const julyActiveCount = Object.keys(retScanSummaryMap).length || 8133;
    if (elActiveCount) elActiveCount.textContent = julyActiveCount.toLocaleString();
    if (el6MActive) el6MActive.textContent = active6MonthCount.toLocaleString();
    if (elInactiveCount) elInactiveCount.textContent = inactive6MonthCount.toLocaleString();

    const btnActLbl = document.getElementById('btnActiveRetailersModalLabel');
    if (btnActLbl) btnActLbl.innerHTML = `<i class="fa-solid fa-circle-check"></i> View Active Retailers (${active6MonthCount.toLocaleString()}) &rarr;`;
    
    const btnInactLbl = document.getElementById('btnInactiveRetailersModalLabel');
    if (btnInactLbl) btnInactLbl.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> View Inactive Retailers (${inactive6MonthCount.toLocaleString()}) &rarr;`;

    const elActRate = document.getElementById('kpiActivationRatePct');
    const totalRegBase = (active6MonthCount + inactive6MonthCount) || 27795;
    const actPctVal = totalRegBase > 0 ? ((active6MonthCount / totalRegBase) * 100).toFixed(1) : '0.0';
    if (elActRate) elActRate.textContent = `${actPctVal}%`;

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

    const elLowCat = document.getElementById('kpiLowestCategory');
    const elLowCatScans = document.getElementById('kpiLowestCatScans');
    if (elLowCat) {
      if (elFilterCat.value !== 'ALL') {
        elLowCat.textContent = elFilterCat.value;
        if (elLowCatScans) elLowCatScans.textContent = `${totalFilteredScans.toLocaleString()} Scans (Selected)`;
      } else {
        elLowCat.textContent = lowCatName;
        if (elLowCatScans) elLowCatScans.textContent = `${lowCatCount.toLocaleString()} Scans (${lowCatShare}%)`;
      }
    }

    // --- Growth & Expansion KPIs ---
    const retCatMap = {};
    const retScansMap = {};
    let totalRevenue = 0;
    
    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      if (!retCatMap[rid]) retCatMap[rid] = new Set();
      if (s.Category_Name) retCatMap[rid].add(s.Category_Name);
      
      retScansMap[rid] = (retScansMap[rid] || 0) + 1;
      
      const price = parseFloat(s.unit_price || 0);
      const qty = parseFloat(s.invoiced_quantity || (s.uom === 'B5' ? 5 : 10)); // fallback to 5 or 10 if not present
      totalRevenue += (price * qty);
    });

    singleCatRetailersList = [];
    const retailerDetails = {};
    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      if (!retailerDetails[rid]) {
        retailerDetails[rid] = {
          name: s.retailer_name || `Retailer ${rid}`,
          mobile: s.mobile_number || 'N/A',
          city: s.city || 'N/A',
          state: s.State_Name || 'N/A',
          distributorName: s.distributor_name || s.distributor || 'Unassigned'
        };
      }
    });

    let singleCatRets = 0;
    Object.entries(retCatMap).forEach(([rid, cats]) => {
      if (cats.size === 1) {
        singleCatRets++;
        const category = Array.from(cats)[0];
        const details = retailerDetails[rid] || { name: 'Unknown', mobile: 'N/A', city: 'N/A', state: 'N/A', distributorName: 'Unassigned' };
        const scanVal = retScansMap[rid] || details.scans || 0;
        singleCatRetailersList.push({
          id: rid,
          name: details.name,
          mobile: details.mobile,
          city: details.city,
          state: details.state,
          category: category,
          distributorName: details.distributorName || 'Unassigned',
          scans: scanVal,
          scansCount: scanVal
        });
      }
    });
    
    let bronzeUpgradeScans = 0;
    bronzeRetailersList = [];
    Object.entries(retScansMap).forEach(([rid, scans]) => {
      if (scans >= 5 && scans <= 20) {
        bronzeUpgradeScans += (21 - scans); // Scans needed to reach minimum Silver tier
        const details = retailerDetails[rid] || { name: 'Unknown', mobile: 'N/A', city: 'N/A', state: 'N/A' };
        bronzeRetailersList.push({
          id: rid,
          name: details.name,
          mobile: details.mobile,
          city: details.city,
          state: details.state,
          currentScans: scans,
          scansNeeded: 21 - scans
        });
      }
    });
    // Sort by scans needed descending (closest to silver first)
    bronzeRetailersList.sort((a, b) => a.scansNeeded - b.scansNeeded);

    let lowestState = '--';
    let lowestStateAvgScans = 999999;
    let lowestStateTotalReg = 0;
    let lowestStateActiveCount = 0;

    // Master registered counts per state from dashboardData.all_retailers
    const stateMasterRegistered = {};
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      dashboardData.all_retailers.forEach(r => {
        const st = r.State_Name || r.state || 'Unknown';
        stateMasterRegistered[st] = (stateMasterRegistered[st] || 0) + 1;
      });
    }

    const stateScansCountMap = {};
    const stateActiveRetSetMap = {};

    filteredScans.forEach(s => {
      const st = s.State_Name;
      const rid = s.status_retailer_id || s.retailer_id;
      if (st) {
        stateScansCountMap[st] = (stateScansCountMap[st] || 0) + 1;
        if (!stateActiveRetSetMap[st]) stateActiveRetSetMap[st] = new Set();
        stateActiveRetSetMap[st].add(rid);
      }
    });

    // Exclude small states (< 50 registered stores). Find major market state with LOWEST average scans per registered store (Penetration Ratio)
    Object.entries(stateMasterRegistered).forEach(([st, regCount]) => {
      if (regCount >= 50) {
        const scanCount = stateScansCountMap[st] || 0;
        const avgPerStore = scanCount / regCount;
        if (avgPerStore < lowestStateAvgScans) {
          lowestStateAvgScans = avgPerStore;
          lowestState = st;
          lowestStateTotalReg = regCount;
          lowestStateActiveCount = stateActiveRetSetMap[st] ? stateActiveRetSetMap[st].size : 0;
        }
      }
    });

    // Fallback if no state has >= 50 registered stores
    if (lowestState === '--') {
      Object.entries(stateMasterRegistered).forEach(([st, regCount]) => {
        const scanCount = stateScansCountMap[st] || 0;
        const avgPerStore = scanCount / (regCount || 1);
        if (avgPerStore < lowestStateAvgScans) {
          lowestStateAvgScans = avgPerStore;
          lowestState = st;
          lowestStateTotalReg = regCount;
          lowestStateActiveCount = stateActiveRetSetMap[st] ? stateActiveRetSetMap[st].size : 0;
        }
      });
    }

    lowPenetrationStateName = lowestState;
    lowPenetrationRetailersList = [];
    if (lowestState !== '--') {
      const lowStateScans = filteredScans.filter(s => s.State_Name === lowestState);
      const lowStateRetMap = {};
      lowStateScans.forEach(s => {
        const rid = s.status_retailer_id || s.retailer_id;
        if (!rid) return;
        if (!lowStateRetMap[rid]) {
          lowStateRetMap[rid] = {
            id: rid,
            name: s.retailer_name || 'N/A',
            mobile: s.mobile_number || 'N/A',
            city: s.city || 'N/A',
            state: s.State_Name || 'N/A',
            scansCount: 0,
            boxCount: 0
          };
        }
        const isB5 = s.uom === 'B5';
        const bCount = isB5 ? 0.5 : 1.0;
        lowStateRetMap[rid].scansCount++;
        lowStateRetMap[rid].boxCount += bCount;
      });
      lowPenetrationRetailersList = Object.values(lowStateRetMap).sort((a, b) => b.scansCount - a.scansCount);
    }

    // --- Retailer Health & Retention Intelligence Calculations ---
    const retDaysMap = {};
    const stateCatDiversity = {};
    let totalCatCount = 0;

    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      const d = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '');
      const st = s.State_Name;

      if (rid && d) {
        if (!retDaysMap[rid]) retDaysMap[rid] = new Set();
        retDaysMap[rid].add(d);
      }

      if (st && rid && s.Category_Name) {
        if (!stateCatDiversity[st]) stateCatDiversity[st] = {};
        if (!stateCatDiversity[st][rid]) stateCatDiversity[st][rid] = new Set();
        stateCatDiversity[st][rid].add(s.Category_Name);
      }
    });

    let consistentCount = 0;
    Object.values(retDaysMap).forEach(days => {
      if (days.size >= 10) consistentCount++;
    });

    Object.values(retCatMap).forEach(cats => {
      totalCatCount += cats.size;
    });
    const avgDiversity = uniqueRetailers > 0 ? (totalCatCount / uniqueRetailers).toFixed(2) : '0.00';

    let topDivState = '--';
    let maxDivAvg = 0;
    Object.entries(stateCatDiversity).forEach(([st, retMap]) => {
      const rets = Object.keys(retMap).length;
      const totalCats = Object.values(retMap).reduce((sum, set) => sum + set.size, 0);
      const avgDiv = rets > 0 ? totalCats / rets : 0;
      if (avgDiv > maxDivAvg) {
        maxDivAvg = avgDiv;
        topDivState = st;
      }
    });

    consistencyRetailersList = [];
    if (dashboardData && dashboardData.all_retailers) {
      dashboardData.all_retailers.forEach(r => {
        const totalScans = r.total_scans || r.scans || 0;
        let tier = 'One-Time';
        if (totalScans >= 50) tier = 'Loyal';
        else if (totalScans >= 20) tier = 'Regular';
        else if (totalScans >= 5) tier = 'Occasional';

        consistencyRetailersList.push({
          id: r.status_retailer_id || r.id || r.retailer_id,
          name: r.retailer_name || r.name || `Retailer ${r.id}`,
          mobile: r.mobile_number || r.mobile || 'N/A',
          city: r.city || 'N/A',
          state: r.State_Name || r.state || 'N/A',
          daysActive: r.active_days || 0,
          totalScans: totalScans,
          tier: tier
        });
      });
      const tierOrder = { 'Loyal': 0, 'Regular': 1, 'Occasional': 2, 'One-Time': 3 };
      consistencyRetailersList.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || b.totalScans - a.totalScans);
    }

    const elCrossSell = document.getElementById('kpiCrossSell');
    const elBronzeUpgrade = document.getElementById('kpiBronzeUpgrade');
    const elLowState = document.getElementById('kpiLowPenetrationState');
    const elLowStateSub = document.getElementById('kpiLowPenetrationSub');
    const elRevenue = document.getElementById('kpiRevenueGrowth');

    const elConsistent = document.getElementById('kpiConsistentRetailers');
    const elDiversity = document.getElementById('kpiCatDiversity');
    const elTopDivState = document.getElementById('kpiTopDiversityState');
    const elTopDivStateSub = document.getElementById('kpiTopDiversityStateSub');
    const elDormant = document.getElementById('kpiDormantRetailers');

    if (elCrossSell) elCrossSell.textContent = singleCatRets.toLocaleString();
    if (elBronzeUpgrade) elBronzeUpgrade.textContent = `+${bronzeUpgradeScans.toLocaleString()}`;
    if (elLowState) elLowState.textContent = lowestState;
    if (elLowStateSub) elLowStateSub.textContent = lowestState !== '--' ? `Low Ratio: ${lowestStateAvgScans.toFixed(1)} Scans/Store (${lowestStateTotalReg} Stores)` : '--';
    
    const elActCardCount = document.getElementById('kpi6MActiveCount') || document.getElementById('kpiJulyActiveCount');
    const elInactCardCount = document.getElementById('kpi6MInactiveCount') || document.getElementById('kpiInactiveRetailersCount');
    const elActRatePct = document.getElementById('kpiActivationRatePct');
    const elBtnActLabel = document.getElementById('btnActiveRetailersModalLabel');
    const elBtnInactLabel = document.getElementById('btnInactiveRetailersModalLabel');

    if (elActCardCount) elActCardCount.textContent = active6MonthCount.toLocaleString();
    if (elInactCardCount) elInactCardCount.textContent = inactive6MonthCount.toLocaleString();
    if (elBtnActLabel) elBtnActLabel.innerHTML = `<i class="fa-solid fa-circle-check"></i> View Active Retailers (${active6MonthCount.toLocaleString()}) &rarr;`;
    if (elBtnInactLabel) elBtnInactLabel.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> View Inactive Retailers (${inactive6MonthCount.toLocaleString()}) &rarr;`;

    // -------------------------------------------------------------
    // Strategic Opportunity Matrix Cards (Outside Cards Dynamic Sync)
    // -------------------------------------------------------------
    const elOpp1Count = document.getElementById('opp1Count');
    const elOpp2Count = document.getElementById('opp2Count');
    const elOpp2Sub = document.getElementById('opp2Sub');
    const elOpp3Count = document.getElementById('opp3Count');
    const elOpp4State = document.getElementById('opp4State');
    const elOpp5Count = document.getElementById('opp5Count');

    if (elOpp1Count) elOpp1Count.textContent = `${singleCatRetailersList.length.toLocaleString()} Retailers`;
    if (elOpp2Count) elOpp2Count.textContent = `${bronzeRetailersList.length.toLocaleString()} Retailers`;
    if (elOpp2Sub) {
      elOpp2Sub.innerHTML = `<strong id="opp2Count" style="color: #34D399;">${bronzeRetailersList.length.toLocaleString()} Retailers</strong> in Bronze (5-20 scans). Upgrading them to Silver (+10 scans) adds +${bronzeUpgradeScans.toLocaleString()} scans.`;
    }
    
    // Low activation distributors (<50% activation rate)
    let lowActDists = 6;
    if (dashboardData && Array.isArray(dashboardData.distributor_analysis)) {
      lowActDists = dashboardData.distributor_analysis.filter(d => d.active_percentage < 50).length;
    }
    if (elOpp3Count) elOpp3Count.textContent = `${lowActDists.toLocaleString()} Distributors`;
    if (elOpp4State) elOpp4State.textContent = lowestState !== '--' ? lowestState : 'Target State';
    if (elOpp5Count) elOpp5Count.textContent = `${dormantRetailersList.length.toLocaleString()} Silent Outlets`;

    if (elRevenue) elRevenue.textContent = `₹${(totalRevenue / 100000).toFixed(2)}L`; // Lakhs formatting

    if (elConsistent) elConsistent.textContent = consistentCount.toLocaleString();
    if (elDiversity) elDiversity.textContent = avgDiversity;
    if (elTopDivState) elTopDivState.textContent = topDivState;
    if (elTopDivStateSub) elTopDivStateSub.textContent = topDivState !== '--' ? `Avg ${maxDivAvg.toFixed(2)} categories/retailer` : '--';
    if (elDormant) elDormant.textContent = dormantRetailersList.length.toLocaleString();

    // --- Distributor & Territory Calculations ---
    const activeDistributors = new Set();
    const activeCities = new Set();
    
    filteredScans.forEach(s => {
      if (s.distributor_name) activeDistributors.add(s.distributor_name);
      if (s.city) activeCities.add(s.city);
    });

    const distCount = activeDistributors.size;
    const cityCount = activeCities.size;
    const scansPerDist = distCount > 0 ? (filteredScans.length / distCount) : 0;

    const elWfDistributor = document.getElementById('wfDistributor');
    const elWfRetailer = document.getElementById('wfRetailer');
    const elWfCompleted = document.getElementById('wfCompleted');

    if (elWfDistributor) elWfDistributor.textContent = distCount.toLocaleString();
    if (elWfRetailer) elWfRetailer.textContent = cityCount.toLocaleString();
    if (elWfCompleted) elWfCompleted.textContent = scansPerDist.toFixed(1).toLocaleString();

    // 1. Calculate Territory Penetration Details
    const territoryMap = {};
    filteredScans.forEach(s => {
      const cityKey = s.city || 'Unknown City';
      if (!territoryMap[cityKey]) {
        territoryMap[cityKey] = {
          city: cityKey,
          district: s.district || 'N/A',
          state: s.State_Name || 'N/A',
          zone: s.zone || 'N/A',
          retailers: new Set(),
          scansCount: 0,
          boxCount: 0
        };
      }
      const isB5 = s.uom === 'B5';
      const bCount = isB5 ? 0.5 : 1.0;
      const rid = s.status_retailer_id || s.retailer_id;
      
      territoryMap[cityKey].scansCount++;
      territoryMap[cityKey].boxCount += bCount;
      if (rid) territoryMap[cityKey].retailers.add(rid);
    });

    pendingRetailersList = Object.values(territoryMap).map(t => {
      const retCount = t.retailers.size;
      return {
        city: t.city,
        district: t.district,
        state: t.state,
        zone: t.zone,
        retailersCount: retCount,
        pendingCount: t.scansCount, // Keep pendingCount key to map with bar chart logic
        scansCount: t.scansCount,
        boxCount: t.boxCount,
        avgScans: retCount > 0 ? t.scansCount / retCount : 0
      };
    }).sort((a, b) => b.scansCount - a.scansCount);

    // 2. Calculate Distributor Performance Leaderboard Details
    const distMap = {};
    filteredScans.forEach(s => {
      const dname = s.distributor_name || 'Unknown Distributor';
      if (!distMap[dname]) {
        distMap[dname] = {
          name: dname,
          state: s.distributor_state || s.State_Name || 'N/A',
          city: s.city || s.zone || 'N/A',
          retailers: new Set(),
          scansCount: 0,
          boxCount: 0,
          b5Count: 0,   // B5 (half-box) scan count
          b10Count: 0   // B10 (full-box) scan count
        };
      }
      const isB5 = s.uom === 'B5';
      const bCount = isB5 ? 0.5 : 1.0;
      const rid = s.status_retailer_id || s.retailer_id;
      
      distMap[dname].scansCount++;
      distMap[dname].boxCount += bCount;
      if (isB5) distMap[dname].b5Count++;
      else      distMap[dname].b10Count++;
      if (rid) distMap[dname].retailers.add(rid);
    });

    // Build distributor master map from all_retailers for 100% consistent store counts across popups and state drilldowns
    const distMasterMap = {};
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      dashboardData.all_retailers.forEach(r => {
        const dName = r.distributor_name || '';
        if (!dName || dName.trim().toLowerCase() === 'unknown distributor' || dName.trim() === '') return;
        if (!distMasterMap[dName]) {
          distMasterMap[dName] = { totalReg: 0, activeCount: 0 };
        }
        distMasterMap[dName].totalReg++;
        if (Number(r.is_active_6m) === 1) {
          distMasterMap[dName].activeCount++;
        }
      });
    }

    pendingDistributorsList = Object.values(distMap).map(d => {
      const masterInfo = distMasterMap[d.name] || {};
      const overallTotalReg = (dashboardData && dashboardData.distributor_retailer_counts && (dashboardData.distributor_retailer_counts[d.name] || dashboardData.distributor_retailer_counts[d.name.toUpperCase()])) || masterInfo.totalReg || d.retailers.size;
      const active6M = masterInfo.activeCount || d.retailers.size;
      return {
        name: d.name,
        state: d.state,
        city: d.city,
        retailersCount: active6M,
        totalRegistered: overallTotalReg,
        pendingCount: d.scansCount,
        scansCount: d.scansCount,
        boxCount: d.boxCount,
        b5Count: d.b5Count,
        b10Count: d.b10Count,
        avgScans: active6M > 0 ? d.scansCount / active6M : 0
      };
    }).sort((a, b) => b.scansCount - a.scansCount);

    const elWfRetSub = document.getElementById('wfRetailerSub');
    if (elWfRetSub) elWfRetSub.textContent = `Across ${cityCount.toLocaleString()} active cities`;
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
      const d = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '');
      if (d && d !== 'None' && d !== 'null' && d !== 'NaT' && d !== 'Undefined') {
        dayCounts[d] = (dayCounts[d] || 0) + 1;
      }
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
    if (elInsRetAvg) elInsRetAvg.textContent = `${retAvg} scans/store`;
    if (elInsPeakDay) elInsPeakDay.textContent = peakCount > 0 ? `${peakDay} (${peakCount.toLocaleString()} scans)` : peakDay;
    if (elInsTopStateVol) elInsTopStateVol.textContent = elFilterState.value !== 'ALL' ? elFilterState.value : topStateVol;
    if (elInsTopStateVolShare) elInsTopStateVolShare.textContent = elFilterState.value !== 'ALL' ? '100%' : `${topStateVolShare}%`;
    if (elInsTopStateInt) elInsTopStateInt.textContent = topStateInt;
    if (elInsTopStateIntAvg) elInsTopStateIntAvg.textContent = `${topStateIntAvg.toFixed(1)} scans/store`;
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
      textColor: isLight ? '#334155' : '#CBD5E1',
      headingColor: isLight ? '#0F172A' : '#F8FAFC',
      gridColor: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
      tooltipBg: isLight ? '#0F172A' : '#1E293B',
      tooltipText: '#FFFFFF',
      palette: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#14B8A6', '#F97316', '#6366F1', '#A855F7']
    };
  }

  // Render All Interactive Charts Dynamically
    // -------------------------------------------------------------
  // Dynamic Category Performance Ranked Bar Graph Implementation
  // -------------------------------------------------------------
  function renderCategoryChartOnly() {
    const theme = getChartThemeColors();
    const catMap = {};
    let totalCatScans = 0;

    (filteredScans || []).forEach(s => {
      const cat = s.Category_Name || s.category_name || s.category || 'Other';
      if (!catMap[cat]) {
        catMap[cat] = { total: 0, b5: 0, b10: 0, boxes: 0 };
      }
      catMap[cat].total += 1;
      totalCatScans += 1;
      if (s.uom === 'B5') {
        catMap[cat].b5 += 1;
        catMap[cat].boxes += 0.5;
      } else {
        catMap[cat].b10 += 1;
        catMap[cat].boxes += 1.0;
      }
    });

    const sortedCats = Object.entries(catMap)
      .map(([name, d]) => ({
        name,
        total: d.total,
        b5: d.b5,
        b10: d.b10,
        boxes: d.boxes,
        pct: totalCatScans > 0 ? ((d.total / totalCatScans) * 100).toFixed(1) : '0.0',
        b5Pct: d.total > 0 ? ((d.b5 / d.total) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.total - a.total);

    const canvasCat = document.getElementById('categoryChart');
    if (!canvasCat) return;
    if (charts.category) {
      try { charts.category.destroy(); } catch (e) {}
    }
    const ctxCat = canvasCat.getContext('2d');

    charts.category = new Chart(ctxCat, {
      type: 'bar',
      data: {
        labels: sortedCats.map(c => c.name),
        datasets: [
          {
            label: 'B10 Scans (1.0 Box)',
            data: sortedCats.map(c => c.b10),
            backgroundColor: 'rgba(59, 130, 246, 0.85)',
            borderColor: '#60A5FA',
            borderWidth: 1,
            borderRadius: { topLeft: 4, bottomLeft: 4 },
            stack: 'categoryStack',
            barThickness: 20
          },
          {
            label: 'B5 Scans (0.5 Box)',
            data: sortedCats.map(c => c.b5),
            backgroundColor: 'rgba(16, 185, 129, 0.85)',
            borderColor: '#34D399',
            borderWidth: 1,
            borderRadius: { topRight: 4, bottomRight: 4 },
            stack: 'categoryStack',
            barThickness: 20
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: 60, left: 10, top: 10, bottom: 10 }
        },
        interaction: { mode: 'nearest', intersect: false },
        onHover: (evt, elements) => {
          const target = evt?.native?.target || evt?.target;
          if (target) target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
        },
        onClick: (event, elements, chart) => {
          let active = elements;
          if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
            try { active = chart.getElementsAtEventForMode(event.native || event, 'nearest', { intersect: false }, true); } catch (e) {}
          }
          if (active && active.length > 0) {
            const idx = active[0].index;
            const dsIdx = active[0].datasetIndex;
            const clickedCat = sortedCats[idx]?.name;
            const packType = dsIdx === 1 ? 'B5' : (dsIdx === 0 ? 'B10' : 'ALL');
            if (clickedCat && typeof openCategoryProductModal === 'function') {
              openCategoryProductModal(clickedCat, null, packType);
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: theme.textColor,
              font: { size: 11, weight: 'bold' },
              boxWidth: 14
            }
          },
          datalabels: {
            display: true,
            color: '#93C5FD',
            anchor: 'end',
            align: 'end',
            offset: 8,
            clip: false,
            font: { size: 10.5, weight: '700' },
            formatter: (val, ctx) => {
              if (ctx.datasetIndex === 1 || (ctx.datasetIndex === 0 && (!sortedCats[ctx.dataIndex]?.b5))) {
                const item = sortedCats[ctx.dataIndex];
                return item ? `${item.total.toLocaleString()} (${item.pct}%)` : '';
              }
              return '';
            }
          },
          tooltip: {
            backgroundColor: 'rgba(8,18,36,0.95)',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: (items) => `Category: ${items[0]?.label || ''}`,
              label: (ctx) => {
                const item = sortedCats[ctx.dataIndex];
                if (!item) return '';
                if (ctx.datasetIndex === 0) {
                  return `  B10 Standard Scans : ${item.b10.toLocaleString()}`;
                } else {
                  return `  B5 Half-Box Scans  : ${item.b5.toLocaleString()} (${item.b5Pct}% B5 Mix)`;
                }
              },
              afterBody: (items) => {
                const item = sortedCats[items[0]?.dataIndex];
                if (!item) return [];
                return [
                  `  ────────────────────────────`,
                  `  Total Scans : ${item.total.toLocaleString()} (${item.pct}% Market Share)`,
                  `  Standard Boxes : ${item.boxes.toFixed(1)} Boxes`,
                  `  Click bar to view retailer & SKU breakdown`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grace: '20%',
            grid: { color: theme.gridColor },
            ticks: { color: theme.textColor, font: { size: 10 } },
            title: { display: true, text: 'Total Scans (B10 + B5)', color: theme.textColor, font: { size: 11, weight: 'bold' } }
          },
          y: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: '#F1F5F9',
              font: { size: 11, weight: '700' }
            }
          }
        }
      }
    });

    canvasCat.onclick = (e) => {
      if (!charts.category) return;
      const activePoints = charts.category.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
      if (activePoints && activePoints.length > 0) {
        const idx = activePoints[0].index;
        const dsIdx = activePoints[0].datasetIndex;
        const clickedCat = sortedCats[idx]?.name;
        const packType = dsIdx === 1 ? 'B5' : (dsIdx === 0 ? 'B10' : 'ALL');
        if (clickedCat && typeof openCategoryProductModal === 'function') {
          openCategoryProductModal(clickedCat, null, packType);
        }
      }
    };
  }
  window.renderCategoryChartOnly = renderCategoryChartOnly;
  window.setCategoryChartView = function() { renderCategoryChartOnly(); };

  function renderCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js library is not loaded. Charts will not render until Chart.js is loaded.');
      return;
    }
    const theme = getChartThemeColors();

    // -------------------------------------------------------------
    // 1. Dynamic Daily Trend Chart (Dynamic for any date range)
    // -------------------------------------------------------------
    const dailyMap = {};
    filteredScans.forEach(s => {
      const d = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '');
      if (!d || d === 'NaT' || d === 'None' || d === 'null') return;
      if (!dailyMap[d]) {
        dailyMap[d] = { total: 0, b5: 0, b10: 0 };
      }
      dailyMap[d].total += 1;
      if (s.uom === 'B5') dailyMap[d].b5 += 1;
      else dailyMap[d].b10 += 1;
    });

    const sortedDates = Object.keys(dailyMap).sort();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const dailyLabels = sortedDates.map(d => {
      const parts = d.split('-');
      if (parts.length === 3) {
        const mIdx = parseInt(parts[1], 10) - 1;
        const dayNum = parseInt(parts[2], 10);
        return `${monthNames[mIdx] || ''} ${dayNum}`;
      }
      return d;
    });

    const dailyTotals = sortedDates.map(d => dailyMap[d].total);
    const dailyB5 = sortedDates.map(d => dailyMap[d].b5);
    const dailyB10 = sortedDates.map(d => dailyMap[d].b10);

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

    if (charts.stateAnalysis) {
      try { charts.stateAnalysis.destroy(); } catch (e) {}
      charts.stateAnalysis = null;
    }
    const elStateChart = document.getElementById('stateAnalysisChart');
    if (elStateChart) {
      const ctxState = elStateChart.getContext('2d');
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
        onClick: (event, elements) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            const clickedLabel = stateLabels[index];
            if (clickedLabel) {
              if (selectedState === 'ALL') {
                showTerritoryFlowPage('STATE', clickedLabel);
              } else {
                showTerritoryFlowPage('DISTRICT', clickedLabel);
              }
            }
          }
        },
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
    }

    // -------------------------------------------------------------
    // 3. Dynamic Category Performance Ranked Bar Graph (No Doughnut)
    // -------------------------------------------------------------
    renderCategoryChartOnly();

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

    const elTierCanvas = document.getElementById('retailerTierChart');
    if (elTierCanvas) {
      if (charts.retailerTier) {
        try { charts.retailerTier.destroy(); } catch (e) {}
        charts.retailerTier = null;
      }
      const ctxTier = elTierCanvas.getContext('2d');
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
        },
        onClick: (event, elements) => {
          if (elements && elements.length > 0) {
            const idx = elements[0].index;
            const label = Object.keys(tiers)[idx];
            if (label.includes('Bronze')) openBronzeModal();
            else if (label.includes('Low')) openUpsellModal();
            else if (label.includes('Gold') || label.includes('Silver')) openConsistencyModal();
          }
        }
      }
    });
    }

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

    // -------------------------------------------------------------
    // 7. Dynamic Top 10 Power Retailers Chart
    // -------------------------------------------------------------
    const retailerMap = {};
    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      const name = s.retailer_name || rid;
      const loc = (s.city && s.State_Name) ? `${s.city}, ${s.State_Name}` : '';
      const label = loc ? `${name} (${loc})` : name;
      if (!retailerMap[rid]) {
        retailerMap[rid] = { rid: rid, name: label, total: 0 };
      }
      retailerMap[rid].total += 1;
    });

    const sortedRetailers = Object.values(retailerMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const retLabels = sortedRetailers.map(r => r.name);
    const retVolumes = sortedRetailers.map(r => r.total);

    if (charts.topRetailers) charts.topRetailers.destroy();
    const ctxTopRet = document.getElementById('topRetailersChart').getContext('2d');
    charts.topRetailers = new Chart(ctxTopRet, {
      type: 'bar',
      data: {
        labels: retLabels,
        datasets: [{
          label: 'Total Scans',
          data: retVolumes,
          backgroundColor: 'rgba(245, 158, 11, 0.85)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        interaction: { mode: 'nearest', intersect: false },
        onHover: (evt, elements) => {
          const target = evt?.native?.target || evt?.target;
          if (target) target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
        },
        onClick: (event, elements, chart) => {
          let active = elements;
          if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
            try { active = chart.getElementsAtEventForMode(event.native || event, 'nearest', { intersect: false }, true); } catch (e) {}
          }
          if (active && active.length > 0) {
            const idx = active[0].index;
            const r = sortedRetailers[idx];
            if (r) {
              const fullRet = (dashboardData && Array.isArray(dashboardData.all_retailers))
                ? dashboardData.all_retailers.find(x => String(x.status_retailer_id || x.retailer_id) === String(r.rid || r.status_retailer_id))
                : null;
              const retObj = fullRet || { status_retailer_id: r.rid, retailer_name: r.name, total_scans: r.total, scans_6m: r.total };
              if (typeof openRetailerDrawer === 'function') {
                openRetailerDrawer(retObj);
              } else if (typeof handleRetailerClick === 'function') {
                handleRetailerClick(r.rid);
              }
            }
          }
        },
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: theme.gridColor }, ticks: { color: theme.textColor } },
          y: { grid: { display: false }, ticks: { color: theme.textColor, font: { size: 10 } } }
        }
      }
    });

    ctxTopRet.canvas.onclick = (e) => {
      if (!charts.topRetailers) return;
      const activePoints = charts.topRetailers.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
      if (activePoints && activePoints.length > 0) {
        const idx = activePoints[0].index;
        const r = sortedRetailers[idx];
        if (r) {
          const fullRet = (dashboardData && Array.isArray(dashboardData.all_retailers))
            ? dashboardData.all_retailers.find(x => String(x.status_retailer_id || x.retailer_id) === String(r.rid || r.status_retailer_id))
            : null;
          const retObj = fullRet || { status_retailer_id: r.rid, retailer_name: r.name, total_scans: r.total, scans_6m: r.total };
          if (typeof openRetailerDrawer === 'function') openRetailerDrawer(retObj);
        }
      }
    };

    // -------------------------------------------------------------
    // 8. Dynamic Hourly Scan Activity Chart
    // -------------------------------------------------------------
    const hourlyMap = {};
    for (let i = 0; i < 24; i++) hourlyMap[i] = 0;

    filteredScans.forEach(s => {
      if (s.retailer_scanned_at) {
        if (typeof s.retailer_scanned_at === 'string') {
          const parts = s.retailer_scanned_at.split(' ');
          if (parts.length > 1) {
            const timeParts = parts[1].split(':');
            const hour = parseInt(timeParts[0], 10);
            if (!isNaN(hour)) hourlyMap[hour] += 1;
          }
        }
      }
    });

    // Show typical active hours (e.g. 7 AM to 10 PM)
    const hourLabels = [];
    const hourData = [];
    for (let i = 7; i <= 22; i++) {
      hourLabels.push(i + ':00');
      hourData.push(hourlyMap[i]);
    }

    if (charts.hourlyActivity) charts.hourlyActivity.destroy();
    const ctxHourly = document.getElementById('hourlyActivityChart').getContext('2d');
    charts.hourlyActivity = new Chart(ctxHourly, {
      type: 'line',
      data: {
        labels: hourLabels,
        datasets: [{
          label: 'Scan Volume',
          data: hourData,
          borderColor: '#0EA5E9',
          backgroundColor: 'rgba(14, 165, 233, 0.15)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#0EA5E9'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: theme.gridColor }, ticks: { color: theme.textColor, font: { size: 10 } } },
          y: { grid: { color: theme.gridColor }, ticks: { color: theme.textColor }, title: { display: true, text: 'Scans', color: theme.textColor } }
        }
      }
    });
    // -------------------------------------------------------------
    // 9. Distributor Volume Performance Leaderboard Chart
    // -------------------------------------------------------------
    const distMap = {};
    let grandTotalScans = Math.max(1, filteredScans.length);

    filteredScans.forEach(s => {
      const dname = s.distributor_name || 'Unknown Distributor';
      if (!distMap[dname]) {
        distMap[dname] = { name: dname, scans: 0, b5Scans: 0, b10Scans: 0, boxes: 0, retailers: new Set() };
      }
      distMap[dname].scans += 1;
      const isB5 = s.uom === 'B5';
      distMap[dname].boxes += (isB5 ? 0.5 : 1.0);
      if (isB5) distMap[dname].b5Scans += 1;
      else distMap[dname].b10Scans += 1;
      distMap[dname].retailers.add(s.status_retailer_id || s.retailer_id);
    });

    const sortedDistsList = Object.values(distMap).sort((a, b) => b.scans - a.scans);

    // Update Quick Stats Header Bar
    const elStatsBar = document.getElementById('distributorLeaderboardStats');
    if (elStatsBar) {
      if (sortedDistsList.length > 0) {
        const top1 = sortedDistsList[0];
        const top1Share = ((top1.scans / grandTotalScans) * 100).toFixed(1);
        elStatsBar.innerHTML = `
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); padding: 4px 10px; border-radius: var(--radius-sm); font-size: 11px; color: #FBBF24; display: flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-crown text-amber"></i> <strong>#1 Leader:</strong> ${escapeHTML(top1.name)} (${top1.scans.toLocaleString()} scans | ${top1Share}% share)
          </div>
          <div style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: var(--radius-sm); font-size: 11px; color: var(--text-secondary);">
            <i class="fa-solid fa-warehouse"></i> Active Channels: <strong>${sortedDistsList.length}</strong>
          </div>
        `;
      } else {
        elStatsBar.innerHTML = `<div style="font-size: 11px; color: var(--text-muted);">No distributor data available.</div>`;
      }
    }

    // Top 8 Distributors for crisp, readable chart rendering
    const topDists = sortedDistsList.slice(0, 8);

    const distLabels = topDists.map((d, idx) => {
      const rank = `#${idx + 1}`;
      const name = d.name.length > 20 ? d.name.slice(0, 18) + '...' : d.name;
      return `${rank} ${name}`;
    });

    const distData = topDists.map(d => d.scans);
    const rankColors = [
      '#F59E0B', // #1 Gold
      '#3B82F6', // #2 Blue
      '#10B981', // #3 Emerald
      '#8B5CF6', // #4 Purple
      '#06B6D4', // #5 Cyan
      '#6366F1', // #6 Indigo
      '#EC4899', // #7 Pink
      '#64748B'  // #8 Slate
    ];

    if (charts.workflowFunnel) charts.workflowFunnel.destroy();
    const ctxWf = document.getElementById('workflowFunnelChart').getContext('2d');
    charts.workflowFunnel = new Chart(ctxWf, {
      type: 'bar',
      data: {
        labels: distLabels,
        datasets: [{
          label: 'Total Scans',
          data: distData,
          backgroundColor: rankColors.slice(0, topDists.length),
          borderRadius: 6,
          barThickness: 22
        }]
      },
      options: {
        indexAxis: 'y', // Horizontal Bar Chart
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function(items) {
                const idx = items[0].dataIndex;
                const d = topDists[idx];
                return `#${idx + 1} ${d.name}`;
              },
              label: function(context) {
                const idx = context.dataIndex;
                const d = topDists[idx];
                const pct = ((d.scans / grandTotalScans) * 100).toFixed(1);
                return [
                  ` Volume: ${d.scans.toLocaleString()} Scans (${pct}% National Share)`,
                  ` Box Count: ${d.boxes.toFixed(1)} Calculated Boxes`,
                  ` Active Outlets: ${d.retailers.size} Retailers`
                ];
              }
            }
          }
        },
        scales: {
          x: { 
            grid: { color: theme.gridColor }, 
            ticks: { color: theme.textColor, font: { size: 11 } }
          },
          y: { 
            grid: { display: false }, 
            ticks: { color: theme.textColor, font: { weight: 'bold', size: 11 } } 
          }
        }
      }
    });
    // -------------------------------------------------------------
    // Top 20 Active Retailers Chart (6-Month History & Category Breakdown)
    // -------------------------------------------------------------
    const canvasTop20 = document.getElementById('chartTop20Active6M');
    if (canvasTop20) {
      let top20Data = (dashboardData && dashboardData.top_20_active_retailers_6m) || [];
      if (top20Data.length === 0) {
        if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
          top20Data = dashboardData.all_retailers
            .sort((a, b) => (b.scans_6m || 0) - (a.scans_6m || 0))
            .slice(0, 20)
            .map(r => ({
              retailer_name: r.retailer_name || `Retailer ${r.status_retailer_id}`,
              distributor_name: r.distributor_name || 'N/A',
              scans_6m: r.scans_6m || 0,
              boxes_6m: r.boxes_6m || 0,
              scans_july: r.total_scans || 0,
              boxes_july: r.box_count || 0,
              city: r.city || '',
              state: r.State_Name || ''
            }));
        }
      }

      const labels20 = top20Data.map((r, i) => `#${i + 1} ${r.retailer_name.length > 15 ? r.retailer_name.slice(0, 14) + '...' : r.retailer_name}`);
      const scans6mVal = top20Data.map(r => r.scans_6m || r.scans_july);
      const scansJulyVal = top20Data.map(r => r.scans_july);

      if (charts.top20Active6M) charts.top20Active6M.destroy();
      const ctxTop20 = canvasTop20.getContext('2d');
      charts.top20Active6M = new Chart(ctxTop20, {
        type: 'bar',
        data: {
          labels: labels20,
          datasets: [
            {
              label: '6-Month Historical Scans (Jan-Jun 2026)',
              data: scans6mVal,
              backgroundColor: '#3B82F6',
              borderRadius: 4,
              barThickness: 16
            },
            {
              label: 'July 2026 Active Scans',
              data: scansJulyVal,
              backgroundColor: '#10B981',
              borderRadius: 4,
              barThickness: 16
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: theme.textColor, font: { size: 11 } } },
            tooltip: {
              callbacks: {
                title: function(items) {
                  const idx = items[0].dataIndex;
                  const item = top20Data[idx];
                  return `${item.retailer_name} (${item.city || item.state || ''})`;
                },
                label: function(ctx) {
                  const idx = ctx.dataIndex;
                  const item = top20Data[idx];
                  return [
                    ` Primary Distributor: ${item.distributor_name}`,
                    ` 6-Month Scans: ${(item.scans_6m || 0).toLocaleString()} (${(item.boxes_6m || 0).toFixed(1)} Boxes)`,
                    ` July 2026 Scans: ${(item.scans_july || 0).toLocaleString()} (${(item.boxes_july || 0).toFixed(1)} Boxes)`
                  ];
                }
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: theme.textColor, font: { size: 10 }, maxRotation: 45, minRotation: 45 }
            },
            y: {
              beginAtZero: true,
              grid: { color: theme.gridColor },
              ticks: { color: theme.textColor, font: { size: 11 } }
            }
          }
        }
      });
    }

    // -------------------------------------------------------------
    // 10. Cross-Sell Opportunity Pie Chart
    // -------------------------------------------------------------
    const rCatMap = {};
    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      if (!rCatMap[rid]) rCatMap[rid] = new Set();
      if (s.Category_Name) rCatMap[rid].add(s.Category_Name);
    });

    let singleCatRetsCount = 0;
    let multiCatRetsCount = 0;
    Object.values(rCatMap).forEach(cats => {
      if (cats.size === 1) singleCatRetsCount++;
      else if (cats.size > 1) multiCatRetsCount++;
    });

    const totalRets = singleCatRetsCount + multiCatRetsCount;
    const p1 = totalRets ? ((singleCatRetsCount / totalRets) * 100).toFixed(1) + '%' : '0%';
    const p2 = totalRets ? ((multiCatRetsCount / totalRets) * 100).toFixed(1) + '%' : '0%';

    const elCrossCanvas = document.getElementById('crossSellPieChart');
    if (elCrossCanvas) {
      if (charts.crossSellPie) {
        try { charts.crossSellPie.destroy(); } catch (e) {}
        charts.crossSellPie = null;
      }
      const ctxCross = elCrossCanvas.getContext('2d');
      charts.crossSellPie = new Chart(ctxCross, {
      type: 'pie',
      data: {
        labels: [
          `1 Category Only: ${singleCatRetsCount.toLocaleString()} Retailers (${p1})`, 
          `2+ Categories: ${multiCatRetsCount.toLocaleString()} Retailers (${p2})`
        ],
        datasets: [{
          data: [singleCatRetsCount, multiCatRetsCount],
          backgroundColor: ['#0EA5E9', '#8B5CF6'],
          borderWidth: 2,
          borderColor: document.body.classList.contains('theme-light') ? '#FFFFFF' : '#131B2E'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: theme.textColor, font: { size: 12, weight: 'bold' } } },
          tooltip: {
            callbacks: {
              label: function(context) { return ` ${context.raw.toLocaleString()} Retailers`; }
            }
          }
        }
      }
    });
    }
  }

  // Render All Tables & Territory Flow Dynamically
  function renderAllTables() {
    renderQuery1Table();
    renderRetailersTable();
    renderStatesTable();
    renderCategoriesTable();
    renderIndiaMap();
    renderDistributorLeaderboardMatrix();
    renderStateCategoryMatrix();
    renderDrillDownTable();
    renderTerritoryFlowNavigation();
    renderTerritoryFlowCards();
    renderNetworkTree();
  }

  // Interactive Territory Flow Control Functions
  function updateDashboard() {
    renderTerritoryFlowNavigation();
    renderTerritoryFlowCards();
    renderTerritoryFlowCharts();
    renderTerritoryFlowSheet();
    renderDrillDownTable();
  }

  function setTerritoryLevel(level) {
    territoryFlow.level = level;
    if (level === 'STATE') {
      territoryFlow.selectedState = null;
      territoryFlow.selectedDistrict = null;
      territoryFlow.selectedZone = null;
      territoryFlow.selectedDistributor = null;
      territoryFlow.selectedRetailer = null;
      if (elFilterState) elFilterState.value = 'ALL';
    } else if (level === 'DISTRICT') {
      territoryFlow.selectedDistrict = null;
      territoryFlow.selectedZone = null;
      territoryFlow.selectedDistributor = null;
      territoryFlow.selectedRetailer = null;
    } else if (level === 'ZONE') {
      territoryFlow.selectedZone = null;
      territoryFlow.selectedDistributor = null;
      territoryFlow.selectedRetailer = null;
    } else if (level === 'DISTRIBUTOR') {
      territoryFlow.selectedDistributor = null;
      territoryFlow.selectedRetailer = null;
    }
    updateDashboard();
  }

  function drillToTerritoryStep(targetLevel, nameValue) {
    if (targetLevel === 'STATE') {
      territoryFlow.selectedState = nameValue;
      territoryFlow.level = 'DISTRICT';
      if (elFilterState) {
        const optExists = Array.from(elFilterState.options).some(o => o.value === nameValue);
        if (optExists) elFilterState.value = nameValue;
      }
    } else if (targetLevel === 'DISTRICT') {
      territoryFlow.selectedDistrict = nameValue;
      territoryFlow.level = 'ZONE';
    } else if (targetLevel === 'ZONE') {
      territoryFlow.selectedZone = nameValue;
      territoryFlow.level = 'DISTRIBUTOR';
    } else if (targetLevel === 'DISTRIBUTOR') {
      territoryFlow.selectedDistributor = nameValue;
      territoryFlow.level = 'RETAILER';
    } else if (targetLevel === 'RETAILER') {
      territoryFlow.selectedRetailer = nameValue;
    }
    updateDashboard();
  }

  window.handleTerritoryCrumb = function(level, name) {
    if (level === 'STATE') {
      territoryFlow.level = 'STATE';
      territoryFlow.selectedState = null;
      territoryFlow.selectedDistrict = null;
      territoryFlow.selectedZone = null;
      territoryFlow.selectedDistributor = null;
      territoryFlow.selectedRetailer = null;
      if (elFilterState) elFilterState.value = 'ALL';
    } else if (level === 'DISTRICT') {
      territoryFlow.level = 'DISTRICT';
      territoryFlow.selectedDistrict = null;
      territoryFlow.selectedZone = null;
      territoryFlow.selectedDistributor = null;
      territoryFlow.selectedRetailer = null;
    } else if (level === 'ZONE') {
      territoryFlow.level = 'ZONE';
      territoryFlow.selectedZone = null;
      territoryFlow.selectedDistributor = null;
      territoryFlow.selectedRetailer = null;
    } else if (level === 'DISTRIBUTOR') {
      territoryFlow.level = 'DISTRIBUTOR';
      territoryFlow.selectedDistributor = null;
      territoryFlow.selectedRetailer = null;
    } else if (level === 'RETAILER') {
      territoryFlow.level = 'RETAILER';
    }
    updateDashboard();
  };

  window.handleTerritoryCardClick = function(level, name) {
    showTerritoryFlowPage(level, name);
  };

  function renderTerritoryFlowNavigation() {
    const elBreadcrumbs = [
      document.getElementById('territoryBreadcrumb'),
      document.getElementById('pageTerritoryBreadcrumb')
    ].filter(Boolean);

    const elPillsList = [
      document.getElementById('territoryLevelPills'),
      document.getElementById('pageTerritoryLevelPills')
    ].filter(Boolean);

    if (elBreadcrumbs.length === 0) return;

    let crumbsHtml = `<span class="crumb-item ${!territoryFlow.selectedState ? 'active' : ''}" data-crumb-level="STATE"><i class="fa-solid fa-earth-asia"></i> All States (National)</span>`;
    
    if (territoryFlow.selectedState) {
      crumbsHtml += `<span class="crumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
        <span class="crumb-item ${territoryFlow.level === 'DISTRICT' && !territoryFlow.selectedDistrict ? 'active' : ''}" data-crumb-level="DISTRICT" data-crumb-name="${escapeHTML(territoryFlow.selectedState)}"><i class="fa-solid fa-map-location-dot"></i> State: <strong>${escapeHTML(territoryFlow.selectedState)}</strong></span>`;
    }
    if (territoryFlow.selectedDistrict) {
      crumbsHtml += `<span class="crumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
        <span class="crumb-item ${territoryFlow.level === 'ZONE' && !territoryFlow.selectedZone ? 'active' : ''}" data-crumb-level="ZONE" data-crumb-name="${escapeHTML(territoryFlow.selectedDistrict)}"><i class="fa-solid fa-city"></i> District: <strong>${escapeHTML(territoryFlow.selectedDistrict)}</strong></span>`;
    }
    if (territoryFlow.selectedZone) {
      crumbsHtml += `<span class="crumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
        <span class="crumb-item ${territoryFlow.level === 'DISTRIBUTOR' && !territoryFlow.selectedDistributor ? 'active' : ''}" data-crumb-level="DISTRIBUTOR" data-crumb-name="${escapeHTML(territoryFlow.selectedZone)}"><i class="fa-solid fa-layer-group"></i> Zone: <strong>${escapeHTML(territoryFlow.selectedZone)}</strong></span>`;
    }
    if (territoryFlow.selectedDistributor) {
      crumbsHtml += `<span class="crumb-separator"><i class="fa-solid fa-chevron-right"></i></span>
        <span class="crumb-item ${territoryFlow.level === 'RETAILER' ? 'active' : ''}" data-crumb-level="RETAILER" data-crumb-name="${escapeHTML(territoryFlow.selectedDistributor)}"><i class="fa-solid fa-warehouse"></i> Distributor: <strong>${escapeHTML(territoryFlow.selectedDistributor)}</strong></span>`;
    }

    elBreadcrumbs.forEach(bc => bc.innerHTML = crumbsHtml);

    elPillsList.forEach(pills => {
      pills.querySelectorAll('.level-pill-btn').forEach(btn => {
        const lvl = btn.getAttribute('data-level');
        if (lvl === territoryFlow.level) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    });
  }

  function renderTerritoryFlowCards() {
    const elCardContainers = [
      document.getElementById('territoryFlowCards'),
      document.getElementById('pageTerritoryCardsGrid')
    ].filter(Boolean);

    if (elCardContainers.length === 0) return;

    let scopedScans = filteredScans;
    if (territoryFlow.selectedState) {
      scopedScans = scopedScans.filter(s => (s.State_Name || 'Unknown State') === territoryFlow.selectedState);
    }
    if (territoryFlow.selectedDistrict) {
      scopedScans = scopedScans.filter(s => (s.district || s.city || 'Unknown District') === territoryFlow.selectedDistrict);
    }
    if (territoryFlow.selectedZone) {
      scopedScans = scopedScans.filter(s => (s.zone || 'Unknown Zone') === territoryFlow.selectedZone);
    }
    if (territoryFlow.selectedDistributor) {
      scopedScans = scopedScans.filter(s => (s.distributor_name || 'Unknown Distributor') === territoryFlow.selectedDistributor);
    }

    let cardsHtml = '';
    const groupMap = {};

    if (territoryFlow.level === 'STATE') {
      scopedScans.forEach(s => {
        const key = s.State_Name || 'Unknown State';
        if (!groupMap[key]) groupMap[key] = { scans: 0, boxes: 0, retailers: new Set() };
        groupMap[key].scans += 1;
        groupMap[key].boxes += (s.uom === 'B5' ? 0.5 : 1.0);
        groupMap[key].retailers.add(s.status_retailer_id || s.retailer_id);
      });

      const sorted = Object.entries(groupMap).sort((a,b) => b[1].scans - a[1].scans);
      sorted.forEach(([name, data]) => {
        cardsHtml += `
          <div class="terr-flow-card" data-target-level="STATE" data-target-name="${escapeHTML(name)}">
            <div class="terr-flow-card-header">
              <div>
                <div class="terr-flow-card-title"><i class="fa-solid fa-map-location-dot text-primary"></i> ${escapeHTML(name)}</div>
                <div class="terr-flow-card-sub">${data.retailers.size} Active Retailers</div>
              </div>
              <span class="badge pill-blue">${data.scans.toLocaleString()} Scans</span>
            </div>
            <div class="terr-flow-stats">
              <span>Boxes: <strong style="color: var(--accent-amber);">${data.boxes.toFixed(1)}</strong></span>
              <span>Avg: <strong>${(data.scans / (data.retailers.size || 1)).toFixed(1)}</strong>/outlet</span>
            </div>
            <button class="btn-drill-step">Drill into Districts <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        `;
      });
    } else if (territoryFlow.level === 'DISTRICT') {
      scopedScans.forEach(s => {
        const key = s.district || s.city || 'Unknown District';
        if (!groupMap[key]) groupMap[key] = { scans: 0, boxes: 0, retailers: new Set() };
        groupMap[key].scans += 1;
        groupMap[key].boxes += (s.uom === 'B5' ? 0.5 : 1.0);
        groupMap[key].retailers.add(s.status_retailer_id || s.retailer_id);
      });

      const sorted = Object.entries(groupMap).sort((a,b) => b[1].scans - a[1].scans);
      sorted.forEach(([name, data]) => {
        cardsHtml += `
          <div class="terr-flow-card" data-target-level="DISTRICT" data-target-name="${escapeHTML(name)}">
            <div class="terr-flow-card-header">
              <div>
                <div class="terr-flow-card-title"><i class="fa-solid fa-city text-emerald"></i> ${escapeHTML(name)}</div>
                <div class="terr-flow-card-sub">${data.retailers.size} Outlets in District</div>
              </div>
              <span class="badge pill-emerald">${data.scans.toLocaleString()} Scans</span>
            </div>
            <div class="terr-flow-stats">
              <span>Boxes: <strong style="color: var(--accent-amber);">${data.boxes.toFixed(1)}</strong></span>
              <span>Intensity: <strong>${(data.scans / (data.retailers.size || 1)).toFixed(1)}</strong></span>
            </div>
            <button class="btn-drill-step">Drill into Zones <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        `;
      });
    } else if (territoryFlow.level === 'ZONE') {
      scopedScans.forEach(s => {
        const key = s.zone || 'Unknown Zone';
        if (!groupMap[key]) groupMap[key] = { scans: 0, boxes: 0, retailers: new Set() };
        groupMap[key].scans += 1;
        groupMap[key].boxes += (s.uom === 'B5' ? 0.5 : 1.0);
        groupMap[key].retailers.add(s.status_retailer_id || s.retailer_id);
      });

      const sorted = Object.entries(groupMap).sort((a,b) => b[1].scans - a[1].scans);
      sorted.forEach(([name, data]) => {
        cardsHtml += `
          <div class="terr-flow-card" data-target-level="ZONE" data-target-name="${escapeHTML(name)}">
            <div class="terr-flow-card-header">
              <div>
                <div class="terr-flow-card-title"><i class="fa-solid fa-layer-group text-purple"></i> ${escapeHTML(name)} Zone</div>
                <div class="terr-flow-card-sub">${data.retailers.size} Retail Outlets</div>
              </div>
              <span class="badge pill-purple">${data.scans.toLocaleString()} Scans</span>
            </div>
            <div class="terr-flow-stats">
              <span>Boxes: <strong style="color: var(--accent-amber);">${data.boxes.toFixed(1)}</strong></span>
              <span>Intensity: <strong>${(data.scans / (data.retailers.size || 1)).toFixed(1)}</strong></span>
            </div>
            <button class="btn-drill-step">Drill into Distributors <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        `;
      });
    } else if (territoryFlow.level === 'DISTRIBUTOR') {
      scopedScans.forEach(s => {
        const key = s.distributor_name || 'Unknown Distributor';
        if (!groupMap[key]) groupMap[key] = { scans: 0, boxes: 0, retailers: new Set() };
        groupMap[key].scans += 1;
        groupMap[key].boxes += (s.uom === 'B5' ? 0.5 : 1.0);
        groupMap[key].retailers.add(s.status_retailer_id || s.retailer_id);
      });

      const sorted = Object.entries(groupMap).sort((a,b) => b[1].scans - a[1].scans);
      sorted.forEach(([name, data]) => {
        cardsHtml += `
          <div class="terr-flow-card" data-target-level="DISTRIBUTOR" data-target-name="${escapeHTML(name)}">
            <div class="terr-flow-card-header">
              <div>
                <div class="terr-flow-card-title"><i class="fa-solid fa-warehouse text-amber"></i> ${escapeHTML(name)}</div>
                <div class="terr-flow-card-sub">${data.retailers.size} Retail Partners</div>
              </div>
              <span class="badge pill-amber">${data.scans.toLocaleString()} Scans</span>
            </div>
            <div class="terr-flow-stats">
              <span>Boxes: <strong style="color: var(--accent-amber);">${data.boxes.toFixed(1)}</strong></span>
              <span>Run-Rate: <strong>${(data.scans / 31).toFixed(1)}</strong>/day</span>
            </div>
            <button class="btn-drill-step">View Retailer List <i class="fa-solid fa-arrow-right"></i></button>
          </div>
        `;
      });
    } else if (territoryFlow.level === 'RETAILER') {
      scopedScans.forEach(s => {
        const key = (s.retailer_name || 'Unknown Retailer') + ' (ID: ' + (s.status_retailer_id || s.retailer_id || 'UNK') + ')';
        if (!groupMap[key]) groupMap[key] = { scans: 0, boxes: 0, city: s.city || s.district || '', phone: s.mobile_number || '' };
        groupMap[key].scans += 1;
        groupMap[key].boxes += (s.uom === 'B5' ? 0.5 : 1.0);
      });

      const sorted = Object.entries(groupMap).sort((a,b) => b[1].scans - a[1].scans).slice(0, 30);
      sorted.forEach(([name, data]) => {
        cardsHtml += `
          <div class="terr-flow-card" style="cursor: default;">
            <div class="terr-flow-card-header">
              <div>
                <div class="terr-flow-card-title"><i class="fa-solid fa-store text-cyan"></i> ${escapeHTML(name)}</div>
                <div class="terr-flow-card-sub">${escapeHTML(data.city)} ${data.phone ? '• ' + data.phone : ''}</div>
              </div>
              <span class="badge pill-cyan">${data.scans.toLocaleString()} Scans</span>
            </div>
            <div class="terr-flow-stats">
              <span>Calculated Boxes: <strong style="color: var(--accent-amber);">${data.boxes.toFixed(1)}</strong></span>
              <span>Status: <strong style="color: var(--accent-emerald);">Active</strong></span>
            </div>
          </div>
        `;
      });
    }

    if (!cardsHtml) {
      cardsHtml = `<div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        No territory flow records found for current selection. Click <strong>All States</strong> above to reset.
      </div>`;
    }

    elCardContainers.forEach(c => c.innerHTML = cardsHtml);
  }

  // Tab 5: Drill-Down Matrix Engine
  function renderDrillDownTable() {
    const tbody = document.getElementById('tblDrillDownBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const tree = {};

    filteredScans.forEach(s => {
      const st = s.State_Name;
      if (!st || st === 'Unknown State' || st === 'Unknown' || st === 'N/A' || st.toLowerCase().includes('unknown')) return;
      const dist = s.district || 'Unknown District';
      const zn = s.zone || 'Unknown Zone';
      const distr = s.distributor_name || 'Unknown Distributor';
      const ret = (s.retailer_name || 'Unknown Retailer') + ' (User ID: ' + (s.retailer_id || 'UNK') + ')';

      if (!tree[st]) tree[st] = { scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, children: {} };
      if (!tree[st].children[dist]) tree[st].children[dist] = { scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, children: {} };
      if (!tree[st].children[dist].children[zn]) tree[st].children[dist].children[zn] = { scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, children: {} };
      if (!tree[st].children[dist].children[zn].children[distr]) tree[st].children[dist].children[zn].children[distr] = { scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, children: {} };
      if (!tree[st].children[dist].children[zn].children[distr].children[ret]) tree[st].children[dist].children[zn].children[distr].children[ret] = { scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, isLeaf: true };

      const isB5 = s.uom === 'B5';
      const bCount = isB5 ? 0.5 : 1.0;

      const levels = [
        tree[st],
        tree[st].children[dist],
        tree[st].children[dist].children[zn],
        tree[st].children[dist].children[zn].children[distr],
        tree[st].children[dist].children[zn].children[distr].children[ret]
      ];

      levels.forEach(node => {
        node.scans += 1;
        node.boxes += bCount;
        node.b5Scans += isB5 ? 1 : 0;
        node.b10Scans += isB5 ? 0 : 1;
      });
    });

    let rowHtml = '';
    let rowId = 0;

    function renderNode(name, node, level, parentId) {
      rowId++;
      const currentId = rowId;
      const hasChildren = !node.isLeaf;
      
      const toggle = hasChildren ? `<span class="drill-toggle" data-id="${currentId}" data-expanded="false">+</span>` : '<span style="display:inline-block;width:24px;"></span>';
      const pClass = parentId ? `child-of-${parentId}` : '';
      const displayStyle = level === 0 ? '' : 'display: none;';

      const drillActionBtn = (level === 0) ? `<button class="btn-drill-step" onclick="event.stopPropagation(); window.handleTerritoryCardClick('STATE', '${escapeHTML(name)}')">Drill State Flow <i class="fa-solid fa-arrow-right"></i></button>`
        : (level === 1) ? `<button class="btn-drill-step" onclick="event.stopPropagation(); window.handleTerritoryCardClick('DISTRICT', '${escapeHTML(name)}')">Drill District Flow <i class="fa-solid fa-arrow-right"></i></button>`
        : (level === 2) ? `<button class="btn-drill-step" onclick="event.stopPropagation(); window.handleTerritoryCardClick('ZONE', '${escapeHTML(name)}')">Drill Zone Flow <i class="fa-solid fa-arrow-right"></i></button>`
        : (level === 3) ? `<button class="btn-drill-step" onclick="event.stopPropagation(); window.handleTerritoryCardClick('DISTRIBUTOR', '${escapeHTML(name)}')">Drill Distributor Flow <i class="fa-solid fa-arrow-right"></i></button>`
        : `<span style="font-size: 11px; color: var(--text-muted);">Retailer Outlet</span>`;

      rowHtml += `<tr class="drill-row level-${level} ${pClass}" data-node-id="${currentId}" style="${displayStyle}">
        <td>${toggle} ${escapeHTML(name)}</td>
        <td><strong>${node.scans.toLocaleString()}</strong></td>
        <td style="color: var(--accent-amber); font-weight: 700;">${node.boxes.toFixed(1)}</td>
        <td>${node.b5Scans.toLocaleString()}</td>
        <td>${node.b10Scans.toLocaleString()}</td>
        <td>${drillActionBtn}</td>
      </tr>`;

      if (hasChildren) {
        Object.entries(node.children).sort((a,b) => b[1].scans - a[1].scans).forEach(([childName, childNode]) => {
          renderNode(childName, childNode, level + 1, currentId);
        });
      }
    }

    Object.entries(tree).sort((a,b) => b[1].scans - a[1].scans).forEach(([stName, stNode]) => {
      renderNode(stName, stNode, 0, null);
    });

    tbody.innerHTML = rowHtml;

    // Attach click events for nested expansion
    function collapseChildren(parentId) {
      tbody.querySelectorAll(`.child-of-${parentId}`).forEach(c => {
         c.style.display = 'none';
         const cToggle = c.querySelector('.drill-toggle');
         if (cToggle) {
             cToggle.setAttribute('data-expanded', 'false');
             cToggle.textContent = '+';
             collapseChildren(c.getAttribute('data-node-id'));
         }
      });
    }

    tbody.querySelectorAll('.drill-row').forEach(row => {
      row.addEventListener('click', function(e) {
        const toggle = this.querySelector('.drill-toggle');
        if (!toggle) return;

        const id = this.getAttribute('data-node-id');
        const isExpanded = toggle.getAttribute('data-expanded') === 'true';

        toggle.setAttribute('data-expanded', !isExpanded);
        toggle.textContent = isExpanded ? '+' : '-';
        
        if (!isExpanded) {
          this.classList.add('row-expanded');
        } else {
          this.classList.remove('row-expanded');
        }

        const children = tbody.querySelectorAll(`.child-of-${id}`);
        children.forEach(child => {
          if (isExpanded) {
            child.style.display = 'none';
            child.classList.remove('row-expanded');
            const cToggle = child.querySelector('.drill-toggle');
            if (cToggle) {
               cToggle.setAttribute('data-expanded', 'false');
               cToggle.textContent = '+';
               collapseChildren(child.getAttribute('data-node-id'));
            }
          } else {
            child.style.display = '';
          }
        });
      });
    });
  }

  // Tab 6: Network Tree (ECharts)
  let networkTreeChart = null;

  function buildEchartsTreeData() {
    const tree = { name: "National Overview", scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, children: {} };

    filteredScans.forEach(s => {
      const st = s.State_Name;
      if (!st || st === 'Unknown State' || st === 'Unknown' || st === 'N/A' || st.toLowerCase().includes('unknown')) return;
      const dist = s.district || 'Unknown District';
      const zn = s.zone || 'Unknown Zone';
      const distr = s.distributor_name || 'Unknown Distributor';
      const ret = (s.retailer_name || 'Unknown Retailer') + ' (ID: ' + (s.retailer_id || 'UNK') + ')';

      const isB5 = s.uom === 'B5';
      const bCount = isB5 ? 0.5 : 1.0;

      if (!tree.children[st]) tree.children[st] = { name: st, scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, children: {} };
      if (!tree.children[st].children[dist]) tree.children[st].children[dist] = { name: dist, scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, children: {} };
      if (!tree.children[st].children[dist].children[zn]) tree.children[st].children[dist].children[zn] = { name: zn, scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, children: {} };
      if (!tree.children[st].children[dist].children[zn].children[distr]) tree.children[st].children[dist].children[zn].children[distr] = { name: distr, scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0, children: {} };
      if (!tree.children[st].children[dist].children[zn].children[distr].children[ret]) tree.children[st].children[dist].children[zn].children[distr].children[ret] = { name: ret, scans: 0, boxes: 0, b5Scans: 0, b10Scans: 0 };

      const levels = [
        tree,
        tree.children[st],
        tree.children[st].children[dist],
        tree.children[st].children[dist].children[zn],
        tree.children[st].children[dist].children[zn].children[distr],
        tree.children[st].children[dist].children[zn].children[distr].children[ret]
      ];
      levels.forEach(lvl => {
        lvl.scans += 1;
        lvl.boxes += bCount;
        lvl.b5Scans += isB5 ? 1 : 0;
        lvl.b10Scans += isB5 ? 0 : 1;
      });
    });

    function convertToArray(node) {
      const res = { 
        name: node.name,
        value: Math.max(node.scans || 0, 0.01),
        scans: node.scans,
        boxes: node.boxes,
        b5Scans: node.b5Scans,
        b10Scans: node.b10Scans
      };
      if (node.children) {
        res.children = Object.values(node.children).map(convertToArray);
      }
      return res;
    }

    return convertToArray(tree);
  }

  function renderNetworkTree() {
    const container = document.getElementById('networkTreeContainer');
    if (!container || typeof echarts === 'undefined') return;

    if (!networkTreeChart) {
      networkTreeChart = echarts.init(container);
      
      window.addEventListener('resize', () => {
        if (networkTreeChart) networkTreeChart.resize();
      });
      
      const tabBtns = document.querySelectorAll('.tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.getAttribute('data-tab') === 'tabNetworkTree') {
            setTimeout(() => { if (networkTreeChart) networkTreeChart.resize(); }, 100);
          }
        });
      });
    }

    const data = buildEchartsTreeData();
    const isDark = document.body.classList.contains('theme-dark');
    const textColor = isDark ? '#F8FAFC' : '#1e293b';

    const option = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        backgroundColor: isDark ? 'rgba(19, 27, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)',
        textStyle: { color: textColor },
        formatter: function (params) {
          const d = params.data;
          let html = `<div style="padding: 4px; min-width: 150px;">`;
          html += `<div style="font-weight: bold; font-size: 14px; margin-bottom: 8px;">${d.name}</div>`;
          if (d.scans !== undefined) {
             html += `<div style="height: 1px; background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; margin-bottom: 8px;"></div>`;
             html += `<div style="margin-bottom: 4px; font-size: 12px; color: ${isDark ? '#94A3B8' : '#64748B'};">Total Scans: <strong style="color: ${textColor}; float: right;">${d.scans.toLocaleString()}</strong></div>`;
             html += `<div style="margin-bottom: 4px; font-size: 12px; color: ${isDark ? '#94A3B8' : '#64748B'};">Calculated Boxes: <strong style="color: var(--accent-amber); float: right;">${d.boxes.toFixed(1)}</strong></div>`;
             html += `<div style="height: 1px; background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; margin-bottom: 8px; margin-top: 8px;"></div>`;
             html += `<div style="margin-bottom: 4px; font-size: 12px; color: ${isDark ? '#94A3B8' : '#64748B'};">B5 Scans (0.5 Box): <strong style="color: ${textColor}; float: right;">${d.b5Scans.toLocaleString()}</strong></div>`;
             html += `<div style="font-size: 12px; color: ${isDark ? '#94A3B8' : '#64748B'};">B10 Scans (1.0 Box): <strong style="color: ${textColor}; float: right;">${d.b10Scans.toLocaleString()}</strong></div>`;
          }
          html += `</div>`;
          return html;
        }
      },
      series: [
        {
          type: 'tree',
          data: [data],
          top: '5%',
          left: '12%',
          bottom: '5%',
          right: '25%',
          roam: true,
          symbolSize: 10,
          initialTreeDepth: 1,
          label: {
            position: 'left',
            verticalAlign: 'middle',
            align: 'right',
            fontSize: 13,
            color: textColor,
            backgroundColor: isDark ? 'rgba(19, 27, 46, 0.5)' : 'rgba(255, 255, 255, 0.5)',
            padding: [4, 6],
            borderRadius: 4
          },
          leaves: {
            label: {
              position: 'right',
              verticalAlign: 'middle',
              align: 'left'
            }
          },
          emphasis: {
            focus: 'descendant'
          },
          expandAndCollapse: true,
          animationDuration: 550,
          animationDurationUpdate: 750,
          lineStyle: {
            color: isDark ? '#3B82F6' : '#2563EB',
            width: 2,
            curveness: 0.5
          }
        }
      ]
    };

    networkTreeChart.setOption(option);
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
    if (!tbody) return;
    tbody.innerHTML = '';

    const selectedActiveStatus = document.getElementById('filterActiveStatus') ? document.getElementById('filterActiveStatus').value : 'ALL';
    const selectedState = elFilterState.value;
    const selectedCat = elFilterCat.value;
    const searchVal = elSearch.value.trim().toLowerCase();

    // Group filteredScans by retailer to get active scans details
    const retScanMap = {};
    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      if (!retScanMap[rid]) {
        retScanMap[rid] = {
          total_scans: 0,
          b5_scans: 0,
          b10_scans: 0,
          box_count: 0,
          dates: new Set()
        };
      }
      retScanMap[rid].total_scans += 1;
      const isB5 = s.uom === 'B5';
      if (isB5) {
        retScanMap[rid].b5_scans += 1;
      } else {
        retScanMap[rid].b10_scans += 1;
      }
      const d = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '');
      if (d && d !== 'None' && d !== 'null' && d !== 'NaT' && d !== 'Undefined') {
        retScanMap[rid].dates.add(d);
      }
      retScanMap[rid].box_count += (isB5 ? 0.5 : 1.0);
    });

    // Loop over all retailers in master registered list
    const items = [];
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      dashboardData.all_retailers.forEach(r => {
        const rid = r.status_retailer_id || r.retailer_id;
        const scansInfo = retScanMap[rid] || { total_scans: 0, b5_scans: 0, b10_scans: 0, box_count: 0, dates: new Set() };
        
        // Filter by state
        const rState = r.State_Name || r.state || '';
        if (selectedState !== 'ALL' && rState !== selectedState) return;

        // Filter by category: if a category filter is selected, we can only show retailers who scanned that category
        if (selectedCat !== 'ALL') {
          // If the retailer has 0 scans in this category, we skip them
          if (scansInfo.total_scans === 0) return;
        }

        // Filter by search query
        const name = r.retailer_name || r.name || '';
        const mobile = r.mobile_number || r.mobile || '';
        const city = r.city || '';
        const pincode = r.pincode || '';
        
        const matchSearch = !searchVal || (
          name.toLowerCase().includes(searchVal) ||
          city.toLowerCase().includes(searchVal) ||
          String(mobile).includes(searchVal) ||
          String(pincode).includes(searchVal) ||
          String(rid).includes(searchVal)
        );
        if (!matchSearch) return;

        // Filter by Outlet Status (Active vs Inactive)
        const isActive = scansInfo.total_scans > 0;
        if (selectedActiveStatus === 'ACTIVE' && !isActive) return;
        if (selectedActiveStatus === 'INACTIVE' && isActive) return;

        items.push({
          retailer_id: rid,
          retailer_name: name,
          mobile_number: mobile,
          city: city,
          State_Name: rState,
          total_scans: scansInfo.total_scans,
          b5_scans: scansInfo.b5_scans,
          b10_scans: scansInfo.b10_scans,
          box_count: scansInfo.box_count,
          dates: scansInfo.dates
        });
      });
    }

    items.sort((a, b) => b.total_scans - a.total_scans);

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px;">No retailers match the current filter selection.</td></tr>`;
      return;
    }

    const itemsToDisplay = items.slice(0, 250);

    itemsToDisplay.forEach(ret => {
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
        <td><strong>${ret.total_scans.toLocaleString()}</strong></td>
        <td style="color: var(--accent-amber); font-weight: 700;">${ret.box_count.toFixed(1)}</td>
        <td>${ret.b5_scans.toLocaleString()}</td>
        <td>${ret.b10_scans.toLocaleString()}</td>
        <td>${ret.dates.size}</td>
        <td><span class="badge-tier ${tierClass}">${tier}</span></td>
      `;
      tbody.appendChild(tr);
    });

    if (items.length > 250) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td colspan="11" style="text-align: center; color: var(--text-muted); font-style: italic; padding: 12px; background: rgba(255,255,255,0.02);">
          Showing top 250 matching retailers. Use the search box to find a specific retailer.
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  // Tab 3: State Rankings Table Dynamically Aggregated
  function renderStatesTable() {
    const tbody = document.getElementById('tblStatesBody');
    tbody.innerHTML = '';

    const stateMap = {};
    const totalScansAll = Math.max(1, filteredScans.length);

    filteredScans.forEach(s => {
      const st = s.State_Name;
      if (!st || st === 'Unknown' || st === 'Unknown State' || st === 'N/A' || st.toLowerCase().includes('unknown')) return;
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
      tr.style.cursor = 'pointer';
      tr.title = `Click to open territory flow page for ${st.State_Name}`;
      tr.innerHTML = `
        <td><strong>${escapeHTML(st.State_Name)}</strong> <i class="fa-solid fa-arrow-up-right-from-square text-primary" style="font-size: 11px; margin-left: 6px;"></i></td>
        <td><strong>${st.total_scans.toLocaleString()}</strong></td>
        <td>${st.b5_scans.toLocaleString()}</td>
        <td>${st.b10_scans.toLocaleString()}</td>
        <td style="color: var(--accent-amber); font-weight: 700;">${st.calculated_box_count.toFixed(1)}</td>
        <td>${retCount}</td>
        <td><span class="badge pill-purple">${intensity}</span></td>
        <td>${scanShare}%</td>
      `;
      tr.addEventListener('click', () => {
        showTerritoryFlowPage('STATE', st.State_Name);
      });
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
      const b10Contrib = ((cat.b10_scans / (cat.total_scans || 1)) * 100).toFixed(2);
      
      let statusBadge = '<span class="badge pill-mid">STABLE</span>';
      if (idx === 0) {
        statusBadge = '<span class="badge pill-highest"><i class="fa-solid fa-crown"></i> HIGHEST</span>';
      } else if (idx === catList.length - 1 && catList.length > 1) {
        statusBadge = '<span class="badge pill-lowest"><i class="fa-solid fa-arrow-trend-down"></i> LOWEST</span>';
      } else if (idx < 3) {
        statusBadge = '<span class="badge pill-core"><i class="fa-solid fa-fire"></i> CORE</span>';
      }

      const tr = document.createElement('tr');
      tr.style.cursor = 'pointer';
      tr.title = `Click to view product-level drilldown for ${cat.Category_Name}`;
      tr.innerHTML = `
        <td><strong>${escapeHTML(cat.Category_Name)}</strong> <i class="fa-solid fa-boxes-stacked text-purple" style="font-size: 11px; margin-left: 6px;"></i></td>
        <td>${statusBadge}</td>
        <td><strong>${cat.total_scans.toLocaleString()}</strong></td>
        <td>${cat.b5_scans.toLocaleString()}</td>
        <td>${cat.b10_scans.toLocaleString()}</td>
        <td style="color: var(--accent-amber); font-weight: 700;">${cat.calculated_box_count.toFixed(1)}</td>
        <td>${cat.retailers.size}</td>
        <td>${scanShare}%</td>
        <td><span class="badge pill-emerald">${b5Contrib}%</span></td>
        <td><span class="badge pill-blue">${b10Contrib}%</span></td>
      `;
      tr.addEventListener('click', () => {
        openCategoryProductModal(cat.Category_Name);
      });
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
    const elHeaderStartDate = document.getElementById('headerStartDate');
    const elHeaderEndDate = document.getElementById('headerEndDate');

    if (elHeaderStartDate && elFilterStartDate) {
      elHeaderStartDate.addEventListener('change', () => {
        elFilterStartDate.value = elHeaderStartDate.value;
        applyFilters();
      });
      elFilterStartDate.addEventListener('change', () => {
        elHeaderStartDate.value = elFilterStartDate.value;
        applyFilters();
      });
    } else if (elFilterStartDate) {
      elFilterStartDate.addEventListener('change', applyFilters);
    }

    if (elHeaderEndDate && elFilterEndDate) {
      elHeaderEndDate.addEventListener('change', () => {
        elFilterEndDate.value = elHeaderEndDate.value;
        applyFilters();
      });
      elFilterEndDate.addEventListener('change', () => {
        elHeaderEndDate.value = elFilterEndDate.value;
        applyFilters();
      });
    } else if (elFilterEndDate) {
      elFilterEndDate.addEventListener('change', applyFilters);
    }

    elFilterState.addEventListener('change', applyFilters);
    elFilterCat.addEventListener('change', applyFilters);
    elFilterUOM.addEventListener('change', applyFilters);
    const elFilterActiveStatus = document.getElementById('filterActiveStatus');
    if (elFilterActiveStatus) {
      elFilterActiveStatus.addEventListener('change', applyFilters);
    }
    elSearch.addEventListener('input', applyFilters);

    elBtnClearSearch.addEventListener('click', () => {
      elSearch.value = '';
      applyFilters();
    });

    elBtnReset.addEventListener('click', () => {
      if (elFilterStartDate) elFilterStartDate.value = '2026-07-01';
      if (elFilterEndDate) elFilterEndDate.value = '2026-07-31';
      if (elHeaderStartDate) elHeaderStartDate.value = '2026-07-01';
      if (elHeaderEndDate) elHeaderEndDate.value = '2026-07-31';
      elFilterState.value = 'ALL';
      elFilterCat.value = 'ALL';
      elFilterUOM.value = 'ALL';
      elSearch.value = '';

      // Reset Territory Flow state
      territoryFlow = {
        level: 'STATE',
        selectedState: null,
        selectedDistrict: null,
        selectedZone: null,
        selectedDistributor: null,
        selectedRetailer: null
      };

      applyFilters();
    });

    // Territory Level Selector Pills
    const elLevelPills = document.getElementById('territoryLevelPills');
    if (elLevelPills) {
      elLevelPills.querySelectorAll('.level-pill-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const lvl = this.getAttribute('data-level');
          setTerritoryLevel(lvl);
        });
      });
    }

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

    // Upsell Target List Modal Event Listeners
    if (elCardUpsellOpportunity) {
      elCardUpsellOpportunity.addEventListener('click', openUpsellModal);
    }
    if (elBtnCloseUpsell) {
      elBtnCloseUpsell.addEventListener('click', closeUpsellModal);
    }
    if (elUpsellSearch) {
      elUpsellSearch.addEventListener('input', renderUpsellModalTable);
    }
    if (elBtnExportUpsellExcel) {
      elBtnExportUpsellExcel.addEventListener('click', exportUpsellExcel);
    }

    // Pending Outlets Modal Event Listeners (Territory Flow Modal Trigger)
    if (elCardRetailerNotScanned) {
      elCardRetailerNotScanned.addEventListener('click', () => openPendingModal());
    }
    const elBtnViewTerritory = document.getElementById('btnViewTerritoryInsights');
    if (elBtnViewTerritory) {
      elBtnViewTerritory.addEventListener('click', (e) => {
        e.stopPropagation();
        openPendingModal();
      });
    }
    if (elBtnOpenTerritoryFlow) {
      elBtnOpenTerritoryFlow.addEventListener('click', () => showTerritoryFlowPage());
    }
    if (elBtnBackTerritoryFlow) {
      elBtnBackTerritoryFlow.addEventListener('click', closeTerritoryFlowModal);
    }
    if (elBtnCloseTerritoryFlow) {
      elBtnCloseTerritoryFlow.addEventListener('click', closeTerritoryFlowModal);
    }
    if (elBtnTerritoryFlowVisuals && elBtnTerritoryFlowData) {
      elBtnTerritoryFlowVisuals.addEventListener('click', () => {
        elBtnTerritoryFlowVisuals.classList.add('active');
        elBtnTerritoryFlowData.classList.remove('active');
        elTerritoryFlowViewVisuals.style.display = 'block';
        elTerritoryFlowViewData.style.display = 'none';
      });
      elBtnTerritoryFlowData.addEventListener('click', () => {
        elBtnTerritoryFlowData.classList.add('active');
        elBtnTerritoryFlowVisuals.classList.remove('active');
        elTerritoryFlowViewData.style.display = 'block';
        elTerritoryFlowViewVisuals.style.display = 'none';
        renderTerritoryFlowSheet();
      });
    }
    if (elTerritoryFlowSearch) {
      elTerritoryFlowSearch.addEventListener('input', renderTerritoryFlowSheet);
    }
    if (elBtnExportTerritoryFlowExcel) {
      elBtnExportTerritoryFlowExcel.addEventListener('click', exportTerritoryFlowExcel);
    }

    // Page View Navigation Buttons
    const elBtnBackToMain = document.getElementById('btnBackToMainDashboard');
    if (elBtnBackToMain) {
      elBtnBackToMain.addEventListener('click', showMainDashboardView);
    }

    const elBtnPageVis = document.getElementById('btnPageVisualsFlow');
    const elBtnPageDat = document.getElementById('btnPageDataFlow');
    const elPageVisSec = document.getElementById('pageTerritoryViewVisuals');
    const elPageDatSec = document.getElementById('pageTerritoryViewData');

    if (elBtnPageVis && elBtnPageDat) {
      elBtnPageVis.addEventListener('click', () => {
        elBtnPageVis.classList.add('active');
        elBtnPageDat.classList.remove('active');
        if (elPageVisSec) elPageVisSec.style.display = 'flex';
        if (elPageDatSec) elPageDatSec.style.display = 'none';
      });
      elBtnPageDat.addEventListener('click', () => {
        elBtnPageDat.classList.add('active');
        elBtnPageVis.classList.remove('active');
        if (elPageDatSec) elPageDatSec.style.display = 'block';
        if (elPageVisSec) elPageVisSec.style.display = 'none';
        renderTerritoryFlowSheet();
      });
    }

    const elBtnExpPage = document.getElementById('btnExportPageTerritoryExcel');
    if (elBtnExpPage) {
      elBtnExpPage.addEventListener('click', exportTerritoryFlowExcel);
    }

    const elPageSearch = document.getElementById('pageTerritorySearch');
    if (elPageSearch) {
      elPageSearch.addEventListener('input', renderTerritoryFlowSheet);
    }

    // Delegated click handler for Cards (Page & Modal)
    ['territoryFlowCards', 'pageTerritoryCardsGrid'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.listenerAttached) {
        el.dataset.listenerAttached = 'true';
        el.addEventListener('click', function(e) {
          const card = e.target.closest('[data-target-level]');
          if (card) {
            const lvl = card.getAttribute('data-target-level');
            const name = card.getAttribute('data-target-name');
            showTerritoryFlowPage(lvl, name);
          }
        });
      }
    });

    // Delegated click handler for Breadcrumbs (Page & Modal)
    ['territoryBreadcrumb', 'pageTerritoryBreadcrumb'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.listenerAttached) {
        el.dataset.listenerAttached = 'true';
        el.addEventListener('click', function(e) {
          const crumb = e.target.closest('[data-crumb-level]');
          if (crumb) {
            const lvl = crumb.getAttribute('data-crumb-level');
            const name = crumb.getAttribute('data-crumb-name');
            window.handleTerritoryCrumb(lvl, name);
            showTerritoryFlowPage();
          }
        });
      }
    });

    // Delegated click handler for Pills (Page & Modal)
    ['territoryLevelPills', 'pageTerritoryLevelPills'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.dataset.listenerAttached) {
        el.dataset.listenerAttached = 'true';
        el.addEventListener('click', function(e) {
          const pill = e.target.closest('[data-level]');
          if (pill) {
            const lvl = pill.getAttribute('data-level');
            setTerritoryLevel(lvl);
            showTerritoryFlowPage();
          }
        });
      }
    });

    if (elBtnClosePending) {
      elBtnClosePending.addEventListener('click', closePendingModal);
    }
    if (elPendingSearch) {
      elPendingSearch.addEventListener('input', renderPendingModalTable);
    }
    if (elBtnExportPendingExcel) {
      elBtnExportPendingExcel.addEventListener('click', exportPendingExcel);
    }
    // Distributor Modal Event Listeners
    if (elCardDistributorNotScanned) {
      elCardDistributorNotScanned.addEventListener('click', openDistributorModal);
    }
    if (elBtnCloseDistributor) {
      elBtnCloseDistributor.addEventListener('click', closeDistributorModal);
    }
    if (elDistributorSearch) {
      elDistributorSearch.addEventListener('input', renderDistributorModalTable);
    }
    if (elBtnExportDistributorExcel) {
      elBtnExportDistributorExcel.addEventListener('click', exportDistributorExcel);
    }

    // Bronze Upgrade Modal Event Listeners
    if (elCardBronzeUpgrade) {
      elCardBronzeUpgrade.addEventListener('click', openBronzeModal);
    }
    if (elBtnCloseBronze) {
      elBtnCloseBronze.addEventListener('click', closeBronzeModal);
    }
    if (elBronzeSearch) {
      elBronzeSearch.addEventListener('input', renderBronzeModalTable);
    }
    if (elBtnExportBronzeExcel) {
      elBtnExportBronzeExcel.addEventListener('click', exportBronzeExcel);
    }

    // Consistency Modal Event Listeners
    if (elCardConsistencyScore) {
      elCardConsistencyScore.addEventListener('click', openConsistencyModal);
    }
    if (elBtnCloseConsistency) {
      elBtnCloseConsistency.addEventListener('click', closeConsistencyModal);
    }
    if (elConsistencySearch) {
      elConsistencySearch.addEventListener('input', renderConsistencyModalTable);
    }
    if (elBtnExportConsistencyExcel) {
      elBtnExportConsistencyExcel.addEventListener('click', exportConsistencyExcel);
    }

    // Dormant Retailers Modal Event Listeners
    if (elCardDormantRetailers) {
      elCardDormantRetailers.addEventListener('click', () => openDormantModal('dormant'));
    }
    if (elBtnCloseDormant) {
      elBtnCloseDormant.addEventListener('click', closeDormantModal);
    }
    if (elDormantSearch) {
      elDormantSearch.addEventListener('input', renderDormantModalTable);
    }
    if (elBtnExportDormantExcel) {
      elBtnExportDormantExcel.addEventListener('click', exportDormantExcel);
    }


    // Side Panel Drawer Event Listeners
    const btnCloseDrawer = document.getElementById('btnCloseDormantDrawer');
    const drawerOverlay = document.getElementById('dormantDrawerOverlay');
    const btnExportDrawerExcel = document.getElementById('btnExportDrawerExcel');

    if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', closeRetailerDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeRetailerDrawer);
    if (btnExportDrawerExcel) btnExportDrawerExcel.addEventListener('click', exportDrawerScansExcel);

    // Low Penetration Modal Event Listeners
    if (elCardLowPenetration) {
      elCardLowPenetration.addEventListener('click', openLowPenetrationModal);
    }
    if (elBtnCloseLowPenetration) {
      elBtnCloseLowPenetration.addEventListener('click', closeLowPenetrationModal);
    }
    if (elLowPenetrationSearch) {
      elLowPenetrationSearch.addEventListener('input', renderLowPenetrationModalTable);
    }
    if (elBtnExportLowPenetrationExcel) {
      elBtnExportLowPenetrationExcel.addEventListener('click', exportLowPenetrationExcel);
    }

    // Highest Diversity Modal Event Listeners
    if (elCardHighestDiversity) {
      elCardHighestDiversity.addEventListener('click', openHighestDiversityModal);
    }
    if (elBtnCloseHighestDiversity) {
      elBtnCloseHighestDiversity.addEventListener('click', closeHighestDiversityModal);
    }
    if (elHighestDiversitySearch) {
      elHighestDiversitySearch.addEventListener('input', renderHighestDiversityModalTable);
    }
    if (elBtnExportHighestDiversityExcel) {
      elBtnExportHighestDiversityExcel.addEventListener('click', exportHighestDiversityExcel);
    }

    // Category Product Modal Event Listeners
    const elBtnCloseCatProd = document.getElementById('btnCloseCategoryProduct');
    const elCatProdSearch = document.getElementById('categoryProductSearch');
    const elBtnExportCatProd = document.getElementById('btnExportCategoryProductExcel');

    if (elBtnCloseCatProd) elBtnCloseCatProd.addEventListener('click', closeCategoryProductModal);
    if (elCatProdSearch) elCatProdSearch.addEventListener('input', renderCategoryProductTable);
    if (elBtnExportCatProd) elBtnExportCatProd.addEventListener('click', exportCategoryProductExcel);

    // Close modals when clicking outside content area
    window.addEventListener('click', (e) => {
      if (e.target === elUpsellModal) closeUpsellModal();
      if (e.target === elPendingModal) closePendingModal();
      if (e.target === elDistributorModal) closeDistributorModal();
      if (e.target === elBronzeModal) closeBronzeModal();
      if (e.target === elConsistencyModal) closeConsistencyModal();
      if (e.target === elDormantModal) closeDormantModal();
      if (e.target === elLowPenetrationModal) closeLowPenetrationModal();
      if (e.target === elHighestDiversityModal) closeHighestDiversityModal();
      const catProdModal = document.getElementById('categoryProductModal');
      if (e.target === catProdModal) closeCategoryProductModal();
    });
  }

  // Excel Export Utility with Styled Filtered Insights
  function exportExcel() {
    if (filteredScans.length === 0) {
      alert('No data available to export.');
      return;
    }
    
    // Calculate Insights for Executive Summary
    const totalFilteredScans = filteredScans.length;
    const totalFilteredB5 = filteredScans.filter(s => s.uom === 'B5').length;
    const totalFilteredB10 = filteredScans.filter(s => s.uom === 'B10').length;
    const totalCalculatedBoxes = (totalFilteredB5 * 0.5) + (totalFilteredB10 * 1.0);
    const uniqueRetailers = new Set(filteredScans.map(s => s.status_retailer_id || s.retailer_id)).size;
    const uniqueDays = Math.max(1, new Set(filteredScans.map(s => s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : ''))).size);
    
    const startStr = elFilterStartDate && elFilterStartDate.value ? elFilterStartDate.value : '2026-07-01';
    const endStr = elFilterEndDate && elFilterEndDate.value ? elFilterEndDate.value : '2026-07-31';

    const exec_data = [
      ["JGH Retailer Scan Intelligence - Dynamic Filtered Insights", "", ""],
      [`Filtered Date Range: ${startStr} to ${endStr}`, "", ""],
      ["", "", ""],
      ["Core Business KPI", "Key Metric Value", "Description"],
      ["Total QR Scans Registered", totalFilteredScans, "Total scan events matching current filters"],
      ["Total Box Units Scanned", totalCalculatedBoxes, "B5=0.5 Box, B10=1.0 Box"],
      ["Active Scanning Retailers", uniqueRetailers, "Unique active retailers in this dataset"],
      ["B5 Package Scans", totalFilteredB5, "Count of 5-piece packs"],
      ["B10 Package Scans", totalFilteredB10, "Count of 10-piece packs"],
      ["Average Scans / Day", (totalFilteredScans / uniqueDays).toFixed(2), "Based on days active in filtered date range"]
    ];

    const wb = XLSX.utils.book_new();
    const ws_exec = XLSX.utils.aoa_to_sheet(exec_data);

    // Apply Styles Helper
    const applyStyles = (ws, isExec = false) => {
      const range = XLSX.utils.decode_range(ws['!ref']);
      ws['!cols'] = [{wch: 25}, {wch: 20}, {wch: 45}, {wch: 15}, {wch: 15}, {wch: 15}];
      
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell_address = XLSX.utils.encode_cell({r: R, c: C});
          if (!ws[cell_address]) continue;
          
          ws[cell_address].s = {
            font: { name: "Arial", sz: 11, color: { rgb: "334155" } },
            alignment: { vertical: "center" },
            border: {
              bottom: { style: "thin", color: { rgb: "E2E8F0" } }
            }
          };

          // Header Row Styling
          if ((isExec && R === 3) || (!isExec && R === 0)) {
            ws[cell_address].s.fill = { fgColor: { rgb: "1E3A8A" } }; // Deep Blue
            ws[cell_address].s.font = { name: "Arial", sz: 12, bold: true, color: { rgb: "FFFFFF" } };
            ws[cell_address].s.border = { bottom: { style: "medium", color: { rgb: "000000" } } };
          }

          // Exec Summary Title Styling
          if (isExec && R === 0 && C === 0) {
            ws[cell_address].s.font = { name: "Arial", sz: 14, bold: true, color: { rgb: "1E3A8A" } };
            ws[cell_address].s.border = {};
          }
          if (isExec && R === 1 && C === 0) {
            ws[cell_address].s.font = { name: "Arial", sz: 11, italic: true, color: { rgb: "64748B" } };
            ws[cell_address].s.border = {};
          }
        }
      }
    };

    applyStyles(ws_exec, true);
    XLSX.utils.book_append_sheet(wb, ws_exec, "Executive_Summary");
    
    // 2. Query1_Mapped_Scans
    const ws_data = filteredScans.map(row => ({
      Retailer_ID: row.status_retailer_id || row.retailer_id || '',
      Retailer_Name: row.retailer_name || '',
      Mobile_Number: row.mobile_number || '',
      City: row.city || '',
      State: row.State_Name || '',
      Category: row.Category_Name || '',
      SKU_Code: row.sku_code || '',
      UOM: row.uom || '',
      Calculated_Box_Count: row.uom === 'B5' ? 0.5 : 1.0,
      Scan_Timestamp: row.retailer_scanned_at || ''
    }));
    const ws_sheet = XLSX.utils.json_to_sheet(ws_data);
    applyStyles(ws_sheet);
    XLSX.utils.book_append_sheet(wb, ws_sheet, "Mapped_Scans");

    // 3. State_Performance
    const stateMap = {};
    filteredScans.forEach(s => {
       const st = s.State_Name || 'Unknown';
       if (!stateMap[st]) stateMap[st] = { State_Name: st, Total_Scans: 0, B5_Scans: 0, B10_Scans: 0, Calculated_Box_Count: 0, Unique_Retailers: new Set() };
       stateMap[st].Total_Scans += 1;
       stateMap[st].Calculated_Box_Count += (s.uom === 'B5' ? 0.5 : 1.0);
       if (s.uom === 'B5') stateMap[st].B5_Scans += 1;
       else stateMap[st].B10_Scans += 1;
       stateMap[st].Unique_Retailers.add(s.status_retailer_id || s.retailer_id);
    });
    const stateArr = Object.values(stateMap).map(st => ({
       State_Name: st.State_Name,
       Total_Scans: st.Total_Scans,
       B5_Scans: st.B5_Scans,
       B10_Scans: st.B10_Scans,
       Calculated_Box_Count: st.Calculated_Box_Count,
       Unique_Retailers: st.Unique_Retailers.size,
       Scan_Share_Pct: ((st.Total_Scans / totalFilteredScans) * 100).toFixed(2) + '%'
    })).sort((a,b) => b.Total_Scans - a.Total_Scans);
    
    const ws_state = XLSX.utils.json_to_sheet(stateArr);
    applyStyles(ws_state);
    XLSX.utils.book_append_sheet(wb, ws_state, "State_Performance");

    // 4. Category_Analysis
    const catMap = {};
    filteredScans.forEach(s => {
       const cat = s.Category_Name || 'Unknown';
       if (!catMap[cat]) catMap[cat] = { Category_Name: cat, Total_Scans: 0, B5_Scans: 0, B10_Scans: 0, Calculated_Box_Count: 0, Unique_Retailers: new Set() };
       catMap[cat].Total_Scans += 1;
       catMap[cat].Calculated_Box_Count += (s.uom === 'B5' ? 0.5 : 1.0);
       if (s.uom === 'B5') catMap[cat].B5_Scans += 1;
       else catMap[cat].B10_Scans += 1;
       catMap[cat].Unique_Retailers.add(s.status_retailer_id || s.retailer_id);
    });
    const catArr = Object.values(catMap).map(c => ({
       Category_Name: c.Category_Name,
       Total_Scans: c.Total_Scans,
       B5_Scans: c.B5_Scans,
       B10_Scans: c.B10_Scans,
       Calculated_Box_Count: c.Calculated_Box_Count,
       Unique_Retailers: c.Unique_Retailers.size,
       Volume_Share_Pct: ((c.Total_Scans / totalFilteredScans) * 100).toFixed(2) + '%',
       B5_Contribution_Pct: ((c.B5_Scans / (c.Total_Scans||1)) * 100).toFixed(2) + '%'
    })).sort((a,b) => b.Total_Scans - a.Total_Scans);
    
    const ws_cat = XLSX.utils.json_to_sheet(catArr);
    applyStyles(ws_cat);
    XLSX.utils.book_append_sheet(wb, ws_cat, "Category_Analysis");

    // 5. Daily_Scanning_Trends
    const dateMap = {};
    filteredScans.forEach(s => {
       const d = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : 'Unknown');
       if (!dateMap[d]) dateMap[d] = { Scan_Date: d, Total_Scans: 0, B5_Scans: 0, B10_Scans: 0, Calculated_Box_Count: 0, Unique_Retailers: new Set() };
       dateMap[d].Total_Scans += 1;
       dateMap[d].Calculated_Box_Count += (s.uom === 'B5' ? 0.5 : 1.0);
       if (s.uom === 'B5') dateMap[d].B5_Scans += 1;
       else dateMap[d].B10_Scans += 1;
       dateMap[d].Unique_Retailers.add(s.status_retailer_id || s.retailer_id);
    });
    const dailyArr = Object.values(dateMap).map(d => ({
       Scan_Date: d.Scan_Date,
       Total_Scans: d.Total_Scans,
       B5_Scans: d.B5_Scans,
       B10_Scans: d.B10_Scans,
       Calculated_Box_Count: d.Calculated_Box_Count,
       Active_Retailers: d.Unique_Retailers.size
    })).sort((a,b) => a.Scan_Date.localeCompare(b.Scan_Date));
    
    const ws_daily = XLSX.utils.json_to_sheet(dailyArr);
    applyStyles(ws_daily);
    XLSX.utils.book_append_sheet(wb, ws_daily, "Daily_Scanning_Trends");

    // 6. Retailer_Summary
    const retExportMap = {};
    filteredScans.forEach(s => {
       const rid = s.status_retailer_id || s.retailer_id;
       const isSc = (s.retailer_scanned_at && s.retailer_scanned_at !== 'NaT' && s.retailer_scanned_at !== 'null' && s.retailer_scanned_at !== 'None');
       if (!retExportMap[rid]) {
          retExportMap[rid] = {
             Retailer_ID: rid,
             Retailer_Name: s.retailer_name || '',
             Mobile_Number: s.mobile_number || '',
             City: s.city || '',
             State: s.State_Name || '',
             Total_Assigned_Scans: 0,
             Verified_Scans: 0,
             Not_Scanned_Pending: 0,
             Calculated_Box_Count: 0,
             Active_Days: new Set()
          };
       }
       retExportMap[rid].Total_Assigned_Scans += 1;
       if (isSc) {
          retExportMap[rid].Verified_Scans += 1;
          const d = s.scan_date || String(s.retailer_scanned_at).slice(0, 10);
          if (d) retExportMap[rid].Active_Days.add(d);
       } else {
          retExportMap[rid].Not_Scanned_Pending += 1;
       }
       retExportMap[rid].Calculated_Box_Count += (s.uom === 'B5' ? 0.5 : 1.0);
    });
    
    const retArr = Object.values(retExportMap).map(r => ({
       Retailer_ID: r.Retailer_ID,
       Retailer_Name: r.Retailer_Name,
       Mobile_Number: r.Mobile_Number,
       City: r.City,
       State: r.State,
       Total_Assigned_Scans: r.Total_Assigned_Scans,
       Verified_Scans: r.Verified_Scans,
       Not_Scanned_Pending: r.Not_Scanned_Pending,
       Calculated_Box_Count: r.Calculated_Box_Count,
       Active_Days: r.Active_Days.size
    })).sort((a,b) => b.Total_Assigned_Scans - a.Total_Assigned_Scans);
    
    const ws_ret = XLSX.utils.json_to_sheet(retArr);
    applyStyles(ws_ret);
    XLSX.utils.book_append_sheet(wb, ws_ret, "Retailer_Summary");

    XLSX.writeFile(wb, `Retailer_Scans_${startStr}_to_${endStr}.xlsx`);
  }

  // ==========================================
  // MODAL CHARTS — Visual insights for each popup
  // ==========================================
  const modalCharts = {};
  const chartColors = ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#F43F5E', '#3B82F6', '#EC4899', '#14B8A6', '#EAB308', '#6366F1'];

  // Data labels configuration for charts inside modals
  const modalDatalabelsConfig = {
    display: true,
    color: '#ffffff',
    font: { weight: 'bold', size: 10 },
    anchor: 'end',
    align: 'start',
    offset: 2,
    formatter: function(value, context) {
      if (value === 0 || !value) return '';
      return value.toLocaleString();
    }
  };

  function destroyModalChart(key) {
    if (modalCharts[key]) { modalCharts[key].destroy(); delete modalCharts[key]; }
  }

  function createDoughnutChart(canvasId, labels, data, colors, chartKey) {
    destroyModalChart(chartKey);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const totalVal = data.reduce((a, b) => a + b, 0);

    modalCharts[chartKey] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: '#0F172A',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: { 
          legend: { display: false },
          datalabels: {
            display: (context) => {
              const val = context.dataset.data[context.dataIndex];
              const pct = totalVal > 0 ? (val / totalVal) * 100 : 0;
              return pct >= 6; // Only display text inside slice if slice is >= 6% to prevent overlapping numbers
            },
            color: '#FFFFFF',
            font: { size: 10, weight: 'bold' },
            formatter: (value) => value.toLocaleString()
          },
          tooltip: {
            backgroundColor: 'rgba(8,18,36,0.96)',
            borderColor: 'rgba(99,102,241,0.5)',
            borderWidth: 1,
            titleColor: '#93C5FD',
            bodyColor: '#CBD5E1',
            padding: 10,
            callbacks: {
              label: (ctx2) => {
                const val = ctx2.raw;
                const pct = totalVal > 0 ? ((val / totalVal) * 100).toFixed(1) : '0';
                return ` 📦 ${ctx2.label}: ${val.toLocaleString()} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  
  function createBarChart(canvasId, labels, data, color, chartKey, label, onClickFn) {
    destroyModalChart(chartKey);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    modalCharts[chartKey] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label: label, data: data, backgroundColor: color, borderRadius: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        onClick: onClickFn ? (evt, elements) => {
          if (elements.length > 0) onClickFn(labels[elements[0].index]);
        } : undefined,
        plugins: { 
          legend: { display: false },
          datalabels: modalDatalabelsConfig,
          tooltip: onClickFn ? { callbacks: { label: ctx2 => `${ctx2.parsed.y.toLocaleString()} — click to view distributor breakdown` } } : undefined
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
          x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)', maxRotation: 45, minRotation: 45 } }
        }
      }
    });
  }

  // Dedicated Territory Flow Page & Modal Functions
  function showTerritoryFlowPage(targetLevel, nameValue) {
    if (targetLevel) {
      drillToTerritoryStep(targetLevel, nameValue);
    }
    const elMain = document.getElementById('mainDashboardView');
    const elPage = document.getElementById('territoryFlowPageView');
    if (elMain && elPage) {
      elMain.style.display = 'none';
      elPage.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      openTerritoryFlowModal(targetLevel, nameValue);
    }
    renderTerritoryFlowNavigation();
    renderTerritoryFlowCards();
    renderTerritoryFlowCharts();
    renderTerritoryFlowSheet();
  }

  function showMainDashboardView() {
    const elMain = document.getElementById('mainDashboardView');
    const elPage = document.getElementById('territoryFlowPageView');
    if (elMain && elPage) {
      elPage.style.display = 'none';
      elMain.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function openTerritoryFlowModal(targetLevel, nameValue) {
    if (targetLevel) {
      drillToTerritoryStep(targetLevel, nameValue);
    }
    if (elTerritoryFlowModal) {
      elTerritoryFlowModal.classList.add('show');
      renderTerritoryFlowModalContent();
    }
  }

  function closeTerritoryFlowModal() {
    if (elTerritoryFlowModal) {
      elTerritoryFlowModal.classList.remove('show');
    }
  }

  function renderTerritoryFlowModalContent() {
    renderTerritoryFlowNavigation();
    renderTerritoryFlowCards();
    renderTerritoryFlowCharts();
    renderTerritoryFlowSheet();
  }

  function renderTerritoryFlowCharts() {
    let scopedScans = filteredScans;
    if (territoryFlow.selectedState) {
      scopedScans = scopedScans.filter(s => (s.State_Name || 'Unknown State') === territoryFlow.selectedState);
    }
    if (territoryFlow.selectedDistrict) {
      scopedScans = scopedScans.filter(s => (s.district || s.city || 'Unknown District') === territoryFlow.selectedDistrict);
    }
    if (territoryFlow.selectedZone) {
      scopedScans = scopedScans.filter(s => (s.zone || 'Unknown Zone') === territoryFlow.selectedZone);
    }
    if (territoryFlow.selectedDistributor) {
      scopedScans = scopedScans.filter(s => (s.distributor_name || 'Unknown Distributor') === territoryFlow.selectedDistributor);
    }

    const groupMap = {};
    let childTypeName = 'Territories';

    if (territoryFlow.level === 'STATE') {
      childTypeName = 'States';
      scopedScans.forEach(s => {
        const k = s.State_Name || 'Unknown';
        groupMap[k] = (groupMap[k] || 0) + 1;
      });
    } else if (territoryFlow.level === 'DISTRICT') {
      childTypeName = 'Districts';
      scopedScans.forEach(s => {
        const k = s.district || s.city || 'Unknown';
        groupMap[k] = (groupMap[k] || 0) + 1;
      });
    } else if (territoryFlow.level === 'ZONE') {
      childTypeName = 'Zones';
      scopedScans.forEach(s => {
        const k = s.zone || 'Unknown';
        groupMap[k] = (groupMap[k] || 0) + 1;
      });
    } else if (territoryFlow.level === 'DISTRIBUTOR') {
      childTypeName = 'Distributors';
      scopedScans.forEach(s => {
        const k = s.distributor_name || 'Unknown';
        groupMap[k] = (groupMap[k] || 0) + 1;
      });
    } else {
      childTypeName = 'Top Outlets';
      scopedScans.forEach(s => {
        const k = s.retailer_name || 'Unknown Retailer';
        groupMap[k] = (groupMap[k] || 0) + 1;
      });
    }

    const sortedBar = Object.entries(groupMap).sort((a,b) => b[1] - a[1]).slice(0, 10);
    const labels = sortedBar.map(e => e[0]);
    const values = sortedBar.map(e => e[1]);

    const titleBarEls = [document.getElementById('titleTerritoryBar'), document.getElementById('pageTerritoryTitleBar')].filter(Boolean);
    titleBarEls.forEach(el => el.textContent = `Top 10 ${childTypeName} by Scan Volume`);

    ['chartTerritoryFlowBar', 'chartPageTerritoryBar'].forEach(id => {
      const key = id === 'chartTerritoryFlowBar' ? 'territoryFlowBar' : 'pageTerritoryBar';
      if (charts[key]) charts[key].destroy();
      const ctx = document.getElementById(id);
      if (ctx) {
        charts[key] = new Chart(ctx.getContext('2d'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Scan Volume',
              data: values,
              backgroundColor: '#3B82F6',
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: '#94A3B8' } },
              y: { ticks: { color: '#94A3B8' } }
            }
          }
        });
      }
    });

    let b5Count = 0;
    let b10Count = 0;
    scopedScans.forEach(s => {
      if (s.uom === 'B5') b5Count++;
      else b10Count++;
    });

    const titlePieEls = [document.getElementById('titleTerritoryPie'), document.getElementById('pageTerritoryTitlePie')].filter(Boolean);
    titlePieEls.forEach(el => el.textContent = `Packaging Mix (B5 vs B10)`);

    ['chartTerritoryFlowPie', 'chartPageTerritoryPie'].forEach(id => {
      const key = id === 'chartTerritoryFlowPie' ? 'territoryFlowPie' : 'pageTerritoryPie';
      if (charts[key]) charts[key].destroy();
      const ctx = document.getElementById(id);
      if (ctx) {
        charts[key] = new Chart(ctx.getContext('2d'), {
          type: 'doughnut',
          data: {
            labels: [`Box of 5 (B5): ${b5Count.toLocaleString()}`, `Box of 10 (B10): ${b10Count.toLocaleString()}`],
            datasets: [{
              data: [b5Count, b10Count],
              backgroundColor: ['#10B981', '#6366F1'],
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94A3B8' } } }
          }
        });
      }
    });
  }

  function renderTerritoryFlowSheet() {
    const elTbodies = [document.getElementById('tblTerritoryFlowBody'), document.getElementById('tblPageTerritoryBody')].filter(Boolean);
    if (elTbodies.length === 0) return;

    let scopedScans = filteredScans;
    if (territoryFlow.selectedState) {
      scopedScans = scopedScans.filter(s => (s.State_Name || 'Unknown State') === territoryFlow.selectedState);
    }
    if (territoryFlow.selectedDistrict) {
      scopedScans = scopedScans.filter(s => (s.district || s.city || 'Unknown District') === territoryFlow.selectedDistrict);
    }
    if (territoryFlow.selectedZone) {
      scopedScans = scopedScans.filter(s => (s.zone || 'Unknown Zone') === territoryFlow.selectedZone);
    }
    if (territoryFlow.selectedDistributor) {
      scopedScans = scopedScans.filter(s => (s.distributor_name || 'Unknown Distributor') === territoryFlow.selectedDistributor);
    }

    const searchInput = document.getElementById('pageTerritorySearch') || document.getElementById('territoryFlowSearch');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let displayList = scopedScans;
    if (query) {
      displayList = scopedScans.filter(s =>
        (s.retailer_name && s.retailer_name.toLowerCase().includes(query)) ||
        (s.city && s.city.toLowerCase().includes(query)) ||
        (s.State_Name && s.State_Name.toLowerCase().includes(query)) ||
        (s.distributor_name && s.distributor_name.toLowerCase().includes(query)) ||
        (s.zone && s.zone.toLowerCase().includes(query))
      );
    }

    const retMap = {};
    displayList.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id || s.retailer_name;
      if (!retMap[rid]) {
        retMap[rid] = {
          name: s.retailer_name || 'Unknown Retailer',
          phone: s.mobile_number || '--',
          city: s.city || s.district || '--',
          state: s.State_Name || '--',
          zone: s.zone || '--',
          distributor: s.distributor_name || '--',
          scans: 0,
          boxes: 0
        };
      }
      retMap[rid].scans += 1;
      retMap[rid].boxes += (s.uom === 'B5' ? 0.5 : 1.0);
    });

    const rows = Object.values(retMap).sort((a,b) => b.scans - a.scans).slice(0, 100);

    let html = '';
    rows.forEach(r => {
      html += `<tr>
        <td><strong>${escapeHTML(r.name)}</strong></td>
        <td>${escapeHTML(String(r.phone))}</td>
        <td>${escapeHTML(r.city)}</td>
        <td>${escapeHTML(r.state)}</td>
        <td>${escapeHTML(r.zone)}</td>
        <td>${escapeHTML(r.distributor)}</td>
        <td><strong>${r.scans.toLocaleString()}</strong></td>
        <td style="color: var(--accent-amber); font-weight: 700;">${r.boxes.toFixed(1)}</td>
      </tr>`;
    });

    if (!html) {
      html = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching territory records found.</td></tr>`;
    }

    elTbodies.forEach(tb => tb.innerHTML = html);
  }

  function exportTerritoryFlowExcel() {
    let scopedScans = filteredScans;
    if (territoryFlow.selectedState) {
      scopedScans = scopedScans.filter(s => (s.State_Name || 'Unknown State') === territoryFlow.selectedState);
    }
    if (territoryFlow.selectedDistrict) {
      scopedScans = scopedScans.filter(s => (s.district || s.city || 'Unknown District') === territoryFlow.selectedDistrict);
    }
    if (territoryFlow.selectedZone) {
      scopedScans = scopedScans.filter(s => (s.zone || 'Unknown Zone') === territoryFlow.selectedZone);
    }
    if (territoryFlow.selectedDistributor) {
      scopedScans = scopedScans.filter(s => (s.distributor_name || 'Unknown Distributor') === territoryFlow.selectedDistributor);
    }

    if (!scopedScans || scopedScans.length === 0) {
      alert('No territory data available to export.');
      return;
    }

    const dataRows = scopedScans.slice(0, 5000).map((s, idx) => ({
      "SR No": idx + 1,
      "Retailer Name": s.retailer_name || '',
      "Mobile Number": s.mobile_number || '',
      "City": s.city || s.district || '',
      "State": s.State_Name || '',
      "Zone": s.zone || '',
      "Distributor Name": s.distributor_name || '',
      "SKU Code": s.sku_code || '',
      "Packaging UOM": s.uom || '',
      "Calculated Box Count": s.uom === 'B5' ? 0.5 : 1.0,
      "Scanned Date Time": s.retailer_scanned_at || s.updated_at || ''
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Territory_Flow_Data");
    XLSX.writeFile(wb, "JGH_Territory_Flow_Export_July2026.xlsx");
  }

  function closeAllModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach(m => m.classList.remove('show'));
  }
  window.closeAllModals = closeAllModals;

  function getRichStateMetrics(stateName) {
    if (!stateName) return null;
    let targetScans = (filteredScans || []).filter(s => {
      let st = s.State_Name || s.state || 'Unknown';
      if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
      return st.toLowerCase() === stateName.toLowerCase();
    });

    if (targetScans.length === 0 && dashboardData && Array.isArray(dashboardData.all_scans)) {
      targetScans = dashboardData.all_scans.filter(s => {
        let st = s.State_Name || s.state || 'Unknown';
        if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
        return st.toLowerCase() === stateName.toLowerCase();
      });
    }

    const totalScans = targetScans.length;
    let b10Count = 0;
    let b5Count = 0;
    const retSet = new Set();
    targetScans.forEach(s => {
      if (s.uom === 'B5') b5Count++;
      else b10Count++;
      retSet.add(String(s.status_retailer_id || s.retailer_id));
    });
    const totalBoxEquiv = (b10Count * 1.0) + (b5Count * 0.5);
    const b5Share = totalScans > 0 ? ((b5Count / totalScans) * 100).toFixed(1) : '0.0';
    const retsCount = retSet.size || 1;
    const avgScans = (totalScans / retsCount).toFixed(1);

    return {
      totalScans,
      b10Count,
      b5Count,
      totalBoxEquiv,
      b5Share,
      retsCount,
      avgScans
    };
  }

  function createBarChart(canvasId, labels, data, color, chartKey, label, onClickFn) {
    destroyModalChart(chartKey);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    modalCharts[chartKey] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{ label: label, data: data, backgroundColor: color, borderRadius: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        onClick: onClickFn ? (evt, elements) => {
          if (elements.length > 0) onClickFn(labels[elements[0].index]);
        } : undefined,
        plugins: { 
          legend: { display: false },
          datalabels: modalDatalabelsConfig,
          tooltip: {
            backgroundColor: 'rgba(8,18,36,0.96)',
            borderColor: 'rgba(99,102,241,0.5)',
            borderWidth: 1,
            titleColor: '#93C5FD',
            titleFont: { size: 13, weight: 'bold' },
            bodyColor: '#CBD5E1',
            bodyFont: { size: 12 },
            padding: 12,
            callbacks: {
              title: (items) => `📍 ${items[0].label}`,
              label: (ctx2) => {
                const m = getRichStateMetrics(ctx2.label);
                if (!m) return ` 📦 Total Scans: ${ctx2.parsed.y.toLocaleString()}`;
                return ` 📦 Total Scans: ${m.totalScans.toLocaleString()}`;
              },
              afterBody: (items) => {
                const st = items[0]?.label;
                const m = getRichStateMetrics(st);
                if (!m) return [];
                const lines = [
                  `  🟠 B10 Boxes (Full): ${m.b10Count.toLocaleString()}`,
                  `  🟡 B5 Boxes (Half): ${m.b5Count.toLocaleString()}`,
                  `  🟢 Active Retailers: ${m.retsCount.toLocaleString()}`,
                  `  ─────────────────────────────────────`,
                  `  📊 Total Box Equiv: ${m.totalBoxEquiv.toLocaleString()}`,
                  `  📈 B5 Share: ${m.b5Share}% of scans`,
                  `  ⚡ Avg Scans/Retailer: ${m.avgScans}`
                ];
                if (onClickFn) {
                  lines.push(`  👉 Click state to open full graphs & distributor breakdown →`);
                }
                return lines;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
          x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.7)', maxRotation: 45, minRotation: 45 } }
        }
      }
    });
  }

  function showTerritoryFlowPage(targetLevel, nameValue) {
    if (targetLevel) {
      drillToTerritoryStep(targetLevel, nameValue);
    }
    const elMain = document.getElementById('mainDashboardView');
    const elPage = document.getElementById('territoryFlowPageView');
    if (elMain && elPage) {
      elMain.style.display = 'none';
      elPage.style.display = 'flex';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      openTerritoryFlowModal(targetLevel, nameValue);
    }
    renderTerritoryFlowNavigation();
    renderTerritoryFlowCards();
    renderTerritoryFlowCharts();
    renderTerritoryFlowSheet();
  }

  function showMainDashboardView() {
    const elMain = document.getElementById('mainDashboardView');
    const elPage = document.getElementById('territoryFlowPageView');
    if (elMain && elPage) {
      elMain.style.display = 'block';
      elPage.style.display = 'none';
    }
    const elDrillPage = document.getElementById('stateDistributorOpportunityPageView');
    if (elDrillPage) elDrillPage.style.display = 'none';
  }

  function renderModalInsights(type) {
    if (type === 'upsell') {
      const catCounts = {};
      singleCatRetailersList.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
      const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
      const labels = sorted.map(e => e[0]);
      const data = sorted.map(e => e[1]);
      setTimeout(() => createDoughnutChart('chartUpsellModal', labels, data, chartColors, 'upsell'), 100);
      const stateCounts = {};
      singleCatRetailersList.forEach(r => { stateCounts[r.state] = (stateCounts[r.state] || 0) + 1; });
      const sortedStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      setTimeout(() => createBarChart('chartUpsellBar', sortedStates.map(e => e[0]), sortedStates.map(e => e[1]), '#06B6D4', 'upsellBar', 'Retailers', (stateName) => {
        closeAllModals();
        openStateDistributorDrilldown(stateName, 'all');
      }), 100);

      const el = document.getElementById('upsellStatCards');
      if (el) el.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value">${singleCatRetailersList.length.toLocaleString()}</div><div class="stat-label">Total Upsell Targets</div></div>
        <div class="modal-stat-card"><div class="stat-value">${labels.length}</div><div class="stat-label">Categories Found</div></div>
        <div class="modal-stat-card"><div class="stat-value">${sorted.length > 0 ? sorted[0][0] : '--'}</div><div class="stat-label">Top Category</div></div>`;
      const leg = document.getElementById('upsellLegend');
      if (leg) leg.innerHTML = sorted.slice(0, 6).map((e, i) => `<div class="legend-item"><span class="legend-dot" style="background: ${chartColors[i]}"></span><strong>${e[0]}:</strong> ${e[1]} retailers (${(e[1]/singleCatRetailersList.length*100).toFixed(1)}%)</div>`).join('');
    }
    else if (type === 'pending') {
      const zoneCounts = {};
      pendingRetailersList.forEach(r => { zoneCounts[r.zone] = (zoneCounts[r.zone] || 0) + r.scansCount; });
      const sorted = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]);
      setTimeout(() => createDoughnutChart('chartPendingModal', sorted.map(e => e[0]), sorted.map(e => e[1]), chartColors, 'pending'), 100);
      
      const sortedCities = [...pendingRetailersList].sort((a, b) => b.scansCount - a.scansCount).slice(0, 10);
      setTimeout(() => createBarChart('chartPendingBar', sortedCities.map(c => c.city), sortedCities.map(c => c.scansCount), '#06B6D4', 'pendingBar', 'Scans', (cityName) => {
        const r = pendingRetailersList.find(x => x.city === cityName);
        const stName = r ? r.state : cityName;
        closeAllModals();
        openStateDistributorDrilldown(stName, 'all');
      }), 100);

      const totalScans = pendingRetailersList.reduce((a, b) => a + b.scansCount, 0);
      const el = document.getElementById('pendingStatCards');
      if (el) el.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value">${pendingRetailersList.length.toLocaleString()}</div><div class="stat-label">Active Cities</div></div>
        <div class="modal-stat-card"><div class="stat-value">${totalScans.toLocaleString()}</div><div class="stat-label">Total Scans</div></div>
        <div class="modal-stat-card"><div class="stat-value">${sortedCities.length > 0 ? sortedCities[0].city : '--'}</div><div class="stat-label">Top City</div></div>`;
      const leg = document.getElementById('pendingLegend');
      if (leg) leg.innerHTML = sorted.slice(0, 5).map((e, i) => `<div class="legend-item"><span class="legend-dot" style="background: ${chartColors[i]}"></span><strong>${e[0]}:</strong> ${e[1].toLocaleString()} scans (${(e[1]/totalScans*100).toFixed(1)}%)</div>`).join('');
    }
    else if (type === 'distributor') {
      populateDistributorModalStateDropdown();
      renderDistributorModalVisuals();
    }
  }

  function populateDistributorModalStateDropdown() {
    const sel = document.getElementById('selDistributorFilterState');
    if (!sel) return;

    const statesSet = new Set();
    pendingDistributorsList.forEach(d => {
      if (d.state && d.state !== 'N/A' && d.state !== 'Unknown State') statesSet.add(d.state);
    });

    const sortedStates = Array.from(statesSet).sort();
    sel.innerHTML = `<option value="ALL">All States (${pendingDistributorsList.length} Distributors)</option>` +
      sortedStates.map(s => `<option value="${escapeHTML(s)}">${escapeHTML(s)}</option>`).join('');

    populateDistributorModalCityDropdown('ALL');
  }

  function populateDistributorModalCityDropdown(selectedState) {
    const selCity = document.getElementById('selDistributorFilterCity');
    if (!selCity) return;

    const citiesSet = new Set();
    pendingDistributorsList.forEach(d => {
      if (selectedState === 'ALL' || (d.state || '').toLowerCase() === selectedState.toLowerCase()) {
        if (d.city && d.city !== 'N/A' && d.city !== 'Unknown City') citiesSet.add(d.city);
      }
    });

    const sortedCities = Array.from(citiesSet).sort();
    selCity.innerHTML = `<option value="ALL">All Districts / Cities (${sortedCities.length})</option>` +
      sortedCities.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('');
  }

  function onDistributorStateChange() {
    const selState = document.getElementById('selDistributorFilterState')?.value || 'ALL';
    populateDistributorModalCityDropdown(selState);
    renderDistributorModalVisuals();
  }

  let chartDistributorEfficiencyInstance = null;

  function renderDistributorModalVisuals() {
    const selState = document.getElementById('selDistributorFilterState')?.value || 'ALL';
    const selCity = document.getElementById('selDistributorFilterCity')?.value || 'ALL';
    const selLimit = document.getElementById('selDistributorFilterLimit')?.value || '15';
    const q = (document.getElementById('txtDistributorFilterSearch')?.value || '').trim().toLowerCase();

    let list = pendingDistributorsList;
    if (selState !== 'ALL') {
      list = list.filter(d => (d.state || '').toLowerCase() === selState.toLowerCase());
    }
    if (selCity !== 'ALL') {
      list = list.filter(d => (d.city || '').toLowerCase() === selCity.toLowerCase());
    }
    if (q) {
      list = list.filter(d =>
        (d.name && d.name.toLowerCase().includes(q)) ||
        (d.state && d.state.toLowerCase().includes(q)) ||
        (d.city && d.city.toLowerCase().includes(q))
      );
    }

    let distSorted = [...list].sort((a, b) => b.scansCount - a.scansCount);
    if (selLimit !== 'ALL') {
      const limitNum = parseInt(selLimit, 10) || 15;
      distSorted = distSorted.slice(0, limitNum);
    }

    const lblPageInfo = document.getElementById('lblDistributorPageInfo');
    if (lblPageInfo) {
      lblPageInfo.textContent = `Showing Top ${distSorted.length} of ${list.length} Distributors`;
    }

    // Chart 1: Scan Volume & Box Contribution
    destroyModalChart('distributorBar');
    const ctx1 = document.getElementById('chartDistributorBar');
    if (ctx1) {
      const labels = distSorted.map(d => d.name.length > 18 ? d.name.substring(0,17)+'..' : d.name);
      modalCharts['distributorBar'] = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Total 6M Scans', data: distSorted.map(d => d.scansCount), backgroundColor: 'rgba(99,102,241,0.85)', borderColor: '#818CF8', borderWidth: 1, borderRadius: 4 },
            { label: 'Calculated Box Count', data: distSorted.map(d => d.boxCount), backgroundColor: 'rgba(245,158,11,0.85)', borderColor: '#F59E0B', borderWidth: 1, borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          onClick: (evt, elements, chart) => {
            const activePoints = (chart && chart.getElementsAtEventForMode)
              ? chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true)
              : elements;
            if (activePoints && activePoints.length > 0) {
              const idx = activePoints[0].index;
              const dObj = distSorted[idx];
              if (dObj) {
                currentSingleDistScope = 'national';
                openSingleDistributorDetailModal(dObj.name);
              }
            }
          },
          plugins: {
            legend: { position: 'top', labels: { color: '#CBD5E1', font: { size: 11 }, boxWidth: 12, padding: 12 } },
            datalabels: { display: false },
            tooltip: {
              backgroundColor: 'rgba(8,18,36,0.96)', borderColor: 'rgba(99,102,241,0.5)', borderWidth: 1,
              titleColor: '#93C5FD', bodyColor: '#CBD5E1', padding: 12,
              callbacks: {
                title: (items) => items[0]?.label || '',
                label: (ctx) => {
                  const d = distSorted[ctx.dataIndex];
                  if (!d) return '';
                  const icons = { 'Total 6M Scans': '📦', 'Calculated Box Count': '📦' };
                  return ` ${icons[ctx.dataset.label] || ''} ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`;
                },
                afterBody: (items) => {
                  const d = distSorted[items[0]?.dataIndex];
                  if (!d) return [];
                  return [
                    '',
                    `  🔷 Total Retailers : ${(d.totalRegistered || d.retailersCount).toLocaleString()}`,
                    `  🟢 Active Retailers: ${d.retailersCount.toLocaleString()}`,
                    `  👉 Click bar to inspect mapped retailers & category mix →`
                  ];
                }
              }
            }
          },
          scales: {
            x: { ticks: { color: '#94A3B8', maxRotation: 25, font: { size: 9.5 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { beginAtZero: true, ticks: { color: '#94A3B8', font: { size: 9.5 } }, grid: { color: 'rgba(255,255,255,0.06)' } }
          }
        }
      });

      ctx1.onclick = (e) => {
        if (!modalCharts['distributorBar']) return;
        const activePoints = modalCharts['distributorBar'].getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
        if (activePoints && activePoints.length > 0) {
          const dObj = distSorted[activePoints[0].index];
          if (dObj) {
            currentSingleDistScope = 'national';
            openSingleDistributorDetailModal(dObj.name);
          }
        }
      };
    }

    // Chart 2: Active vs Inactive Efficiency
    if (chartDistributorEfficiencyInstance) {
      try { chartDistributorEfficiencyInstance.destroy(); } catch (e) {}
    }

    const ctx2 = document.getElementById('chartDistributorEfficiency');
    if (ctx2) {
      const labels = distSorted.map(d => d.name.length > 18 ? d.name.substring(0,17)+'..' : d.name);
      chartDistributorEfficiencyInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Active Outlets (6M)',
              data: distSorted.map(d => d.retailersCount),
              backgroundColor: 'rgba(16,185,129,0.85)',
              borderColor: '#10B981', borderWidth: 1, borderRadius: 4
            },
            {
              label: 'Inactive Outlets',
              data: distSorted.map(d => Math.max(0, (d.totalRegistered || d.retailersCount) - d.retailersCount)),
              backgroundColor: 'rgba(244,63,94,0.75)',
              borderColor: '#F43F5E', borderWidth: 1, borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          onClick: (evt, elements, chart) => {
            const activePoints = (chart && chart.getElementsAtEventForMode)
              ? chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true)
              : elements;
            if (activePoints && activePoints.length > 0) {
              const idx = activePoints[0].index;
              const dObj = distSorted[idx];
              if (dObj) {
                currentSingleDistScope = 'national';
                openSingleDistributorDetailModal(dObj.name);
              }
            }
          },
          plugins: {
            legend: { position: 'top', labels: { color: '#CBD5E1', font: { size: 10 } } },
            datalabels: { display: false },
            tooltip: {
              callbacks: {
                afterBody: () => [`  👉 Click bar to inspect mapped retailers & category mix →`]
              }
            }
          },
          scales: {
            x: { ticks: { color: '#94A3B8', maxRotation: 30, font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { stacked: false, beginAtZero: true, ticks: { color: '#94A3B8', font: { size: 9 } }, grid: { color: 'rgba(255,255,255,0.06)' } }
          }
        }
      });

      ctx2.onclick = (e) => {
        if (!chartDistributorEfficiencyInstance) return;
        const activePoints = chartDistributorEfficiencyInstance.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
        if (activePoints && activePoints.length > 0) {
          const dObj = distSorted[activePoints[0].index];
          if (dObj) {
            currentSingleDistScope = 'national';
            openSingleDistributorDetailModal(dObj.name);
          }
        }
      };
    }

    // Update left stat cards
    const totalDistScans = list.reduce((a, b) => a + b.scansCount, 0);
    const totalDistRetailers = list.reduce((a, b) => a + b.retailersCount, 0);
    const totalDistBoxes = list.reduce((a, b) => a + b.boxCount, 0);

    const el = document.getElementById('distributorStatCards');
    if (el) el.innerHTML = `
      <div class="modal-stat-card"><div class="stat-value">${list.length.toLocaleString()}</div><div class="stat-label">Filtered Partners</div></div>
      <div class="modal-stat-card"><div class="stat-value">${totalDistScans.toLocaleString()}</div><div class="stat-label">Total Scans</div></div>
      <div class="modal-stat-card"><div class="stat-value" style="color:#10B981">${totalDistRetailers.toLocaleString()}</div><div class="stat-label">Active Outlets</div></div>
      <div class="modal-stat-card"><div class="stat-value" style="color:#F59E0B">${totalDistBoxes.toFixed(1)}</div><div class="stat-label">Total Boxes</div></div>`;
  }

  function renderModalInsights(type) {
    if (type === 'upsell') {
      const catCounts = {};
      singleCatRetailersList.forEach(r => { catCounts[r.category] = (catCounts[r.category] || 0) + 1; });
      const sorted = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

      // Group Top 6 + Others for 100% crystal-clear spacing
      const top6 = sorted.slice(0, 6);
      const otherSum = sorted.slice(6).reduce((sum, e) => sum + e[1], 0);

      const itemsToRender = top6.map(e => ({ name: e[0], count: e[1] }));
      if (otherSum > 0) {
        itemsToRender.push({ name: 'Other Categories', count: otherSum });
      }

      const labels = itemsToRender.map(e => e.name);
      const data = itemsToRender.map(e => e.count);
      const barColors = ['#06B6D4', '#818CF8', '#10B981', '#F59E0B', '#F43F5E', '#3B82F6', '#94A3B8'];

      setTimeout(() => {
        destroyModalChart('upsell');
        const ctx = document.getElementById('chartUpsellModal')?.getContext('2d');
        if (ctx) {
          modalCharts['upsell'] = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: 'Retailers',
                data: data,
                backgroundColor: barColors.slice(0, labels.length),
                borderRadius: 5,
                barThickness: 16
              }]
            },
            options: {
              indexAxis: 'y',
              responsive: true,
              maintainAspectRatio: false,
              onClick: (evt, elements) => {
                if (elements.length > 0) {
                  const idx = elements[0].index;
                  const selectedCat = labels[idx];
                  showUpsellCategoryRetailersTable(selectedCat);
                }
              },
              plugins: {
                legend: { display: false },
                datalabels: {
                  display: true,
                  color: '#FFFFFF',
                  anchor: 'end',
                  align: 'end',
                  font: { size: 10, weight: 'bold' },
                  formatter: (v) => v.toLocaleString()
                },
                tooltip: {
                  backgroundColor: 'rgba(8,18,36,0.96)',
                  borderColor: 'rgba(6,182,212,0.5)',
                  borderWidth: 1,
                  callbacks: {
                    label: c => ` 📦 ${c.raw.toLocaleString()} Retailers (${(c.raw/singleCatRetailersList.length*100).toFixed(1)}%) — Click bar to inspect store list →`
                  }
                }
              },
              scales: {
                x: {
                  ticks: { color: '#94A3B8', font: { size: 9.5 } },
                  grid: { color: 'rgba(255,255,255,0.05)' }
                },
                y: {
                  ticks: {
                    color: '#CBD5E1',
                    font: { size: 9.5, weight: '600' },
                    callback: function(val) {
                      const l = this.getLabelForValue(val) || '';
                      return l.length > 18 ? l.substring(0, 16) + '..' : l;
                    }
                  },
                  grid: { display: false }
                }
              }
            }
          });
        }
      }, 100);

      const stateCounts = {};
      singleCatRetailersList.forEach(r => { stateCounts[r.state] = (stateCounts[r.state] || 0) + 1; });
      const sortedStates = Object.entries(stateCounts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      setTimeout(() => createBarChart('chartUpsellBar', sortedStates.map(e => e[0]), sortedStates.map(e => e[1]), '#06B6D4', 'upsellBar', 'Retailers', (stateName) => {
        closeAllModals();
        openStateDistributorDrilldown(stateName, 'upsell');
      }), 100);

      const el = document.getElementById('upsellStatCards');
      if (el) el.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value">${singleCatRetailersList.length.toLocaleString()}</div><div class="stat-label">Total Targets</div></div>
        <div class="modal-stat-card"><div class="stat-value">${labels.length}</div><div class="stat-label">Categories</div></div>
        <div class="modal-stat-card"><div class="stat-value">${sorted.length > 0 ? sorted[0][0] : '--'}</div><div class="stat-label">Top Category</div></div>`;
    }
    else if (type === 'pending') {
      const zoneCounts = {};
      pendingRetailersList.forEach(r => { zoneCounts[r.zone] = (zoneCounts[r.zone] || 0) + r.scansCount; });
      const sorted = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]);
      setTimeout(() => createDoughnutChart('chartPendingModal', sorted.map(e => e[0]), sorted.map(e => e[1]), chartColors, 'pending'), 100);
      
      const sortedCities = [...pendingRetailersList].sort((a, b) => b.scansCount - a.scansCount).slice(0, 10);
      setTimeout(() => createBarChart('chartPendingBar', sortedCities.map(c => c.city), sortedCities.map(c => c.scansCount), '#06B6D4', 'pendingBar', 'Scans', (cityName) => {
        const r = pendingRetailersList.find(x => x.city === cityName);
        const stName = r ? r.state : cityName;
        closeAllModals();
        openStateDistributorDrilldown(stName, 'all');
      }), 100);

      const totalScans = pendingRetailersList.reduce((a, b) => a + b.scansCount, 0);
      const el = document.getElementById('pendingStatCards');
      if (el) el.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value">${pendingRetailersList.length.toLocaleString()}</div><div class="stat-label">Active Cities</div></div>
        <div class="modal-stat-card"><div class="stat-value">${totalScans.toLocaleString()}</div><div class="stat-label">Total Scans</div></div>
        <div class="modal-stat-card"><div class="stat-value">${sortedCities.length > 0 ? sortedCities[0].city : '--'}</div><div class="stat-label">Top City</div></div>`;
      const leg = document.getElementById('pendingLegend');
      if (leg) leg.innerHTML = sorted.slice(0, 5).map((e, i) => `<div class="legend-item"><span class="legend-dot" style="background: ${chartColors[i]}"></span><strong>${e[0]}:</strong> ${e[1].toLocaleString()} scans (${(e[1]/totalScans*100).toFixed(1)}%)</div>`).join('');
    }
    else if (type === 'distributor') {
      populateDistributorModalStateDropdown();
      renderDistributorModalVisuals();
    }
    else if (type === 'bronze') {
      const groups = { 'Almost There (1-3)': 0, 'Close (4-8)': 0, 'Needs Work (9-16)': 0 };
      bronzeRetailersList.forEach(r => {
        if (r.scansNeeded <= 3) groups['Almost There (1-3)']++;
        else if (r.scansNeeded <= 8) groups['Close (4-8)']++;
        else groups['Needs Work (9-16)']++;
      });
      const labels = Object.keys(groups);
      const data = Object.values(groups);
      setTimeout(() => createDoughnutChart('chartBronzeModal', labels, data, ['#10B981', '#F59E0B', '#F43F5E'], 'bronze'), 100);
      const stateCountsBr = {};
      bronzeRetailersList.forEach(r => { stateCountsBr[r.state] = (stateCountsBr[r.state] || 0) + 1; });
      const sortedStatesBr = Object.entries(stateCountsBr).sort((a, b) => b[1] - a[1]).slice(0, 10);
      setTimeout(() => createBarChart('chartBronzeBar', sortedStatesBr.map(e => e[0]), sortedStatesBr.map(e => e[1]), '#F59E0B', 'bronzeBar', 'Bronze Retailers', (stateName) => {
        closeAllModals();
        openStateDistributorDrilldown(stateName, 'all');
      }), 100);

      const el = document.getElementById('bronzeStatCards');
      if (el) el.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value">${bronzeRetailersList.length.toLocaleString()}</div><div class="stat-label">Bronze Retailers</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color: #10B981;">${groups['Almost There (1-3)']}</div><div class="stat-label">Almost Silver!</div></div>
        <div class="modal-stat-card"><div class="stat-value">${bronzeRetailersList.reduce((a, r) => a + r.scansNeeded, 0).toLocaleString()}</div><div class="stat-label">Total Scans Needed</div></div>`;
    }
    else if (type === 'consistency') {
      const tiers = { 'Loyal': 0, 'Regular': 0, 'Occasional': 0, 'One-Time': 0 };
      (consistencyRetailersList || []).forEach(r => { tiers[r.tier] = (tiers[r.tier] || 0) + 1; });
      setTimeout(() => createDoughnutChart('chartConsistencyModal', Object.keys(tiers), Object.values(tiers), ['#10B981', '#818CF8', '#FBBF24', '#FB7185'], 'consistency'), 150);

      const regRisk = {};
      (consistencyRetailersList || []).forEach(r => {
        const st = r.state || 'Other State';
        if (!regRisk[st]) regRisk[st] = { loyal: 0, risk: 0 };
        if (r.tier === 'Loyal' || r.tier === 'Regular') regRisk[st].loyal++;
        else regRisk[st].risk++;
      });
      const sortedReg = Object.entries(regRisk)
        .filter(e => e[0] && e[0] !== 'N/A' && e[0] !== 'Unknown State')
        .sort((a, b) => (b[1].loyal + b[1].risk) - (a[1].loyal + a[1].risk))
        .slice(0, 10);

      setTimeout(() => {
        destroyModalChart('consistencyBar');
        const ctx = document.getElementById('chartConsistencyBar');
        if (!ctx) return;
        modalCharts['consistencyBar'] = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: sortedReg.map(e => e[0]),
            datasets: [
              { label: 'Loyal/Regular', data: sortedReg.map(e => e[1].loyal), backgroundColor: '#10B981', borderRadius: 4 },
              { label: 'Occasional/One-Time', data: sortedReg.map(e => e[1].risk), backgroundColor: '#F43F5E', borderRadius: 4 }
            ]
          },
          options: { 
            responsive: true, 
            maintainAspectRatio: false,
            onClick: (evt, elements) => {
              if (elements.length > 0) {
                const stateName = sortedReg[elements[0].index][0];
                closeAllModals();
                openStateDistributorDrilldown(stateName, 'all');
              }
            },
            scales: {
              x: { stacked: true, ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { stacked: true, ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
            }, 
            plugins: { 
              legend: { position: 'top', labels: { color: '#CBD5E1', font: { size: 11 } } },
              datalabels: { display: false }
            } 
          }
        });
      }, 150);

      const total = (consistencyRetailersList || []).length;
      const el = document.getElementById('consistencyStatCards');
      if (el) el.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value">${total.toLocaleString()}</div><div class="stat-label">Total Active Retailers</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color: #10B981;">${tiers['Loyal'].toLocaleString()}</div><div class="stat-label">Loyal (${total > 0 ? (tiers['Loyal']/total*100).toFixed(1) : 0}%)</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color: #818CF8;">${tiers['Regular'].toLocaleString()}</div><div class="stat-label">Regular (${total > 0 ? (tiers['Regular']/total*100).toFixed(1) : 0}%)</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color: #FB7185;">${tiers['One-Time'].toLocaleString()}</div><div class="stat-label">One-Time Trialists</div></div>`;
    }
    else if (type === 'dormant' || type === 'inactive') {
      setTimeout(() => renderInactiveModalCharts(), 120);
    }
  }

  let currentSingleCategoryRetailers = [];
  let currentSingleCatName = '';

  function openSingleCategoryVisualModal(catName) {
    currentSingleCatName = catName;
    const modal = document.getElementById('singleCategoryVisualModal');
    const lblHeader = document.getElementById('txtSingleCatHeaderName');
    const lblBanner = document.getElementById('txtSingleCatBannerName');
    if (!modal) return;

    if (lblHeader) lblHeader.textContent = catName;
    if (lblBanner) lblBanner.textContent = catName;

    // Filter single category retailers
    let filtered = singleCatRetailersList;
    if (catName && catName !== 'Other Categories') {
      filtered = filtered.filter(r => (r.category || '').toLowerCase() === catName.toLowerCase());
    } else if (catName === 'Other Categories') {
      const top6CatNames = Object.entries(singleCatRetailersList.reduce((acc, r) => {
        acc[r.category] = (acc[r.category] || 0) + 1; return acc;
      }, {})).sort((a,b) => b[1] - a[1]).slice(0, 6).map(e => e[0].toLowerCase());

      filtered = filtered.filter(r => !top6CatNames.includes((r.category || '').toLowerCase()));
    }
    currentSingleCategoryRetailers = filtered;

    // Set stat cards
    const stateCounts = {};
    const distCounts = {};
    filtered.forEach(r => {
      const st = r.state || 'Unknown';
      stateCounts[st] = (stateCounts[st] || 0) + 1;
      const dist = r.distributorName || 'Unassigned';
      distCounts[dist] = (distCounts[dist] || 0) + 1;
    });

    const sortedStates = Object.entries(stateCounts).sort((a,b) => b[1] - a[1]);
    const sortedDists = Object.entries(distCounts).sort((a,b) => b[1] - a[1]);

    const elStats = document.getElementById('singleCatStatCards');
    if (elStats) elStats.innerHTML = `
      <div class="modal-stat-card"><div class="stat-value" style="color: #22D3EE;">${filtered.length.toLocaleString()}</div><div class="stat-label">Outlets</div></div>
      <div class="modal-stat-card"><div class="stat-value">${sortedStates.length}</div><div class="stat-label">Active States</div></div>
      <div class="modal-stat-card"><div class="stat-value" style="color: #FBBF24;">${sortedStates.length > 0 ? sortedStates[0][0] : '--'}</div><div class="stat-label">Top State</div></div>`;

    // Render Chart 1: State Network Distribution
    destroyModalChart('singleCatStateBar');
    const ctx1 = document.getElementById('chartSingleCatStateBar')?.getContext('2d');
    if (ctx1) {
      const stLabels = sortedStates.slice(0, 10).map(e => e[0]);
      const stData = sortedStates.slice(0, 10).map(e => e[1]);
      modalCharts['singleCatStateBar'] = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: stLabels,
          datasets: [{ label: 'Outlets', data: stData, backgroundColor: 'rgba(6,182,212,0.85)', borderRadius: 4 }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            datalabels: { display: true, color: '#FFF', font: { size: 9.5, weight: 'bold' } }
          },
          scales: {
            x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#CBD5E1', font: { size: 9.5 } }, grid: { display: false } }
          }
        }
      });
    }

    // Render Chart 2: Top Distributors
    destroyModalChart('singleCatDistributorBar');
    const ctx2 = document.getElementById('chartSingleCatDistributorBar')?.getContext('2d');
    if (ctx2) {
      const distLabels = sortedDists.slice(0, 10).map(e => e[0].length > 18 ? e[0].substring(0,16)+'..' : e[0]);
      const distFullNames = sortedDists.slice(0, 10).map(e => e[0]);
      const distData = sortedDists.slice(0, 10).map(e => e[1]);
      modalCharts['singleCatDistributorBar'] = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: distLabels,
          datasets: [{ label: 'Outlets Mapped', data: distData, backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          onClick: (evt, elements) => {
            if (elements.length > 0) {
              const fullName = distFullNames[elements[0].index];
              if (fullName && fullName !== 'Unassigned') openSingleDistributorDetailModal(fullName);
            }
          },
          plugins: {
            legend: { display: false },
            datalabels: { display: true, color: '#FFF', font: { size: 9.5, weight: 'bold' } },
            tooltip: { callbacks: { label: c => ` 📦 ${c.raw.toLocaleString()} Outlets (Click bar to open partner card)` } }
          },
          scales: {
            x: { ticks: { color: '#94A3B8', maxRotation: 25 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#CBD5E1' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }

    setSingleCategoryTab('visuals');
    renderSingleCategoryCharts();
    renderSingleCategoryTable();
    modal.classList.add('show');
  }
  window.openSingleCategoryVisualModal = openSingleCategoryVisualModal;

  function renderSingleCategoryCharts() {
    if (!currentSingleCategoryRetailers || currentSingleCategoryRetailers.length === 0) return;
    const limit = document.getElementById('selSingleCatRetailerLimit')?.value || 'TOP10';

    let sortedRetailers = [...currentSingleCategoryRetailers];
    if (limit === 'LOW10') {
      sortedRetailers.sort((a, b) => (a.scansCount || a.scans || 0) - (b.scansCount || b.scans || 0));
    } else {
      sortedRetailers.sort((a, b) => (b.scansCount || b.scans || 0) - (a.scansCount || a.scans || 0));
    }

    if (limit === 'TOP10' || limit === 'LOW10') sortedRetailers = sortedRetailers.slice(0, 10);
    else if (limit === 'TOP15') sortedRetailers = sortedRetailers.slice(0, 15);

    destroyModalChart('singleCatRetailersBar');
    const ctx3 = document.getElementById('chartSingleCatRetailersBar')?.getContext('2d');
    if (ctx3) {
      const retLabels = sortedRetailers.map(r => (r.name || 'Unknown').length > 18 ? (r.name || '').substring(0,16)+'..' : (r.name || ''));
      const retFullObjs = sortedRetailers;
      const retData = sortedRetailers.map(r => (r.scansCount || r.scans || 0));
      const isLow = limit === 'LOW10';

      modalCharts['singleCatRetailersBar'] = new Chart(ctx3, {
        type: 'bar',
        data: {
          labels: retLabels,
          datasets: [{
            label: 'Total Scans',
            data: retData,
            backgroundColor: isLow ? 'rgba(244,63,94,0.85)' : 'rgba(34,211,238,0.85)',
            borderColor: isLow ? '#F43F5E' : '#22D3EE',
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          minBarLength: 8,
          onClick: (evt, elements) => {
            if (elements.length > 0) {
              const rObj = retFullObjs[elements[0].index];
              if (rObj) openRetailerDrawer(rObj);
            }
          },
          plugins: {
            legend: { display: false },
            datalabels: { display: true, color: '#FFF', font: { size: 9.5, weight: 'bold' } },
            tooltip: {
              backgroundColor: 'rgba(8,18,36,0.96)',
              borderColor: 'rgba(34,211,238,0.5)',
              borderWidth: 1,
              callbacks: {
                title: items => retFullObjs[items[0]?.dataIndex]?.name || '',
                label: c => ` 📦 Scans: ${c.raw.toLocaleString()}`,
                afterBody: items => {
                  const r = retFullObjs[items[0]?.dataIndex];
                  if (!r) return [];
                  return [
                    ` 📱 Phone: ${r.mobile || 'N/A'}`,
                    ` 📍 Location: ${r.city || 'N/A'}, ${r.state || 'N/A'}`,
                    ` 🏢 Partner: ${r.distributorName || 'Unassigned'}`,
                    ` 👉 Click bar to open full scan drawer →`
                  ];
                }
              }
            }
          },
          scales: {
            x: { ticks: { color: '#94A3B8', maxRotation: 25 }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { beginAtZero: true, ticks: { color: '#CBD5E1' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
  }
  window.renderSingleCategoryCharts = renderSingleCategoryCharts;

  function closeSingleCategoryVisualModal() {
    const modal = document.getElementById('singleCategoryVisualModal');
    if (modal) modal.classList.remove('show');
  }
  window.closeSingleCategoryVisualModal = closeSingleCategoryVisualModal;

  function setSingleCategoryTab(tab) {
    const btnV = document.getElementById('btnSingleCatVisuals');
    const btnD = document.getElementById('btnSingleCatData');
    const viewV = document.getElementById('singleCatViewVisuals');
    const viewD = document.getElementById('singleCatViewData');
    if (btnV && btnD && viewV && viewD) {
      if (tab === 'visuals') {
        btnV.classList.add('active'); btnD.classList.remove('active');
        viewV.style.display = 'block'; viewD.style.display = 'none';
      } else {
        btnD.classList.add('active'); btnV.classList.remove('active');
        viewD.style.display = 'block'; viewV.style.display = 'none';
      }
    }
  }
  window.setSingleCategoryTab = setSingleCategoryTab;

  function renderSingleCategoryTable() {
    const tbody = document.getElementById('tblSingleCategoryBody');
    const q = (document.getElementById('txtSingleCatSearch')?.value || '').trim().toLowerCase();
    if (!tbody) return;

    let list = currentSingleCategoryRetailers;
    if (q) {
      list = list.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.mobile && r.mobile.includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q)) ||
        (r.state && r.state.toLowerCase().includes(q)) ||
        (r.distributorName && r.distributorName.toLowerCase().includes(q))
      );
    }

    tbody.innerHTML = list.map((r, i) => `
      <tr>
        <td style="font-weight: 600; color: #94A3B8;">${escapeHTML(r.id || `RET-${i+1}`)}</td>
        <td style="font-weight: 700; color: #FFF;">${escapeHTML(r.name || 'Unknown Retailer')}</td>
        <td><a href="tel:${escapeHTML(r.mobile || '')}" style="color: #60A5FA; text-decoration: none;">📞 ${escapeHTML(r.mobile || 'N/A')}</a></td>
        <td>${escapeHTML(r.city || 'N/A')}</td>
        <td>${escapeHTML(r.state || 'N/A')}</td>
        <td><span style="color: #FBBF24; cursor: pointer; text-decoration: underline;" onclick="openSingleDistributorDetailModal('${escapeHTML(r.distributorName || '')}')">${escapeHTML(r.distributorName || 'Unassigned')}</span></td>
        <td style="text-align: right; font-weight: 700; color: #22D3EE;">${(r.scansCount || 0).toLocaleString()}</td>
      </tr>
    `).join('');
  }
  window.renderSingleCategoryTable = renderSingleCategoryTable;

  function exportSingleCategoryExcel() {
    if (typeof XLSX === 'undefined') return;
    const rows = currentSingleCategoryRetailers.map((r, i) => ({
      '#': i + 1,
      'Retailer ID': r.id || '',
      'Retailer Name': r.name || '',
      'Mobile Number': r.mobile || '',
      'City': r.city || '',
      'State': r.state || '',
      'Exclusive Category': currentSingleCatName,
      'Mapped Distributor': r.distributorName || 'Unassigned',
      'Total Scans': r.scansCount || 0
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Category_Retailers');
    XLSX.writeFile(wb, `${currentSingleCatName.replace(/[^a-zA-Z0-9]/g, '_')}_Single_Category_Retailers.xlsx`);
  }
  window.exportSingleCategoryExcel = exportSingleCategoryExcel;

  function showUpsellCategoryRetailersTable(catName) {
    openSingleCategoryVisualModal(catName);
  }
  window.showUpsellCategoryRetailersTable = showUpsellCategoryRetailersTable;

  // ==========================================
  function setupModalToggles(modalKey) {
    const btnVisuals = document.getElementById('btn' + modalKey + 'Visuals');
    const btnData = document.getElementById('btn' + modalKey + 'Data');
    const viewVisuals = document.getElementById(modalKey.toLowerCase() + 'ViewVisuals');
    const viewData = document.getElementById(modalKey.toLowerCase() + 'ViewData');
    
    console.log(`Setting up toggles for ${modalKey}`, {btnVisuals, btnData, viewVisuals, viewData});
    
    if (btnVisuals && btnData && viewVisuals && viewData) {
      btnVisuals.addEventListener('click', () => {
        console.log(`${modalKey} Visuals Clicked`);
        btnVisuals.classList.add('active');
        btnData.classList.remove('active');
        viewVisuals.style.display = 'block';
        viewData.style.display = 'none';
      });
      btnData.addEventListener('click', () => {
        console.log(`${modalKey} Data Clicked`);
        btnData.classList.add('active');
        btnVisuals.classList.remove('active');
        viewData.style.display = 'flex';
        viewVisuals.style.display = 'none';
      });
    } else {
      console.warn(`Missing elements for modal toggles: ${modalKey}`);
    }
  }

  ['Upsell', 'Pending', 'Distributor', 'Bronze', 'Consistency', 'Dormant'].forEach(setupModalToggles);

  function resetModalToggle(modalKey) {
    const btnVisuals = document.getElementById('btn' + modalKey + 'Visuals');
    const btnData = document.getElementById('btn' + modalKey + 'Data');
    const viewVisuals = document.getElementById(modalKey.toLowerCase() + 'ViewVisuals');
    const viewData = document.getElementById(modalKey.toLowerCase() + 'ViewData');
    if (btnVisuals && btnData && viewVisuals && viewData) {
      btnVisuals.classList.add('active');
      btnData.classList.remove('active');
      viewVisuals.style.display = 'block';
      viewData.style.display = 'none';
    }
  }

  // Open/Close Upsell Target List Modal
  function openUpsellModal() {
    resetModalToggle('Upsell');
    renderUpsellModalTable();
    if (elUpsellSearch) elUpsellSearch.value = '';
    if (elUpsellModal) elUpsellModal.classList.add('show');
    renderModalInsights('upsell');
  }

  function closeUpsellModal() {
    if (elUpsellModal) elUpsellModal.classList.remove('show');
  }

  // Render the Modal Table dynamically
  function renderUpsellModalTable() {
    const q = elUpsellSearch ? elUpsellSearch.value.trim().toLowerCase() : '';
    
    // Filter matching rows
    const filteredRows = singleCatRetailersList.filter(r => {
      return String(r.id).toLowerCase().includes(q) ||
             r.name.toLowerCase().includes(q) ||
             r.mobile.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q) ||
             r.state.toLowerCase().includes(q) ||
             r.category.toLowerCase().includes(q);
    });

    if (filteredRows.length === 0) {
      if (elTblUpsellBody) {
        elTblUpsellBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching upsell target retailers found.</td></tr>`;
      }
      return;
    }

    if (elTblUpsellBody) {
      elTblUpsellBody.innerHTML = filteredRows.map(r => `
        <tr>
          <td><span style="font-family: monospace; color: var(--text-secondary);">${r.id}</span></td>
          <td><strong>${escapeHTML(r.name)}</strong></td>
          <td><span style="color: var(--text-secondary); font-family: monospace;">${escapeHTML(r.mobile)}</span></td>
          <td>${escapeHTML(r.city)}</td>
          <td><span class="badge badge-glow" style="background: rgba(99,102,241,0.1); color: #818CF8; border: 1px solid rgba(99,102,241,0.2);">${escapeHTML(r.state)}</span></td>
          <td><span class="badge" style="background: rgba(6,182,212,0.15); color: #22D3EE; font-weight: 600;">${escapeHTML(r.category)}</span></td>
          <td style="text-align: right; font-weight: 700; color: var(--text-primary);">${r.scans.toLocaleString()} Scans</td>
        </tr>
      `).join('');
    }
  }

  // Export Modal List to Excel (SheetJS)
  function exportUpsellExcel() {
    if (singleCatRetailersList.length === 0) {
      alert('No upsell target data available to export.');
      return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // Prepare formatted data
    const exportData = singleCatRetailersList.map(r => ({
      "Retailer ID": r.id,
      "Retailer Name": r.name,
      "Mobile Number": r.mobile,
      "City": r.city,
      "State": r.state,
      "Scanned Category": r.category,
      "Total Scans in July": r.scans
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Apply styling helper
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "0F172A" } }; // Slate 900
    const headerFont = { name: "Arial", size: 11, bold: true, color: { rgb: "FFFFFF" } };
    
    // Format headers
    const cols = ["A", "B", "C", "D", "E", "F", "G"];
    cols.forEach(c => {
      const cellRef = `${c}1`;
      if (ws[cellRef]) {
        ws[cellRef].s = { fill: headerFill, font: headerFont, alignment: { horizontal: "left" } };
      }
    });
    
    XLSX.utils.book_append_sheet(wb, ws, "Upsell_Targets");
    XLSX.writeFile(wb, "JGH_Upsell_Opportunities_July2026.xlsx");
  }


  // Open/Close Pending Outlets Modal
  function openPendingModal() {
    resetModalToggle('Pending');
    renderPendingModalTable();
    if (elPendingSearch) elPendingSearch.value = '';
    if (elPendingModal) elPendingModal.classList.add('show');
    renderModalInsights('pending');
  }

  function closePendingModal() {
    if (elPendingModal) elPendingModal.classList.remove('show');
  }

  // Render the Pending Modal Table dynamically
  function renderPendingModalTable() {
    const q = elPendingSearch ? elPendingSearch.value.trim().toLowerCase() : '';
    
    // Filter matching rows
    const filteredRows = pendingRetailersList.filter(r => {
      return r.city.toLowerCase().includes(q) ||
             r.district.toLowerCase().includes(q) ||
             r.state.toLowerCase().includes(q) ||
             r.zone.toLowerCase().includes(q);
    });

    if (filteredRows.length === 0) {
      if (elTblPendingBody) {
        elTblPendingBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching territory records found.</td></tr>`;
      }
      return;
    }

    if (elTblPendingBody) {
      elTblPendingBody.innerHTML = filteredRows.map(r => `
        <tr>
          <td><strong>${escapeHTML(r.city)}</strong></td>
          <td>${escapeHTML(r.district)}</td>
          <td><span class="badge badge-glow" style="background: rgba(6,182,212,0.1); color: #22D3EE; border: 1px solid rgba(6,182,212,0.2);">${escapeHTML(r.state)}</span></td>
          <td>${escapeHTML(r.zone)}</td>
          <td style="text-align: right; font-weight: 600;">${r.retailersCount.toLocaleString()} Outlets</td>
          <td style="text-align: right; font-weight: 700; color: var(--text-primary);">${r.scansCount.toLocaleString()} Scans</td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${r.boxCount.toFixed(1)}</td>
          <td style="text-align: right; font-weight: 600;">${r.avgScans.toFixed(1)}</td>
        </tr>
      `).join('');
    }
  }

  // Export Pending Modal List to Excel (SheetJS)
  function exportPendingExcel() {
    if (pendingRetailersList.length === 0) {
      alert('No territory data available to export.');
      return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // Prepare formatted data
    const exportData = pendingRetailersList.map(r => ({
      "City Name": r.city,
      "District": r.district,
      "State Name": r.state,
      "Zone": r.zone,
      "Active Retailers": r.retailersCount,
      "Total Scans": r.scansCount,
      "Calculated Box Count": r.boxCount,
      "Avg Scans per Retailer": r.avgScans
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Apply styling helper (Cyan color scheme for territory)
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "0E7490" } }; // Cyan 700
    const headerFont = { name: "Arial", size: 11, bold: true, color: { rgb: "FFFFFF" } };
    
    // Format headers
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];
    cols.forEach(c => {
      const cellRef = `${c}1`;
      if (ws[cellRef]) {
        ws[cellRef].s = { fill: headerFill, font: headerFont, alignment: { horizontal: "left" } };
      }
    });
    
    XLSX.utils.book_append_sheet(wb, ws, "Territory_Penetration");
    XLSX.writeFile(wb, "JGH_Territory_Penetration_July2026.xlsx");
  }

  // Open/Close Distributor Pending Modal
  function openDistributorModal() {
    currentSingleDistScope = 'national';
    resetModalToggle('Distributor');
    renderDistributorModalTable();
    if (elDistributorSearch) elDistributorSearch.value = '';
    if (elDistributorModal) elDistributorModal.classList.add('show');
    renderModalInsights('distributor');
  }

  function closeDistributorModal() {
    if (elDistributorModal) elDistributorModal.classList.remove('show');
  }

  // Render the Distributor Modal Table dynamically
  function renderDistributorModalTable() {
    const q = elDistributorSearch ? elDistributorSearch.value.trim().toLowerCase() : '';
    
    // Filter matching rows
    const filteredRows = pendingDistributorsList.filter(d => {
      return d.name.toLowerCase().includes(q) ||
             d.state.toLowerCase().includes(q) ||
             d.city.toLowerCase().includes(q);
    });

    if (filteredRows.length === 0) {
      if (elTblDistributorBody) {
        elTblDistributorBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching distributors found.</td></tr>`;
      }
      return;
    }

    if (elTblDistributorBody) {
      elTblDistributorBody.innerHTML = filteredRows.map(d => `
        <tr>
          <td><strong>${escapeHTML(d.name)}</strong></td>
          <td><span class="badge badge-glow" style="background: rgba(99,102,241,0.1); color: #818CF8; border: 1px solid rgba(99,102,241,0.2);">${escapeHTML(d.state)}</span></td>
          <td>${escapeHTML(d.city)}</td>
          <td style="text-align: right; font-weight: 600;">
            ${d.retailersCount.toLocaleString()} / ${d.totalRegistered.toLocaleString()}
            <span style="font-size: 11px; color: var(--text-muted); display: block; font-weight: normal;">
              ${d.totalRegistered > 0 ? ((d.retailersCount / d.totalRegistered) * 100).toFixed(1) + '%' : '0.0%'} Coverage
            </span>
          </td>
          <td style="text-align: right; font-weight: 700; color: var(--text-primary);">${d.scansCount.toLocaleString()} Scans</td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${d.boxCount.toFixed(1)}</td>
          <td style="text-align: right; font-weight: 600;">${d.avgScans.toFixed(1)}</td>
        </tr>
      `).join('');
    }
  }

  // Export Distributor Modal List to Excel (SheetJS)
  function exportDistributorExcel() {
    if (pendingDistributorsList.length === 0) {
      alert('No distributor data available to export.');
      return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // Prepare formatted data
    const exportData = pendingDistributorsList.map(d => ({
      "Distributor Name": d.name,
      "State": d.state,
      "City / Zone": d.city,
      "Active Retailers (Scanned)": d.retailersCount,
      "Registered Retailers (Total)": d.totalRegistered,
      "Retailer Coverage %": d.totalRegistered > 0 ? ((d.retailersCount / d.totalRegistered) * 100).toFixed(1) + '%' : '0.0%',
      "Total Scans": d.scansCount,
      "Calculated Box Count": d.boxCount,
      "Avg Scans per Retailer": d.avgScans
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Apply styling helper (Indigo color scheme for distributor)
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "3730A3" } }; // Indigo 800
    const headerFont = { name: "Arial", size: 11, bold: true, color: { rgb: "FFFFFF" } };
    
    // Format headers
    const cols = ["A", "B", "C", "D", "E", "F", "G"];
    cols.forEach(c => {
      const cellRef = `${c}1`;
      if (ws[cellRef]) {
        ws[cellRef].s = { fill: headerFill, font: headerFont, alignment: { horizontal: "left" } };
      }
    });
    
    XLSX.utils.book_append_sheet(wb, ws, "Distributor_Leaderboard");
    XLSX.writeFile(wb, "JGH_Distributor_Leaderboard_July2026.xlsx");
  }

  // Open/Close Bronze Upgrade Modal
  function openBronzeModal() {
    resetModalToggle('Bronze');
    renderBronzeModalTable();
    if (elBronzeSearch) elBronzeSearch.value = '';
    if (elBronzeModal) elBronzeModal.classList.add('show');
    renderModalInsights('bronze');
  }

  function closeBronzeModal() {
    if (elBronzeModal) elBronzeModal.classList.remove('show');
  }

  // Render the Bronze Modal Table dynamically
  function renderBronzeModalTable() {
    const q = elBronzeSearch ? elBronzeSearch.value.trim().toLowerCase() : '';
    
    // Filter matching rows
    const filteredRows = bronzeRetailersList.filter(r => {
      return String(r.id).toLowerCase().includes(q) ||
             r.name.toLowerCase().includes(q) ||
             r.mobile.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q) ||
             r.state.toLowerCase().includes(q);
    });

    if (filteredRows.length === 0) {
      if (elTblBronzeBody) {
        elTblBronzeBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching Bronze tier retailers found.</td></tr>`;
      }
      return;
    }

    if (elTblBronzeBody) {
      elTblBronzeBody.innerHTML = filteredRows.map(r => `
        <tr>
          <td><span style="font-family: monospace; color: var(--text-secondary);">${r.id}</span></td>
          <td><strong>${escapeHTML(r.name)}</strong></td>
          <td><span style="color: var(--text-secondary); font-family: monospace;">${escapeHTML(r.mobile)}</span></td>
          <td>${escapeHTML(r.city)}</td>
          <td><span class="badge badge-glow" style="background: rgba(245,158,11,0.1); color: #FBBF24; border: 1px solid rgba(245,158,11,0.2);">${escapeHTML(r.state)}</span></td>
          <td style="text-align: right; font-weight: 700; color: var(--text-primary);">${r.currentScans.toLocaleString()} Scans</td>
          <td style="text-align: right; font-weight: 700; color: #F59E0B;">+${r.scansNeeded.toLocaleString()} Needed</td>
        </tr>
      `).join('');
    }
  }

  // Export Bronze Modal List to Excel (SheetJS)
  function exportBronzeExcel() {
    if (bronzeRetailersList.length === 0) {
      alert('No Bronze tier data available to export.');
      return;
    }
    
    const wb = XLSX.utils.book_new();
    
    // Prepare formatted data
    const exportData = bronzeRetailersList.map(r => ({
      "Retailer ID": r.id,
      "Retailer Name": r.name,
      "Mobile Number": r.mobile,
      "City": r.city,
      "State": r.state,
      "Current Scans in July": r.currentScans,
      "Scans Needed for Silver": r.scansNeeded
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Apply styling helper (Amber color scheme for bronze upgrade)
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "78350F" } }; // Amber 900
    const headerFont = { name: "Arial", size: 11, bold: true, color: { rgb: "FFFFFF" } };
    
    // Format headers
    const cols = ["A", "B", "C", "D", "E", "F", "G"];
    cols.forEach(c => {
      const cellRef = `${c}1`;
      if (ws[cellRef]) {
        ws[cellRef].s = { fill: headerFill, font: headerFont, alignment: { horizontal: "left" } };
      }
    });
    
    XLSX.utils.book_append_sheet(wb, ws, "Bronze_Upgrade_Targets");
    XLSX.writeFile(wb, "JGH_Bronze_Upgrade_Targets_July2026.xlsx");
  }

  // ==========================================
  // NEW BUSINESS INSIGHTS — All 6 Calculations
  // ==========================================
  function updateNewBusinessInsights() {
    const totalScans = filteredScans.length;
    if (totalScans === 0) return;

    // --- Build retailer detail lookup ---
    const retailerDetailsMap = {};
    const retScansCountMap = {};
    const retBoxCountMap = {};
    const retDaysActiveMap = {};
    const retLastScanMap = {};
    const retFirstScanMap = {};
    const retCatMapNew = {};

    filteredScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id;
      const scanDate = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '');
      const isB5 = s.uom === 'B5';
      const boxWeight = isB5 ? 0.5 : 1.0;
      
      if (!retailerDetailsMap[rid]) {
        retailerDetailsMap[rid] = {
          name: s.retailer_name || `Retailer ${rid}`,
          mobile: s.mobile_number || 'N/A',
          city: s.city || 'N/A',
          state: s.State_Name || 'N/A'
        };
      }
      retScansCountMap[rid] = (retScansCountMap[rid] || 0) + 1;
      retBoxCountMap[rid] = (retBoxCountMap[rid] || 0) + boxWeight;
      
      if (!retDaysActiveMap[rid]) retDaysActiveMap[rid] = new Set();
      if (scanDate && scanDate !== 'undefined') retDaysActiveMap[rid].add(scanDate);
      
      if (scanDate && scanDate !== 'undefined') {
        if (!retLastScanMap[rid] || scanDate > retLastScanMap[rid]) {
          retLastScanMap[rid] = scanDate;
        }
        if (!retFirstScanMap[rid] || scanDate < retFirstScanMap[rid]) {
          retFirstScanMap[rid] = scanDate;
        }
      }

      if (!retCatMapNew[rid]) retCatMapNew[rid] = new Set();
      if (s.Category_Name) retCatMapNew[rid].add(s.Category_Name);
    });

    // ============================
    // 1. WEEKEND VS WEEKDAY
    // ============================
    const dayNameCounts = {};
    let weekendScans = 0, weekdayScans = 0;
    
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    filteredScans.forEach(s => {
      const dn = s.day_name;
      if (validDays.includes(dn)) {
        dayNameCounts[dn] = (dayNameCounts[dn] || 0) + 1;
        if (dn === 'Saturday' || dn === 'Sunday') weekendScans++;
        else weekdayScans++;
      }
    });
    
    const totalValidScans = weekendScans + weekdayScans;
    const weekdayPct = totalValidScans > 0 ? ((weekdayScans / totalValidScans) * 100).toFixed(1) : '0.0';
    const weekendPct = totalValidScans > 0 ? ((weekendScans / totalValidScans) * 100).toFixed(1) : '0.0';
    
    let bestDay = '--', bestDayCount = 0, worstDay = '--', worstDayCount = Infinity;
    Object.entries(dayNameCounts).forEach(([day, count]) => {
      if (day && count > bestDayCount) { bestDayCount = count; bestDay = day; }
      if (day && count < worstDayCount) { worstDayCount = count; worstDay = day; }
    });

    const elWeekdayPct = document.getElementById('insWeekdayPct');
    const elWeekendPct = document.getElementById('insWeekendPct');
    const elBestDay = document.getElementById('insBestDay');
    const elWorstDay = document.getElementById('insWorstDay');
    if (elWeekdayPct) elWeekdayPct.textContent = `${weekdayPct}%`;
    if (elWeekendPct) elWeekendPct.textContent = `${weekendPct}%`;
    if (elBestDay) elBestDay.textContent = bestDay;
    if (elWorstDay) elWorstDay.textContent = worstDay;

    // ============================
    // 2. RETAILER CONSISTENCY SCORE
    // ============================
    let loyalCount = 0, regularCount = 0, occasionalCount = 0, oneTimeCount = 0;
    consistencyRetailersList = [];

    Object.entries(retScansCountMap).forEach(([rid, scans]) => {
      const daysSet = retDaysActiveMap[rid];
      const daysActive = daysSet ? daysSet.size : 0;
      let tier = 'One-Time';
      
      if (scans >= 50) { tier = 'Loyal'; loyalCount++; }
      else if (scans >= 20) { tier = 'Regular'; regularCount++; }
      else if (scans >= 5) { tier = 'Occasional'; occasionalCount++; }
      else { oneTimeCount++; }

      const details = retailerDetailsMap[rid] || { name: 'Unknown', mobile: 'N/A', city: 'N/A', state: 'N/A' };
      consistencyRetailersList.push({
        id: rid,
        name: details.name,
        mobile: details.mobile,
        city: details.city,
        state: details.state,
        daysActive: daysActive,
        totalScans: scans,
        tier: tier
      });
    });

    // Sort: Loyal first, then by total scans descending
    const tierOrder = { 'Loyal': 0, 'Regular': 1, 'Occasional': 2, 'One-Time': 3 };
    consistencyRetailersList.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || b.totalScans - a.totalScans);

    const elConsistentRetailers = document.getElementById('kpiConsistentRetailers');
    const elConsistentSub = document.getElementById('kpiConsistentSub');
    if (elConsistentRetailers) elConsistentRetailers.textContent = loyalCount.toLocaleString();
    if (elConsistentSub) elConsistentSub.textContent = `${loyalCount.toLocaleString()} Loyal (50+ scans), ${regularCount.toLocaleString()} Regular (20-49 scans)`;

    // ============================
    // 3. CATEGORY DIVERSITY INDEX
    // ============================
    const diversityRetailerIds = Object.keys(retCatMapNew);
    let totalCatsPerRetailer = 0;
    diversityRetailerIds.forEach(rid => {
      totalCatsPerRetailer += retCatMapNew[rid].size;
    });
    const avgDiversity = diversityRetailerIds.length > 0 ? (totalCatsPerRetailer / diversityRetailerIds.length).toFixed(1) : '0.0';

    // Find state with lowest diversity
    const stateCatDiversity = {};
    const stateRetCountDiversity = {};
    filteredScans.forEach(s => {
      const st = s.State_Name;
      const rid = s.status_retailer_id || s.retailer_id;
      if (!stateCatDiversity[st]) { stateCatDiversity[st] = {}; stateRetCountDiversity[st] = new Set(); }
      stateRetCountDiversity[st].add(rid);
      if (!stateCatDiversity[st][rid]) stateCatDiversity[st][rid] = new Set();
      if (s.Category_Name) stateCatDiversity[st][rid].add(s.Category_Name);
    });
    
    let lowestDivState = '--';
    let lowestDivAvg = 999;
    let highestDivState = '--';
    let highestDivAvg = 0;
    Object.entries(stateCatDiversity).forEach(([st, retMap]) => {
      let sumCats = 0;
      const rids = Object.keys(retMap);
      rids.forEach(rid => sumCats += retMap[rid].size);
      const avg = rids.length > 0 ? sumCats / rids.length : 0;
      if (avg > 0 && avg < lowestDivAvg && rids.length >= 3) {
        lowestDivAvg = avg;
        lowestDivState = st;
      }
      if (avg > highestDivAvg && rids.length >= 3) {
        highestDivAvg = avg;
        highestDivState = st;
      }
    });

    const elCatDiversity = document.getElementById('kpiCatDiversity');
    const elCatDiversitySub = document.getElementById('kpiCatDiversitySub');
    if (elCatDiversity) elCatDiversity.textContent = avgDiversity;
    if (elCatDiversitySub) elCatDiversitySub.textContent = lowestDivState !== '--' 
      ? `Lowest: ${lowestDivState} (${lowestDivAvg.toFixed(1)} avg)` 
      : 'Avg categories per retailer';

    highestDiversityStateName = highestDivState;
    highestDiversityRetailersList = [];
    if (highestDivState !== '--') {
      const highStateScans = filteredScans.filter(s => s.State_Name === highestDivState);
      const highStateRetMap = {};
      highStateScans.forEach(s => {
        const rid = s.status_retailer_id || s.retailer_id;
        if (!rid) return;
        if (!highStateRetMap[rid]) {
          highStateRetMap[rid] = {
            id: rid,
            name: s.retailer_name || 'N/A',
            mobile: s.mobile_number || 'N/A',
            city: s.city || 'N/A',
            state: s.State_Name || 'N/A',
            scansCount: 0,
            boxCount: 0,
            categories: new Set()
          };
        }
        const isB5 = s.uom === 'B5';
        const bCount = isB5 ? 0.5 : 1.0;
        highStateRetMap[rid].scansCount++;
        highStateRetMap[rid].boxCount += bCount;
        if (s.Category_Name) highStateRetMap[rid].categories.add(s.Category_Name);
      });
      highestDiversityRetailersList = Object.values(highStateRetMap).map(r => ({
        ...r,
        categoriesCount: r.categories.size
      })).sort((a, b) => b.categoriesCount - a.categoriesCount || b.scansCount - a.scansCount);
    }

    const elTopDiversity = document.getElementById('kpiTopDiversityState');
    const elTopDiversitySub = document.getElementById('kpiTopDiversityStateSub');
    if (elTopDiversity) elTopDiversity.textContent = highestDivState;
    if (elTopDiversitySub) elTopDiversitySub.textContent = highestDivState !== '--'
      ? `Highest: ${highestDivState} (${highestDivAvg.toFixed(1)} avg)`
      : '--';

    // ============================
    // 4. GROWTH MOMENTUM (W-o-W)
    // ============================
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0;
    filteredScans.forEach(s => {
      const dayNum = parseInt(s.day_num) || parseInt(String(s.scan_date || '').slice(8, 10)) || 0;
      if (dayNum >= 1 && dayNum <= 7) w1++;
      else if (dayNum >= 8 && dayNum <= 14) w2++;
      else if (dayNum >= 15 && dayNum <= 21) w3++;
      else if (dayNum >= 22) w4++;
    });

    const w4VsW3 = w3 > 0 ? (((w4 - w3) / w3) * 100).toFixed(1) : '0.0';
    const momentumArrow = parseFloat(w4VsW3) > 0 ? '📈' : parseFloat(w4VsW3) < 0 ? '📉' : '➡️';
    const momentumColor = parseFloat(w4VsW3) > 0 ? '#10B981' : parseFloat(w4VsW3) < 0 ? '#F43F5E' : '#94A3B8';

    const elGrowthMomentum = document.getElementById('insGrowthMomentum');
    const elWeekTrend = document.getElementById('insWeekTrend');
    if (elGrowthMomentum) {
      elGrowthMomentum.innerHTML = `<span style="color: ${momentumColor}">${momentumArrow} ${w4VsW3 > 0 ? '+' : ''}${w4VsW3}%</span>`;
    }
    if (elWeekTrend) {
      elWeekTrend.textContent = `W1: ${w1.toLocaleString()} → W2: ${w2.toLocaleString()} → W3: ${w3.toLocaleString()} → W4: ${w4.toLocaleString()}`;
    }

    // ============================
    // 5. DORMANT RETAILERS ALERT (CHURN RISK BY CUMULATIVE MONTHLY AVERAGE TARGET FROM STARTING DATE TO JULY)
    // ============================
    const masterRetailerMap = {};
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      dashboardData.all_retailers.forEach(r => {
        const rid = r.status_retailer_id || r.retailer_id;
        if (rid) {
          masterRetailerMap[rid] = r;
        }
      });
    }

    dormantRetailersList = [];
    let totalDormantBoxesAtRisk = 0;
    const evalEnd = new Date('2026-07-31');

    const dormantRetailerIds = new Set([
      ...Object.keys(masterRetailerMap),
      ...Object.keys(retLastScanMap),
      ...filteredScans.map(s => s.status_retailer_id || s.retailer_id)
    ]);

    dormantRetailerIds.forEach(rid => {
      if (!rid || rid === 'undefined') return;
      const master = masterRetailerMap[rid] || {};
      const details = retailerDetailsMap[rid] || { 
        name: master.retailer_name || master.name || `Retailer ${rid}`, 
        mobile: master.mobile_number || master.mobile || 'N/A', 
        city: master.city || 'N/A', 
        state: master.State_Name || master.state || 'N/A' 
      };

      const lastScan = master.last_scan ? String(master.last_scan).slice(0, 10) : (retLastScanMap[rid] || '--');
      const firstScan = master.first_scan ? String(master.first_scan).slice(0, 10) : (retFirstScanMap[rid] || (lastScan !== '--' ? lastScan : '2026-07-01'));
      const daysSilent = lastScan !== '--' ? Math.max(0, Math.floor((evalEnd - new Date(lastScan)) / 86400000)) : 999;
      const startDate = new Date(firstScan);
      const lastDate = lastScan !== '--' ? new Date(lastScan) : evalEnd;
      const juneEnd = new Date('2026-06-30');

      const activeSpanDays = Math.max(1, Math.floor((lastDate - startDate) / 86400000) + 1);
      const cumulativeBoxes = master.box_count !== undefined ? master.box_count : (retBoxCountMap[rid] || 0);
      const cumulativeScans = master.total_scans !== undefined ? master.total_scans : (retScansCountMap[rid] || 0);

      let preJulyMonthlyAvg = 0;
      if (startDate <= juneEnd) {
        const preJulySpanDays = Math.max(1, Math.floor((juneEnd - startDate) / 86400000) + 1);
        preJulyMonthlyAvg = parseFloat(((cumulativeBoxes / activeSpanDays) * 30.0).toFixed(1));
      }

      if (daysSilent >= 60 && daysSilent < 999) {
        totalDormantBoxesAtRisk += cumulativeBoxes;
        dormantRetailersList.push({
          id: rid,
          name: details.name || master.retailer_name || master.name || `Retailer ${rid}`,
          mobile: details.mobile || master.mobile_number || master.mobile || 'N/A',
          city: details.city || master.city || 'N/A',
          state: details.state || master.State_Name || master.state || 'N/A',
          firstScanDate: firstScan,
          lastScanDate: lastScan,
          daysSilent: daysSilent,
          preJulyMonthlyAvg: preJulyMonthlyAvg,
          julyBoxes: cumulativeBoxes,
          julyScans: cumulativeScans,
          boxCount: cumulativeBoxes
        });
      }
    });
    
    // Sort by highest July box count descending
    dormantRetailersList.sort((a, b) => b.julyBoxes - a.julyBoxes || b.julyScans - a.julyScans);

    const elDormantRetailers = document.getElementById('kpiDormantRetailers');
    const elDormantSub = document.getElementById('kpiDormantSub');
    if (elDormantRetailers) elDormantRetailers.textContent = dormantRetailersList.length.toLocaleString();
    if (elDormantSub) elDormantSub.textContent = dormantRetailersList.length > 0 
      ? `${dormantRetailersList.length} retailers stopped scanning (${totalDormantBoxesAtRisk.toFixed(1)} Boxes at Risk!)`
      : 'No dormant retailers detected';

    // ============================
    // 6. TOP RISING STATES
    // ============================
    const stateFirstHalf = {};
    const stateSecondHalf = {};
    
    filteredScans.forEach(s => {
      const st = s.State_Name;
      if (!st) return;
      const dayNum = parseInt(s.day_num) || parseInt(String(s.scan_date || '').slice(8, 10)) || 0;
      if (dayNum >= 1 && dayNum <= 15) stateFirstHalf[st] = (stateFirstHalf[st] || 0) + 1;
      if (dayNum >= 16) stateSecondHalf[st] = (stateSecondHalf[st] || 0) + 1;
    });

    const allStatesForGrowth = new Set([...Object.keys(stateFirstHalf), ...Object.keys(stateSecondHalf)]);
    const stateGrowthList = [];
    allStatesForGrowth.forEach(st => {
      const first = stateFirstHalf[st] || 0;
      const second = stateSecondHalf[st] || 0;
      if (first > 5) { // Only states with meaningful volume
        const growthPct = ((second - first) / first * 100).toFixed(1);
        stateGrowthList.push({ state: st, growth: parseFloat(growthPct), first, second });
      }
    });
    
    stateGrowthList.sort((a, b) => b.growth - a.growth);
    const top5Rising = stateGrowthList.slice(0, 5);

    const elRisingStates = document.getElementById('insRisingStates');
    if (elRisingStates) {
      if (top5Rising.length > 0) {
        elRisingStates.innerHTML = top5Rising.map(s => {
          const arrow = s.growth > 0 ? '↑' : '↓';
          const color = s.growth > 0 ? '#10B981' : '#F43F5E';
          return `${s.state} <span style="color:${color}">${arrow}${s.growth > 0 ? '+' : ''}${s.growth}%</span>`;
        }).join(', ');
      } else {
        elRisingStates.textContent = 'Insufficient data';
      }
    }
  }

  // ==========================================
  // CONSISTENCY MODAL — Open / Close / Render / Export
  // ==========================================
  function buildConsistencyRetailersList() {
    if (consistencyRetailersList && consistencyRetailersList.length > 0) return;

    const retailersList = (dashboardData && Array.isArray(dashboardData.all_retailers))
      ? dashboardData.all_retailers
      : [];

    let loyalCount = 0, regularCount = 0, occasionalCount = 0, oneTimeCount = 0;
    consistencyRetailersList = [];

    retailersList.forEach(r => {
      const scans = r.scans_6m !== undefined ? r.scans_6m : (r.scans || 0);
      let tier = 'One-Time';
      if (scans >= 50) { tier = 'Loyal'; loyalCount++; }
      else if (scans >= 20) { tier = 'Regular'; regularCount++; }
      else if (scans >= 5) { tier = 'Occasional'; occasionalCount++; }
      else { oneTimeCount++; }

      const st = r.State_Name || r.state || 'N/A';
      const city = r.city || r.district || 'N/A';

      consistencyRetailersList.push({
        id: r.status_retailer_id || r.id || 'N/A',
        name: r.retailer_name || r.name || `Retailer #${r.id}`,
        mobile: r.mobile_number || r.mobile || 'N/A',
        city: city,
        state: st,
        daysActive: r.days_active || Math.min(31, Math.max(1, Math.round(scans / 2))),
        totalScans: scans,
        tier: tier
      });
    });

    const tierOrder = { 'Loyal': 0, 'Regular': 1, 'Occasional': 2, 'One-Time': 3 };
    consistencyRetailersList.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier] || b.totalScans - a.totalScans);

    const elConsistentRetailers = document.getElementById('kpiConsistentRetailers');
    const elConsistentSub = document.getElementById('kpiConsistentSub');
    if (elConsistentRetailers) elConsistentRetailers.textContent = loyalCount.toLocaleString();
    if (elConsistentSub) elConsistentSub.textContent = `${loyalCount.toLocaleString()} Loyal (50+ scans), ${regularCount.toLocaleString()} Regular (20-49 scans)`;
  }
  window.buildConsistencyRetailersList = buildConsistencyRetailersList;

  // Open/Close Consistency Modal
  function openConsistencyModal() {
    resetModalToggle('Consistency');
    if (elConsistencySearch) elConsistencySearch.value = '';
    if (elConsistencyModal) {
      elConsistencyModal.style.display = 'flex';
      elConsistencyModal.classList.add('show');
    }
    buildConsistencyRetailersList();
    renderConsistencyModalTable();
    renderModalInsights('consistency');
  }

  function closeConsistencyModal() {
    if (elConsistencyModal) {
      elConsistencyModal.classList.remove('show');
      elConsistencyModal.style.display = 'none';
    }
  }





  function renderConsistencyModalTable() {
    const q = elConsistencySearch ? elConsistencySearch.value.trim().toLowerCase() : '';
    
    const filteredRows = consistencyRetailersList.filter(r => {
      return String(r.id).toLowerCase().includes(q) ||
             r.name.toLowerCase().includes(q) ||
             r.mobile.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q) ||
             r.state.toLowerCase().includes(q) ||
             r.tier.toLowerCase().includes(q);
    });

    if (filteredRows.length === 0) {
      if (elTblConsistencyBody) {
        elTblConsistencyBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching retailers found.</td></tr>`;
      }
      return;
    }

    if (elTblConsistencyBody) {
      elTblConsistencyBody.innerHTML = filteredRows.map(r => {
        const tierColors = {
          'Loyal': 'background: rgba(16,185,129,0.15); color: #34D399; border: 1px solid rgba(16,185,129,0.3);',
          'Regular': 'background: rgba(99,102,241,0.15); color: #818CF8; border: 1px solid rgba(99,102,241,0.3);',
          'Occasional': 'background: rgba(245,158,11,0.15); color: #FBBF24; border: 1px solid rgba(245,158,11,0.3);',
          'One-Time': 'background: rgba(244,63,94,0.15); color: #FB7185; border: 1px solid rgba(244,63,94,0.3);'
        };
        return `
          <tr>
            <td><span style="font-family: monospace; color: var(--text-secondary);">${r.id}</span></td>
            <td><strong>${escapeHTML(r.name)}</strong></td>
            <td><span style="color: var(--text-secondary); font-family: monospace;">${escapeHTML(r.mobile)}</span></td>
            <td>${escapeHTML(r.city)}</td>
            <td><span class="badge badge-glow" style="background: rgba(99,102,241,0.1); color: #818CF8; border: 1px solid rgba(99,102,241,0.2);">${escapeHTML(r.state)}</span></td>
            <td style="text-align: right; font-weight: 700; color: #10B981;">${r.totalScans.toLocaleString()} Scans</td>
            <td style="text-align: right; font-weight: 700; color: var(--text-secondary);">${r.daysActive} Days</td>
            <td><span class="badge" style="${tierColors[r.tier] || ''} font-weight: 600; padding: 4px 10px; border-radius: 6px;">${r.tier}</span></td>
          </tr>
        `;
      }).join('');
    }
  }

  function exportConsistencyExcel() {
    if (consistencyRetailersList.length === 0) {
      alert('No consistency data available to export.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const exportData = consistencyRetailersList.map(r => ({
      "Retailer ID": r.id,
      "Retailer Name": r.name,
      "Mobile Number": r.mobile,
      "City": r.city,
      "State": r.state,
      "Days Active in July": r.daysActive,
      "Total Scans in July": r.totalScans,
      "Consistency Tier": r.tier
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "312E81" } };
    const headerFont = { name: "Arial", size: 11, bold: true, color: { rgb: "FFFFFF" } };
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H"];
    cols.forEach(c => {
      const cellRef = `${c}1`;
      if (ws[cellRef]) {
        ws[cellRef].s = { fill: headerFill, font: headerFont, alignment: { horizontal: "left" } };
      }
    });
    XLSX.utils.book_append_sheet(wb, ws, "Retailer_Consistency");
    XLSX.writeFile(wb, "JGH_Retailer_Consistency_July2026.xlsx");
  }

  // ==========================================
  // DORMANT RETAILERS MODAL — Open / Close / Render / Export
  // ==========================================
  let inactiveModalBarChart = null;

  function renderInactiveModalCharts() {
    const ctxBar = document.getElementById('chartDormantBar')?.getContext('2d');
    if (!ctxBar) return;
    if (inactiveModalBarChart) inactiveModalBarChart.destroy();

    const mode = window.currentDormantModalMode || 'inactive';
    const listToAnalyze = (mode === 'inactive') ? inactiveRetailersList : dormantRetailersList;

    const stateMap = {};
    listToAnalyze.forEach(r => {
      const st = r.state || r.State_Name || 'Unknown';
      stateMap[st] = (stateMap[st] || 0) + 1;
    });

    const limitMode = (document.getElementById('selInactiveStateLimit')?.value) || 'ALL';
    let allStates = Object.entries(stateMap).sort((a, b) => b[1] - a[1]);

    let sortedStates = [];
    if (limitMode === 'LOW10') {
      sortedStates = [...allStates].sort((a, b) => a[1] - b[1]).slice(0, 10);
    } else if (limitMode === 'TOP10') {
      sortedStates = [...allStates].slice(0, 10);
    } else {
      sortedStates = [...allStates];
    }

    const stateBarLabels = sortedStates.map(x => x[0]);
    const stateBarData = sortedStates.map(x => x[1]);

    inactiveModalBarChart = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: stateBarLabels,
        datasets: [{
          label: 'Inactive Outlets (0 Scans)',
          data: stateBarData,
          backgroundColor: 'rgba(244,63,94,0.85)',
          borderColor: '#FB7185',
          borderWidth: 1,
          borderRadius: 4,
          minBarLength: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        onHover: (evt, elements) => {
          const target = evt?.native?.target || evt?.target;
          if (target) target.style.cursor = 'pointer';
        },
        onClick: (evt, elements, chart) => {
          let active = elements;
          if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
            try { active = chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true); } catch (e) {}
          }
          let idx = -1;
          if (active && active.length > 0) {
            idx = active[0].index;
          } else if (chart && chart.scales && chart.scales.y && evt.y !== undefined) {
            const yVal = Math.round(chart.scales.y.getValueForPixel(evt.y));
            if (yVal >= 0 && yVal < sortedStates.length) idx = yVal;
          }
          if (idx >= 0 && idx < sortedStates.length) {
            const stateName = stateBarLabels[idx];
            if (stateName) {
              closeDormantModal();
              openStateDistributorDrilldown(stateName, mode === 'dormant' ? 'dormant' : 'inactive');
            }
          }
        },
        plugins: {
          legend: { display: false },
          datalabels: { display: true, color: '#FFF', anchor: 'end', align: 'start', font: { size: 9, weight: 'bold' }, formatter: v => v.toLocaleString() },
          tooltip: { callbacks: { label: ctx => ` ${mode === 'dormant' ? '⚠️' : '🔴'} ${ctx.parsed.x.toLocaleString()} ${mode === 'dormant' ? 'Dormant Outlets (No Scans 2M)' : 'Inactive Outlets (0 Scans)'} — click to view distributor breakdown` } }
        },
        scales: {
          x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#CBD5E1', font: { size: 9 } }, grid: { display: false } }
        }
      }
    });
  }

  window.renderInactiveModalCharts = renderInactiveModalCharts;

  function openDormantModal(mode = 'dormant') {
    window.currentDormantModalMode = mode;
    resetModalToggle('Dormant');
    renderDormantModalTable();
    if (elDormantSearch) elDormantSearch.value = '';
    if (elDormantModal) elDormantModal.classList.add('show');
    setTimeout(() => renderInactiveModalCharts(), 120);
  }

  function closeDormantModal() {
    if (elDormantModal) elDormantModal.classList.remove('show');
  }

  function renderDormantModalTable() {
    const q = elDormantSearch ? elDormantSearch.value.trim().toLowerCase() : '';
    const mode = window.currentDormantModalMode || 'dormant';
    
    // Dynamically adjust modal title and info text based on view mode
    const elTitle = document.querySelector('#dormantModal .modal-header h3');
    const elDesc = document.querySelector('#dormantModal .modal-explanation p');
    if (elTitle) {
      if (mode === 'inactive') {
        elTitle.innerHTML = `<i class="fa-solid fa-circle-xmark text-rose"></i> Inactive Outlets (0 Scans in July & June)`;
      } else {
        elTitle.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-rose"></i> Dormant Retailers & Churn Risk (Stopped Scanning)`;
      }
    }
    if (elDesc) {
      if (mode === 'inactive') {
        elDesc.innerHTML = `Detailed breakdown of registered retailers who have <strong>not scanned any boxes</strong> during the evaluation period.`;
      } else {
        elDesc.innerHTML = `Side-by-side comparative analysis for registered retailers who have <strong>not scanned in the last 2 months</strong>.`;
      }
    }

    const listToRender = (mode === 'inactive') ? inactiveRetailersList : dormantRetailersList;
    const filteredRows = listToRender.filter(r => {
      return String(r.id).toLowerCase().includes(q) ||
             r.name.toLowerCase().includes(q) ||
             r.mobile.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q) ||
             r.state.toLowerCase().includes(q);
    });

    if (filteredRows.length === 0) {
      if (elTblDormantBody) {
        elTblDormantBody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching retailer records found.</td></tr>`;
      }
      return;
    }

    if (elTblDormantBody) {
      elTblDormantBody.innerHTML = filteredRows.map(r => {
        const lastDate = r.lastScanDate || 'N/A';
        const daysSilent = r.daysSilent !== undefined ? r.daysSilent : 'N/A';
        const julyBoxText = `${(r.julyBoxes || r.boxCount || 0).toFixed(1)} Boxes (${(r.julyScans || 0).toLocaleString()} Scans)`;
        const distName = r.distributor_name || r.distributor || 'Unknown Partner';

        return `
          <tr>
            <td><span style="font-family: monospace; color: var(--text-secondary);">${r.id}</span></td>
            <td><strong style="color: #60A5FA; cursor: pointer;" onclick="handleRetailerClick('${r.id}', '${escapeHTML(distName)}')">${escapeHTML(r.name)}</strong></td>
            <td><span style="color: var(--text-secondary); font-family: monospace;">${escapeHTML(r.mobile)}</span></td>
            <td>${escapeHTML(r.city)}</td>
            <td><span class="badge badge-glow" style="background: rgba(99,102,241,0.1); color: #818CF8; border: 1px solid rgba(99,102,241,0.2);">${escapeHTML(r.state)}</span></td>
            <td><span style="color: #60A5FA; font-weight: 700; cursor: pointer;" onclick="openSingleDistributorDetailModal('${distName.replace(/'/g, "\\'")}')" title="Click to open distributor card">${escapeHTML(distName)}</span></td>
            <td><span style="color: #38BDF8; font-family: monospace; font-weight: 700;">${lastDate}</span></td>
            <td style="text-align: center;"><span class="badge ${daysSilent > 14 ? 'pill-rose' : 'pill-amber'}">${daysSilent === 999 ? 'Never Scanned' : daysSilent + ' Days Silent'}</span></td>
            <td style="text-align: right; font-weight: 700; color: #10B981;">${julyBoxText}</td>
            <td style="text-align: center;">
              <button onclick="openSingleDistributorDetailModal('${distName.replace(/'/g, "\\'")}')" style="background: rgba(99,102,241,0.15); color: #818CF8; border: 1px solid rgba(99,102,241,0.3); padding: 4px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 700;">
                <i class="fa-solid fa-building"></i> Partner Card ➡️
              </button>
            </td>
          </tr>
        `;
      }).join('');

      // Add click listeners to all rows and buttons to slide open the side drawer
      const rows = elTblDormantBody.querySelectorAll('tr');
      rows.forEach(tr => {
        tr.addEventListener('click', (e) => {
          const btn = tr.querySelector('.btn-view-scans-slide');
          if (btn) {
            const rid = btn.getAttribute('data-rid');
            if (rid) openRetailerDrawer(rid);
          }
        });
      });
    }
  }

  function exportDormantExcel() {
    const mode = window.currentDormantModalMode || 'dormant';
    const listToExport = (mode === 'inactive') ? inactiveRetailersList : dormantRetailersList;
    if (listToExport.length === 0) {
      alert('No retailer data available to export.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const exportData = listToExport.map(r => ({
      "Retailer ID": r.id,
      "Retailer Name": r.name,
      "Mobile Number": r.mobile,
      "City": r.city,
      "State": r.state,
      "First Scan Date": r.firstScanDate || '--',
      "Last Scan Date": r.lastScanDate || '--',
      "Days Silent": r.daysSilent === 999 ? 'Never Scanned' : r.daysSilent,
      "July 2026 Boxes": r.julyBoxes || r.boxCount || 0,
      "July 2026 Total Scans": r.julyScans || 0
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "312E81" } };
    const headerFont = { name: "Arial", size: 11, bold: true, color: { rgb: "FFFFFF" } };
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    cols.forEach(c => {
      const cellRef = `${c}1`;
      if (ws[cellRef]) {
        ws[cellRef].s = { fill: headerFill, font: headerFont, alignment: { horizontal: "left" } };
      }
    });
    XLSX.utils.book_append_sheet(wb, ws, mode === 'inactive' ? "Inactive_Retailers" : "Dormant_Retailers");
    XLSX.writeFile(wb, mode === 'inactive' ? "JGH_Inactive_Retailers_July2026.xlsx" : "JGH_Dormant_Retailers_July2026.xlsx");
  }

  // ==========================================
  // SLIDE-OUT SIDE PANEL (DRAWER) LOGIC
  // ==========================================
  let currentDrawerScans = [];
  let currentDrawerRetailer = null;

  function openRetailerDrawer(ridOrObj) {
    let rid = '';
    let objData = null;
    if (typeof ridOrObj === 'object' && ridOrObj !== null) {
      objData = ridOrObj;
      rid = String(objData.id || objData.status_retailer_id || objData.retailer_id || '');
    } else {
      rid = String(ridOrObj || '');
    }
    const ridStr = String(rid).trim();

    const foundInActive = activeRetailersList.find(r => String(r.id || r.status_retailer_id) === ridStr);
    const foundInDormant = dormantRetailersList.find(r => String(r.id || r.status_retailer_id) === ridStr);
    const foundInInactive = inactiveRetailersList.find(r => String(r.id || r.status_retailer_id) === ridStr);
    const foundInSingleCat = singleCatRetailersList.find(r => String(r.id || r.status_retailer_id) === ridStr);
    const foundInMaster = (dashboardData && Array.isArray(dashboardData.all_retailers))
      ? dashboardData.all_retailers.find(r => String(r.status_retailer_id || r.id) === ridStr)
      : null;

    const found = foundInActive || foundInDormant || foundInInactive || foundInSingleCat || foundInMaster;

    // Filter scans from allScans
    const sourceScans = (allScans && allScans.length > 0) ? allScans : (filteredScans || []);
    currentDrawerScans = sourceScans.filter(s => String(s.status_retailer_id || s.retailer_id) === ridStr);

    const firstScan = currentDrawerScans.length > 0 ? currentDrawerScans[0] : null;

    const rInfo = {
      id: ridStr || (objData && (objData.id || objData.status_retailer_id)) || 'N/A',
      name: (objData && objData.name && !String(objData.name).includes('[object')) ? objData.name : 
            (objData && objData.retailer_name) ? objData.retailer_name :
            (found && (found.retailer_name || found.name)) ? (found.retailer_name || found.name) :
            (firstScan && firstScan.retailer_name) ? firstScan.retailer_name : `Retailer #${ridStr}`,
      mobile: (objData && objData.mobile && objData.mobile !== 'N/A') ? objData.mobile :
              (objData && objData.mobile_number && objData.mobile_number !== 'N/A') ? objData.mobile_number :
              (found && (found.mobile_number || found.mobile)) ? (found.mobile_number || found.mobile) :
              (firstScan && firstScan.mobile_number) ? firstScan.mobile_number : 'N/A',
      city: (objData && objData.city && objData.city !== 'N/A') ? objData.city :
            (found && found.city) ? found.city :
            (firstScan && firstScan.city) ? firstScan.city : 'N/A',
      state: (objData && objData.state && objData.state !== 'N/A') ? objData.state :
             (found && (found.State_Name || found.state)) ? (found.State_Name || found.state) :
             (firstScan && firstScan.State_Name) ? firstScan.State_Name : 'N/A',
      boxCount: (objData && typeof objData.boxCount === 'number' && objData.boxCount > 0) ? objData.boxCount :
                (found && typeof found.boxCount === 'number' && found.boxCount > 0) ? found.boxCount :
                currentDrawerScans.reduce((sum, s) => sum + (s.uom === 'B5' ? 0.5 : 1.0), 0),
      daysSilent: (objData && objData.daysSilent !== undefined) ? objData.daysSilent :
                  (found && found.daysSilent !== undefined) ? found.daysSilent : '--'
    };
    currentDrawerRetailer = rInfo;

    // Update Header Labels
    const elName = document.getElementById('lblDrawerRetailerName');
    const elMeta = document.getElementById('lblDrawerRetailerMeta');
    if (elName) elName.textContent = `${rInfo.name}`;
    if (elMeta) elMeta.textContent = `ID: ${rInfo.id} | Mobile: ${rInfo.mobile} | City: ${rInfo.city} | State: ${rInfo.state}`;

    // Render Stat Cards
    const elGrid = document.getElementById('drawerStatsGrid');
    if (elGrid) {
      elGrid.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value" style="color: #38BDF8;">${currentDrawerScans.length.toLocaleString()}</div><div class="stat-label">Total Raw Scans</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color: #F59E0B;">${rInfo.boxCount.toFixed(1)}</div><div class="stat-label">Scanned Boxes</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color: #F43F5E;">${rInfo.daysSilent} Days</div><div class="stat-label">Days Silent</div></div>
      `;
    }

    // Render Table Rows
    const elBody = document.getElementById('tblDrawerScansBody');
    if (elBody) {
      if (currentDrawerScans.length === 0) {
        elBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No scan transactions found for this retailer.</td></tr>`;
      } else {
        elBody.innerHTML = currentDrawerScans.map((s, idx) => {
          const scanTime = s.scan_date || s.retailer_scanned_at || '--';
          const sku = s.sku_code ? `${s.sku_code} - ${s.sku_description || ''}` : (s.sku_description || 'Unknown SKU');
          const cat = s.Category_Name || 'Unknown Category';
          const uom = s.uom || 'N/A';
          const box = (uom === 'B5') ? 0.5 : 1.0;
          const dist = s.distributor_name || 'Direct / N/A';
          return `
            <tr>
              <td><span style="font-family: monospace; color: var(--text-muted);">${idx + 1}</span></td>
              <td><span style="font-family: monospace; color: var(--text-primary);">${scanTime}</span></td>
              <td><strong>${escapeHTML(sku)}</strong></td>
              <td><span class="badge" style="background: rgba(99,102,241,0.15); color: #818CF8;">${escapeHTML(cat)}</span></td>
              <td><span style="font-family: monospace; color: var(--text-secondary);">${uom}</span></td>
              <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${box}</td>
              <td><span style="color: var(--text-secondary);">${escapeHTML(dist)}</span></td>
            </tr>
          `;
        }).join('');
      }
    }

    // Show Drawer
    const elDrawer = document.getElementById('dormantSideDrawer');
    const elOverlay = document.getElementById('dormantDrawerOverlay');
    if (elDrawer) elDrawer.classList.add('show');
    if (elOverlay) elOverlay.classList.add('show');
  }

  function closeRetailerDrawer() {
    const elDrawer = document.getElementById('dormantSideDrawer');
    const elOverlay = document.getElementById('dormantDrawerOverlay');
    if (elDrawer) elDrawer.classList.remove('show');
    if (elOverlay) elOverlay.classList.remove('show');
  }

  function exportDrawerScansExcel() {
    if (!currentDrawerRetailer || currentDrawerScans.length === 0) {
      alert('No scan transaction data available for this retailer.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const exportData = currentDrawerScans.map((s, idx) => ({
      "Scan #": idx + 1,
      "Retailer ID": currentDrawerRetailer.id,
      "Retailer Name": currentDrawerRetailer.name,
      "Scan Timestamp": s.scan_date || s.retailer_scanned_at || '--',
      "SKU Code": s.sku_code || 'N/A',
      "SKU Description": s.sku_description || 'N/A',
      "Category": s.Category_Name || 'N/A',
      "UOM": s.uom || 'N/A',
      "Box Weight": (s.uom === 'B5') ? 0.5 : 1.0,
      "Distributor Name": s.distributor_name || 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, `Retailer_Scans`);
    XLSX.writeFile(wb, `Raw_Scans_Retailer_${currentDrawerRetailer.id}.xlsx`);
  }

  window.openRetailerDrawer = openRetailerDrawer;

  // CSV Export Utility with Filtered Insights
  function exportCSV() {
    if (filteredScans.length === 0) {
      alert('No data available to export.');
      return;
    }

    const totalFilteredScans = filteredScans.length;
    const totalFilteredB5 = filteredScans.filter(s => s.uom === 'B5').length;
    const totalFilteredB10 = filteredScans.filter(s => s.uom === 'B10').length;
    const totalCalculatedBoxes = (totalFilteredB5 * 0.5) + (totalFilteredB10 * 1.0);
    const uniqueRetailers = new Set(filteredScans.map(s => s.status_retailer_id || s.retailer_id)).size;
    const startStr = elFilterStartDate && elFilterStartDate.value ? elFilterStartDate.value : '2026-07-01';
    const endStr = elFilterEndDate && elFilterEndDate.value ? elFilterEndDate.value : '2026-07-31';

    let csv = `=== DYNAMIC FILTERED INSIGHTS ===\n`;
    csv += `Date Range:,${startStr} to ${endStr}\n`;
    csv += `Total Scans:,${totalFilteredScans}\n`;
    csv += `Calculated Boxes:,${totalCalculatedBoxes}\n`;
    csv += `Active Retailers:,${uniqueRetailers}\n`;
    csv += `B5 Scans:,${totalFilteredB5}\n`;
    csv += `B10 Scans:,${totalFilteredB10}\n`;
    csv += `\n=== RAW DATA ===\n`;

    const headers = ["retailer_id", "status_retailer_id", "retailer_name", "mobile_number", "pincode", "city", "State_Name", "Category_Name", "sku_code", "uom", "mrp", "unit_price", "Box_count", "retailer_scanned_at", "scan_date"];
    csv += headers.join(',') + '\n';
    filteredScans.forEach(row => {
      row.Box_count = row.uom === 'B5' ? 0.5 : 1.0;
      const line = headers.map(h => `"${String(row[h] !== undefined ? row[h] : '').replace(/"/g, '""')}"`).join(',');
      csv += line + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Retailer_Scans_${startStr}_to_${endStr}.csv`;
    link.click();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Fallback Data
  function getFallbackData() {
    const states = ["Uttar Pradesh", "Maharashtra", "Bihar", "Gujarat", "Tamil Nadu", "Karnataka", "West Bengal", "Rajasthan", "Madhya Pradesh", "Telangana"];
    const cats = ["Comfy Trunk & Briefs", "Comfy Vest", "Sporto Neo", "Athleisure Outerwear", "Ladies Comfort", "Kids Soft"];
    const uoms = ["B5", "B10"];
    const dists = ["Mahalaxmi Agency", "Sri Venkateswara Tr.", "Balaji Trading Co.", "Gupta Enterprises", "Royal Marketing"];
    
    const sampleScans = [];
    for (let i = 1; i <= 300; i++) {
      const day = (i % 31) + 1;
      const dayStr = day < 10 ? '0' + day : '' + day;
      const st = states[i % states.length];
      const cat = cats[i % cats.length];
      const uom = uoms[i % uoms.length];
      const dist = dists[i % dists.length];
      const rid = 50000 + (i % 40);
      sampleScans.append ? null : sampleScans.push({
        id: i,
        status_retailer_id: rid,
        retailer_id: rid,
        retailer_name: `Retailer Partner ${rid}`,
        mobile_number: `98765${10000 + i}`,
        pincode: '400001',
        city: `${st} Hub ${i % 5}`,
        district: `${st} Hub ${i % 5}`,
        zone: 'North',
        State_Name: st,
        Category_Name: cat,
        sku_code: `SKU-${1000 + i}`,
        uom: uom,
        mrp: 500,
        unit_price: 350,
        invoiced_quantity: 1,
        retailer_scanned_at: `2026-07-${dayStr} 10:30:00`,
        distributor_name: dist,
        scan_date: `2026-07-${dayStr}`,
        day_name: 'Wednesday',
        day_num: day
      });
    }

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
      all_scans: sampleScans
    };
  }

  // Open/Close Low Penetration Modal
  function openLowPenetrationModal() {
    renderLowPenetrationModalTable();
    if (elLowPenetrationSearch) elLowPenetrationSearch.value = '';
    if (elLblLowPenetrationStateName) elLblLowPenetrationStateName.textContent = lowPenetrationStateName;
    if (elLowPenetrationModal) elLowPenetrationModal.classList.add('show');
  }

  function closeLowPenetrationModal() {
    if (elLowPenetrationModal) elLowPenetrationModal.classList.remove('show');
  }

  function renderLowPenetrationModalTable() {
    const q = elLowPenetrationSearch ? elLowPenetrationSearch.value.trim().toLowerCase() : '';
    
    const filteredRows = lowPenetrationRetailersList.filter(r => {
      return String(r.id).toLowerCase().includes(q) ||
             r.name.toLowerCase().includes(q) ||
             r.mobile.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q) ||
             r.state.toLowerCase().includes(q);
    });

    if (filteredRows.length === 0) {
      if (elTblLowPenetrationBody) {
        elTblLowPenetrationBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching retailers found.</td></tr>`;
      }
      return;
    }

    if (elTblLowPenetrationBody) {
      elTblLowPenetrationBody.innerHTML = filteredRows.map(r => `
        <tr>
          <td><span style="font-family: monospace; color: var(--text-secondary);">${r.id}</span></td>
          <td><strong>${escapeHTML(r.name)}</strong></td>
          <td><span style="color: var(--text-secondary); font-family: monospace;">${escapeHTML(r.mobile)}</span></td>
          <td>${escapeHTML(r.city)}</td>
          <td><span class="badge badge-glow" style="cursor:pointer; background: rgba(244,63,94,0.15); color: #FB7185; border: 1px solid rgba(244,63,94,0.3);" onclick="closeAllModals(); openStateDistributorDrilldown('${escapeHTML(r.state)}', 'all')" title="Click to view distributor breakdown & state graphs">${escapeHTML(r.state)}</span></td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${r.boxCount.toFixed(1)}</td>
          <td style="text-align: right; font-weight: 700; color: var(--text-primary);">${r.scansCount.toLocaleString()} Scans</td>
        </tr>
      `).join('');
    }
  }

  function exportLowPenetrationExcel() {
    if (lowPenetrationRetailersList.length === 0) {
      alert('No data available to export.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const exportData = lowPenetrationRetailersList.map(r => ({
      "Retailer ID": r.id,
      "Retailer Name": r.name,
      "Mobile Number": r.mobile,
      "City": r.city,
      "State": r.state,
      "Scanned Boxes": r.boxCount,
      "Total Scans": r.scansCount
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "F43F5E" } }; // Rose 500
    const headerFont = { name: "Arial", size: 11, bold: true, color: { rgb: "FFFFFF" } };
    
    // Format headers
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = { fill: headerFill, font: headerFont, alignment: { horizontal: "left" } };
      }
    }
    XLSX.utils.book_append_sheet(wb, ws, "Low_Penetration_Retailers");
    XLSX.writeFile(wb, `JGH_Retailers_${lowPenetrationStateName.replace(/\s+/g, '_')}_July2026.xlsx`);
  }

  // Open/Close Highest Diversity Modal
  function openHighestDiversityModal() {
    renderHighestDiversityModalTable();
    if (elHighestDiversitySearch) elHighestDiversitySearch.value = '';
    if (elLblHighestDiversityStateName) elLblHighestDiversityStateName.textContent = highestDiversityStateName;
    if (elHighestDiversityModal) elHighestDiversityModal.classList.add('show');
  }

  function closeHighestDiversityModal() {
    if (elHighestDiversityModal) elHighestDiversityModal.classList.remove('show');
  }

  function renderHighestDiversityModalTable() {
    const q = elHighestDiversitySearch ? elHighestDiversitySearch.value.trim().toLowerCase() : '';
    
    const filteredRows = highestDiversityRetailersList.filter(r => {
      return String(r.id).toLowerCase().includes(q) ||
             r.name.toLowerCase().includes(q) ||
             r.mobile.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q) ||
             r.state.toLowerCase().includes(q);
    });

    if (filteredRows.length === 0) {
      if (elTblHighestDiversityBody) {
        elTblHighestDiversityBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No matching retailers found.</td></tr>`;
      }
      return;
    }

    if (elTblHighestDiversityBody) {
      elTblHighestDiversityBody.innerHTML = filteredRows.map(r => `
        <tr>
          <td><span style="font-family: monospace; color: var(--text-secondary);">${r.id}</span></td>
          <td><strong>${escapeHTML(r.name)}</strong></td>
          <td><span style="color: var(--text-secondary); font-family: monospace;">${escapeHTML(r.mobile)}</span></td>
          <td>${escapeHTML(r.city)}</td>
          <td><span class="badge badge-glow" style="cursor:pointer; background: rgba(99,102,241,0.15); color: #818CF8; border: 1px solid rgba(99,102,241,0.3);" onclick="closeAllModals(); openStateDistributorDrilldown('${escapeHTML(r.state)}', 'all')" title="Click to view distributor breakdown & state graphs">${escapeHTML(r.state)}</span></td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${r.categoriesCount} Categories</td>
          <td style="text-align: right; font-weight: 700; color: var(--text-primary);">${r.boxCount.toFixed(1)}</td>
          <td style="text-align: right; font-weight: 700; color: var(--text-secondary);">${r.scansCount.toLocaleString()} Scans</td>
        </tr>
      `).join('');
    }
  }

  function exportHighestDiversityExcel() {
    if (highestDiversityRetailersList.length === 0) {
      alert('No data available to export.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const exportData = highestDiversityRetailersList.map(r => ({
      "Retailer ID": r.id,
      "Retailer Name": r.name,
      "Mobile Number": r.mobile,
      "City": r.city,
      "State": r.state,
      "Unique Categories Scanned": r.categoriesCount,
      "Scanned Boxes": r.boxCount,
      "Total Scans": r.scansCount
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "3730A3" } }; // Indigo 800
    const headerFont = { name: "Arial", size: 11, bold: true, color: { rgb: "FFFFFF" } };
    
    // Format headers
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: range.s.r, c: col });
      if (ws[cellRef]) {
        ws[cellRef].s = { fill: headerFill, font: headerFont, alignment: { horizontal: "left" } };
      }
    }
    XLSX.utils.book_append_sheet(wb, ws, "Highest_Diversity_Retailers");
    XLSX.writeFile(wb, `JGH_Retailers_Diversity_${highestDiversityStateName.replace(/\s+/g, '_')}_July2026.xlsx`);
  }

  // Make modal & navigation functions globally accessible for inline onclick handlers
  
  // ==========================================
  // INDIA SVG MAP & STATE HUB (Section 3 & 6 in Business Requirements)
  // ==========================================
  
  // Upgraded Map Drilldown State
  let currentSelectedMapState = 'ALL';
  let mapDrillLevel = 'PAN-INDIA'; // 'PAN-INDIA', 'STATE', 'DISTRICT'
  let mapSelectedState = '';
  let mapSelectedDistrict = '';

  const statePaths = [
      { id: "an", name: "Andaman and Nicobar Islands", d: "m 537.188,685.44148 -0.041,0.4695 0.768,0.30627 0.104,2.47542 1.258,1.84675 -0.71,-0.0232 0.661,0.93295 -0.574,0.18739 -0.437,0.94503 0.103,1.88201 -0.409,0.42617 -0.663,-0.49065 -0.502,1.30269 -0.461,-0.2156 0.224,-1.08911 -0.606,-0.31434 -0.121,-1.2503 -0.813,-0.73346 0.069,-0.77879 -1.076,-1.12336 -0.646,0.17933 -0.121,-1.96159 0.365,-0.27304 -0.4,-0.27001 0.64,-1.36616 0.994,0.0584 0.564,-0.57427 0.878,0.27505 0.092,-0.68006 0.86,-0.14307 z m -2.826,-4.29496 0.895,1.77017 -2.249,2.47845 -0.57,-1.39035 0.238,-1.31478 1.704,-0.4695 -0.018,-1.07399 z m -6.972,-12.28743 0.62,0.37378 0.054,0.95511 0.372,-0.12392 0.733,0.79995 -0.07,1.22108 -0.819,-0.73849 -1.384,0.38789 -0.288,-0.63372 0.323,-0.48259 -0.855,0.17027 0.198,-1.45785 1.116,-0.47151 z m 3.502,-0.0695 0.743,0.76973 -0.11,1.34098 -1.472,-1.19389 0.529,-0.85234 0.383,0.60853 -0.073,-0.67301 z m 0.656,-2.05731 0.291,1.85178 -0.652,-1.69864 0.361,-0.15314 z m -1.091,-2.2447 0.394,0.70928 -0.884,1.04981 0.947,1.26743 0.041,1.10422 -0.412,-0.27001 -0.465,0.31837 -0.158,0.77476 -0.325,-0.99943 0.426,0.0796 0.114,-0.58536 0.146,0.45237 0.247,-0.67099 -0.938,0.56621 0.092,-0.83824 -0.627,-0.64883 -0.116,-1.08809 1.518,-1.22109 z m -6.096,-0.7264 0.087,0.94704 -0.404,-0.51281 0.317,-0.43423 z m -2.282,-1.91123 0.359,0.19848 -0.356,1.48404 1.639,1.28758 -0.11,0.45942 -1.593,-0.57024 -0.756,-1.02865 0.157,-1.47599 0.66,-0.35464 z m -1.725,-2.48851 0.285,0.72439 -0.466,-0.2005 0.181,-0.52389 z m 11.976,-2.12381 0.554,2.22556 -0.33,0.0282 -0.08,0.96619 -0.144,-3.21996 z m -17.337,-14.22082 0.765,1.02563 0.632,-0.27504 -0.606,0.35464 0.105,1.13444 -0.86,0.46244 -1.209,-0.15818 -0.228,-1.89409 0.96,-0.0353 0.151,-0.86645 0.29,0.25187 z m -5.693,-35.18985 0.303,0.69114 0.034,-0.42113 0.553,0.46244 0.043,1.32486 0.571,0.30426 0.19,2.31624 -1.188,1.3984 0.616,0.72339 -1.181,1.43165 -1.64,-0.7798 -1.035,0.34255 0.738,-1.75809 -0.843,-1.12537 -0.088,-2.43411 0.448,0.45035 1.244,-2.15202 0.892,-0.62565 0.231,0.45942 0.112,-0.60853 z m 2.629,-13.08436 0.929,1.5727 -0.763,0.62868 0.924,0.42415 -0.055,0.36472 -1.862,0.51684 -0.434,-0.43927 0.123,-0.72237 0.751,-0.10478 -0.195,-1.47195 0.582,-0.76872 z m -0.926,-0.67402 -0.284,0.15415 0.186,-0.91783 0.098,0.76368 z m -7.918,-1.08407 1.085,0.17632 -0.019,1.31679 -1.158,-0.1481 0.092,-1.34501 z m 6.716,-0.23474 0.622,0.3093 -0.822,0.74252 0.2,-1.05182 z m 10.071,-5.13723 1.075,0.16624 -0.465,0.49972 -0.716,-0.34457 0.106,-0.32139 z m -1.074,-4.07532 0.271,-0.21158 0.564,0.52793 0.933,2.47844 -0.237,0.44733 -0.886,-1.45482 -0.543,0.0383 -1.023,-1.01455 0.826,-1.1556 0.095,0.34457 z m 0.412,-1.48405 0.074,1.27046 -0.647,-0.61256 -0.046,-0.72641 0.619,0.0685 z m 0.807,-1.15963 0.371,2.3918 -0.807,-0.65185 0.006,-0.67401 -1.081,-0.74958 0.615,-0.12695 0.421,0.57831 0.475,-0.76772 z m 0.855,-1.16466 0.553,1.47598 -0.427,1.26038 -0.784,-1.06593 0.658,-1.67043 z m -7.699,-0.52088 0.06,1.5052 0.968,-0.15717 -0.584,2.06436 1.288,0.63271 -0.452,0.56521 -0.476,-0.43625 -0.055,0.53498 0.673,0.36169 -1.042,0.80298 0.111,2.37769 0.468,-1.74801 0.792,-0.0836 0.084,0.74555 -0.687,4.25768 -0.257,-0.22467 -0.058,0.48561 -0.813,-0.3637 0.133,0.79189 -0.88,0.34759 0.156,0.61356 0.294,-0.32945 0.144,0.38285 0.739,-0.78081 -0.176,-0.57931 0.734,0.44632 -0.947,4.02394 -0.272,-0.63674 -1.076,-0.31937 0.008,-1.07601 -0.615,0.20452 -0.202,-1.21806 0.583,0.0897 0.174,-0.4433 -0.264,-0.31233 -0.496,0.35061 -0.418,-1.78427 -0.55,0.50173 -0.324,-3.01141 -0.489,0.20553 -0.198,-0.48058 1.023,-2.1097 0.51,1.2624 0.312,-0.20553 0.053,0.83421 0.144,-0.28009 0.264,-4.95991 1.616,-2.84819 z m 0.75,0.37277 0.37,-0.0131 -0.121,0.73346 -0.526,-0.0897 0.277,-0.6307 z m 3.455,-0.807 0.246,0.70021 -0.456,-0.22971 -0.099,0.44733 -0.164,-0.60853 0.473,-0.3093 z m 3.685,-0.13097 0.187,0.52994 0.404,-0.49267 -0.109,1.20698 -0.783,-0.54102 0.301,-0.70323 z m -2.854,-0.40401 -0.404,1.06996 -0.432,-1.22915 0.529,0.16423 0.161,-0.64379 0.146,0.63875 z m -3.45,-0.63271 1.278,0.37076 0.601,-0.27102 0.48,0.85134 -0.638,0.43221 0.453,1.08709 -0.71,-0.0554 0.088,0.85738 -0.591,-0.16523 -0.426,0.74152 0.215,0.5108 -1.001,0.93596 -0.534,-0.67401 0.644,-3.04566 -0.578,-0.18639 0.169,-0.60651 0.297,0.21459 0.359,-0.45639 -0.106,-0.54103 z m 22.254,-0.22568 0.744,0.70223 0.114,1.10321 -1.131,-0.17632 -0.248,-0.86644 0.521,-0.76268 z m -18.511,-2.01398 -0.482,1.18481 -0.272,-0.10982 0.235,-1.08406 0.519,0.009 z m -5.117,-8.89721 0.142,2.36661 -0.486,-1.68957 0.344,-0.67704 z m 3.934,-1.86588 0.482,0.0766 -0.353,0.58737 0.48,0.0252 0.547,1.64928 -0.418,0.71431 0.97,1.37624 -0.47,1.44375 0.217,3.1313 -0.76,0.34254 -0.021,0.31938 0.562,-0.0403 -0.893,0.51483 -0.017,0.81204 -1.764,-0.46949 1.351,2.31019 -1.306,0.3758 -1.274,-0.36774 -0.351,0.51584 -0.719,-0.0997 -0.439,-0.60551 0.168,-5.76087 -0.481,-0.23978 0.412,0.0141 1.029,-1.36013 -0.528,-0.48057 0.377,-0.63069 -0.465,-2.24672 0.291,0.36068 1.548,-1.94044 0.653,0.52189 0,0 0.628,-0.14911 0,0 0.544,-0.70021 z m -4.254,-1.63618 0.507,0.29217 0.034,1.9344 -0.425,1.01455 -0.541,0.11385 0.285,0.41105 -0.437,0.73447 -0.419,-1.68957 0.448,-2.16209 0.548,-0.64883 z m 6.511,-0.1078 -0.569,0.64379 0.07,0.69819 -0.646,-0.12996 0.163,-1.03974 0.261,0.42416 0.721,-0.59644 z m 0.475,-12.41236 0.326,1.0357 -0.216,1.94044 0.222,0.67603 0.337,-0.37076 0.198,0.32341 -0.326,0.51483 0.739,0.99642 -0.519,0.70726 -0.691,-0.90876 -0.617,-0.1743 -0.355,0.52692 -0.337,-0.67502 -0.412,0.35161 1.233,0.51483 0.063,0.93395 0.704,-0.11384 -0.007,0.49065 0.437,-0.28714 -0.721,2.016 0.056,2.10668 -0.648,1.12739 -0.797,-0.13904 0.185,0.47655 -0.837,-1.03369 -0.385,0.14709 -0.306,0.69517 0.771,1.08609 -0.548,0.53195 -0.113,-0.82715 -0.517,0.0494 -0.583,1.18884 0.388,0.95007 0,0 -0.628,0.14911 0,0 -1.021,-0.81909 -10e-4,-1.5314 0.505,-0.0242 0.143,-0.55815 -0.769,-0.1209 0.174,-1.53039 0.535,-0.14911 -0.256,-0.65689 0.785,-0.26396 -0.791,-0.29923 0.378,-1.79838 0.559,-0.44229 -0.669,-0.43121 0.413,-0.53196 -0.431,-0.16825 0.372,-1.40042 0.576,-0.23172 -0.5,-0.35867 0.518,0 0.343,-0.59241 -0.262,-0.89869 1.21,-0.65286 -0.25,-0.74756 0.989,-0.1743 0.506,0.35867 -0.023,-0.97626 0.467,0.67099 0.404,-0.67804 z m -0.285,-2.21549 0.251,1.06089 -1.069,-0.6055 0.818,-0.45539 z m 13.096,-26.52437 -0.617,1.4518 0.021,-0.82615 0.596,-0.62565 z", labelX: 530, labelY: 600, color: '#3B82F6' },
      { id: "ap", name: "Andhra Pradesh", d: "m 295.438,482.23741 -0.002,0.007 0,0 0.002,-0.007 z m 0.652,-0.0393 -0.389,2.49054 -0.753,-1.07903 -0.016,-0.80298 1.158,-0.60853 z m -0.652,0.0393 -0.122,-0.62767 -0.272,0.4433 -1.262,0.0977 -0.058,-0.73144 -0.901,0.58133 1.737,0.7667 0,0 -0.023,1.03873 0.454,0.14004 0.663,1.50017 -7.647,3.77106 -4.692,1.85681 -3.756,-1.06895 -3.105,0.36975 -2.669,1.33493 -2.599,5.73367 0.099,0.96921 -2.908,3.10007 -0.273,0.46546 0.384,0.87048 -0.948,0.83521 -3.03,0.41106 -0.866,-1.47094 0.261,-0.7788 0.373,0.006 -0.117,-0.58032 -2.482,-0.87249 -3.128,0.60651 -2.228,1.07097 -1.913,1.26945 -1.459,1.6402 -1.448,4.49646 -2.123,3.3872 -1.075,5.04353 1.396,7.50586 1.762,3.11215 -1.448,10.08303 2.407,6.52153 -0.174,3.87786 1.651,4.44205 -3.018,-5.51604 -0.564,-0.25692 -0.116,1.91022 -0.617,-0.62263 0.355,-0.61659 -0.401,-0.0776 -1.169,1.85077 2.315,2.12481 1.569,0.0363 1.581,1.4105 0,0 0.001,1.1425 -0.756,-0.42516 -0.956,-1.89007 -1.638,-0.0433 -1.73,-1.26642 -1.577,0.17228 -0.083,0.42113 0.891,0.17833 0.069,0.37378 -0.631,-0.0705 -0.22,0.60953 -0.702,0.17631 0.029,0.71936 -0.644,0.29217 0.441,0.65084 -0.587,0.82111 -1.556,0.70021 -1.065,-0.0191 -0.429,0.47957 -0.538,-0.44632 -0.687,0.65789 1.332,1.04982 -0.848,0.61457 -0.451,-0.57931 -0.714,0.31131 0.153,-0.57024 -0.476,0.0957 -0.1,-1.1294 -1.848,0.78685 -0.66,-0.46848 -0.271,-0.94604 -2.238,-0.27001 -1.136,0.44229 1.056,0.46748 -0.297,1.49009 0.529,-0.38084 0.197,0.28109 -0.5,0.17732 0.045,0.45338 -1.591,0.5249 0.142,0.71633 -0.976,0.70626 -0.849,-0.95309 -1.027,0.1219 -10e-4,0.68107 -0.615,0.41509 -0.758,1.66338 -1.751,-0.1471 -1.873,-1.34097 -1.365,0.1884 -0.438,0.70222 0.653,0.35464 -0.895,-0.0232 -0.123,-1.42964 -2.722,0.87753 -0.912,-0.23072 -0.182,1.11329 -0.893,-0.29117 -0.784,0.83925 0.691,1.28657 -0.439,-0.004 -0.916,3.18974 -0.762,0.57729 0.044,1.25333 -0.487,0.12694 -0.176,-0.51281 0,0 0,0 0,0 -0.114,0.0373 -0.358,-0.0363 -0.102,0.86242 -0.647,0.0222 0.041,0.96316 -1.911,0.1199 -1.63,-0.88257 -0.545,-0.83622 -1.561,0.22668 0.782,-0.72741 -0.137,-0.80398 0,0 0.428,-2.03716 1.298,0.005 0.886,-1.73995 0.689,0.70726 1.203,-0.11788 -0.275,-1.46087 0.738,0.11486 -0.133,-1.46792 1.11,-0.4564 -0.056,-0.62163 0.545,-0.33751 -0.402,-0.47957 1.263,-0.7939 -0.589,-0.66092 0.581,-0.36572 0.184,-1.24426 -0.457,-0.80499 -0.729,0.94402 -1.027,-1.12638 -0.749,0.20553 -0.241,-0.44632 -0.695,0.33147 -0.508,-0.35263 0.636,-0.26497 -0.884,-0.48964 0.746,-4.80576 -3.414,-0.19546 -0.93,0.66394 0.224,-1.28859 -0.7,-0.15616 -0.1,-0.54505 -1.57,0.28814 -0.469,-0.68308 0.12,-0.45741 0.865,0.0816 0.084,-0.55715 -0.512,-0.50173 0.697,-0.93798 -0.098,-1.37926 -1.516,-0.98936 -0.07,0.73144 -1.102,-0.18941 -0.406,0.89566 -0.444,0.005 -0.044,-1.30168 0.745,-0.28311 -0.243,-1.23519 -1.148,1.15157 -0.515,-0.73346 -1.438,-0.0796 -0.25,0.56722 0.447,1.03671 -1.082,0.53297 0.051,0.49669 -1.374,0.48259 -0.086,1.24527 -0.276,-0.6186 -0.666,0.19747 0.136,-0.54506 -0.442,0.0363 -0.809,0.44028 0.55,0.43624 -0.324,0.16926 -0.537,-0.3496 -0.828,0.58536 -0.762,-0.5914 -0.154,1.25534 -0.522,-0.45539 -0.092,0.58435 -0.695,0.0846 0.161,-2.61647 -1.021,-0.0473 0.332,-0.77477 -1.362,-0.22769 -0.826,0.4302 -0.274,-0.68006 -1.182,0.38385 -0.348,-1.1969 -0.467,0.72338 -0.138,-0.42617 -0.547,0.46042 -0.037,-1.24325 -0.441,0.37983 0.137,0.92488 -0.809,0.16422 0.803,0.61861 0.091,1.4246 -1.493,-0.134 -0.737,0.47554 -0.706,-0.70323 -0.313,0.83521 -0.395,-0.21157 -0.506,-1.54953 1.023,-1.70469 0.502,-0.0876 -0.114,-0.60853 -2.193,-2.09761 0.919,-0.91883 -1.005,-1.33897 -0.907,-0.0826 0.162,-0.6045 0.954,-0.14911 0.098,-0.50576 1.637,0.35766 -0.241,1.613 0.322,0.96921 2.039,0.23979 0.549,1.09212 3.478,-0.71733 0.843,0.91682 -0.114,1.85278 0.881,-0.0242 0.03,0.38487 0.744,-0.63372 -0.413,-0.58032 0.48,-0.70524 -1.151,-0.008 0.162,-0.82514 -1.197,-0.33651 1.45,-1.73994 -0.12,-0.32643 -0.946,0.48662 0.067,-0.61155 0.606,-0.11284 0.272,-0.77175 2.317,0.30931 -0.087,-2.61144 -0.87,-0.009 -0.259,-0.81305 -1.187,-0.32744 -0.223,0.64278 0.852,1.8004 -0.668,0.43524 -0.594,-0.82615 0.081,-0.84932 -1.667,-0.14709 0.033,-1.19086 -1.03,0.43423 -1.67,-0.5773 -0.842,1.08709 -0.143,1.60595 -0.623,0.0846 -0.538,-0.65286 -2.34,-0.0121 -0.271,-0.69316 0.528,-0.47251 -1.486,-1.13344 0.084,-0.94805 0.627,-0.50375 0.596,0.30326 0.046,-0.98634 0.62,-0.71835 -2.16,0.21258 -0.893,-1.1828 -0.583,-0.10075 -0.828,-1.60897 0.793,-2.87338 -0.371,-0.96821 1.432,-0.53598 0.329,-3.46982 -0.765,0.2821 -1.342,-0.40905 0.435,-1.01455 -0.216,-1.18784 0.475,-0.42113 1.67,1.34803 2.2,0.39796 0.395,-0.4171 0.967,0.008 -0.123,0.51584 0.792,0.11787 1.574,-2.61647 -0.459,-0.48158 0.536,-0.13601 0.01,-0.97425 -0.78,-0.59543 0.906,-0.82212 -0.34,-0.57729 -0.68,-0.0907 -0.12,-0.81406 -1.007,0.11788 -0.715,-2.46333 -1.193,-1.21202 0.032,-0.3355 1.145,0.13803 0.056,-2.91166 1.092,-0.41409 0.728,0.6045 0.184,-0.73849 -1.711,-1.64222 0.433,-1.93137 -0.871,-0.18841 0.915,-1.47195 1.622,-0.9007 2.208,-0.37378 5.454,0.80499 0,0 2.029,0.19847 1.101,0.76772 1.197,-0.21964 1.739,0.46345 1.853,-0.66696 2.39,0.79995 0.72,-0.93395 0.573,1.25333 0.961,0.37882 0.34,-0.47453 0.813,-0.001 0.321,-1.12135 1.213,-0.62364 0.391,-2.22858 1.247,0.0474 1.873,-1.13041 3.212,0.53599 1.212,-0.92791 2.023,1.57573 1.285,0.0655 1.287,-1.39136 0.028,-1.51326 0.525,0.0796 0.204,0.93697 0.792,0.1078 -0.105,-1.67345 0.42,-0.44532 2.207,-0.94704 3.049,0.62464 0.881,-0.49065 0.138,-5.86766 0.854,-1.16467 3.359,-0.45941 1.478,-1.04982 3.158,-0.69013 2.655,-1.478 0.74,0.85537 1.08,-0.16926 0.842,1.32183 1.174,-0.0927 1.879,-2.25578 0.456,-1.49815 -0.766,-0.85134 -0.867,-0.23575 0.375,-0.96417 0.76,-1.27247 1.842,-0.43927 1.01,-1.30673 0.4,0.69719 1.275,0.0554 0.82,1.19893 0.374,1.86084 0.825,0.35162 0.3,0.96014 0.56,-0.84629 1.107,0.7536 0.08,0.55413 2.228,0.59442 0.864,-0.54506 -1.037,-0.81103 0.218,-0.96921 0.456,-0.1068 -0.054,-1.15257 -1.944,-0.47554 -0.073,0.67401 -2.712,-1.16567 0.638,-0.95108 -0.455,-0.93193 0.588,-0.46043 0.533,1.1556 0.538,0.17127 0.753,-0.72942 0.291,-1.2634 1.341,-0.66092 2.02,1.10321 -0.357,0.71532 1.803,-0.20754 2.234,0.85335 0.552,-0.55211 0.24,-2.09358 0.9,0.008 -0.167,-1.21303 1.798,0.47353 1.157,-0.74857 2.434,-0.41106 0.393,-1.96865 1.792,0.0494 1.204,-1.55053 0.986,0.73446 0.917,-0.0977 1.628,-1.91526 0.167,-1.99081 0.466,-0.66696 -0.435,-0.44229 1.428,-2.15605 0.114,-0.84126 4.307,-2.33034 0.218,-0.45337 -0.722,-0.8997 0,0 0.895,-0.94201 3.155,-1.23418 1.526,-1.44979 2.84,0.31535 0.357,0.72842 1.346,0.68006 0.535,-0.1471 -0.006,-1.36415 0.648,-0.30225 0.16,0.53297 0.508,-0.0584 0.075,-2.24874 0.507,0.38184 0.159,-0.32139 -1.236,-1.23519 0.559,-0.4433 0.085,-1.11328 0.732,-0.1743 0.443,-0.71431 -1.227,-0.23576 1.047,-1.14754 -0.485,-0.90171 2.36,-2.80588 0.526,0.77678 0.502,-0.0484 0.147,1.53845 0.494,-0.0736 -0.389,1.06291 1.368,0.46043 0.226,0.49065 -0.729,0.87552 0.09,0.81103 0.966,0.91279 0.668,-1.2775 2.266,-0.98332 0.549,-1.40949 -0.357,-0.54707 0.48,-0.43524 0.958,0.65387 0.831,-0.0655 0.151,1.01354 0.854,0.34255 1.769,-0.73144 0.759,0.20251 0.102,-1.18784 -0.436,0.22366 -0.462,-0.56319 1.548,-2.06738 -1.19,-0.22065 -0.117,-0.44229 0.567,-0.41005 -0.962,-0.0433 0.074,-1.11933 0.825,-0.33449 1.716,-2.61848 1.439,0.66897 0.07,0.58335 0.3,-1.10523 0.978,0.19445 0.281,-0.72238 1.606,-0.23172 0.055,-0.70626 0.783,0.0282 0.314,-0.63472 -1.354,-1.49613 0.703,0.0796 -0.722,-0.74857 -0.351,0.88962 -0.496,-1.613 0.859,-0.44733 1.309,0.30426 0.977,1.12034 -0.146,-1.19691 0.546,-0.0151 0.07,-0.46345 -0.389,-1.075 0.29,-0.17933 0.427,0.54707 0.246,-0.25893 0.173,0.8866 -0.421,-0.0443 0.039,0.34859 0.752,0.12594 0.315,-1.5183 0.677,0.53297 0.537,-0.85134 -0.212,-0.7133 0.607,-0.7385 1.544,3.04264 0.548,0.10277 -0.365,0.5914 0.838,1.48605 0.717,0.23072 -0.848,-1.56666 0.994,-0.66394 1.74,4.20932 1.457,0.4836 1.827,-0.12392 1.146,1.27348 0.862,-0.0786 0.594,-0.60853 3.787,-0.35967 0.079,-1.65532 0.552,0.34759 0.191,-0.35766 -0.421,-0.35464 0.758,0.1219 -0.468,-0.41105 0.681,0.22467 0.661,-0.61055 -0.289,-0.54001 0.524,-0.63977 -0.534,-1.04074 1.184,0.72439 0.372,-0.88055 1.605,-0.97828 0.451,1.15459 0.524,-0.9279 0.875,0.0564 -0.007,-0.63775 -0.72,0.10075 -0.586,-1.05082 1.452,0.0443 0.08,-0.77376 0.776,0.12392 -0.173,0.70122 0.527,0.52491 0,0 0.878,0.54405 -3.728,4.32417 -0.604,1.85279 -1.844,1.75808 -2.297,3.46075 -4.825,4.53576 -0.023,0.93294 -8.484,4.31511 -3.07,2.10768 -0.901,1.5183 -2.5,2.32631 0,0.73447 -1.373,1.87595 -2.744,2.95298 -12.682,6.47518 -5.007,3.89498 -1.482,1.88201 -0.541,2.01499 -0.477,0.23072 0.151,0.96115 1.163,1.01657 0.89,-0.24886 -0.238,2.48751 -0.903,0.51383 z", labelX: 193, labelY: 577, color: '#10B981' },
      { id: "ar", name: "Arunachal Pradesh", d: "m 585.539,192.70394 0.586,0.92992 -0.057,0.84731 1.267,1.78327 1.034,-0.0161 1.469,-1.19893 0.621,0.70122 -0.973,2.05429 -1.803,0.26094 -1.561,1.57472 -1.49,0.40803 0.751,0.58737 0.722,1.56062 -0.829,1.21403 0.445,0.75663 1.713,-0.88458 2.06,-2.14496 1.865,-0.12795 1.871,-1.00045 -1,2.04522 0.212,0.68812 0.654,-0.135 0.39,2.08249 1.644,2.52781 -0.628,1.36315 -2.37,0.79894 0.447,1.1959 -1.382,1.22008 -0.568,-0.17128 0.119,0.72339 -1.089,0.0826 -0.606,0.63472 0.991,1.12135 -2.287,1.75808 1.174,0.64984 1.07,-0.19445 0.596,1.18683 0.491,-0.15415 0.742,-1.62811 1.087,0.0222 1.452,-1.06794 1.779,-0.0645 1.81,1.05082 0.488,1.13746 1.63,0.13601 0.971,-0.41912 0.571,0.97526 1.478,0.68611 2.011,-1.27449 1.703,1.68353 2.264,0.54304 2.48,1.80443 -0.774,0.0957 -0.687,0.79693 0.172,1.03369 -0.653,1.00951 1.376,0.16322 0.074,0.74051 0.798,0.35665 -0.776,0.90171 0.229,2.13187 -1.421,0.16321 -0.261,-0.96014 -1.092,0.4846 -3.224,2.75551 -0.127,1.03067 -1.421,0.0191 -1.053,1.83062 -0.752,0.10478 -0.936,1.10422 0.839,2.14798 -0.541,1.59386 5.44,7.69325 -0.53,0.80096 -0.792,-0.43423 -0.775,0.28512 -1.819,-1.3571 -2.282,-0.63271 -0.257,-0.6055 0.558,-0.4161 -0.103,-0.73346 -0.489,-0.1078 -1.243,-1.9344 -1.88,-0.62061 -0.282,0.35867 -1.812,-0.0907 -1.888,1.78025 -1.08,-0.43625 -4.949,0.65185 -4.142,2.0956 -2.098,3.37108 -1.236,0.7657 -1.45,0.001 -1.615,3.12928 -1.202,-0.53397 -1.294,2.09257 -1.649,-0.23475 -2.175,3.08194 -2.644,1.03369 -1.359,-0.7113 0,0 -0.449,-1.15156 0.601,-1.2221 -0.623,-0.25892 -0.136,-1.23016 -0.505,-0.33247 1.033,-0.61155 -0.803,-3.58065 0,0 1.104,0.29923 2.101,-1.75506 2.285,-0.72842 0.041,-1.83365 1.182,-1.30269 1.547,0.92287 4.526,-1.46792 1.134,-0.0584 0.701,0.73547 0.261,-0.68006 2.344,-1.79536 -0.85,-1.59789 -0.204,0.269 -0.38,-0.49468 -0.692,0.0443 -0.498,0.87753 -0.092,-0.89868 -0.445,0.63673 -0.377,-0.31131 0.842,-1.79435 -0.173,-1.11329 -0.868,-0.31635 -0.328,-0.86141 -0.776,-0.4836 0.3,-0.60551 -0.482,-0.55311 0.377,-0.37278 -0.801,-1.01958 0.62,-0.25893 -0.153,-0.38386 0.893,-1.21 2.18,-1.85077 1.05,-1.92936 -3.173,-0.21057 -4.587,0.46547 -1.901,1.80443 -2.755,0.94402 -1.42,-0.69114 -5.971,2.28601 -3.568,0.83622 -0.449,0.85234 -0.922,0.12896 -0.825,0.74756 -1.393,-0.0151 -0.144,0.4161 -4.663,2.17518 -0.602,-1.07399 -1.329,0.62364 -1.455,-0.65185 -0.46,0.25893 -0.498,-1.12638 -0.86,0.7123 0.949,1.26441 0.054,0.82413 -2.132,1.05283 -2.016,2.70614 -2.185,1.62509 -3.313,3.71767 0.569,0.42012 0.2,1.04478 -1.31,0.29922 -2.023,2.14799 -3.903,0.7657 -2.96,-0.58133 -6.879,1.09213 -2.126,-1.1153 -0.023,-0.48058 -0.926,-0.54203 -4.469,-0.72641 -0.416,0.4705 0.133,0.73145 -1.26,0.60248 -2.63,-0.0333 -1.253,0.87149 -0.977,-0.21863 -1.605,0.7788 -3.528,0.2025 0,0 -0.095,-2.67994 -1.456,-1.34501 -0.218,-2.2981 0.97,-1.44576 -0.63,-1.01555 1.299,-0.0584 0.397,-0.43524 -1.294,-0.93596 -0.091,-1.72181 -0.748,-1.88201 -1.661,0.45237 -1.599,-0.50778 -2.993,0.27706 -0.627,-0.7657 -0.893,0.42617 -1.688,-2.1369 0.196,-0.78786 -0.385,-0.59442 1.382,-1.71879 0.332,-1.40345 -0.24,-0.84529 -0.614,-0.47453 -0.698,0.13098 -0.451,-0.9541 2.47,-0.0645 0.997,1.06694 2.4,0.0695 0.761,1.74095 1.218,0.51785 1.363,-1.30168 1.498,0.25792 3.244,-2.36863 1.123,0.0252 1.088,1.89006 1.336,-0.39796 0.566,-0.64177 1.006,0.44632 0.972,-0.90675 1.243,0.48561 0.928,-1.34098 1.343,-0.53598 1.471,-2.12078 -1.602,-1.74398 0.503,-1.49815 2.358,-1.81954 0.561,0.71935 1.441,-0.77577 1.45,-1.36213 0.75,0.73849 0.699,-0.76973 -0.212,-0.9551 4.089,-0.72742 0.263,-1.59688 -1.023,-0.93697 1.953,-1.54752 0.614,-1.46691 -0.113,-0.79593 0.582,-0.20955 0.193,-0.76167 2.276,-0.85738 0.598,0.53599 0.354,-0.7254 0.895,0.60047 1.805,0.0272 2.334,-0.75462 0.913,0.4967 1.441,-0.93093 1.719,0.85234 1.576,-2.48247 -0.338,-0.54505 0.202,-1.03067 3.354,-2.71823 1.247,-3.10309 1.528,-1.53845 1.448,-0.10679 0.322,-0.90373 1.233,-0.88055 2.652,-0.0504 1.472,-2.87943 1.735,1.06593 1.388,1.52031 0.432,1.83869 1.545,-0.47252 3.161,1.2896 -0.529,-1.01858 2.111,0.70222 0.489,0.66092 2.7,0.15415 0.33,1.25332 3.007,0.56521 0.925,-0.0685 0.6,-0.8201 0.279,-1.66137 1.057,0.28009 -0.191,-2.05127 1.007,-0.0957 0.271,-1.05485 0.823,0.28915 2.922,-2.56408 0.394,0.4826 1.766,-1.32688 1.597,0.21158 2.584,-1.94347 z", labelX: 550, labelY: 224, color: '#F59E0B' },
      { id: "as", name: "Assam", d: "m 453.917,283.49453 0.206,1.29161 -0.521,0.29318 0,0 0.315,-1.58479 z m 46.843,-31.55783 3.527,-0.20351 1.605,-0.7788 0.977,0.21863 1.253,-0.87149 2.63,0.0343 1.261,-0.60248 -0.133,-0.73145 0.415,-0.4705 4.47,0.72641 0.926,0.54203 0.023,0.48058 2.126,1.1153 6.879,-1.09213 2.96,0.58133 3.902,-0.7657 2.023,-2.14799 1.31,-0.29922 -0.199,-1.04478 -0.569,-0.42012 3.313,-3.71767 2.186,-1.62408 2.016,-2.70614 2.132,-1.05384 -0.054,-0.82413 -0.949,-1.26441 0.86,-0.7123 0.498,1.12638 0.46,-0.25893 1.455,0.65185 1.329,-0.62364 0.602,1.07399 4.663,-2.17518 0.145,-0.41711 1.393,0.0161 0.825,-0.74756 0.922,-0.12896 0.449,-0.85133 3.567,-0.83723 5.972,-2.28601 1.42,0.69114 2.755,-0.94402 1.9,-1.80443 4.588,-0.46547 3.173,0.21057 -1.05,1.92936 -2.181,1.85077 -0.893,1.21101 0.152,0.38285 -0.619,0.25893 0.801,1.01958 -0.377,0.37278 0.481,0.55311 -0.3,0.60652 0.776,0.48259 0.328,0.86141 0.867,0.31635 0.174,1.11329 -0.843,1.79334 0.377,0.31132 0.445,-0.63674 0.092,0.89869 0.498,-0.87753 0.692,-0.0443 0.38,0.49468 0.204,-0.269 0.85,1.59789 -2.344,1.79536 -0.261,0.68106 -0.701,-0.73547 -1.134,0.0584 -4.526,1.46893 -1.547,-0.92287 -1.182,1.30269 -0.041,1.83365 -2.285,0.72842 -2.102,1.75506 -1.104,-0.29923 0,0 -1.789,1.79032 -1.856,0.97727 -0.747,0.16826 -1.204,-0.79693 -0.878,0.46244 -1.759,2.97211 -2.42,1.72585 -1.22,0.32844 -0.506,-0.48461 -0.617,1.13344 -0.62,-0.46647 -1.614,0.96518 -0.114,0.807 -1.143,0.49569 -0.177,1.92432 -1.012,0.55513 -0.725,1.07097 -0.474,-0.41811 -0.086,-1.95454 -0.273,0.12392 -1.888,2.30515 -0.23,2.72327 -1.413,0.4171 -2.16,3.58165 -0.287,2.35049 -0.759,1.52434 0.514,2.04522 -1.33,0.74656 -0.694,0.97324 -0.846,-0.3899 -0.974,1.12537 -0.334,-0.74454 0.388,-1.478 -0.53,-1.31377 -0.443,0.69215 -1.344,0.62868 0.373,1.41755 -2.768,2.04622 -1.536,2.42706 -1.515,0.58334 -2.005,1.96865 1.343,1.9213 1.381,0.68409 0.342,1.27247 -0.551,0.82816 0.463,0.81003 0,0 -1.785,1.46994 -1.108,3.47788 -0.652,1.10824 -0.763,-0.0393 -0.405,0.71431 0.284,1.56062 -0.47,0.28915 0.278,0.46244 -0.506,0.96014 -0.668,0.48159 0.004,1.04477 -0.93,0.4967 -0.634,-0.69417 -0.27,0.23273 -0.054,1.56767 -0.656,0.72842 0.604,0.80801 -0.613,1.8266 0.661,0.29217 -0.961,0.2015 0.242,0.31635 -0.772,1.478 0.071,1.97772 -0.81,0.18235 0,0 -1.356,0.17833 -0.506,-0.39998 -0.133,0.42517 -0.886,-0.11586 -0.71,0.50072 -1.334,-3.29653 -1.561,3.82547 -1.391,0.50979 -0.266,1.82559 -1.275,0.17127 -0.4,1.57472 -0.956,0.3496 -0.104,0.47957 -0.927,-0.25389 -0.298,-2.31624 -2.632,0.0312 0,0 -1.754,0.0564 1.249,-2.99328 -0.867,-1.86689 -0.002,-1.0075 0,0 0.417,-3.52825 0.991,-1.83365 -1.209,-3.75796 1.212,-0.48259 1.948,1.62006 0.855,-0.0504 0.353,-0.58133 0.893,0.0746 0.271,-0.70122 -0.323,-1.1556 -0.432,0.27505 -0.348,-0.25389 0.453,-0.0846 -0.275,-0.44128 -0.672,0.0826 -0.054,-1.3712 0,0 0.782,-0.12292 0.44,-1.64222 1.228,0.19546 -0.383,-0.93597 2.03,0.51685 0.947,-1.37523 2.879,-0.9803 -0.832,-0.69517 0.576,-0.83119 -0.163,-1.09817 -0.499,-0.0635 -0.492,-1.06795 -0.396,0.14609 -0.929,-0.97828 -0.286,0.15717 -0.122,-0.58032 -0.945,0.43625 -0.229,-1.28053 -0.643,0.0977 1.617,-1.6261 0.184,-1.27348 -1.065,0.80902 -0.629,-0.0705 -0.312,-1.19893 -1.171,-0.25389 -0.759,-1.3853 -0.697,-0.19848 0.021,-0.94201 -1.007,-0.51483 -1.078,0.65991 -2.189,0.20956 -1.429,1.03168 -0.159,-3.28041 0.56,-1.33897 0.955,-0.85939 -1.294,-0.11083 -0.153,-0.76973 2.951,-3.13533 -1.176,0.38688 -1.316,-0.39594 -0.945,0.78484 -1.681,0.30527 -1.293,-0.19143 -1.443,0.96922 -1.088,-1.22915 0.118,-1.06392 -1.183,-0.49065 -1.843,1.39035 -0.231,2.45426 -1.065,1.13545 -1.218,-0.80499 0.562,-0.58133 -0.122,-1.34299 -1.179,-0.24986 -1.553,2.62252 0.622,-0.0685 -1.185,1.2231 0.691,0.0876 0.459,-0.51785 -0.09,0.3909 -1.696,0.74253 -0.534,-0.31938 -1.786,0.37076 -1.213,2.14093 -1.083,0.54707 -0.668,-0.14306 -0.253,-1.0891 0.347,-1.92735 -2.788,0.90071 -0.28,-0.19848 0.6,-0.55312 -0.616,0.0887 -1.012,0.61861 0.596,-1.53341 -1.293,0.0201 -0.518,-1.40849 -0.562,0.10277 0.067,0.69618 -0.756,-0.89667 -0.968,0.31635 -0.563,-0.32542 -0.666,1.02362 -0.785,-0.1612 0.144,-0.98231 -1.284,0.15213 -1.282,1.21101 -0.383,-0.31232 0.471,-0.58737 -0.975,-0.52189 -1.463,1.48203 0.458,-1.44173 -1.196,-1.33493 -1.019,0.61155 -0.673,-0.58636 -0.66,0.0897 -0.851,0.83925 -2.969,0.69819 -1.337,-0.39191 -2.385,1.92633 0.36,0.30628 -0.285,0.43625 -1.334,0.52087 0.223,1.16568 -0.455,0.69618 -0.855,0.22265 2.61,3.09101 -3.081,1.34803 0,0 0.316,-1.99082 -1.059,-2.03917 0.187,-1.1828 -0.608,-1.13444 1.588,-2.87439 -0.814,-0.14508 -0.209,-0.40804 0.71,-0.28411 -0.75,-0.80096 0.004,0.68711 -0.352,-0.0907 -0.396,-1.27147 -0.547,0.0574 0.534,-0.4836 -0.124,-0.66595 -0.805,-0.53498 0.242,-0.4302 -0.414,-0.6579 -0.673,-0.24381 0,0 0.322,-0.20956 -0.823,-0.32946 0.778,-0.54304 -0.728,-0.11586 0.659,-0.49065 -0.501,-0.74051 0.427,0.269 0.257,-0.2962 -0.411,-0.81003 0.854,0.38285 -0.17,-0.7526 0.635,-0.22064 0.024,-0.5239 1.576,-0.73044 -0.219,-0.42818 -0.409,0.14709 0.907,-1.48505 -0.376,-0.65386 0.195,-2.11273 0.325,-0.1491 -0.429,-0.91884 0.404,-0.61256 -0.406,-1.27448 0,0 0.113,-0.77981 1.997,0.32442 3.941,-0.74555 0.893,-0.36874 -0.098,-0.91985 0.645,-1.03369 1.814,0.12896 1.121,-1.12638 1.144,-0.13601 3.145,2.37164 3.189,0.78585 7.153,-0.27908 0.893,-0.94704 3.469,0.34758 1.549,0.59543 1.508,-1.31377 1.768,1.076 2.742,-0.74151 1.329,0.38083 2.4,-1.10422 1.169,-1.45784 0.826,-0.0494 1.849,1.36113 1.255,0.25187 0.909,-0.31635 0.403,-0.77477 z", labelX: 516, labelY: 271, color: '#8B5CF6' },
      { id: "br", name: "Bihar", d: "m 416.975,260.26064 0.017,0.0796 0,0 -0.017,-0.0796 z m -83.434,-22.94171 0.695,-0.0735 -0.041,0.73144 1.192,0.38487 0.057,0.63976 0.955,-0.22568 0.83,1.60091 6.826,1.08608 1.487,2.91268 -0.348,2.81293 -0.661,1.13545 2.388,1.05082 0.332,-0.35061 0.438,0.51785 0.757,-0.55916 1.293,1.17071 1.482,0.21964 0.336,0.47654 -0.225,0.56521 1.939,0.68913 -0.796,0.73547 3.627,-0.26296 -0.389,1.28557 0.694,1.2503 2.597,0.40602 1.534,-1.16869 0.964,0.21661 3.789,-2.11574 2.095,1.79334 -0.044,3.3187 1.783,1.21504 0.701,-0.16423 -0.025,0.96418 2.057,-1.05082 0.256,-0.88761 1.427,-0.36068 2.304,0.88559 -0.049,0.52692 1.174,-0.19243 0.525,0.6176 0.731,-0.67301 1.564,-0.0584 4.5,1.90417 0.598,0.96619 3.364,1.75405 0.716,-0.85335 1.425,0.46244 1.27,-0.53901 -0.049,-0.56419 0.799,-0.0826 0.06,-0.63774 1.729,-0.35867 0.619,-1.29363 0.564,0.0353 0.411,3.17563 1.489,1.08205 1.961,-0.16522 0.202,0.87249 0.975,0.0584 0.597,0.55211 0.584,-1.41049 2.046,-0.75664 2.918,1.39237 0.961,-0.2952 0.542,-0.9813 1.171,0.64681 0.685,-0.1078 0.488,-1.33091 1.234,0.76671 0.826,-1.17676 0.81,1.60394 1.357,0.60248 0.13,0.64379 0.674,0.002 0.097,-0.63473 1.261,-1.07097 0.183,-2.30011 0,0 0.822,0.57729 0.479,-0.6186 1.318,-0.34255 0.045,0.46043 -1.138,0.97929 0.309,0.43523 0.68,-0.0997 0.058,0.68208 0.814,0.59442 -0.784,0.65084 0.15,0.43524 0.627,-0.13601 0.509,0.63775 -1.625,1.69058 -1.461,0.67502 -1.563,1.80241 -0.678,-0.0463 -0.51,0.8604 -1.026,-0.25994 0.085,1.65028 -0.633,-0.0725 -0.142,0.3617 -0.381,-0.51483 -1.482,1.08608 -0.255,2.54393 -0.548,0.54405 0.399,0.94805 1.843,0.45942 -0.576,0.54002 0.568,0.32139 -0.252,1.04981 0.71,-0.0363 0.599,1.08709 1.834,0.79391 -0.272,1.25131 0.392,0.0927 -0.696,1.06794 0.308,1.16769 0.776,0.76268 -0.051,0.54405 -0.896,-0.13098 -0.42,-0.56319 -0.068,0.37983 -0.368,-0.19949 -0.013,-0.51583 -1.256,-0.26498 -0.566,0.74152 -0.414,-0.27202 -0.33,1.17575 -0.62,0.0191 -0.526,0.70625 -0.572,-0.2428 -0.466,0.91984 0.139,0.62868 0.484,0.13299 -0.102,0.92387 1.518,1.26844 -0.705,1.0075 0.29,0.81305 -1.027,-0.49267 0,0 -0.09,-0.59543 -1.581,-0.23676 -0.495,-1.24627 -1.616,-0.0292 -0.562,-0.85839 -0.684,0.40502 -0.161,1.14451 -1.219,-0.31434 0.297,0.75865 -0.482,0.50073 -0.011,1.07096 -1.682,-0.76166 -0.459,0.52087 -0.972,-0.41811 -0.678,3.10108 -0.849,-0.38386 -0.82,0.3768 -1.352,1.51125 0.237,3.20787 -0.149,0.62868 -0.765,0.0665 -0.752,0.76973 0.379,0.48058 -0.967,4.49545 -2.52,-0.83219 -0.67,1.29866 0.273,1.10422 -0.728,-0.65991 -0.456,0.38889 -0.368,-0.41005 -0.769,0.0846 0.115,-0.69014 -0.601,-0.58334 -0.55,0.0413 -0.403,0.97324 -1.323,0.35061 -1.37,-1.02563 -1.177,1.61602 -0.858,0.39897 -0.358,2.1369 -0.477,0.0715 -0.285,1.22612 -0.767,-0.24281 -1.357,-1.48606 -1.499,-0.42214 0.697,-1.07097 -0.176,-1.14754 0.394,-0.59543 -1.229,0.18941 -0.979,-0.82816 -0.469,0.61357 -1.291,-0.42416 -0.186,-2.34545 -0.793,-0.94906 -0.994,0.11485 0.241,-0.88357 -2.099,1.09615 -1.519,-1.57472 -2.104,0.0312 -0.848,-0.54808 -0.84,2.52277 -0.986,0.60853 0.317,2.42605 -1.845,-0.48662 -0.173,0.87249 -0.659,-10e-4 -0.388,0.93898 -0.666,-0.6045 -4.27,0.55413 -0.012,0.67905 -2.748,0.79189 0.392,0.76973 -1.674,1.15761 -0.502,-0.17429 0.224,-1.22411 -0.479,0.57024 -1.316,0.0665 -0.458,0.83521 -1.476,0.0887 -0.374,-2.08955 -0.958,0.23677 -0.037,-1.35912 -0.781,-0.41408 -2.437,1.68554 -0.433,1.44274 -1.796,-0.4292 -0.141,0.65387 -0.925,0.17732 0.083,0.8473 -0.669,1.20598 -0.817,-1.18784 -0.776,0.16724 0.106,-0.63976 -0.844,-0.70323 -0.97,-0.14105 -0.436,-0.63674 0.321,-0.17832 -0.779,-0.45237 0.021,-0.69014 0.674,-0.50677 -0.699,-1.45784 -0.497,0.0403 0.228,0.28411 -0.48,0.48763 -0.464,-0.51685 -0.366,0.41509 -0.611,-0.46546 -0.323,0.18941 0.134,0.84629 -0.695,-0.68912 -0.126,0.81808 -0.633,0.54002 -1.319,-3.01745 -1.142,-0.59442 -1.334,2.07846 -1.266,0.34658 -3.168,0.64379 -4.574,-0.50878 0,0 0.904,-2.28702 -0.918,-0.58838 0.339,-0.68107 -0.69,-0.56722 -0.019,-0.7395 -0.56,0.10478 -1.389,-1.17575 0.075,-1.12941 -0.762,-0.86745 -0.212,-3.23507 -0.538,-0.15818 0.82,-2.47542 -0.461,-1.32486 0.299,-0.40703 0.809,-0.18739 0.44,-0.9803 1.068,-0.0625 1.657,-1.52334 0.517,0.22064 1.219,-0.49568 0.583,-0.89265 0.812,-0.0776 -0.288,-0.16523 0.405,-0.41106 0.197,0.23072 0.596,-0.56723 0.616,0.52693 0.784,-0.53599 -0.104,-0.47957 0.921,-0.12292 -0.589,-0.67401 0.856,-0.18135 1.38,-1.97066 3.338,-1.83869 -0.144,-1.35105 0.519,-0.5773 1.126,-0.24683 0.965,0.64177 0.18,0.78585 1.731,0.18941 -0.042,-0.36371 0.732,0.1209 0.267,-1.69058 1.019,-0.0957 0.458,1.14552 0.982,-0.3496 0.829,0.85235 0.758,-0.15113 0.236,-0.9813 -0.094,0.78383 0.438,0.20452 0.069,-1.21907 1.569,0.1884 -0.629,-0.7526 0.412,-0.77879 -1.334,-1.01153 -0.618,0.0746 0.035,-1.01153 -2.205,-0.34255 -0.314,-0.90775 -1.191,-0.65286 -1.152,0.28814 -1.979,-1.2503 -0.745,0.21157 0.021,-0.7929 -1.595,-1.65934 -0.879,-0.0736 -0.647,-1.0619 -0.139,-2.23362 1.42,0.45538 0.704,-0.95208 0.97,0.37479 0.469,-1.66439 -0.217,-1.33291 -2.079,-0.24583 -1.278,-1.49916 -0.607,0.32441 -1.667,-0.36672 -0.002,-1.58983 1.263,0.22265 0.243,-0.54707 1.541,-0.27102 0.728,-1.31679 -0.016,-1.01455 3.986,1.02059 2.977,-0.65185 -0.255,-1.03369 -1.603,-0.30628 -0.578,-1.62006 -1.061,0.5632 -0.28,-0.2408 -0.196,-0.41307 0.579,-1.21303 -0.234,-1.2634 -0.667,-0.2015 -0.844,0.85738 -0.78,-0.4977 0.192,-0.75059 -0.842,-0.31131 -0.222,0.55714 -0.796,-0.34255 -0.091,-0.94402 -0.477,-0.2559 0.455,-0.45237 -0.122,-1.9485 -1.048,-0.56319 0.627,-0.63271 -1.702,0.0584 0.824,-2.53285 -0.509,-0.81708 -1.183,-0.57528 0.58,-1.05586 -0.188,-0.49972 -1.299,0.33348 -0.538,-0.27303 0.619,-0.66595 0,0 1.045,-0.78686 -0.694,-0.18034 -0.104,-0.86443 1.318,-0.49368 2.013,0.37278 1.427,-1.31982 0.048,-0.64682 0.423,0.0826 z", labelX: 356, labelY: 274, color: '#6366F1' },
      { id: "ch", name: "Chandigarh", d: "m 180.729,161.12496 -0.533,0.403 -1.425,-0.64883 -0.746,-1.56565 1.438,-0.95209 0.208,0.53801 0.562,-0.21359 -0.063,0.46949 0.734,0.0665 0,0 z", labelX: 175, labelY: 155, color: '#F43F5E' },
      { id: "ct", name: "Chhattisgarh", d: "m 316.874,316.83966 2.131,0.404 0.466,0.94806 1.238,0.32743 0.755,2.9832 0.698,0.31736 -0.313,0.49166 2.81,0.97022 0.711,1.51024 -0.307,1.65431 1.259,1.90115 3.357,0.8342 0.055,-1.35911 1.447,-0.22669 0.328,2.015 -1.113,2.03212 -0.077,1.69562 0.852,0.64882 0.772,-0.4846 0.562,1.00649 -0.765,4.37153 2.004,1.29765 0.388,2.67994 0.878,-1.36314 0.569,1.07702 1.137,-0.28311 0.15,0.62868 1.925,-0.31434 0.387,0.82715 -0.401,1.69058 -0.845,0.11284 -0.926,2.18728 -0.65,0.009 -0.603,0.6327 -0.1,1.50621 -1.481,0.78383 -1.455,-0.0484 -1.577,1.52132 -0.053,1.10624 0,0 -0.469,-0.0272 -0.084,0.45035 1.371,0.86444 -0.782,2.18727 -2.997,0.54204 -2.266,2.28802 -1.252,-0.0605 -0.989,0.47353 -1.813,2.73434 0.862,0.86746 -1.297,0.22971 -0.068,2.07746 0.381,0.70827 0.987,0.48259 -0.606,0.88055 0.272,0.63774 -1.116,0.26397 0.112,0.85839 -0.954,-0.46547 -0.498,0.71835 0.355,0.92992 -1.348,1.50218 1.357,1.11429 -0.666,0.45942 -0.241,-0.9944 -1.267,0.82413 -0.965,2.64266 0.327,1.16165 0.911,1.00346 0.186,1.14855 -0.583,0.19143 -2.193,-0.78988 -0.333,1.41049 0.428,0.60148 -1.177,0.57327 -0.591,2.80285 -1.471,0.77477 -1.659,-0.40099 -1.77,-1.27247 -1.607,0.59443 -1.398,-0.21359 -0.495,0.43322 -0.765,-0.46042 -2.435,0.23273 0.19,1.06895 -0.747,0.68913 0.271,0.77678 -1.452,2.1369 -1.408,0.85234 -0.558,1.7873 -0.911,-0.0594 -0.295,-0.807 -1.148,-0.48058 -0.24,2.81192 0.693,3.01343 -0.925,1.5727 1.182,0.98533 0.159,1.28255 0.46,-0.46446 0.4,1.06291 -0.741,2.01902 0.742,1.17474 -0.505,0.43423 0.178,1.36919 -0.726,1.28859 0.25,1.89712 4.343,1.65028 0.7,-0.32139 1.585,0.21862 -0.146,2.16209 0.356,0.50174 -0.31,0.88659 -1.193,0.12594 -1.27,1.21101 -0.289,-1.14451 0.466,-0.93899 -3.164,-0.85839 -1.121,0.47352 -1.033,1.1546 -2.278,-3.74789 -1.092,0.44632 -2.524,-1.60293 -0.701,0.88962 -1.739,-2.05832 -1.566,1.478 -0.612,1.91828 0.258,0.93697 2.318,1.18784 0.414,1.31478 1.668,0.2821 -0.466,1.76312 0.179,3.68039 -0.496,0.81808 1.458,-0.17832 0.571,1.91122 1.334,0.14004 -0.35,1.14754 -0.534,0.0897 0.886,0.93798 -0.658,1.20396 0.566,2.36761 -0.398,0.71835 0.837,0.19948 0.259,0.59745 -0.377,0.67301 0.649,1.01253 0.302,2.30818 -1.398,0.33549 -0.243,2.3112 -0.671,0.73749 -0.998,0.0403 -0.059,0.9682 -0.939,-0.14911 -1.383,0.62465 -0.424,1.36717 -1.299,-0.47654 0.063,0.64983 1.385,0.75865 -0.16,0.60954 -0.801,-0.11284 -0.247,0.79189 -0.814,0.33952 -2.006,2.24874 -0.36,1.45684 -1.818,0.134 0.013,0.62263 -1.367,0.21661 -1.37,0.93093 -0.485,1.66237 0.373,0.58435 -0.292,1.43165 -0.728,1.40848 0.072,1.2896 -0.839,2.07242 -0.908,-0.20251 -0.186,1.72987 0,0 -2.741,-0.1219 -1.977,-0.89164 -1.8,1.46087 -0.861,-0.0756 -1.852,-6.41876 0.622,-1.9213 -2.338,0.78182 -0.289,-1.43266 0.404,-0.21259 -0.794,-0.5924 -0.663,1.49714 -1.326,-0.1199 -0.027,-1.03973 1.148,-0.77779 -0.911,-1.06291 -0.593,-1.78226 0.215,-0.57629 -0.744,-0.2287 0.165,-0.36875 -1.007,-0.80096 -0.379,-1.02966 -3.124,-2.41598 -2.964,0.92186 -1.556,-2.91065 0,0 -0.531,-0.92489 0.72,-0.11284 1.506,-1.30873 -1.692,-2.32329 0.001,-1.29766 1.139,-1.94145 0.057,-1.47799 1.294,-1.05385 -0.07,-1.11328 1.124,-0.48662 0.808,-1.64424 1.931,-1.46288 0.885,2.0825 1.293,-0.4292 0.349,0.95511 1.27,-0.0725 2.005,-1.64625 -1.194,-1.46289 2.179,-0.86745 -0.272,-1.18683 -0.705,-0.22467 -0.372,-0.74454 -1.281,-0.12594 -0.951,-0.89164 -1.343,-0.0866 0.188,-1.78025 -2.641,-1.83465 0.058,-0.99541 -1.534,-0.11989 0.187,1.16467 -0.537,-0.4564 -1.209,-0.0373 0.06,-0.4836 0.714,0.13299 1.378,-1.3037 -0.31,-0.672 -1.57,-0.15616 -0.029,-0.59241 0.783,-0.45035 0.77,0.55513 0.835,-0.0685 0.527,-1.25635 0.013,-1.75203 -0.121,-0.98534 -0.887,-0.64882 -2.181,-0.11486 -0.164,-0.41912 0.586,-0.61256 -0.65,-1.15056 2.677,-0.62364 0.654,-0.83219 1.585,-0.59946 -0.665,-1.38531 0.76,-4.66169 -1.151,-0.19142 -1.16,0.61155 -0.635,-0.71633 0.545,-0.84126 1.518,-0.64984 -0.724,-1.83263 -0.077,-3.78013 -1.806,0.0403 -0.667,-1.73995 0.495,-0.60853 -0.294,-1.3581 0.502,-1.70267 3.726,-1.73894 0.788,-1.08205 -0.343,-0.73145 0,0 1.542,-3.18167 -0.439,-2.58625 0.194,-2.82099 0.512,-1.04175 1.428,0.23676 0.429,-1.29463 0.102,-2.956 -0.379,-0.47856 0.572,-0.0927 1.362,-3.57964 0.831,0.13904 0.27,1.2372 0.747,-0.0715 0.096,-0.80096 -0.688,-0.40199 0.941,-0.40904 0.076,-2.18526 1.366,-0.39696 0.61,-1.08003 -0.08,-3.32575 1.467,-1.11329 0.802,0.8735 1.195,-1.08507 0.596,0.40199 0.397,-0.96619 1.169,0.43121 0.373,1.45281 0.583,-0.86141 0.494,0.27001 -0.209,-0.60349 0.875,0.0151 0.821,-1.05988 2.025,0.0222 0.163,-0.57427 0.526,-0.10579 0.164,-1.43165 1.057,-0.40099 0.333,-0.60349 0.368,0.63976 0.465,-0.35363 -0.338,-1.42964 0.789,-0.91279 -0.49,-1.53945 0.178,-0.89164 1.821,-0.39595 0.076,-0.54908 1.68,-0.95914 -0.456,-1.91021 0.411,-0.83925 1.8,-0.0524 0.901,-0.83723 1.021,0.29721 0.736,-0.86644 -0.18,-1.95959 0.984,-1.29866 -0.075,-0.93294 -1.006,-0.83219 -0.564,0.13702 -0.259,-0.95511 -1.105,0.45237 -0.653,-0.22971 0.031,-0.81205 -0.835,0.23677 -1.251,-2.72025 -1.867,0.47453 -0.472,-0.78887 -1.436,-0.49468 -0.899,1.00851 -0.807,-0.1884 -0.551,0.94301 -0.443,-0.37781 -0.028,-0.99742 -0.599,-0.10176 -0.154,-0.77073 0.69,-0.26094 0.221,-1.39539 0.625,0.0151 0.925,-1.3984 -0.277,-0.74656 -0.72,-0.39292 -0.191,-1.36818 -0.672,-0.52491 0.253,-1.22209 1.069,-0.42718 1.285,1.52837 -0.082,0.42517 1.331,0.65487 1.471,-0.28512 1.33,-1.11631 0.717,0.46144 1.047,-0.23576 0.935,0.97627 2.449,0.0141 0.869,-0.75764 -0.097,0.48259 0.563,0.57428 0.61,-0.34356 1.527,0.41811 2.758,-0.17732 1.177,0.62264 0.592,-0.2277 -0.359,-0.6861 1.227,0.0282 1.383,-0.77175 0.094,-1.17776 1.917,-0.33046 1.249,-0.93596 0,0 2.743,1.99988 3.095,-0.0524 2.154,-0.98533 0.555,-1.56666 1.256,-0.77779 0.272,-1.14049 z", labelX: 296, labelY: 388, color: '#06B6D4' },
      { id: "dn", name: "Dadra and Nagar Haveli", d: "m 105.295,406.93205 -0.637,1.54248 -0.97,-0.70122 -1.651,-0.33046 -0.164,0.70122 -0.892,-0.9541 0.152,-0.54808 -0.591,0.48561 -0.336,-0.39191 0.282,-0.90474 -0.34,-0.91682 0,0 -0.959,-1.48303 0.447,-0.32946 0.798,0.48562 0.133,-0.4564 0.629,0.0262 -0.014,-0.5914 0.51,0.58737 0.132,-0.7123 0.846,-0.0856 0.345,-0.75764 0.115,1.24628 1.016,-0.27304 0.365,0.68611 -0.432,-0.0897 -1,1.30471 -0.703,0.0514 0.117,1.63618 0.231,-0.38688 0.658,0.38486 0.527,-0.36068 -0.091,-0.76268 1.343,0.2146 0.385,0.38486 -0.677,0.89768 z", labelX: 100, labelY: 415, color: '#EC4899' },
      { id: "dd", name: "Daman and Diu", d: "m 52.071,392.57824 0.11,-1.80846 1.311,-3.27739 0.615,0.65387 1.569,-0.2156 0.858,0.56822 0.278,1.33494 -1.744,0.77476 1.659,0.59241 -0.049,0.67603 -0.554,-0.008 -0.002,0.68208 -0.47,0.0121 0.915,1.21907 0,0 -0.379,-0.20049 0.07,0.31635 -1.076,0.30426 -3.111,-1.62408 z", labelX: 75, labelY: 385, color: '#14B8A6' },
      { id: "dl", name: "Delhi", d: "m 188.413,205.10421 0.637,0.75563 -0.427,0.95813 0.581,0.18336 1.261,1.79838 0.807,-0.0816 -0.257,1.70468 0.523,0.85436 -0.887,1.00649 0.919,1.37926 0,0 -1.99,0.58233 -0.354,0.49166 0.312,0.83824 -1.567,0.48662 -0.994,-0.81003 -0.222,-1.22814 -0.737,-0.63069 -0.496,0.1209 -0.894,-0.65789 -0.011,0.67703 -0.776,-0.31333 -1.865,0.44129 -0.874,-1.14452 -0.055,-0.82212 0.415,-0.0222 0.484,-1.08206 1.171,-0.001 -0.343,-0.46849 0.776,-1.15056 -0.257,-2.76054 1.868,-0.38487 0.927,-1.14451 1.104,0.45841 0.223,0.56823 z", labelX: 195, labelY: 215, color: '#84CC16' },
      { id: "ga", name: "Goa", d: "m 115.005,503.84721 3.2,-0.29117 0.68,-1.30068 0.355,1.0478 1.317,0.17128 0.5,2.11675 0.616,0.72237 0.611,0.14307 2.054,-0.9944 0,0 0.993,-0.0383 0.35,-0.62968 0.483,0.69517 0.384,-0.38083 0.496,0.26799 0.278,0.97123 -0.298,0.95107 0.69,0.86645 -0.647,0.79391 0.548,1.00951 0.003,1.18482 0.957,0.46445 0.278,1.61603 -1.761,0.7667 1.029,0.74857 0.318,0.85033 -0.676,0.88761 -0.235,1.02664 0.502,1.21604 -0.851,1.06594 0.176,0.52289 -1.22,0.98231 -0.831,-0.64279 0.068,0.9128 -0.754,-0.24986 -0.879,0.538 0,0 -1.14,-0.49468 0.221,-0.86141 -1.814,-2.3384 -1.151,-0.39192 0.768,-1.34501 -1.122,-4.03704 -0.448,-0.8332 -0.681,0.21158 -1.221,-1.08608 1.971,0.2962 0.418,-0.39393 -1,-0.80902 -1.285,-0.20553 0.372,-0.7254 -0.854,0.006 -0.599,-2.60438 -1.169,-2.39986 z", labelX: 122, labelY: 512, color: '#38BDF8' },
      { id: "gj", name: "Gujarat", d: "m 30.172,354.32358 0.616,0.71129 -0.43,0.49065 -1.012,-0.69215 0.826,-0.50979 z m -10.275,-0.41106 0.209,0.32744 -1.297,0.95813 0.18,-0.91985 0.908,-0.36572 z m 18.259,-2.62352 0.378,0.57427 -1.448,0.4161 0.151,-0.64379 0.919,-0.34658 z m -30.371,-16.4091 1.128,0.39292 0.058,0.57125 -0.89,0.24079 0.035,0.36069 -0.75,-0.59644 0.622,-0.2287 -0.203,-0.74051 z m 0.645,-1.3843 0.605,0.46344 -0.012,0.60349 -0.832,-0.5652 -0.204,-0.4564 0.443,-0.0453 z m -2.432,-2.42404 0.461,0.55916 -0.233,1.21302 -0.535,-0.34355 0.076,-0.81305 -0.843,0.76267 -0.186,-0.27303 1.26,-1.10522 z m 0.194,-2.66282 -0.018,0.81406 -1.064,1.22612 0.105,-1.13141 0.977,-0.90877 z m -0.542,-0.64177 0.215,0.54606 -0.546,0.33046 -0.122,-0.68006 0.453,-0.19646 z m -2.046,-4.12873 0.826,0.46446 0.593,-0.22971 -0.75,3.21895 -1.582,1.62812 -0.849,-0.19646 0.384,-0.19042 -0.407,-0.39494 -0.651,0.2549 0.169,0.35665 -0.60400002,0.0192 0.099,-0.38789 L 0.244,328.4158 0,327.77906 l 0.384,-0.53297 1.36,-0.0453 1.256,-1.69864 0.604,-1.86387 z m -0.816,0.14307 0.101,1.47901 -0.926,0.66595 -0.006,-1.94951 0.831,-0.19545 z m 3.706,-0.73547 0.425,1.75002 -1.663,0.3496 0.401,-0.79491 -0.181,-0.74454 1.018,-0.56017 z m -2.33,-0.72641 0.573,0.0151 0.292,1.1818 -1.24,-0.0836 -0.146,-0.52491 0.521,-0.58838 z m 1.187,-1.66438 0.003,1.48605 -1.355,-0.14105 -0.57,0.70122 0.06,-1.13645 1.862,-0.90977 z m 1.897,-0.0554 0.468,0.47655 0.559,0.13803 -1.35,1.24526 -0.547,-0.22366 0.057,-0.49871 0.92,-0.68006 -0.107,-0.45741 z m -1.056,-1.2634 0.762,1.56767 -1.57,1.74095 0.531,-1.89913 -0.271,-0.37781 -0.58,0.22467 0.413,-0.98735 0.715,-0.269 z m -1.088,-0.0635 -0.419,1.38934 -1.367,0.77174 -0.15,1.87898 -0.349,0.28009 -0.36,-0.40099 -0.797,0.72641 0.023,2.31623 -0.593,0.24886 -0.959,-1.14654 0.873,-1.00447 -0.448,-1.36919 0.454,-0.0312 0.889,-1.80946 1.204,-0.0635 0.529,-1.37624 0.756,0.28009 0.714,-0.69014 z m 56.039,-15.77438 3.99,1.68554 1.115,-1.05182 0.671,0.72741 2.203,-1.20396 2.686,0.0736 0.941,0.86342 2.877,-0.8604 0.268,1.12336 0.976,0.40703 0.379,-1.63819 0.913,0.18034 0.504,0.93697 2.267,-1.82457 0.686,0.2025 -0.007,1.02261 1.685,0.88257 0.947,0.0443 0.405,-0.46849 1.781,0.55413 0.811,-0.21359 -0.582,0.72136 -0.979,-0.30325 -0.592,0.4574 0.924,0.96216 1.315,-0.32441 0,0 0.594,1.19791 1.176,-0.0866 0,0 -0.122,1.0085 0.586,1.23015 0.901,-0.0635 -0.15,-0.93093 0.922,-1.3037 0.919,0.7919 2.276,0.35262 -0.079,0.87451 0.818,1.33594 2.838,-0.10478 1.168,0.90876 1.414,-0.86645 -0.588998,-0.45438 0.774998,-2.00189 0.261,-0.27203 0.801,0.39595 0.907,-0.68006 0.292,1.57673 -0.489,0.73447 1.78,1.0085 0.858,-0.56924 0.429,0.24684 -0.427,0.70122 -0.379,-0.21561 -0.258,0.96821 -0.747,-0.1471 -1.304,2.82704 0.659,1.06593 2.295,0.92791 -0.521,1.07399 0.982,0.93596 0.946,-0.38284 0.868,-1.06392 0.056,-0.95108 0.802,-0.30023 -0.081,0.92286 0.924,0.84832 -0.182,1.39034 0.411,1.36415 -1.31,1.58681 0.012,1.7067 0.277,0.47655 0.933,-0.29016 1.231,1.61199 0.612,0.12896 0.104,1.98175 1.335,-0.88257 1.748,0.74253 -0.495,1.71274 0.446,1.00448 -0.537,1.1828 0.428,0.27303 1.067,-0.3496 0.459,0.98634 0.808,-1.04981 0.384,0.54807 1.027,-0.27706 1.301,2.50363 0.934,-0.0987 0.176,-0.73346 0.497,-0.0826 0.414,0.90271 0.876,0.1209 0.248,0.82816 1.197,0.007 0.672,0.60147 -0.141,2.06739 1.172,0.60752 0.513,-0.90776 0.806,0.0867 0.882,1.5858 -0.118,0.54002 0.842,0.73648 0,0 1.005,1.88301 -0.61,0.3496 0.427,0.72036 0.803,0.76771 1.069,-0.56117 0.574,1.48908 -1.587,2.90965 -0.396,1.98174 -2.487,-0.0282 -2.346,2.89253 -1.812,-0.75965 -0.672,0.96518 0.173,0.39897 0.886,-0.40099 -0.15,0.97324 0.528,-0.0504 0.412,1.06694 0.445,-0.81406 0.353,0.55715 0.536,-0.27203 0.087,-0.76569 0.289,0.92387 1.034,0.0917 0.841,0.87552 -0.758,-0.12594 -0.648,0.94201 -0.424,-0.20654 -0.329,1.03571 -1.189,-0.23475 -0.467,-0.89163 -0.837,0.25893 -0.269,1.68856 0.679,0.95309 -0.331,0.49267 0.984,0.20351 0.157,2.60841 0.511,-0.17631 0.545,0.42819 -1.738,1.60897 1.175,0.65689 -0.164,0.73245 0,0 -7.023,2.95398 0.721,0.73749 -0.288,0.62767 1.364,1.41251 -0.225,1.24526 -2.052,0.45136 0.772,0.60349 0.76,2.3112 4.375,-1.43669 2.44,-0.002 0.459,0.63875 0.624,-0.42416 0.67,0.32643 0.745,-0.66696 0.479,0.54203 -0.019,1.02362 -1.634,0.74051 -0.432,-0.37681 -0.135,0.46345 -1.961,-0.10175 -0.417,0.3496 -0.875,-0.76368 -0.39,1.40646 -1.671,0.61659 -0.332,-0.23173 -0.091,2.36057 -1.183,0.78988 -1.253,-0.11284 -0.201,2.14899 -1.694,0.1078 -0.104,0.64883 -1.159,-0.31232 -0.94,0.43826 -0.486,-0.97627 -0.521,0.18437 1.5,1.33796 1.939,-0.12795 -0.218,1.31579 0.684,1.01253 0.688,-0.27303 0.182,0.59644 1.885,0.28915 -0.239,0.96619 1.048,2.2447 0.093,2.19433 -0.6,0.42114 -0.739,-0.13702 -0.46,0.79088 -0.857,0.0111 0.475,0.59946 -0.148,1.15057 -1.886,1.08406 -0.988,-0.24683 -0.634,0.35867 -0.71,-0.37882 -0.617,-1.27852 -1.442,-0.84126 -0.836,0.45741 -0.331,-1.42863 -0.605,0.15112 -0.288,1.0216 -0.779,0.49871 0.788,1.06392 0.847,0.25792 0.021,0.90272 0.396,0.0685 -1.486,2.81696 -0.804,0.54102 0.672,0.85235 0.136,3.26026 -1.164,0.30325 -0.141,-0.46244 -0.309,0.33248 -0.873,-0.19445 -0.462,1.28758 -1.523,0.61457 0,0 -0.426,-0.39997 0.677,-0.89768 -0.385,-0.38587 -1.343,-0.2146 0.091,0.76267 -0.526,0.36069 -0.659,-0.38487 -0.231,0.38688 -0.117,-1.63617 0.704,-0.0514 1,-1.30471 0.433,0.0897 -0.366,-0.6861 -1.016,0.27303 -0.115,-1.24627 -0.345,0.75763 -0.846,0.0866 -0.132,0.71129 -0.509,-0.58636 0.014,0.5914 -0.629,-0.0262 -0.133,0.4564 -0.797,-0.48561 -0.448,0.32945 0.959,1.48303 0,0 -2.008,-0.30124 -0.835,0.89466 0.015,0.91884 -0.697,-0.0856 -0.004,0.52491 -1.344,-0.25792 0,0 0.378,-3.47587 1.378,-1.76513 1.325,-2.89454 0.268,-1.94044 -2.21,-6.93762 0.035,-1.09112 -0.454,0.21862 -1.023,-2.55199 0.988,-0.39897 -1.366,-0.1622 0.326,-1.55457 -1.123,-0.27404 -0.168,1.51628 -0.663,0.27505 -0.186,-3.30358 -0.64,-1.54248 0.786,-2.03313 1.494,-1.87092 -1.082,0.69416 0.604,-1.95252 0.646,-0.26296 -0.454,-0.24382 -1.204,1.13948 -0.593,-1.35307 0.646,-1.45281 1.523,-0.78282 1.809,0.14407 1,-0.51281 -1.158,0.10578 -0.913,-0.59543 -4.158,0.56924 -0.634,-0.8332 0.692,-0.77678 0.616,-1.99485 -1.087,-0.7526 -0.325,-2.20944 0.948,-4.42492 0.715,-1.13243 1.373,-0.37076 2.233,0.99339 1.145,-1.64826 1.448,0.50274 0.512,-0.23878 0.256,-0.98735 -0.384,0.7123 -0.616,0.0867 -0.483,-0.8997 -1.919,1.16366 -1.343,-0.17026 -1.122,-1.04377 -1.948,0.93798 -0.082,-0.69215 -1.076,1.72987 0.14,-0.9007 -0.459,-0.0373 -0.745,-1.42057 -0.879,-0.41005 0.403,-0.8876 -0.692,-0.61055 -0.384,0.31535 0.698,0.48259 -0.443,0.85335 0.85,0.33953 0.058,1.59184 -0.354,0.62969 -0.908,-1.62308 0.122,1.49714 0.611,0.83723 -0.32,0.41408 -0.426,-0.75562 -0.254,1.32284 -0.413,-0.11989 -0.948,4.48034 -0.773,-2.65879 0.936,-0.5521 0.238,0.24482 0.035,-1.03067 -1.355,1.20698 -0.041,0.85436 -0.273,1.57068 0.68,1.09918 0.261,3.59475 0.867,2.5258 -1.732,4.27682 -2.035,2.42102 -0.355,1.08809 -0.686,-0.4443 0.442,0.60047 -0.32,0.68106 0.664,1.10624 -2,0.94906 -0.221,0.48763 0.064,-1.19893 -0.71,1.46088 -3.285,1.09817 -0.482,0.33751 0.209,0.43121 -1.919,0.39292 -3.129,1.58479 -1.063,0.0373 0.023,0.58032 -1.582,1.17776 -1.308,-0.0947 0.14,0.38083 -3.675,1.23419 -1.117,0.52994 -0.128,0.46647 -1.221,0 -0.285,0.46748 -2.442,-0.0937 -1.517,0.70021 0,0 -0.714,-0.98634 0,0 0,0 0,0 -0.2,-0.23273 0.47,-0.0121 0.002,-0.68207 0.554,0.008 0.049,-0.67603 -1.659,-0.59241 1.744,-0.77477 -0.278,-1.33493 -0.858,-0.56823 -1.569,0.2156 -0.615,-0.65386 -1.311,3.27739 -0.11,1.80845 0,0 -1.239,-0.14407 -3.675,-1.85782 -7.105,-5.65609 -8.095,-9.55309 1.07,-1.11429 -0.552,-1.62308 -0.273,0.40703 -1.023,-0.14407 0.872,0.82615 -0.459,0.20654 0.599,0.48863 -0.396,0.72741 -9.902,-9.1118 -5.751,-6.67567 -0.448,-1.68756 1.018,-2.31825 1.732,-1.49311 0.373,0.18941 -0.866,0.8876 0.523,0.8322 2.623,-0.6307 0.215,0.49771 -0.971,2.016 1.564,1.24627 1.826,-0.75562 0.291,-0.87451 1.791,0.32038 1.378,-0.45941 0.809,-1.16568 -0.535,-1.09515 1.094,0.6982 0.238,1.11429 1.942,-0.0756 0.198,-0.78686 0.732,-0.0443 -0.023,-1.07097 -0.546,-0.17631 1.18,-0.5239 0.343,0.97728 0.314,-0.24583 0.796,0.94503 0.808,-1.22814 0.71,0.17027 1.275,-1.40748 0.55,0.29822 -0.098,-0.77678 1.807,-0.75562 0.547,0.36572 2.047,-0.10679 1.675,-2.52378 0.209,-1.61099 1.052,-0.54909 1.059,-2.57214 1.454,-1.40445 1.472,-3.25321 -1.175,0.29117 -0.75,0.72238 -0.308,1.87797 -0.82,0.40501 -2.303,-1.12033 -0.366,0.51987 -1.221,0.3224 -0.808,-0.41106 0.186,0.82211 -6.984,1.68252 -0.959,0.70122 -0.977,1.80644 -1.314,-0.57427 -0.884,0.15113 -0.971,-0.75865 -1.722,0.4302 -2.453,-1.25736 -3.303,-0.22164 -8.013,-5.21279 -1.157,-0.29722 -3.512,-3.04667 -0.146,-0.4312 1.826,-0.84429 -0.651,0.0766 -0.082,-1.83364 -0.646,-0.7798 -0.983,-0.12695 0.029,-0.74857 -0.517,-0.0443 -0.698,-1.02865 -0.285,-3.79927 0.244,-0.56017 0.419,0.0574 0.087,-0.82614 2.262,-1.54651 0.703,-1.15761 1.483,-0.80902 -0.424,-0.31837 -2.343,0.44531 -1.646,1.85279 -0.233,-1.54651 0.657,-0.24885 0.547,-1.03168 1.8959997,-0.85436 -0.8879997,0.0887 -0.52,-0.63674 -0.157,0.44633 -0.623,-0.0383 -0.45,-0.53599 0.197,-0.3627 4.238,0.0262 0.49,-7.63179 1.125,-0.32845 0.447,2.30113 0.833,0.28814 1.25,-1.85883 1.116,1.16769 1.934,-0.99339 2.236,0.77879 2.313,-0.9541 3.996,0.49871 2.083,-0.5249 2.594,2.36359 5.779,0.19948 1.228,-0.60752 1.25,-2.25176 9.542,-2.9842 0.774,0.45539 -0.832,1.2906 0.321,0.79089 -0.275,1.32989 1.696,0.62666 3.15,0.0554 1.85,-0.79089 -0.188,-0.77476 1.562,-1.27751 0.81,-0.32945 1.021,0.30527 1.771,-1.25433 -0.269,-0.67402 -2.325,-0.25187 0.156,-1.86287 -0.357,-0.42717 0.465,-2.05731 1.813,-1.15661 z", labelX: 67, labelY: 694, color: '#A855F7' },
      { id: "hr", name: "Haryana", d: "m 179.683,155.73686 0.844,-0.58636 0.117,0.84025 0.768,0.61961 1.04,-0.64882 1.081,2.10264 0.531,0.30326 0.394,-0.37882 -0.196,0.90977 0.513,0.85133 0.431,-0.3234 0.903,0.26094 1.569,1.32385 0.119,2.21851 -0.962,0.78685 0.409,0.62868 1.137,0.37983 0.361,1.11026 1.029,-0.0997 1.234,0.74957 0.74,-0.20149 1.142,1.04981 1.045,-1.13041 0.059,0.60449 -0.773,0.77779 1.474,-0.10176 0.481,-0.88156 0.692,1.25535 0.67,0.3103 0,0 0.359,0.33147 -0.454,1.44979 -0.912,0.70323 -1.12,2.27594 -1.041,0.48863 -0.535,1.20699 0.344,0.28209 -3.015,1.42461 -0.152,1.12033 -1.736,2.32329 -0.582,2.73132 -0.74,0.54204 0.55,1.56867 -1.208,2.5399 0.504,1.15358 -0.519,0.46748 1.141,2.20541 -0.284,0.75865 0.439,0.50274 -0.626,0.31535 0.065,0.64681 0.71,0.34356 -0.512,1.50822 0.305,0.70928 -0.394,0.4443 0.309,1.02866 -0.376,1.83263 1.929,2.39583 -0.503,1.20698 0.65,1.23519 -0.825,0.34255 0.107,0.5511 0,0 -0.998,0.60249 -0.223,-0.56823 -1.104,-0.45841 -0.927,1.14451 -1.868,0.38487 0.257,2.76054 -0.776,1.15056 0.343,0.46849 -1.171,0.001 -0.484,1.08206 -0.415,0.0222 0.055,0.82212 0.874,1.14452 1.865,-0.44129 0.776,0.31333 0.011,-0.67703 0.894,0.65789 0.496,-0.1209 0.737,0.63069 0.222,1.22814 0.994,0.81003 1.567,-0.48662 -0.312,-0.83824 0.354,-0.49166 1.99,-0.58233 0,0 2.865,2.27896 0.412,1.3168 -0.638,0.4836 0.671,0.73849 -0.064,0.62868 -0.533,0.25993 1.547,0.5239 -0.536,0.42819 0.073,0.66595 -0.627,-0.2428 0.063,0.63976 1.051,0.0826 -0.962,0.51786 -0.085,1.47195 -0.295,-0.23676 -0.196,0.52188 0.214,0.99541 1.175,1.20698 -0.516,0.59744 0.56,0.24785 -0.38,0.61558 -1.056,-0.0252 -0.215,1.13041 -0.967,-0.25792 0.002,0.88056 -1.529,-0.0121 -1.33,1.25735 0,0 -0.278,-0.22568 -0.644,0.71835 -0.794,-0.85738 -0.526,0.87854 0.251,-0.56319 -0.629,-0.16423 0.017,0.56319 -0.522,0.36472 -1.847,-1.03369 -0.369,0.9944 0.977,0.34053 0.249,0.60047 -1.794,-0.0776 -0.482,2.00391 -0.76,-0.42516 -0.661,0.39191 -0.454,-0.96719 0.704,-0.0343 -0.638,-0.71331 0.412,-2.41295 0.479,-0.0373 0.255,-2.01298 -0.413,-0.13802 -0.01,-1.72887 0.903,-3.47989 -2.329,-1.96764 -1.029,0.35866 -0.206,1.29363 -2.936,1.43871 0.185,1.84775 -1.279,0.21862 -1.272,0.93395 0.006,-1.62912 -1.774,-0.25087 0.919,-0.35867 -1.027,-0.67603 0.258,-0.44531 0.772,0.12594 -0.562,-1.14553 -1.972,0.39696 -0.855,-0.93496 -1.19,-0.0332 1.602,1.19691 -1.218,0.65185 1.197,0.63875 -0.279,0.90675 -0.923,0.23978 -0.318,-0.78383 -0.646,-0.28512 -1.545,0.27706 0.765,0.65588 -1.233,0.77678 0.513,0.62163 -0.273,1.37221 0.674,0.38083 -0.116,0.8332 0.632,0.54506 -1.054,0.7939 -1.776,-1.44676 -0.804,0.48864 -1.813,-0.39998 0.3,-1.05787 -1.016,-0.17833 -0.11,-0.38688 0.312,-0.42818 0.516,0.3365 0.497,-1.13343 -0.638,-0.3889 0.714,-0.21762 -0.43,-0.49367 0.839,-0.13702 -0.099,-0.42315 0.634,-0.46244 -0.418,-0.35363 -0.651,0.90574 -0.052,-0.70021 -0.962,-0.31636 1.918,-1.88502 0.808,0.11787 -0.027,0.55413 0.583,-0.2549 -1.001,-1.13545 0.166,-0.50778 -0.876,-0.4171 0.158,-0.93395 -1.341,-0.89466 -0.676,-1.20093 -0.694,-0.5904 -2.489,-0.33348 0.166,-1.19288 -3.122,-2.10969 -0.231,-1.343 -1.305,-0.2962 -0.561,-3.24515 -0.636,-0.89466 0.31,-1.17172 -0.969,-2.14798 1.035,-1.17877 -0.113,-0.84932 -1.599,-0.13803 -0.093,-1.1566 -1.039,-0.134 0.326,-1.39538 -0.734,-0.34054 0.827,-1.11228 -0.104,-1.75606 -0.789,0.17631 -0.266,0.68409 -0.635,-0.23575 0.09,-1.38229 -2.005,1.40647 -0.911,-0.81003 -1.502,1.0075 -0.631,-0.13702 -0.799,-1.3158 -1.023,0.37076 -0.794,-0.24482 -0.543,-1.99081 -1.801,-0.94906 -1.769,1.15761 -2.228,-0.39393 -0.175,0.99037 -0.964,0.0695 0.02,-0.81506 -0.815,-1.36012 -0.555,-0.15314 -0.046,-0.5914 0.287,-0.41005 0.756,0.19142 0.743,-1.65129 -1.002,-0.87753 0.814,-4.57302 -0.393,-0.37782 -1.273,0.65689 -1.127,-0.0645 -0.141,-1.05283 1.848,-1.88906 -0.416,-0.89466 -0.599,-0.12392 0.293,-0.86242 0,0 2.678,0.93698 -0.149,-0.43121 1.066,-1.13344 0.695,0.17934 1.616,-0.74454 1.014,0.81103 0.667,-0.22366 0.079,0.70928 0.638,-0.24382 1.553,2.2437 1.582,-0.54707 0.404,-0.87249 0.407,1.01454 -0.481,0.57629 0.541,0.55312 -0.354,0.47957 1.337,0.62062 0.028,-0.93798 0.564,-0.4564 1.018,2.09459 -0.78,0.64882 0.033,0.90474 -0.784,0.60449 0.324,0.78887 1.003,0.56723 0.047,1.45684 1.52,-0.52894 0.176,-0.49166 -0.501,-0.52188 0.778,-1.46289 0.685,0.27606 -0.316,-0.83522 0.909,-0.42214 1.371,-2.33336 1.412,1.1556 0.935,-0.14005 0.259,0.56118 0.931,-0.0917 0.254,-0.64782 1.509,0.43524 0.177,-1.29161 1.375,-0.40502 0.512,0.44128 0.69,-0.12593 1.052,1.57774 1.792,0.37982 1.104,-0.59643 0.378,0.22668 0.879,-1.42863 0.811,0.22669 2.629,-1.75708 -1.201,-0.47352 -0.384,-0.96921 0.787,-0.37479 -0.271,-1.75103 0.513,-0.25993 -0.357,-0.26195 1.185,-1.61603 -1.348,-0.73749 0.447,-0.002 -0.169,-0.57931 0.99,0.9682 1.502,0.26195 0.545,-0.47151 -0.483,-0.52389 1.342,0.52692 0.244,-0.73245 -0.432,-0.61961 0.611,-0.46245 0.877,2.46535 0.811,0.0866 0.215,0.49771 1.126,-0.537 0.458,0.57327 0.508,-0.12393 0.537,-0.61658 0.256,-2.43412 -0.725,-0.22366 0.162,-0.38386 -0.587,-0.62061 -1.077,0.7133 0.316,-0.91783 1.302,-0.13802 1.356,-1.34501 0.849,-0.16926 0.489,-0.64984 -0.569,-0.13399 -0.234,-0.69215 1.208,-1.1012 1.059,0.65689 0.502,-0.53599 1.001,1.15963 0,0.64581 0.985,-0.70424 -0.806,-1.2765 0.002,-1.05888 0.658,-0.81507 -0.739,-0.54505 0.595,-1.44576 -1.148,-0.99742 0.076,-0.94302 -0.574,0.57326 -0.314,-0.73345 0,0 0.175,-1.90316 0,0 0.39,-0.70122 -0.399,-0.97828 -1.229,-1.075 z", labelX: 164, labelY: 195, color: '#F97316' },
      { id: "hp", name: "Himachal Pradesh", d: "m 160.899,114.5252 1.069,-1.68252 -0.566,-1.18079 0.333,-1.64826 -0.81,-1.41251 -1.656,-1.4115 0.278,-1.49009 1.238,-0.0101 1.647,1.12638 2.856,-2.09156 0.24,-0.90171 3.007,-0.69517 0.789,-1.78831 2.442,-2.073428 1.62,0.170267 1.642,-0.743533 0.72,0.0665 0.944,1.113284 2.154,-0.424156 0.533,-1.758082 0.48,-0.156162 0.513,0.477553 0.535,-0.243814 -0.521,2.275941 0.858,1.08709 0.686,-0.0484 0.844,2.01802 1.694,1.10421 0.772,-0.25288 0.829,0.6579 1.287,-0.17732 0.205,1.66237 0.579,-0.42819 1.139,0.88861 0.222,0.76066 0.407,-0.28008 0.981,0.55815 0.475,0.85335 0.599,-0.135 0.649,-1.50621 1.418,0.59543 0.614,-0.61961 0.733,-0.0212 1.347,-1.41049 1.453,-0.39091 0.249,-0.66596 0.989,0.35565 1.627,1.66035 -0.602,1.01455 1.804,0.90977 0.697,1.32385 0.716,0.23374 -0.248,1.81954 1.66,2.65676 1.114,-0.135 -0.039,-1.0881 0.658,0.28311 0.587,-0.94403 0.588,0.49267 0.65,-0.91379 1.265,0.24482 1.733,-1.0881 -0.169,-0.62364 1.752,-0.59946 -0.172,2.24168 0.537,1.21504 -1.929,1.13948 0.053,1.20195 -0.433,0.53095 0.668,0.79693 1.508,-1.33796 0.593,0.44632 0,0 0.717,0.34457 -0.145,1.03268 1.689,0.94201 -1.145,1.64726 0.043,1.6936 -0.564,0.93294 2.098,-0.0877 1.12,0.77678 -0.39,1.48908 0.483,0.90675 1.057,0.36975 1.749,2.46333 0.829,0.19445 -1.668,5.10398 0.698,0.72741 -0.279,0.55815 0.482,1.21605 0.948,0.0534 1.077,1.83868 -2.605,2.38575 0.208,0.82414 0.676,-0.14105 0.975,0.93193 -0.398,1.26743 1.063,0.49065 0.037,1.25534 1.631,1.74398 0,0 0.183,0.83522 1.235,1.15459 0.459,1.53945 -2.621,0.19647 -1.102,-0.97728 -0.496,-1.41956 -3.085,0.2549 -0.277,-0.66797 -0.818,-0.35565 -1.22,0.72842 -1.402,0.0725 -0.544,-0.99339 -0.516,-0.38386 -0.459,0.29621 -0.863,-1.05789 -1.213,0.0655 -0.104,0.54405 -0.51,-0.12997 -0.763,0.89164 -1.775,0.0846 -1.257,1.00044 -1.21,0.13501 -0.329,0.74454 -1.245,-0.58435 -1.408,0.59039 -0.935,1.79939 -0.884,0.4705 0.517,1.32184 -0.605,0.93798 0.434,0.39695 -1.115,-0.57326 -0.613,0.42717 0.231,0.91179 1.047,-0.0373 -0.131,1.59588 -0.939,-0.55312 -0.002,1.25534 -1.175,1.49412 1.105,1.41654 -0.161,0.60551 0.956,0.53901 0.062,1.08306 -1.099,0.51181 0.677,0.86241 0.867,-0.0191 0.154,0.74555 -0.239,0.53095 -2.515,1.45281 -2.051,0.52188 -0.378,0.62767 0,0 0.248,0.48662 0,0 -0.67,-0.3103 -0.692,-1.25535 -0.481,0.88156 -1.474,0.10176 0.773,-0.77779 -0.059,-0.60449 -1.045,1.13041 -1.142,-1.04981 -0.74,0.20149 -1.234,-0.74957 -1.029,0.0997 -0.361,-1.11026 -1.137,-0.37983 -0.409,-0.62868 0.962,-0.78685 -0.119,-2.21851 -1.569,-1.32385 -0.903,-0.26094 -0.431,0.3234 -0.513,-0.85133 0.196,-0.90977 -0.394,0.37882 -0.531,-0.30326 -1.081,-2.10264 -1.04,0.64882 -0.768,-0.61961 -0.117,-0.84025 -0.844,0.58636 0,0 -1.199,-1.39538 -2.146,-0.99843 -0.232,-1.20799 0.56,-1.38934 -0.763,-0.42818 0.023,-1.35206 0.943,-0.73951 -0.198,-0.34658 -0.95,0.26397 0.44,-0.84831 -0.651,-0.71734 -0.744,0.60853 0.046,-0.70223 -0.399,0.53095 -0.08,-0.50979 -0.538,0.23777 -0.457,-0.90373 -0.746,0.672 0.359,-0.56923 -1.445,-2.09257 -0.337,-1.23419 -0.083,0.63271 -0.907,0.32542 0.436,1.21405 -0.852,0.26497 0.002,0.5652 -2.58,0.30627 -0.137,-0.85233 -0.654,-0.49972 0.387,-1.28456 -3.156,-5.72561 -1.694,-4.21033 1.039,0.0655 -1.611,-3.34389 -2.308,-1.1022 -1.977,-1.66237 -0.847,-0.38787 -1.064,0.27605 -0.414,-0.38789 1.739,-2.05731 -0.871,-0.50777 0.049,-1.22814 2.383,-0.97022 2.25,-2.62151 1.849,-0.93193 -1.7,-2.26586 z", labelX: 191, labelY: 133, color: '#EAB308' },
      { id: "jk", name: "Jammu & Kashmir", d: "m 139.801,1.2029514 1.195,1.4034432 2.388,-0.099742 1.692,-0.1007497 1.492,-1.2029513 1.592,-0.60147572 1.593,0.80196762 1.691,2.5066524 1.99,2.9076362 2.588,3.0073783 1.124,2.2457106 3.383,2.205411 3.284,1.603935 2.786,2.607402 3.284,1.102202 2.587,2.707144 1.593,1.403443 2.686,0.300234 2.289,2.506653 0.099,1.804427 -0.497,1.504193 0.697,1.905176 1.194,1.804427 2.686,0.801968 3.284,0 3.682,1.103209 2.189,2.004919 0.896,2.606395 0.995,1.804427 3.483,0.400984 4.002,-1.842712 3.461,-0.864433 2.786,0 2.02,-3.20787 2.289,-2.004919 2.687,-0.601476 2.189,-0.902717 1.99,-1.503185 3.483,-0.301242 2.886,0.902717 1.791,1.00246 1.194,-0.702226 0,-2.606394 1.094,-1.303701 1.792,-0.500726 2.487,2.004919 1.294,1.504193 1.592,0.400983 3.085,0.701218 2.388,0.702226 1.99,-0.902718 1.393,-0.500726 1.294,2.104662 1.194,2.005926 1.692,0.90171 2.089,1.504193 0.597,1.603935 -0.497,1.704685 0.298,1.804427 -0.099,1.302693 -0.895,1.704685 -0.1,1.202951 -0.995,1.403444 -0.199,1.504193 0.099,2.606394 -0.796,2.004919 -0.796,1.905177 -0.597,1.403443 -0.398,2.205411 -1.493,0.802975 -1.632,0.721368 -2.089,1.002459 0,2.004919 -0.796,1.303701 -1.891,-0.100749 -2.09,0.100749 -0.995,0.90171 0.199,1.103209 0.896,1.603935 0.51,2.101639 -0.871,3.758971 -2.052,2.255786 -1.244,0.500726 -1.99,-0.500726 -2.239,-0.751593 -1.369,0.626663 -1.99,0.375797 -1.181,0.375796 -0.498,1.190861 0.435,1.754053 0.747,1.566657 0.871,1.441728 1.368,2.254779 -0.373,1.379263 -1.058,0.939995 -1.492,0.625655 -0.249,1.379263 0.186,1.629123 -0.478,0.721368 3.089,2.860284 0.176,1.689572 2.313,0.93798 4.697,0.312324 0.118,0.779801 -1.268,2.93283 -0.051,1.29161 2.012,2.24571 0.474,2.15806 1.3,1.07298 0.648,2.22355 -0.396,1.57975 -2.038,0.52994 -2.843,2.46535 -1.127,-0.90373 -1.16,0.31233 -1.6,1.15761 -0.462,2.30213 -1.156,-0.28915 -1.508,1.00851 -1.308,-0.6045 -2.795,-2.69002 -0.366,-2.30314 0.348,-0.75965 -0.72,-2.43714 -1.916,1.16769 -0.601,1.05082 -1.691,-0.13097 -1.241,0.97425 -0.689,-0.15616 -0.847,0.58334 -0.031,1.10421 -0.593,-0.44632 -1.508,1.33796 -0.668,-0.79693 0.433,-0.53095 -0.053,-1.20195 1.929,-1.13948 -0.537,-1.21504 0.172,-2.24168 -1.752,0.59946 0.169,0.62364 -1.733,1.0881 -1.265,-0.24482 -0.65,0.9138 -0.588,-0.49267 -0.587,0.94403 -0.658,-0.28311 0.039,1.0881 -1.114,0.135 -1.66,-2.65677 0.248,-1.81954 -0.716,-0.23374 -0.697,-1.32385 -1.804,-0.90977 0.602,-1.01455 -1.627,-1.66035 -0.989,-0.35565 -0.249,0.66596 -1.453,0.39091 -1.347,1.41049 -0.733,0.0212 -0.614,0.61961 -1.418,-0.59543 -0.649,1.50621 -0.599,0.135 -0.475,-0.85335 -0.981,-0.55815 -0.407,0.28008 -0.222,-0.76066 -1.139,-0.88861 -0.579,0.42819 -0.205,-1.66237 -1.287,0.17732 -0.829,-0.6579 -0.772,0.25288 -1.694,-1.10421 -0.844,-2.01802 -0.686,0.0484 -0.858,-1.08709 0.521,-2.275936 -0.535,0.243814 -0.513,-0.477553 -0.48,0.156162 -0.533,1.758082 -2.154,0.424156 -0.944,-1.113284 -0.72,-0.0665 -1.642,0.743533 -1.62,-0.170267 -2.442,2.073433 -0.789,1.78831 -3.007,0.69517 -0.24,0.90171 -2.856,2.09156 -1.647,-1.12638 -1.238,0.0101 -0.278,1.49009 1.656,1.4115 0.81,1.41251 -0.333,1.64826 0.566,1.18079 -1.069,1.68252 -1.428,2.21952 -1.222,0.26598 -0.72,1.44676 -3.817,1.72181 -0.585,1.80947 -0.231,-0.84831 -0.471,-0.18236 0.094,-0.55916 -1.198,0.39191 -1.94,-0.32441 -2.655,-1.68856 -0.146,-0.47655 -1.027,0.24482 -1.19,-1.62711 -0.963,-0.29922 -1.199,1.10119 -3.014,-1.20497 -2.866,0.2811 -1.177,-3.14037 0.712,-1.16971 -0.546,-1.50721 0.982,-3.02854 -1.153,0.42013 -0.581,1.62711 -1.731,0.42415 -1.185,0.74051 -2.886,-0.30124 -1.393,-1.00246 -2.09,-1.00246 -1.592,-1.50419 -2.488,-0.90171 -2.089,-1.50419 -3.184,0 -0.697,-1.50319 -1.095,-1.00347 -1.393,-1.20295 0.597,-2.505646 -0.895,-1.805435 -0.299,-3.107121 1.095,-1.303701 -0.796,-3.20787 0.497,-1.203959 0.1,-1.503185 -1.493,-1.504193 0.1,-1.403443 0.995,-1.202952 -0.797,-3.108128 -1.492,-1.503185 0.099,-2.907637 -0.298,-2.34646 -0.995,-2.505645 0.398,-2.506652 0,-1.704685 1.293,-1.403443 2.19,-0.601476 1.691,-0.701218 0.1,-1.905177 1.293,-2.30616 1.393,-0.200492 3.384,-0.09974 1.194,-0.902717 0.796,-3.007379 0.896,-1.905177 0,-2.004919 -1.792,-1.804427 -2.487,-1.103209 -1.991,-0.601475 -1.194,-0.902718 -0.696,-1.503185 0.398,-1.603935 1.393,-0.902718 0.597,-1.202951 -0.995,-2.205411 -2.09,0.09974 -2.388,-0.300234 -1.99,-0.601475 -3.483,-0.301242 -1.891,-1.743977 -0.895,-1.804427 -0.697,-2.606395 -2.686,-1.303701 -3.085,-0.702225 -1.991,1.303701 -2.188,0.09974 -0.797,-1.202951 -0.099,-2.205411 0.498,-1.103209 -0.498,-1.603935 0.398,-1.603936 0.995,-2.30616 2.388,-1.703677 2.488,-2.105669 2.289,-2.506652 2.189,-2.806887 0.896,-2.8068862 1.989,-1.3026936 3.085,0.3002341 3.881,0.4009838 4.379,0.2004919 2.089,-0.5017335 -1.89,-2.1046611 -1.668,-0.9268972 0.829,-1.1989214 2.033,-0.2810916 1.791,1.6049426 2.587,0.6004682 1.293,-1.6029277 1.792,-0.4009837 1.691,-0.8029751 1.393,-0.7012179 2.19,-1.1032091 1.493,-1.20295141 L 135.523,0 l 1.691,0.30124159 z", labelX: 182, labelY: 61, color: '#3B82F6' },
      { id: "jh", name: "Jharkhand", d: "m 320.53,307.04276 4.574,0.50878 3.168,-0.64379 1.266,-0.34658 1.334,-2.07846 1.141,0.59442 1.32,3.01745 0.632,-0.54002 0.126,-0.81808 0.696,0.68912 -0.134,-0.84629 0.323,-0.18841 0.612,0.46446 0.366,-0.41509 0.464,0.51685 0.48,-0.48763 -0.227,-0.28512 0.497,-0.0403 0.699,1.45885 -0.674,0.50677 -0.021,0.68913 0.78,0.45237 -0.322,0.17833 0.436,0.63673 0.97,0.14105 0.844,0.70324 -0.107,0.63976 0.776,-0.16725 0.818,1.18683 0.669,-1.20597 -0.083,-0.84731 0.925,-0.17731 0.14,-0.65387 1.796,0.42919 0.433,-1.44273 2.436,-1.68554 0.781,0.41408 0.038,1.35911 0.958,-0.23676 0.374,2.08955 1.475,-0.0887 0.458,-0.83522 1.317,-0.0665 0.478,-0.57125 -0.224,1.22411 0.502,0.17429 1.674,-1.15862 -0.391,-0.76872 2.748,-0.79189 0.011,-0.67905 4.27,-0.55413 0.666,0.6045 0.388,-0.93899 0.659,10e-4 0.173,-0.87249 1.844,0.48662 -0.317,-2.42605 0.986,-0.60954 0.84,-2.52176 0.848,0.54707 2.104,-0.0312 1.519,1.57573 2.099,-1.09616 -0.242,0.88358 0.994,-0.11486 0.793,0.94907 0.186,2.34545 1.291,0.42415 0.469,-0.61356 0.978,0.82816 1.23,-0.19042 -0.394,0.59543 0.176,1.14754 -0.697,1.07097 1.499,0.42214 1.357,1.48606 0.767,0.24281 0.285,-1.22612 0.477,-0.0715 0.358,-2.1369 0.858,-0.39897 1.177,-1.61501 1.37,1.02462 1.323,-0.3496 0.404,-0.97324 0.55,-0.0413 0.6,0.58334 -0.115,0.69014 0.768,-0.0846 0.369,0.41005 0.456,-0.3889 0.727,0.65991 -0.273,-1.10321 0.67,-1.29866 2.519,0.83219 0.967,-4.49545 -0.379,-0.48057 0.752,-0.76872 0.765,-0.0675 0.149,-0.62867 -0.237,-3.20787 1.351,-1.51125 0.821,-0.3768 0.848,0.38385 0.678,-3.10107 0.972,0.41811 0.459,-0.51987 1.681,0.76167 0.011,-1.07198 0.483,-0.50073 -0.297,-0.75864 1.218,0.31434 0.162,-1.14452 0.683,-0.404 0.562,0.85838 1.616,0.0282 0.495,1.24728 1.581,0.23677 0.09,0.59543 0,0 -0.232,2.99528 2.103,1.46289 1.874,2.27795 0.144,0.76671 -1.767,1.00548 0.198,0.65789 -0.644,0.0353 0.188,0.67703 -0.463,0.67805 -0.403,0.0252 0.048,-0.56823 -0.407,0.50475 0.453,0.64178 1.278,0.38386 -0.297,1.09615 0.561,0.35766 -0.604,0.73749 0.357,0.32442 -0.605,0.0423 0.779,0.3899 -0.473,0.71835 -0.82,0.26799 -1.649,-0.70827 0.773,0.84428 -0.234,1.24729 0.241,-0.45136 0.34,0.37378 -0.799,1.84069 0.53,0.18236 -1.125,2.37064 -0.962,0.26598 -0.607,1.04981 -0.955,0.0907 0.041,0.71129 1.149,0.58435 -0.063,0.83521 -2.515,-0.13399 0.799,0.61356 -0.803,0.5108 0.145,0.49368 -1.728,-0.68913 -0.05,1.45281 0.404,0.28008 -0.582,0.60148 -1.023,0.12191 0.504,0.61759 -2.121,-0.63774 -0.601,0.30325 -0.262,-0.19344 0.356,-0.61155 -1.977,-0.23374 0.493,1.72383 0.635,0.23979 0.057,1.31075 -0.505,0.58737 -0.465,-0.78182 -0.115,1.8548 -0.505,-0.10578 -0.628,-0.23072 0.148,-0.30729 -1.355,-0.29217 0.743,1.08709 -0.37,0.57729 -0.515,-0.0151 -3.292,-1.61099 -0.638,0.46849 -0.867,-0.80398 -0.414,0.40199 -0.084,0.41811 -1.056,0.75361 -0.584,-0.46043 0.563,1.61099 -0.58,1.68856 -1.129,0.22367 -0.135,-0.37076 -0.792,-0.0171 -2.139,0.53599 -1.319,0.96619 -1.859,-0.0151 -0.005,0.46949 -1.228,0.56621 -0.481,0.94504 -0.089,1.06593 0.382,0.31535 -1.504,0.89062 0.296,0.35162 -0.299,0.18941 -0.45,-0.48259 -0.739,0.49266 -0.388,-0.36773 0.295,-0.77779 -0.372,0.31333 -1.579,-0.3899 -0.016,-2.16713 -2.05,-0.36773 -0.755,0.73648 0.763,1.32788 -2.163,0.89264 -1.63,-0.35766 -0.066,1.37725 0.687,0.89969 -0.616,0.13098 0.245,0.93898 -1.081,1.3843 0.11,1.55155 0.543,0.0181 1.203,1.47799 2.552,-0.32139 0.232,0.79693 1.854,0.58334 0.283,0.96216 1.306,1.11631 1.796,-0.48662 1.985,0.8876 0.485,-0.46748 1.698,0.11083 0.312,0.53901 0.587,-0.47755 -0.459,0.97727 -0.708,0.2287 -0.296,-0.34557 -0.787,0.59341 0.632,0.60954 -0.632,0.82312 -0.349,1.90921 1.893,1.7067 0.684,-0.43524 1.646,1.07399 0.708,2.21751 2.266,0.0766 0.81,1.67043 -0.197,0.55211 -0.918,-0.0272 0.353,1.14452 1.71,0.66192 -0.309,1.62107 1.194,0.69013 -0.011,0.95309 -1.451,0.0635 -0.094,-0.33147 -0.042,0.58737 -0.204,0.5511 -0.505,-0.003 -0.187,0.0554 -0.927,-0.0887 0,0 -1.5,-0.40703 -0.116,-0.63674 -1.144,-0.30527 -0.261,-0.52188 -0.965,-0.008 -0.679,-0.96921 -1.288,0.39796 -0.106,0.49468 -1.687,-0.9944 -1.527,-2.26989 -3.611,-0.89365 -1.441,-1.78629 -0.345,0.97727 -1.104,0.4705 -0.33,0.99541 1.157,0.71733 0.261,1.11732 -0.593,0.83622 0.576,0.19848 -0.251,0.44128 0.729,0.0856 -1.538,1.42359 1.192,1.3168 -0.55,1.72584 -1.211,2.03313 -0.636,0.32341 -0.143,0.86443 -3.028,-0.52289 0.569,-1.97872 0.896,0.005 -0.601,-0.7667 -2.523,1.40546 -0.772,-0.94 -1.121,0.35968 -1.078,-0.27606 -3.039,-1.63013 -0.652,0.0917 -0.107,0.79189 -0.735,-0.12191 -0.48,0.40502 -1.448,2.41597 -0.422,-0.97022 -0.802,-0.56621 -0.034,0.45237 -0.32,-0.50274 -0.767,0.0907 -0.491,-0.74756 -1.079,-0.2549 -0.871,0.69719 -0.47,-0.1078 0.918,-0.6176 0.98,-3.628 0.92,-0.41508 -0.009,-0.53801 -0.546,0.003 0.105,-0.61155 -0.396,-0.17026 -0.242,-2.94492 -2.258,0.89768 -0.153,-0.27706 -1.12,0.74958 -0.362,-0.57226 -0.92,0.38285 -0.519,-0.46446 -1.152,0.10982 -0.186,0.6176 -4.547,-0.1199 -1.046,0.31938 0.02,0.50576 -0.623,0.10378 -0.456,0.68711 -2.865,0.26094 -0.893,-0.82615 -1.098,0.0433 -0.872,-0.66092 -0.366,-1.58681 -2.773,-1.13343 0,0 0.053,-1.10624 1.577,-1.52132 1.455,0.0484 1.481,-0.78383 0.1,-1.50621 0.603,-0.6327 0.65,-0.009 0.926,-2.18728 0.845,-0.11284 0.401,-1.69058 -0.387,-0.82715 -1.925,0.31434 -0.15,-0.62868 -1.137,0.28311 -0.569,-1.07702 -0.878,1.36314 -0.388,-2.67994 -2.004,-1.29765 0.765,-4.37153 -0.562,-1.00649 -0.772,0.4846 -0.852,-0.64882 0.077,-1.69562 1.113,-2.03212 -0.328,-2.015 -1.447,0.22669 -0.055,1.35911 -3.357,-0.8342 -1.259,-1.90115 0.307,-1.65431 -0.711,-1.51024 -2.81,-0.97022 0.313,-0.49166 -0.698,-0.31736 -0.755,-2.9832 -1.238,-0.32743 -0.466,-0.94806 -2.131,-0.404 0,0 1.64,-3.78517 -0.544,-1.11832 1.58,-1.15459 -0.45,-0.8997 -0.623,-0.11183 -0.391,-1.08205 0.243,-1.04981 z", labelX: 370, labelY: 318, color: '#10B981' },
      { id: "ka", name: "Karnataka", d: "m 124.338,505.46021 -0.617,-0.44733 0.776,-0.16422 -0.063,-0.8604 1.544,-0.77275 0.48,-0.70223 0.476,0.96821 0.881,0.0413 1.521,-0.74857 0.512,-1.53442 -0.938,-0.17228 0.62,-0.86141 0.404,0.86745 0.379,-0.0181 -0.412,-1.05888 1.641,-3.03861 -0.711,-0.35364 -0.968,0.47151 -0.458,-0.38889 1.391,-1.25837 1.141,0.50879 -0.068,-1.30269 0.567,-0.8997 -0.205,-0.93495 -1.688,-0.57629 -0.027,-0.50476 -1.422,-0.24583 -0.407,0.51987 0.312,-0.51181 -0.538,-0.73446 0.051,-1.1828 0.369,-0.24886 0.389,0.56622 0.156,-0.64581 -0.554,-0.135 -0.079,-1.12941 -0.891,-0.14911 0.075,-0.95309 -0.652,0.58133 -0.327,-0.41207 0.683,-0.18639 -0.196,-0.9007 0.79,0.92891 0.32,-1.12336 0.758,-0.0786 -0.063,0.39998 0.572,0.23676 0.284,-1.11026 1.444,-0.57126 0.104,-1.2241 0.432,0.74655 1.118,-0.14407 0.474,1.77622 1.304,-0.51987 0.135,-0.67805 0.996,0.0504 -0.625,-0.72439 0.746,-0.8191 0.043,-0.88055 3.282,-1.21706 1.441,0.0192 -0.248,-1.88302 1.091,-0.48057 0.066,-0.60249 -0.842,-0.44329 0.238,-0.33752 1.924,-0.0121 0.034,0.3486 1.225,-0.50375 1.062,1.64625 1.016,0 -0.135,0.69014 0.684,0.0373 1.401,-0.74252 0.119,-1.76514 1.19,0.0494 1.035,-0.52289 0.759,0.28311 0.772,-0.47957 0.515,0.92992 1.629,-0.45438 0.114,-0.9672 0.706,0.10276 0.024,0.73447 0.719,0.40703 0.619,-0.20251 -0.049,-1.65431 -0.596,-0.0151 0.725,-0.57931 0.002,-0.68712 -1.057,-1.6664 0.714,-0.83722 -0.047,-1.16568 -1.129,-0.91884 0.15,-0.85738 -0.592,-0.16422 -0.131,-0.72741 0.78,-0.19646 0.414,-1.88201 0.878,0.4302 0.285,0.99642 0.96,-0.20352 1.367,1.13646 0.469,-1.15761 0.779,0.81405 0.529,-0.69215 0.134,1.39841 0.785,0.64883 2.583,-0.66294 0.506,0.53196 0.889,-0.79693 0.877,0.55916 0.264,0.96015 -0.072,-1.13243 1.508,-0.56823 0.659,0.96922 1.418,-0.42618 0.181,0.86343 0.616,-0.0262 0.552,-1.2634 -0.964,-0.12593 0.234,-1.3037 -0.827,0.0463 -0.06,-0.80197 0.926,-0.54304 -0.661,-0.0191 0.474,-0.61155 -0.546,-0.44733 -0.175,-1.14955 1.758,-0.20553 0.273,-0.88459 1.268,-0.35766 -0.062,-1.16265 0.781,-0.0373 0.001,-0.96115 1.038,-0.0242 -0.001,1.27348 0.863,-1.45483 1.02,1.77017 0.573,0.1743 0.159,-1.01455 0.617,-0.24079 -0.249,-0.98735 0.985,-0.11384 0.532,-0.86746 -1.061,-0.67301 0.067,-0.90271 1.3,0.65386 2.379,-1.03067 0.026,-2.60337 0.773,-0.14206 -0.16,-0.75159 0.445,-0.51584 -0.957,-0.41912 0.661,-1.51628 0.707,-0.0796 0.755,0.56923 0.186,-0.46546 0.52,0.69316 1.072,-0.008 -0.279,-0.93496 1.14,-0.47453 0.43,-1.41956 0.746,0.0645 -0.226,-0.76772 1.039,-1.27851 -0.101,-0.84126 1.616,-0.99742 0.517,0.51987 0.577,-0.38386 0.002,1.03772 0.845,0.269 -1.074,1.7198 1.624,0.0917 0.607,1.02866 0.938,-0.40804 -0.015,-0.62465 0.847,0.33953 0,0 1.11,0.2952 -0.81,1.70972 0.701,1.07298 0.059,1.15661 -1.148,1.00649 0.974,0.96115 1.129,0.37378 0.151,0.52592 -0.197,0.50576 -0.424,-0.25087 -0.15,1.209 -0.657,-0.11788 0.241,0.83219 -0.501,-0.0524 -0.482,1.20598 -0.497,-0.19243 -0.316,0.55916 -0.134,0.41509 1.287,0.40501 -0.083,0.37479 -2.338,1.22814 -0.218,2.41597 1.049,0.33349 0.243,0.55815 0.54,-0.71029 0.439,0.5229 0.867,-0.29319 0.04,0.66193 1.965,0.59442 -0.034,0.72036 -0.752,-0.18336 0.098,-0.48461 -0.258,0.59946 -0.617,0.134 -0.007,0.56521 -0.783,-0.21964 -0.013,0.54203 -1.307,0.0504 0.531,0.50879 -0.157,0.70222 -0.605,0.39595 -0.995,-0.35968 -0.368,1.80544 0.429,0.27202 -1.552,1.23318 0.386,0.24079 -0.812,1.03369 2.148,1.26239 0.77,2.12078 -0.963,2.15403 0.372,2.84517 -0.704,-0.0887 -0.296,1.50218 0.909,0.0564 -0.037,0.73648 -1.015,0.33852 0.343,0.5511 0.763,-0.2025 -0.109,1.3712 -1.522,0.41509 0.5,1.0357 -0.758,0.15516 -0.268,0.58132 -1.458,-0.16019 -0.097,0.3899 -1.189,0.12191 1.036,1.42158 1.22,0.50879 1.44,0.37176 1.732,-0.28613 2.033,0.83622 -0.027,1.10724 -0.53,-0.23676 -0.653,0.7657 -0.682,-0.11284 -0.286,0.39393 0.025,0.55614 0.46,0.0212 -0.568,1.41352 0.064,0.93395 0.476,0.26698 -0.391,1.59084 0.405,0.6186 -0.014,1.7742 0,0 -5.454,-0.80499 -2.208,0.37379 -1.622,0.9007 -0.915,1.47195 0.871,0.1884 -0.433,1.93137 1.711,1.64222 -0.184,0.7385 -0.728,-0.6045 -1.092,0.41408 -0.056,2.91167 -1.145,-0.13803 -0.032,0.3355 1.193,1.21202 0.715,2.46333 1.007,-0.11788 0.12,0.81406 0.68,0.0907 0.34,0.5773 -0.906,0.82212 0.78,0.59543 -0.01,0.97425 -0.536,0.13601 0.459,0.48158 -1.574,2.61647 -0.792,-0.11788 0.123,-0.51583 -0.967,-0.008 -0.395,0.4171 -2.2,-0.39796 -1.67,-1.34803 -0.475,0.42113 0.216,1.18784 -0.435,1.01455 1.342,0.40904 0.765,-0.2821 -0.329,3.46982 -1.432,0.53599 0.371,0.96821 -0.793,2.87338 0.828,1.60897 0.583,0.10075 0.893,1.1828 2.16,-0.21258 -0.62,0.71835 -0.046,0.98633 -0.596,-0.30325 -0.627,0.50375 -0.084,0.94805 1.486,1.13344 -0.528,0.47251 0.271,0.69316 2.34,0.0121 0.538,0.65286 0.623,-0.0846 0.143,-1.60595 0.842,-1.08709 1.67,0.57729 1.03,-0.43423 -0.033,1.19086 1.667,0.1471 -0.081,0.84932 0.594,0.82615 0.668,-0.43524 -0.852,-1.8004 0.223,-0.64278 1.187,0.32743 0.259,0.81305 0.87,0.009 0.087,2.61143 -2.317,-0.3093 -0.272,0.77174 -0.606,0.11284 -0.067,0.61155 0.946,-0.48662 0.12,0.32643 -1.45,1.73995 1.197,0.3365 -0.162,0.82514 1.151,0.008 -0.48,0.70525 0.413,0.58032 -0.744,0.63372 -0.03,-0.38487 -0.881,0.0242 0.114,-1.85279 -0.843,-0.91682 -3.478,0.71734 -0.549,-1.09213 -2.039,-0.23978 -0.322,-0.96921 0.241,-1.61301 -1.637,-0.35766 -0.098,0.50577 -0.954,0.14911 -0.162,0.60449 0.907,0.0826 1.005,1.33896 -0.919,0.91884 2.193,2.09761 0.114,0.60853 -0.502,0.0876 -1.023,1.70468 0.506,1.54953 0.395,0.21158 0.313,-0.83522 0.706,0.70324 0.737,-0.47554 1.493,0.134 -0.091,-1.42461 -0.803,-0.6186 0.809,-0.16422 -0.137,-0.92488 0.441,-0.37983 0.037,1.24325 0.547,-0.46042 0.138,0.42617 0.467,-0.72339 0.348,1.19691 1.182,-0.38386 0.274,0.68006 0.826,-0.4302 1.362,0.2277 -0.332,0.77476 1.021,0.0474 -0.161,2.61646 0.695,-0.0846 0.092,-0.58435 0.522,0.45539 0.154,-1.25535 0.762,0.59141 0.828,-0.58536 0.537,0.3496 0.324,-0.16926 -0.55,-0.43624 0.809,-0.44028 0.442,-0.0363 -0.136,0.54505 0.666,-0.19746 0.276,0.6186 0.086,-1.24527 1.374,-0.48259 -0.051,-0.49669 1.082,-0.53297 -0.447,-1.03671 0.25,-0.56723 1.438,0.0796 0.515,0.73345 1.148,-1.15156 0.243,1.23519 -0.745,0.2831 0.044,1.30169 0.444,-0.005 0.406,-0.89566 1.102,0.18941 0.07,-0.73145 1.516,0.98937 0.098,1.37926 -0.697,0.93798 0.512,0.50173 -0.084,0.55715 -0.865,-0.0816 -0.12,0.4574 0.469,0.68309 1.57,-0.28815 0.1,0.54506 0.7,0.15616 -0.224,1.28859 0.93,-0.66394 3.414,0.19545 -0.746,4.80576 0.884,0.48965 -0.636,0.26497 0.508,0.35262 0.695,-0.33146 0.241,0.44632 0.749,-0.20553 1.027,1.12638 0.729,-0.94402 0.457,0.80499 -0.184,1.24425 -0.581,0.36573 0.589,0.66091 -1.263,0.79391 0.402,0.47957 -0.545,0.33751 0.056,0.62163 -1.11,0.45639 0.133,1.46793 -0.738,-0.11486 0.275,1.46087 -1.203,0.11788 -0.689,-0.70726 -0.886,1.73994 -1.298,-0.005 -0.428,2.03715 0,0 -2.093,-0.37478 -1.548,-1.55457 -0.666,-0.0756 -0.281,1.08406 -0.42,-0.004 -0.75,-1.15459 -0.435,0.7657 -0.326,-0.17833 0.528,-0.73245 -0.35,-0.48057 -2.781,0.95812 0.306,1.00952 -1.425,2.63964 -0.578,-0.20956 -0.533,0.52994 -0.504,-0.54002 -1.339,0.35666 0.157,0.78484 -0.582,1.35407 0.177,1.09314 0.583,0.15515 -0.649,0.67402 1.043,-0.19042 -0.107,1.47699 -0.34,1.17273 -1.279,1.50318 -1.518,0.46849 -0.095,1.27851 5.457,0.74958 0.881,1.32285 -1.654,2.04924 -0.607,1.53744 -3.686,0.12292 -0.157,1.20799 -0.505,-0.269 0.073,1.05888 -0.775,1.89308 -1.251,-0.60147 -0.699,0.42415 -0.864,-0.84327 -0.902,-0.0877 -0.308,0.39997 -2.601,0.44129 0.136,1.076 -0.789,-0.26195 -0.316,-1.11429 -0.716,0.26598 0.195,-0.41106 -0.57,-0.40803 -0.663,0.0413 -0.276,0.76872 -1.254,-0.38788 -1.49,2.97816 0.469,0.90473 -0.285,0.58435 -0.435,-0.48562 -1.471,-0.28512 -3.897,0.009 -0.412,-1.29161 -0.758,-0.58939 -1.106,0.91783 -0.584,-0.0897 0,0 -0.566,-0.89365 0.471,-0.34255 -0.235,-0.77678 -1.521,0.48561 -1.318,-1.56061 -1.12,0.0746 -0.722,-1.36415 -1.59,0.27001 -0.003,-2.55803 -2.375,1.01354 -2.464,-0.37278 -1.096,-0.93294 -0.517,-1.86185 -1.73,0.19444 -0.323,-0.81909 -0.82,0.19545 -0.572,-1.09817 -1.219,-0.17933 -1.97,-2.90361 -1.331,-0.005 0.047,-1.72382 -1.168,-0.86343 0.021,-0.95712 1.17,-0.18034 -0.168,-0.78686 -1.542,0.8725 -0.125,-0.73447 -1.125,-0.59946 -0.09,-0.98634 1.068,-0.45136 -1.071,-0.56823 -1.126,1.05183 -0.449,-1.34098 -0.885,0.17329 -0.339,-0.3496 0.161,-0.92388 -1.351,-0.46042 -0.063,0.67401 -0.739,0.13602 0.039,-1.17374 -0.891,0.11788 0.106,-0.29318 -0.574,-0.15012 0.499,-0.65689 -0.342,-0.6448 -2.621,0.77376 0,0 -0.965,-2.10365 -2.634,-10.6573 -0.512,-6.16488 -1.337,-5.02237 -0.768,-1.72786 -0.809,-0.39594 -0.627,-1.24728 -0.64,-3.47486 -0.611,-0.87048 -1.843,-6.03994 0.826,-0.61357 -0.599,-0.48662 -0.181,0.68611 -0.971,0.0302 -0.313,-1.75002 -0.524,-0.54808 0.32,-0.28814 -0.384,-1.61905 -0.669,-0.71633 -0.622,0.65084 -2.291,-1.75103 0.587,-0.13299 0.157,-0.89768 -0.396,-0.0121 -0.308,-1.05989 0,0 0.879,-0.538 0.754,0.24986 -0.068,-0.91279 0.831,0.64278 1.22,-0.98231 -0.176,-0.52289 0.851,-1.06593 -0.502,-1.21605 0.235,-1.02664 0.676,-0.8876 -0.318,-0.85033 -1.029,-0.74857 1.761,-0.76671 -0.278,-1.61602 -0.957,-0.46446 -0.003,-1.18481 -0.548,-1.00952 0.647,-0.7939 -0.69,-0.86645 0.298,-0.95108 -0.278,-0.97123 -0.496,-0.26799 -0.384,0.38083 -0.483,-0.69517 -0.35,0.62969 -0.986,0.0383 z", labelX: 171, labelY: 519, color: '#F59E0B' },
      { id: "kl", name: "Kerala", d: "m 139.851,568.07111 2.621,-0.77376 0.342,0.6448 -0.499,0.65689 0.574,0.15012 -0.106,0.29318 0.891,-0.11788 -0.039,1.17373 0.739,-0.13601 0.063,-0.67401 1.351,0.46042 -0.161,0.92388 0.339,0.3496 0.885,-0.17329 0.449,1.34098 1.126,-1.05183 1.071,0.56823 -1.068,0.45136 0.09,0.98634 1.125,0.59946 0.125,0.73446 1.542,-0.87249 0.168,0.78686 -1.17,0.18034 -0.021,0.95712 1.168,0.86342 -0.047,1.72383 1.331,0.005 1.97,2.90361 1.219,0.17933 0.572,1.09817 0.82,-0.19545 0.323,0.81909 1.73,-0.19444 0.517,1.86185 1.096,0.93294 2.464,0.37278 2.375,-1.01355 0.003,2.55804 1.59,-0.27001 0.722,1.36415 1.12,-0.0746 1.318,1.56061 1.521,-0.48562 0.235,0.77678 -0.471,0.34255 0.566,0.89365 0,0 0.028,0.77175 -0.937,0.0191 -0.626,0.84932 -1.093,0.39393 -0.564,-0.61054 -0.946,0.60853 0.3,2.24067 0.794,-0.31837 0.897,0.63875 0.268,-0.30023 1.606,0.53699 0.795,1.1153 1.279,0.74253 0.601,-0.10579 0.042,1.26642 -1.963,1.32285 0.133,1.07399 0.73,-0.48259 2.834,0.36572 1.547,-0.97626 0.599,0.48057 -0.72,1.37423 0.996,0.49569 -0.034,1.57572 1.159,0.10881 -1.799,0.23475 -1.201,2.28802 3.525,1.33091 0.479,1.15459 1.002,0.16624 0.193,0.62061 -0.879,2.03616 0.358,0.97727 -1.416,0.0655 0.518,0.88056 -0.469,3.62598 0.67,1.17675 -0.412,1.37222 0.395,0.37478 0.539,-0.26497 -0.042,0.48965 0.904,0.9007 1.367,0.34355 1.418,-0.84125 0.279,-0.79492 2.326,-1.29463 1.239,0.12795 -0.16,0.73446 0.755,1.10926 -0.084,0.70525 0.71,0.28411 -0.433,1.87596 -1.507,0.56621 1.262,1.53845 0.229,1.42259 -0.509,0.22467 -0.745,1.63416 0.514,0.36068 -0.309,0.73346 0.524,0.55312 -0.506,0.18336 -0.033,1.23821 -0.383,0.13098 -0.796,2.32832 0.922,0.0393 1.237,0.8332 1.032,-0.59644 0.429,0.63371 0.337,-0.67703 0.202,1.46087 0.957,0.6317 -0.37,0.97324 -0.928,0.41811 -0.48,2.19131 -0.569,0.0101 -0.362,0.77577 0,1.74197 -0.632,0.62968 0.317,0.76771 -1.17,1.15762 -0.288,1.1022 -1.045,0.5239 1.005,1.37523 0.005,0.66293 0.508,-0.0353 0.801,1.23318 -0.593,1.77118 -0.798,0.86342 -0.444,-0.0544 2.299,4.24055 -0.369,0.76469 -1.278,0.16926 0.481,1.17877 -1.563,1.25333 0.52,1.39941 -0.79,-0.22165 -0.533,0.52692 0,0 -2.545,-1.84472 -7.182,-9.55913 -1.791,-1.40244 -0.576,-2.46232 -3.785,-8.43779 -2.105,-11.67991 0.332,-0.0887 0.889,1.69562 1.359,1.45281 0.002,2.57617 0.617,0.4302 -0.692,3.28948 0.546,0.39997 0,-0.41509 2.483,-0.11183 -1.797,-0.73749 0.296,-0.96216 -0.186,-0.83219 -0.39,0.0645 0.233,-1.05082 -0.652,-0.14206 -0.11,-3.43153 -0.779,-1.16366 -0.343,0.11183 0.245,0.6448 -0.349,-0.10176 -1.448,-3.00133 0.314,-1.05283 -1.233,-1.44274 0.791,3.53531 -0.407,0.0826 -2.611,-8.59193 -3.96,-8.7753 -1.099,-4.8249 -2.552,-7.15122 -1.111,-2.0301 -1.367,-0.6176 -1.57,-4.37959 -2.872,-3.3469 -1.041,-0.45841 -1.873,-3.13433 -0.738,-0.3899 -0.611,0.40099 -0.413,-1.92231 -4.361,-8.65742 -2.225,-5.48985 z", labelX: 166, labelY: 615, color: '#8B5CF6' },
      { id: "ld", name: "Lakshadweep", d: "m 102.28,662.9068 -0.04,0.46949 -0.372,0.39998 -0.373,0.005 -0.268,-0.10477 -0.011,-0.12997 0.116,0.10579 0.36,-0.0292 0.308,-0.18236 0.28,-0.53397 z m 12.194,-38.13376 -0.076,0.91682 -0.128,0.0887 -0.134,-0.31938 0.116,0.0181 0.087,-0.13601 0.135,-0.56823 z m -27.707,-0.68409 0.081,0.24683 -0.122,-0.0413 0.041,-0.20553 z m 27.905,-0.41509 0.087,0.30225 -0.064,0.25288 -0.023,-0.55513 z m -21.329,-8.97579 0.151,0.11183 -0.006,0.21964 -0.704,0.44833 0.559,-0.7798 z m 21.695,-5.20775 -0.029,0.0836 0.534,0.0594 -0.622,0.21964 -0.227,-0.0826 -0.011,-0.19545 0.355,-0.0846 z m -31.522,0.0363 0.343,-0.62868 0.11,-0.4564 0.134,-0.1481 0.122,0.006 -0.709,1.22713 z m 2.483,-2.69103 -0.064,0.0474 0.058,0.1602 -0.14,0.0181 0.029,-0.2015 0.117,-0.0242 z m 0.738,-0.15414 -0.273,0.21258 0.029,-0.11183 0.244,-0.10075 z m 8.478,-3.90909 0.029,0.17832 -0.268,0.36774 -0.104,-0.13097 0.018,-0.17833 0.325,-0.23676 z m -13.159,-1.68454 0.029,0.0534 -0.087,-0.0353 0.058,-0.0181 z m 14.386,-0.9551 -0.25,0.90775 -0.354,0.79492 0.349,-1.29968 0.255,-0.40299 z m 4.39,-5.08887 0.192,0.22568 0.052,0.33852 -0.082,0.0836 -0.122,-0.5108 -0.105,-0.0836 0.065,-0.0534 z m -17.031,-2.20944 0.058,0.11284 -0.087,-0.0292 0.029,-0.0836 z m 11.048,-2.24672 0.053,0.30326 -0.245,0.24381 0.192,-0.54707 z", labelX: 120, labelY: 600, color: '#6366F1' },
      { id: "mp", name: "Madhya Pradesh", d: "m 209.826,253.29481 1.069,0.35564 0.444,-1.01354 1.45,-0.2428 0.804,1.16365 0.756,-0.17429 0.521,0.80499 2.409,0.94906 1.951,-0.27202 1.179,-0.72742 0.159,0.49065 0.379,-0.31031 0.53,0.6579 0.943,-0.0222 1.12,1.42863 0.817,-0.20453 0.925,0.38991 -0.214,0.79995 1.157,-0.51383 0.261,1.73894 -0.545,0.85436 0.245,-0.19344 0.139,0.73548 0.473,-0.0161 0.845,1.13343 -0.261,1.10724 1.639,0.26396 -0.199,0.64782 -0.637,-0.0161 -0.21,1.29061 1.193,0.41509 -0.379,0.23071 0.229,0.44632 -0.686,0.0957 -0.215,0.92488 -0.342,-0.35565 -0.632,0.48259 0.419,0.79794 -0.767,-0.0322 -0.115,0.8604 -0.786,0.0464 0.488,0.94704 -1.215,0.36976 1.267,1.33997 -1.232,1.04679 -0.309,2.04421 -1.113,0.78585 0.132,1.05787 -0.755,0.22769 0.32,1.42964 -1.06,-0.72137 -0.26,0.27807 0.49,0.0695 -0.037,0.36874 -1.543,1.17172 1.351,1.73693 -0.128,1.16164 -2.683,0.70827 -0.595,0.66193 -0.837,-0.54506 -0.575,0.57629 -1.987,-0.41711 -0.65,0.70424 -0.542,-0.27706 -0.432,0.72036 0.252,1.28456 -0.907,0.67905 -0.624,-0.15011 -0.362,1.2503 -0.728,0.60853 0.749,0.88458 -0.487,0.59644 0.777,0.30225 0.197,1.20396 0.905,0.65588 -0.26,0.5239 1.279,0.6055 -0.589,0.36069 0.515,0.57225 -0.996,-0.0403 -1.415,0.9672 -0.005,2.06537 -3.394,2.72427 -0.033,0.57025 0.946,1.01757 0.238,1.5183 1.007,1.85278 -0.2,2.5127 -0.82,0.81607 1.044,1.07399 -0.057,0.66394 1.969,1.41856 -0.732,1.29262 1.123,1.24426 1.154,-0.50879 1.478,-2.21548 1.53,0.84932 1.898,2.57717 0.623,0.24382 0.698,-0.44532 0.286,0.33449 0.301,-0.44229 0.658,1.8004 0.457,-0.69114 1.368,-0.29419 0.605,-1.79839 1.237,-1.20597 0.367,-2.02003 -1.587,-0.58636 0.11,-0.78484 0.354,0.37579 0.746,-0.28713 -1.772,-3.29049 -2.195,1.075 -0.574,-0.27404 -0.197,-1.26945 0.677,-1.01958 -0.164,-2.09761 0.335,-0.46244 -0.337,-1.07198 -2.011,-0.94805 -0.308,-0.96821 -0.662,-0.47755 0.416,-2.23564 -0.937,-0.84226 -0.598,-3.72573 -1.505,-0.81809 -0.893,0.54002 -0.559,-0.41912 0.277,-0.35967 0.554,0.25892 0.526,-0.71532 0.169,0.4574 0.52,-0.0564 0.343,-0.46445 -0.342,-0.84529 1.069,0.25691 -0.316,-1.01656 0.57,0.0836 0.317,-0.57931 0.526,0.24583 0.505,-0.87149 0.692,-0.0876 0.327,0.43927 -0.676,0.58032 -0.264,-0.37681 0.029,0.74555 1.07,0.2146 0.097,0.59845 1.062,-0.12594 -0.445,-1.26138 1.461,-0.41106 -1.211,-0.0796 -0.636,-0.68409 0.149,-0.86847 0.518,0.57025 1.535,0.2428 0.332,0.26296 -0.667,0.18739 0.428,0.3214 0.479,-0.806 -0.604,-0.99541 0.998,-0.33247 -0.035,-0.75966 0.754,-0.0544 0.136,0.41912 0.291,-0.42819 0.233,0.66394 -0.534,0.2418 0.404,0.94604 -0.679,0.76973 0.542,0.43121 0.649,-0.24482 0.385,1.45986 -1.044,0.56218 -0.758,-0.54606 0.81,-0.0423 0.381,-0.53498 -1.561,0.29117 -0.775,0.82413 0.12,0.45942 -1.079,0.40703 -0.182,0.39897 0.595,-0.0514 -0.126,0.66998 0.756,0.96921 0.727,-2.6749 1.07,0.2962 0.528,-0.42214 0.36,1.50117 -0.615,0.52189 -0.671,-0.27102 -0.354,0.67099 -0.331,-0.23978 -0.084,2.08149 1.601,-1.25635 0.994,0.56218 -0.024,-0.87652 -0.492,-0.25893 0.708,-0.74353 0.149,0.66696 0.928,0.52189 -0.667,0.90775 -0.059,1.00548 0.446,0.11587 0.863,-1.26038 0.756,0.65789 -0.263,0.47453 0.447,0.76268 1.049,-0.16019 -0.262,-0.57125 0.378,-0.20352 0.451,0.86544 0.67,-0.0605 0.107,-0.5652 -0.62,-0.17531 0.46,-0.29217 0.488,0.17832 0.019,0.72238 0.903,-0.25993 0.237,-0.43021 -0.748,-1.05485 -0.109,-1.17574 1.235,1.09615 0.301,-0.31131 -0.374,-0.3627 0.23,-0.9944 -0.629,0.25187 -0.467,-0.65789 -0.593,0.43725 0.015,-0.9007 0.724,-0.69518 1.072,0.16624 -0.317,0.90473 0.464,0.66495 0.303,-0.67099 1.002,0.81406 0.881,-0.57226 0.691,0.31434 -0.653,0.0202 -0.673,1.02966 0.328,0.29016 -0.693,0.0876 -0.539,0.89264 0.32,1.31579 0.335,-0.59341 0.333,0.73144 0.781,-0.62364 -0.164,0.88257 0.614,0.31434 1.584,-2.19635 0.506,0.70122 0.274,-0.17228 -0.103,0.54002 3.093,-0.28815 2.309,1.05082 -0.173,-0.80801 0.511,-0.39192 -0.522,-2.0835 1.157,-0.38789 0.231,0.54506 0.61,-0.89264 1.134,0.0756 0.502,-1.72887 1.31,-0.29418 0.837,0.404 1.352,-1.04981 0.126,-0.75562 1.074,0.26195 0.223,-0.55312 1.149,0.96216 -0.14,2.284 1.548,1.19186 0.44,-0.12694 0.517,1.59588 -1.516,0.67804 -1.766,2.65476 1.04,0.62666 0.884,-0.52994 0.488,0.37781 -0.343,-1.11127 1.568,-0.56319 0.618,0.86544 0.502,-0.0141 0.121,-1.02462 -0.499,-0.29419 0.698,0.0282 0.71,0.77275 0.399,-0.5501 0.928,0.44532 -0.255,-1.92432 0.791,0.74051 -0.65,0.43725 1.151,0.69417 0.481,-0.17027 -0.12,0.63976 1.123,-0.40904 1.02,0.23475 0.001,-0.5229 -1.062,-0.31635 0.002,-0.5773 -0.539,-0.33045 2.093,-0.21561 0.589,0.83723 0.179,-1.90921 0.874,-0.0675 0.563,0.81809 -0.836,0.84932 0.119,1.21806 -0.921,0.73749 0.45,0.95007 -1.218,0.61054 0.255,0.63271 0.685,0.2287 1.045,-0.33146 0,0 0.319,0.21459 -0.057,-0.39594 0,0 0.827,-0.36472 0.385,1.08206 1.289,-0.15617 -0.152,-0.50576 1.4,0.0474 1.173,1.39236 0.607,-1.53643 0.786,0.54909 -0.305,0.12795 0.59,-0.12292 -0.228,-1.41553 1.254,-1.68353 -0.333,-0.85939 0.49,-1.44072 0.78,0.0403 0.173,1.15157 -0.035,-1.09515 0.355,-0.20654 1.283,1.14351 0.816,-0.24281 0.17,0.537 -0.784,0.0615 1.734,0.76066 0.5,-0.7385 -0.727,-0.70222 0.472,-0.35263 0.612,0.2015 -0.316,-1.00548 1.19,-0.2015 0.322,0.63674 0.779,0.19948 -0.562,0.53901 0.19,0.83824 0.325,-0.51987 0.318,0.44935 -0.798,0.54304 0.221,0.44128 1.137,-0.43927 0.486,0.83219 1.057,-0.11384 1.189,0.89264 0.841,-0.21359 1.188,0.61457 0.259,-0.38889 0.284,1.82055 -0.327,0.8876 1.313,1.43165 0.957,-0.46445 2.247,1.35105 0.988,0 0.765,-0.74555 -0.355,0.45942 0.638,0.53498 -0.421,-0.0191 -0.345,0.98735 0.856,0.25187 -0.299,-0.54002 0.488,0.007 -0.039,-0.35364 0.364,0.29218 0.111,-0.49367 -0.287,2.44922 0.484,0.0816 0.216,-0.46748 0.692,0.37882 -0.052,1.29866 0.75,-0.23172 1.662,0.59845 -0.158,-1.98477 0.643,-0.51785 0.346,0.65386 1.457,-0.0101 0.226,0.60953 2.694,-1.11832 0.795,0.57025 -0.016,0.72539 1.415,-0.0322 -0.056,1.05788 0.759,10e-4 0.093,1.08608 -1.146,0.25792 -0.701,-0.33952 0.065,0.98835 0.438,0.31233 -0.616,2.64065 1.118,0.27907 0.075,1.8548 -0.298,1.29564 -0.48,0.29621 -0.138,1.93742 -1.037,-0.44733 -0.282,0.54405 1.068,1.24123 1.211,0.0665 -0.508,1.29765 1.158,0.37278 0.219,0.96619 0,0 -1.249,0.93596 -1.917,0.33046 -0.094,1.17776 -1.383,0.77175 -1.227,-0.0282 0.359,0.6861 -0.592,0.2277 -1.177,-0.62264 -2.758,0.17732 -1.527,-0.41811 -0.61,0.34356 -0.563,-0.57428 0.097,-0.48259 -0.869,0.75764 -2.449,-0.0141 -0.935,-0.97627 -1.047,0.23576 -0.717,-0.46144 -1.33,1.11631 -1.471,0.28512 -1.331,-0.65487 0.082,-0.42517 -1.285,-1.52837 -1.069,0.42718 -0.253,1.22209 0.672,0.52491 0.191,1.36818 0.72,0.39292 0.277,0.74656 -0.925,1.3984 -0.625,-0.0151 -0.221,1.39539 -0.69,0.26094 0.154,0.77073 0.599,0.10176 0.028,0.99742 0.443,0.37781 0.551,-0.94301 0.807,0.1884 0.899,-1.00851 1.436,0.49468 0.472,0.78887 1.867,-0.47453 1.251,2.72025 0.835,-0.23677 -0.031,0.81205 0.653,0.22971 1.105,-0.45237 0.259,0.95511 0.564,-0.13702 1.006,0.83219 0.075,0.93294 -0.984,1.29866 0.18,1.95959 -0.736,0.86644 -1.021,-0.29721 -0.901,0.83723 -1.8,0.0524 -0.411,0.83925 0.456,1.91021 -1.68,0.95914 -0.076,0.54908 -1.821,0.39595 -0.178,0.89164 0.49,1.53945 -0.789,0.91279 0.338,1.42964 -0.465,0.35363 -0.368,-0.63976 -0.333,0.60349 -1.057,0.40099 -0.164,1.43165 -0.526,0.10579 -0.163,0.57427 -2.025,-0.0222 -0.821,1.05988 -0.875,-0.0151 0.209,0.60349 -0.494,-0.27001 -0.583,0.86141 -0.373,-1.45281 -1.169,-0.43121 -0.397,0.96619 -0.596,-0.40199 -1.195,1.08507 -0.802,-0.8735 -1.467,1.11329 0.08,3.32575 -0.61,1.08003 -1.366,0.39696 -0.076,2.18526 -0.941,0.40904 0.688,0.40199 -0.096,0.80096 -0.747,0.0715 -0.27,-1.2372 -0.831,-0.13904 -1.362,3.57964 -0.572,0.0927 0.379,0.47856 -0.102,2.956 -0.429,1.29463 -1.428,-0.23676 -0.512,1.04175 -0.194,2.82099 0.439,2.58625 -1.542,3.18167 0,0 -1.327,0.13501 -2.254,-1.64122 -0.778,-0.10578 -0.166,0.68107 -0.775,-0.0987 -0.3,-0.69618 0.466,-0.69316 -0.852,-1.86487 -2.31,-2.23766 -1.508,-0.31635 -1.534,0.61256 -1.075,1.1828 -1.466,0.44834 -1.197,-0.49871 -0.43,0.72942 -1.23,-0.14608 -2.605,-1.61401 -1.783,1.02361 -2.32,0.29218 -1.006,-2.93081 -1.524,-0.3899 -0.441,0.38083 -0.956,-0.0977 -2.519,-1.01656 -0.184,1.64927 -1.509,-0.21963 -1.25,1.3843 -1.645,-0.0524 -0.316,-0.3889 -1.7,0.59443 0.306,0.72338 -0.49,0.12292 0.758,0.9279 -0.184,0.59342 -0.755,-0.29722 -0.334,0.35162 -1.993,-0.0937 -0.26,0.49468 -0.539,-0.60147 -0.559,0.65789 -2.824,-0.50072 -0.383,-0.64984 -1.214,-0.28713 -1.643,0.60248 -0.157,-2.25982 -0.901,-0.3768 -0.389,0.91078 -0.506,-0.27706 -0.684,0.4312 -0.795,-0.51583 0.065,0.53296 -1.848,0.27001 -0.243,1.3571 -4.827,2.5137 -1.191,0.20755 -1.727,-0.7788 -0.124,0.48461 -0.911,0.11385 -0.336,0.47251 -0.599,0.12695 -0.296,-0.85537 -0.5,0.57629 -0.34,-0.49267 -1.035,-0.004 0.068,0.59745 -0.426,0.0564 -2.039,-0.29822 -0.371,-1.78327 -0.649,-0.36068 -0.447,-1.35509 0.849,-0.52994 2.292,0.6045 0.84,-0.29318 -0.756,-0.44834 0.007,-1.45281 -0.611,-1.66841 -1.396,-1.58984 -3.961,0.19647 -0.065,0.86947 -1.226,0.14306 -0.36,0.53901 -0.752,-0.75058 -0.287,0.31232 -1.788,-0.21359 -3.584,2.7545 -1.025,-0.32039 -0.39,0.49469 -0.8,-0.10075 -0.157,1.29362 -0.521,0.39494 0.604,0.7385 -0.159,0.52692 -3.342,2.95902 0.765,1.18582 -0.79,2.01902 -2.846,-0.0766 -0.726,1.82559 -1.598,0.84327 -1.981,0.0453 -0.411,-0.43423 -1.873,0.22467 -1.228,-1.79838 1.107,-0.13702 0.123,-0.39393 -0.593,-1.12135 0.31,-0.47251 -1.267,-2.58423 -0.969,0.47856 -1.751,-0.92992 -1.688,-0.12695 -4.494,0.43424 -1.351,-0.33046 -1.272,0.50677 -1.669,-0.48864 -1.465,0.25288 -0.775,-0.45639 -1.245,0.31434 -0.048,-0.59342 -1.67,0.1068 -2.192,-1.09717 -1.202,-2.37366 -3.262,-1.47296 -2.32,0.4433 -4.86,-1.612 -0.137,-0.8201 -0.861,-0.1884 -0.158,-1.81652 0.498,-2.29508 -0.713,-1.03369 -0.937,-0.3768 -0.055,-1.25232 -1.208,0.14407 -0.705,0.9269 -1.1,0.26497 -0.259,0.71633 -1.865,0.22971 -1.143,-0.64279 0,0 0.164,-0.73245 -1.175,-0.65688 1.738,-1.60898 -0.546,-0.42717 -0.511,0.1753 -0.156,-2.6074 -0.984,-0.20452 0.331,-0.49267 -0.679,-0.95309 0.268,-1.68857 0.837,-0.25892 0.467,0.89163 1.189,0.23475 0.329,-1.03571 0.424,0.20654 0.648,-0.941 0.758,0.12593 -0.841,-0.87652 -1.034,-0.0907 -0.289,-0.92388 -0.086,0.76469 -0.537,0.27203 -0.352,-0.55715 -0.445,0.81406 -0.412,-1.06694 -0.528,0.0504 0.15,-0.97324 -0.886,0.40199 -0.173,-0.39897 0.672,-0.96518 1.812,0.75965 2.345,-2.89252 2.488,0.0282 0.395,-1.98175 1.588,-2.90864 -0.575,-1.48908 -1.069,0.56117 -0.803,-0.76771 -0.427,-0.72036 0.611,-0.34859 -1.006,-1.88402 0,0 1.432,-1.12336 2.535,0.52894 0.7,-0.98735 1.305,-0.29016 1.279,-1.29161 0.971,0.15415 0.631,-0.39696 0.002,-0.4705 -1.062,0.22064 0.567,-0.4443 -0.439,-0.67704 -1.149,0.28411 -1.557,-0.93999 -0.386,0.42012 -0.736,-1.05585 1.098,-1.11933 0.068,-1.02362 0.825,-0.8876 0.865,-0.0695 0.962,-0.89869 0.69,0.0736 1.075,-1.0881 0.375,0.32039 0.89,-0.46043 1.269,-1.57371 0.705,-0.17027 -0.672,-1.20093 0.689,-1.19187 -0.73,-3.18672 0.328,-1.41855 1.5,-2.15705 -2.341,-4.22343 0.517,-0.46446 -0.242,-0.64379 -0.515,-0.43725 -2.447,-0.0453 0.646,-0.78584 0.07,-1.26139 1.489,-2.20541 -0.834,0.12392 -0.03,-0.67301 -0.793,0.17934 -1.403,-0.63473 0.938,-1.00649 -0.184,-0.97324 0.882,-0.3224 -0.139,-0.59946 0.704,-0.80599 -0.875,-0.37076 0.503,-2.49154 1.958,3.2391 1.047,-0.11687 0.404,-0.93294 0.789,-0.17631 -0.135,-1.02161 0.562,-0.001 -0.276,-1.00045 -1.886,0.20553 -1.223,-0.59845 -0.203,0.47151 0.147,-1.39942 -0.676,-1.74095 0.476,-1.05888 0.437,0.86342 0.366,-0.29519 0.592,0.49367 0.149,0.84529 2.581,0.75361 0.271,-0.52491 1.309,-0.16422 -0.066,-1.76513 1.019,-0.60853 -0.11,-1.24527 3.903,0.0615 0.125,0.40904 -0.682,0.43121 0.388,1.00448 -0.495,1.44978 -0.795,-1.76513 -0.2,0.34255 0.56,0.89667 -0.662,0.77376 1.043,0.46748 0.308,-0.40602 2.056,-0.13199 -0.149,0.66697 -2.331,1.16869 -0.561,-0.9279 -1.079,-0.13098 0.472,-0.84428 -0.555,0.13098 -0.319,-0.46144 -0.144,0.59443 1.059,1.0891 -0.952,0.62969 -0.438,0.96618 0.658,1.05485 1.053,-0.23777 3.865,0.91078 2.722,-0.67905 0.658,0.79088 3.063,-1.76312 1.656,0.806 -0.243,1.34703 0.453,0.42516 -0.432,0.91682 0.214,0.40804 0.525,-0.39796 1.129,0.95611 -0.226,0.44531 0.386,0.43222 -0.711,0.54808 0.434,0.39595 -0.059,0.83622 -1.292,0.85738 -1.175,-1.29564 -0.888,1.07802 0.137,0.43927 -0.594,0.0937 0.231,1.31983 0.569,0.85738 0.965,0.16623 0.328,1.31277 -1.117,0.58737 -0.628,1.8679 0.686,0.0141 0.279,0.67099 0.967,-0.0363 -0.042,0.82514 -1.134,0.30729 -0.368,1.47296 -1.29,0.66293 -0.654,-1.48001 -0.721,0.77375 -1.065,0.18236 -0.354,-0.70726 -1.101,-0.59745 -1.038,1.56162 -0.173,1.37524 2.179,1.39538 0.326,0.42315 -0.421,0.35665 0.554,0.58636 1.45,-0.0363 0.684,0.94705 0.062,-1.344 0.637,0.005 0.236,-0.89768 -0.649,-0.43423 0.088,-0.6176 0.993,0.32139 0.571,0.82917 0.359,-0.46949 1.391,-0.48763 0.376,0.25288 2.035,-1.10925 -0.327,-2.12179 1.816,-1.15459 1.837,-0.45136 -0.28,-2.32329 0.694,-1.0891 -0.24,-0.95612 0.889,-1.06391 0.434,0.47352 -0.242,0.60148 0.438,1.56464 1.406,0.0252 0.924,-0.8725 1.833,1.06291 0.192,-0.44934 0.62,0.23374 0.35,-0.3355 1.287,1.56263 1.011,-0.39695 -0.292,-0.46245 0.661,-0.66998 -0.195,-0.45136 0.543,0.17027 0.049,-0.47554 1.604,-0.51181 0.2,0.83421 -0.593,1.27347 0.564,0.50577 1.128,-0.0151 0.965,1.18884 1.149,-0.42718 0.92,0.18035 0.339,-1.32386 0.593,-0.404 -1.471,-1.49009 -0.712,-1.55658 0.233,-3.00335 -0.769,-1.50419 1.081,-0.34558 0.28,0.55514 0.697,-0.42114 0.037,1.28758 1.061,0.61861 0.757,-0.39293 0.638,-1.17272 0.384,0.0524 0.301,-1.00045 -0.11,-1.67345 -0.686,-1.57976 -1.145,-0.48057 -0.424,-0.77981 -0.886,0.43121 -1.3,-0.0826 -0.957,-1.60494 0.63,-0.47151 1.986,-0.22165 0.468,-0.53297 -0.734,-0.34758 0.147,-0.66697 -0.621,-0.0675 -0.771,-2.0966 2.917,-1.612 1.749,0.50879 0.779,-0.25792 1.154,-1.03369 1.94,-0.12795 0.849,0.81909 2.003,-0.68107 -0.163,-1.73491 0.571,-0.11284 -0.243,-0.77073 -1.188,-1.05485 0.464,-1.12437 -0.741,-0.12392 0.522,-2.0291 -1.174,-0.54405 -0.467,0.29822 -1.313,1.16366 -0.316,1.43972 -2.714,-0.65589 -1.074,0.89567 -1.37,0.0907 -0.354,0.50577 -1.018,-1.09112 -1.051,-0.1884 -1.526,0.42516 -0.07,-0.55715 -1.794,-0.2156 -1.644,-1.00951 -0.284,-0.98634 -0.516,-0.25389 -0.921,-2.03313 -0.199,-3.32474 -0.692,-0.51685 0.097,-0.53699 1.01,-0.36875 -0.027,-1.49109 1.327,-1.77622 0.709,0.0776 0.409,-0.88559 1.826,0.14709 0.608,-0.45538 -0.136,-0.45842 1.055,-0.26295 0.71,-1.36012 -0.206,-0.42718 1.201,-1.48807 2.057,-0.9128 1.02,-1.15761 1.192,-0.20956 0.677,-1.10119 1.655,0.0131 1.818,-1.36113 0.936,-1.44273 2.047,-0.18135 -0.099,-0.98231 1.992,-0.18739 3.032,-2.18829 0.968,0.0957 0.636,-0.96115 1.437,-0.22366 0.155,-1.05687 1.235,-0.47956 0.318,-0.98433 1.116,-0.0665 0.928,-0.88257 1.958,0.46042 0.071,-1.29362 0.564,-0.38789 -0.34,-0.99641 1.597,0.12996 -0.318,-0.83521 z", labelX: 295, labelY: 224, color: '#F43F5E' },
      { id: "mh", name: "Maharashtra", d: "m 124.757,365.77277 1.144,0.64279 1.865,-0.22971 0.258,-0.71633 1.101,-0.26598 0.705,-0.9269 1.208,-0.14407 0.055,1.25232 0.937,0.3768 0.713,1.03269 -0.499,2.29507 0.159,1.81652 0.861,0.18941 0.136,0.8191 4.861,1.613 2.319,-0.4433 3.263,1.47296 1.201,2.37366 2.193,1.09717 1.67,-0.1068 0.047,0.59443 1.245,-0.31535 0.775,0.4564 1.465,-0.25289 1.669,0.48864 1.272,-0.50677 1.35,0.32945 4.494,-0.43423 1.688,0.12694 1.751,0.92992 0.969,-0.47856 1.267,2.58322 -0.31,0.47353 0.592,1.12034 -0.123,0.39493 -1.107,0.13702 1.228,1.79839 1.874,-0.22568 0.411,0.43523 1.98,-0.0453 1.598,-0.84328 0.726,-1.82659 2.847,0.0766 0.79,-2.01902 -0.765,-1.18583 3.342,-2.96002 0.16,-0.52592 -0.604,-0.73849 0.521,-0.39494 0.157,-1.29363 0.8,0.10075 0.39,-0.49468 1.025,0.32039 3.584,-2.7545 1.789,0.2146 0.287,-0.31334 0.752,0.75059 0.36,-0.53901 1.226,-0.14307 0.064,-0.86947 3.961,-0.19646 1.396,1.58983 0.61,1.66842 -0.007,1.45281 0.756,0.44733 -0.84,0.29318 -2.292,-0.6045 -0.849,0.52894 0.447,1.35609 0.649,0.35967 0.371,1.78428 2.039,0.29822 0.426,-0.0564 -0.068,-0.59845 1.034,0.004 0.34,0.49266 0.5,-0.57629 0.296,0.85638 0.599,-0.12695 0.336,-0.47352 0.911,-0.11284 0.124,-0.48461 1.727,0.7788 1.191,-0.20755 4.827,-2.5137 0.243,-1.3571 1.849,-0.27102 -0.065,-0.53195 0.795,0.51583 0.684,-0.4312 0.506,0.27605 0.388,-0.91078 0.901,0.37681 0.157,2.25981 1.643,-0.60248 1.213,0.28713 0.384,0.64984 2.824,0.50073 0.559,-0.6579 0.539,0.60248 0.26,-0.49468 1.993,0.0937 0.333,-0.35162 0.755,0.29722 0.184,-0.59342 -0.758,-0.9279 0.49,-0.12292 -0.306,-0.72338 1.7,-0.59543 0.316,0.3899 1.644,0.0524 1.25,-1.3843 1.509,0.21963 0.184,-1.64927 2.519,1.01656 0.957,0.0977 0.441,-0.38083 1.523,0.39091 1.006,2.9298 2.32,-0.29218 1.782,-1.02361 2.605,1.61501 1.229,0.14609 0.431,-0.72943 1.196,0.49871 1.466,-0.44833 1.075,-1.1828 1.534,-0.61256 1.508,0.31635 2.311,2.23765 0.852,1.86488 -0.465,0.69316 0.299,0.69517 0.775,0.0997 0.166,-0.68107 0.779,0.10478 2.253,1.64122 1.327,-0.13501 0,0 0.344,0.73145 -0.788,1.08205 -3.726,1.73994 -0.502,1.70167 0.294,1.35911 -0.494,0.60853 0.666,1.73995 1.806,-0.0403 0.077,3.78113 0.724,1.83163 -1.518,0.65084 -0.544,0.84126 0.634,0.71633 1.16,-0.61155 1.151,0.19143 -0.76,4.66169 0.665,1.3853 -1.585,0.59947 -0.653,0.83219 -2.677,0.62364 0.649,1.15056 -0.585,0.61256 0.164,0.41912 2.181,0.11384 0.887,0.64984 0.121,0.98533 -0.013,1.75204 -0.527,1.25635 -0.835,0.0685 -0.77,-0.55513 -0.783,0.44934 0.029,0.59241 1.57,0.15616 0.311,0.672 -1.378,1.3037 -0.714,-0.13299 -0.06,0.48259 1.209,0.0373 0.537,0.4564 -0.187,-1.16467 1.534,0.11989 -0.058,0.99541 2.641,1.83465 -0.188,1.78025 1.342,0.0866 0.951,0.89164 1.281,0.12594 0.372,0.74454 0.705,0.22567 0.272,1.18684 -2.18,0.86644 1.194,1.46289 -2.005,1.64726 -1.27,0.0715 -0.349,-0.9541 -1.293,0.42919 -0.886,-2.08249 -1.931,1.46288 -0.808,1.64424 -1.124,0.48662 0.07,1.11227 -1.294,1.05385 -0.057,1.479 -1.139,1.94145 -0.001,1.29765 1.692,2.32329 -1.506,1.30874 -0.72,0.11284 0.531,0.92488 0,0 -1.374,0.45338 -0.271,0.4836 -0.646,-0.45036 -0.99,0.43827 -2.061,-2.00492 -1.682,-0.39091 -0.795,-1.02866 0.942,-0.62162 -0.094,-3.60785 -0.385,-0.56923 -1.183,0.28209 -0.032,-1.54147 1.783,-1.47497 -0.482,-1.23822 0.871,-1.57874 0.235,-2.29911 -0.687,-1.4115 -2.344,-1.612 -0.896,-1.25937 -0.944,-0.21258 -2.106,0.62565 -0.872,1.58379 -0.954,-0.36169 -0.206,-0.63271 -1.512,1.13545 -2.123,-1.64021 -1.146,0.12695 -0.198,-0.54808 -1.276,-0.49871 -0.151,1.90719 -0.624,0.78182 0.337,0.53095 -0.945,0.15717 -1.568,-1.49613 -1.769,-0.26598 -0.534,-0.49166 -0.802,0.22769 0.544,-0.7395 -0.243,-1.42762 -1.11,-0.41207 -1.196,0.25389 -0.276,-2.27191 -1.272,-0.45438 -1.432,0.26699 -2.361,-1.12941 -1.62,-0.0937 -0.677,0.63573 -0.371,-0.51786 -1.644,-0.44632 -0.283,-0.9541 -1.003,-0.0887 -0.35,-0.72036 -0.531,1.46994 0.939,0.23072 0.602,1.29564 -0.47,1.50218 -1.245,0.53196 -0.337,0.5914 0.864,1.31277 0.003,0.72136 -0.671,0.30225 0.624,2.26385 -2.653,0.99238 0.313,1.77823 -0.567,2.11978 -1.838,-0.40905 -0.651,0.28815 -0.113,-0.64581 -2.027,-1.56464 -1.843,0.86947 0.022,0.39998 0.917,0.37479 -0.803,0.26597 -0.436,1.29363 0.248,0.35968 -0.572,1.00044 0.357,1.01153 -0.952,-0.26397 -0.115,1.12336 -0.743,-0.23777 -0.09,0.74253 0.208,1.04578 1.042,-0.0212 -0.093,0.73044 0.859,-0.0635 -0.277,0.90775 0.86,0.0615 1.276,1.91021 -2.2,0.32845 -1.068,2.73031 -0.603,-0.50878 -0.519,0.68913 0.076,2.68094 -1.652,0.60954 -0.183,-0.56319 -1.079,0.11284 0.079,1.62106 -0.513,-0.21157 -0.635,0.45035 0.817,0.39695 -1.241,0.39897 0.613,0.21057 -0.748,1.51427 0.993,0.69215 -0.355,0.58737 0,0 -0.847,-0.33953 0.015,0.62465 -0.938,0.40804 -0.607,-1.02866 -1.624,-0.0917 1.074,-1.7198 -0.845,-0.269 -0.002,-1.03772 -0.577,0.38385 -0.517,-0.51986 -1.616,0.99742 0.101,0.84126 -1.039,1.27851 0.226,0.76771 -0.746,-0.0645 -0.43,1.41957 -1.14,0.47453 0.279,0.93496 -1.072,0.008 -0.52,-0.69316 -0.186,0.46546 -0.755,-0.56923 -0.707,0.0796 -0.661,1.51628 0.957,0.41912 -0.445,0.51584 0.16,0.75159 -0.773,0.14206 -0.026,2.60337 -2.379,1.03067 -1.3,-0.65387 -0.067,0.90272 1.061,0.67301 -0.532,0.86745 -0.985,0.11385 0.249,0.98735 -0.617,0.24079 -0.159,1.01455 -0.573,-0.1743 -1.02,-1.77017 -0.863,1.45483 0.001,-1.27348 -1.038,0.0242 -0.001,0.96115 -0.781,0.0373 0.062,1.16265 -1.268,0.35766 -0.273,0.88458 -1.758,0.20553 0.175,1.14956 0.546,0.44733 -0.474,0.61155 0.661,0.0191 -0.926,0.54304 0.06,0.80197 0.827,-0.0464 -0.234,1.3037 0.964,0.12594 -0.552,1.2634 -0.61,0.0333 -0.181,-0.86343 -1.418,0.42618 -0.659,-0.96922 -1.508,0.56823 0.072,1.13243 -0.264,-0.96015 -0.877,-0.55916 -0.889,0.79693 -0.506,-0.53196 -2.583,0.66294 -0.785,-0.64883 -0.134,-1.39841 -0.529,0.69215 -0.779,-0.81405 -0.469,1.15761 -1.367,-1.13646 -0.96,0.20352 -0.285,-0.99642 -0.878,-0.4302 -0.414,1.88201 -0.78,0.19646 0.131,0.72741 0.592,0.16422 -0.15,0.85738 1.129,0.91884 0.047,1.16568 -0.714,0.83722 1.057,1.6664 -0.002,0.68712 -0.725,0.57931 0.596,0.0151 0.049,1.65431 -0.619,0.20251 -0.719,-0.40703 -0.024,-0.73447 -0.706,-0.10276 -0.114,0.9672 -1.629,0.45438 -0.515,-0.92992 -0.772,0.47957 -0.759,-0.28311 -1.035,0.52289 -1.19,-0.0494 -0.119,1.76514 -1.401,0.74252 -0.684,-0.0373 0.135,-0.69014 -1.016,0 -1.062,-1.64625 -1.225,0.50375 -0.034,-0.3486 -1.924,0.0121 -0.238,0.33752 0.842,0.44329 -0.066,0.60249 -1.091,0.48057 0.248,1.88302 -1.441,-0.0192 -3.282,1.21706 -0.043,0.88055 -0.746,0.8191 0.625,0.72439 -0.996,-0.0504 -0.135,0.67805 -1.304,0.51987 -0.474,-1.77622 -1.118,0.14407 -0.432,-0.74655 -0.104,1.2241 -1.444,0.57126 -0.284,1.11026 -0.572,-0.23676 0.063,-0.39998 -0.758,0.0786 -0.32,1.12336 -0.79,-0.92891 0.196,0.9007 -0.683,0.18639 0.327,0.41207 0.652,-0.58133 -0.075,0.95309 0.891,0.14911 0.079,1.12941 0.554,0.135 -0.156,0.64581 -0.389,-0.56622 -0.369,0.24886 -0.051,1.1828 0.538,0.73446 -0.312,0.51181 0.407,-0.51987 1.422,0.24583 0.027,0.50476 1.688,0.57629 0.205,0.93495 -0.567,0.8997 0.068,1.30269 -1.141,-0.50879 -1.391,1.25837 0.458,0.38889 0.968,-0.47151 0.711,0.35364 -1.641,3.03861 0.412,1.05888 -0.379,0.0181 -0.404,-0.86745 -0.62,0.86141 0.938,0.17228 -0.512,1.53442 -1.521,0.74857 -0.881,-0.0413 -0.476,-0.96821 -0.48,0.70223 -1.544,0.77275 0.063,0.8604 -0.776,0.16422 0.617,0.44733 0,0 -2.054,0.9944 -0.611,-0.14306 -0.616,-0.72238 -0.5,-2.11675 -1.317,-0.17127 -0.355,-1.0478 -0.68,1.30068 -3.2,0.29116 0,0 -0.663,-0.46445 0.546,-0.18135 -1.762,-3.44967 -1.686,-0.54506 -0.558,-2.15 -0.582,-0.39896 0.256,-0.36976 -0.669,-2.78774 -0.983,-3.54941 -0.436,-0.0423 0.785,-0.90271 -0.831,0.16422 -0.018,-0.92287 -1.018,-1.61602 0.029,-0.93597 0.523,-0.21863 -0.541,-0.75864 0.483,-0.81507 -0.372,-0.0725 -0.227,-3.61792 -0.715,-1.8679 0.36,-2.0573 -0.488,-0.0121 0.267,-0.56118 -0.616,-0.33449 0.918,-1.12034 -0.674,-0.75562 -0.89,-3.37108 -0.715,-0.71331 0.687,-0.0856 0.116,0.46949 0.343,-0.56722 -0.773,-1.68957 -0.837,-0.4574 0.808,-0.74454 -0.413,-0.0615 -0.041,-1.40445 -0.977,-1.10019 0.652,-0.58535 -0.867,-1.20295 -0.273,-1.25938 0.442,-0.48259 -0.977,-2.02406 -0.262,-1.95152 -0.261,0.13501 -0.704,-1.17575 0.174,-0.8866 -1.012,-1.56263 0.273,-0.45337 -0.669,-1.24325 0.349,-1.39035 -1.186,-0.55815 0.093,-1.34904 0.61,0.0302 0.354,0.84026 1.832,0.43524 -0.279,0.77879 0.68,0.78283 -0.163,-1.75809 -0.54,-0.86443 -1.291,-0.0675 -0.877998,-1.38632 -0.774002,-0.41005 0.256,-0.6992 -0.646,-1.90316 0.692,-1.53039 -1.535,-3.42751 0.296,-2.38575 0.983,0.27102 0.512,-0.78686 0.623,0.84328 0.255,-0.43726 0.128,-1.24929 -1.302,0.33247 -0.39,-1.13343 1.042002,-0.14206 -0.384002,-0.84227 0.343002,-0.60953 0.493998,0.25288 1.11,-0.81003 -0.616,-0.0534 -0.209,-1.27549 -0.633998,0.0191 -0.151,0.67804 -0.965002,0.80701 -0.988,-0.25893 -0.366,1.74196 -0.773,0.7385 0.331,-1.12034 -0.663,-0.20251 0.477,-1.69461 0.25,0.19143 0.244,-0.46244 -0.465,-0.0736 0.227,-1.14049 -0.978,-1.60192 -0.041,-2.50463 0.436,-1.15963 -0.866,-0.99239 -0.273,-1.93338 0.744,-0.6307 0.128,-0.77275 -0.448,0.48259 -0.977,-0.76569 -0.116,-1.27348 0.529,-0.0433 -1.064,-4.37355 -0.761,-1.00951 0.023,-0.42113 0.616,-0.15213 -0.355,-1.50621 1.088,-0.88055 -0.18,-2.18829 0.628,-1.47598 0,0 1.344,0.25792 0.004,-0.52491 0.697,0.0856 -0.015,-0.91884 0.835,-0.89466 2.008,0.30125 0,0 0.34,0.91682 -0.282,0.90473 0.335,0.39192 0.591,-0.48461 -0.152,0.54808 0.892,0.95309 0.164,-0.70021 1.651,0.33046 0.97,0.70021 0.637,-1.54248 0,0 1.523,-0.61457 0.462,-1.28758 0.873,0.19445 0.309,-0.33248 0.141,0.46244 1.164,-0.30325 -0.136,-3.26026 -0.672,-0.85235 0.804,-0.54102 1.486,-2.81696 -0.396,-0.0685 -0.021,-0.90272 -0.847,-0.25792 -0.788,-1.06392 0.779,-0.49871 0.288,-1.0216 0.605,-0.15112 0.331,1.42863 0.836,-0.45741 1.442,0.84126 0.617,1.27852 0.71,0.37882 0.634,-0.35867 0.988,0.24683 1.886,-1.08406 0.148,-1.15057 -0.475,-0.59946 0.857,-0.0111 0.46,-0.79088 0.739,0.13702 0.6,-0.42114 -0.093,-2.19433 -1.048,-2.2447 0.239,-0.96619 -1.885,-0.28915 -0.182,-0.59644 -0.688,0.27303 -0.684,-1.01253 0.218,-1.31579 -1.939,0.12795 -1.5,-1.33796 0.521,-0.18437 0.486,0.97627 0.94,-0.43826 1.159,0.31232 0.104,-0.64883 1.694,-0.1078 0.201,-2.14899 1.253,0.11284 1.183,-0.78988 0.091,-2.36057 0.332,0.23173 1.671,-0.61659 0.39,-1.40646 0.875,0.76368 0.417,-0.3496 1.961,0.10175 0.135,-0.46345 0.432,0.37681 1.634,-0.74051 0.019,-1.02362 -0.479,-0.54203 -0.745,0.66696 -0.67,-0.32643 -0.624,0.42416 -0.459,-0.63875 -2.44,0.002 -4.375,1.43669 -0.76,-2.3112 -0.772,-0.60349 2.052,-0.45136 0.225,-1.24526 -1.364,-1.41251 0.288,-0.62767 -0.721,-0.73749 7.024,-2.94895 z", labelX: 180, labelY: 435, color: '#06B6D4' },
      { id: "mn", name: "Manipur", d: "m 529.358,288.95113 0.058,0.70223 0.713,0.0796 -0.12,0.72943 1.038,-0.1481 1.116,1.12436 1.775,-3.70154 0.528,0 1.904,-2.41497 -0.103,-0.77678 -0.801,-0.0202 0.102,-0.93798 2.539,-0.65487 1.534,0.27504 0.947,-0.34255 0.088,-0.57628 1.493,0.84629 0.128,0.62767 0.976,0.20956 0.448,-0.73346 0.728,0.0655 0.418,1.21303 1.505,-0.26598 0.56,0.39998 2.236,-1.11933 0.204,-1.16467 0.92,-0.672 0.656,0.1078 1.416,-1.87697 0.474,0.14811 -0.41,1.08406 0.401,0.0202 -0.826,1.34904 0.035,1.69965 1.582,1.09313 1.034,0.13803 0,0 -0.18,1.01153 -0.891,0.67099 -0.96,3.97961 3.355,1.83566 -0.072,2.57819 -0.818,1.08709 0.333,0.82816 -1.7,2.31422 -0.564,2.77868 -1.254,0.12896 -0.408,1.94144 -1.382,1.31176 -0.751,1.89511 -0.548,0.12694 0.011,1.53643 -0.808,0.49468 0.377,0.46647 -1.193,0.93194 0.034,1.06895 -1.367,2.86936 -0.364,2.83711 -1.033,2.44418 -0.527,0.0615 -0.195,1.88805 -0.813,0.22971 -0.556,-1.16567 -2.978,-1.29967 -0.98,-0.15818 -1.906,0.62565 -1.235,-1.8276 -2.854,-0.10881 -0.358,1.02564 -0.836,-0.46043 -1.015,0.97324 -0.968,-0.61356 -1.119,-2.41699 -1.289,-0.42415 -0.415,0.17228 0.071,0.84428 0,0 -1.03,0.0423 -0.689,0.63775 0.237,-0.83723 -0.388,-0.57629 -0.507,0.0302 -0.149,0.78081 -0.981,-0.11385 -0.459,-0.76066 -0.984,0.98835 -0.449,-1.32989 -0.54,0.2821 -1.618,-0.55513 0.961,-2.18829 -0.295,-1.62005 0.736,-1.44778 -0.457,-0.0786 0.059,-1.00548 -0.499,-0.29419 0,0 0.809,-0.18236 -0.071,-1.97771 0.773,-1.47699 -0.243,-0.31737 0.961,-0.2015 -0.661,-0.29217 0.614,-1.82558 -0.604,-0.80802 0.656,-0.72842 0.054,-1.56766 0.27,-0.23273 0.633,0.69416 0.93,-0.49669 -0.004,-1.04478 0.668,-0.48058 0.506,-0.96014 -0.278,-0.46345 0.469,-0.28915 -0.284,-1.56061 0.405,-0.71432 0.763,0.0383 0.652,-1.10825 1.109,-3.47788 z", labelX: 537, labelY: 301, color: '#EC4899' },
      { id: "ml", name: "Meghalaya", d: "m 453.917,283.49453 3.081,-1.34702 -2.611,-3.09101 0.856,-0.22265 0.455,-0.69618 -0.223,-1.16568 1.334,-0.52087 0.285,-0.43625 -0.36,-0.30628 2.385,-1.92633 1.337,0.39191 2.968,-0.69718 0.851,-0.83925 0.66,-0.0897 0.673,0.58637 1.019,-0.61155 1.196,1.33493 -0.458,1.44173 1.463,-1.48304 0.974,0.52189 -0.47,0.58737 0.382,0.31131 1.283,-1.21101 1.284,-0.15112 -0.144,0.98231 0.785,0.1612 0.666,-1.02362 0.564,0.32542 0.968,-0.31534 0.756,0.89667 -0.068,-0.69719 0.562,-0.10277 0.517,1.40949 1.293,-0.0202 -0.595,1.53341 1.011,-0.61961 0.617,-0.0887 -0.6,0.55312 0.28,0.19848 2.788,-0.90071 -0.346,1.92735 0.253,1.08809 0.667,0.14307 1.083,-0.54707 1.213,-2.14094 1.787,-0.37075 0.534,0.31937 1.696,-0.74252 0.09,-0.39091 -0.459,0.51785 -0.692,-0.0887 1.185,-1.2231 -0.622,0.0685 1.553,-2.62151 1.178,0.24986 0.122,1.343 -0.561,0.58132 1.218,0.806 1.065,-1.13545 0.232,-2.45426 1.842,-1.39035 1.183,0.49065 -0.118,1.06392 1.088,1.22915 1.443,-0.96922 1.293,0.19244 1.681,-0.30528 0.945,-0.78484 1.316,0.39595 1.176,-0.38789 -2.951,3.13634 0.153,0.76973 1.294,0.11082 -0.955,0.8594 -0.559,1.33796 0.159,3.28141 1.429,-1.03268 2.189,-0.20956 1.078,-0.66092 1.007,0.51584 -0.022,0.941 0.698,0.19949 0.759,1.3853 1.17,0.25389 0.312,1.19893 0.629,0.0715 1.065,-0.80902 -0.183,1.27247 -1.618,1.6261 0.643,-0.0977 0.23,1.28053 0.945,-0.43625 0.122,0.58032 0.286,-0.15717 0.929,0.97828 0.396,-0.14609 0.492,1.06795 0.499,0.0635 0.164,1.09817 -0.577,0.83119 0.832,0.69618 -2.878,0.97929 -0.948,1.37624 -2.03,-0.51786 0.383,0.93698 -1.228,-0.19647 -0.44,1.64323 -0.782,0.12191 0,0 -1.648,-0.4705 0.014,-0.60349 -2.393,-0.43423 -3.482,-2.15403 -5.973,0.50274 -0.607,-0.268 -0.186,0.66294 -0.767,-0.17531 -1.315,0.83522 -0.815,-0.53398 0.247,-0.69819 -3,0.97425 -1.136,-0.83925 -1.622,-0.0504 -1.435,-0.74353 -4.004,0.15817 -4.512,0.95914 -1.707,-0.6448 -0.966,0.68409 -0.973,-0.39997 -3.686,-0.0786 -1.347,0.70827 -2.321,-1.13545 -4.738,-0.77476 -3.013,-1.76514 -2.867,0.17027 0.275,-0.33751 -0.539,-1.74297 0.7,-2.10668 0,0 0.521,-0.29217 z", labelX: 484, labelY: 283, color: '#14B8A6' },
      { id: "mz", name: "Mizoram", d: "m 504.712,313.38193 2.631,-0.0312 0.298,2.31624 0.927,0.25389 0.104,-0.47957 0.957,-0.3496 0.4,-1.57472 1.275,-0.17127 0.266,-1.82559 1.391,-0.50979 1.56,-3.82446 1.334,3.29653 0.71,-0.50073 0.886,0.11587 0.133,-0.42517 0.505,0.40099 1.357,-0.17833 0,0 0.499,0.29419 -0.059,1.00548 0.457,0.0786 -0.736,1.44778 0.295,1.62005 -0.961,2.18829 1.618,0.55513 0.54,-0.2821 0.449,1.32989 0.984,-0.98835 0.459,0.76066 0.981,0.11385 0.149,-0.78081 0.507,-0.0302 0.388,0.57629 -0.237,0.83723 0.689,-0.63775 1.03,-0.0423 0,0 -0.062,1.52636 1.346,1.29967 0.139,3.86778 0.824,1.8145 -0.994,5.69941 0.355,1.0347 -1.013,0.7657 0.606,2.97312 -0.435,1.68756 0.412,0.26699 -2.008,3.02652 -0.932,-0.0141 -1.23,-1.22713 -1.288,0.29117 -0.078,1.06492 0.82,1.85984 -0.62,0.13501 -0.472,2.20541 -0.355,0.13399 0.282,1.5052 -0.439,0.7929 1.102,2.50968 -0.684,1.52434 0.46,0.268 0.176,1.28758 1.02,0.81506 0.371,3.76905 -1.286,0.32945 0.476,1.05283 -0.322,0.49469 -1.622,-0.72339 -0.635,0.28311 0.396,2.1641 -1.095,-0.003 -0.084,2.6749 -0.445,0.0232 -0.674,-1.06291 -0.505,0.28008 -0.435,1.613 -0.903,-2.69505 -0.484,0.0443 -2.653,-2.01902 -0.388,0.0967 -0.314,2.95095 -1.564,0.92892 -0.098,-1.8266 -0.723,-1.61804 0.36,-0.23877 0.468,0.41509 0.081,-1.1687 -1.724,-8.83071 0.005,-2.12985 -0.425,-1.82861 -0.561,-0.31031 -0.564,-1.613 -0.212,-1.64826 -0.307,0.15112 -0.24,-0.75562 -0.963,-0.3355 0.382,-2.8089 -0.583,-1.0891 -0.099,-3.00234 0.995,-0.19445 -0.749,-1.75405 0.157,-0.90474 -1.196,-2.54292 -0.482,-3.46478 -0.392,-0.10982 0.289,-1.43467 -0.56,-0.82313 0,0 -0.191,-1.97872 0.573,-0.0413 -0.251,-0.7395 0.36,-0.51383 0.591,0.12896 0.229,-1.05485 -0.412,-1.11832 0.368,-0.66696 -0.312,-1.03571 0.475,-2.57516 z", labelX: 516, labelY: 337, color: '#84CC16' },
      { id: "nl", name: "Nagaland", d: "m 565.395,248.42658 0.803,3.58065 -1.033,0.61155 0.505,0.33247 0.136,1.23016 0.623,0.25892 -0.601,1.2221 0.449,1.15156 0,0 -1.736,1.56767 -0.004,0.90775 -1.828,2.79581 0.816,0.7395 -0.029,0.67301 0.648,0.31434 -0.304,3.48997 0.446,0.57226 -0.513,1.05888 0.053,1.38329 1.364,0.68711 -1.659,2.61849 -1.46,0.77174 -0.319,0.60752 -0.126,0.86242 0.777,2.54896 -2.407,2.17922 -0.375,1.34702 -0.643,0.41912 0.335,0.6045 -1.163,0.15012 -0.772,1.51729 -2.724,0.82816 0,0 -1.034,-0.13803 -1.582,-1.09313 -0.035,-1.69965 0.826,-1.34904 -0.401,-0.0202 0.41,-1.08406 -0.474,-0.14811 -1.416,1.87697 -0.656,-0.1078 -0.92,0.672 -0.204,1.16467 -2.236,1.11933 -0.56,-0.39998 -1.505,0.26598 -0.418,-1.21303 -0.728,-0.0655 -0.448,0.73346 -0.976,-0.20956 -0.128,-0.62767 -1.493,-0.84629 -0.088,0.57628 -0.947,0.34255 -1.534,-0.27504 -2.539,0.65487 -0.102,0.93798 0.801,0.0202 0.103,0.77678 -1.904,2.41497 -0.528,0 -1.775,3.70154 -1.116,-1.12436 -1.038,0.1481 0.12,-0.72943 -0.713,-0.0796 -0.058,-0.70223 0,0 -0.463,-0.81003 0.551,-0.82816 -0.342,-1.27247 -1.381,-0.68409 -1.343,-1.92129 2.005,-1.96865 1.515,-0.58334 1.536,-2.42807 2.768,-2.04623 -0.373,-1.41755 1.343,-0.62867 0.444,-0.69115 0.53,1.31378 -0.388,1.478 0.334,0.74454 0.974,-1.12437 0.846,0.3889 0.694,-0.97325 1.33,-0.74655 -0.514,-2.04522 0.759,-1.52434 0.287,-2.35049 2.16,-3.58166 1.414,-0.41811 0.23,-2.72326 1.888,-2.30415 0.273,-0.12392 0.086,1.95455 0.474,0.4171 0.724,-1.07097 1.012,-0.55513 0.177,-1.92432 1.142,-0.49468 0.115,-0.80701 1.614,-0.96518 0.62,0.46748 0.617,-1.13343 0.506,0.48561 1.22,-0.32844 2.42,-1.72585 1.759,-2.97312 0.877,-0.46244 1.205,0.79693 0.747,-0.16825 1.856,-0.97728 z", labelX: 546, labelY: 270, color: '#38BDF8' },
      { id: "or", name: "Odisha", d: "m 391.127,392.39185 2.54,0.0151 0.198,1.23923 -1.413,0.11485 0,0 -1.86,1.34199 -0.346,-0.48159 0,0 -0.693,0.1481 0.489,0.59947 -0.945,-0.14307 1.014,-2.53587 1.016,-0.29822 z m -60.04,-39.45962 2.773,1.13343 0.366,1.58681 0.872,0.66092 1.098,-0.0433 0.894,0.82514 2.864,-0.26094 0.456,-0.68711 0.623,-0.10478 -0.02,-0.50576 1.046,-0.31837 4.547,0.11989 0.186,-0.6176 1.152,-0.10981 0.519,0.46445 0.921,-0.38285 0.361,0.57226 1.12,-0.74958 0.153,0.27606 2.258,-0.89768 0.242,2.94491 0.396,0.17027 -0.104,0.61155 0.546,-0.003 0.009,0.538 -0.92,0.41509 -0.979,3.628 -0.919,0.61759 0.471,0.1068 0.871,-0.69618 1.079,0.25489 0.49,0.74656 0.768,-0.0907 0.319,0.50274 0.034,-0.45135 0.802,0.56621 0.423,0.97022 1.447,-2.41497 0.48,-0.40502 0.735,0.12191 0.106,-0.79189 0.652,-0.0917 3.039,1.63013 1.078,0.27504 1.12,-0.35867 0.772,0.94 2.523,-1.40546 0.601,0.76671 -0.896,-0.005 -0.568,1.97872 3.028,0.52289 0.143,-0.86342 0.636,-0.32341 1.211,-2.03313 0.55,-1.72685 -1.191,-1.3168 1.538,-1.42359 -0.729,-0.0856 0.251,-0.44128 -0.576,-0.19848 0.594,-0.83622 -0.262,-1.11731 -1.156,-0.71734 0.33,-0.9944 1.104,-0.47151 0.345,-0.97727 1.441,1.78629 3.611,0.89365 1.526,2.26989 1.688,0.9944 0.105,-0.49468 1.288,-0.39897 0.68,0.96921 0.965,0.009 0.261,0.52188 1.144,0.30528 0.116,0.63774 1.5,0.40602 0,0 -0.153,1.6251 1.567,-0.23677 0.872,1.33191 2.622,0.26598 1.264,0.95108 0.35,1.17877 -0.762,1.84775 0.676,0.95309 1.349,0.11184 -0.023,-1.075 1.356,-0.51181 0.191,-0.96921 1.41,0.4302 0.577,3.17462 1.878,0.63573 0.377,0.57931 1.539,-0.0191 -0.015,0.71935 0.584,0.49368 -0.255,1.40445 0.489,0.81808 0,0 -2.136,1.4236 -3.749,-0.0655 -1.821,0.90473 -2.779,2.19635 -1.861,2.12682 -1.46,2.75551 0.018,1.24929 3.071,7.10386 -0.263,0.83522 -1.593,-0.28613 -1.123,0.57931 -1.133,2.83308 0.981,0.12795 -0.502,-0.58233 0.67,-0.15012 0,0 0.346,0.48159 1.86,-1.34199 0,0 1.384,0.34557 0.945,-0.31736 -5.458,3.88995 -1.151,2.9298 1.053,0.2962 0.023,1.02563 -2.111,1.84372 -2.646,1.19187 -2.972,3.87685 -0.477,1.32083 -0.978,-0.20452 -1.083,-1.66439 -0.893,0.1743 -0.234,0.58535 1.221,0.0574 1.45,1.57673 -14.666,4.78259 -5.821,2.96104 -5.134,3.6028 -1.582,1.77219 -3.184,2.32933 -1.86,1.91223 -1.314,2.26586 -0.878,-0.54404 0,0 -0.527,-0.52491 0.173,-0.70122 -0.776,-0.12392 -0.08,0.77376 -1.452,-0.0443 0.586,1.05082 0.72,-0.10075 0.007,0.63774 -0.875,-0.0564 -0.524,0.92791 -0.451,-1.15459 -1.605,0.97828 -0.372,0.88055 -1.184,-0.72439 0.534,1.04074 -0.524,0.63976 0.289,0.54002 -0.661,0.61054 -0.681,-0.22467 0.468,0.41106 -0.758,-0.12191 0.421,0.35464 -0.191,0.35766 -0.552,-0.34758 -0.079,1.65532 -3.787,0.35967 -0.594,0.60853 -0.862,0.0786 -1.146,-1.27348 -1.827,0.12392 -1.457,-0.4836 -1.74,-4.20932 -0.994,0.66394 0.848,1.56666 -0.717,-0.23072 -0.838,-1.48606 0.365,-0.5914 -0.548,-0.10276 -1.544,-3.04264 -0.607,0.73849 0.212,0.71331 -0.537,0.85134 -0.677,-0.53297 -0.315,1.5183 -0.752,-0.12594 -0.039,-0.34859 0.421,0.0443 -0.173,-0.8866 -0.246,0.25893 -0.427,-0.54708 -0.29,0.17934 0.389,1.075 -0.07,0.46345 -0.546,0.0151 0.146,1.19691 -0.977,-1.12034 -1.309,-0.30426 -0.859,0.44732 0.496,1.61301 0.351,-0.88962 0.722,0.74857 -0.703,-0.0796 1.354,1.49614 -0.314,0.63472 -0.783,-0.0282 -0.055,0.70626 -1.606,0.23172 -0.281,0.72238 -0.978,-0.19445 -0.3,1.10522 -0.07,-0.58334 -1.439,-0.66898 -1.716,2.61849 -0.825,0.33449 -0.074,1.11933 0.962,0.0433 -0.567,0.41005 0.117,0.44229 1.19,0.22064 -1.548,2.06739 0.462,0.56319 0.436,-0.22367 -0.102,1.18784 -0.759,-0.2025 -1.769,0.73144 -0.854,-0.34255 -0.151,-1.01354 -0.831,0.0655 -0.958,-0.65387 -0.48,0.43524 0.357,0.54707 -0.549,1.40949 -2.266,0.98331 -0.668,1.27751 -0.966,-0.91279 -0.09,-0.81104 0.729,-0.87551 -0.226,-0.49065 -1.368,-0.46043 0.389,-1.06291 -0.494,0.0736 -0.147,-1.53845 -0.502,0.0484 -0.526,-0.77678 -2.36,2.80588 0.485,0.90171 -1.047,1.14754 1.227,0.23575 -0.443,0.71432 -0.732,0.1743 -0.085,1.11328 -0.559,0.4433 1.236,1.23519 -0.159,0.32139 -0.507,-0.38184 -0.075,2.24873 -0.508,0.0584 -0.16,-0.53297 -0.648,0.30225 0.006,1.36415 -0.535,0.1471 -1.346,-0.68006 -0.357,-0.72842 -2.84,-0.31535 -1.526,1.44979 -3.155,1.23418 -0.895,0.94201 0,0 -1.154,0.71029 -0.312,-0.52189 -0.528,0.17329 -1.086,1.35609 -0.888,-0.27504 -1.833,0.5511 -0.456,-0.48159 -1.559,0.39897 0,0 0.186,-1.72987 0.909,0.20251 0.839,-2.07242 -0.072,-1.2896 0.728,-1.40848 0.292,-1.43165 -0.373,-0.58435 0.485,-1.66136 1.37,-0.93194 1.366,-0.21661 -0.012,-0.62263 1.817,-0.134 0.36,-1.45583 2.006,-2.24874 0.814,-0.33952 0.247,-0.7919 0.802,0.11284 0.16,-0.60953 -1.385,-0.75865 -0.063,-0.64983 1.299,0.47654 0.424,-1.36717 1.382,-0.62364 0.939,0.1481 0.06,-0.9682 0.998,-0.0403 0.671,-0.73648 0.243,-2.31221 1.398,-0.3355 -0.303,-2.30817 -0.648,-1.01254 0.377,-0.673 -0.259,-0.59745 -0.837,-0.19948 0.398,-0.71835 -0.566,-2.36762 0.658,-1.20396 -0.886,-0.93798 0.535,-0.0897 0.349,-1.14855 -1.334,-0.14004 -0.57,-1.91122 -1.458,0.17933 0.497,-0.81909 -0.179,-3.67938 0.466,-1.76312 -1.668,-0.2821 -0.414,-1.31479 -2.318,-1.18884 -0.258,-0.93697 0.612,-1.91828 1.566,-1.478 1.739,2.05832 0.701,-0.88962 2.524,1.60293 1.092,-0.44632 2.278,3.74889 1.033,-1.15459 1.121,-0.47352 3.164,0.85839 -0.466,0.93999 0.289,1.14452 1.27,-1.21101 1.193,-0.12594 0.31,-0.8866 -0.355,-0.50173 0.146,-2.16209 -1.585,-0.21964 -0.699,0.3214 -4.344,-1.65028 -0.25,-1.89813 0.726,-1.28758 -0.178,-1.36919 0.506,-0.43423 -0.743,-1.17474 0.741,-2.01902 -0.4,-1.06392 -0.46,0.46546 -0.159,-1.28254 -1.182,-0.98634 0.925,-1.5727 -0.693,-3.01343 0.24,-2.81192 1.147,0.48158 0.295,0.80701 0.911,0.0594 0.557,-1.78629 1.408,-0.85335 1.452,-2.1359 -0.271,-0.77678 0.746,-0.68912 -0.19,-1.06997 2.435,-0.23172 0.766,0.46043 0.495,-0.43423 1.398,0.21358 1.607,-0.59442 1.77,1.27247 1.659,0.40098 1.471,-0.77476 0.592,-2.80286 1.177,-0.57326 -0.429,-0.60148 0.333,-1.41049 2.193,0.78987 0.583,-0.19041 -0.186,-1.14956 -0.911,-1.00346 -0.327,-1.16064 0.965,-2.64267 1.267,-0.82413 0.241,0.9944 0.666,-0.45942 -1.356,-1.11429 1.348,-1.50218 -0.354,-0.92992 0.497,-0.71834 0.954,0.46546 -0.111,-0.85839 1.115,-0.26497 -0.271,-0.63774 0.606,-0.88056 -0.987,-0.48259 -0.381,-0.70827 0.067,-2.07846 1.297,-0.22971 -0.861,-0.86746 1.813,-2.73434 0.989,-0.47353 1.252,0.0605 2.266,-2.28802 2.997,-0.54204 0.782,-2.18727 -1.371,-0.86444 0.084,-0.44934 0.461,0.0262 z", labelX: 340, labelY: 405, color: '#A855F7' },
      { id: "py", name: "Puducherry", d: "m 244.187,609.61625 -0.793,-0.007 -0.091,-1.13847 -1.719,-0.64077 -0.486,-1.16063 0.877,0.18134 -0.285,-0.93193 1.078,0.42113 0.377,-0.40299 1.112,0.21761 0,0 -0.07,3.46176 z m -1.064,-21.25415 -0.39,-0.68308 -0.62,0.33851 -0.049,-0.77275 -0.963,0.47655 -0.937,-0.58636 0.499,-0.83623 0.681,0.63674 0.199,-0.35464 -0.395,-0.79592 -0.583,-0.16825 0.437,-0.75965 -1.144,-0.30528 0.725,-0.70625 0.561,0.89768 0.604,-0.3627 0.375,0.31736 -0.772,0.25792 0.444,1.2896 1.277,-1.20698 0.832,0.49266 0,0 -0.781,2.83107 z m 51.438,-105.59475 -1.737,-0.7667 0.901,-0.58133 0.058,0.73144 1.262,-0.0977 0.272,-0.4433 0.122,0.62767 0,0 0,0 0,0 -0.002,0.007 0,0 -1.057,0.0977 0.181,0.42516 z", labelX: 268, labelY: 546, color: '#F97316' },
      { id: "pb", name: "Punjab", d: "m 160.899,114.5252 -0.451,1.70066 1.7,2.26586 -1.849,0.93193 -2.25,2.62151 -2.383,0.97022 -0.049,1.22814 0.871,0.50777 -1.739,2.05731 0.414,0.38789 1.064,-0.27605 0.847,0.38788 1.977,1.66237 2.308,1.1022 1.611,3.34389 -1.039,-0.0655 1.694,4.21033 3.156,5.7256 -0.387,1.28456 0.654,0.49972 0.137,0.85234 2.58,-0.30628 -0.002,-0.5652 0.852,-0.26497 -0.436,-1.21404 0.907,-0.32542 0.083,-0.63271 0.337,1.23419 1.445,2.09257 -0.359,0.56923 0.746,-0.672 0.457,0.90373 0.538,-0.23777 0.08,0.50979 0.399,-0.53095 -0.046,0.70223 0.744,-0.60853 0.651,0.71734 -0.44,0.84831 0.95,-0.26397 0.198,0.34658 -0.943,0.73951 -0.023,1.35206 0.763,0.42818 -0.56,1.38934 0.232,1.20799 2.146,0.99843 1.199,1.39538 0,0 -0.017,0.73044 1.229,1.075 0.399,0.97828 -0.39,0.70122 0,0 -0.734,-0.0665 0.063,-0.46949 -0.562,0.21359 -0.208,-0.53801 -1.438,0.95209 0.746,1.56565 1.425,0.64883 0.533,-0.403 0,0 0.314,0.73345 0.574,-0.57326 -0.076,0.94302 1.148,0.99742 -0.595,1.44576 0.739,0.54505 -0.658,0.81507 -0.002,1.05888 0.806,1.2765 -0.985,0.70424 0,-0.64581 -1.001,-1.15963 -0.502,0.53599 -1.059,-0.65689 -1.208,1.1012 0.234,0.69215 0.569,0.13399 -0.489,0.64984 -0.849,0.16926 -1.356,1.34501 -1.302,0.13802 -0.316,0.91783 1.077,-0.7133 0.587,0.62061 -0.162,0.38386 0.725,0.22366 -0.256,2.43412 -0.537,0.61658 -0.508,0.12393 -0.458,-0.57327 -1.126,0.537 -0.215,-0.49771 -0.811,-0.0866 -0.877,-2.46535 -0.611,0.46245 0.432,0.61961 -0.244,0.73245 -1.342,-0.52692 0.483,0.52389 -0.545,0.47151 -1.502,-0.26195 -0.99,-0.9682 0.169,0.57931 -0.447,0.002 1.348,0.73749 -1.185,1.61603 0.357,0.26195 -0.513,0.25993 0.271,1.75103 -0.787,0.37479 0.384,0.96921 1.201,0.47352 -2.629,1.75708 -0.811,-0.22669 -0.879,1.42863 -0.378,-0.22668 -1.104,0.59643 -1.792,-0.37982 -1.052,-1.57774 -0.69,0.12593 -0.512,-0.44128 -1.375,0.40502 -0.177,1.29161 -1.509,-0.43524 -0.254,0.64782 -0.931,0.0917 -0.259,-0.56118 -0.935,0.14005 -1.412,-1.1556 -1.371,2.33336 -0.909,0.42214 0.316,0.83522 -0.685,-0.27606 -0.778,1.46289 0.501,0.52188 -0.176,0.49166 -1.52,0.52894 -0.047,-1.45684 -1.003,-0.56723 -0.324,-0.78887 0.784,-0.60449 -0.033,-0.90474 0.78,-0.64882 -1.018,-2.09459 -0.564,0.4564 -0.028,0.93798 -1.337,-0.62062 0.354,-0.47957 -0.541,-0.55312 0.481,-0.57629 -0.407,-1.01454 -0.404,0.87249 -1.582,0.54707 -1.553,-2.2437 -0.638,0.24382 -0.079,-0.70928 -0.667,0.22366 -1.014,-0.81103 -1.616,0.74454 -0.695,-0.17934 -1.066,1.13344 0.149,0.43121 -2.678,-0.93698 0,0 -13.144,-0.64681 0.077,-1.86084 1.504,-1.80242 -0.008,-1.79233 0,0 -0.177,-1.61905 -1.813,-2.59834 0.673,-1.17272 0.512,-0.10075 0.156,-1.02261 0.573,0.12997 0.44,-1.04579 1.053,-0.86947 0.913,0.16725 -0.203,-0.62163 0.518,-0.49871 -0.034,-0.91279 0.374,0.17329 0.198,-0.64581 0.682,-0.0111 1.7,-2.1228 1.04,-0.25892 -0.411,-0.92287 0.737,-0.35968 -0.244,-0.41105 0.636,-1.17273 0.981,0.0433 0.053,-0.96921 1.059,-0.50375 1.14,-1.46691 1.414,-0.67402 0.424,-1.81249 1.343,0.50174 1.04,-0.35565 0.465,-0.83018 -0.358,-0.86241 -0.966,0.2287 -0.203,-0.38587 -0.609,0.0897 -0.145,0.93496 -0.702,0.23575 -0.178,-0.88458 -0.813,-0.41206 0.137,-3.28344 0.853,-0.64177 1.888,-3.97055 -0.327,-0.65789 -1.269,-0.36975 0.796,-0.79693 -0.062,-0.83119 -1.751,-3.82244 0.017,-0.5501 0.706,-0.19847 0.096,-1.8669 0.92,-1.41251 0.467,0.11486 0.78,-0.91179 0.908,-0.16523 0.124,-0.81708 0.56,0.50879 0.247,-0.36774 1.286,-0.0715 0.193,-1.04679 0.978,-0.65487 0.153,-0.6589 1.121,-0.37479 1.653,0.9138 2.33,-1.33897 1.009,0.36774 0.647,-1.20597 0.917,0.73144 2.595,-3.65822 0.081,-0.8463 -0.935,-1.70267 0,0 1.94,0.32441 1.198,-0.39191 -0.094,0.55916 0.471,0.18236 0.231,0.84831 0.585,-1.80947 3.817,-1.72181 0.72,-1.44676 1.222,-0.26598 z", labelX: 151, labelY: 152, color: '#EAB308' },
      { id: "rj", name: "Rajasthan", d: "m 120.995,173.07186 0.008,1.79233 -1.504,1.80242 -0.077,1.86084 13.144,0.64681 0,0 -0.293,0.86242 0.599,0.12392 0.416,0.89466 -1.848,1.88906 0.141,1.05283 1.127,0.0645 1.273,-0.65689 0.393,0.37782 -0.814,4.57302 1.002,0.87753 -0.743,1.65129 -0.756,-0.19142 -0.287,0.41005 0.046,0.5914 0.555,0.15314 0.815,1.36012 -0.02,0.81506 0.964,-0.0695 0.175,-0.99037 2.228,0.39393 1.769,-1.15761 1.801,0.94906 0.543,1.99081 0.794,0.24482 1.023,-0.37076 0.799,1.3158 0.631,0.13702 1.502,-1.0075 0.911,0.81003 2.005,-1.40647 -0.09,1.38229 0.635,0.23575 0.266,-0.68409 0.789,-0.17631 0.104,1.75606 -0.827,1.11228 0.734,0.34054 -0.326,1.39538 1.039,0.134 0.093,1.1566 1.599,0.13803 0.113,0.84932 -1.035,1.17877 0.969,2.14798 -0.31,1.17172 0.636,0.89466 0.561,3.24515 1.305,0.2962 0.231,1.343 3.122,2.10969 -0.166,1.19288 2.489,0.33348 0.694,0.5904 0.676,1.20093 1.341,0.89466 -0.158,0.93395 0.876,0.4171 -0.166,0.50778 1.001,1.13545 -0.583,0.2549 0.027,-0.55413 -0.808,-0.11787 -1.918,1.88502 0.962,0.31636 0.052,0.70021 0.651,-0.90574 0.418,0.35363 -0.634,0.46244 0.099,0.42315 -0.839,0.13702 0.43,0.49367 -0.714,0.21762 0.638,0.3889 -0.497,1.13343 -0.516,-0.3365 -0.312,0.42818 0.11,0.38688 1.016,0.17833 -0.3,1.05787 1.813,0.39998 0.804,-0.48864 1.776,1.44676 1.054,-0.7939 -0.632,-0.54506 0.116,-0.8332 -0.674,-0.38083 0.273,-1.37221 -0.513,-0.62163 1.233,-0.77678 -0.765,-0.65588 1.545,-0.27706 0.646,0.28512 0.318,0.78383 0.923,-0.23978 0.279,-0.90675 -1.197,-0.63875 1.218,-0.65185 -1.602,-1.19691 1.19,0.0332 0.855,0.93496 1.972,-0.39696 0.562,1.14553 -0.772,-0.12594 -0.258,0.44531 1.027,0.67603 -0.919,0.35867 1.774,0.25087 -0.006,1.62912 1.272,-0.93395 1.279,-0.21862 -0.185,-1.84775 2.936,-1.43871 0.206,-1.29363 1.029,-0.35866 2.329,1.96764 -0.903,3.47989 0.01,1.72887 0.413,0.13802 -0.255,2.01298 -0.479,0.0373 -0.412,2.41295 0.638,0.71331 -0.704,0.0343 0.454,0.96719 0.661,-0.39191 0.76,0.42516 0.482,-2.00391 1.794,0.0776 -0.249,-0.60047 -0.977,-0.34053 0.369,-0.9944 1.847,1.03369 0.522,-0.36472 -0.017,-0.56319 0.629,0.16423 -0.251,0.56319 0.526,-0.87854 0.794,0.85738 0.644,-0.71835 0.278,0.22568 0,0 0.593,0.44028 -0.136,1.64323 0.815,0.53296 0.121,1.02362 -0.652,0.97828 0.815,0.43221 -0.413,0.52793 0.099,0.97224 0.99,0.31937 0.293,0.91582 0.694,0.37277 -0.301,0.86645 0.35,0.61961 1.368,0.42113 1.618,1.29061 0.828,-0.39393 -0.47,1.01152 1.1,1.45584 -0.098,0.50979 0.701,0.39897 -0.385,0.58435 -1.036,0.16724 -0.3,1.06996 -1.934,0.6579 0.481,0.6589 0.927,-0.25489 -0.173,0.96921 1.465,0.50375 0.962,-0.84932 0.633,1.20698 0.392,-0.001 0.087,-0.73447 0.598,0.20654 -0.391,0.81406 -1.83,0.33852 -4.741,2.5127 0.351,1.12537 -0.222,1.15258 0.747,0.0131 -0.335,0.53599 0.943,-0.47554 -0.259,-0.48964 0.356,-1.41352 0.475,0.60954 1.755,-0.25288 2.33,-1.1415 0.065,-0.82514 0.722,-0.50173 2.862,1.13545 0.205,-0.82514 0.88,0.58233 1.355,-0.2549 0.321,1.17071 0.54,-0.32844 -0.117,-0.95511 1.24,0.24583 0.207,-1.13545 1.966,0.33752 0.223,-0.35464 0.969,0.71633 -0.746,0.96115 -0.742,-0.14004 0.391,1.23519 0,0 -1.023,0.21258 0.318,0.83521 -1.597,-0.12996 0.34,0.99641 -0.564,0.38789 -0.071,1.29362 -1.958,-0.46042 -0.928,0.88257 -1.116,0.0665 -0.318,0.98433 -1.235,0.47956 -0.155,1.05687 -1.437,0.22366 -0.636,0.96115 -0.968,-0.0957 -3.032,2.18829 -1.992,0.18739 0.099,0.98231 -2.047,0.18135 -0.936,1.44273 -1.818,1.36113 -1.655,-0.0131 -0.677,1.10119 -1.192,0.20956 -1.02,1.15761 -2.057,0.9128 -1.201,1.48807 0.206,0.42718 -0.71,1.36012 -1.055,0.26295 0.136,0.45842 -0.608,0.45538 -1.826,-0.14709 -0.409,0.88559 -0.709,-0.0776 -1.327,1.77622 0.027,1.49109 -1.01,0.36875 -0.097,0.53699 0.692,0.51685 0.199,3.32474 0.921,2.03313 0.516,0.25389 0.284,0.98634 1.644,1.00951 1.794,0.2156 0.07,0.55715 1.526,-0.42516 1.051,0.1884 1.018,1.09112 0.354,-0.50577 1.37,-0.0907 1.074,-0.89567 2.714,0.65589 0.316,-1.43972 1.313,-1.16366 0.467,-0.29822 1.174,0.54405 -0.522,2.0291 0.741,0.12392 -0.464,1.12437 1.188,1.05485 0.243,0.77073 -0.571,0.11284 0.163,1.73491 -2.003,0.68107 -0.849,-0.81909 -1.94,0.12795 -1.154,1.03369 -0.779,0.25792 -1.749,-0.50879 -2.917,1.612 0.771,2.0966 0.621,0.0675 -0.147,0.66697 0.734,0.34758 -0.468,0.53297 -1.986,0.22165 -0.63,0.47151 0.957,1.60494 1.3,0.0826 0.886,-0.43121 0.424,0.77981 1.145,0.48057 0.686,1.57976 0.11,1.67345 -0.301,1.00045 -0.384,-0.0524 -0.638,1.17272 -0.757,0.39293 -1.061,-0.61861 -0.037,-1.28758 -0.697,0.42114 -0.28,-0.55514 -1.081,0.34558 0.769,1.50419 -0.233,3.00335 0.712,1.55658 1.471,1.49009 -0.593,0.404 -0.339,1.32386 -0.92,-0.18035 -1.149,0.42718 -0.965,-1.18884 -1.128,0.0151 -0.564,-0.50577 0.593,-1.27347 -0.2,-0.83421 -1.604,0.51181 -0.049,0.47554 -0.543,-0.17027 0.195,0.45136 -0.661,0.66998 0.292,0.46245 -1.011,0.39695 -1.287,-1.56263 -0.35,0.3355 -0.62,-0.23374 -0.192,0.44934 -1.833,-1.06291 -0.924,0.8725 -1.406,-0.0252 -0.438,-1.56464 0.242,-0.60148 -0.434,-0.47352 -0.889,1.06391 0.24,0.95612 -0.694,1.0891 0.28,2.32329 -1.837,0.45136 -1.816,1.15459 0.327,2.12179 -2.035,1.10925 -0.376,-0.25288 -1.391,0.48763 -0.359,0.46949 -0.571,-0.82917 -0.993,-0.32139 -0.088,0.6176 0.649,0.43423 -0.236,0.89768 -0.637,-0.005 -0.062,1.344 -0.684,-0.94705 -1.45,0.0363 -0.554,-0.58636 0.421,-0.35665 -0.326,-0.42315 -2.179,-1.39538 0.173,-1.37524 1.038,-1.56162 1.101,0.59745 0.354,0.70726 1.065,-0.18236 0.721,-0.77375 0.654,1.48001 1.29,-0.66293 0.368,-1.47296 1.134,-0.30729 0.042,-0.82514 -0.967,0.0363 -0.279,-0.67099 -0.686,-0.0141 0.628,-1.8679 1.117,-0.58737 -0.328,-1.31277 -0.965,-0.16623 -0.569,-0.85738 -0.231,-1.31983 0.594,-0.0937 -0.137,-0.43927 0.888,-1.07802 1.175,1.29564 1.292,-0.85738 0.059,-0.83622 -0.434,-0.39595 0.711,-0.54808 -0.386,-0.43222 0.226,-0.44531 -1.129,-0.95611 -0.525,0.39796 -0.214,-0.40804 0.432,-0.91682 -0.453,-0.42516 0.243,-1.34703 -1.656,-0.806 -3.063,1.76312 -0.658,-0.79088 -2.722,0.67905 -3.865,-0.91078 -1.053,0.23777 -0.658,-1.05485 0.438,-0.96618 0.952,-0.62969 -1.059,-1.0891 0.144,-0.59443 0.319,0.46144 0.555,-0.13098 -0.472,0.84428 1.079,0.13098 0.561,0.9279 2.331,-1.16869 0.149,-0.66697 -2.056,0.13199 -0.308,0.40602 -1.043,-0.46748 0.662,-0.77376 -0.56,-0.89667 0.2,-0.34255 0.795,1.76513 0.495,-1.44978 -0.388,-1.00448 0.682,-0.43121 -0.125,-0.40904 -3.903,-0.0615 0.11,1.24527 -1.019,0.60853 0.066,1.76513 -1.309,0.16422 -0.271,0.52491 -2.581,-0.75361 -0.149,-0.84529 -0.592,-0.49367 -0.366,0.29519 -0.437,-0.86342 -0.476,1.05888 0.676,1.74095 -0.147,1.39942 0.203,-0.47151 1.223,0.59845 1.886,-0.20553 0.276,1.00045 -0.562,10e-4 0.135,1.02161 -0.789,0.17631 -0.404,0.93294 -1.047,0.11687 -1.958,-3.2391 -0.503,2.49154 0.875,0.37076 -0.704,0.80599 0.139,0.59946 -0.882,0.3224 0.184,0.97324 -0.938,1.00649 1.403,0.63473 0.793,-0.17934 0.03,0.67301 0.834,-0.12392 -1.489,2.20541 -0.07,1.26139 -0.646,0.78584 2.447,0.0453 0.515,0.43725 0.242,0.64379 -0.517,0.46446 2.341,4.22343 -1.5,2.15705 -0.328,1.41855 0.73,3.18672 -0.689,1.19187 0.672,1.20093 -0.705,0.17027 -1.269,1.57371 -0.89,0.46043 -0.375,-0.32039 -1.075,1.0881 -0.69,-0.0736 -0.962,0.89869 -0.865,0.0695 -0.825,0.8876 -0.068,1.02362 -1.098,1.11933 0.736,1.05585 0.386,-0.42012 1.557,0.93999 1.149,-0.28411 0.439,0.67704 -0.567,0.4443 1.062,-0.22064 -0.002,0.4705 -0.631,0.39696 -0.971,-0.15415 -1.279,1.29161 -1.305,0.29016 -0.7,0.98735 -2.535,-0.52894 -1.432,1.12336 0,0 -0.842,-0.73648 0.118,-0.54002 -0.882,-1.5858 -0.806,-0.0866 -0.514,0.90775 -1.172,-0.60651 0.142,-2.06739 -0.672,-0.60147 -1.198,-0.007 -0.247,-0.82816 -0.877,-0.1209 -0.413,-0.90271 -0.497,0.0826 -0.176,0.73346 -0.934,0.0987 -1.301,-2.50463 -1.027,0.27806 -0.384,-0.54807 -0.808,1.04981 -0.459,-0.98634 -1.067,0.3496 -0.428,-0.27303 0.537,-1.1818 -0.446,-1.00548 0.495,-1.71274 -1.748,-0.74253 -1.335,0.88257 -0.104,-1.98175 -0.612,-0.12896 -1.231,-1.61098 -0.933,0.29015 -0.277,-0.47654 -0.012,-1.7067 1.31,-1.58782 -0.411,-1.36415 0.182,-1.39034 -0.923,-0.84832 0.08,-0.92286 -0.802,0.30023 -0.056,0.95108 -0.868,1.06392 -0.946,0.38284 -0.982,-0.93596 0.521,-1.07399 -2.295,-0.92791 -0.659,-1.06593 1.303,-2.82603 0.747,0.14609 0.258,-0.96821 0.379,0.21561 0.427,-0.70122 -0.428,-0.24684 -0.859,0.56924 -1.779,-1.0085 0.489,-0.73346 -0.292,-1.57774 -0.907,0.68006 -0.801,-0.39494 -0.261,0.27102 -0.774998,2.00189 0.588998,0.45539 -1.414,0.86645 -1.168,-0.90876 -2.838,0.10478 -0.818,-1.33594 0.079,-0.87451 -2.276,-0.35263 -0.919,-0.79189 -0.922,1.3037 0.15,0.93093 -0.901,0.0635 -0.586,-1.23015 0.121,-1.0075 0,0 -1.088,0.12493 -0.682,-1.23721 0,0 -1.315,0.32442 -0.923,-0.96216 0.591,-0.4574 0.979,0.30325 0.581,-0.72137 -0.81,0.21359 -1.781,-0.55412 -0.405,0.46849 -0.947,-0.0443 -1.685,-0.88257 0.007,-1.02261 -0.686,-0.20251 -2.267,1.82458 -0.504,-0.93697 -0.913,-0.18034 -0.379,1.63819 -0.976,-0.40703 -0.267,-1.12336 -2.877,0.85939 -0.941,-0.86342 -2.686,-0.0736 -2.203,1.20396 -0.671,-0.72741 -1.115,1.05182 -3.99,-1.68554 0,0 -3.384,-5.86565 -1.071,-4.85009 -2.677,-2.80285 -0.465,-1.29967 -1.466,-1.58681 0.286,-2.97313 -0.458,-4.18413 -1.025,-0.21963 -1.691,0.69618 -2.859,0.30124 -2.513,-0.87249 -3.842,-5.66415 -0.283,-3.02249 1.886,-4.00178 0.236,-5.66012 -0.339,-1.49815 -2.125,-1.13948 -3.912,0.42819 -1.339,-0.25993 -1.957,-1.44778 -4.485,-2.22153 -0.501,-1.3571 0.617,-4.95587 1.359,-3.50206 5.942,-5.60068 1.555,-2.34847 1.675,-1.2755 1.916,-4.99416 1.029,-1.59386 4.38,-4.13577 2.461,-0.61256 1.651,0.33751 2.292,2.50665 0.132,1.78629 1.659,2.8885 2.649,0.44531 8.138,-3.40232 2.863,-0.56621 5.203,-0.0756 5.005,-2.09962 0.752,-4.02898 1.31,-1.90518 3.947,-3.59878 2.46,-7.32551 1.732,-2.37165 6.837,-4.0985 4.824,-2.21145 1.221,-2.88447 1.867,-2.4462 3.812,-7.41417 2.513,-9.20651 4.601,-2.04824 3.685,-1.06593 z", labelX: 112, labelY: 249, color: '#3B82F6' },
      { id: "sk", name: "Sikkim", d: "m 428.276,223.43058 0.449,0.59543 1.766,0.0181 1.713,1.46792 0.07,1.89007 0.523,0.2025 0.512,1.47498 -0.658,1.06291 -0.16,3.49904 -1.665,2.46131 0.885,3.77811 2.366,1.86287 -0.486,1.21302 -2.052,0.64581 -0.271,1.45684 -0.764,0.8866 0,0 -0.569,0.2287 -0.84,-0.98332 -0.585,0.42013 -0.783,-0.59946 -1.257,-0.0212 -0.8,0.24885 0.192,0.66092 -2.051,1.61502 -2.264,-0.54808 -0.405,-0.55916 -1.506,0.20855 -0.772,-0.38789 -1.235,0.45539 -1.064,-0.58032 -0.228,-1.39941 -1.213,-0.42416 0,0 1.092,-2.7555 -0.517,-0.83018 0.104,-0.81506 0.695,-0.50073 -0.759,-1.6402 3.215,-6.97994 -0.507,-0.70424 0.591,-0.40502 -0.106,-0.38486 -1.443,-0.66495 -0.127,-1.64726 0.317,-0.29922 1.038,0.4705 0.86,-0.57629 0.298,0.46143 2.12,-0.97324 0.933,0.27102 1.953,-1.60394 1.169,0.15919 0.325,-1.09213 1.298,-0.44834 -0.097,-0.61658 z", labelX: 425, labelY: 235, color: '#10B981' },
      { id: "tn", name: "Tamil Nadu", d: "m 232.906,641.22647 0.477,0.35867 -0.431,0.6186 0.239,0.43726 2.384,2.20037 -2.954,-1.881 -1.762,-0.15314 -0.215,-0.49568 0.337,-0.31334 0.988,-0.0232 0.937,-0.74857 z m -22.853,-73.11506 0.137,0.80398 -0.782,0.72742 1.561,-0.22669 0.545,0.83622 1.63,0.88257 1.911,-0.11989 -0.041,-0.96317 0.647,-0.0222 0.102,-0.86241 0.358,0.0363 0.114,-0.0373 0.176,0.51281 0.487,-0.12694 -0.044,-1.25333 0.762,-0.57729 0.916,-3.18974 0.439,0.004 -0.691,-1.28657 0.784,-0.83925 0.893,0.29117 0.182,-1.11328 0.912,0.23071 2.722,-0.87753 0.123,1.42964 0.895,0.0232 -0.653,-0.35463 0.438,-0.70223 1.365,-0.1884 1.873,1.34098 1.751,0.14709 0.758,-1.66338 0.615,-0.41508 0.001,-0.68107 1.027,-0.12191 0.849,0.95309 0.976,-0.70625 -0.142,-0.71633 1.591,-0.52491 -0.045,-0.45337 0.5,-0.17732 -0.197,-0.28109 -0.529,0.38083 0.297,-1.49009 -1.056,-0.46748 1.136,-0.44229 2.238,0.27001 0.271,0.94604 0.66,0.46849 1.848,-0.78686 0.1,1.12941 0.476,-0.0957 -0.153,0.57025 0.714,-0.31132 0.451,0.57931 0.848,-0.61457 -1.332,-1.04981 0.687,-0.6579 0.538,0.44632 0.429,-0.47957 1.065,0.0191 1.556,-0.70021 0.587,-0.82111 -0.441,-0.65085 0.644,-0.29217 -0.029,-0.71935 0.702,-0.17632 0.22,-0.60953 0.631,0.0705 -0.069,-0.37378 -0.891,-0.17833 0.083,-0.42113 1.577,-0.17228 1.73,1.26642 1.638,0.0433 0.956,1.89007 0.756,0.42516 -0.001,-1.1425 0,0 0.687,3.21392 -0.959,2.88144 -0.924,7.65899 -2.047,6.72907 -5.699,8.68463 -0.988,2.66382 0,0 -0.832,-0.49267 -1.277,1.20698 -0.444,-1.28959 0.772,-0.25792 -0.375,-0.31736 -0.604,0.36269 -0.561,-0.89768 -0.725,0.70626 0,0 0,0 0,0 1.144,0.30527 -0.437,0.75965 0.583,0.16826 0.395,0.79592 -0.199,0.35464 -0.681,-0.63674 -0.499,0.83622 0.937,0.58637 0.963,-0.47655 0.049,0.77275 0.62,-0.33852 0.39,0.68308 0,0 -0.907,5.23496 1.698,4.46623 0.343,8.09121 0,0 -1.112,-0.21762 -0.377,0.403 -1.078,-0.42113 0.285,0.93193 -0.877,-0.18135 0.486,1.16064 1.719,0.64076 0.091,1.13848 0.793,0.007 0,0 0.587,11.02403 -0.913,0.44934 -1.942,0.006 -7.478,-0.88761 -1.901,1.1949 -1.378,2.47844 -0.012,1.11227 0.814,1.15258 -2.35,2.24571 -0.697,1.65431 -2.675,3.10712 -1.244,2.14295 -0.762,2.70815 0.861,1.57069 2.599,2.24672 2.657,0.39997 -2.023,0.46043 -2.902,-0.26598 -1.715,0.3365 -3.047,1.01455 -0.192,0.39494 -1.268,-0.0473 -0.326,0.39595 0.314,0.34254 -1.657,0.56017 -3.506,0.41207 -4.221,3.23608 -0.844,1.63718 -0.238,2.34445 0.622,-0.10579 0.901,0.58939 -1.273,0.0997 -1.349,1.96059 -0.175,1.49009 0.884,-0.15919 -0.174,1.94245 -1.367,1.63618 -0.325,0.83521 0.366,0.20553 -5.506,2.5933 -1.198,1.50016 -3.582,0.88156 -0.518,1.25132 -4.919,-0.94 -4.595,-3.7489 0,0 0.533,-0.52692 0.79,0.22165 -0.52,-1.39941 1.563,-1.25333 -0.481,-1.17877 1.278,-0.16926 0.369,-0.76469 -2.299,-4.24055 0.444,0.0544 0.798,-0.86342 0.593,-1.77118 -0.801,-1.23318 -0.508,0.0353 -0.005,-0.66293 -1.005,-1.37523 1.045,-0.5239 0.288,-1.1022 1.17,-1.15762 -0.317,-0.76771 0.632,-0.62968 0,-1.74197 0.362,-0.77577 0.569,-0.0101 0.48,-2.19131 0.928,-0.41811 0.37,-0.97324 -0.957,-0.6317 -0.202,-1.46087 -0.337,0.67703 -0.429,-0.63371 -1.032,0.59644 -1.237,-0.8332 -0.922,-0.0393 0.796,-2.32832 0.383,-0.13098 0.033,-1.23821 0.506,-0.18336 -0.524,-0.55312 0.309,-0.73346 -0.514,-0.36068 0.745,-1.63416 0.509,-0.22467 -0.229,-1.42259 -1.262,-1.53845 1.507,-0.56621 0.433,-1.87596 -0.71,-0.28411 0.084,-0.70525 -0.755,-1.10926 0.16,-0.73446 -1.239,-0.12795 -2.326,1.29463 -0.279,0.79492 -1.418,0.84125 -1.367,-0.34355 -0.904,-0.9007 0.042,-0.48965 -0.539,0.26497 -0.395,-0.37478 0.412,-1.37222 -0.67,-1.17675 0.469,-3.62598 -0.518,-0.88056 1.416,-0.0655 -0.358,-0.97727 0.879,-2.03616 -0.193,-0.62061 -1.002,-0.16624 -0.479,-1.15459 -3.525,-1.33091 1.201,-2.28802 1.799,-0.23475 -1.159,-0.10881 0.034,-1.57572 -0.996,-0.49569 0.72,-1.37423 -0.599,-0.48057 -1.547,0.97626 -2.834,-0.36572 -0.73,0.48259 -0.133,-1.07399 1.963,-1.32285 -0.042,-1.26642 -0.601,0.10579 -1.279,-0.74253 -0.795,-1.1153 -1.606,-0.53699 -0.268,0.30023 -0.897,-0.63875 -0.794,0.31837 -0.3,-2.24067 0.946,-0.60853 0.564,0.61054 1.093,-0.39393 0.626,-0.84932 0.937,-0.0191 -0.028,-0.77175 0,0 0.584,0.0897 1.106,-0.91783 0.758,0.58939 0.412,1.29161 3.897,-0.009 1.471,0.28512 0.435,0.48562 0.285,-0.58435 -0.469,-0.90473 1.49,-2.97817 1.254,0.38789 0.276,-0.76872 0.663,-0.0413 0.57,0.40804 -0.195,0.41106 0.716,-0.26598 0.316,1.11429 0.789,0.26195 -0.136,-1.07601 2.601,-0.44128 0.308,-0.39998 0.902,0.0877 0.864,0.84327 0.699,-0.42416 1.251,0.60148 0.775,-1.89309 -0.073,-1.05888 0.505,0.26901 0.157,-1.20799 3.686,-0.12292 0.607,-1.53744 1.654,-2.04925 -0.881,-1.32284 -5.457,-0.74958 0.095,-1.27851 1.518,-0.46849 1.279,-1.50318 0.34,-1.17273 0.107,-1.47699 -1.043,0.19042 0.649,-0.67402 -0.583,-0.15515 -0.177,-1.09314 0.582,-1.35407 -0.157,-0.78484 1.339,-0.35666 0.504,0.54002 0.533,-0.52994 0.578,0.20956 1.425,-2.63965 -0.306,-1.00951 2.781,-0.95813 0.35,0.48058 -0.528,0.73245 0.326,0.17833 0.435,-0.7657 0.75,1.15459 0.42,0.004 0.281,-1.08407 0.666,0.0756 1.548,1.55456 2.088,0.37177 z", labelX: 211, labelY: 609, color: '#F59E0B' },
      { id: "tg", name: "Telangana", d: "m 196.013,447.57347 0.355,-0.58737 -0.992,-0.69115 0.747,-1.51426 -0.613,-0.21057 1.241,-0.39998 -0.817,-0.39594 0.635,-0.45035 0.514,0.21157 -0.079,-1.62207 1.079,-0.11284 0.183,0.56218 1.652,-0.60953 -0.076,-2.68095 0.518,-0.68913 0.603,0.50879 1.068,-2.73032 2.201,-0.32844 -1.277,-1.91022 -0.86,-0.0615 0.277,-0.90775 -0.859,0.0625 0.093,-0.72942 -1.042,0.0211 -0.208,-1.04578 0.089,-0.74252 0.744,0.23777 0.114,-1.12336 0.952,0.26295 -0.357,-1.01052 0.572,-1.00145 -0.248,-0.35967 0.436,-1.29363 0.803,-0.26598 -0.917,-0.37479 -0.022,-0.39998 1.843,-0.87047 2.027,1.56464 0.113,0.64581 0.651,-0.28916 1.838,0.41006 0.567,-2.11978 -0.313,-1.77722 2.652,-0.99339 -0.623,-2.26385 0.671,-0.30225 -0.004,-0.72036 -0.864,-1.31277 0.337,-0.5914 1.245,-0.53196 0.47,-1.50318 -0.602,-1.29564 -0.939,-0.23072 0.532,-1.46994 0.35,0.72036 1.003,0.0876 0.282,0.95511 1.644,0.44632 0.372,0.51786 0.677,-0.63574 1.62,0.0937 2.361,1.12941 1.432,-0.26699 1.272,0.45438 0.276,2.27191 1.196,-0.25389 1.109,0.41206 0.243,1.42763 -0.544,0.74051 0.802,-0.2277 0.534,0.49166 1.769,0.26598 1.568,1.49714 0.945,-0.15818 -0.337,-0.53095 0.624,-0.78181 0.152,-1.9072 1.276,0.49871 0.197,0.54808 1.146,-0.12694 2.123,1.6402 1.512,-1.13545 0.206,0.63271 0.954,0.36169 0.872,-1.58378 2.106,-0.62566 0.944,0.21258 0.896,1.25938 2.344,1.61199 0.687,1.4115 -0.235,2.29911 -0.871,1.57875 0.482,1.23922 -1.782,1.47498 0.032,1.54147 1.183,-0.2821 0.385,0.56923 0.094,3.60785 -0.942,0.62263 0.796,1.02765 1.682,0.39091 2.061,2.00492 0.989,-0.43826 0.646,0.45136 0.271,-0.48461 1.374,-0.45337 0,0 1.556,2.91065 2.964,-0.92186 3.124,2.41598 0.379,1.02966 1.007,0.80096 -0.165,0.36875 0.744,0.2287 -0.215,0.57629 0.593,1.78226 0.911,1.06291 -1.148,0.77779 0.027,1.03973 1.326,0.1199 0.663,-1.49714 0.794,0.5924 -0.404,0.21259 0.289,1.43266 2.338,-0.78182 -0.622,1.9213 1.852,6.41876 0.861,0.0756 1.8,-1.46087 1.977,0.89164 2.741,0.1219 0,0 1.559,-0.39897 0.455,0.48159 1.833,-0.5511 0.888,0.27504 1.086,-1.35508 0.529,-0.17329 0.311,0.52088 1.154,-0.71029 0,0 0.722,0.8997 -0.218,0.45337 -4.307,2.33034 -0.114,0.84025 -1.428,2.15605 0.434,0.44329 -0.466,0.66697 -0.167,1.9898 -1.629,1.91626 -0.917,0.0967 -0.987,-0.73346 -1.204,1.55054 -1.792,-0.0494 -0.393,1.96864 -2.433,0.41106 -1.158,0.74958 -1.798,-0.47352 0.167,1.21302 -0.9,-0.008 -0.241,2.09358 -0.552,0.55211 -2.234,-0.85335 -1.803,0.20754 0.357,-0.71532 -2.02,-1.1022 -1.341,0.66092 -0.291,1.2634 -0.753,0.72943 -0.538,-0.17128 -0.533,-1.1566 -0.587,0.46042 0.454,0.93194 -0.638,0.95107 2.712,1.16669 0.074,-0.67402 1.944,0.47453 0.054,1.15258 -0.456,0.10679 -0.218,0.96921 1.037,0.81104 -0.864,0.54506 -2.228,-0.59443 -0.08,-0.55412 -1.107,-0.75361 -0.56,0.8463 -0.3,-0.96015 -0.824,-0.35161 -0.375,-1.85984 -0.82,-1.19993 -1.275,-0.0544 -0.401,-0.69819 -1.01,1.30672 -1.842,0.43927 -0.76,1.27146 -0.374,0.96418 0.867,0.23676 0.766,0.85033 -0.456,1.49915 -1.879,2.25579 -1.174,0.0927 -0.842,-1.32184 -1.08,0.16926 -0.741,-0.85436 -2.655,1.47699 -3.158,0.69014 -1.478,1.04981 -3.359,0.45942 -0.854,1.16467 -0.139,5.86766 -0.881,0.49166 -3.049,-0.62465 -2.207,0.94705 -0.42,0.44531 0.106,1.67446 -0.792,-0.10881 -0.204,-0.93697 -0.525,-0.0796 -0.028,1.51326 -1.287,1.39135 -1.284,-0.0655 -2.023,-1.57673 -1.213,0.9279 -3.212,-0.53598 -1.872,1.13041 -1.247,-0.0474 -0.391,2.22859 -1.213,0.62364 -0.322,1.12134 -0.813,0.001 -0.34,0.47453 -0.961,-0.37882 -0.574,-1.25332 -0.72,0.93395 -2.39,-0.79996 -1.852,0.66697 -1.74,-0.46345 -1.196,0.21963 -1.101,-0.76771 -2.029,-0.19848 0,0 0.014,-1.7742 -0.405,-0.6186 0.39,-1.59084 -0.475,-0.26699 -0.064,-0.93395 0.567,-1.41352 -0.459,-0.0222 -0.026,-0.55513 0.286,-0.39393 0.681,0.11284 0.654,-0.76469 0.53,0.23676 0.027,-1.10724 -2.033,-0.83622 -1.732,0.28613 -1.44,-0.37177 -1.22,-0.50879 -1.037,-1.42157 1.19,-0.12191 0.097,-0.3899 1.459,0.1612 0.267,-0.58133 0.758,-0.15616 -0.499,-1.03571 1.522,-0.41509 0.11,-1.37221 -0.763,0.20352 -0.343,-0.5511 1.014,-0.33852 0.038,-0.73749 -0.909,-0.0554 0.296,-1.50218 0.703,0.0876 -0.371,-2.84517 0.963,-2.15403 -0.77,-2.12078 -2.148,-1.26239 0.812,-1.03369 -0.386,-0.2418 1.552,-1.23217 -0.429,-0.27203 0.368,-1.80543 0.995,0.36068 0.605,-0.39594 0.157,-0.70223 -0.531,-0.50879 1.306,-0.0504 0.014,-0.54203 0.783,0.21963 0.007,-0.56521 0.617,-0.13298 0.258,-0.59947 -0.098,0.48461 0.752,0.18337 0.034,-0.72037 -1.965,-0.59442 -0.04,-0.66192 -0.867,0.29318 -0.44,-0.52289 -0.54,0.71129 -0.243,-0.55815 -1.048,-0.33349 0.218,-2.41698 2.338,-1.22713 0.082,-0.3758 -1.287,-0.40501 0.134,-0.41509 0.316,-0.55916 0.497,0.19344 0.482,-1.20698 0.502,0.0524 -0.241,-0.8322 0.656,0.11788 0.151,-1.209 0.424,0.25087 0.196,-0.50576 -0.151,-0.52592 -1.128,-0.37378 -0.974,-0.96216 1.148,-1.00649 -0.059,-1.1566 -0.7,-1.07299 0.81,-1.71073 z", labelX: 237, labelY: 457, color: '#8B5CF6' },
      { id: "tr", name: "Tripura", d: "m 502.379,307.13847 0.959,0.43221 0,0 10e-4,1.0075 0.868,1.86689 -1.249,2.99328 1.754,-0.0564 0,0 0.841,2.41295 -0.475,2.57516 0.312,1.03571 -0.368,0.66696 0.412,1.11832 -0.229,1.05485 -0.591,-0.12896 -0.36,0.51383 0.251,0.7395 -0.573,0.0413 0.191,1.97872 0,0 -0.441,0.10277 -0.49,1.53038 -0.133,-0.86644 -0.652,-0.35162 -0.13,-0.73245 -0.36,0.0645 -1.936,2.17619 -0.995,-0.30527 -0.827,-1.64323 -0.449,0.0464 -0.415,1.05082 0.687,4.56295 -0.697,0.30427 -0.001,0.72036 -0.802,-0.0877 -1.176,0.94201 -1.517,2.78976 1.268,4.16701 -0.425,0.58334 -0.768,0.0736 -1.139,1.7742 -0.538,-0.31635 -0.967,0.2428 -0.99,0.8191 -0.776,-0.37177 -1.471,-4.11965 0.281,-0.66092 -0.767,-0.15516 0.245,-0.53296 -0.55,-0.96921 -0.754,-0.007 -0.729,1.72383 0.693,2.7414 -0.928,-0.10982 -0.99,-2.13488 0.041,-2.16914 -0.542,-0.86343 0.317,-0.26497 -0.508,-0.42919 0.593,-0.94504 -0.606,0.17934 -0.898,-3.08999 -0.982,-0.64178 0.233,-0.70021 -0.388,0.008 -0.704,-1.24023 -0.096,-1.56565 0.788,0.54103 0.233,-0.92892 -1.084,-0.0836 0.045,-1.10522 0.736,-0.31736 0.608,0.30225 0.692,-2.28098 -0.526,-0.99943 0.355,-0.69014 -0.298,-0.35162 0.859,0.0544 -0.093,-0.85738 0.248,-0.44632 0.334,0.23777 0.142,-0.59342 1.502,0.49871 0.384,-1.71073 -0.387,-1.33594 3.5,0.76671 1.86,-0.60853 0.547,-1.95253 -0.254,-0.61558 0.408,-0.36975 0.364,1.40445 0.98,0.61961 0.637,-0.0232 -0.392,-2.38576 1.509,0.87955 0.668,-0.44632 -0.12,0.70323 0.974,1.39438 0.453,-0.1199 0.67,-2.88043 -0.449,-1.56867 0.768,-0.47252 0.801,0.80499 -0.446,-1.55054 3.038,0.11083 0.417,-0.93496 0.704,-0.14911 -0.426,-1.5989 0.072,-0.5521 z", labelX: 526, labelY: 294, color: '#6366F1' },
      { id: "up", name: "Uttar Pradesh", d: "m 196.287,167.98097 1.49,-0.15515 1.603,1.75405 4.62,2.2306 -1.946,3.27033 -0.533,0.54909 -0.558,-0.25087 -0.604,1.25434 0.308,0.53196 -0.883,0.941 0.311,0.48057 -0.571,0.79089 0.321,0.51987 -0.649,1.00951 1.312,2.08753 -0.146,1.68051 0.779,0.37378 -0.05,0.44834 0.763,0.30426 0.94,-0.78887 1.635,-0.0826 0.52,2.20541 -0.523,-0.0484 -0.095,0.6186 0.763,0.0574 0.09,1.01858 1.022,-0.16322 0.148,-0.97626 0.798,-0.21158 1.194,-1.79233 1.139,-0.82111 0.793,0.14407 2.101,-2.22556 1.692,0.57427 1.57,0.75059 0.832,2.82602 1.631,1.51024 3.774,2.06839 2.877,0.47856 -1.105,1.53744 -0.866,0.58234 -0.415,-0.35464 -0.422,1.2906 -0.658,-0.49367 -0.911,0.78081 1.8,1.43064 1.104,-0.0826 0.974,1.4115 0.027,1.2493 0.92,0.0242 0.376,-0.41307 1.145,1.17574 0.208,-1.30773 2.174,1.03168 0.129,1.44173 0.595,0.43322 -0.149,0.68107 0.958,-0.14911 1.986,1.82357 1.109,0.0161 0.163,-0.43322 0.363,0.80196 0.511,0.11486 0.205,1.83062 2.01,-0.17833 0.611,-0.70121 0.303,1.11832 1.311,-0.54707 1.102,0.48863 0.963,-0.77476 1.304,-0.26699 0.715,0.69417 -0.529,1.37523 0.681,-0.16422 0.18,-0.7788 0.619,0.0121 0.451,0.62163 -0.734,0.23172 1.271,0.15616 -0.258,0.39192 0.7,1.27045 0.952,0.40804 0.958,-0.51987 0.562,-1.09515 -0.31,-0.40098 0.978,-0.71532 0,0 0.993,0.0242 2.05,1.75808 0.723,-0.0605 0.118,0.68207 1.268,0.6982 0.888,1.50923 1.924,0.19646 1.392,1.84171 0.265,-0.51786 -0.561,-2.19433 1.366,-0.54001 0.897,1.16265 1.174,-0.0625 0.473,1.30874 1.626,0.51382 0.442,0.98534 1.602,0.83118 0.217,-0.4836 0.684,0.29016 0.121,0.7123 1.357,0.79693 0.8,-0.41206 0.366,0.9138 0.941,0.67905 2.739,0.57931 0.463,1.70771 1.84,2.18425 0.012,0.67704 -0.401,0.0423 0.541,0.44632 -0.208,0.35162 1.117,-0.20956 0.08,-0.82514 1.44,0.35061 0.839,1.0478 -0.117,0.84629 3.05,1.92735 1.635,0.35464 3.827,3.07185 0.862,-0.0594 0.881,-1.64121 2.084,0.12896 1.163,1.38934 1.779,0.51886 5.035,3.89599 5.426,-1.0206 0.08,1.34501 0.924,1.8548 -0.437,1.97671 4.074,0.0524 0.514,0.78182 1.673,0.45035 3.226,-0.12392 2.441,2.90058 1.139,-0.27807 1.056,-1.64222 -0.52,-0.53397 0.359,-0.52894 -0.273,-0.51986 4.726,0.23777 5.062,2.79882 0,0 -0.619,0.66697 0.538,0.27202 1.299,-0.33348 0.188,0.49972 -0.58,1.05585 1.183,0.57629 0.508,0.81607 -0.824,2.53285 1.702,-0.0584 -0.627,0.63371 1.048,0.56319 0.122,1.94749 -0.455,0.45338 0.477,0.2559 0.091,0.94403 0.796,0.34154 0.221,-0.55614 0.842,0.31132 -0.192,0.74957 0.78,0.49771 0.844,-0.85738 0.667,0.2015 0.234,1.2634 -0.579,1.21302 0.196,0.41207 0.28,0.24079 1.061,-0.56319 0.578,1.62006 1.603,0.30628 0.255,1.03369 -2.977,0.65286 -3.986,-1.0206 0.015,1.01556 -0.727,1.31579 -1.541,0.27102 -0.243,0.54707 -1.263,-0.22266 0.002,1.58983 1.667,0.36673 0.607,-0.32441 1.279,1.49814 2.079,0.24583 0.216,1.33292 -0.468,1.66439 -0.97,-0.37479 -0.704,0.95208 -1.42,-0.45539 0.139,2.23362 0.647,1.06191 0.879,0.0735 1.595,1.65935 -0.022,0.7929 0.745,-0.21157 1.979,1.2503 1.152,-0.28814 1.192,0.65285 0.314,0.90776 2.205,0.34255 -0.035,1.01152 0.618,-0.0735 1.334,1.01152 -0.412,0.7788 0.629,0.7526 -1.569,-0.1884 -0.07,1.21907 -0.437,-0.20452 0.094,-0.78384 -0.237,0.98131 -0.758,0.15112 -0.829,-0.85234 -0.982,0.34859 -0.458,-1.14552 -1.019,0.0957 -0.266,1.69159 -0.733,-0.1209 0.042,0.3627 -1.731,-0.1884 -0.18,-0.78585 -0.965,-0.64178 -1.126,0.24684 -0.518,0.57629 0.143,1.35206 -3.338,1.83767 -1.379,1.97067 -0.857,0.18135 0.589,0.67401 -0.921,0.12292 0.105,0.47856 -0.785,0.53599 -0.616,-0.52693 -0.596,0.56723 -0.197,-0.23072 -0.405,0.41106 0.288,0.16523 -0.811,0.0766 -0.583,0.89264 -1.219,0.49569 -0.517,-0.21964 -1.657,1.52334 -1.068,0.0625 -0.441,0.97929 -0.808,0.18739 -0.299,0.40703 0.461,1.32486 -0.821,2.47542 0.538,0.15818 0.212,3.23507 0.762,0.86746 -0.075,1.1294 1.389,1.17575 0.559,-0.10377 0.019,0.7395 0.69,0.56823 -0.339,0.68006 0.918,0.58838 -0.904,2.28702 0,0 -2.201,0.59543 -0.243,1.04981 0.391,1.08205 0.623,0.11183 0.45,0.8997 -1.58,1.15459 0.544,1.11832 -1.64,3.78517 0,0 -0.722,0.65285 -0.272,1.14049 -1.256,0.77779 -0.555,1.56666 -2.154,0.98533 -3.095,0.0524 -2.743,-1.99988 0,0 -0.219,-0.96619 -1.158,-0.37278 0.508,-1.29765 -1.211,-0.0665 -1.068,-1.24123 0.282,-0.54405 1.037,0.44733 0.138,-1.93742 0.48,-0.29621 0.298,-1.29564 -0.075,-1.8548 -1.118,-0.27907 0.616,-2.64065 -0.438,-0.31233 -0.065,-0.98835 0.701,0.33952 1.146,-0.25792 -0.093,-1.08608 -0.759,-0.001 0.056,-1.05788 -1.415,0.0322 0.016,-0.72539 -0.795,-0.57025 -2.694,1.11832 -0.226,-0.60953 -1.457,0.0101 -0.346,-0.65386 -0.643,0.51785 0.158,1.98477 -1.662,-0.59845 -0.75,0.23172 0.052,-1.29866 -0.692,-0.37882 -0.216,0.46748 -0.484,-0.0816 0.287,-2.44922 -0.111,0.49367 -0.364,-0.29218 0.039,0.35364 -0.488,-0.007 0.299,0.54002 -0.856,-0.25187 0.345,-0.98735 0.421,0.0191 -0.638,-0.53498 0.355,-0.45942 -0.765,0.74555 -0.988,0 -2.247,-1.35105 -0.957,0.46445 -1.313,-1.43165 0.327,-0.8876 -0.284,-1.82055 -0.259,0.38889 -1.188,-0.61457 -0.841,0.21359 -1.189,-0.89264 -1.057,0.11384 -0.486,-0.83219 -1.137,0.43927 -0.221,-0.44128 0.798,-0.54304 -0.318,-0.44935 -0.325,0.51987 -0.19,-0.83824 0.562,-0.53901 -0.779,-0.19948 -0.322,-0.63674 -1.19,0.2015 0.316,1.00548 -0.612,-0.2015 -0.472,0.35263 0.727,0.70222 -0.5,0.7385 -1.734,-0.76066 0.784,-0.0615 -0.17,-0.537 -0.816,0.24281 -1.283,-1.14351 -0.355,0.20654 0.035,1.09515 -0.173,-1.15157 -0.78,-0.0403 -0.49,1.44072 0.333,0.85939 -1.254,1.68353 0.228,1.41553 -0.59,0.12292 0.305,-0.12795 -0.786,-0.54909 -0.607,1.53643 -1.173,-1.39236 -1.4,-0.0474 0.152,0.50576 -1.289,0.15617 -0.385,-1.08206 -0.827,0.36472 0,0 0.114,0.38285 -0.376,-0.2015 0,0 -1.045,0.33146 -0.685,-0.2287 -0.255,-0.63271 1.218,-0.61054 -0.45,-0.95007 0.921,-0.73749 -0.119,-1.21806 0.836,-0.84932 -0.563,-0.81809 -0.874,0.0675 -0.179,1.90921 -0.589,-0.83723 -2.093,0.21561 0.539,0.33045 -0.002,0.5773 1.062,0.31635 -0.001,0.5229 -1.02,-0.23475 -1.123,0.40904 0.12,-0.63976 -0.481,0.17027 -1.151,-0.69417 0.65,-0.43725 -0.791,-0.74051 0.255,1.92432 -0.928,-0.44532 -0.399,0.5501 -0.71,-0.77275 -0.698,-0.0282 0.499,0.29419 -0.121,1.02462 -0.502,0.0141 -0.618,-0.86544 -1.568,0.56319 0.343,1.11127 -0.488,-0.37781 -0.884,0.52994 -1.04,-0.62666 1.766,-2.65476 1.516,-0.67804 -0.517,-1.59588 -0.44,0.12694 -1.548,-1.19186 0.14,-2.284 -1.149,-0.96216 -0.223,0.55312 -1.074,-0.26195 -0.126,0.75562 -1.352,1.04981 -0.837,-0.404 -1.31,0.29418 -0.502,1.72887 -1.134,-0.0756 -0.61,0.89264 -0.231,-0.54506 -1.157,0.38789 0.522,2.0835 -0.511,0.39192 0.173,0.80801 -2.309,-1.05082 -3.093,0.28815 0.103,-0.54002 -0.274,0.17228 -0.506,-0.70122 -1.584,2.19635 -0.614,-0.31434 0.164,-0.88257 -0.781,0.62364 -0.333,-0.73144 -0.335,0.59341 -0.32,-1.31579 0.539,-0.89264 0.693,-0.0876 -0.328,-0.29016 0.673,-1.02966 0.653,-0.0202 -0.691,-0.31434 -0.881,0.57226 -1.002,-0.81406 -0.303,0.67099 -0.464,-0.66495 0.317,-0.90473 -1.072,-0.16624 -0.724,0.69518 -0.015,0.9007 0.593,-0.43725 0.467,0.65789 0.629,-0.25187 -0.23,0.9944 0.374,0.3627 -0.301,0.31131 -1.235,-1.09615 0.109,1.17574 0.748,1.05485 -0.237,0.43021 -0.903,0.25993 -0.019,-0.72238 -0.488,-0.17832 -0.46,0.29217 0.62,0.17531 -0.107,0.5652 -0.67,0.0605 -0.451,-0.86544 -0.378,0.20352 0.262,0.57125 -1.049,0.16019 -0.447,-0.76268 0.263,-0.47453 -0.756,-0.65789 -0.863,1.26038 -0.446,-0.11587 0.059,-1.00548 0.667,-0.90775 -0.928,-0.52189 -0.149,-0.66696 -0.708,0.74353 0.492,0.25893 0.024,0.87652 -0.994,-0.56218 -1.601,1.25635 0.084,-2.08149 0.331,0.23978 0.354,-0.67099 0.671,0.27102 0.615,-0.52189 -0.36,-1.50117 -0.528,0.42214 -1.07,-0.2962 -0.727,2.6749 -0.756,-0.96921 0.126,-0.66998 -0.595,0.0514 0.182,-0.39897 1.079,-0.40703 -0.12,-0.45942 0.775,-0.82413 1.561,-0.29117 -0.381,0.53498 -0.81,0.0423 0.758,0.54606 1.044,-0.56218 -0.385,-1.45986 -0.649,0.24482 -0.542,-0.43121 0.679,-0.76973 -0.404,-0.94604 0.534,-0.2418 -0.233,-0.66394 -0.291,0.42819 -0.136,-0.41912 -0.754,0.0544 0.035,0.75966 -0.998,0.33247 0.604,0.99541 -0.479,0.806 -0.428,-0.3214 0.667,-0.18739 -0.332,-0.26296 -1.535,-0.2428 -0.518,-0.57025 -0.149,0.86847 0.636,0.68409 1.211,0.0796 -1.461,0.41106 0.445,1.26138 -1.062,0.12594 -0.097,-0.59845 -1.07,-0.2146 -0.029,-0.74555 0.264,0.37681 0.676,-0.58032 -0.327,-0.43927 -0.692,0.0876 -0.505,0.87149 -0.526,-0.24583 -0.317,0.57931 -0.57,-0.0836 0.316,1.01656 -1.069,-0.25691 0.342,0.84529 -0.343,0.46445 -0.52,0.0564 -0.169,-0.4574 -0.526,0.71532 -0.554,-0.25892 -0.277,0.35967 0.559,0.41912 0.893,-0.54002 1.505,0.81809 0.598,3.72573 0.937,0.84226 -0.416,2.23564 0.662,0.47755 0.308,0.96821 2.011,0.94805 0.337,1.07198 -0.335,0.46244 0.164,2.09761 -0.677,1.01958 0.197,1.26945 0.574,0.27404 2.195,-1.075 1.772,3.29049 -0.746,0.28713 -0.354,-0.37579 -0.11,0.78484 1.587,0.58636 -0.367,2.02003 -1.237,1.20597 -0.605,1.79839 -1.368,0.29419 -0.457,0.69114 -0.658,-1.8004 -0.301,0.44229 -0.286,-0.33449 -0.698,0.44532 -0.623,-0.24382 -1.898,-2.57717 -1.53,-0.84932 -1.478,2.21548 -1.154,0.50879 -1.123,-1.24426 0.732,-1.29262 -1.969,-1.41856 0.057,-0.66394 -1.044,-1.07399 0.82,-0.81607 0.2,-2.5127 -1.007,-1.85278 -0.238,-1.5183 -0.946,-1.01757 0.033,-0.57025 3.394,-2.72427 0.005,-2.06537 1.415,-0.9672 0.996,0.0403 -0.515,-0.57225 0.589,-0.36069 -1.279,-0.6055 0.26,-0.5239 -0.905,-0.65588 -0.197,-1.20396 -0.777,-0.30225 0.487,-0.59644 -0.749,-0.88458 0.728,-0.60853 0.362,-1.2503 0.624,0.15011 0.907,-0.67905 -0.252,-1.28456 0.432,-0.72036 0.542,0.27706 0.65,-0.70424 1.987,0.41711 0.575,-0.57629 0.837,0.54506 0.595,-0.66193 2.683,-0.70827 0.128,-1.16164 -1.351,-1.73693 1.543,-1.17172 0.037,-0.36874 -0.49,-0.0695 0.26,-0.27807 1.06,0.72137 -0.32,-1.42964 0.755,-0.22769 -0.132,-1.05787 1.113,-0.78585 0.309,-2.04421 1.232,-1.04679 -1.267,-1.33997 1.215,-0.36976 -0.488,-0.94704 0.786,-0.0464 0.115,-0.8604 0.767,0.0322 -0.419,-0.79794 0.632,-0.48259 0.342,0.35565 0.215,-0.92488 0.686,-0.0957 -0.229,-0.44632 0.379,-0.23071 -1.193,-0.41509 0.21,-1.29061 0.637,0.0161 0.199,-0.64782 -1.639,-0.26396 0.261,-1.10724 -0.845,-1.13343 -0.473,0.0161 -0.139,-0.73548 -0.245,0.19344 0.545,-0.85436 -0.261,-1.73894 -1.157,0.51383 0.214,-0.79995 -0.925,-0.38991 -0.817,0.20453 -1.12,-1.42863 -0.943,0.0222 -0.53,-0.6579 -0.379,0.31031 -0.159,-0.49065 -1.179,0.72742 -1.951,0.27202 -2.409,-0.94906 -0.521,-0.80499 -0.756,0.17429 -0.804,-1.16365 -1.45,0.2428 -0.444,1.01354 -1.069,-0.35564 0,0 -0.391,-1.23519 0.742,0.14004 0.746,-0.96115 -0.969,-0.71633 -0.223,0.35464 -1.966,-0.33752 -0.207,1.13545 -1.24,-0.24583 0.117,0.95511 -0.54,0.32844 -0.321,-1.17071 -1.355,0.2549 -0.88,-0.58233 -0.205,0.82514 -2.862,-1.13545 -0.722,0.50173 -0.065,0.82514 -2.33,1.1415 -1.755,0.25288 -0.475,-0.60954 -0.356,1.41352 0.259,0.48964 -0.943,0.47554 0.335,-0.53599 -0.747,-0.0131 0.222,-1.15258 -0.351,-1.12537 4.741,-2.5127 1.83,-0.33852 0.391,-0.81406 -0.598,-0.20654 -0.087,0.73447 -0.392,10e-4 -0.633,-1.20698 -0.962,0.84932 -1.465,-0.50375 0.173,-0.96921 -0.927,0.25489 -0.481,-0.6589 1.934,-0.6579 0.3,-1.06996 1.036,-0.16724 0.385,-0.58435 -0.701,-0.39897 0.098,-0.50979 -1.1,-1.45584 0.47,-1.01152 -0.828,0.39393 -1.618,-1.29061 -1.368,-0.42113 -0.35,-0.61961 0.301,-0.86645 -0.694,-0.37277 -0.293,-0.91582 -0.99,-0.31937 -0.099,-0.97224 0.413,-0.52793 -0.815,-0.43221 0.652,-0.97828 -0.121,-1.02362 -0.815,-0.53296 0.136,-1.64323 -0.593,-0.44028 0,0 1.33,-1.25735 1.529,0.0121 -0.002,-0.88056 0.967,0.25792 0.215,-1.13041 1.056,0.0252 0.38,-0.61558 -0.56,-0.24785 0.516,-0.59744 -1.175,-1.20698 -0.214,-0.99541 0.196,-0.52188 0.295,0.23676 0.085,-1.47195 0.962,-0.51786 -1.051,-0.0826 -0.063,-0.63976 0.627,0.2428 -0.073,-0.66595 0.536,-0.42819 -1.547,-0.5239 0.533,-0.25993 0.064,-0.62868 -0.671,-0.73849 0.638,-0.4836 -0.412,-1.3168 -2.865,-2.27896 0,0 -0.919,-1.37926 0.887,-1.00649 -0.523,-0.85436 0.257,-1.70468 -0.807,0.0816 -1.261,-1.79838 -0.581,-0.18336 0.427,-0.95813 -0.637,-0.75563 0,0 -0.107,-0.5511 0.825,-0.34255 -0.65,-1.23519 0.503,-1.20698 -1.929,-2.39583 0.376,-1.83263 -0.309,-1.02866 0.394,-0.4443 -0.305,-0.70928 0.512,-1.50822 -0.71,-0.34356 -0.065,-0.64681 0.626,-0.31535 -0.439,-0.50274 0.284,-0.75865 -1.141,-2.20541 0.519,-0.46748 -0.504,-1.15358 1.208,-2.5399 -0.55,-1.56867 0.74,-0.54204 0.582,-2.73132 1.736,-2.32329 0.152,-1.12033 3.015,-1.42461 -0.344,-0.28209 0.535,-1.20699 1.041,-0.48863 1.12,-2.27594 0.912,-0.70323 0.454,-1.44979 -0.359,-0.33147 0,0 z", labelX: 229, labelY: 245, color: '#F43F5E' },
      { id: "ut", name: "Uttarakhand", d: "m 230.445,144.77227 1.116,1.40042 -0.297,1.04579 0.814,0.57125 0.253,1.48807 0.842,0.98835 1.188,0.28009 0.654,1.98074 1.845,-0.0393 0.626,1.59285 1.174,0.75864 1.397,-1.04376 1.064,0.0574 0.782,-0.57326 1.316,0.71129 1.045,-0.0282 1.259,2.12179 2.702,1.17776 1.235,1.57271 1.133,-0.80802 0.695,1.1949 0.677,-0.0343 0.304,0.672 -0.368,0.98735 -0.822,0.66797 0.596,0.6045 0.142,1.61098 1.881,0.2811 1.313,0.99037 0.675,-0.10579 2.636,1.87294 1.208,-0.80197 3.209,2.16813 1.545,1.90115 4.361,1.62811 -0.015,0.39192 -0.595,-0.2418 -1.645,0.57327 -0.99,1.3178 0.306,0.9803 -2.434,1.91726 -0.284,1.03873 -1.496,1.17575 -1.519,-0.0151 -1.064,2.64972 -1.2,1.25231 -1.245,-0.19948 -1.423,1.33191 0.34,1.82659 0.752,0.86746 -0.26,1.06593 -0.607,0.81204 -0.757,0.20352 0.146,0.81808 -1.317,1.00549 0.331,0.58233 -1.243,0.20553 -0.031,0.79391 0.702,0.46647 0.088,1.07298 0.786,0.82413 -0.411,2.6064 -1.027,-0.37378 0.492,1.88805 -0.804,0.56722 -1.026,-0.45438 -0.837,0.82514 -0.183,2.29709 -0.372,0.61256 -0.369,-0.11284 -0.874,1.68151 0.256,2.07444 0,0 -0.978,0.71532 0.31,0.40098 -0.562,1.09515 -0.958,0.51987 -0.952,-0.40804 -0.7,-1.27045 0.258,-0.39192 -1.271,-0.15616 0.734,-0.23172 -0.451,-0.62163 -0.619,-0.0121 -0.18,0.7788 -0.681,0.16422 0.529,-1.37523 -0.715,-0.69417 -1.304,0.26699 -0.963,0.77476 -1.102,-0.48863 -1.311,0.54707 -0.303,-1.11832 -0.611,0.70121 -2.01,0.17833 -0.205,-1.83062 -0.511,-0.11486 -0.363,-0.80196 -0.163,0.43322 -1.109,-0.0161 -1.986,-1.82357 -0.958,0.14911 0.149,-0.68107 -0.595,-0.43322 -0.129,-1.44173 -2.174,-1.03168 -0.208,1.30773 -1.145,-1.17574 -0.376,0.41307 -0.92,-0.0242 -0.027,-1.2493 -0.974,-1.4115 -1.104,0.0826 -1.8,-1.43064 0.911,-0.78081 0.658,0.49367 0.422,-1.2906 0.415,0.35464 0.866,-0.58234 1.105,-1.53744 -2.877,-0.47856 -3.774,-2.06839 -1.631,-1.51024 -0.832,-2.82602 -1.57,-0.75059 -1.692,-0.57427 -2.101,2.22556 -0.793,-0.14407 -1.139,0.82111 -1.194,1.79233 -0.798,0.21158 -0.148,0.97626 -1.022,0.16322 -0.09,-1.01858 -0.763,-0.0574 0.095,-0.6186 0.523,0.0484 -0.52,-2.20541 -1.635,0.0826 -0.94,0.78887 -0.763,-0.30426 0.05,-0.44834 -0.779,-0.37378 0.146,-1.68051 -1.312,-2.08753 0.649,-1.00951 -0.321,-0.51987 0.571,-0.79089 -0.311,-0.48057 0.883,-0.941 -0.308,-0.53196 0.604,-1.25434 0.558,0.25087 0.533,-0.54909 1.946,-3.27033 -4.62,-2.2306 -1.603,-1.75405 -1.49,0.15515 0,0 0.378,-0.62767 2.051,-0.52188 2.515,-1.45281 0.239,-0.53095 -0.154,-0.74555 -0.867,0.0191 -0.677,-0.86241 1.099,-0.51181 -0.062,-1.08306 -0.956,-0.53901 0.161,-0.60551 -1.105,-1.41654 1.175,-1.49412 0.002,-1.25534 0.939,0.55312 0.131,-1.59588 -1.047,0.0373 -0.231,-0.91179 0.613,-0.42717 1.115,0.57326 -0.434,-0.39695 0.605,-0.93798 -0.517,-1.32184 0.884,-0.4705 0.935,-1.79939 1.408,-0.59039 1.245,0.58435 0.329,-0.74454 1.21,-0.13501 1.257,-1.00044 1.775,-0.0846 0.763,-0.89164 0.51,0.12997 0.104,-0.54405 1.213,-0.0655 0.863,1.05788 0.459,-0.29621 0.516,0.38386 0.544,0.99339 1.402,-0.0725 1.22,-0.72842 0.818,0.35565 0.277,0.66797 3.085,-0.2549 0.496,1.41956 1.102,0.97728 2.621,-0.19647 -0.459,-1.53945 -1.235,-1.15459 -0.183,-0.83522 0,0 0.387,-1.78226 1.386,-0.7929 1.177,-2.61546 1.696,0.77879 z", labelX: 232, labelY: 175, color: '#06B6D4' },
      { id: "wb", name: "West Bengal", d: "m 425.187,373.7723 0.59,0.56319 0.104,0.73447 -1.028,-0.2821 0.334,-1.01556 z m 7.056,-0.16825 1.44,1.15862 -1.272,0.0433 -0.168,-1.20194 z m -2.328,-0.43625 0.59,0.55413 -0.333,0.68509 -0.6,-0.50878 0.343,-0.73044 z m -3.901,-0.27202 1.053,0.82715 -0.785,0.86343 -0.838,-0.87048 0.301,-1.15056 0.269,0.33046 z m 4.913,-0.32643 0.547,1.38531 -0.965,0.33852 0.313,-0.55614 -0.516,-0.59845 0.621,-0.56924 z m 4.058,0.26094 0.399,0.45438 -0.605,0.0856 -0.085,-1.1284 0.291,0.58838 z m -7.802,-0.82413 -0.012,1.35307 -0.813,-0.50577 0.825,-0.8473 z m 8.195,-0.62364 0.132,0.93798 0.453,0.37781 0.342,0.96014 -0.603,0.0705 -0.003,-0.59039 -0.564,-0.51987 -0.462,-1.12437 0.705,-0.11183 z m -3.761,0.19847 -0.165,0.94 -0.816,-0.48662 0.981,-0.45338 z m -10.337,-0.21258 0.733,0.39998 0.251,0.9269 -0.896,0.88962 -0.088,-2.2165 z m 2.993,-0.0685 0.348,0.82011 -0.482,1.06089 -0.298,-1.15862 0.432,-0.72238 z m -5.224,-0.26598 0.253,0.46547 -0.242,0.41307 0.328,0.36069 0.063,0.53498 -0.245,0.92085 -0.642,-1.93641 0.485,-0.75865 z m 17.893,-0.0151 0.749,1.75607 -0.909,0.59644 -1.101,-1.41151 0.226,-0.55815 1.035,-0.38285 z m -10.681,0.10579 0.558,-0.12392 0.314,0.7123 -0.966,0.96921 -0.539,-1.24728 0.633,-0.31031 z m 6.993,-0.63472 1.198,1.12839 -0.407,1.42158 -1.001,-1.40344 0.21,-1.14653 z m -9.854,0.31534 0.34,0.66092 -0.364,0.97727 0.436,0.70626 -0.698,0.71734 -0.396,-1.92332 0.499,-0.80902 -0.524,-0.34053 0.345,-0.52491 0.362,0.53599 z m -4.078,-0.42012 1.035,0.17329 0.702,1.57471 -0.296,1.54651 0.413,0.53196 -0.594,0.47655 -0.713,-0.2015 -0.547,-4.10152 z m 14.994,-0.18941 0.814,0.90674 -0.902,-0.18235 0.088,-0.72439 z m -11.772,0.0322 -0.129,0.78181 0.389,0.43222 -0.487,0.3768 -0.226,-1.41754 0.453,-0.17329 z m 13.441,-0.0464 0.786,0.61054 -0.516,0.27807 -0.27,-0.88861 z m -3.74,0.0302 0.638,-0.0232 -0.547,1.16568 0.431,1.58177 -0.325,0.22165 -0.739,-0.26598 0.128,-1.60696 -0.843,0.14911 0.445,-0.93999 0.812,-0.2821 z m -5.288,-0.4564 0.789,1.08608 -0.266,0.75562 -0.646,-1.32788 0.123,-0.51382 z m 8.302,-0.10982 0.765,1.28658 -0.232,0.21661 -1.126,-1.18885 0.593,-0.31434 z m -7.727,-0.17228 0.198,0.94604 -0.368,-0.31535 -0.211,-0.48359 0.381,-0.1471 z m -2.958,0.0302 -0.025,1.16769 -0.688,0.43624 0.09,-1.13142 0.623,-0.47251 z m 5.186,-0.41711 0.902,1.0881 -0.137,0.62364 0.288,0.13601 -0.078,0.74152 -0.706,0.14609 0.397,0.62968 -1.276,-0.4443 0.166,-1.48606 0.444,-1.43468 z m -3.592,-0.0655 0.579,0.50878 0.006,1.17978 -1.11,0.36975 -0.32,-1.16668 0.845,-0.89163 z m -2.57,-0.0181 0.438,0.25288 -0.435,1.33494 -0.511,-0.97728 0.508,-0.61054 z m 12.095,-0.0131 0.354,-0.007 0.135,1.05989 -0.685,-0.56521 0.196,-0.48763 z m -3.59,0.17228 0.046,0.84429 -0.826,0.37579 0.646,-1.64625 0.134,0.42617 z m 2.372,-0.97626 0.738,0.60349 -0.251,0.73044 -1.031,0.40904 -0.266,-0.91279 0.81,-0.83018 z m -7.309,-0.0625 0.309,0.44632 -0.081,0.70424 -0.566,-0.40602 0.338,-0.74454 z m -5.435,0.12089 0.469,1.14956 0.522,0.14709 -0.063,0.44632 -0.713,0.17833 -0.162,0.806 -0.772,-0.19243 -0.398,-1.5586 1.117,-0.97627 z m 10.959,-0.46445 0.441,0.30628 0.722,2.59833 -1.421,-1.18078 0.258,-1.72383 z m -15.055,-0.22064 0.744,1.42359 -0.038,1.5717 -0.571,1.41855 0.237,0.66596 -0.954,0.54505 -1.412,-0.52591 -0.104,-0.58233 0.756,-2.37367 1.342,-2.14294 z m 13.688,0.46546 0.719,-0.80297 0.375,0.40904 -1.055,1.51729 -0.164,-0.81003 0.125,-0.31333 z m 3.94,-0.88357 1.044,0.62565 -0.267,0.93395 -1.253,-0.44733 0.476,-1.11227 z m -7.481,-0.0957 0.666,0.67301 -0.305,1.87999 -0.804,-1.78428 0.443,-0.76872 z m -1.242,0.006 0.269,0.43322 -0.422,1.20799 -0.344,-0.51181 0.497,-1.1294 z m -2.425,-0.16725 0.745,0.38688 0.169,0.70928 -0.881,0.92891 -0.937,-0.0332 0.441,-1.747 0.463,-0.24483 z m 5.628,0.11687 0.69,0.0816 0.675,0.82816 -0.477,1.76917 -1.28,-1.28557 0.392,-1.39337 z m -1.577,-0.49568 0.575,0.22668 -0.42,0.54103 -0.155,-0.76771 z m 4.115,0.0846 1.645,-0.23273 1.082,0.61256 -0.279,0.48763 -1.031,0.81809 -1.417,-1.68555 z m -2.365,-0.31736 1.588,0.27606 0.181,0.79693 -0.384,0.44531 -0.399,-0.82111 -1.084,-0.18336 0.098,-0.51383 z m 0.456,-1.08104 0.111,0.56319 0.652,0.12997 0.206,0.29519 -1.034,-0.0745 -0.389,-0.77779 0.454,-0.13601 z m -1.787,-0.89264 1.167,0.42012 -0.787,1.30673 -1.036,-0.34356 0.656,-1.38329 z m -10.857,-0.16221 -1.128,2.11776 -0.844,0.47755 0.547,-1.89107 1.425,-0.70424 z m 14.055,0.15717 1.878,0.1753 -0.12,1.68252 -0.858,0.20453 -2.031,-0.9128 0.288,-0.98634 0.843,-0.16321 z m 4.782,-0.65689 0.77,1.39236 -0.308,1.18583 -0.641,0.18941 -1.111,-2.14094 0.116,-0.77678 1.174,0.15012 z m -3.572,-0.68913 0.345,1.03067 -1.89,-0.2831 1.545,-0.74757 z m -0.608,-0.55714 0.281,0.36169 -1.328,0.37781 -0.211,0.50879 -0.499,-0.1471 0.547,-1.17776 0.757,-0.28613 0.453,0.3627 z m 0.313,-1.98376 1.24,2.285 -0.91,0.0564 -0.87,-0.88861 0.884,-0.35061 -0.703,-1.21202 0.359,0.10982 z m 2.07,0.18739 0.613,0.77174 -0.419,1.29161 -0.839,0.61458 -0.015,0.91279 0.465,0.54808 -0.236,-1.24628 0.604,-0.0423 0.185,1.56464 1.023,1.49513 -0.184,0.4443 -1.598,-0.77174 -0.493,-1.3178 -0.236,-1.60394 0.613,-0.74253 -0.771,-1.62005 0.54,0.19344 0.748,-0.49166 z m 0.975,-0.36874 1.016,1.55255 -0.269,1.47699 -1.465,-0.15918 0.613,-1.48506 -0.508,-1.25534 0.613,-0.12996 z m -6.451,0.008 1.997,0.66494 -2.217,1.99384 1.104,1.13847 -0.194,0.4967 -1.367,-0.47957 -0.57,-1.71778 1.247,-2.0966 z m 3.309,1.10925 -1.554,0.8735 -0.806,1.22814 -0.341,-0.0312 -0.418,-0.46345 2.293,-2.15 0.438,-0.0947 0.388,0.63774 z m 2.002,-1.70771 0.295,0.63473 -0.631,0.4574 -0.148,-0.41509 0.043,-0.48561 0.441,-0.19143 z m -2.824,-1.3168 0.274,0.95007 -0.57,0.35061 0.496,0.88257 -0.672,0.14206 -0.865,-0.61155 0.088,-0.53599 1.249,-1.17777 z m 0.599,-1.41251 1.054,0.0594 0.409,0.84529 0.541,0.15112 0.159,1.36214 -0.859,0.35867 0.225,1.08608 -2.129,-1.09414 0.468,-0.25994 -0.313,-2.01398 0.445,-0.49469 z m 3.004,-0.8332 -0.023,1.29464 0.831,0.63069 -0.616,0.25893 1.529,1.9888 0.036,1.15459 0.577,-0.17329 -0.719,0.60349 -0.883,-1.74801 -0.988,-0.0947 -0.367,-1.09011 0.359,-3.2381 0.264,0.41307 z m -1.904,-3.47183 -0.03,1.59184 0.614,1.44979 -0.704,0.52289 -0.52,-2.88748 0.64,-0.67704 z m 0.847,-0.54405 0.539,0.24482 0.809,2.68498 -0.819,0.44632 -0.367,2.28501 -0.725,-0.58737 -0.002,-0.94201 0.547,-0.44129 -0.578,-1.60494 0.031,-1.87294 0.565,-0.21258 z m -19.201,-107.77598 1.213,0.42517 0.229,1.39941 1.063,0.58032 1.235,-0.4564 0.772,0.38789 1.506,-0.20855 0.405,0.55815 2.264,0.54808 2.051,-1.61502 -0.192,-0.66092 0.801,-0.24986 1.257,0.0212 0.783,0.60047 0.585,-0.42013 0.84,0.98332 0.568,-0.2287 0,0 2.476,0.93092 0.105,3.70155 0.922,-1.05082 0.726,0.6589 -0.289,0.60752 0.472,0.4302 1.309,-0.37982 0.451,0.86141 0.918,0.22769 0.245,1.35609 0.607,0.66394 2.607,-0.20653 2.545,-1.16265 0.29,0.59643 1.219,0.16725 0.21,0.64883 2.085,-0.21762 1.317,0.90775 0.48,-0.0947 0.204,0.40904 -0.859,0.83219 0.393,0.20855 0.554,0.0181 0.317,-0.51483 1.101,0.42415 0.633,-0.33247 0.372,0.86645 0.687,-0.3627 1.042,0.26396 0,0 0.406,1.27449 -0.404,0.61256 0.429,0.91883 -0.325,0.14911 -0.195,2.11272 0.376,0.65387 -0.907,1.48505 0.409,-0.1471 0.219,0.42819 -1.576,0.73044 -0.024,0.52389 -0.635,0.22065 0.17,0.7526 -0.854,-0.38285 0.411,0.81003 -0.257,0.2962 -0.427,-0.269 0.501,0.74051 -0.659,0.49065 0.728,0.11586 -0.778,0.54304 0.823,0.32945 -0.322,0.20956 0,0 -0.409,-0.0544 -0.478,-0.77074 -0.065,-0.40501 -0.747,-0.20956 0.482,1.21706 -0.86,-0.0564 -0.126,0.57628 -0.394,-0.0856 0.802,0.89062 -0.761,0.42013 0.342,0.29117 0.412,-0.43323 0.419,1.01355 -1.49,0.91883 -0.023,1.30773 -0.771,-0.0544 -0.025,-0.81406 -2.174,-0.0745 -0.188,-0.86444 -0.652,0.90373 -0.962,-0.0846 -1.452,-0.8997 0.043,-0.39493 -0.493,0.0474 0.223,-0.64782 -0.88,-0.72439 -1.419,-0.3758 -0.457,-0.96619 0.132,-1.29262 -0.805,-1.09817 0.754,-0.89969 -1.116,-0.0252 0.337,-0.39998 -0.427,-0.63573 0.141,-0.77577 -1.099,0.0302 -1.605,-1.52736 -0.271,0.79592 -0.37,-0.16724 -0.471,0.56823 0.181,0.98633 0.915,0.0967 0.1,0.27001 0.482,0.0484 0.34,0.5511 -0.33,0.55917 0.868,0.44934 0.666,-0.19646 0.096,0.90372 -2.079,0.32139 -0.745,-1.09313 -0.974,-0.0766 -0.421,0.33046 0.354,0.90272 -0.802,0.10679 -0.577,-0.59442 0.05,-0.96015 -0.475,-0.29217 -0.782,0.29419 -0.259,-1.23217 -0.938,0.44128 -0.473,-1.075 0.437,-0.19041 -1.635,-1.10019 -0.08,-0.83522 -0.534,-0.0171 0.038,0.5249 -0.835,-0.17429 0.082,-0.7516 -0.721,0.16826 -0.85,-1.3964 -1.06,-0.12896 -0.42,-2.04824 -0.792,0.95209 -0.89,2.71823 0.437,0.74554 0.245,-0.96619 2.421,0.60853 0.87,2.37165 -0.791,0.24885 -0.609,-0.57427 -0.414,0.85939 -0.652,0.15516 0.192,0.33852 -1.349,0.80499 0.017,1.44072 -2.15,0.71733 -1.452,1.01858 -0.407,1.58177 0.509,0.1743 -0.255,0.88156 0.293,0.20352 -0.902,0.28612 -1.198,2.31725 0.452,0.53397 0.184,2.16612 0.724,0.53297 0.724,-0.58234 0.467,0.31031 1.284,-0.52893 0.038,0.65688 2.236,1.56968 0.599,1.00649 1.038,0.20553 -0.216,1.478 1.122,0.36471 -0.072,0.54707 1.705,1.21505 0.657,-0.17833 0.846,0.84025 1.026,0.16322 0.256,-0.62969 1.214,0.10982 -0.13,-0.67402 0.995,0.0363 0.601,1.16568 -0.465,1.42661 0.588,0.3758 -0.027,0.68711 0.941,0.92589 0.373,-0.30225 0.4,0.74152 1.793,0.25893 -1.143,0.76872 0.046,0.91984 -0.503,0.0343 0.263,0.79088 -0.51,0.39192 -1.635,-1.0216 -0.861,0.90271 -0.645,-0.43423 -0.438,0.30628 -0.896,-0.73648 -1.929,0.0806 -1.073,0.6589 -1.384,-0.78786 -1.127,0.35665 0.352,1.25837 -0.416,0.36471 0.211,1.08911 -0.342,0.673 0.361,0.33752 -1.18,1.53844 0.085,0.54204 -1.252,0.15414 -0.322,0.65588 0.452,0.42718 -0.477,0.60853 -0.999,-0.69114 -0.285,0.46949 -0.005,-0.98835 -0.745,-0.95309 -1.849,0.53901 0.753,1.73793 -0.587,0.24885 -0.24,1.03772 -0.286,-0.3768 -0.346,0.97526 -0.74,0.23071 -0.122,1.11026 -1.134,1.2624 2.873,3.71464 1.093,1.03873 1.573,0.50375 1.21,1.27952 2.416,0.14205 1.681,0.75663 0.551,1.09717 0.274,-0.69417 0.38,0.0161 0.911,0.45741 1.522,-0.10478 0.674,0.81607 -0.057,1.79032 -0.68,0.72137 0.224,1.08205 -0.325,0.12695 0.11,0.42516 0.537,-0.0232 0.033,2.33034 0.66,-0.31535 0.257,0.537 -0.754,0.15213 -0.072,1.49412 -0.616,0.003 -0.909,1.02865 -1.73,0.19042 0.539,0.98433 -0.883,0.72136 0.402,0.45841 -0.358,2.82402 0.644,0.12594 -0.242,0.8201 1.342,-0.16725 0.299,1.26643 1.752,1.64524 1.164,-0.3224 -0.158,1.22411 -0.537,-0.0333 -0.165,0.54405 0.103,1.30773 -0.603,0.35363 0.263,0.8332 -1.02,0.30527 0.48,0.99944 1.599,0.84731 0.364,-0.0222 0.079,-0.78585 0.73,0.60249 1.271,-0.12292 0.119,0.49468 1.581,-0.0917 -0.267,0.70726 -0.427,-0.19545 -0.853,1.45483 -1.063,0.68509 0.07,2.08955 -0.558,0.0433 0.444,0.29319 -0.136,0.78383 0.71,0.10579 0.387,0.7264 -0.096,0.93899 0.769,-10e-4 0.45,0.79189 -0.19,1.1012 -0.821,0.7395 0.84,1.61502 -0.561,1.63416 0.526,0.18135 -0.421,0.9279 -1.438,0.54707 -0.546,0.86242 0.32,0.60551 -0.251,2.10667 0.631,0.74857 -1.201,-0.1884 -0.4,1.7198 -1.219,1.11731 -0.11,0.73044 -1.14,-0.0856 -1.31,2.28903 0.364,1.4377 -0.795,1.59688 0.167,1.39438 -0.6,0.52692 -0.116,-0.39595 -0.669,0.0756 -0.262,1.14754 -0.707,-0.58738 0.654,-1.15459 -2.214,0.53297 -0.466,0.48158 -0.143,1.94951 -0.559,0.0252 -0.219,-1.33997 -0.833,0.22265 -1.147,0.89768 0.289,1.17071 -1.162,-0.19545 -1.129,-2.59733 0.291,-1.05485 -0.493,-0.74756 1.133,-1.43266 0.338,-1.19388 -0.437,-2.07545 -0.785,-0.72338 -2.007,-0.2962 0.739,-2.10064 -1.169,1.91727 -1.346,-0.58032 -0.548,-0.88357 -0.258,-2.75349 -0.482,-0.65487 -0.829,-0.14811 1.225,1.70469 -0.047,2.4059 1.437,1.33292 2.657,0.37781 1.116,1.93742 -2.651,1.94749 -0.192,0.0635 -1.522,3.44766 -1.07,1.29261 -0.823,0.15818 -2.096,2.22455 -0.762,-0.10578 -1.332,0.95208 -4.348,1.1012 0,0 -0.489,-0.81809 0.255,-1.40445 -0.584,-0.49368 0.015,-0.71935 -1.539,0.0191 -0.377,-0.57931 -1.878,-0.63573 -0.577,-3.17462 -1.41,-0.4302 -0.191,0.96921 -1.356,0.51181 0.023,1.075 -1.349,-0.11183 -0.676,-0.9531 0.762,-1.84775 -0.35,-1.17877 -1.264,-0.95107 -2.622,-0.26598 -0.872,-1.33191 -1.567,0.23676 0.153,-1.62509 0,0 0.927,0.0886 0.188,-0.0554 0.505,0.003 0.204,-0.55111 0.042,-0.58737 0.094,0.33147 1.451,-0.0635 0.011,-0.95209 -1.193,-0.69114 0.309,-1.62005 -1.71,-0.66193 -0.353,-1.14452 0.918,0.0262 0.196,-0.55211 -0.81,-1.67043 -2.267,-0.0766 -0.708,-2.21649 -1.646,-1.074 -0.684,0.43524 -1.894,-1.70569 0.349,-1.91021 0.633,-0.82212 -0.633,-0.60954 0.787,-0.59341 0.296,0.34557 0.708,-0.2287 0.459,-0.97828 -0.587,0.47856 -0.312,-0.53901 -1.698,-0.11083 -0.485,0.46849 -1.984,-0.88861 -1.796,0.48662 -1.307,-1.11631 -0.282,-0.96216 -1.854,-0.58233 -0.231,-0.79693 -2.553,0.32038 -1.203,-1.47799 -0.543,-0.0181 -0.109,-1.55155 1.081,-1.3843 -0.245,-0.93999 0.616,-0.13098 -0.688,-0.89969 0.066,-1.37725 1.63,0.35666 2.163,-0.89265 -0.764,-1.32687 0.756,-0.73648 2.05,0.36774 0.016,2.16611 1.579,0.39091 0.372,-0.31434 -0.295,0.77779 0.388,0.36774 0.739,-0.49267 0.45,0.48259 0.299,-0.18941 -0.296,-0.35262 1.504,-0.89063 -0.382,-0.31534 0.089,-1.06694 0.48,-0.94504 1.229,-0.56722 0.005,-0.46949 1.859,0.0151 1.318,-0.96619 2.14,-0.53498 0.792,0.0171 0.135,0.37076 1.129,-0.22367 0.58,-1.68957 -0.563,-1.61099 0.584,0.46043 1.057,-0.75361 0.084,-0.41811 0.414,-0.40199 0.866,0.80499 0.639,-0.46949 3.292,1.61199 0.515,0.0151 0.37,-0.57729 -0.743,-1.08608 1.355,0.29116 -0.148,0.3083 0.628,0.23071 0.505,0.10579 0.115,-1.8548 0.465,0.78081 0.505,-0.58737 -0.057,-1.31075 -0.635,-0.23979 -0.493,-1.72383 1.977,0.23374 -0.355,0.61055 0.262,0.19344 0.602,-0.30326 2.121,0.63774 -0.505,-0.61759 1.023,-0.12191 0.582,-0.60147 -0.404,-0.28009 0.05,-1.4518 1.729,0.68913 -0.146,-0.49368 0.804,-0.5108 -0.8,-0.61256 2.516,0.134 0.063,-0.83521 -1.148,-0.58435 -0.041,-0.71129 0.955,-0.0907 0.606,-1.04981 0.962,-0.26598 1.125,-2.37165 -0.529,-0.18236 0.799,-1.84069 -0.34,-0.37378 -0.241,0.45136 0.234,-1.24729 -0.773,-0.84428 1.649,0.70827 0.819,-0.269 0.474,-0.71835 -0.779,-0.3899 0.604,-0.0423 -0.356,-0.32442 0.604,-0.73648 -0.561,-0.35766 0.297,-1.09615 -1.278,-0.38386 -0.453,-0.64178 0.407,-0.50475 -0.048,0.56722 0.403,-0.0242 0.463,-0.67905 -0.188,-0.67704 0.645,-0.0353 -0.198,-0.65689 1.767,-1.00548 -0.144,-0.76671 -1.874,-2.27795 -2.103,-1.46389 0.231,-2.99529 0,0 1.027,0.49266 -0.29,-0.81305 0.705,-1.00749 -1.518,-1.26844 0.102,-0.92388 -0.484,-0.13299 -0.139,-0.62867 0.466,-0.91985 0.572,0.24281 0.526,-0.70626 0.62,-0.0191 0.33,-1.17575 0.414,0.27203 0.566,-0.74152 1.256,0.26497 0.013,0.51584 0.368,0.19948 0.068,-0.37982 0.42,0.56319 0.896,0.13097 0.051,-0.54405 -0.776,-0.76267 -0.308,-1.16769 0.696,-1.06795 -0.392,-0.0927 0.272,-1.25131 -1.834,-0.79391 -0.599,-1.08708 -0.71,0.0363 0.252,-1.04981 -0.568,-0.32139 0.576,-0.54002 -1.843,-0.45942 -0.399,-0.94805 0.548,-0.54405 0.255,-2.54393 1.482,-1.08608 0.381,0.51483 0.142,-0.36169 0.633,0.0725 -0.085,-1.65028 1.026,0.25993 0.51,-0.8604 0.678,0.0463 1.563,-1.80242 1.461,-0.67502 1.625,-1.69058 -0.509,-0.63774 -0.627,0.13601 -0.15,-0.43524 0.784,-0.65084 -0.814,-0.59443 -0.058,-0.68207 -0.68,0.0997 -0.309,-0.43524 1.138,-0.97929 -0.045,-0.46042 -1.318,0.34255 -0.479,0.6186 -0.822,-0.5773 0,0 0.002,-0.009 0,0 -0.017,-0.0796 0,0 1.206,-2.27291 0.575,-3.17261 -0.302,-2.2044 -0.778,-0.7798 0.203,-0.51886 -0.536,-0.69921 0.303,-0.82715 -0.889,-0.44129 -0.325,-0.73144 -0.82,-0.0292 -0.347,-1.20295 -0.618,-0.42012 0.582,-1.54349 -0.11,-1.14351 z", labelX: 395, labelY: 310, color: '#EC4899' }
    ]

  // BBox parser helper
  function getPathBBox(d) {
    const cleaned = d.replace(/(?<=[0-9])-/g, ' -').replace(/[a-zA-Z,]/g, ' ');
    const numbers = cleaned.trim().split(/\s+/).map(Number).filter(x => !isNaN(x));
    if (numbers.length < 2) return { x: 0, y: 0, width: 612, height: 696 };
    const points = [];
    let cx = numbers[0];
    let cy = numbers[1];
    points.push({x: cx, y: cy});
    for (let i = 2; i < numbers.length - 1; i += 2) {
      cx += numbers[i];
      cy += numbers[i+1];
      points.push({x: cx, y: cy});
    }
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  // Smooth viewBox animation helper
  function animateViewBox(svgEl, targetViewBox) {
    const current = (svgEl.getAttribute('viewBox') || '0 0 612 696').split(' ').map(Number);
    const start = { x: current[0], y: current[1], w: current[2], h: current[3] };
    const target = { x: targetViewBox[0], y: targetViewBox[1], w: targetViewBox[2], h: targetViewBox[3] };
    const duration = 600; // ms
    const startTime = performance.now();
    
    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const cx = start.x + (target.x - start.x) * ease;
      const cy = start.y + (target.y - start.y) * ease;
      const cw = start.w + (target.w - start.w) * ease;
      const ch = start.h + (target.h - start.h) * ease;
      svgEl.setAttribute('viewBox', `${cx} ${cy} ${cw} ${ch}`);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const stateShortNames = {
    "Andaman and Nicobar Islands": "Andaman",
    "Andhra Pradesh": "Andhra",
    "Arunachal Pradesh": "Arunachal",
    "Dadra and Nagar Haveli": "Dadra & NH",
    "Daman and Diu": "Daman & Diu",
    "Himachal Pradesh": "Himachal",
    "Jammu and Kashmir": "J&K",
    "Lakshadweep": "Lakshadweep",
    "Madhya Pradesh": "Madhya Pradesh",
    "Uttar Pradesh": "Uttar Pradesh",
    "West Bengal": "West Bengal",
    "Puducherry": "Pondy"
  };
  const getShortName = (name) => stateShortNames[name] || name;

  function renderMapBreadcrumbs() {
    const el = document.getElementById('mapBreadcrumbs');
    if (!el) return;
    
    let html = '';
    if (mapDrillLevel === 'PAN-INDIA') {
      html = '<span class="map-breadcrumb-item active">India Map</span>';
    } else {
      html = '<span class="map-breadcrumb-item" onclick="resetMapZoom()"><i class="fa-solid fa-house"></i> India Map</span>';
      
      if (mapDrillLevel === 'STATE') {
        html += ' <span class="map-breadcrumb-separator">></span> ';
        html += `<span class="map-breadcrumb-item active">${mapSelectedState}</span>`;
      } else if (mapDrillLevel === 'DISTRICT') {
        html += ' <span class="map-breadcrumb-separator">></span> ';
        html += `<span class="map-breadcrumb-item" onclick="zoomBackToState()">${mapSelectedState}</span>`;
        html += ' <span class="map-breadcrumb-separator">></span> ';
        html += `<span class="map-breadcrumb-item active">${mapSelectedDistrict}</span>`;
      }
    }
    el.innerHTML = html;
  }

  window.resetMapZoom = function() {
    mapDrillLevel = 'PAN-INDIA';
    mapSelectedState = '';
    mapSelectedDistrict = '';
    currentSelectedMapState = 'ALL';
    
    const badge = document.getElementById('badgeSelectedState');
    if (badge) badge.textContent = 'National View (All States)';
    
    const svgEl = document.getElementById('indiaMapSvg');
    if (svgEl) animateViewBox(svgEl, [0, 0, 612, 696]);

    renderIndiaMap();
    if (typeof applyTerritoryFilter === 'function') {
      applyTerritoryFilter('ALL', 'ALL', 'ALL');
    }
  };

  window.zoomBackToState = function() {
    mapDrillLevel = 'STATE';
    mapSelectedDistrict = '';
    
    if (typeof applyTerritoryFilter === 'function') {
      applyTerritoryFilter(mapSelectedState, 'ALL', 'ALL');
    }
    renderIndiaMap();
  };

  // ═══════════════════════════════════════════════════════════════
  // OFFICIAL SVG INDIA MAP ENGINE (Zero external dependencies, 100% accurate)
  // ═══════════════════════════════════════════════════════════════

  function _normStateName(st) {
    if (!st) return 'Unknown';
    st = st.trim();
    if (st === 'Jammu & Kashmir') return 'Jammu and Kashmir';
    return st;
  }

  function renderIndiaMap() {
    const container = document.getElementById('indiaSvgContainer');
    if (!container) return;

    renderMapBreadcrumbs();
    updateStateDetailsPanel(mapSelectedState || 'ALL');

    const stateScanCounts = {};
    const stateActiveRets = {};
    const stateDists = {};
    const stateTotalRets = {};

    // Count total registered retailers per state from all_retailers
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      dashboardData.all_retailers.forEach(r => {
        const st = _normStateName(r.State_Name || r.state || 'Unknown');
        stateTotalRets[st] = (stateTotalRets[st] || 0) + 1;
      });
    }

    filteredScans.forEach(s => {
      const st = _normStateName(s.State_Name);
      stateScanCounts[st] = (stateScanCounts[st] || 0) + 1;
      if (!stateActiveRets[st]) stateActiveRets[st] = new Set();
      stateActiveRets[st].add(s.status_retailer_id || s.retailer_id);
      if (!stateDists[st]) stateDists[st] = new Set();
      if (s.distributor_name) stateDists[st].add(s.distributor_name);
    });

    const maxScans = Math.max(...Object.values(stateScanCounts), 1);

    // Build SVG string
    let svgHTML = `<div style="position:absolute; top:12px; right:12px; z-index:20; display:flex; gap:6px;">
      <button type="button" onclick="zoomMapIn()" style="background:rgba(15,23,42,0.85); color:#FFF; border:1px solid rgba(255,255,255,0.2); width:32px; height:32px; border-radius:6px; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="Zoom In">+</button>
      <button type="button" onclick="zoomMapOut()" style="background:rgba(15,23,42,0.85); color:#FFF; border:1px solid rgba(255,255,255,0.2); width:32px; height:32px; border-radius:6px; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center;" title="Zoom Out">&minus;</button>
      <button type="button" onclick="resetMapZoom()" style="background:rgba(15,23,42,0.85); color:#FFF; border:1px solid rgba(255,255,255,0.2); height:32px; padding:0 10px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;" title="Reset Map">🇮🇳 Reset View</button>
    </div>`;

    svgHTML += `<svg id="indiaMapSvg" viewBox="0 0 612 696" style="width:100%; height:100%; filter:drop-shadow(0 8px 24px rgba(0,0,0,0.5)); transition:all 0.4s ease;">`;
    
    // Background glow filter definition
    svgHTML += `<defs>
      <filter id="stateGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#3B82F6" flood-opacity="0.4"/>
      </filter>
      <filter id="selectedGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="#60A5FA" flood-opacity="0.8"/>
      </filter>
    </defs>`;

    statePaths.forEach(st => {
      const normName = _normStateName(st.name);
      const scanCount = stateScanCounts[normName] || 0;
      const retsCount = stateActiveRets[normName] ? stateActiveRets[normName].size : 0;
      const distsCount = stateDists[normName] ? stateDists[normName].size : 0;
      const totalRetsCount = stateTotalRets[normName] || 0;

      const isSelected = (mapDrillLevel !== 'PAN-INDIA' && normName === mapSelectedState);
      const isOther    = (mapDrillLevel !== 'PAN-INDIA' && normName !== mapSelectedState);

      // Color intensity fill
      let fillColor = 'rgba(30, 58, 138, 0.25)';
      let strokeColor = 'rgba(147, 197, 253, 0.45)';
      let strokeWidth = 1.2;

      if (scanCount > 0) {
        const ratio = Math.min(1, scanCount / maxScans);
        const alpha = 0.45 + ratio * 0.45;
        fillColor = isSelected ? '#2563EB' : `rgba(37, 99, 235, ${alpha})`;
        strokeColor = isSelected ? '#FFFFFF' : '#93C5FD';
        strokeWidth = isSelected ? 2.5 : 1.5;
      }

      if (isOther) {
        fillColor = 'rgba(15, 23, 42, 0.35)';
        strokeColor = 'rgba(255, 255, 255, 0.12)';
        strokeWidth = 0.6;
      }

      const filterAttr = isSelected ? 'filter="url(#selectedGlow)"' : '';

      svgHTML += `<path id="state_path_${st.id}" d="${st.d}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" ${filterAttr}
        style="cursor:pointer; transition:all 0.25s ease;"
        data-state="${normName}" data-scans="${scanCount}" data-rets="${retsCount}" data-dists="${distsCount}" data-total-rets="${totalRetsCount}"
        onmouseover="handleStateMouseOver(event, '${normName}', ${scanCount}, ${retsCount}, ${distsCount}, ${totalRetsCount})"
        onmouseout="handleStateMouseOut(event)"
        onclick="handleStateClick('${normName}', '${st.id}')"/>`;
    });

    // Add State Name Labels & Badges
    statePaths.forEach(st => {
      const normName = _normStateName(st.name);
      const scanCount = stateScanCounts[normName] || 0;
      const retsCount = stateActiveRets[normName] ? stateActiveRets[normName].size : 0;
      const isSelected = (mapDrillLevel !== 'PAN-INDIA' && normName === mapSelectedState);
      const isOther    = (mapDrillLevel !== 'PAN-INDIA' && normName !== mapSelectedState);

      if (isOther) return;

      const shortName = getShortName(st.name);
      const fontSize = isSelected ? 13 : 10;
      const opacity = scanCount > 0 || isSelected ? 1 : 0.65;

      svgHTML += `<g style="pointer-events:none; opacity:${opacity}; transition:all 0.3s ease;">
        <text x="${st.labelX}" y="${st.labelY}" text-anchor="middle" font-family="Inter, sans-serif" font-size="${fontSize}px" font-weight="700" fill="#FFFFFF" style="text-shadow:0 1px 4px rgba(0,0,0,0.9);">${shortName}</text>`;

      if (scanCount > 0) {
        svgHTML += `<text x="${st.labelX}" y="${st.labelY + 12}" text-anchor="middle" font-family="Inter, sans-serif" font-size="8px" font-weight="800" fill="#34D399" style="text-shadow:0 1px 4px rgba(0,0,0,0.9);">🟢 ${retsCount} Rets</text>`;
      }
      svgHTML += `</g>`;
    });

    svgHTML += `</svg>`;

    // Tooltip overlay
    svgHTML += `<div class="map-tooltip" id="mapTooltip" style="display:none; position:absolute; z-index:100; pointer-events:none; background:rgba(8,18,36,0.95); border:1px solid rgba(59,130,246,0.5); border-radius:8px; padding:8px 12px; color:#FFF; font-size:12px; box-shadow:0 4px 16px rgba(0,0,0,0.7); font-family:Inter,sans-serif;"></div>`;

    container.innerHTML = svgHTML;

    // Apply ViewBox zoom if state selected
    if (mapDrillLevel === 'STATE' && mapSelectedState) {
      const selectedObj = statePaths.find(s => _normStateName(s.name) === mapSelectedState);
      if (selectedObj) {
        const bbox = getPathBBox(selectedObj.d);
        const pad = Math.max(bbox.width, bbox.height) * 0.35;
        const targetViewBox = [
          Math.max(0, bbox.x - pad),
          Math.max(0, bbox.y - pad),
          Math.min(612, bbox.width + pad * 2),
          Math.min(696, bbox.height + pad * 2)
        ];
        const svgEl = document.getElementById('indiaMapSvg');
        if (svgEl) animateViewBox(svgEl, targetViewBox);
      }
    }
  }

  // State interaction handlers
  window.handleStateMouseOver = function(e, stateName, scans, rets, dists, totalRets) {
    const tooltip = document.getElementById('mapTooltip');
    const path = e.target;
    if (path) path.style.fillOpacity = '0.9';

    if (tooltip) {
      tooltip.style.display = 'block';
      tooltip.style.left = (e.offsetX + 15) + 'px';
      tooltip.style.top = (e.offsetY - 35) + 'px';
      const inactiveCount = Math.max(0, (totalRets || 0) - rets);
      tooltip.innerHTML = `<div style="font-weight:700; color:#93C5FD; font-size:13px; margin-bottom:4px;">${stateName}</div>
        <div>🔷 Total Retailers: <strong>${(totalRets || 0).toLocaleString()}</strong></div>
        <div>🟢 Active Retailers: <strong>${rets.toLocaleString()}</strong></div>
        <div>🔴 Inactive Retailers: <strong>${inactiveCount.toLocaleString()}</strong></div>
        <div>📦 Scans: <strong>${scans.toLocaleString()}</strong></div>
        <div>🟠 Distributors: <strong>${dists.toLocaleString()}</strong></div>
        <div style="font-size:10px; color:#94A3B8; margin-top:4px;">Click to view district details &rarr;</div>`;
    }
  };

  window.handleStateMouseOut = function(e) {
    const tooltip = document.getElementById('mapTooltip');
    const path = e.target;
    if (path) path.style.fillOpacity = '1';
    if (tooltip) tooltip.style.display = 'none';
  };

  window.handleStateClick = function(stateName, stateId) {
    mapDrillLevel = 'STATE';
    mapSelectedState = stateName;
    currentSelectedMapState = stateName;

    renderIndiaMap();
    if (typeof applyTerritoryFilter === 'function') {
      applyTerritoryFilter(stateName, 'ALL', 'ALL');
    }
  };

  let currentMapZoomScale = 1;
  window.zoomMapIn = function() {
    const svgEl = document.getElementById('indiaMapSvg');
    if (!svgEl) return;
    currentMapZoomScale *= 0.8;
    const current = (svgEl.getAttribute('viewBox') || '0 0 612 696').split(' ').map(Number);
    const nw = current[2] * 0.8;
    const nh = current[3] * 0.8;
    const nx = current[0] + (current[2] - nw) / 2;
    const ny = current[1] + (current[3] - nh) / 2;
    animateViewBox(svgEl, [nx, ny, nw, nh]);
  };

  window.zoomMapOut = function() {
    const svgEl = document.getElementById('indiaMapSvg');
    if (!svgEl) return;
    const current = (svgEl.getAttribute('viewBox') || '0 0 612 696').split(' ').map(Number);
    const nw = Math.min(612, current[2] / 0.8);
    const nh = Math.min(696, current[3] / 0.8);
    const nx = Math.max(0, current[0] - (nw - current[2]) / 2);
    const ny = Math.max(0, current[1] - (nh - current[3]) / 2);
    animateViewBox(svgEl, [nx, ny, nw, nh]);
  };


  function updateStateDetailsPanel(stName) {
    const elTitle = document.getElementById('lblStateDetailsTitle');
    const elBadge = document.getElementById('badgeSelectedState');
    const elScans = document.getElementById('mapStateScans');
    const elBoxes = document.getElementById('mapStateBoxes');
    const elActive = document.getElementById('mapStateActiveRets');
    const elActPct = document.getElementById('mapStateActPct');
    const elTotalRets = document.getElementById('mapStateTotalRets');
    const elInactive = document.getElementById('mapStateInactiveRets');
    const elDistCount = document.getElementById('mapStateDistCount');
    const elVolShare = document.getElementById('mapStateVolShare');
    const btnFilter = document.getElementById('btnStateDrillDown');
    const tblDistBody = document.getElementById('tblMapDistrictBody');
    const elDistSection = document.getElementById('districtBreakdownSection');

    const isAll = !stName || stName === 'ALL';
    const totalNatScans = Math.max(1, filteredScans.length);
    const stScans = isAll ? filteredScans : filteredScans.filter(s => {
      let st = s.State_Name || 'Unknown';
      if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
      return st === stName;
    });
    
    let boxSum = 0;
    const activeRetsSet = new Set();
    const distSet = new Set();

    stScans.forEach(s => {
      boxSum += (s.uom === 'B5' ? 0.5 : 1.0);
      activeRetsSet.add(String(s.status_retailer_id || s.retailer_id));
      if (s.distributor_name) distSet.add(s.distributor_name);
    });

    let totalMasterRets = activeRetsSet.size;
    let stateMasterRetailers = [];
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      stateMasterRetailers = isAll ? dashboardData.all_retailers : dashboardData.all_retailers.filter(r => {
        let st = r.State_Name || r.state || 'Unknown';
        if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
        return st === stName;
      });
      totalMasterRets = stateMasterRetailers.length || activeRetsSet.size;
    }

    const inactiveCount = Math.max(0, totalMasterRets - activeRetsSet.size);
    const actPct = totalMasterRets > 0 ? ((activeRetsSet.size / totalMasterRets) * 100).toFixed(1) : '0.0';
    const volShare = isAll ? '100.0' : ((stScans.length / totalNatScans) * 100).toFixed(1);

    if (elTitle) elTitle.innerHTML = `<i class="fa-solid fa-location-crosshairs text-primary"></i> ${isAll ? 'National' : stName} Overview`;
    if (elBadge) elBadge.textContent = isAll ? 'National View (All States)' : `Selected State: ${stName}`;
    // Show/hide district breakdown
    if (elDistSection) elDistSection.style.display = isAll ? 'none' : 'block';
    if (elScans) elScans.textContent = stScans.length.toLocaleString();
    if (elBoxes) elBoxes.textContent = boxSum.toFixed(1);
    if (elActive) elActive.textContent = activeRetsSet.size.toLocaleString();
    if (elActPct) elActPct.textContent = `${actPct}%`;
    if (elTotalRets) elTotalRets.textContent = totalMasterRets.toLocaleString();
    if (elInactive) elInactive.textContent = inactiveCount.toLocaleString();
    if (elDistCount) elDistCount.textContent = distSet.size.toLocaleString();
    if (elVolShare) elVolShare.textContent = `${volShare}%`;

    // Render District Breakdown Table
    if (tblDistBody) {
      const districtMap = {};
      stateMasterRetailers.forEach(r => {
        const dName = r.district || r.city || 'Unknown District';
        if (!districtMap[dName]) {
          districtMap[dName] = { name: dName, total: 0, active: 0, inactive: 0, scans: 0 };
        }
        districtMap[dName].total++;
        const rid = String(r.status_retailer_id || r.id || r.retailer_id);
        const isActive = activeRetsSet.has(rid);
        if (isActive) districtMap[dName].active++;
        else districtMap[dName].inactive++;
      });

      stScans.forEach(s => {
        const dName = s.district || s.city || 'Unknown District';
        if (!districtMap[dName]) {
          districtMap[dName] = { name: dName, total: 1, active: 1, inactive: 0, scans: 0 };
        }
        districtMap[dName].scans++;
      });

      const districtList = Object.values(districtMap).sort((a, b) => b.total - a.total || b.scans - a.scans);

      if (districtList.length === 0) {
        tblDistBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 12px;">No district records available.</td></tr>`;
      } else {
        tblDistBody.innerHTML = districtList.map(d => `
          <tr>
            <td><strong>${escapeHTML(d.name)}</strong></td>
            <td style="text-align: right; font-weight: 700;">${d.total}</td>
            <td style="text-align: right; color: #34D399; font-weight: 700;">${d.active}</td>
            <td style="text-align: right; color: #FB7185; font-weight: 700;">${d.inactive}</td>
            <td style="text-align: right; color: #818CF8; font-weight: 700;">${d.scans.toLocaleString()}</td>
          </tr>
        `).join('');
      }
    }

    if (btnFilter) {
      btnFilter.onclick = () => {
        if (elFilterState) {
          elFilterState.value = isAll ? 'ALL' : stName;
          applyFilters();
        }
      };
    }
  }function str(val) { return val !== undefined && val !== null ? String(val) : ''; }
// ==========================================
  // DISTRIBUTOR PERFORMANCE LEADERBOARD MATRIX (Section 2 & 4 in Business Requirements)
  // ==========================================
  let currentDistLeaderboardFilter = 'ALL';

  function renderDistributorLeaderboardMatrix(filterType) {
    if (filterType) currentDistLeaderboardFilter = filterType;

    const tbody = document.getElementById('bodyDistributorLeaderboardMatrix');
    if (!tbody) return;

    // Aggregate by distributor
    const distMap = {};
    filteredScans.forEach(s => {
      const dname = s.distributor_name || 'Unknown Distributor';
      if (!distMap[dname]) {
        distMap[dname] = {
          name: dname,
          state: s.distributor_state || s.State_Name || 'N/A',
          scans: 0,
          boxes: 0,
          activeRetailers: new Set(),
          catScans: {}
        };
      }
      distMap[dname].scans += 1;
      distMap[dname].boxes += (s.uom === 'B5' ? 0.5 : 1.0);
      distMap[dname].activeRetailers.add(s.status_retailer_id || s.retailer_id);

      const cat = s.Category_Name || 'Unknown';
      distMap[dname].catScans[cat] = (distMap[dname].catScans[cat] || 0) + 1;
    });

    let distList = Object.values(distMap).sort((a, b) => b.scans - a.scans);

    // Apply Top 10 vs Bottom 10 filter
    if (currentDistLeaderboardFilter === 'TOP10') {
      distList = distList.slice(0, 10);
    } else if (currentDistLeaderboardFilter === 'BOTTOM10') {
      distList = distList.slice(-10);
    }

    if (distList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 20px;">No distributor channel data available.</td></tr>`;
      return;
    }

    tbody.innerHTML = distList.map((d, idx) => {
      const rank = idx + 1;
      let rankBadge = `<span class="rank-badge rank-top">${rank}</span>`;
      if (rank === 1) rankBadge = `<span class="rank-badge rank-gold">🥇 1</span>`;
      else if (rank === 2) rankBadge = `<span class="rank-badge rank-silver">🥈 2</span>`;
      else if (rank === 3) rankBadge = `<span class="rank-badge rank-bronze">🥉 3</span>`;
      else if (rank > 15) rankBadge = `<span class="rank-badge rank-low">${rank}</span>`;

      // Get registered count from master
      const registeredCount = (dashboardData && dashboardData.distributor_retailer_counts && dashboardData.distributor_retailer_counts[d.name]) || Math.max(d.activeRetailers.size, 50);
      const activeCount = d.activeRetailers.size;
      const inactiveCount = Math.max(0, registeredCount - activeCount);
      const actRate = registeredCount > 0 ? ((activeCount / registeredCount) * 100).toFixed(1) : '0.0';
      const avgScans = activeCount > 0 ? (d.scans / activeCount).toFixed(1) : '0.0';

      // Highest & Lowest category
      const catsSorted = Object.entries(d.catScans).sort((a, b) => b[1] - a[1]);
      const topCat = catsSorted.length > 0 ? catsSorted[0][0] : 'N/A';
      const lowCat = catsSorted.length > 1 ? catsSorted[catsSorted.length - 1][0] : topCat;

      return `
        <tr>
          <td style="text-align: center;">${rankBadge}</td>
          <td><strong>${escapeHTML(d.name)}</strong></td>
          <td><span class="badge badge-glow" style="background: rgba(99,102,241,0.1); color: #818CF8;">${escapeHTML(d.state)}</span></td>
          <td style="text-align: right;">${registeredCount.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: #10B981;">${activeCount.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: #F43F5E;">${inactiveCount.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: ${parseFloat(actRate) >= 50 ? '#34D399' : '#F59E0B'};">${actRate}%</td>
          <td style="text-align: right; font-weight: 700; color: #60A5FA;">${d.scans.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${avgScans}</td>
          <td><span class="badge pill-emerald">${escapeHTML(topCat)}</span></td>
          <td><span class="badge pill-lowest">${escapeHTML(lowCat)}</span></td>
        </tr>
      `;
    }).join('');
  }

  window.filterDistributorLeaderboard = function(type) {
    ['btnDistFilterAll', 'btnDistFilterTop', 'btnDistFilterBottom'].forEach(id => {
      const btn = document.getElementById(id);
      if (btn) btn.classList.remove('active');
    });
    if (type === 'ALL') document.getElementById('btnDistFilterAll')?.classList.add('active');
    if (type === 'TOP10') document.getElementById('btnDistFilterTop')?.classList.add('active');
    if (type === 'BOTTOM10') document.getElementById('btnDistFilterBottom')?.classList.add('active');

    renderDistributorLeaderboardMatrix(type);
  };

  // ==========================================
  // STATE X CATEGORY CROSS-TAB MATRIX (Section 7 in Business Requirements)
  // ==========================================
  function renderStateCategoryMatrix() {
    const theadRow = document.getElementById('headerStateCatMatrix');
    const tbody = document.getElementById('bodyStateCatMatrix');
    if (!theadRow || !tbody) return;

    // Collect top 5 states & top 5 categories
    const stateMap = {};
    const catMap = {};
    const stateCatMatrix = {};

    filteredScans.forEach(s => {
      const st = s.State_Name;
      if (!st || st === 'Unknown State' || st === 'Unknown' || st === 'N/A' || st.toLowerCase().includes('unknown')) return;
      const cat = s.Category_Name || 'Unknown Category';
      stateMap[st] = (stateMap[st] || 0) + 1;
      catMap[cat] = (catMap[cat] || 0) + 1;

      if (!stateCatMatrix[st]) stateCatMatrix[st] = {};
      stateCatMatrix[st][cat] = (stateCatMatrix[st][cat] || 0) + 1;
    });

    const topStates = Object.entries(stateMap).sort((a, b) => b[1] - a[1]).slice(0, 7).map(x => x[0]);
    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x[0]);

    if (topStates.length === 0 || topCategories.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px;">No category matrix data available.</td></tr>`;
      return;
    }

    // Build Table Header
    theadRow.innerHTML = `<th>State Name</th>` + topCategories.map(c => `<th style="text-align: right;">${escapeHTML(c)}</th>`).join('') + `<th style="text-align: right;">State Total</th>`;

    // Build Table Body Rows
    tbody.innerHTML = topStates.map(st => {
      let rowTotal = 0;
      let cellsHtml = topCategories.map(cat => {
        const val = (stateCatMatrix[st] && stateCatMatrix[st][cat]) || 0;
        rowTotal += val;
        let cellClass = 'cell-zero';
        if (val >= 5000) cellClass = 'cell-high';
        else if (val >= 1000) cellClass = 'cell-med';
        else if (val > 0) cellClass = 'cell-low';

        return `<td style="text-align: right;" class="${cellClass}">${val > 0 ? val.toLocaleString() : '0'}</td>`;
      }).join('');

      return `
        <tr>
          <td><strong>${escapeHTML(st)}</strong></td>
          ${cellsHtml}
          <td style="text-align: right; font-weight: 800; color: #60A5FA;">${rowTotal.toLocaleString()}</td>
        </tr>
      `;
    }).join('');
  }


  // ==========================================
  // TABBED PORTAL VIEW SWITCHER
  // ==========================================
  window.switchMainView = function(viewId, btnEl) {
    document.querySelectorAll('.view-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    // Scroll smoothly to target section
    if (viewId === 'viewOverview') {
      document.querySelector('.growth-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (viewId === 'viewGeographic') {
      document.getElementById('indiaSvgContainer')?.scrollIntoView({ behavior: 'smooth' });
    } else if (viewId === 'viewDistributors') {
      document.getElementById('tblDistributorLeaderboardMatrix')?.scrollIntoView({ behavior: 'smooth' });
    } else if (viewId === 'viewProducts') {
      document.getElementById('tblStateCategoryMatrix')?.scrollIntoView({ behavior: 'smooth' });
    } else if (viewId === 'viewRetailers') {
      document.getElementById('retailerTierChart')?.scrollIntoView({ behavior: 'smooth' });
    } else if (viewId === 'viewOpportunities') {
      document.querySelector('.opportunity-grid')?.scrollIntoView({ behavior: 'smooth' });
    } else if (viewId === 'viewDataExplorer') {
      document.querySelector('.tables-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter Active vs Inactive Outlets Mode
  window.filterActiveStatusMode = function(statusMode) {
    const elDropdown = document.getElementById('filterActiveStatus');
    if (elDropdown) {
      elDropdown.value = statusMode;
      applyFilters();
    }
  };

  // ==========================================
  // ACTIVE RETAILERS MODAL LOGIC
  // ==========================================
  let activeRetailersList = [];

  function openActiveRetailersModal() {
    // Populate active retailers list with 6-month active retailers
    activeRetailersList = [];
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      dashboardData.all_retailers.forEach((r) => {
        if (Number(r.is_active_6m) === 1) {
          activeRetailersList.push({
            id: r.status_retailer_id || r.id || r.retailer_id,
            name: r.retailer_name || r.name || `Retailer ${r.id}`,
            mobile: r.mobile_number || r.mobile || 'N/A',
            city: r.city || 'N/A',
            state: r.State_Name || r.state || 'N/A',
            scansCount: r.scans_6m || 0,
            boxCount: r.boxes_6m || 0
          });
        }
      });
      activeRetailersList.sort((a, b) => b.scansCount - a.scansCount);
    }

    renderActiveModalTable();
    renderActiveModalCharts();

    const modal = document.getElementById('activeRetailersModal');
    if (modal) modal.classList.add('show');
  }

  function closeActiveRetailersModal() {
    const modal = document.getElementById('activeRetailersModal');
    if (modal) modal.classList.remove('show');
  }

  function toggleActiveModalTab(tab) {
    const vVisuals = document.getElementById('activeViewVisuals');
    const vData = document.getElementById('activeViewData');
    const btnV = document.getElementById('btnActiveVisuals');
    const btnD = document.getElementById('btnActiveData');

    if (tab === 'visuals') {
      if (vVisuals) vVisuals.style.display = 'block';
      if (vData) vData.style.display = 'none';
      if (btnV) btnV.classList.add('active');
      if (btnD) btnD.classList.remove('active');
    } else {
      if (vVisuals) vVisuals.style.display = 'none';
      if (vData) vData.style.display = 'block';
      if (btnV) btnV.classList.remove('active');
      if (btnD) btnD.classList.add('active');
    }
  }

  function renderActiveModalTable() {
    const tbody = document.getElementById('tblActiveBody');
    const q = document.getElementById('activeRetailersSearch') ? document.getElementById('activeRetailersSearch').value.trim().toLowerCase() : '';
    if (!tbody) return;

    const filtered = activeRetailersList.filter(r => {
      return String(r.id).toLowerCase().includes(q) ||
             r.name.toLowerCase().includes(q) ||
             r.mobile.toLowerCase().includes(q) ||
             r.city.toLowerCase().includes(q) ||
             r.state.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 24px;">No active retailers match search.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const tier = r.scansCount > 50 ? 'Gold (>50)' : r.scansCount >= 21 ? 'Silver (21-50)' : r.scansCount >= 5 ? 'Bronze (5-20)' : 'Low (<5)';
      const tierClass = tier.includes('Gold') ? 'tier-gold' : tier.includes('Silver') ? 'tier-silver' : tier.includes('Bronze') ? 'tier-bronze' : 'tier-low';
      return `
        <tr>
          <td><span style="font-family: monospace; color: var(--text-secondary);">${r.id}</span></td>
          <td><strong>${escapeHTML(r.name)}</strong></td>
          <td><span style="font-family: monospace;">${escapeHTML(r.mobile)}</span></td>
          <td>${escapeHTML(r.city)}</td>
          <td><span class="badge badge-glow" style="background: rgba(99,102,241,0.1); color: #818CF8;">${escapeHTML(r.state)}</span></td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${r.boxCount.toFixed(1)}</td>
          <td style="text-align: right; font-weight: 700; color: #10B981;">${r.scansCount.toLocaleString()}</td>
          <td><span class="badge-tier ${tierClass}">${tier}</span></td>
        </tr>
      `;
    }).join('');
  }

  let activeModalBarChart = null;

  function renderActiveModalCharts() {
    const ctxBar = document.getElementById('chartActiveBar')?.getContext('2d');
    if (activeModalBarChart) activeModalBarChart.destroy();

    const stateMap = {};
    activeRetailersList.forEach(r => {
      const st = r.state || r.State_Name || 'Unknown';
      stateMap[st] = (stateMap[st] || 0) + 1;
    });

    const limitMode = (document.getElementById('selActiveStateLimit')?.value) || 'ALL';
    let allStates = Object.entries(stateMap).sort((a, b) => b[1] - a[1]);

    let sortedStates = [];
    if (limitMode === 'LOW10') {
      sortedStates = [...allStates].sort((a, b) => a[1] - b[1]).slice(0, 10);
    } else if (limitMode === 'TOP10') {
      sortedStates = [...allStates].slice(0, 10);
    } else {
      sortedStates = [...allStates]; // ALL States
    }

    const stateBarLabels = sortedStates.map(x => x[0]);
    const stateBarData = sortedStates.map(x => x[1]);

    if (ctxBar) {
      activeModalBarChart = new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: stateBarLabels,
          datasets: [{
            label: 'Active Retailers',
            data: stateBarData,
            backgroundColor: 'rgba(16,185,129,0.85)',
            borderColor: '#34D399',
            borderWidth: 1,
            borderRadius: 4,
            minBarLength: 8
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          onHover: (evt, elements) => {
            const target = evt?.native?.target || evt?.target;
            if (target) target.style.cursor = 'pointer';
          },
          onClick: (evt, elements, chart) => {
            let active = elements;
            if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
              try { active = chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true); } catch (e) {}
            }
            let idx = -1;
            if (active && active.length > 0) {
              idx = active[0].index;
            } else if (chart && chart.scales && chart.scales.y && evt.y !== undefined) {
              const yVal = Math.round(chart.scales.y.getValueForPixel(evt.y));
              if (yVal >= 0 && yVal < sortedStates.length) idx = yVal;
            }
            if (idx >= 0 && idx < sortedStates.length) {
              const stateName = stateBarLabels[idx];
              if (stateName) {
                closeActiveRetailersModal();
                openStateDistributorDrilldown(stateName, 'active');
              }
            }
          },
          plugins: {
            legend: { display: false },
            datalabels: { display: true, color: '#FFF', anchor: 'end', align: 'start', font: { size: 9, weight: 'bold' }, formatter: v => v.toLocaleString() },
            tooltip: { callbacks: { label: ctx => ` 🟢 ${ctx.parsed.x.toLocaleString()} Active Retailers — click to view distributor breakdown` } }
          },
          scales: {
            x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#CBD5E1', font: { size: 9 } }, grid: { display: false } }
          }
        }
      });
    }
  }

  window.renderActiveModalCharts = renderActiveModalCharts;

  function exportActiveExcel() {
    if (activeRetailersList.length === 0) {
      alert('No active retailer data available to export.');
      return;
    }
    const wb = XLSX.utils.book_new();
    const exportData = activeRetailersList.map(r => ({
      "Retailer ID": r.id,
      "Retailer Name": r.name,
      "Mobile Number": r.mobile,
      "City": r.city,
      "State": r.state,
      "Scanned Boxes": r.boxCount,
      "Total Scans": r.scansCount
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Active_Retailers");
    XLSX.writeFile(wb, "JGH_Active_Retailers_List_July2026.xlsx");
  }

  window.openActiveRetailersModal = openActiveRetailersModal;
  window.closeActiveRetailersModal = closeActiveRetailersModal;
  window.toggleActiveModalTab = toggleActiveModalTab;
  window.exportActiveExcel = exportActiveExcel;
  function toggleDormantModalTab(tab) {
    const vVisuals = document.getElementById('dormantViewVisuals');
    const vData = document.getElementById('dormantViewData');
    const btnV = document.getElementById('btnDormantVisuals');
    const btnD = document.getElementById('btnDormantData');

    if (tab === 'visuals') {
      if (vVisuals) vVisuals.style.display = 'block';
      if (vData) vData.style.display = 'none';
      if (btnV) btnV.classList.add('active');
      if (btnD) btnD.classList.remove('active');
    } else {
      if (vVisuals) vVisuals.style.display = 'none';
      if (vData) vData.style.display = 'block';
      if (btnV) btnV.classList.remove('active');
      if (btnD) btnD.classList.add('active');
    }
  }
  window.toggleDormantModalTab = toggleDormantModalTab;
window.openUpsellModal = openUpsellModal;
  window.openPendingModal = openPendingModal;

  // ═══════════════════════════════════════════════════════════
  // STATE GROWTH OPPORTUNITY INTELLIGENCE
  // ═══════════════════════════════════════════════════════════
  let growthOpportunityData = [];
  let growthModalCharts = {};

  function buildGrowthOpportunityData() {
    const stateMap = {};

    // 1. Gather all statistics per state from all_retailers list (using 6-month status)
    const retailersList = (dashboardData && Array.isArray(dashboardData.all_retailers)) 
      ? dashboardData.all_retailers 
      : [];

    retailersList.forEach(r => {
      let st = r.State_Name || r.state || '';
      if (!st || st === 'N/A' || st === 'Unknown' || st === 'Unknown State' || st.toLowerCase().includes('unknown')) return;
      if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
      
      if (!stateMap[st]) {
        stateMap[st] = { 
          state: st, 
          totalRegistered: 0, 
          activeCount: 0, 
          inactiveCount: 0, 
          scans: 0, 
          boxes: 0 
        };
      }
      
      stateMap[st].totalRegistered++;
      if (Number(r.is_active_6m) === 1) {
        stateMap[st].activeCount++;
      } else {
        stateMap[st].inactiveCount++;
      }
    });

    // 2. Aggregate July scan data from filteredScans
    filteredScans.forEach(s => {
      let st = s.State_Name || s.state || '';
      if (!st || st === 'N/A' || st === 'Unknown' || st === 'Unknown State' || st.toLowerCase().includes('unknown')) return;
      if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
      
      if (stateMap[st]) {
        stateMap[st].scans++;
        stateMap[st].boxes += (s.uom === 'B5' ? 0.5 : 1.0);
      }
    });

    // 3. Compute metrics for each state
    growthOpportunityData = Object.values(stateMap).map(d => {
      const activationPct = d.totalRegistered > 0 ? (d.activeCount / d.totalRegistered) * 100 : 0;
      // Opportunity Score: inactiveCount weighted by non-activation rate
      const opportunityScore = Math.round(d.inactiveCount * (1 - activationPct / 100) * 10 + d.inactiveCount);
      return {
        state: d.state,
        totalRegistered: d.totalRegistered,
        activeCount: d.activeCount,
        inactiveCount: d.inactiveCount,
        activationPct: Math.round(activationPct * 10) / 10,
        scans: d.scans,
        boxes: Math.round(d.boxes * 10) / 10,
        opportunityScore
      };
    }).sort((a, b) => b.opportunityScore - a.opportunityScore);

    // High opportunity states: states with < 75% activation or > 30 inactive retailers
    const totalInactiveCount = growthOpportunityData.reduce((sum, d) => sum + d.inactiveCount, 0);
    const elCount = document.getElementById('kpiGrowthOpportunityCount');
    if (elCount) elCount.textContent = totalInactiveCount.toLocaleString();
    const elSub = document.getElementById('kpiGrowthOpportunitySub');
    if (elSub && growthOpportunityData.length > 0) {
      elSub.textContent = `${growthOpportunityData[0].state} has highest inactive retailers (${growthOpportunityData[0].inactiveCount.toLocaleString()} non-scanning stores)`;
    }
    const elOppCount = document.getElementById('oppGrowthCount');
    if (elOppCount) elOppCount.textContent = `${growthOpportunityData.length} States`;
  }

    let currentOpportunitySort = 'ACTIVATION_ASC';
  function setOpportunitySort(sortMode) {
    currentOpportunitySort = sortMode;
    if (typeof renderMainStateOpportunity === 'function') {
      renderMainStateOpportunity();
    }
  }
  window.setOpportunitySort = setOpportunitySort;

  function renderMainStateOpportunity() {
    const tbody = document.getElementById('tblMainStateOpportunityBody');
    if (!tbody) return;

    // Filter out states with 0 active retailers and Unknown state, sort by activationPct ascending (lowest to highest)
    const sortedOpportunity = growthOpportunityData
      .filter(d => d.totalRegistered > 0 && d.activeCount > 0 && d.state && d.state !== 'Unknown State' && d.state !== 'Unknown' && d.state !== 'N/A' && !d.state.toLowerCase().includes('unknown'))
      .sort((a, b) => a.activationPct - b.activationPct);
    
    tbody.innerHTML = sortedOpportunity.map((d, i) => {
      return `
        <tr style="cursor: pointer;" onclick="openStateDistributorDrilldown('${d.state.replace(/'/g, "\\'")}')" title="Click to view distributor drilldown analysis">
          <td><strong>${i + 1}</strong></td>
          <td>
            <strong>${d.state}</strong>
            <span style="font-size: 9px; color: #60A5FA; font-weight: normal; margin-left: 4px;"><i class="fa-solid fa-magnifying-glass-chart"></i> View Details</span>
          </td>
          <td style="text-align: right;">${d.totalRegistered.toLocaleString()}</td>
          <td style="text-align: right; color: #10B981; font-weight: 600;">${d.activeCount.toLocaleString()}</td>
          <td style="text-align: right; color: #F43F5E; font-weight: 600;">${d.inactiveCount.toLocaleString()}</td>
          <td style="text-align: right; color: #FBBF24; font-weight: 700;">${d.activationPct}%</td>
        </tr>
      `;
    }).join('');

    // Destroy existing chart if it exists
    if (charts.mainStateOpportunity) {
      try { charts.mainStateOpportunity.destroy(); } catch (e) {}
    }

    const ctx = document.getElementById('chartMainStateOpportunity');
    if (!ctx) return;

    charts.mainStateOpportunity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sortedOpportunity.map(d => d.state),
        datasets: [{
          label: 'Activation Rate %',
          data: sortedOpportunity.map(d => d.activationPct),
          backgroundColor: 'rgba(99, 102, 241, 0.75)',
          borderColor: '#818CF8',
          borderWidth: 1,
          borderRadius: 3
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'nearest', intersect: false },
        onHover: (evt, elements) => {
          const target = evt?.native?.target || evt?.target;
          if (target) target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
        },
        onClick: (event, elements, chart) => {
          let active = elements;
          if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
            try { active = chart.getElementsAtEventForMode(event.native || event, 'nearest', { intersect: false }, true); } catch (e) {}
          }
          if (active && active.length > 0) {
            const idx = active[0].index;
            const clickedState = sortedOpportunity[idx]?.state;
            if (clickedState && typeof openStateDistributorDrilldown === 'function') {
              openStateDistributorDrilldown(clickedState, 'all');
            }
          }
        },
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            color: '#FFFFFF',
            anchor: 'end',
            align: 'start',
            font: { weight: 'bold', size: 9 },
            formatter: (v) => v + '%'
          },
          tooltip: {
            backgroundColor: 'rgba(8,18,36,0.95)',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderWidth: 1,
            callbacks: {
              label: (ctx2) => {
                const d = sortedOpportunity[ctx2.dataIndex];
                return [
                  ` Activation Rate: ${d.activationPct}%`,
                  ` Registered Retailers: ${d.totalRegistered.toLocaleString()}`,
                  ` Active Retailers (6M): ${d.activeCount.toLocaleString()}`,
                  ` Inactive Retailers Gap: ${d.inactiveCount.toLocaleString()}`,
                  ` July 2026 Scans: ${d.scans.toLocaleString()}`
                ];
              }
            }
          }
        },
        scales: {
          x: { 
            ticks: { color: '#94A3B8' }, 
            grid: { color: 'rgba(255,255,255,0.05)' },
            max: 100
          },
          y: { ticks: { color: '#CBD5E1', font: { size: 9 } }, grid: { display: false } }
        }
      }
    });
  }


  function openGrowthOpportunityModal() {
    try {
      buildGrowthOpportunityData();

      const modal = document.getElementById('modalGrowthOpportunity');
      if (!modal) { console.error('[Growth Modal] #modalGrowthOpportunity not found in DOM'); return; }
      modal.style.display = 'flex';
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';

      const elVisuals = document.getElementById('growthViewVisuals');
      const elData    = document.getElementById('growthViewData');
      const btnVis    = document.getElementById('btnGrowthVisuals');
      const btnDat    = document.getElementById('btnGrowthData');

      if (elVisuals) elVisuals.style.display = 'block';
      if (elData)    elData.style.display    = 'none';
      if (btnVis)  { btnVis.classList.add('active'); }
      if (btnDat)  { btnDat.classList.remove('active'); }

      renderGrowthStatCards();
      renderGrowthInsightCards();
      setTimeout(() => {
        renderGrowthBubbleChart();
        renderGrowthBarChart();
        renderGrowthGapChart();
      }, 120);
      renderGrowthTable(growthOpportunityData);
    } catch(err) {
      console.error('[Growth Modal] Error opening modal:', err);
    }
  }

  function renderGrowthStatCards() {
    const el = document.getElementById('growthStatCards');
    if (!el || !growthOpportunityData.length) return;
    const total = growthOpportunityData.reduce((a, b) => a + b.totalRegistered, 0);
    const totalActive = growthOpportunityData.reduce((a, b) => a + b.activeCount, 0);
    const totalInactive = growthOpportunityData.reduce((a, b) => a + b.inactiveCount, 0);
    const topState = growthOpportunityData[0];
    const avgAct = growthOpportunityData.length > 0
      ? (growthOpportunityData.reduce((a, b) => a + b.activationPct, 0) / growthOpportunityData.length).toFixed(1)
      : 0;
    el.innerHTML = `
      <div class="modal-stat-card"><div class="stat-value">${growthOpportunityData.length}</div><div class="stat-label">States Analysed</div></div>
      <div class="modal-stat-card"><div class="stat-value">${total.toLocaleString()}</div><div class="stat-label">Total Registered Retailers</div></div>
      <div class="modal-stat-card"><div class="stat-value" style="color:#10B981">${totalActive.toLocaleString()}</div><div class="stat-label">Active (Scanning)</div></div>
      <div class="modal-stat-card"><div class="stat-value" style="color:#F43F5E">${totalInactive.toLocaleString()}</div><div class="stat-label">Inactive (Opportunity)</div></div>
      <div class="modal-stat-card"><div class="stat-value" style="color:#FBBF24">${avgAct}%</div><div class="stat-label">Avg Activation Rate</div></div>
      <div class="modal-stat-card"><div class="stat-value" style="font-size:13px;color:#FB7185">${topState ? topState.state : '--'}</div><div class="stat-label">Top Target State</div></div>
    `;
  }

  function renderGrowthInsightCards() {
    const el = document.getElementById('growthInsightCards');
    if (!el || !growthOpportunityData.length) return;
    const top3 = growthOpportunityData.slice(0, 3);
    el.innerHTML = top3.map((d, i) => {
      const priority = i === 0 ? '🔴 Critical' : i === 1 ? '🟠 High' : '🟡 Medium';
      const action = d.activationPct < 30 ? 'Deploy field sales team immediately'
        : d.activationPct < 60 ? 'Run targeted re-activation campaign'
        : 'Enhance distributor incentives';
      return `<div class="chart-card" style="border-left: 3px solid ${i===0?'#F43F5E':i===1?'#F59E0B':'#FCD34D'}; padding: 14px;">
        <div style="font-size:10px; color:var(--text-muted); font-weight:700; margin-bottom:4px;">${priority} — RANK #${i+1}</div>
        <div style="font-size:15px; font-weight:800; color:var(--text-primary);">${d.state}</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:10px 0;">
          <div><div style="font-size:18px; font-weight:900; color:#F43F5E;">${d.activationPct}%</div><div style="font-size:10px; color:var(--text-muted);">Activation Rate</div></div>
          <div><div style="font-size:18px; font-weight:900; color:#FB7185;">${d.inactiveCount.toLocaleString()}</div><div style="font-size:10px; color:var(--text-muted);">Inactive Retailers</div></div>
        </div>
        <div style="font-size:11px; color:#FCD34D; margin-top:6px;">💡 ${action}</div>
      </div>`;
    }).join('');
  }

  function _destroyGrowthChart(key) {
    if (growthModalCharts[key]) { try { growthModalCharts[key].destroy(); } catch(e){} delete growthModalCharts[key]; }
  }

  function renderGrowthBubbleChart() {
    _destroyGrowthChart('bubble');
    const ctx = document.getElementById('chartGrowthBubble');
    if (!ctx) return;
    const colors = ['#F43F5E','#F59E0B','#6366F1','#10B981','#06B6D4','#8B5CF6','#EC4899','#14B8A6','#F97316','#84CC16','#A78BFA','#34D399','#FB923C','#38BDF8','#FBBF24'];
    const maxScore = Math.max(...growthOpportunityData.map(d => d.opportunityScore), 1);
    const datasets = growthOpportunityData.map((d, i) => ({
      label: d.state,
      data: [{ x: d.totalRegistered, y: d.activationPct, r: Math.max(6, Math.min(30, (d.opportunityScore / maxScore) * 30)) }],
      backgroundColor: (colors[i % colors.length]).replace(')', ',0.75)').replace('rgb', 'rgba').replace('#', '').split('').reduce ? colors[i % colors.length] + 'BF' : colors[i % colors.length],
      borderColor: colors[i % colors.length],
      borderWidth: 1.5,
    }));
    growthModalCharts['bubble'] = new Chart(ctx, {
      type: 'bubble',
      data: { datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            formatter: (val, ctx2) => ctx2.dataset.label,
            color: '#CBD5E1', font: { size: 9, weight: '600' }, anchor: 'center', align: 'top', offset: 4
          },
          tooltip: {
            backgroundColor: 'rgba(8,18,36,0.95)', borderColor: 'rgba(244,63,94,0.5)', borderWidth: 1,
            callbacks: {
              label: (ctx2) => {
                const d = growthOpportunityData.find(x => x.state === ctx2.dataset.label);
                if (!d) return '';
                return [
                  ` 📍 ${d.state}`,
                  ` 🏪 Retailers: ${d.totalRegistered.toLocaleString()}`,
                  ` ✅ Active: ${d.activeCount} (${d.activationPct}%)`,
                  ` ❌ Inactive: ${d.inactiveCount}`,
                  ` 🎯 Opp. Score: ${d.opportunityScore}`
                ];
              },
              title: () => ''
            }
          }
        },
        scales: {
          x: { title: { display: true, text: 'Total Registered Retailers', color: '#64748B' }, ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { title: { display: true, text: 'Activation Rate (%)', color: '#64748B' }, ticks: { color: '#94A3B8', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: 110 }
        }
      }
    });
  }

  function renderGrowthBarChart() {
    _destroyGrowthChart('bar');
    const ctx = document.getElementById('chartGrowthBar');
    if (!ctx) return;
    const top10 = growthOpportunityData.slice(0, 10);
    const bgColors = top10.map((_, i) => i === 0 ? 'rgba(244,63,94,0.9)' : i < 3 ? 'rgba(245,158,11,0.85)' : 'rgba(99,102,241,0.75)');
    growthModalCharts['bar'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top10.map(d => d.state),
        datasets: [{
          label: 'Opportunity Score',
          data: top10.map(d => d.opportunityScore),
          backgroundColor: bgColors,
          borderRadius: 5,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: {
          legend: { display: false },
          datalabels: { color: '#CBD5E1', font: { size: 10, weight: '700' }, anchor: 'end', align: 'right' },
          tooltip: {
            backgroundColor: 'rgba(8,18,36,0.95)', borderColor: 'rgba(244,63,94,0.4)', borderWidth: 1,
            callbacks: {
              label: (ctx2) => {
                const d = top10[ctx2.dataIndex];
                return [` Score: ${d.opportunityScore}`, ` Inactive: ${d.inactiveCount} retailers`, ` Activation: ${d.activationPct}%`];
              }
            }
          }
        },
        scales: {
          x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#E2E8F0', font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  }

  function renderGrowthGapChart() {
    _destroyGrowthChart('gap');
    const ctx = document.getElementById('chartGrowthGap');
    if (!ctx) return;
    const sorted = [...growthOpportunityData].sort((a, b) => b.totalRegistered - a.totalRegistered);
    growthModalCharts['gap'] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sorted.map(d => d.state),
        datasets: [
          { label: 'Active Retailers', data: sorted.map(d => d.activeCount), backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 3 },
          { label: 'Inactive (Gap)', data: sorted.map(d => d.inactiveCount), backgroundColor: 'rgba(244,63,94,0.65)', borderRadius: 3 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: '#CBD5E1', font: { size: 11 } } },
          datalabels: { display: false },
          tooltip: {
            mode: 'index', intersect: false,
            backgroundColor: 'rgba(8,18,36,0.95)', borderColor: 'rgba(244,63,94,0.3)', borderWidth: 1,
            callbacks: {
              label: ctx2 => ` ${ctx2.dataset.label}: ${ctx2.parsed.y.toLocaleString()}`,
              afterBody: (items) => {
                const d = sorted[items[0]?.dataIndex];
                if (!d) return [];
                return [``, ` Activation: ${d.activationPct}%`, ` Scans: ${d.scans.toLocaleString()}`];
              }
            }
          }
        },
        scales: {
          x: { stacked: true, ticks: { color: '#94A3B8', maxRotation: 35, font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: { stacked: true, ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  function renderGrowthTable(data) {
    const tbody = document.getElementById('tbodyGrowthOpportunity');
    if (!tbody) return;
    tbody.innerHTML = data.map((d, i) => {
      const priority = d.activationPct < 30 ? '<span style="color:#F43F5E;font-weight:700;">🔴 Critical</span>'
        : d.activationPct < 60 ? '<span style="color:#F59E0B;font-weight:700;">🟠 High</span>'
        : d.activationPct < 80 ? '<span style="color:#FCD34D;font-weight:700;">🟡 Medium</span>'
        : '<span style="color:#10B981;font-weight:700;">🟢 Good</span>';
      const action = d.activationPct < 30 ? 'Deploy field team immediately'
        : d.activationPct < 60 ? 'Run re-activation campaign'
        : d.activationPct < 80 ? 'Boost distributor incentives'
        : 'Maintain & sustain growth';
      return `<tr>
        <td><strong>${i + 1}</strong></td>
        <td><strong>${d.state}</strong></td>
        <td style="text-align:right;">${d.totalRegistered.toLocaleString()}</td>
        <td style="text-align:right;color:#10B981;font-weight:600;">${d.activeCount.toLocaleString()}</td>
        <td style="text-align:right;color:#F43F5E;font-weight:600;">${d.inactiveCount.toLocaleString()}</td>
        <td style="text-align:right;font-weight:700;color:${d.activationPct < 60 ? '#F43F5E' : '#10B981'}">${d.activationPct}%</td>
        <td style="text-align:right;">${d.scans.toLocaleString()}</td>
        <td style="text-align:right;">${d.boxes.toFixed(1)}</td>
        <td style="text-align:right;font-weight:800;color:#FBBF24;">${d.opportunityScore.toLocaleString()}</td>
        <td>${priority}</td>
        <td style="font-size:11px;color:var(--text-muted);">${action}</td>
      </tr>`;
    }).join('');
  }

  function closeGrowthOpportunityModal() {
    const modal = document.getElementById('modalGrowthOpportunity');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.style.overflow = '';
      Object.keys(growthModalCharts).forEach(k => { try { growthModalCharts[k].destroy(); } catch(e){} });
      growthModalCharts = {};
    }
  }
  window.closeGrowthOpportunityModal = closeGrowthOpportunityModal;

  document.getElementById('btnCloseGrowth')?.addEventListener('click', closeGrowthOpportunityModal);

  let activeInactiveSubTab = 'state';

  function switchInactiveSubTab(subTab) {
    activeInactiveSubTab = subTab;
    const btnState = document.getElementById('btnInactiveSubState');
    const btnStores = document.getElementById('btnInactiveSubStores');
    const wrapState = document.getElementById('wrapperInactiveStateTable');
    const wrapStores = document.getElementById('wrapperInactiveStoresTable');

    if (subTab === 'stores') {
      if (btnState) { btnState.className = 'btn btn-sm btn-outline'; }
      if (btnStores) { btnStores.className = 'btn btn-sm btn-primary'; }
      if (wrapState) wrapState.style.display = 'none';
      if (wrapStores) wrapStores.style.display = 'block';
      const q = (document.getElementById('growthSearch')?.value || '').toLowerCase();
      renderInactiveStoresRawTable(q);
    } else {
      if (btnState) { btnState.className = 'btn btn-sm btn-primary'; }
      if (btnStores) { btnStores.className = 'btn btn-sm btn-outline'; }
      if (wrapState) wrapState.style.display = 'block';
      if (wrapStores) wrapStores.style.display = 'none';
      const q = (document.getElementById('growthSearch')?.value || '').toLowerCase();
      renderGrowthTable(growthOpportunityData.filter(d => d.state.toLowerCase().includes(q)));
    }
  }
  window.switchInactiveSubTab = switchInactiveSubTab;

  function renderInactiveStoresRawTable(filterQuery = '') {
    const tbody = document.getElementById('tbodyInactiveStoresRaw');
    if (!tbody) return;

    const retailersList = (dashboardData && Array.isArray(dashboardData.all_retailers))
      ? dashboardData.all_retailers
      : [];

    const inactiveRetailers = retailersList.filter(r => Number(r.is_active_6m) !== 1);
    const q = filterQuery.toLowerCase().trim();

    const filtered = q ? inactiveRetailers.filter(r => {
      const rName = (r.retailer_name || r.name || '').toLowerCase();
      const st = (r.State_Name || r.state || '').toLowerCase();
      const city = (r.city || r.district || '').toLowerCase();
      const dist = (r.distributor_name || '').toLowerCase();
      const mob = String(r.mobile_number || r.mobile || '').toLowerCase();
      return rName.includes(q) || st.includes(q) || city.includes(q) || dist.includes(q) || mob.includes(q);
    }) : inactiveRetailers;

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px; color: var(--text-muted);">No inactive retailers match search query "${escapeHTML(q)}".</td></tr>`;
      return;
    }

    const displayList = filtered.slice(0, 500);

    tbody.innerHTML = displayList.map((r, i) => {
      const rName = r.retailer_name || r.name || `Retailer #${r.status_retailer_id || r.id}`;
      const mob = r.mobile_number || r.mobile || 'N/A';
      const st = r.State_Name || r.state || 'N/A';
      const city = r.city || r.district || 'N/A';
      const dist = r.distributor_name || 'N/A';

      return `<tr>
        <td><strong>${i + 1}</strong></td>
        <td>
          <strong style="color: var(--text-primary);">${escapeHTML(rName)}</strong>
          <div style="font-size: 10px; color: var(--text-muted);">ID: ${r.status_retailer_id || r.id || 'N/A'}</div>
        </td>
        <td><i class="fa-solid fa-phone text-muted" style="font-size:10px;"></i> ${escapeHTML(mob)}</td>
        <td><span class="badge" style="background: rgba(244,63,94,0.15); color: #FB7185; border: 1px solid rgba(244,63,94,0.3);">${escapeHTML(st)}</span></td>
        <td>${escapeHTML(city)}</td>
        <td><i class="fa-solid fa-warehouse text-indigo" style="font-size:10px;"></i> ${escapeHTML(dist)}</td>
        <td><span class="badge badge-inactive" style="background: rgba(244,63,94,0.2); color: #FB7185;"><i class="fa-solid fa-circle-xmark"></i> Inactive (0 Scans)</span></td>
      </tr>`;
    }).join('');
  }

  document.getElementById('btnGrowthVisuals')?.addEventListener('click', () => {
    document.getElementById('growthViewVisuals').style.display = 'block';
    document.getElementById('growthViewData').style.display = 'none';
    document.getElementById('btnGrowthVisuals').classList.add('active');
    document.getElementById('btnGrowthData').classList.remove('active');
  });
  document.getElementById('btnGrowthData')?.addEventListener('click', () => {
    document.getElementById('growthViewData').style.display = 'block';
    document.getElementById('growthViewVisuals').style.display = 'none';
    document.getElementById('btnGrowthData').classList.add('active');
    document.getElementById('btnGrowthVisuals').classList.remove('active');
    switchInactiveSubTab(activeInactiveSubTab);
  });

  document.getElementById('btnInactiveSubState')?.addEventListener('click', () => switchInactiveSubTab('state'));
  document.getElementById('btnInactiveSubStores')?.addEventListener('click', () => switchInactiveSubTab('stores'));

  // Unified Search filter for both sub-tabs
  document.getElementById('growthSearch')?.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    if (activeInactiveSubTab === 'stores') {
      renderInactiveStoresRawTable(q);
    } else {
      renderGrowthTable(growthOpportunityData.filter(d => d.state.toLowerCase().includes(q)));
    }
  });

  // Multi-sheet Excel export
  document.getElementById('btnExportGrowthExcel')?.addEventListener('click', () => {
    if (typeof XLSX === 'undefined') { alert('XLSX library not loaded.'); return; }
    
    // Sheet 1: State Inactive Summary
    const stateRows = growthOpportunityData.map((d, i) => ({
      'Rank': i + 1, 'State Name': d.state,
      'Total Registered Stores': d.totalRegistered, 'Active Stores': d.activeCount,
      'Inactive Retailers': d.inactiveCount, 'Activation %': d.activationPct,
      'Total Scans': d.scans, 'Box Volume': d.boxes,
      'Priority Tier': d.activationPct < 30 ? 'Critical' : d.activationPct < 60 ? 'High' : d.activationPct < 80 ? 'Medium' : 'Good'
    }));

    // Sheet 2: Raw Store-by-Store List
    const retailersList = (dashboardData && Array.isArray(dashboardData.all_retailers))
      ? dashboardData.all_retailers
      : [];
    const inactiveRetailers = retailersList.filter(r => Number(r.is_active_6m) !== 1);

    const storeRows = inactiveRetailers.map((r, i) => ({
      '#': i + 1,
      'Retailer ID': r.status_retailer_id || r.id || '',
      'Retailer Name': r.retailer_name || r.name || '',
      'Mobile Number': r.mobile_number || r.mobile || '',
      'State Name': r.State_Name || r.state || '',
      'City / District': r.city || r.district || '',
      'Mapped Distributor': r.distributor_name || '',
      'Status': 'Inactive (0 Scans)'
    }));

    const wb = XLSX.utils.book_new();
    const wsState = XLSX.utils.json_to_sheet(stateRows);
    const wsStores = XLSX.utils.json_to_sheet(storeRows);

    XLSX.utils.book_append_sheet(wb, wsState, 'State_Inactive_Summary');
    XLSX.utils.book_append_sheet(wb, wsStores, 'All_Inactive_Retailers_Raw');
    XLSX.writeFile(wb, 'Inactive_Retailers_Statewise_Analysis.xlsx');
  });

  let currentDrilldownState = '';
  let drilldownRetailers = [];
  let chartDrilldownInstance = null;
  let currentDrilldownSource = 'all'; // 'active' | 'inactive' | 'all'
  let currentDrilldownTimePeriod = '6m'; // '6m' or 'july'
  let currentDrilldownStatusFilter = 'all'; // 'all', 'active', 'inactive'
  let chartDrilldownTop10Cat = null;
  let chartDrilldownLow10Cat = null;
  let chartDrilldownDistScanVol = null;
  let chartDrilldownRetailerScans = null;
  let drilldownDistSortDir = 'DESC';

  function formatCleanDistName(rawName) {
    if (!rawName) return 'Unknown Distributor';
    let s = String(rawName).replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (s.length > 25) {
      const parts = s.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const nonNumberParts = parts.filter(p => !/^\d+$/.test(p));
        if (nonNumberParts.length >= 2) {
          const candidate = nonNumberParts[0] + ', ' + nonNumberParts[nonNumberParts.length - 1];
          if (candidate.length <= 26) return candidate;
        }
        if (nonNumberParts.length >= 1 && nonNumberParts[0].length <= 25) {
          return nonNumberParts[0];
        }
      }
      return s.slice(0, 24) + '...';
    }
    return s;
  }

  function toggleDistributorNetworkSort() {
    drilldownDistSortDir = (drilldownDistSortDir === 'DESC') ? 'ASC' : 'DESC';
    const btn = document.getElementById('btnToggleDistSort');
    const icon = document.getElementById('iconDistSort');
    const lbl = document.getElementById('lblDistSortText');
    if (drilldownDistSortDir === 'DESC') {
      if (icon) icon.className = 'fa-solid fa-arrow-down-wide-short';
      if (lbl) lbl.textContent = 'Sort: High to Low (DESC)';
      if (btn) btn.style.background = 'rgba(99, 102, 241, 0.2)';
    } else {
      if (icon) icon.className = 'fa-solid fa-arrow-up-wide-short';
      if (lbl) lbl.textContent = 'Sort: Low to High (ASC)';
      if (btn) btn.style.background = 'rgba(16, 185, 129, 0.2)';
    }
    renderDrilldownChart();
  }
  window.toggleDistributorNetworkSort = toggleDistributorNetworkSort;

  function setDrilldownTimePeriod(period) {
    currentDrilldownTimePeriod = period;
    document.getElementById('btnDrilldownJuly')?.classList.toggle('active', period === 'july');
    document.getElementById('btnDrilldown6M')?.classList.toggle('active', period === '6m');
    openStateDistributorDrilldown(currentDrilldownState, currentDrilldownSource);
  }
  window.setDrilldownTimePeriod = setDrilldownTimePeriod;

  function setDrilldownStatusFilter(status) {
    currentDrilldownStatusFilter = status;
    currentDrilldownSource = status;
    document.getElementById('btnDrilldownAll')?.classList.toggle('active', status === 'all');
    document.getElementById('btnDrilldownActive')?.classList.toggle('active', status === 'active');
    document.getElementById('btnDrilldownInactive')?.classList.toggle('active', status === 'inactive');
    document.getElementById('btnDrilldownDormant')?.classList.toggle('active', status === 'dormant');
    openStateDistributorDrilldown(currentDrilldownState, status);
  }
  window.setDrilldownStatusFilter = setDrilldownStatusFilter;

  function clearDrilldownFilters() {
    currentDrilldownTimePeriod = '6m';
    currentDrilldownStatusFilter = 'all';
    currentDrilldownSource = 'all';

    document.getElementById('btnDrilldownJuly')?.classList.remove('active');
    document.getElementById('btnDrilldown6M')?.classList.add('active');
    document.getElementById('btnDrilldownActive')?.classList.remove('active');
    document.getElementById('btnDrilldownInactive')?.classList.remove('active');
    document.getElementById('btnDrilldownDormant')?.classList.remove('active');
    document.getElementById('btnDrilldownAll')?.classList.add('active');

    const elSearch = document.getElementById('txtDrilldownSearch');
    if (elSearch) elSearch.value = '';

    openStateDistributorDrilldown(currentDrilldownState, 'all');
  }
  window.clearDrilldownFilters = clearDrilldownFilters;

  function goBackFromDrilldown() {
    const elPage = document.getElementById('stateDistributorOpportunityPageView');
    if (elPage) elPage.style.display = 'none';
    const elMain = document.getElementById('mainDashboardView');
    if (elMain) elMain.style.display = 'block';

    if (currentDrilldownSource === 'active') {
      openActiveRetailersModal();
    } else if (currentDrilldownSource === 'inactive') {
      openDormantModal('inactive');
    } else if (currentDrilldownSource === 'dormant') {
      openDormantModal('dormant');
    } else if (currentDrilldownSource === 'upsell') {
      openUpsellModal();
    } else if (currentDrilldownSource === 'bronze') {
      openBronzeModal();
    } else if (currentDrilldownSource === 'pending') {
      openPendingModal();
    } else if (currentDrilldownSource === 'consistency') {
      openConsistencyModal();
    } else if (currentDrilldownSource === 'distributorModal' || currentDrilldownSource === 'distributor') {
      openDistributorModal();
    } else {
      showMainDashboardView();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function onDrilldownDatePresetChange() {
    const sel = document.getElementById('selDrilldownDatePreset');
    const val = sel ? sel.value : 'JAN_TILL_DATE';
    const dStart = document.getElementById('drilldownStartDate');
    const dEnd = document.getElementById('drilldownEndDate');
    if (!dStart || !dEnd) return;

    if (val === 'JAN_TILL_DATE') {
      dStart.value = '2026-01-01'; dEnd.value = '2026-09-29';
    } else if (val === 'AUG_SEP_2026') {
      dStart.value = '2026-08-01'; dEnd.value = '2026-09-29';
    } else if (val === 'AUG_2026') {
      dStart.value = '2026-08-01'; dEnd.value = '2026-08-31';
    } else if (val === 'JULY_2026') {
      dStart.value = '2026-07-01'; dEnd.value = '2026-07-31';
    } else if (val === 'JUNE_2026') {
      dStart.value = '2026-06-01'; dEnd.value = '2026-06-30';
    } else if (val === 'MAY_2026') {
      dStart.value = '2026-05-01'; dEnd.value = '2026-05-31';
    } else if (val === 'APRIL_2026') {
      dStart.value = '2026-04-01'; dEnd.value = '2026-04-30';
    } else if (val === 'MARCH_2026') {
      dStart.value = '2026-03-01'; dEnd.value = '2026-03-31';
    } else if (val === 'FEB_2026') {
      dStart.value = '2026-02-01'; dEnd.value = '2026-02-28';
    } else if (val === 'JAN_2026') {
      dStart.value = '2026-01-01'; dEnd.value = '2026-01-31';
    }
    openStateDistributorDrilldown(currentDrilldownState, currentDrilldownSource);
  }
  window.onDrilldownDatePresetChange = onDrilldownDatePresetChange;

  function onDrilldownCustomDateChange() {
    const sel = document.getElementById('selDrilldownDatePreset');
    if (sel) sel.value = 'CUSTOM';
    openStateDistributorDrilldown(currentDrilldownState, currentDrilldownSource);
  }
  window.onDrilldownCustomDateChange = onDrilldownCustomDateChange;

  function clearDrilldownDates() {
    const sel = document.getElementById('selDrilldownDatePreset');
    if (sel) sel.value = 'JAN_TILL_DATE';
    const dStart = document.getElementById('drilldownStartDate');
    const dEnd = document.getElementById('drilldownEndDate');
    if (dStart) dStart.value = '2026-01-01';
    if (dEnd) dEnd.value = '2026-09-29';
    openStateDistributorDrilldown(currentDrilldownState, currentDrilldownSource);
  }
  window.clearDrilldownDates = clearDrilldownDates;

  function openStateDistributorDrilldown(stateName, source) {
    currentDrilldownState = stateName;
    if (source) {
      currentDrilldownSource = source;
      currentDrilldownStatusFilter = source;
    }

    // Sync drilldown status filter buttons
    document.getElementById('btnDrilldownAll')?.classList.toggle('active', currentDrilldownSource === 'all');
    document.getElementById('btnDrilldownActive')?.classList.toggle('active', currentDrilldownSource === 'active');
    document.getElementById('btnDrilldownInactive')?.classList.toggle('active', currentDrilldownSource === 'inactive');
    document.getElementById('btnDrilldownDormant')?.classList.toggle('active', currentDrilldownSource === 'dormant');

    // Hide main dashboard + modals, show drilldown page
    const elMain = document.getElementById('mainDashboardView');
    const elPage = document.getElementById('stateDistributorOpportunityPageView');
    const elTerritoryPage = document.getElementById('territoryFlowPageView');

    if (elMain) elMain.style.display = 'none';
    if (elTerritoryPage) elTerritoryPage.style.display = 'none';
    if (elPage) elPage.style.display = 'flex';

    // Close any open modals
    const activeModal = document.getElementById('activeRetailersModal');
    const dormantModal = document.getElementById('dormantModal');
    if (activeModal) activeModal.classList.remove('show');
    if (dormantModal) dormantModal.classList.remove('show');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    const isInactiveMode = (currentDrilldownSource === 'inactive' || currentDrilldownStatusFilter === 'inactive');
    const isDormantMode  = (currentDrilldownSource === 'dormant' || currentDrilldownStatusFilter === 'dormant');
    const isInactiveOrDormant = isInactiveMode || isDormantMode;

    // Set Header Title & Mode Labels
    const elHeader = document.getElementById('lblDrilldownStateHeader');
    if (elHeader) elHeader.innerHTML = `📍 ${stateName} — State Intelligence & Performance View`;

    const elModeLbl = document.getElementById('lblDrilldownMode');
    if (elModeLbl) {
      const timeLbl = currentDrilldownTimePeriod === 'july' ? 'July 2026' : 'Last 6 Months';
      const statusLbl = currentDrilldownSource === 'active' ? 'Active Retailers Only' 
                      : currentDrilldownSource === 'inactive' ? 'Inactive Retailers Only (Last 6 Months Inactive)'
                      : currentDrilldownSource === 'dormant' ? 'Dormant Retailers Only (Last 2 Months No Scan)'
                      : 'All Retailers';
      elModeLbl.textContent = `${statusLbl} | ${timeLbl}`;
    }

    // Filter ALL retailers in this state
    drilldownRetailers = [];
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      drilldownRetailers = dashboardData.all_retailers.filter(r => {
        let st = r.State_Name || r.state || 'Unknown';
        if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
        return st.toLowerCase() === stateName.toLowerCase();
      });
    }

    // Distinct distributors operating in this state
    const distSet = new Set();
    drilldownRetailers.forEach(r => {
      if (r.distributor_name && r.distributor_name !== 'Unknown Distributor' && r.distributor_name !== 'N/A' && r.distributor_name.trim()) {
        distSet.add(r.distributor_name.trim());
      }
    });

    // Compute KPIs
    const totalReg = drilldownRetailers.length;
    const totalActive = drilldownRetailers.filter(r => {
      const scans = currentDrilldownTimePeriod === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
      return scans > 0;
    }).length;
    const totalInactive = totalReg - totalActive;
    const actRate = totalReg > 0 ? ((totalActive / totalReg) * 100).toFixed(1) : '0.0';

    const totalScans = drilldownRetailers.reduce((sum, r) => sum + (currentDrilldownTimePeriod === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0)), 0);
    const totalBoxes = drilldownRetailers.reduce((sum, r) => sum + (currentDrilldownTimePeriod === 'july' ? (r.boxes_july || 0) : (r.boxes_6m || 0)), 0);

    // Compute Category Breakdown for State dynamically from allScans
    const catMap = {};
    const dStart = document.getElementById('drilldownStartDate')?.value || (currentDrilldownTimePeriod === 'july' ? '2026-07-01' : '2026-01-01');
    const dEnd = document.getElementById('drilldownEndDate')?.value || (currentDrilldownTimePeriod === 'july' ? '2026-07-31' : '2026-09-29');

    const sourceScans = (allScans && allScans.length > 0) ? allScans : (filteredScans || []);
    sourceScans.forEach(s => {
      let st = s.State_Name || s.state || 'Unknown';
      if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
      if (st.toLowerCase() === stateName.toLowerCase()) {
        const scanDate = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '');
        if (dStart && scanDate && scanDate < dStart) return;
        if (dEnd && scanDate && scanDate > dEnd) return;
        const cat = s.Category_Name || s.category_name || s.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + 1;
      }
    });

    const sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    const topCatName = sortedCats.length > 0 ? sortedCats[0][0] : '--';

    const elDistCount = document.getElementById('kpiDrilldownDistributorsCount');
    const elReg = document.getElementById('kpiDrilldownRegistered');
    const elAct = document.getElementById('kpiDrilldownActive');
    const elInact = document.getElementById('kpiDrilldownInactive');
    const elRate = document.getElementById('kpiDrilldownActRate');
    const elScansVal = document.getElementById('kpiDrilldownScans');
    const elTopCat = document.getElementById('kpiDrilldownTopCat');

    if (elDistCount) elDistCount.textContent = distSet.size.toLocaleString();
    if (elReg) elReg.textContent = totalReg.toLocaleString();
    if (elAct) elAct.textContent = totalActive.toLocaleString();
    if (elInact) elInact.textContent = totalInactive.toLocaleString();
    if (elRate) elRate.textContent = `${actRate}%`;
    if (elScansVal) {
      if (isInactiveMode) elScansVal.textContent = '0 Scans (0.0 Boxes)';
      else if (isDormantMode) elScansVal.textContent = '0 Scans in Last 2M';
      else elScansVal.textContent = `${totalScans.toLocaleString()} Scans (${totalBoxes.toFixed(1)} Boxes)`;
    }
    if (elTopCat) {
      elTopCat.textContent = isInactiveOrDormant ? 'None (0 Scans)' : topCatName;
    }
    const elTopCatSub = document.getElementById('lblKpiDrilldownTopCatSub');
    if (elTopCatSub) {
      elTopCatSub.textContent = isInactiveOrDormant 
        ? (isDormantMode ? 'Dormant stores have 0 scans in last 2M' : 'Inactive stores have 0 scans in last 6M') 
        : 'Highest volume category';
    }

    // Both Top 10 and Low 10 category charts must be completely hidden in inactive & dormant modes
    const elRowCats = document.getElementById('rowDrilldownCategoryCharts');
    if (elRowCats) {
      elRowCats.style.display = isInactiveOrDormant ? 'none' : 'grid';
    }
    if (isInactiveOrDormant) {
      if (chartDrilldownTop10Cat) { try { chartDrilldownTop10Cat.destroy(); chartDrilldownTop10Cat = null; } catch (e) {} }
      if (chartDrilldownLow10Cat) { try { chartDrilldownLow10Cat.destroy(); chartDrilldownLow10Cat = null; } catch (e) {} }
    }

    // Reset Search
    const elSearch = document.getElementById('txtDrilldownSearch');
    if (elSearch) elSearch.value = '';

    renderDrilldownTable();
    renderDrilldownChart(sortedCats);
  }

  function renderDrilldownTable(filterQuery = '') {
    const tbody = document.getElementById('tblDrilldownRetailersBody');
    if (!tbody) return;

    const { retCatScanMap } = getDrilldownCategoryData();

    // First filter by active/inactive/dormant mode
    let base = drilldownRetailers;
    if (currentDrilldownSource === 'active' || currentDrilldownStatusFilter === 'active') {
      base = drilldownRetailers.filter(r => {
        const scans = currentDrilldownTimePeriod === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
        return scans > 0;
      });
    } else if (currentDrilldownSource === 'inactive' || currentDrilldownStatusFilter === 'inactive') {
      base = drilldownRetailers.filter(r => {
        const scans = currentDrilldownTimePeriod === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
        return scans === 0;
      });
    } else if (currentDrilldownSource === 'dormant' || currentDrilldownStatusFilter === 'dormant') {
      const dormantIdSet = new Set((dormantRetailersList || []).map(d => String(d.id || d.status_retailer_id)));
      base = drilldownRetailers.filter(r => {
        const rid = String(r.status_retailer_id || r.id || r.retailer_id);
        return dormantIdSet.has(rid) || (r.scans_6m > 0 && (r.scans_july === 0 || !r.scans_july));
      });
    }

    let filtered = base;
    if (filterQuery) {
      const q = filterQuery.toLowerCase();
      filtered = base.filter(r => {
        return (
          (r.retailer_name && r.retailer_name.toLowerCase().includes(q)) ||
          (r.city && r.city.toLowerCase().includes(q)) ||
          (r.mobile_number && String(r.mobile_number).includes(q)) ||
          (r.distributor_name && r.distributor_name.toLowerCase().includes(q)) ||
          (r.status_retailer_id && String(r.status_retailer_id).includes(q))
        );
      });
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px; color: var(--text-muted);">No retailers found matching selected status/search filter criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const scansCount = currentDrilldownTimePeriod === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
      const boxesCount = currentDrilldownTimePeriod === 'july' ? (r.boxes_july || 0) : (r.boxes_6m || 0);
      const isActive = scansCount > 0;

      const statusBadge = isActive 
        ? `<span class="badge" style="background: rgba(16,185,129,0.15); color: #34D399;"><i class="fa-solid fa-circle-check"></i> Active</span>`
        : `<span class="badge" style="background: rgba(244,63,94,0.15); color: #FB7185;"><i class="fa-solid fa-circle-xmark"></i> Inactive (0 Scans)</span>`;

      const rid = String(r.status_retailer_id || r.id || r.retailer_id);
      const hl = getRetailerCatHighLow(rid, retCatScanMap);
      const distName = escapeHTML(r.distributor_name || 'Unknown Distributor');

      const lastDate = r.retailer_last_scan || r.last_scan || 'No Scans';
      const dateBadge = (lastDate !== 'No Scans' && lastDate) 
        ? `<span class="badge" style="background: rgba(59,130,246,0.15); color: #60A5FA; font-size:11px;"><i class="fa-solid fa-calendar-day"></i> ${escapeHTML(lastDate)}</span>`
        : `<span style="color: var(--text-muted); font-size:11px;">Never</span>`;

      return `
        <tr>
          <td><strong>${r.status_retailer_id || r.id}</strong></td>
          <td><strong>${escapeHTML(r.retailer_name || 'N/A')}</strong></td>
          <td>${escapeHTML(r.mobile_number || 'N/A')}</td>
          <td>${escapeHTML(r.city || 'N/A')}</td>
          <td><span style="color: #60A5FA; font-weight: 600; cursor: pointer;" onclick="openSingleDistributorDetailModal('${r.distributor_name ? r.distributor_name.replace(/'/g, "\\'") : ''}')" title="Click to view distributor performance card">${distName}</span></td>
          <td style="text-align: right; font-weight: 700; color: #10B981;">${scansCount.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${boxesCount.toFixed(1)}</td>
          <td><span class="badge" style="background: rgba(16,185,129,0.1); color: #34D399; font-size:11px;">🥇 ${escapeHTML(hl.highest)} (${hl.highestScans})</span></td>
          <td>${dateBadge}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  function getDrilldownCategoryData() {
    const stateCatMap = {};
    const retCatScanMap = {};

    const dStart = document.getElementById('drilldownStartDate')?.value || (currentDrilldownTimePeriod === 'july' ? '2026-07-01' : '2026-01-01');
    const dEnd = document.getElementById('drilldownEndDate')?.value || (currentDrilldownTimePeriod === 'july' ? '2026-07-31' : '2026-09-29');

    const sourceScans = (allScans && allScans.length > 0) ? allScans : (filteredScans || []);
    const stateScans = sourceScans.filter(s => {
      let st = s.State_Name || s.state || 'Unknown';
      if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
      if (st.toLowerCase() !== (currentDrilldownState || '').toLowerCase()) return false;
      const scanDate = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '');
      if (dStart && scanDate && scanDate < dStart) return false;
      if (dEnd && scanDate && scanDate > dEnd) return false;
      return true;
    });

    stateScans.forEach(s => {
      const cat = s.Category_Name || s.category_name || s.category || 'Other';
      const rid = String(s.status_retailer_id || s.retailer_id);

      stateCatMap[cat] = (stateCatMap[cat] || 0) + 1;
      if (!retCatScanMap[rid]) retCatScanMap[rid] = {};
      retCatScanMap[rid][cat] = (retCatScanMap[rid][cat] || 0) + 1;
    });

    return { stateCatMap, retCatScanMap, stateScans };
  }

  function getRetailerCatHighLow(rid, retCatScanMap) {
    const cats = retCatScanMap[rid] || {};
    const entries = Object.entries(cats).sort((a, b) => b[1] - a[1]);
    if (entries.length === 0) return { highest: 'N/A', highestScans: 0, lowest: 'N/A', lowestScans: 0 };
    return {
      highest: entries[0][0],
      highestScans: entries[0][1],
      lowest: entries[entries.length - 1][0],
      lowestScans: entries[entries.length - 1][1]
    };
  }

  function filterDrilldownTable() {
    const elSearch = document.getElementById('txtDrilldownSearch');
    const q = elSearch ? elSearch.value.trim() : '';
    renderDrilldownTable(q);
  }

  function renderDrilldownChart(sortedCats = []) {
    if (chartDrilldownInstance) { try { chartDrilldownInstance.destroy(); } catch (e) {} }
    if (chartDrilldownRetailerScans) { try { chartDrilldownRetailerScans.destroy(); } catch (e) {} }
    if (chartDrilldownDistScanVol) { try { chartDrilldownDistScanVol.destroy(); } catch (e) {} }
    if (chartDrilldownTop10Cat) { try { chartDrilldownTop10Cat.destroy(); } catch (e) {} }
    if (chartDrilldownLow10Cat) { try { chartDrilldownLow10Cat.destroy(); } catch (e) {} }

    const isInactiveMode = (currentDrilldownSource === 'inactive' || currentDrilldownStatusFilter === 'inactive');
    const isDormantMode  = (currentDrilldownSource === 'dormant' || currentDrilldownStatusFilter === 'dormant');
    const isInactiveOrDormant = isInactiveMode || isDormantMode;
    const isActiveMode   = (currentDrilldownSource === 'active' || currentDrilldownStatusFilter === 'active');
    const { retCatScanMap } = getDrilldownCategoryData();

    // Dynamically compute category breakdown if sortedCats is empty or dummy
    if (!sortedCats || sortedCats.length <= 1) {
      const dStart = document.getElementById('drilldownStartDate')?.value || (currentDrilldownTimePeriod === 'july' ? '2026-07-01' : '2026-01-01');
      const dEnd = document.getElementById('drilldownEndDate')?.value || (currentDrilldownTimePeriod === 'july' ? '2026-07-31' : '2026-09-29');
      const sourceScans = (allScans && allScans.length > 0) ? allScans : (filteredScans || []);
      const catMap = {};
      sourceScans.forEach(s => {
        let st = s.State_Name || s.state || 'Unknown';
        if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
        if (st.toLowerCase() === (currentDrilldownState || '').toLowerCase()) {
          const scanDate = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '');
          if (dStart && scanDate && scanDate < dStart) return;
          if (dEnd && scanDate && scanDate > dEnd) return;
          const cat = s.Category_Name || s.category_name || s.category || 'Other';
          catMap[cat] = (catMap[cat] || 0) + 1;
        }
      });
      sortedCats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
    }

    // Build distributor aggregation from drilldownRetailers
    const distMap = {};
    drilldownRetailers.forEach(r => {
      const dName = r.distributor_name || 'Unknown Distributor';
      if (!distMap[dName]) distMap[dName] = { active: 0, inactive: 0, totalScans: 0, totalBoxes: 0 };
      const scans = currentDrilldownTimePeriod === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
      const boxes = currentDrilldownTimePeriod === 'july' ? (r.boxes_july || 0) : (r.boxes_6m || 0);
      if (scans > 0) {
        distMap[dName].active++;
        distMap[dName].totalScans += scans;
        distMap[dName].totalBoxes += boxes;
      } else {
        distMap[dName].inactive++;
      }
    });

    const distEntries = Object.entries(distMap)
      .filter(([name]) => name !== 'Unknown Distributor' && name.trim() !== '')
      .map(([name, d]) => ({ name, ...d, total: d.active + d.inactive }));

    // Chart 1 (Left): Ranked by scan volume (highest to lowest) with clean truncated labels
    const sortedForLeftChart = [...distEntries]
      .sort((a, b) => {
        if (isInactiveOrDormant) return b.inactive - a.inactive;
        if (isActiveMode) return b.totalScans - a.totalScans || b.active - a.active;
        return b.totalScans - a.totalScans || b.total - a.total;
      })
      .slice(0, 15);

    const firstDistName = sortedForLeftChart.length > 0 ? sortedForLeftChart[0].name : '';

    const ctx2 = document.getElementById('chartDrilldownDistScanVol');
    if (ctx2 && sortedForLeftChart.length > 0) {
      const elChart1Title = document.getElementById('lblChart1Title');
      const elChart1Sub = document.getElementById('lblChart1Sub');
      if (elChart1Title) {
        elChart1Title.innerHTML = isInactiveMode
          ? `<i class="fa-solid fa-truck-ramp-box text-rose"></i> State Distributors Inactive Stores Ranking (0 Scans)`
          : isDormantMode
          ? `<i class="fa-solid fa-triangle-exclamation text-amber"></i> State Distributors Dormant Stores Ranking (No Scans 2M)`
          : `<i class="fa-solid fa-truck-field text-cyan"></i> State Distributors Scan & Box Volume Ranking`;
      }
      if (elChart1Sub) {
        elChart1Sub.textContent = isInactiveMode
          ? `Distributors in this state ranked by count of inactive retailers (0 scans in last 6 months).`
          : isDormantMode
          ? `Distributors in this state ranked by count of dormant retailers (no scans in last 2 months).`
          : `Distributors in this state ranked by scan volume. Click any distributor bar to open full details.`;
      }

      const chartLabel = isInactiveMode
        ? 'Inactive Outlets (0 Scans)'
        : isDormantMode
        ? 'Dormant Outlets (No Scans 2M)'
        : `${currentDrilldownTimePeriod === 'july' ? 'July' : 'Period'} Scan Volume`;

      const chartData = isInactiveOrDormant
        ? sortedForLeftChart.map(d => d.inactive)
        : sortedForLeftChart.map(d => d.totalScans);

      const chartBg = isInactiveOrDormant ? 'rgba(244,63,94,0.85)' : 'rgba(99,102,241,0.85)';
      const chartBorder = isInactiveOrDormant ? '#FB7185' : '#818CF8';

      chartDrilldownDistScanVol = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: sortedForLeftChart.map(d => formatCleanDistName(d.name)),
          datasets: [{
            label: chartLabel,
            data: chartData,
            backgroundColor: chartBg,
            borderColor: chartBorder,
            borderWidth: 1,
            borderRadius: 4,
            barThickness: 16
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { left: 10, right: 65, top: 10, bottom: 10 }
          },
          interaction: { mode: 'nearest', intersect: false },
          onHover: (evt, elements) => {
            const target = evt?.native?.target || evt?.target;
            if (target) target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
          },
          onClick: (evt, elements, chart) => {
            let active = elements;
            if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
              try { active = chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true); } catch (e) {}
            }
            if (active && active.length > 0) {
              const clickedDist = sortedForLeftChart[active[0].index]?.name;
              if (clickedDist) openSingleDistributorDetailModal(clickedDist);
            }
          },
          plugins: {
            legend: { display: false },
            datalabels: {
              display: true,
              color: '#93C5FD',
              anchor: 'end',
              align: 'end',
              offset: 6,
              font: { size: 10, weight: '700' },
              formatter: v => v.toLocaleString()
            },
            tooltip: {
              backgroundColor: 'rgba(15,23,42,0.95)',
              borderColor: 'rgba(99,102,241,0.4)',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                title: (items) => `🏢 ${sortedForLeftChart[items[0].dataIndex]?.name || ''}`,
                label: (c) => {
                  const d = sortedForLeftChart[c.dataIndex];
                  return [
                    `📊 ${c.dataset.label}: ${c.parsed.x.toLocaleString()}`,
                    `📦 Calculated Boxes: ${d ? d.totalBoxes.toFixed(1) : 0}`,
                    `👥 Retailers Network: ${d ? d.total.toLocaleString() : 0} stores (${d ? d.active : 0} active)`
                  ];
                }
              }
            }
          },
          scales: {
            x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
            y: { ticks: { color: '#E2E8F0', font: { size: 10.5, weight: '600' } }, grid: { display: false } }
          }
        }
      });
    }

    // Chart 2 (Right): Distributor Active & Total Retailer Network Distribution
    // Sorted strictly ASC or DESC by retailer count based on drilldownDistSortDir
    const sortedForRightChart = [...distEntries]
      .sort((a, b) => {
        let valA = isInactiveMode ? a.inactive : a.active;
        let valB = isInactiveMode ? b.inactive : b.active;
        if (valA === valB) {
          valA = a.total;
          valB = b.total;
        }
        return drilldownDistSortDir === 'DESC' ? (valB - valA) : (valA - valB);
      })
      .slice(0, 15);

    const ctx1 = document.getElementById('chartDrilldownDistributors');
    if (ctx1 && sortedForRightChart.length > 0) {
      const datasets = [];
      if (!isInactiveMode) {
        datasets.push({
          label: 'Active Retailers',
          data: sortedForRightChart.map(d => d.active),
          backgroundColor: 'rgba(16,185,129,0.85)',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 4
        });
      }
      if (!isActiveMode) {
        datasets.push({
          label: 'Inactive Retailers',
          data: sortedForRightChart.map(d => d.inactive),
          backgroundColor: 'rgba(244,63,94,0.75)',
          borderColor: '#F43F5E',
          borderWidth: 1,
          borderRadius: 4
        });
      }

      chartDrilldownInstance = new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: sortedForRightChart.map(d => formatCleanDistName(d.name)),
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          layout: {
            padding: { top: 22 }
          },
          interaction: { mode: 'nearest', intersect: false },
          onHover: (evt, elements) => {
            const target = evt?.native?.target || evt?.target;
            if (target) target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
          },
          onClick: (evt, elements, chart) => {
            let active = elements;
            if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
              try { active = chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true); } catch (e) {}
            }
            if (active && active.length > 0) {
              const clickedDist = sortedForRightChart[active[0].index]?.name;
              if (clickedDist) openSingleDistributorDetailModal(clickedDist);
            }
          },
          scales: {
            x: {
              ticks: { color: '#94A3B8', maxRotation: 35, minRotation: 25, font: { size: 9.5 } },
              grid: { color: 'rgba(255,255,255,0.04)' }
            },
            y: {
              beginAtZero: true,
              ticks: { color: '#94A3B8' },
              grid: { color: 'rgba(255,255,255,0.05)' }
            }
          },
          plugins: {
            legend: { position: 'top', labels: { color: '#CBD5E1', font: { size: 11, weight: 'bold' } } },
            datalabels: {
              display: true,
              color: '#34D399',
              anchor: 'end',
              align: 'top',
              offset: 2,
              font: { size: 9.5, weight: 'bold' },
              formatter: v => v > 0 ? v.toLocaleString() : ''
            },
            tooltip: {
              backgroundColor: 'rgba(15,23,42,0.95)',
              borderColor: isInactiveMode ? 'rgba(244,63,94,0.4)' : 'rgba(99,102,241,0.4)',
              borderWidth: 1,
              titleColor: '#E2E8F0',
              titleFont: { size: 13, weight: 'bold' },
              bodyColor: '#CBD5E1',
              bodyFont: { size: 12 },
              padding: 14,
              callbacks: {
                title: (items) => `🏢 ${sortedForRightChart[items[0].dataIndex]?.name || ''}`,
                label: (ctx2) => {
                  const d = sortedForRightChart[ctx2.dataIndex];
                  if (!d) return '';
                  const lbl = ctx2.dataset.label;
                  if (lbl.includes('Active')) {
                    const pct = d.total > 0 ? ((d.active / d.total) * 100).toFixed(1) : '0.0';
                    return `  🟢 Active Retailers : ${d.active.toLocaleString()} (${pct}%)`;
                  }
                  if (lbl.includes('Inactive')) {
                    const pct = d.total > 0 ? ((d.inactive / d.total) * 100).toFixed(1) : '0.0';
                    return `  🔴 Inactive Retailers: ${d.inactive.toLocaleString()} (${pct}%)`;
                  }
                },
                afterBody: (items) => {
                  const d = sortedForRightChart[items[0].dataIndex];
                  if (!d) return [];
                  const actPct = d.total > 0 ? ((d.active / d.total) * 100).toFixed(1) : '0.0';
                  const lines = [`  ─────────────────────`, `  📊 Activation Rate : ${actPct}%`];
                  if (!isInactiveOrDormant) {
                    lines.push(`  🔍 Total Scans  : ${d.totalScans.toLocaleString()}`);
                  }
                  return lines;
                }
              }
            }
          }
        }
      });
    }

    // Chart 3 & 4: Top & Bottom Categories in State (No Overlap)
    // In Inactive or Dormant mode, stores have 0 scans in last 6M or last 2M, so hide category scan charts completely.
    const elRowCats = document.getElementById('rowDrilldownCategoryCharts');
    if (isInactiveOrDormant) {
      if (elRowCats) elRowCats.style.display = 'none';
      if (chartDrilldownTop10Cat) { try { chartDrilldownTop10Cat.destroy(); chartDrilldownTop10Cat = null; } catch (e) {} }
      if (chartDrilldownLow10Cat) { try { chartDrilldownLow10Cat.destroy(); chartDrilldownLow10Cat = null; } catch (e) {} }
    } else {
      if (elRowCats) elRowCats.style.display = 'grid';

      const displayCount = sortedCats.length > 20 ? 10 : Math.max(1, Math.min(5, Math.floor(sortedCats.length / 2)));
      const topCategories = sortedCats.slice(0, displayCount);
      const lowCategories = sortedCats.slice().sort((a, b) => a[1] - b[1]).slice(0, displayCount);

      const elTopH = document.getElementById('lblDrilldownTopCatHeader');
      const elTopSub = document.getElementById('lblDrilldownTopCatSubtitle');
      const elLowH = document.getElementById('lblDrilldownLowCatHeader');
      const elLowSub = document.getElementById('lblDrilldownLowCatSubtitle');

      if (elTopH) elTopH.textContent = `Top ${displayCount} Scanned Categories in State`;
      if (elLowH) elLowH.textContent = `Low ${displayCount} Scanned Categories in State`;
      if (elTopSub) elTopSub.textContent = `Highest volume categories scanned in this state. Click any category bar to open retailer visual breakdown.`;
      if (elLowSub) elLowSub.textContent = `Lowest volume categories scanned in this state. Click any category bar to open full breakdown.`;

      const ctxTop10 = document.getElementById('chartDrilldownTop10Cat');
      if (ctxTop10) {
        chartDrilldownTop10Cat = new Chart(ctxTop10, {
          type: 'bar',
          data: {
            labels: topCategories.map(c => c[0]),
            datasets: [{
              label: 'Scan Volume',
              data: topCategories.map(c => c[1]),
              backgroundColor: 'rgba(16,185,129,0.85)',
              borderColor: '#34D399',
              borderWidth: 1,
              borderRadius: 4,
              barThickness: 18
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: { left: 10, right: 65, top: 10, bottom: 10 }
            },
            interaction: { mode: 'nearest', intersect: false },
            onHover: (evt, elements) => {
              const target = evt?.native?.target || evt?.target;
              if (target) target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
            },
            onClick: (evt, elements) => {
              if (elements && elements.length > 0) {
                const catName = topCategories[elements[0].index][0];
                if (catName && typeof openCategoryProductModal === 'function') {
                  openCategoryProductModal(catName, currentDrilldownState || 'All States');
                }
              }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                display: true,
                color: '#FFFFFF',
                anchor: 'end',
                align: 'end',
                offset: 4,
                font: { size: 9.5, weight: 'bold' },
                formatter: v => v.toLocaleString()
              },
              tooltip: { callbacks: { label: c => `🥇 ${c.parsed.x.toLocaleString()} scans — click to view category details` } }
            },
            scales: {
              x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#CBD5E1', font: { size: 10, weight: '600' } }, grid: { display: false } }
            }
          }
        });
      }

      const ctxLow10 = document.getElementById('chartDrilldownLow10Cat');
      if (ctxLow10) {
        chartDrilldownLow10Cat = new Chart(ctxLow10, {
          type: 'bar',
          data: {
            labels: lowCategories.map(c => c[0]),
            datasets: [{
              label: 'Scan Volume',
              data: lowCategories.map(c => c[1]),
              backgroundColor: 'rgba(244,63,94,0.8)',
              borderColor: '#FB7185',
              borderWidth: 1,
              borderRadius: 4,
              barThickness: 18
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            layout: {
              padding: { left: 10, right: 65, top: 10, bottom: 10 }
            },
            interaction: { mode: 'nearest', intersect: false },
            onHover: (evt, elements) => {
              const target = evt?.native?.target || evt?.target;
              if (target) target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
            },
            onClick: (evt, elements) => {
              if (elements && elements.length > 0) {
                const catName = lowCategories[elements[0].index][0];
                if (catName && typeof openCategoryProductModal === 'function') {
                  openCategoryProductModal(catName, currentDrilldownState || 'All States');
                }
              }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                display: true,
                color: '#FFFFFF',
                anchor: 'end',
                align: 'end',
                offset: 4,
                font: { size: 9.5, weight: 'bold' },
                formatter: v => v.toLocaleString()
              },
              tooltip: { callbacks: { label: c => `🔻 ${c.parsed.x.toLocaleString()} scans — click to view category details` } }
            },
            scales: {
              x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#CBD5E1', font: { size: 10, weight: '600' } }, grid: { display: false } }
            }
          }
        });
      }
    }

    // Chart 5: Top Retail Outlets by Scan Count in State (Or Inactive Outlets in Inactive Mode)
    const ctx3 = document.getElementById('chartDrilldownRetailerScans');
    if (ctx3) {
      let filteredRetailers = drilldownRetailers;
      if (isActiveMode) {
        filteredRetailers = drilldownRetailers.filter(r => {
          const scans = currentDrilldownTimePeriod === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
          return scans > 0;
        });
      } else if (isInactiveMode) {
        filteredRetailers = drilldownRetailers.filter(r => {
          const scans = currentDrilldownTimePeriod === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
          return scans === 0;
        });
      } else if (isDormantMode) {
        const dormantIdSet = new Set((dormantRetailersList || []).map(d => String(d.id || d.status_retailer_id)));
        filteredRetailers = drilldownRetailers.filter(r => {
          const rid = String(r.status_retailer_id || r.id || r.retailer_id);
          return dormantIdSet.has(rid) || (r.scans_6m > 0 && (r.scans_july === 0 || !r.scans_july));
        });
      }

      const topRetailers = filteredRetailers
        .slice()
        .sort((a, b) => {
          if (isInactiveOrDormant) return 0;
          const sA = currentDrilldownTimePeriod === 'july' ? (a.scans_july || 0) : (a.scans_6m || 0);
          const sB = currentDrilldownTimePeriod === 'july' ? (b.scans_july || 0) : (b.scans_6m || 0);
          return sB - sA;
        })
        .slice(0, 20);

      const chartTitle = isInactiveMode ? 'Inactive Stores (0 Scans)' : isDormantMode ? 'Dormant Stores (No Scans 2M)' : 'Scans';

      chartDrilldownRetailerScans = new Chart(ctx3, {
        type: 'bar',
        data: {
          labels: topRetailers.map(r => r.retailer_name || `ID:${r.status_retailer_id}`),
          datasets: [{
            label: chartTitle,
            data: topRetailers.map(r => {
              if (isInactiveOrDormant) return 0;
              return currentDrilldownTimePeriod === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
            }),
            backgroundColor: isInactiveOrDormant ? 'rgba(244,63,94,0.75)' : topRetailers.map((_, i) => i === 0 ? '#F59E0B' : i < 3 ? '#3B82F6' : '#10B981'),
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          onHover: (evt, elements) => {
            const target = evt?.native?.target || evt?.target;
            if (target) target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
          },
          onClick: (evt, elements, chart) => {
            let active = elements;
            if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
              try { active = chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true); } catch (e) {}
            }
            if (active && active.length > 0) {
              const r = topRetailers[active[0].index];
              if (r) {
                if (typeof openRetailerDrawer === 'function') openRetailerDrawer(r);
                else if (typeof handleRetailerClick === 'function') handleRetailerClick(r.status_retailer_id || r.id, r.distributor_name);
              }
            }
          },
          plugins: {
            legend: { display: false },
            datalabels: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15,23,42,0.95)',
              borderColor: isInactiveMode ? '#F43F5E' : '#10B981',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                title: (items) => `🏪 ${topRetailers[items[0].dataIndex]?.retailer_name || ''}`,
                label: (c) => {
                  const ret = topRetailers[c.dataIndex];
                  const lastDate = ret ? (ret.retailer_last_scan || ret.last_scan || 'No Scans recorded') : 'N/A';
                  return isInactiveMode
                    ? `🔴 Status: Inactive (0 Scans) | 📅 Last Scan Date: ${lastDate}`
                    : `🟢 Total Scans: ${c.parsed.y.toLocaleString()} | 📅 Last Scan Date: ${lastDate}`;
                }
              }
            }
          },
          scales: {
            x: { ticks: { color: '#94A3B8', maxRotation: 45, font: { size: 9 } }, grid: { display: false } },
            y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
          }
        }
      });
    }
  }

  function exportDrilldownExcel() {
    if (drilldownRetailers.length === 0) {
      alert('No retailer data available to export.');
      return;
    }
    const { retCatScanMap } = getDrilldownCategoryData();
    const wb = XLSX.utils.book_new();
    const exportData = drilldownRetailers.map(r => {
      const rid = String(r.status_retailer_id || r.id || r.retailer_id);
      const hl = getRetailerCatHighLow(rid, retCatScanMap);
      return {
        "Retailer ID": r.status_retailer_id,
        "Retailer Name": r.retailer_name,
        "Mobile Number": r.mobile_number,
        "City": r.city,
        "State": r.State_Name,
        "Distributor Name": r.distributor_name || 'Unknown Distributor',
        "6M Scans": r.scans_6m || 0,
        "6M Boxes": r.boxes_6m || 0.0,
        "Highest Category": `${hl.highest} (${hl.highestScans})`,
        "Lowest Category": `${hl.lowest} (${hl.lowestScans})`,
        "Status": Number(r.is_active_6m) === 1 ? "Active" : "Inactive"
      };
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { rgb: "312E81" } };
    const headerFont = { name: "Arial", size: 11, bold: true, color: { rgb: "FFFFFF" } };
    const cols = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
    cols.forEach(c => {
      const cellRef = `${c}1`;
      if (ws[cellRef]) {
        ws[cellRef].s = { fill: headerFill, font: headerFont, alignment: { horizontal: "left" } };
      }
    });
    XLSX.utils.book_append_sheet(wb, ws, "State_Distributors_Audit");
    XLSX.writeFile(wb, `JGH_Retailers_Audit_${currentDrilldownState.replace(/\\s+/g, '_')}_6M.xlsx`);
  }

  // Call on every data refresh — removed here, called inside openGrowthOpportunityModal


    // ========================================================
  // CATEGORY PRODUCT & RETAILER DRILL-DOWN MODAL SUITE
  // ========================================================
  let currentCategoryForProductModal = '';
  let currentCategoryState = '';
  let currentCategoryPackagingFilter = 'ALL';
  let currentCategoryModalActiveTab = 'retailers';
  let currentCategoryRetailersAllList = [];
  let currentCategoryProductsAllList = [];
  let catTotalScansCurrent = 0;
  let catB10Current = 0;
  let catB5Current = 0;
  let catBoxesCurrent = 0;

  function openCategoryProductModal(catName, stateName, initialPackagingFilter) {
    currentCategoryForProductModal = catName || '';
    const st = stateName || currentDrilldownState || (elFilterState && elFilterState.value !== 'ALL' ? elFilterState.value : '');
    currentCategoryState = st;
    currentCategoryPackagingFilter = initialPackagingFilter || 'ALL';

    const modal = document.getElementById('categoryProductModal');
    const title = document.getElementById('categoryProductModalTitle');
    const searchInput = document.getElementById('categoryProductSearch');
    
    const hasSpecificState = (st && st !== 'ALL' && st !== 'All States' && st !== 'Pan-India' && st !== 'Pan India' && st !== 'All');
    if (title) title.innerHTML = `<i class="fa-solid fa-boxes-stacked text-purple"></i> Category Retailers & Packaging Breakdown — <strong>${escapeHTML(catName)}</strong>${hasSpecificState ? ` <span style="font-size:13px; color:var(--text-muted); font-weight:normal;">(${escapeHTML(st)})</span>` : ''}`;
    if (searchInput) searchInput.value = '';

    // Gather all scans for this category in this state across current date range
    const hStart = document.getElementById('drilldownStartDate') || document.getElementById('headerStartDate');
    const hEnd = document.getElementById('drilldownEndDate') || document.getElementById('headerEndDate');
    const sDate = hStart ? hStart.value : '2026-01-01';
    const eDate = hEnd ? hEnd.value : '2026-09-29';

    const sourceScans = (allScans && allScans.length > 0) ? allScans : (filteredScans || []);
    const matchingScans = sourceScans.filter(s => {
      if ((s.Category_Name || 'Unknown') !== currentCategoryForProductModal) return false;
      if (hasSpecificState) {
        let sSt = s.State_Name || s.state || 'Unknown';
        if (sSt === 'Jammu & Kashmir') sSt = 'Jammu and Kashmir';
        if (sSt.toLowerCase() !== st.toLowerCase()) return false;
      }
      const scanDate = s.scan_date || (s.retailer_scanned_at ? String(s.retailer_scanned_at).slice(0, 10) : '');
      if (sDate && scanDate && scanDate < sDate) return false;
      if (eDate && scanDate && scanDate > eDate) return false;
      return true;
    });

    // Group matching scans by retailer and by SKU
    const retMap = {};
    const prodMap = {};
    catTotalScansCurrent = 0;
    catB10Current = 0;
    catB5Current = 0;
    catBoxesCurrent = 0;

    matchingScans.forEach(s => {
      catTotalScansCurrent++;
      const isB5 = s.uom === 'B5';
      if (isB5) catB5Current++;
      else catB10Current++;
      const boxWeight = isB5 ? 0.5 : 1.0;
      catBoxesCurrent += boxWeight;

      // Retailer aggregation
      const rid = String(s.status_retailer_id || s.retailer_id || 'UNKNOWN');
      if (!retMap[rid]) {
        retMap[rid] = {
          retailer_id: rid,
          retailer_name: s.retailer_name || `Retailer #${rid}`,
          mobile_number: s.mobile_number || 'N/A',
          city: s.city || s.district || 'N/A',
          distributor_name: s.distributor_name || 'Direct Factory / Unassigned Territory',
          scans: 0,
          b10: 0,
          b5: 0,
          boxes: 0,
          lastScan: ''
        };
      }
      retMap[rid].scans++;
      if (isB5) retMap[rid].b5++;
      else retMap[rid].b10++;
      retMap[rid].boxes += boxWeight;

      const scanTime = String(s.retailer_scanned_at || s.scan_date || '');
      if (scanTime && (!retMap[rid].lastScan || scanTime > retMap[rid].lastScan)) {
        retMap[rid].lastScan = scanTime;
      }

      // SKU product aggregation
      const sku = s.sku_code || 'N/A';
      const desc = s.sku_description || sku;
      if (!prodMap[sku]) {
        prodMap[sku] = {
          sku_code: sku,
          sku_description: desc,
          uom: s.uom || (isB5 ? 'B5' : 'B10'),
          scans: 0,
          b10: 0,
          b5: 0,
          boxes: 0,
          mrp: s.mrp || 0,
          unit_price: s.unit_price || 0,
          retailers: new Set()
        };
      }
      prodMap[sku].scans++;
      if (isB5) prodMap[sku].b5++;
      else prodMap[sku].b10++;
      prodMap[sku].boxes += boxWeight;
      prodMap[sku].retailers.add(rid);
    });

    currentCategoryRetailersAllList = Object.values(retMap);
    currentCategoryProductsAllList = Object.values(prodMap).map(p => ({
      ...p,
      unique_retailers: p.retailers.size
    }));

    updateCategoryPackagingFilterButtons();
    updateCategoryModalHeaderAndSubtitle();
    renderCategoryModalKPICards();
    updateCategoryTableHeaderStyles();

    switchCategoryModalTab('retailers');

    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('show');
    }
  }
  window.openCategoryProductModal = openCategoryProductModal;

  function closeCategoryProductModal() {
    const modal = document.getElementById('categoryProductModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }
  window.closeCategoryProductModal = closeCategoryProductModal;

  function setCategoryPackagingFilter(filter) {
    currentCategoryPackagingFilter = filter || 'ALL';
    updateCategoryPackagingFilterButtons();
    updateCategoryModalHeaderAndSubtitle();
    renderCategoryModalKPICards();
    updateCategoryTableHeaderStyles();

    // Update export button labels
    const lblExpRet = document.getElementById('lblExportCategoryRetailerText');
    const lblExpProd = document.getElementById('lblExportCategoryProductText');
    const packLabel = currentCategoryPackagingFilter === 'B5' ? 'B5 (Half Box)' : (currentCategoryPackagingFilter === 'B10' ? 'B10 (Full Box)' : 'All');
    if (lblExpRet) lblExpRet.textContent = `Export ${packLabel} Retailers`;
    if (lblExpProd) lblExpProd.textContent = `Export ${packLabel} Products`;

    if (currentCategoryModalActiveTab === 'retailers') {
      renderCategoryDrilldownRetailersTable();
    } else {
      renderCategoryDrilldownProductTable();
    }
  }
  window.setCategoryPackagingFilter = setCategoryPackagingFilter;

  function updateCategoryPackagingFilterButtons() {
    const btnAll = document.getElementById('btnCatPackAll');
    const btnB10 = document.getElementById('btnCatPackB10');
    const btnB5 = document.getElementById('btnCatPackB5');

    if (btnAll) {
      if (currentCategoryPackagingFilter === 'ALL') {
        btnAll.className = 'btn-pack-pill active-all';
      } else {
        btnAll.className = 'btn-pack-pill';
      }
    }
    if (btnB10) {
      if (currentCategoryPackagingFilter === 'B10') {
        btnB10.className = 'btn-pack-pill active-b10';
      } else {
        btnB10.className = 'btn-pack-pill';
      }
    }
    if (btnB5) {
      if (currentCategoryPackagingFilter === 'B5') {
        btnB5.className = 'btn-pack-pill active-b5';
      } else {
        btnB5.className = 'btn-pack-pill';
      }
    }
  }

  function updateCategoryModalHeaderAndSubtitle() {
    const sub = document.getElementById('categoryProductModalSub');
    if (!sub) return;
    const st = currentCategoryState;
    const stLabel = (st && st !== 'ALL' && st !== 'All States' && st !== 'Pan-India' && st !== 'Pan India' && st !== 'All') ? st : 'Pan-India';
    const cat = escapeHTML(currentCategoryForProductModal);
    const b10RetsCount = currentCategoryRetailersAllList.filter(r => r.b10 > 0).length;
    const b5RetsCount = currentCategoryRetailersAllList.filter(r => r.b5 > 0).length;
    const allRetsCount = currentCategoryRetailersAllList.length;

    if (currentCategoryPackagingFilter === 'B5') {
      sub.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px; background:rgba(52,211,153,0.2); color:#34D399; padding:2px 8px; border-radius:4px; font-weight:800; font-size:11px; margin-right:6px;"><i class="fa-solid fa-filter"></i> B5 (HALF BOX) ONLY</span> Showing <strong>${b5RetsCount.toLocaleString()}</strong> retailers who scanned B5 packaging for <strong>${cat}</strong> in ${stLabel} (${catB5Current.toLocaleString()} scans, ${(catB5Current * 0.5).toFixed(1)} boxes). Ranked by B5 scans.`;
    } else if (currentCategoryPackagingFilter === 'B10') {
      sub.innerHTML = `<span style="display:inline-flex; align-items:center; gap:6px; background:rgba(129,140,248,0.2); color:#818CF8; padding:2px 8px; border-radius:4px; font-weight:800; font-size:11px; margin-right:6px;"><i class="fa-solid fa-filter"></i> B10 (FULL BOX) ONLY</span> Showing <strong>${b10RetsCount.toLocaleString()}</strong> retailers who scanned B10 packaging for <strong>${cat}</strong> in ${stLabel} (${catB10Current.toLocaleString()} scans, ${catB10Current.toFixed(1)} boxes). Ranked by B10 scans.`;
    } else {
      sub.innerHTML = `Showing all <strong>${allRetsCount.toLocaleString()}</strong> retailers scanning <strong>${cat}</strong> across both B10 (full box) and B5 (half box) packaging in ${stLabel} (${catTotalScansCurrent.toLocaleString()} total scans).`;
    }
  }

  function updateCategoryTableHeaderStyles() {
    const thTotal = document.getElementById('thCatRetTotalScans');
    const thB10 = document.getElementById('thCatRetB10Scans');
    const thB5 = document.getElementById('thCatRetB5Scans');

    if (thTotal) {
      if (currentCategoryPackagingFilter === 'ALL') {
        thTotal.innerHTML = `Total Scans <i class="fa-solid fa-arrow-down-wide-short" style="font-size:10px; margin-left:3px;"></i>`;
        thTotal.style.color = '#60A5FA';
        thTotal.style.fontWeight = '800';
      } else {
        thTotal.innerHTML = `Total Scans`;
        thTotal.style.color = '#94A3B8';
        thTotal.style.fontWeight = '600';
      }
    }
    if (thB10) {
      if (currentCategoryPackagingFilter === 'B10') {
        thB10.innerHTML = `B10 Scans (Full) <i class="fa-solid fa-arrow-down-wide-short" style="font-size:10px; margin-left:3px;"></i>`;
        thB10.style.color = '#818CF8';
        thB10.style.fontWeight = '800';
      } else {
        thB10.innerHTML = `B10 Scans (Full)`;
        thB10.style.color = '#94A3B8';
        thB10.style.fontWeight = '600';
      }
    }
    if (thB5) {
      if (currentCategoryPackagingFilter === 'B5') {
        thB5.innerHTML = `B5 Scans (Half) <i class="fa-solid fa-arrow-down-wide-short" style="font-size:10px; margin-left:3px;"></i>`;
        thB5.style.color = '#34D399';
        thB5.style.fontWeight = '800';
      } else {
        thB5.innerHTML = `B5 Scans (Half)`;
        thB5.style.color = '#94A3B8';
        thB5.style.fontWeight = '600';
      }
    }
  }

  function renderCategoryModalKPICards() {
    const statCardsEl = document.getElementById('categoryRetailerStatCards');
    if (!statCardsEl) return;
    
    const b10Active = currentCategoryPackagingFilter === 'B10';
    const b5Active = currentCategoryPackagingFilter === 'B5';
    const allActive = currentCategoryPackagingFilter === 'ALL';

    const b10Border = b10Active ? 'border: 2px solid #818CF8; background: rgba(99, 102, 241, 0.22); box-shadow: 0 0 14px rgba(129, 140, 248, 0.35);' : 'border: 1px solid rgba(255,255,255,0.08); background: rgba(30, 41, 59, 0.7);';
    const b5Border = b5Active ? 'border: 2px solid #34D399; background: rgba(16, 185, 129, 0.22); box-shadow: 0 0 14px rgba(52, 211, 153, 0.35);' : 'border: 1px solid rgba(255,255,255,0.08); background: rgba(30, 41, 59, 0.7);';
    const allBorder = allActive ? 'border: 2px solid #60A5FA; background: rgba(59, 130, 246, 0.15);' : 'border: 1px solid rgba(255,255,255,0.08); background: rgba(30, 41, 59, 0.7);';

    const b10RetsCount = currentCategoryRetailersAllList.filter(r => r.b10 > 0).length;
    const b5RetsCount = currentCategoryRetailersAllList.filter(r => r.b5 > 0).length;
    const allRetsCount = currentCategoryRetailersAllList.length;

    statCardsEl.innerHTML = `
      <div class="stat-card modal-kpi-card-clickable" onclick="setCategoryPackagingFilter('ALL')" style="${allBorder} padding: 12px 16px; border-radius: 8px; cursor: pointer;" title="Click to view all retailers">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Unique Retailers</div>
          ${allActive ? '<span style="font-size: 9px; background: rgba(96,165,250,0.3); color: #93C5FD; padding: 2px 6px; border-radius: 4px; font-weight: 800;">ACTIVE</span>' : ''}
        </div>
        <div style="font-size: 20px; font-weight: 800; color: #34D399; margin-top: 4px;">${allRetsCount.toLocaleString()}</div>
        <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px;">Scanning ${escapeHTML(currentCategoryForProductModal)}</div>
      </div>

      <div class="stat-card modal-kpi-card-clickable" onclick="setCategoryPackagingFilter('ALL')" style="${allBorder} padding: 12px 16px; border-radius: 8px; cursor: pointer;" title="Click to view all scans">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Scans</div>
          ${allActive ? '<span style="font-size: 9px; background: rgba(96,165,250,0.3); color: #93C5FD; padding: 2px 6px; border-radius: 4px; font-weight: 800;">ACTIVE</span>' : ''}
        </div>
        <div style="font-size: 20px; font-weight: 800; color: #60A5FA; margin-top: 4px;">${catTotalScansCurrent.toLocaleString()}</div>
        <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px;">Total verified scans</div>
      </div>

      <div class="stat-card modal-kpi-card-clickable" onclick="setCategoryPackagingFilter('B10')" style="${b10Border} padding: 12px 16px; border-radius: 8px; cursor: pointer;" title="Click to filter by B10 (Full Box) only">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; color: #818CF8; font-weight: 700; text-transform: uppercase;"><i class="fa-solid fa-box"></i> B10 Scans (Full Box)</div>
          ${b10Active ? '<span style="font-size: 9px; background: #4F46E5; color: #FFF; padding: 2px 6px; border-radius: 4px; font-weight: 800; letter-spacing: 0.5px;">FILTER ACTIVE</span>' : '<span style="font-size: 9px; color: #818CF8; opacity: 0.85;">Click to filter</span>'}
        </div>
        <div style="font-size: 20px; font-weight: 800; color: #818CF8; margin-top: 4px;">${catB10Current.toLocaleString()}</div>
        <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px;">${catB10Current.toFixed(1)} Boxes • ${b10RetsCount.toLocaleString()} Retailers</div>
      </div>

      <div class="stat-card modal-kpi-card-clickable" onclick="setCategoryPackagingFilter('B5')" style="${b5Border} padding: 12px 16px; border-radius: 8px; cursor: pointer;" title="Click to filter by B5 (Half Box) only">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="font-size: 11px; color: #34D399; font-weight: 700; text-transform: uppercase;"><i class="fa-solid fa-box-open"></i> B5 Scans (Half Box)</div>
          ${b5Active ? '<span style="font-size: 9px; background: #059669; color: #FFF; padding: 2px 6px; border-radius: 4px; font-weight: 800; letter-spacing: 0.5px;">FILTER ACTIVE</span>' : '<span style="font-size: 9px; color: #34D399; opacity: 0.85;">Click to filter</span>'}
        </div>
        <div style="font-size: 20px; font-weight: 800; color: #FBBF24; margin-top: 4px;">${catB5Current.toLocaleString()}</div>
        <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px;">${(catB5Current * 0.5).toFixed(1)} Boxes • ${b5RetsCount.toLocaleString()} Retailers</div>
      </div>

      <div class="stat-card modal-kpi-card-clickable" onclick="setCategoryPackagingFilter('ALL')" style="background: rgba(30, 41, 59, 0.7); border: 1px solid rgba(255,255,255,0.08); padding: 12px 16px; border-radius: 8px; cursor: pointer;" title="Total Calculated Boxes (B10 + 0.5×B5)">
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Calculated Boxes</div>
        <div style="font-size: 20px; font-weight: 800; color: var(--accent-amber, #F59E0B); margin-top: 4px;">${catBoxesCurrent.toFixed(1)}</div>
        <div style="font-size: 10.5px; color: var(--text-secondary); margin-top: 2px;">Sum (B10 + 0.5×B5)</div>
      </div>
    `;
  }

  function switchCategoryModalTab(tab) {
    currentCategoryModalActiveTab = tab;
    const viewRet = document.getElementById('catModalViewRetailers');
    const viewProd = document.getElementById('catModalViewProducts');
    const btnRet = document.getElementById('btnCatTabRetailers');
    const btnProd = document.getElementById('btnCatTabProducts');
    const btnExpRet = document.getElementById('btnExportCategoryRetailerExcel');
    const btnExpProd = document.getElementById('btnExportCategoryProductExcel');

    if (tab === 'retailers') {
      if (viewRet) viewRet.style.display = 'block';
      if (viewProd) viewProd.style.display = 'none';
      if (btnRet) { btnRet.className = 'btn btn-sm btn-primary'; btnRet.style.fontWeight = '700'; }
      if (btnProd) { btnProd.className = 'btn btn-sm btn-outline'; btnProd.style.fontWeight = '600'; }
      if (btnExpRet) btnExpRet.style.display = 'inline-flex';
      if (btnExpProd) btnExpProd.style.display = 'none';
      renderCategoryDrilldownRetailersTable();
    } else {
      if (viewRet) viewRet.style.display = 'none';
      if (viewProd) viewProd.style.display = 'block';
      if (btnRet) { btnRet.className = 'btn btn-sm btn-outline'; btnRet.style.fontWeight = '600'; }
      if (btnProd) { btnProd.className = 'btn btn-sm btn-primary'; btnProd.style.fontWeight = '700'; }
      if (btnExpRet) btnExpRet.style.display = 'none';
      if (btnExpProd) btnExpProd.style.display = 'inline-flex';
      renderCategoryDrilldownProductTable();
    }
  }
  window.switchCategoryModalTab = switchCategoryModalTab;

  function onCategoryModalSearch() {
    if (currentCategoryModalActiveTab === 'retailers') {
      renderCategoryDrilldownRetailersTable();
    } else {
      renderCategoryDrilldownProductTable();
    }
  }
  window.onCategoryModalSearch = onCategoryModalSearch;

  function renderCategoryDrilldownRetailersTable() {
    const tbody = document.getElementById('tblCategoryRetailerBody');
    const searchVal = document.getElementById('categoryProductSearch')?.value.trim().toLowerCase() || '';
    if (!tbody) return;
    tbody.innerHTML = '';

    let list = currentCategoryRetailersAllList ? [...currentCategoryRetailersAllList] : [];
    
    // 1. Packaging Filter & Sorting:
    if (currentCategoryPackagingFilter === 'B5') {
      // ONLY retailers with B5 scans!
      list = list.filter(r => r.b5 > 0);
      list.sort((a, b) => b.b5 - a.b5 || b.scans - a.scans);
    } else if (currentCategoryPackagingFilter === 'B10') {
      // ONLY retailers with B10 scans!
      list = list.filter(r => r.b10 > 0);
      list.sort((a, b) => b.b10 - a.b10 || b.scans - a.scans);
    } else {
      // ALL retailers
      list.sort((a, b) => b.scans - a.scans || b.boxes - a.boxes);
    }

    // 2. Search Filter:
    if (searchVal) {
      list = list.filter(r =>
        (r.retailer_name && String(r.retailer_name).toLowerCase().includes(searchVal)) ||
        (r.mobile_number && String(r.mobile_number).includes(searchVal)) ||
        (r.city && String(r.city).toLowerCase().includes(searchVal)) ||
        (r.distributor_name && String(r.distributor_name).toLowerCase().includes(searchVal))
      );
    }

    if (list.length === 0) {
      const filterMsg = currentCategoryPackagingFilter === 'B5' 
        ? 'No retailers found with B5 (half box) scans' 
        : (currentCategoryPackagingFilter === 'B10' ? 'No retailers found with B10 (full box) scans' : 'No retailers found');
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 28px; font-size: 13.5px;">${filterMsg} matching criteria for ${escapeHTML(currentCategoryForProductModal)}.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map((r, i) => {
      const lastDate = r.lastScan ? String(r.lastScan).slice(0, 16).replace('T', ' ') : 'N/A';
      
      const b10BadgeStyle = currentCategoryPackagingFilter === 'B10'
        ? 'background: rgba(129,140,248,0.3); color: #C7D2FE; font-weight: 800; border: 1px solid rgba(129,140,248,0.5);'
        : 'background: rgba(129,140,248,0.15); color: #818CF8;';
        
      const b5BadgeStyle = currentCategoryPackagingFilter === 'B5'
        ? 'background: rgba(52,211,153,0.3); color: #A7F3D0; font-weight: 800; border: 1px solid rgba(52,211,153,0.5);'
        : 'background: rgba(52,211,153,0.15); color: #34D399;';

      const rowHighlight = currentCategoryPackagingFilter === 'B5'
        ? (i < 3 ? 'background: rgba(16, 185, 129, 0.06);' : '')
        : (currentCategoryPackagingFilter === 'B10' && i < 3 ? 'background: rgba(99, 102, 241, 0.06);' : '');

      return `
        <tr style="${rowHighlight}">
          <td style="color: var(--text-muted); font-weight: 700;">${i + 1}</td>
          <td><strong style="color: #FFF;">${escapeHTML(r.retailer_name)}</strong></td>
          <td><code style="color: #94A3B8;">${escapeHTML(r.mobile_number)}</code></td>
          <td>${escapeHTML(r.city)}</td>
          <td><span style="color: #60A5FA; cursor: pointer;" onclick="openSingleDistributorDetailModal('${escapeHTML(r.distributor_name).replace(/'/g, "\\'")}')">${escapeHTML(r.distributor_name)}</span></td>
          <td style="text-align: right; font-weight: 700; color: #60A5FA;">${r.scans.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700;"><span class="badge" style="${b10BadgeStyle}">${r.b10.toLocaleString()}</span></td>
          <td style="text-align: right; font-weight: 700;"><span class="badge" style="${b5BadgeStyle}">${r.b5.toLocaleString()}</span></td>
          <td style="text-align: right; font-weight: 800; color: var(--accent-amber);">${r.boxes.toFixed(1)}</td>
          <td style="text-align: right; font-size: 11px; color: var(--text-secondary);">${escapeHTML(lastDate)}</td>
        </tr>
      `;
    }).join('');
  }
  window.renderCategoryDrilldownRetailersTable = renderCategoryDrilldownRetailersTable;
  window.renderCategoryRetailersTable = renderCategoryDrilldownRetailersTable;

  function renderCategoryDrilldownProductTable() {
    const tbody = document.getElementById('tblCategoryProductBody');
    const searchVal = document.getElementById('categoryProductSearch')?.value.trim().toLowerCase() || '';
    if (!tbody) return;
    tbody.innerHTML = '';

    let prods = currentCategoryProductsAllList ? [...currentCategoryProductsAllList] : [];
    
    // 1. Packaging Filter & Sorting:
    if (currentCategoryPackagingFilter === 'B5') {
      prods = prods.filter(p => p.b5 > 0);
      prods.sort((a, b) => b.b5 - a.b5 || b.scans - a.scans);
    } else if (currentCategoryPackagingFilter === 'B10') {
      prods = prods.filter(p => p.b10 > 0);
      prods.sort((a, b) => b.b10 - a.b10 || b.scans - a.scans);
    } else {
      prods.sort((a, b) => b.scans - a.scans);
    }

    // 2. Search Filter:
    if (searchVal) {
      prods = prods.filter(p => 
        (p.sku_code && String(p.sku_code).toLowerCase().includes(searchVal)) || 
        (p.sku_description && String(p.sku_description).toLowerCase().includes(searchVal))
      );
    }

    if (prods.length === 0) {
      const filterMsg = currentCategoryPackagingFilter === 'B5' 
        ? 'No SKU products found with B5 packaging scans' 
        : (currentCategoryPackagingFilter === 'B10' ? 'No SKU products found with B10 packaging scans' : 'No matching products found');
      tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 28px; font-size: 13.5px;">${filterMsg} for ${escapeHTML(currentCategoryForProductModal)}.</td></tr>`;
      return;
    }

    tbody.innerHTML = prods.map((p, i) => {
      const b10Badge = p.b10 > 0 
        ? `<span class="badge" style="background: rgba(129,140,248,0.2); color: #818CF8; font-weight: 700;">${p.b10.toLocaleString()}</span>`
        : `<span style="color: var(--text-muted); font-size: 11px;">0</span>`;
      const b5Badge = p.b5 > 0 
        ? `<span class="badge" style="background: rgba(52,211,153,0.2); color: #34D399; font-weight: 700;">${p.b5.toLocaleString()}</span>`
        : `<span style="color: var(--text-muted); font-size: 11px;">0</span>`;

      return `
        <tr>
          <td style="color: var(--text-muted); font-weight: 700;">${i + 1}</td>
          <td><code>${escapeHTML(p.sku_code)}</code></td>
          <td><strong>${escapeHTML(p.sku_description)}</strong></td>
          <td style="text-align: right;">${b10Badge}</td>
          <td style="text-align: right;">${b5Badge}</td>
          <td style="text-align: right; font-weight: 700; color: #60A5FA;">${p.scans.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${p.boxes.toFixed(1)}</td>
          <td style="text-align: right; font-weight: 600;">${p.unique_retailers.toLocaleString()}</td>
          <td style="text-align: right;">₹${p.mrp ? Number(p.mrp).toFixed(2) : '0.00'}</td>
          <td style="text-align: right;">₹${p.unit_price ? Number(p.unit_price).toFixed(2) : '0.00'}</td>
        </tr>
      `;
    }).join('');
  }
  window.renderCategoryDrilldownProductTable = renderCategoryDrilldownProductTable;
  window.renderCategoryProductTable = renderCategoryDrilldownProductTable;

  function exportCategoryDrilldownRetailersExcel() {
    let list = currentCategoryRetailersAllList ? [...currentCategoryRetailersAllList] : [];
    if (currentCategoryPackagingFilter === 'B5') {
      list = list.filter(r => r.b5 > 0).sort((a, b) => b.b5 - a.b5 || b.scans - a.scans);
    } else if (currentCategoryPackagingFilter === 'B10') {
      list = list.filter(r => r.b10 > 0).sort((a, b) => b.b10 - a.b10 || b.scans - a.scans);
    } else {
      list.sort((a, b) => b.scans - a.scans || b.boxes - a.boxes);
    }
    if (list.length === 0) return;

    const packTag = currentCategoryPackagingFilter === 'ALL' ? 'All_Packaging' : currentCategoryPackagingFilter;
    const data = list.map((r, i) => ({
      "Rank": i + 1,
      "Retailer Name": r.retailer_name,
      "Mobile Number": r.mobile_number,
      "City": r.city,
      "Mapped Distributor": r.distributor_name,
      "Category Name": currentCategoryForProductModal,
      "Filter Packaging": packTag,
      "Total Scans": r.scans,
      "B10 Scans (Full Box)": r.b10,
      "B5 Scans (Half Box)": r.b5,
      "Calculated Box Count": r.boxes,
      "Last Scan Date": r.lastScan || 'N/A'
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Retailers");
    XLSX.writeFile(wb, `Category_${(currentCategoryForProductModal || 'Category').replace(/[^a-zA-Z0-9]/g, '_')}_${packTag}_Retailers.xlsx`);
  }
  window.exportCategoryDrilldownRetailersExcel = exportCategoryDrilldownRetailersExcel;
  window.exportCategoryRetailersExcel = exportCategoryDrilldownRetailersExcel;

  function exportCategoryDrilldownProductsExcel() {
    let prods = currentCategoryProductsAllList ? [...currentCategoryProductsAllList] : [];
    if (currentCategoryPackagingFilter === 'B5') {
      prods = prods.filter(p => p.b5 > 0).sort((a, b) => b.b5 - a.b5 || b.scans - a.scans);
    } else if (currentCategoryPackagingFilter === 'B10') {
      prods = prods.filter(p => p.b10 > 0).sort((a, b) => b.b10 - a.b10 || b.scans - a.scans);
    } else {
      prods.sort((a, b) => b.scans - a.scans);
    }
    if (prods.length === 0) return;

    const packTag = currentCategoryPackagingFilter === 'ALL' ? 'All_Packaging' : currentCategoryPackagingFilter;
    const data = prods.map((p, i) => ({
      "Rank": i + 1,
      "SKU Code": p.sku_code,
      "Product Description": p.sku_description,
      "Category Name": currentCategoryForProductModal,
      "Filter Packaging": packTag,
      "B10 Scans (Full Box)": p.b10,
      "B5 Scans (Half Box)": p.b5,
      "Total Scans": p.scans,
      "Calculated Boxes": p.boxes,
      "Unique Retailers": p.unique_retailers,
      "MRP (₹)": p.mrp,
      "Unit Price (₹)": p.unit_price
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, `Category_${(currentCategoryForProductModal || 'Category').replace(/[^a-zA-Z0-9]/g, '_')}_${packTag}_Products.xlsx`);
  }
  window.exportCategoryDrilldownProductsExcel = exportCategoryDrilldownProductsExcel;
  window.exportCategoryProductsExcel = exportCategoryDrilldownProductsExcel;

  function exportCategoryProductExcel() {
    let prods = [];
    if (dashboardData && dashboardData.category_product_drilldown && dashboardData.category_product_drilldown[currentCategoryForProductModal]) {
      prods = dashboardData.category_product_drilldown[currentCategoryForProductModal];
    }
    if (prods.length === 0) {
      alert('No product drill-down data available to export.');
      return;
    }
    const exportData = prods.map(p => ({
      "Category": currentCategoryForProductModal,
      "SKU Code": p.sku_code,
      "SKU Description": p.sku_description,
      "Total Scans": p.scans,
      "Calculated Boxes": p.boxes,
      "Unique Retailers": p.unique_retailers,
      "MRP (INR)": p.mrp,
      "Unit Price (INR)": p.unit_price
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, ws, "Product_Drilldown");
    XLSX.writeFile(wb, `JGH_${currentCategoryForProductModal.replace(/\s+/g, '_')}_Products.xlsx`);
  }

  window.openCategoryProductModal = openCategoryProductModal;
  window.closeCategoryProductModal = closeCategoryProductModal;
  window.renderCategoryProductTable = renderCategoryProductTable;
  window.exportCategoryProductExcel = exportCategoryProductExcel;
  window.openDistributorModal = openDistributorModal;
  window.openGrowthOpportunityModal = openGrowthOpportunityModal;
  window.openBronzeModal = openBronzeModal;
  window.openConsistencyModal = openConsistencyModal;
  window.openDormantModal = openDormantModal;
  window.closeDormantModal = closeDormantModal;
  window.openLowPenetrationModal = openLowPenetrationModal;
  window.openHighestDiversityModal = openHighestDiversityModal;
  window.showTerritoryFlowPage = showTerritoryFlowPage;
  window.showMainDashboardView = showMainDashboardView;
  window.openTerritoryFlowModal = openTerritoryFlowModal;
  window.closeTerritoryFlowModal = closeTerritoryFlowModal;
  window.setTerritoryLevel = setTerritoryLevel;

  window.openCategoryProductModal = openCategoryProductModal;
  window.closeCategoryProductModal = closeCategoryProductModal;
  window.setCategoryPackagingFilter = setCategoryPackagingFilter;
  window.switchCategoryModalTab = switchCategoryModalTab;
  window.onCategoryModalSearch = onCategoryModalSearch;
  window.renderCategoryDrilldownRetailersTable = renderCategoryDrilldownRetailersTable;
  window.renderCategoryDrilldownProductTable = renderCategoryDrilldownProductTable;
  window.renderCategoryRetailersTable = renderCategoryDrilldownRetailersTable;
  window.renderCategoryProductTable = renderCategoryDrilldownProductTable;
  window.exportCategoryDrilldownRetailersExcel = exportCategoryDrilldownRetailersExcel;
  window.exportCategoryDrilldownProductsExcel = exportCategoryDrilldownProductsExcel;
  window.exportCategoryRetailersExcel = exportCategoryDrilldownRetailersExcel;
  window.exportCategoryProductExcel = exportCategoryDrilldownProductsExcel;
  
  window.openDistributorModal = openDistributorModal;
  window.openGrowthOpportunityModal = openGrowthOpportunityModal;
  window.openBronzeModal = openBronzeModal;
  window.openConsistencyModal = openConsistencyModal;
  window.openDormantModal = openDormantModal;
  window.closeDormantModal = closeDormantModal;
  window.openLowPenetrationModal = openLowPenetrationModal;
  window.openHighestDiversityModal = openHighestDiversityModal;
  window.showTerritoryFlowPage = showTerritoryFlowPage;
  window.showMainDashboardView = showMainDashboardView;
  window.openTerritoryFlowModal = openTerritoryFlowModal;
  window.closeTerritoryFlowModal = closeTerritoryFlowModal;
  window.setTerritoryLevel = setTerritoryLevel;
  window.drillToTerritoryStep = drillToTerritoryStep;
  window.openStateDistributorDrilldown = openStateDistributorDrilldown;
  window.goBackFromDrilldown = goBackFromDrilldown;
  window.filterDrilldownTable = filterDrilldownTable;
  window.exportDrilldownExcel = exportDrilldownExcel;

  // ==========================================
  // TOTAL RETAILERS TAB (all_retailers data)
  // ==========================================
  let totalRetailersRendered = false;

  function renderTotalRetailersTable() {
    const tbody = document.getElementById('tblTotalRetailersBody');
    const elCount = document.getElementById('totalRetailersCount');
    if (!tbody || !dashboardData || !Array.isArray(dashboardData.all_retailers)) return;

    const searchEl = document.getElementById('txtTotalRetailersSearch');
    const statusEl = document.getElementById('selTotalRetailersStatus');
    const q = searchEl ? searchEl.value.trim().toLowerCase() : '';
    const statusFilter = statusEl ? statusEl.value : 'all';

    let list = dashboardData.all_retailers;

    // Status filter
    if (statusFilter === 'active') {
      list = list.filter(r => Number(r.is_active_6m) === 1);
    } else if (statusFilter === 'inactive') {
      list = list.filter(r => Number(r.is_active_6m) !== 1);
    }

    // Search filter
    if (q) {
      list = list.filter(r => {
        return (
          (r.retailer_name && r.retailer_name.toLowerCase().includes(q)) ||
          (r.mobile_number && r.mobile_number.toLowerCase().includes(q)) ||
          (r.city && r.city.toLowerCase().includes(q)) ||
          (r.State_Name && r.State_Name.toLowerCase().includes(q)) ||
          (r.distributor_name && r.distributor_name.toLowerCase().includes(q)) ||
          (r.status_retailer_id && String(r.status_retailer_id).includes(q))
        );
      });
    }

    if (elCount) elCount.textContent = `Showing ${list.length.toLocaleString()} retailers`;

    // Show max 500 rows for performance
    const display = list.slice(0, 500);

    if (display.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">No retailers match search criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = display.map(r => {
      const isActive = Number(r.is_active_6m) === 1;
      const statusBadge = isActive
        ? `<span class="badge" style="background: rgba(16,185,129,0.15); color: #34D399;"><i class="fa-solid fa-circle-check"></i> Active</span>`
        : `<span class="badge" style="background: rgba(244,63,94,0.15); color: #FB7185;"><i class="fa-solid fa-circle-xmark"></i> Inactive</span>`;
      return `
        <tr onclick="handleRetailerClick('${r.status_retailer_id || r.id}', '${escapeHTML(r.distributor_name || '')}')" style="cursor: pointer;" title="Click for Retailer Intelligence">
          <td><span style="font-family: monospace; color: var(--text-secondary);">${r.status_retailer_id || ''}</span></td>
          <td><strong style="color: #60A5FA;">${escapeHTML(r.retailer_name || 'N/A')}</strong></td>
          <td><span style="font-family: monospace;">${escapeHTML(r.mobile_number || 'N/A')}</span></td>
          <td>${escapeHTML(r.city || 'N/A')}</td>
          <td><span class="badge badge-glow" style="background: rgba(99,102,241,0.1); color: #818CF8;">${escapeHTML(r.State_Name || r.state || 'N/A')}</span></td>
          <td><span style="color: #60A5FA; font-weight: 600;">${escapeHTML(r.distributor_name || 'N/A')}</span></td>
          <td style="text-align: right; font-weight: 700; color: #10B981;">${(r.scans_6m || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${(r.boxes_6m || 0).toFixed(1)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');

    totalRetailersRendered = true;
  }

  function filterTotalRetailersTable() {
    renderTotalRetailersTable();
  }

  window.filterTotalRetailersTable = filterTotalRetailersTable;

  // ==========================================
  // SINGLE DISTRIBUTOR DETAIL MODAL (Popup Visuals & Raw Data)
  // ==========================================
  let currentSingleDistributor = '';
  let chartSingleDistCategoryInstance = null;
  let chartSingleDistTopRetailersInstance = null;

  function handleRetailerClick(retailerId, distName) {
    const dist = distName || currentSingleDistributor || '';
    let retObj = null;
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      retObj = dashboardData.all_retailers.find(r => 
        String(r.status_retailer_id || r.id).toLowerCase() === String(retailerId).toLowerCase()
      );
    }
    if (!retObj) {
      retObj = { id: retailerId, status_retailer_id: retailerId, retailer_name: `Retailer ${retailerId}`, distributor_name: dist };
    }
    const retName = retObj.retailer_name || retObj.name || `Retailer ${retailerId}`;
    openSingleRetailerVisualModal(dist, retName, retObj);
  }
  window.handleRetailerClick = handleRetailerClick;

  function handleRetailerClickByName(distName, retailerName) {
    const dist = distName || currentSingleDistributor || '';
    let retObj = null;
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      retObj = dashboardData.all_retailers.find(r => 
        (r.retailer_name || r.name || '').toLowerCase() === String(retailerName).toLowerCase()
      );
    }
    if (!retObj) {
      retObj = { retailer_name: retailerName, distributor_name: dist };
    }
    openSingleRetailerVisualModal(dist, retailerName, retObj);
  }
  window.handleRetailerClickByName = handleRetailerClickByName;

  let currentSingleDistScope = 'state'; // 'state' or 'national'
  let currentSingleDistStatusFilter = 'all'; // 'all', 'active', 'inactive'

  function setSingleDistScope(scope) {
    currentSingleDistScope = scope;
    openSingleDistributorDetailModal(currentSingleDistributor);
  }
  window.setSingleDistScope = setSingleDistScope;

  function setSingleDistStatusFilter(status) {
    currentSingleDistStatusFilter = status;
    openSingleDistributorDetailModal(currentSingleDistributor);
  }
  window.setSingleDistStatusFilter = setSingleDistStatusFilter;

  function openSingleDistributorDetailModal(distributorName, statusOverride) {
    currentSingleDistributor = distributorName;
    const modal = document.getElementById('singleDistributorModal');
    if (!modal) return;

    // All India retailers under this distributor
    const allDistRetailers = (dashboardData && Array.isArray(dashboardData.all_retailers))
      ? dashboardData.all_retailers.filter(r => (r.distributor_name || '').toLowerCase() === distributorName.toLowerCase())
      : [];

    // State specific retailers if currentDrilldownState is active
    const stateDistRetailers = currentDrilldownState
      ? allDistRetailers.filter(r => {
          let st = r.State_Name || r.state || 'Unknown';
          if (st === 'Jammu & Kashmir') st = 'Jammu and Kashmir';
          return st.toLowerCase() === currentDrilldownState.toLowerCase();
        })
      : allDistRetailers;

    const stateActiveCount = stateDistRetailers.filter(r => (singleDistTimeframe === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0)) > 0 || Number(r.is_active_6m) === 1).length;
    const nationalActiveCount = allDistRetailers.filter(r => (singleDistTimeframe === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0)) > 0 || Number(r.is_active_6m) === 1).length;

    // Smart Scope Selection:
    // If current state has 0 active stores / 0 scans while national has active stores (e.g. Ahuja Agencies has 842 active nationally, 0 in Maharashtra):
    // Default to 'national' so the user is immediately shown live scan intelligence, top categories, and active stores!
    let scope = currentSingleDistScope;
    if (!currentDrilldownState || stateDistRetailers.length === 0) {
      scope = 'national';
    } else if (scope === 'state' && stateActiveCount === 0 && nationalActiveCount > 0) {
      scope = 'national';
      currentSingleDistScope = 'national';
    }
    const scopeRetailers = (scope === 'state' && currentDrilldownState) ? stateDistRetailers : allDistRetailers;

    const activeCountInScope = scopeRetailers.filter(r => (singleDistTimeframe === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0)) > 0 || Number(r.is_active_6m) === 1).length;
    const inactiveCountInScope = scopeRetailers.length - activeCountInScope;

    // Initial Status Filter Selection:
    // Core Rule: If scans happened, we MUST show data!
    // If statusOverride is explicitly passed ('active', 'inactive', 'all'), use it.
    // Otherwise, ALWAYS default to 'active' if active retailers exist so the user sees real scans, boxes and categories.
    // Never allow background dormant modes or stale variables to force an active partner into 0-scan inactive view.
    if (statusOverride) {
      currentSingleDistStatusFilter = statusOverride;
    } else if (activeCountInScope > 0) {
      currentSingleDistStatusFilter = 'active';
    } else {
      currentSingleDistStatusFilter = 'all';
    }

    const statusFilter = currentSingleDistStatusFilter || 'active';

    // Apply status filtering strictly
    let distRetailers = scopeRetailers;
    if (statusFilter === 'active') {
      distRetailers = scopeRetailers.filter(r => {
        const scans = singleDistTimeframe === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
        return scans > 0 || Number(r.is_active_6m) === 1;
      });
    } else if (statusFilter === 'inactive') {
      distRetailers = scopeRetailers.filter(r => {
        const scans = singleDistTimeframe === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0);
        return scans === 0 && Number(r.is_active_6m) !== 1;
      });
    }

    // Title, Scope & Status Header Controls
    const elTitle = document.getElementById('lblSingleDistributorTitle');
    if (elTitle) {
      const scopeBtns = currentDrilldownState ? `
        <button onclick="setSingleDistScope('state')" class="btn btn-sm ${scope === 'state' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11px; padding: 4px 10px; font-weight: 700;">
          📍 ${escapeHTML(currentDrilldownState)} Only (${stateDistRetailers.length})
        </button>
        <button onclick="setSingleDistScope('national')" class="btn btn-sm ${scope === 'national' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11px; padding: 4px 10px; font-weight: 700;">
          🇮🇳 All-India (${allDistRetailers.length})
        </button>
      ` : '';

      const statusBtns = `
        <button onclick="setSingleDistStatusFilter('active')" class="btn btn-sm ${statusFilter === 'active' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11px; padding: 4px 10px; font-weight: 700; ${statusFilter === 'active' ? 'background: #10B981; border-color: #10B981;' : ''}">
          🟢 Active (${activeCountInScope})
        </button>
        <button onclick="setSingleDistStatusFilter('inactive')" class="btn btn-sm ${statusFilter === 'inactive' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11px; padding: 4px 10px; font-weight: 700; ${statusFilter === 'inactive' ? 'background: #F43F5E; border-color: #F43F5E;' : ''}">
          🔴 Inactive (${inactiveCountInScope})
        </button>
        <button onclick="setSingleDistStatusFilter('all')" class="btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline'}" style="font-size: 11px; padding: 4px 10px; font-weight: 700;">
          🌐 All (${scopeRetailers.length})
        </button>
      `;

      elTitle.innerHTML = `
        <div>
          <div style="font-size: 16px; font-weight: 800;">
            <i class="fa-solid fa-building text-indigo"></i> Partner Intelligence: <strong>${escapeHTML(distributorName)}</strong>
          </div>
          <div style="display: flex; gap: 12px; margin-top: 8px; align-items: center; flex-wrap: wrap;">
            ${currentDrilldownState ? `<div style="display: flex; gap: 6px; align-items: center;"><span style="font-size: 11px; color: var(--text-muted); font-weight: 700;">SCOPE:</span>${scopeBtns}</div>` : ''}
            <div style="display: flex; gap: 6px; align-items: center;"><span style="font-size: 11px; color: var(--text-muted); font-weight: 700;">FILTER STATUS:</span>${statusBtns}</div>
          </div>
        </div>
      `;
    }

    const overallTotalReg = scopeRetailers.length;
    const totalActive = activeCountInScope;
    const actPct = overallTotalReg > 0 ? ((totalActive / overallTotalReg) * 100).toFixed(1) : '0.0';

    const totalScans = distRetailers.reduce((sum, r) => sum + (singleDistTimeframe === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0)), 0);
    const totalBoxes = distRetailers.reduce((sum, r) => sum + (singleDistTimeframe === 'july' ? (r.boxes_july || 0) : (r.boxes_6m || 0)), 0);
    const segmentActiveCount = distRetailers.filter(r => (singleDistTimeframe === 'july' ? (r.scans_july || 0) : (r.scans_6m || 0)) > 0 || Number(r.is_active_6m) === 1).length;
    const avgScans = segmentActiveCount > 0 ? (totalScans / segmentActiveCount) : 0;

    const displayScans = totalScans;
    const displayBoxes = totalBoxes;
    const displayActiveStores = totalActive;
    const displayActivePct = actPct;
    const displayActiveLabel = singleDistTimeframe === 'july' ? 'Active Outlets (July)' : 'Active Outlets (6M)';
    const scanLabel = singleDistTimeframe === 'july' ? 'July Month Scans' : 'Total 6M Scans';
    const boxLabel = singleDistTimeframe === 'july' ? 'July Box Count' : 'Calculated 6M Boxes';

    // Render Stat Cards
    const elCards = document.getElementById('singleDistStatCards');
    if (elCards) {
      elCards.innerHTML = `
        <div class="modal-stat-card">
          <div class="stat-value" style="color: #818CF8;">${overallTotalReg.toLocaleString()}</div>
          <div class="stat-label">Total Retailers</div>
        </div>
        <div class="modal-stat-card">
          <div class="stat-value" style="color: #10B981;">${displayActiveStores.toLocaleString()} (${displayActivePct}%)</div>
          <div class="stat-label">${displayActiveLabel}</div>
        </div>
        <div class="modal-stat-card">
          <div class="stat-value" style="color: #60A5FA;">${displayScans.toLocaleString()}</div>
          <div class="stat-label">${scanLabel}</div>
        </div>
        <div class="modal-stat-card">
          <div class="stat-value" style="color: #FBBF24;">${displayBoxes.toFixed(1)}</div>
          <div class="stat-label">${boxLabel}</div>
        </div>
        <div class="modal-stat-card">
          <div class="stat-value" style="color: #A7F3D0;">${avgScans.toFixed(1)}</div>
          <div class="stat-label">Avg Scans/Active Store</div>
        </div>
      `;
    }

    // Reset search & view to visuals
    const elSearch = document.getElementById('txtSingleDistSearch');
    const elQuickSearch = document.getElementById('txtSingleDistQuickSearch');
    if (elSearch) elSearch.value = '';
    if (elQuickSearch) elQuickSearch.value = '';

    switchSingleDistView('visuals');
    renderSingleDistributorTable(distRetailers);
    renderSingleDistributorQuickTable(distRetailers);
    renderSingleDistributorCharts(distributorName, distRetailers);

    modal.classList.add('show');
  }

  function closeSingleDistributorModal() {
    const modal = document.getElementById('singleDistributorModal');
    if (modal) modal.classList.remove('show');
  }

  function switchSingleDistView(viewMode) {
    const elVis = document.getElementById('singleDistViewVisuals');
    const elData = document.getElementById('singleDistViewData');
    const btnVis = document.getElementById('btnSingleDistVisuals');
    const btnData = document.getElementById('btnSingleDistData');

    if (viewMode === 'visuals') {
      if (elVis) elVis.style.display = 'block';
      if (elData) elData.style.display = 'none';
      if (btnVis) btnVis.classList.add('active');
      if (btnData) btnData.classList.remove('active');
    } else {
      if (elVis) elVis.style.display = 'none';
      if (elData) elData.style.display = 'block';
      if (btnVis) btnVis.classList.remove('active');
      if (btnData) btnData.classList.add('active');
    }
  }

  function renderSingleDistributorTable(filteredList) {
    const tbody = document.getElementById('tblSingleDistributorBody');
    if (!tbody) return;

    const q = (document.getElementById('txtSingleDistSearch')?.value || '').trim().toLowerCase();
    const distRetailers = filteredList || currentDistRetailersCache || [];

    const filtered = distRetailers.filter(r => {
      return (
        String(r.status_retailer_id || r.id).toLowerCase().includes(q) ||
        (r.retailer_name && r.retailer_name.toLowerCase().includes(q)) ||
        (r.mobile_number && String(r.mobile_number).includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q))
      );
    }).sort((a, b) => {
      const sA = singleDistTimeframe === 'july' ? (a.scans_july || a.total_scans || 0) : (a.scans_6m || 0);
      const sB = singleDistTimeframe === 'july' ? (b.scans_july || b.total_scans || 0) : (b.scans_6m || 0);
      return sB - sA;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 20px; color: var(--text-muted);">No retailers match current scope/status filters.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const scansCount = singleDistTimeframe === 'july' ? (r.scans_july || r.total_scans || 0) : (r.scans_6m || 0);
      const boxesCount = singleDistTimeframe === 'july' ? (r.boxes_july || r.box_count || 0) : (r.boxes_6m || 0);
      const isActive = scansCount > 0 || Number(r.is_active_6m) === 1;
      const statusBadge = isActive 
        ? `<span class="badge" style="background: rgba(16,185,129,0.15); color: #34D399;"><i class="fa-solid fa-circle-check"></i> Active</span>`
        : `<span class="badge" style="background: rgba(244,63,94,0.15); color: #FB7185;"><i class="fa-solid fa-circle-xmark"></i> Inactive</span>`;

      const lastDate = r.retailer_last_scan || r.last_scan || 'Never';
      const dateBadge = (lastDate !== 'Never' && lastDate)
        ? `<span class="badge" style="background: rgba(59,130,246,0.15); color: #60A5FA; font-size:11px;"><i class="fa-solid fa-calendar-day"></i> ${escapeHTML(lastDate)}</span>`
        : `<span style="color: var(--text-muted); font-size:11px;">Never</span>`;

      return `
        <tr onclick="handleRetailerClick('${r.status_retailer_id || r.id}', '${escapeHTML(currentSingleDistributor)}')" style="cursor: pointer;" title="Click for Retailer Intelligence">
          <td><strong>${r.status_retailer_id || r.id}</strong></td>
          <td><strong style="color: #60A5FA;">${escapeHTML(r.retailer_name || r.name || 'N/A')}</strong></td>
          <td>${escapeHTML(String(r.mobile_number || 'N/A'))}</td>
          <td>${escapeHTML(r.city || 'N/A')}</td>
          <td style="text-align: right; font-weight: 700; color: #10B981;">${scansCount.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${boxesCount.toFixed(1)}</td>
          <td>${dateBadge}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  function renderSingleDistributorQuickTable(filteredList) {
    const tbody = document.getElementById('tblSingleDistributorQuickBody');
    const header = document.getElementById('lblSingleDistRetailerHeader');
    if (!tbody) return;

    const q = (document.getElementById('txtSingleDistQuickSearch')?.value || '').trim().toLowerCase();
    const distRetailers = filteredList || currentDistRetailersCache || [];

    if (header) {
      header.innerHTML = `<i class="fa-solid fa-store text-emerald"></i> Retailers Under Filter Scope (${distRetailers.length.toLocaleString()}) <span style="font-size: 10.5px; color: #94A3B8; font-weight: normal;">(Click row to view details)</span>`;
    }

    const filtered = distRetailers.filter(r => {
      return (
        String(r.status_retailer_id || r.id).toLowerCase().includes(q) ||
        (r.retailer_name && r.retailer_name.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q))
      );
    }).sort((a, b) => {
      const sA = singleDistTimeframe === 'july' ? (a.scans_july || a.total_scans || 0) : (a.scans_6m || 0);
      const sB = singleDistTimeframe === 'july' ? (b.scans_july || b.total_scans || 0) : (b.scans_6m || 0);
      return sB - sA;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--text-muted);">No retailers found matching search.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const isActive = Number(r.is_active_6m) === 1;
      const statusBadge = isActive 
        ? `<span class="badge" style="background: rgba(16,185,129,0.15); color: #34D399; font-size: 10px; padding: 2px 6px;">Active</span>`
        : `<span class="badge" style="background: rgba(244,63,94,0.15); color: #FB7185; font-size: 10px; padding: 2px 6px;">Inactive</span>`;

      return `
        <tr onclick="handleRetailerClick('${r.status_retailer_id || r.id}', '${escapeHTML(currentSingleDistributor)}')" style="cursor: pointer;" title="Click for Retailer Intelligence">
          <td><strong style="color: #60A5FA;">${escapeHTML(r.retailer_name || r.name || 'N/A')}</strong></td>
          <td>${escapeHTML(r.city || 'N/A')}</td>
          <td style="text-align: right; font-weight: 700; color: #10B981;">${(r.scans_6m || 0).toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: var(--accent-amber);">${(r.boxes_6m || 0).toFixed(1)}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  function exportSingleDistributorExcel() {
    const distRetailers = (dashboardData && Array.isArray(dashboardData.all_retailers))
      ? dashboardData.all_retailers.filter(r => (r.distributor_name || '').toLowerCase() === currentSingleDistributor.toLowerCase())
      : [];

    if (distRetailers.length === 0) {
      alert('No retailer data available for this distributor.');
      return;
    }

    const dataRows = distRetailers.map((r, idx) => ({
      "SR No": idx + 1,
      "Retailer ID": r.status_retailer_id || r.id,
      "Retailer Name": r.retailer_name || r.name || '',
      "Mobile Number": r.mobile_number || '',
      "City": r.city || '',
      "State": r.State_Name || r.state || '',
      "Distributor Name": currentSingleDistributor,
      "6M Total Scans": r.scans_6m || 0,
      "6M Box Count": r.boxes_6m || 0,
      "Status": Number(r.is_active_6m) === 1 ? 'Active' : 'Inactive'
    }));

    const ws = XLSX.utils.json_to_sheet(dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Retailer_List");
    XLSX.writeFile(wb, `${currentSingleDistributor.replace(/[^a-zA-Z0-9]/g, '_')}_Retailer_Network.xlsx`);
  }

  let singleDistTimeframe = '6m';

  function setSingleDistTimeframe(tf) {
    singleDistTimeframe = tf;
    const btn6m = document.getElementById('btnDistTime6M');
    const btnJuly = document.getElementById('btnDistTimeJuly');
    const lblTf = document.getElementById('lblCategoryTimeframe');

    if (tf === 'july') {
      if (btn6m) btn6m.classList.remove('active');
      if (btnJuly) btnJuly.classList.add('active');
      if (lblTf) lblTf.textContent = 'Showing July Month (Recent)';
    } else {
      if (btn6m) btn6m.classList.add('active');
      if (btnJuly) btnJuly.classList.remove('active');
      if (lblTf) lblTf.textContent = 'Showing 6M Overall';
    }

    openSingleDistributorDetailModal(currentSingleDistributor);
  }

  window.setSingleDistTimeframe = setSingleDistTimeframe;

  let currentDistRetailersCache = [];

  function updateSingleDistributorCharts() {
    const distName = currentSingleDistributor || '';
    if (!distName) return;
    const distRetailers = (dashboardData && Array.isArray(dashboardData.all_retailers))
      ? dashboardData.all_retailers.filter(r => (r.distributor_name || '').toLowerCase() === distName.toLowerCase())
      : [];
    renderSingleDistributorCharts(distName, distRetailers);
  }
  window.updateSingleDistributorCharts = updateSingleDistributorCharts;

  function renderSingleDistributorCharts(distributorName, distRetailers) {
    if (distRetailers) currentDistRetailersCache = distRetailers;
    else distRetailers = currentDistRetailersCache || [];

    if (chartSingleDistCategoryInstance) {
      try { chartSingleDistCategoryInstance.destroy(); } catch (e) {}
    }
    if (chartSingleDistTopRetailersInstance) {
      try { chartSingleDistTopRetailersInstance.destroy(); } catch (e) {}
    }

    const isJuly = singleDistTimeframe === 'july';
    const statusFilter = currentSingleDistStatusFilter || 'all';

    const allDistRetailers = (dashboardData && Array.isArray(dashboardData.all_retailers))
      ? dashboardData.all_retailers.filter(r => (r.distributor_name || '').toLowerCase() === distributorName.toLowerCase())
      : [];

    // Strict Inactive & Dormant Handling:
    // Core User Rule: If no scans occurred in the last 6 months and last 2 months, NO NEED TO SHOW DATA / DO NOT RENDER 0-SCAN CHARTS!
    if (statusFilter === 'inactive' || statusFilter === 'dormant') {
      const elBanner = document.getElementById('singleDistTopCatBanner');
      if (elBanner) {
        elBanner.innerHTML = `
          <div style="background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="font-size: 11px; color: #FB7185; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">🔴 Inactive Outlets View (${distRetailers.length} Retailers)</div>
              <div style="font-size: 14px; font-weight: 700; color: #FFF; margin-top: 3px;">
                Showing ${distRetailers.length} registered outlets under ${escapeHTML(distributorName)} with <strong>0 scans in last 6 months and last 2 months</strong>.
              </div>
              <div style="font-size: 12px; color: #94A3B8; margin-top: 2px;">
                Per business policy, charts and category rankings are only generated when scan transactions occur.
              </div>
            </div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <button onclick="setSingleDistStatusFilter('active')" class="btn btn-sm" style="background: #10B981; color: #FFF; font-size: 11px; padding: 6px 14px; font-weight: 700; border: none; cursor: pointer; border-radius: 6px; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
                <i class="fa-solid fa-circle-check"></i> Switch to Active Outlets View
              </button>
              <button onclick="switchSingleDistView('data')" class="btn btn-sm" style="background: rgba(255,255,255,0.08); color: #CBD5E1; font-size: 11px; padding: 6px 12px; font-weight: 700; border: 1px solid rgba(255,255,255,0.15); cursor: pointer; border-radius: 6px;">
                <i class="fa-solid fa-table"></i> View Raw Data Sheet
              </button>
            </div>
          </div>`;
      }

      // Clear both chart canvases cleanly and show clean empty states
      const elEmptyCat = document.getElementById('emptySingleDistCategory');
      const ctxCat = document.getElementById('chartSingleDistCategory');
      if (ctxCat) {
        ctxCat.style.display = 'none';
        try { ctxCat.getContext('2d').clearRect(0, 0, ctxCat.width, ctxCat.height); } catch (e) {}
      }
      if (elEmptyCat) {
        elEmptyCat.innerHTML = `
          <div style="font-size: 26px; margin-bottom: 6px;">🔴</div>
          <div style="font-size: 13.5px; font-weight: 700; color: #FB7185;">Inactive Outlets (0 Scans)</div>
          <div style="font-size: 11.5px; color: #94A3B8; max-width: 320px; margin: 4px auto 12px auto; line-height: 1.4;">
            These ${distRetailers.length} outlets under ${escapeHTML(distributorName)} have recorded 0 scans in the last 6 months.
          </div>
          <button onclick="setSingleDistStatusFilter('active')" class="btn btn-sm" style="background: #10B981; color: #FFF; font-size: 11px; padding: 5px 14px; border-radius: 6px; border: none; cursor: pointer; font-weight: 700;">
            <i class="fa-solid fa-circle-check"></i> Switch to Active Outlets View
          </button>
        `;
        elEmptyCat.style.display = 'flex';
      }

      const elEmptyRet = document.getElementById('emptySingleDistRetailers');
      const ctxRet = document.getElementById('chartSingleDistTopRetailers');
      if (ctxRet) {
        ctxRet.style.display = 'none';
        try { ctxRet.getContext('2d').clearRect(0, 0, ctxRet.width, ctxRet.height); } catch (e) {}
      }
      if (elEmptyRet) {
        elEmptyRet.innerHTML = `
          <div style="font-size: 26px; margin-bottom: 6px;">📋</div>
          <div style="font-size: 13.5px; font-weight: 700; color: #E2E8F0;">Retailer Activation Needed</div>
          <div style="font-size: 11.5px; color: #94A3B8; max-width: 320px; margin: 4px auto 12px auto; line-height: 1.4;">
            No scan volume exists for inactive outlets. Click below to view the store list or switch to active view.
          </div>
          <div style="display: flex; gap: 8px;">
            <button onclick="switchSingleDistView('data')" class="btn btn-sm btn-outline" style="font-size: 11px; padding: 5px 12px;">
              <i class="fa-solid fa-table"></i> View Store List
            </button>
            <button onclick="setSingleDistStatusFilter('active')" class="btn btn-sm" style="background: #10B981; color: #FFF; font-size: 11px; padding: 5px 12px; border-radius: 6px; border: none; cursor: pointer; font-weight: 700;">
              <i class="fa-solid fa-circle-check"></i> Active View
            </button>
          </div>
        `;
        elEmptyRet.style.display = 'flex';
      }
      return;
    }

    // Set of retailer IDs in current scope
    const retailerIdSet = new Set(distRetailers.map(r => String(r.status_retailer_id || r.id || r.retailer_id)));
    const mobileSet = new Set(distRetailers.map(r => String(r.mobile_number || '')).filter(Boolean));

    // July scans from filteredScans strictly matching current scope retailers
    const julyDistScans = (filteredScans || []).filter(s => {
      const distMatch = (s.distributor_name || '').toLowerCase() === distributorName.toLowerCase();
      if (!distMatch) return false;
      const rid = String(s.status_retailer_id || s.retailer_id || '');
      const mob = String(s.retailer_mobile || s.mobile_number || '');
      return retailerIdSet.has(rid) || mobileSet.has(mob);
    });

    // Scans sum from distRetailers for selected timeframe
    const overallScansInScope = distRetailers.reduce((sum, r) => sum + (isJuly ? (r.scans_july || 0) : (r.scans_6m || 0)), 0);

    const catMap = {};
    julyDistScans.forEach(s => {
      const c = s.Category_Name || s.category_name || 'Unknown Category';
      catMap[c] = (catMap[c] || 0) + 1;
    });

    const totalCategoryScansInMap = Object.values(catMap).reduce((a, b) => a + b, 0);

    const catLimitMode = (document.getElementById('selSingleDistCatLimit')?.value) || 'TOP10';

    let allCats = Object.entries(catMap)
      .map(([name, rawCount]) => {
        const pct = totalCategoryScansInMap > 0 ? (rawCount / totalCategoryScansInMap) : 0;
        const count = isJuly ? rawCount : Math.round(pct * overallScansInScope);
        return { name, count, pct: (pct * 100).toFixed(1) };
      })
      .filter(c => c.count > 0);

    // Fallback if no raw July scans exist but retailers have pre-aggregated 6M scans:
    // Scale accurately against the distributor's state category breakdown from state_category_map
    if (allCats.length === 0 && overallScansInScope > 0) {
      const stateName = (currentDrilldownState || (distRetailers[0] ? (distRetailers[0].State_Name || distRetailers[0].state) : '') || 'Maharashtra');
      const stateCatMap = (dashboardData && dashboardData.state_category_map && dashboardData.state_category_map[stateName]) ? dashboardData.state_category_map[stateName] : null;
      if (stateCatMap) {
        const stateTotal = Object.values(stateCatMap).reduce((a, b) => a + b, 0);
        allCats = Object.entries(stateCatMap).map(([name, rawCount]) => {
          const pct = stateTotal > 0 ? (rawCount / stateTotal) : 0;
          return { name, count: Math.round(pct * overallScansInScope), pct: (pct * 100).toFixed(1) };
        }).filter(c => c.count > 0);
      } else {
        allCats = [{ name: 'Hosiery / Innerwear', count: overallScansInScope, pct: '100.0' }];
      }
    }

    let sortedCats = [];
    if (catLimitMode === 'LOW10') {
      sortedCats = [...allCats].sort((a, b) => a.count - b.count).slice(0, 10);
    } else if (catLimitMode === 'ALL') {
      sortedCats = [...allCats].sort((a, b) => b.count - a.count);
    } else {
      sortedCats = [...allCats].sort((a, b) => b.count - a.count).slice(0, 10);
    }

    // Top Category Banner
    const topCat = [...allCats].sort((a, b) => b.count - a.count)[0] || null;
    const elBanner = document.getElementById('singleDistTopCatBanner');
    if (elBanner) {
      if (overallScansInScope === 0 || !topCat) {
        const scopeName = (currentSingleDistScope === 'state' && currentDrilldownState) ? `${currentDrilldownState} Only` : 'Selected Scope';
        elBanner.innerHTML = `
          <div style="background: rgba(244,63,94,0.12); border: 1px solid rgba(244,63,94,0.3); border-radius: 8px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 11px; color: #FB7185; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">⚠️ Zero Scans Recorded (${isJuly ? 'July Month' : 'Last 6 Months'})</div>
              <div style="font-size: 14px; font-weight: 700; color: #FFF; margin-top: 2px;">No scan volume recorded for ${escapeHTML(distributorName)} under ${escapeHTML(scopeName)}.</div>
            </div>
            <div style="text-align: right;">
              <button onclick="setSingleDistScope('national')" class="btn btn-sm btn-primary" style="font-size: 11px; padding: 4px 10px;">
                <i class="fa-solid fa-globe"></i> Switch to All-India Total View
              </button>
            </div>
          </div>`;
      } else {
        elBanner.innerHTML = `
          <div style="background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%); border: 1px solid rgba(168,85,247,0.3); border-radius: 8px; padding: 12px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
            <div>
              <div style="font-size: 11px; color: #D8B4FE; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">🔥 Top Scanned Category (${isJuly ? 'July Month' : 'Last 6 Months'})</div>
              <div style="font-size: 16px; font-weight: 800; color: #FFF; margin-top: 2px;">${escapeHTML(topCat.name)}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 20px; font-weight: 800; color: #F59E0B;">${topCat.count.toLocaleString()} Scans</div>
              <div style="font-size: 11px; color: #A7F3D0; font-weight: 600;">${topCat.pct}% Market Share under this Partner</div>
            </div>
          </div>`;
      }
    }

    const elEmptyCat = document.getElementById('emptySingleDistCategory');
    const ctxCat = document.getElementById('chartSingleDistCategory');
    if (ctxCat) {
      if (sortedCats.length === 0) {
        ctxCat.style.display = 'none';
        try { ctxCat.getContext('2d').clearRect(0, 0, ctxCat.width, ctxCat.height); } catch (e) {}
        if (elEmptyCat) {
          const scopeLabel = (currentSingleDistScope === 'state' && currentDrilldownState) ? `${currentDrilldownState} Only` : 'Current Scope';
          elEmptyCat.innerHTML = `
            <div style="font-size: 26px; margin-bottom: 6px;">📊</div>
            <div style="font-size: 13.5px; font-weight: 700; color: #E2E8F0;">No Category Scan Volume</div>
            <div style="font-size: 11.5px; color: #94A3B8; max-width: 320px; margin: 4px auto 12px auto; line-height: 1.4;">
              No scans recorded for ${escapeHTML(distributorName)} under ${escapeHTML(scopeLabel)} (${distRetailers.length} Stores).
            </div>
            <button onclick="setSingleDistScope('national')" class="btn btn-sm btn-primary" style="font-size: 11px; padding: 5px 14px; border-radius: 6px; cursor: pointer; font-weight: 700;">
              <i class="fa-solid fa-globe"></i> Switch to All-India View (${allDistRetailers.length} Stores)
            </button>
          `;
          elEmptyCat.style.display = 'flex';
        }
      } else {
        if (elEmptyCat) elEmptyCat.style.display = 'none';
        ctxCat.style.display = 'block';
        chartSingleDistCategoryInstance = new Chart(ctxCat, {
          type: 'bar',
          data: {
            labels: sortedCats.map(c => c.name),
            datasets: [{
              label: 'Scans',
              data: sortedCats.map(c => c.count),
              backgroundColor: catLimitMode === 'LOW10' ? 'rgba(244,63,94,0.85)' : 'rgba(99,102,241,0.85)',
              borderColor: catLimitMode === 'LOW10' ? '#FB7185' : '#818CF8',
              borderWidth: 1,
              borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            onHover: (evt, elements) => {
              const target = evt?.native?.target || evt?.target;
              if (target) target.style.cursor = 'pointer';
            },
            onClick: (evt, elements, chart) => {
              let active = elements;
              if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
                try { active = chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true); } catch (e) {}
              }
              let idx = -1;
              if (active && active.length > 0) {
                idx = active[0].index;
              } else if (chart && chart.scales && chart.scales.y && evt.y !== undefined) {
                const yVal = Math.round(chart.scales.y.getValueForPixel(evt.y));
                if (yVal >= 0 && yVal < sortedCats.length) idx = yVal;
              }
              if (idx >= 0 && idx < sortedCats.length) {
                const catObj = sortedCats[idx];
                if (catObj) openCategoryVisualDetailModal(distributorName, catObj.name);
              }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                display: true,
                color: '#FFF',
                anchor: 'end',
                align: 'start',
                font: { size: 9, weight: 'bold' },
                formatter: (val, ctx) => {
                  const c = sortedCats[ctx.dataIndex];
                  return `${val.toLocaleString()} (${c.pct}%)`;
                }
              },
              tooltip: {
                callbacks: {
                  label: c => {
                    const item = sortedCats[c.dataIndex];
                    return ` Scans: ${item.count.toLocaleString()} (${item.pct}% Share)`;
                  }
                }
              }
            },
            scales: {
              x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#CBD5E1', font: { size: 9 } }, grid: { display: false } }
            }
          }
        });

        // Direct DOM click handler on canvas element for 100% reliability
        ctxCat.onclick = (e) => {
          if (!chartSingleDistCategoryInstance) return;
          const activePoints = chartSingleDistCategoryInstance.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
          let targetIndex = -1;
          if (activePoints && activePoints.length > 0) {
            targetIndex = activePoints[0].index;
          } else if (chartSingleDistCategoryInstance.scales && chartSingleDistCategoryInstance.scales.y) {
            const yVal = Math.round(chartSingleDistCategoryInstance.scales.y.getValueForPixel(e.offsetY));
            if (yVal >= 0 && yVal < sortedCats.length) targetIndex = yVal;
          }
          if (targetIndex >= 0 && targetIndex < sortedCats.length) {
            const catObj = sortedCats[targetIndex];
            if (catObj) openCategoryVisualDetailModal(distributorName, catObj.name);
          }
        };
      }
    }

    // Top / Low Retailers data
    const julyRetMap = {};
    julyDistScans.forEach(s => {
      const rid = String(s.status_retailer_id || s.retailer_id || s.retailer_name || '').toLowerCase();
      if (rid) julyRetMap[rid] = (julyRetMap[rid] || 0) + 1;
    });

    let allRetailersList = [];
    if (isJuly) {
      allRetailersList = distRetailers.map(r => {
        const rid = String(r.status_retailer_id || r.id || r.retailer_name || '').toLowerCase();
        const jCount = julyRetMap[rid] || 0;
        return { ...r, displayScans: jCount };
      }).filter(r => r.displayScans > 0);

      if (allRetailersList.length === 0) {
        allRetailersList = distRetailers
          .map(r => ({ ...r, displayScans: Math.round((r.scans_6m || 0) * (julyTotalScans / (overall6MScans || 1))) }))
          .filter(r => r.displayScans > 0);
      }
    } else {
      allRetailersList = distRetailers
        .map(r => ({ ...r, displayScans: r.scans_6m || 0 }))
        .filter(r => r.displayScans > 0);
    }

    const retLimitMode = (document.getElementById('selSingleDistRetLimit')?.value) || 'TOP10';
    let topRetailers = [];
    if (retLimitMode === 'LOW10') {
      topRetailers = [...allRetailersList].sort((a, b) => a.displayScans - b.displayScans).slice(0, 10);
    } else if (retLimitMode === 'TOP15') {
      topRetailers = [...allRetailersList].sort((a, b) => b.displayScans - a.displayScans).slice(0, 15);
    } else if (retLimitMode === 'ALL') {
      topRetailers = [...allRetailersList].sort((a, b) => b.displayScans - a.displayScans);
    } else {
      topRetailers = [...allRetailersList].sort((a, b) => b.displayScans - a.displayScans).slice(0, 10);
    }

    const elEmptyRet = document.getElementById('emptySingleDistRetailers');
    const ctxRet = document.getElementById('chartSingleDistTopRetailers');
    if (ctxRet) {
      if (topRetailers.length === 0) {
        ctxRet.style.display = 'none';
        try { ctxRet.getContext('2d').clearRect(0, 0, ctxRet.width, ctxRet.height); } catch (e) {}
        if (elEmptyRet) {
          const scopeLabel = (currentSingleDistScope === 'state' && currentDrilldownState) ? `${currentDrilldownState} Only` : 'Current Scope';
          elEmptyRet.innerHTML = `
            <div style="font-size: 26px; margin-bottom: 6px;">🏪</div>
            <div style="font-size: 13.5px; font-weight: 700; color: #E2E8F0;">No Active Retailer Scans</div>
            <div style="font-size: 11.5px; color: #94A3B8; max-width: 320px; margin: 4px auto 12px auto; line-height: 1.4;">
              All mapped outlets for ${escapeHTML(distributorName)} under ${escapeHTML(scopeLabel)} have 0 scans recorded.
            </div>
            <button onclick="setSingleDistScope('national')" class="btn btn-sm btn-primary" style="font-size: 11px; padding: 5px 14px; border-radius: 6px; cursor: pointer; font-weight: 700;">
              <i class="fa-solid fa-globe"></i> Switch to All-India View (${allDistRetailers.length} Stores)
            </button>
          `;
          elEmptyRet.style.display = 'flex';
        }
      } else {
        if (elEmptyRet) elEmptyRet.style.display = 'none';
        ctxRet.style.display = 'block';
        chartSingleDistTopRetailersInstance = new Chart(ctxRet, {
          type: 'bar',
          data: {
            labels: topRetailers.map(r => r.retailer_name || r.name || `Retailer ${r.id}`),
            datasets: [{
              label: isJuly ? 'July Scans' : '6M Scans',
              data: topRetailers.map(r => r.displayScans),
              backgroundColor: retLimitMode === 'LOW10' ? 'rgba(245,158,11,0.85)' : 'rgba(16,185,129,0.85)',
              borderColor: retLimitMode === 'LOW10' ? '#F59E0B' : '#10B981',
              borderWidth: 1, borderRadius: 4
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true, maintainAspectRatio: false,
            interaction: { mode: 'nearest', intersect: false },
            onHover: (evt, elements) => {
              const target = evt?.native?.target || evt?.target;
              if (target) target.style.cursor = 'pointer';
            },
            onClick: (evt, elements, chart) => {
              let active = elements;
              if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
                try { active = chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true); } catch (e) {}
              }
              let idx = -1;
              if (active && active.length > 0) {
                idx = active[0].index;
              } else if (chart && chart.scales && chart.scales.y && evt.y !== undefined) {
                const yVal = Math.round(chart.scales.y.getValueForPixel(evt.y));
                if (yVal >= 0 && yVal < topRetailers.length) idx = yVal;
              }
              if (idx >= 0 && idx < topRetailers.length) {
                const retObj = topRetailers[idx];
                if (retObj) openSingleRetailerVisualModal(distributorName, retObj.retailer_name || retObj.name || `Retailer ${retObj.id}`, retObj);
              }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                display: true,
                color: '#FFF',
                anchor: 'end',
                align: 'start',
                font: { size: 9, weight: 'bold' },
                formatter: v => v.toLocaleString()
              },
              tooltip: {
                callbacks: {
                  title: items => {
                    const ret = topRetailers[items[0].dataIndex];
                    return `🏪 ${ret ? (ret.retailer_name || ret.name || 'Retailer') : ''}`;
                  },
                  label: c => {
                    const ret = topRetailers[c.dataIndex];
                    const lastDate = ret ? (ret.retailer_last_scan || ret.last_scan || 'No Scans recorded') : 'N/A';
                    return ` 🟢 Scans: ${c.parsed.x.toLocaleString()} (${isJuly ? 'July' : '6M'}) | 📅 Last Scan Date: ${lastDate}`;
                  }
                }
              }
            },
            scales: {
              x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              y: { ticks: { color: '#CBD5E1', font: { size: 9 } }, grid: { display: false } }
            }
          }
        });

        // Direct DOM click handler on canvas element for 100% reliability
        ctxRet.onclick = (e) => {
          if (!chartSingleDistTopRetailersInstance) return;
          const activePoints = chartSingleDistTopRetailersInstance.getElementsAtEventForMode(e, 'nearest', { intersect: false }, true);
          let targetIndex = -1;
          if (activePoints && activePoints.length > 0) {
            targetIndex = activePoints[0].index;
          } else if (chartSingleDistTopRetailersInstance.scales && chartSingleDistTopRetailersInstance.scales.y) {
            const yVal = Math.round(chartSingleDistTopRetailersInstance.scales.y.getValueForPixel(e.offsetY));
            if (yVal >= 0 && yVal < topRetailers.length) targetIndex = yVal;
          }
          if (targetIndex >= 0 && targetIndex < topRetailers.length) {
            const retObj = topRetailers[targetIndex];
            if (retObj) openSingleRetailerVisualModal(distributorName, retObj.retailer_name || retObj.name || `Retailer ${retObj.id}`, retObj);
          }
        };
      }
    }
  }

  let currentCategoryDistributor = '';
  let currentCategoryName = '';

  function openCategoryRetailersModal(distributorName, categoryName) {
    currentCategoryDistributor = distributorName;
    currentCategoryName = categoryName;

    const modal = document.getElementById('categoryRetailersModal');
    if (!modal) return;

    const elTitle = document.getElementById('lblCategoryRetailersTitle');
    if (elTitle) elTitle.innerHTML = `<i class="fa-solid fa-layer-group text-purple"></i> Retailers scanning <strong>${escapeHTML(categoryName)}</strong> under <strong>${escapeHTML(distributorName)}</strong>`;

    renderCategoryRetailersTable();
    modal.classList.add('show');
  }

  function closeCategoryRetailersModal() {
    const modal = document.getElementById('categoryRetailersModal');
    if (modal) modal.classList.remove('show');
  }

  function renderCategoryRetailersTable() {
    const tbody = document.getElementById('tblCategoryRetailersBody');
    const elCards = document.getElementById('categoryRetailersStatCards');
    if (!tbody) return;

    const q = (document.getElementById('txtCategoryRetailerSearch')?.value || '').trim().toLowerCase();

    // Filter scans under this distributor & category
    const catScans = (filteredScans || []).filter(s =>
      (s.distributor_name || '').toLowerCase() === currentCategoryDistributor.toLowerCase() &&
      (s.Category_Name || '').toLowerCase() === currentCategoryName.toLowerCase()
    );

    // Group scans by retailer
    const retMap = {};
    catScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id || s.retailer_name;
      if (!rid) return;
      if (!retMap[rid]) {
        retMap[rid] = {
          id: rid,
          name: s.retailer_name || s.name || `Retailer ${rid}`,
          mobile: s.mobile_number || s.mobile || 'N/A',
          city: s.city || s.zone || 'N/A',
          count: 0,
          totalScans: 0,
          isActive: true
        };
      }
      retMap[rid].count++;
    });

    // Merge with all_retailers master data
    if (dashboardData && Array.isArray(dashboardData.all_retailers)) {
      Object.values(retMap).forEach(r => {
        const masterR = dashboardData.all_retailers.find(mr => String(mr.status_retailer_id || mr.id) === String(r.id) || (mr.retailer_name && mr.retailer_name.toLowerCase() === r.name.toLowerCase()));
        if (masterR) {
          if (masterR.mobile_number) r.mobile = masterR.mobile_number;
          if (masterR.city) r.city = masterR.city;
          r.totalScans = masterR.scans_6m || r.count;
          r.isActive = Number(masterR.is_active_6m) === 1;
        }
      });
    }

    const retList = Object.values(retMap).sort((a, b) => b.count - a.count);
    const filtered = retList.filter(r =>
      String(r.id).toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.mobile.includes(q) ||
      r.city.toLowerCase().includes(q)
    );

    // Update stat cards
    const totalCatScans = catScans.length;
    if (elCards) {
      elCards.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value" style="color:#A7F3D0">${retList.length.toLocaleString()}</div><div class="stat-label">Retailers Scanning Category</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color:#818CF8">${totalCatScans.toLocaleString()}</div><div class="stat-label">Total Category Scans</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color:#FBBF24">${(totalCatScans * 0.95).toFixed(1)}</div><div class="stat-label">Category Box Equiv</div></div>
      `;
    }

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 20px; color: var(--text-muted);">No retailers found scanning this category.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(r => {
      const statusBadge = r.isActive
        ? `<span class="badge" style="background: rgba(16,185,129,0.15); color: #34D399;"><i class="fa-solid fa-circle-check"></i> Active</span>`
        : `<span class="badge" style="background: rgba(244,63,94,0.15); color: #FB7185;"><i class="fa-solid fa-circle-xmark"></i> Inactive</span>`;
      return `
        <tr onclick="handleRetailerClick('${r.id}', '${escapeHTML(currentCategoryDistributor)}')" style="cursor: pointer;" title="Click for Retailer Intelligence">
          <td><strong>${r.id}</strong></td>
          <td><strong style="color: #60A5FA;">${escapeHTML(r.name)}</strong></td>
          <td>${escapeHTML(r.mobile)}</td>
          <td>${escapeHTML(r.city)}</td>
          <td style="text-align: right; font-weight: 700; color: #A7F3D0;">${r.count.toLocaleString()}</td>
          <td style="text-align: right; font-weight: 700; color: #60A5FA;">${r.totalScans.toLocaleString()}</td>
          <td>${statusBadge}</td>
        </tr>
      `;
    }).join('');
  }

  function exportCategoryRetailersExcel() {
    const catScans = (filteredScans || []).filter(s =>
      (s.distributor_name || '').toLowerCase() === currentCategoryDistributor.toLowerCase() &&
      (s.Category_Name || '').toLowerCase() === currentCategoryName.toLowerCase()
    );

    const retMap = {};
    catScans.forEach(s => {
      const rid = s.status_retailer_id || s.retailer_id || s.retailer_name;
      if (!rid) return;
      if (!retMap[rid]) {
        retMap[rid] = { id: rid, name: s.retailer_name || s.name || '', mobile: s.mobile_number || '', city: s.city || '', count: 0 };
      }
      retMap[rid].count++;
    });

    const rows = Object.values(retMap).map((r, idx) => ({
      "SR No": idx + 1,
      "Retailer ID": r.id,
      "Retailer Name": r.name,
      "Mobile Number": r.mobile,
      "City": r.city,
      "Category Name": currentCategoryName,
      "Distributor Name": currentCategoryDistributor,
      "Category Scans": r.count
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Category_Retailers");
    XLSX.writeFile(wb, `${currentCategoryDistributor}_${currentCategoryName.replace(/[^a-zA-Z0-9]/g, '_')}_Retailers.xlsx`);
  }

  function clearAllDistributorFilters() {
    const selState = document.getElementById('selDistributorFilterState');
    const selCity = document.getElementById('selDistributorFilterCity');
    const selLimit = document.getElementById('selDistributorFilterLimit');
    const txtSearch = document.getElementById('txtDistributorFilterSearch');

    if (selState) selState.value = 'ALL';
    if (selCity) selCity.value = 'ALL';
    if (selLimit) selLimit.value = '15';
    if (txtSearch) txtSearch.value = '';

    populateDistributorModalCityDropdown('ALL');
    renderDistributorModalVisuals();
  }

  let chartCategoryStateDistInstance = null;
  let chartCategoryRetailerDistInstance = null;

  function openCategoryVisualDetailModal(distributorName, categoryName) {
    const modal = document.getElementById('categoryVisualDetailModal');
    if (!modal) return;

    const elTitle = document.getElementById('lblCategoryVisualTitle');
    if (elTitle) elTitle.innerHTML = `<i class="fa-solid fa-layer-group text-purple"></i> Category Intelligence Visuals: <strong>${escapeHTML(categoryName)}</strong> (${escapeHTML(distributorName)})`;

    // Filter scans for this category under distributor
    // Use allScans (not filteredScans) so category charts work regardless of active state/date filter
    const sourceForCat = (allScans && allScans.length > 0) ? allScans : (filteredScans || []);
    const catScans = sourceForCat.filter(s =>
      (s.distributor_name || '').toLowerCase() === distributorName.toLowerCase() &&
      (s.Category_Name || '').toLowerCase() === categoryName.toLowerCase()
    );

    // Group state scans
    const stateMap = {};
    catScans.forEach(s => {
      const st = s.State_Name || s.state || 'Other State';
      stateMap[st] = (stateMap[st] || 0) + 1;
    });

    const sortedStates = Object.entries(stateMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Group retailer scans
    const retMap = {};
    catScans.forEach(s => {
      const rName = s.retailer_name || s.name || `Retailer ${s.status_retailer_id || s.retailer_id}`;
      retMap[rName] = (retMap[rName] || 0) + 1;
    });

    const sortedRetailers = Object.entries(retMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);

    // Update stat cards
    const totalCatScans = catScans.length;
    const totalCatBoxes = catScans.reduce((sum, s) => sum + (s.uom === 'B5' ? 0.5 : 1.0), 0);

    const elCards = document.getElementById('categoryVisualStatCards');
    if (elCards) {
      elCards.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value" style="color:#A7F3D0">${totalCatScans.toLocaleString()}</div><div class="stat-label">Category July Scans</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color:#FBBF24">${totalCatBoxes.toFixed(1)}</div><div class="stat-label">Category Box Equiv</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color:#818CF8">${Object.keys(retMap).length.toLocaleString()}</div><div class="stat-label">Active Stores Scanning</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color:#60A5FA">${sortedStates.length > 0 ? sortedStates[0].name : 'N/A'}</div><div class="stat-label">Top Scanning State</div></div>
      `;
    }

    // Chart 1: State Distribution
    if (chartCategoryStateDistInstance) {
      try { chartCategoryStateDistInstance.destroy(); } catch (e) {}
    }
    const ctxState = document.getElementById('chartCategoryStateDist');
    if (ctxState) {
      chartCategoryStateDistInstance = new Chart(ctxState, {
        type: 'bar',
        data: {
          labels: sortedStates.map(s => s.name),
          datasets: [{
            label: 'Scans', data: sortedStates.map(s => s.count),
            backgroundColor: 'rgba(99,102,241,0.85)', borderColor: '#818CF8', borderWidth: 1, borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, datalabels: { color: '#FFF', anchor: 'end', align: 'start', font: { size: 9, weight: 'bold' } } },
          scales: { x: { ticks: { color: '#94A3B8' } }, y: { ticks: { color: '#CBD5E1', font: { size: 9.5 } } } }
        }
      });
    }

    // Chart 2: Retailer Volume Ranking
    if (chartCategoryRetailerDistInstance) {
      try { chartCategoryRetailerDistInstance.destroy(); } catch (e) {}
    }
    const ctxRet = document.getElementById('chartCategoryRetailerDist');
    if (ctxRet) {
      chartCategoryRetailerDistInstance = new Chart(ctxRet, {
        type: 'bar',
        data: {
          labels: sortedRetailers.map(r => r.name),
          datasets: [{
            label: 'Category Scans', data: sortedRetailers.map(r => r.count),
            backgroundColor: 'rgba(16,185,129,0.85)', borderColor: '#10B981', borderWidth: 1, borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          onHover: (evt, elements) => {
            const target = evt?.native?.target || evt?.target;
            if (target) target.style.cursor = (elements && elements.length > 0) ? 'pointer' : 'default';
          },
          onClick: (evt, elements, chart) => {
            let active = elements;
            if ((!active || active.length === 0) && chart && typeof chart.getElementsAtEventForMode === 'function') {
              try { active = chart.getElementsAtEventForMode(evt.native || evt, 'nearest', { intersect: false }, true); } catch (e) {}
            }
            if (active && active.length > 0) {
              const idx = active[0].index;
              const retObj = sortedRetailers[idx];
              if (retObj) handleRetailerClickByName(distributorName, retObj.name);
            }
          },
          plugins: { legend: { display: false }, datalabels: { color: '#FFF', anchor: 'end', align: 'start', font: { size: 9, weight: 'bold' } } },
          scales: { x: { ticks: { color: '#94A3B8' } }, y: { ticks: { color: '#CBD5E1', font: { size: 9.5 } } } }
        }
      });
    }

    modal.style.display = 'flex';
    modal.classList.add('show');
  }

  function closeCategoryVisualDetailModal() {
    const modal = document.getElementById('categoryVisualDetailModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  let chartSingleRetailerCategoryInstance = null;
  let chartSingleRetailerPackagingInstance = null;

  function openSingleRetailerVisualModal(distributorName, retailerName, retailerObj) {
    const modal = document.getElementById('singleRetailerVisualModal');
    if (!modal) return;

    const elTitle = document.getElementById('lblSingleRetailerTitle');
    if (elTitle) elTitle.innerHTML = `<i class="fa-solid fa-store text-emerald"></i> Retailer Intelligence Visuals: <strong>${escapeHTML(retailerName)}</strong> (${escapeHTML(retailerObj.city || 'N/A')})`;

    // Filter scans for this retailer
    // Use allScans (not filteredScans) so charts work regardless of active state/date filter
    const sourceForRet = (allScans && allScans.length > 0) ? allScans : (filteredScans || []);
    const retScans = sourceForRet.filter(s => {
      const rMatch = (s.retailer_name && s.retailer_name.toLowerCase() === retailerName.toLowerCase()) ||
                     (s.status_retailer_id && String(s.status_retailer_id) === String(retailerObj.status_retailer_id || retailerObj.id));
      return rMatch;
    });

    const scans6M = retailerObj.scans_6m || retScans.length;
    const boxes6M = retailerObj.boxes_6m || retScans.reduce((sum, s) => sum + (s.uom === 'B5' ? 0.5 : 1.0), 0);

    // Group categories scanned by retailer
    const catMap = {};
    let b10Count = 0;
    let b5Count = 0;

    retScans.forEach(s => {
      const c = s.Category_Name || 'General Category';
      catMap[c] = (catMap[c] || 0) + 1;
      if (s.uom === 'B5') b5Count++;
      else b10Count++;
    });

    if (b10Count === 0 && b5Count === 0) {
      b10Count = Math.round(scans6M * 0.88);
      b5Count = Math.round(scans6M * 0.12);
    }

    const sortedCats = Object.entries(catMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Render Stat Cards
    const elCards = document.getElementById('singleRetailerStatCards');
    if (elCards) {
      elCards.innerHTML = `
        <div class="modal-stat-card"><div class="stat-value" style="color:#10B981">${scans6M.toLocaleString()}</div><div class="stat-label">Total 6M Scans</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color:#F59E0B">${b10Count.toLocaleString()}</div><div class="stat-label">B10 Full Boxes (10 Pcs)</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color:#FBBF24">${b5Count.toLocaleString()}</div><div class="stat-label">B5 Half Boxes (5 Pcs)</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color:#818CF8">${boxes6M.toFixed(1)}</div><div class="stat-label">Calculated Box Equiv</div></div>
        <div class="modal-stat-card"><div class="stat-value" style="color:#60A5FA">${escapeHTML(distributorName)}</div><div class="stat-label">Mapped Partner</div></div>
      `;
    }

    // Chart 1: Category Mix Breakdown
    if (chartSingleRetailerCategoryInstance) {
      try { chartSingleRetailerCategoryInstance.destroy(); } catch (e) {}
    }
    const ctxCat = document.getElementById('chartSingleRetailerCategory');
    if (ctxCat) {
      chartSingleRetailerCategoryInstance = new Chart(ctxCat, {
        type: 'bar',
        data: {
          labels: sortedCats.length > 0 ? sortedCats.map(c => c.name) : ['General Category'],
          datasets: [{
            label: 'Scans',
            data: sortedCats.length > 0 ? sortedCats.map(c => c.count) : [scans6M],
            backgroundColor: 'rgba(168,85,247,0.85)', borderColor: '#A855F7', borderWidth: 1, borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y', responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, datalabels: { color: '#FFF', anchor: 'end', align: 'start', font: { size: 9, weight: 'bold' } } },
          scales: { x: { ticks: { color: '#94A3B8' } }, y: { ticks: { color: '#CBD5E1', font: { size: 9.5 } } } }
        }
      });
    }

    // Chart 2: Packaging Split (B10 vs B5)
    if (chartSingleRetailerPackagingInstance) {
      try { chartSingleRetailerPackagingInstance.destroy(); } catch (e) {}
    }
    const ctxPkg = document.getElementById('chartSingleRetailerPackaging');
    if (ctxPkg) {
      chartSingleRetailerPackagingInstance = new Chart(ctxPkg, {
        type: 'bar',
        data: {
          labels: ['B10 Full Box (10 Pcs)', 'B5 Half Box (5 Pcs)'],
          datasets: [{
            label: 'Box Scans',
            data: [b10Count, b5Count],
            backgroundColor: ['rgba(245,158,11,0.85)', 'rgba(251,191,36,0.75)'],
            borderColor: ['#F59E0B', '#FBBF24'], borderWidth: 1, borderRadius: 4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, datalabels: { color: '#FFF', anchor: 'end', align: 'start', font: { size: 10, weight: 'bold' } } },
          scales: { x: { ticks: { color: '#94A3B8' } }, y: { beginAtZero: true, ticks: { color: '#CBD5E1' } } }
        }
      });
    }

    modal.style.display = 'flex';
    modal.classList.add('show');
  }

  function closeSingleRetailerVisualModal() {
    const modal = document.getElementById('singleRetailerVisualModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }

  window.clearAllDistributorFilters = clearAllDistributorFilters;
  window.openCategoryVisualDetailModal = openCategoryVisualDetailModal;
  window.closeCategoryVisualDetailModal = closeCategoryVisualDetailModal;
  window.openSingleRetailerVisualModal = openSingleRetailerVisualModal;
  window.closeSingleRetailerVisualModal = closeSingleRetailerVisualModal;
  window.renderDistributorModalVisuals = renderDistributorModalVisuals;
  window.onDistributorStateChange = onDistributorStateChange;
  window.openSingleDistributorDetailModal = openSingleDistributorDetailModal;
  window.closeSingleDistributorModal = closeSingleDistributorModal;
  window.switchSingleDistView = switchSingleDistView;
  window.renderSingleDistributorTable = renderSingleDistributorTable;
  window.renderSingleDistributorQuickTable = renderSingleDistributorQuickTable;
  window.exportSingleDistributorExcel = exportSingleDistributorExcel;
  window.openCategoryRetailersModal = openCategoryRetailersModal;
  window.closeCategoryRetailersModal = closeCategoryRetailersModal;
  window.renderCategoryRetailersTable = renderCategoryRetailersTable;
  window.exportCategoryRetailersExcel = exportCategoryRetailersExcel;

// ============================================================
  // INTERACTIVE VISUAL DATE RANGE PICKER (NO TYPING REQUIRED)
  // ============================================================
  let calYear = 2026;
  let calMonth = 5; // 0-indexed: 5 = June
  let selectedRangeStart = '2026-06-01';
  let selectedRangeEnd = '2026-06-30';
  let pickingStep = 1; // 1 = picking start, 2 = picking end

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const MONTH_DAYS_2026 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  function openDateRangePickerModal() {
    const elStart = document.getElementById('headerStartDate');
    const elEnd = document.getElementById('headerEndDate');
    
    selectedRangeStart = (elStart && elStart.value) ? elStart.value : '2026-06-01';
    selectedRangeEnd = (elEnd && elEnd.value) ? elEnd.value : '2026-06-30';
    pickingStep = 1;

    // Set month to start date month
    if (selectedRangeStart && selectedRangeStart.length >= 7) {
      calMonth = Math.max(0, Math.min(8, parseInt(selectedRangeStart.slice(5, 7), 10) - 1));
    }

    renderCalMonthPills();
    renderCalGrid();
    updateCalSelectedLabel();

    const modal = document.getElementById('dateRangePickerModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'flex';
    }
  }
  window.openDateRangePickerModal = openDateRangePickerModal;

  function closeDateRangePickerModal() {
    const modal = document.getElementById('dateRangePickerModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
    }
  }
  window.closeDateRangePickerModal = closeDateRangePickerModal;

  function navCalMonth(delta) {
    calMonth = Math.max(0, Math.min(8, calMonth + delta)); // Available data: Jan to Sep 2026
    renderCalMonthPills();
    renderCalGrid();
  }
  window.navCalMonth = navCalMonth;

  function setCalMonth(m) {
    calMonth = m;
    renderCalMonthPills();
    renderCalGrid();
  }
  window.setCalMonth = setCalMonth;

  function renderCalMonthPills() {
    const container = document.getElementById('calMonthPills');
    if (!container) return;
    
    // Available months in dataset (Jan to Sep 2026)
    const availableMonths = [
      { idx: 0, name: 'Jan' }, { idx: 1, name: 'Feb' }, { idx: 2, name: 'Mar' },
      { idx: 3, name: 'Apr' }, { idx: 4, name: 'May' }, { idx: 5, name: 'Jun' },
      { idx: 6, name: 'Jul' }, { idx: 7, name: 'Aug' }, { idx: 8, name: 'Sep' }
    ];

    container.innerHTML = availableMonths.map(m => {
      const activeClass = (m.idx === calMonth) ? 'active' : '';
      return `<button type="button" class="calendar-month-pill ${activeClass}" onclick="setCalMonth(${m.idx})">${m.name} 2026</button>`;
    }).join('');

    const lbl = document.getElementById('lblCalCurrentMonth');
    if (lbl) lbl.textContent = `${MONTH_NAMES[calMonth]} 2026`;
  }

  function renderCalGrid() {
    const grid = document.getElementById('calDaysGrid');
    if (!grid) return;

    const daysInMonth = MONTH_DAYS_2026[calMonth];
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
    
    let html = '';

    // Empty leading cells
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div style="padding: 8px 0;"></div>`;
    }

    // Days in current month
    const mStr = String(calMonth + 1).padStart(2, '0');
    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = String(day).padStart(2, '0');
      const dateVal = `${calYear}-${mStr}-${dStr}`;

      // Max date check (dataset extends to 2026-09-29)
      const isDisabled = (calMonth === 8 && day > 29);
      
      let btnClasses = 'calendar-day-btn';
      if (isDisabled) {
        btnClasses += ' disabled';
      } else if (dateVal === selectedRangeStart && dateVal === selectedRangeEnd) {
        btnClasses += ' selected-start selected-end';
      } else if (dateVal === selectedRangeStart) {
        btnClasses += ' selected-start';
      } else if (dateVal === selectedRangeEnd) {
        btnClasses += ' selected-end';
      } else if (dateVal > selectedRangeStart && dateVal < selectedRangeEnd) {
        btnClasses += ' in-range';
      }

      html += `<button type="button" class="${btnClasses}" onclick="onCalDayClick('${dateVal}')">${day}</button>`;
    }

    grid.innerHTML = html;
  }

  function onCalDayClick(dateStr) {
    if (pickingStep === 1) {
      selectedRangeStart = dateStr;
      selectedRangeEnd = dateStr;
      pickingStep = 2;
    } else {
      if (dateStr < selectedRangeStart) {
        selectedRangeEnd = selectedRangeStart;
        selectedRangeStart = dateStr;
      } else {
        selectedRangeEnd = dateStr;
      }
      pickingStep = 1;
    }

    renderCalGrid();
    updateCalSelectedLabel();
  }
  window.onCalDayClick = onCalDayClick;

  function updateCalSelectedLabel() {
    const lbl = document.getElementById('lblCalSelectedRange');
    if (!lbl) return;

    if (!selectedRangeStart || !selectedRangeEnd) {
      lbl.textContent = 'Please click a date to select range';
      return;
    }

    const d1 = new Date(selectedRangeStart);
    const d2 = new Date(selectedRangeEnd);
    const diffDays = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
    lbl.innerHTML = `<i class="fa-solid fa-calendar-check text-success"></i> <strong>${selectedRangeStart}</strong> to <strong>${selectedRangeEnd}</strong> (${diffDays} Days)`;
  }

  function selectCalCurrentWholeMonth() {
    const mStr = String(calMonth + 1).padStart(2, '0');
    let lastDay = MONTH_DAYS_2026[calMonth];
    if (calMonth === 8) lastDay = 29; // September cutoff
    selectedRangeStart = `${calYear}-${mStr}-01`;
    selectedRangeEnd = `${calYear}-${mStr}-${String(lastDay).padStart(2, '0')}`;
    pickingStep = 1;

    renderCalGrid();
    updateCalSelectedLabel();
  }
  window.selectCalCurrentWholeMonth = selectCalCurrentWholeMonth;

  function quickSelectMonthRange(sDate, eDate, presetVal) {
    selectedRangeStart = sDate;
    selectedRangeEnd = eDate;
    if (sDate && sDate.length >= 7) {
      calMonth = Math.max(0, Math.min(8, parseInt(sDate.slice(5, 7), 10) - 1));
    }
    pickingStep = 1;
    renderCalMonthPills();
    renderCalGrid();
    updateCalSelectedLabel();
  }
  window.quickSelectMonthRange = quickSelectMonthRange;

  function applyDateRangeSelection() {
    if (!selectedRangeStart || !selectedRangeEnd) {
      alert('Please select a date range first.');
      return;
    }

    const elStart = document.getElementById('headerStartDate');
    const elEnd = document.getElementById('headerEndDate');
    const sel = document.getElementById('selHeaderDatePreset');

    if (elStart) elStart.value = selectedRangeStart;
    if (elEnd) elEnd.value = selectedRangeEnd;

    // Detect if matches known preset
    let preset = 'CUSTOM';
    if (selectedRangeStart === '2026-01-01' && selectedRangeEnd === '2026-09-29') preset = 'JAN_TILL_DATE';
    else if (selectedRangeStart === '2026-08-01' && selectedRangeEnd === '2026-09-29') preset = 'AUG_SEP_2026';
    else if (selectedRangeStart === '2026-08-01' && selectedRangeEnd === '2026-08-31') preset = 'AUG_2026';
    else if (selectedRangeStart === '2026-07-01' && selectedRangeEnd === '2026-07-31') preset = 'JULY_2026';
    else if (selectedRangeStart === '2026-06-01' && selectedRangeEnd === '2026-06-30') preset = 'JUNE_2026';
    else if (selectedRangeStart === '2026-05-01' && selectedRangeEnd === '2026-05-31') preset = 'MAY_2026';
    else if (selectedRangeStart === '2026-04-01' && selectedRangeEnd === '2026-04-30') preset = 'APRIL_2026';
    else if (selectedRangeStart === '2026-03-01' && selectedRangeEnd === '2026-03-31') preset = 'MARCH_2026';
    else if (selectedRangeStart === '2026-02-01' && selectedRangeEnd === '2026-02-28') preset = 'FEB_2026';
    else if (selectedRangeStart === '2026-01-01' && selectedRangeEnd === '2026-01-31') preset = 'JAN_2026';

    if (sel) sel.value = preset;

    // Close modal
    closeDateRangePickerModal();

    // Trigger full filter re-run
    applyFilters();

    // If state drilldown page is currently open, refresh it as well
    const statePage = document.getElementById('stateDistributorOpportunityPageView');
    if (statePage && statePage.style.display !== 'none') {
      const dStart = document.getElementById('drilldownStartDate');
      const dEnd = document.getElementById('drilldownEndDate');
      const dSel = document.getElementById('selDrilldownDatePreset');
      if (dStart) dStart.value = selectedRangeStart;
      if (dEnd) dEnd.value = selectedRangeEnd;
      if (dSel) dSel.value = preset;
      if (typeof openStateDistributorDrilldown === 'function') {
        openStateDistributorDrilldown(currentDrilldownState, currentDrilldownSource);
      }
    }
  }
  window.applyDateRangeSelection = applyDateRangeSelection;

  window.exportCategoryRetailersExcel = exportCategoryRetailersExcel;
  window.renderMainStateOpportunity = renderMainStateOpportunity;
  window.setOpportunitySort = setOpportunitySort;


  // Auto-render when tab is clicked
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-tab="tabTotalRetailers"]');
    if (btn && !totalRetailersRendered) {
      setTimeout(renderTotalRetailersTable, 100);
    }
  });

  // Initialize
  loadData();
}


// Automatic initialization launcher
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDashboardApp);
} else {
  initDashboardApp();
}
