import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from 'xlsx';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  FiAlertCircle, FiDownload, FiSearch,
  FiFileText, FiLayers, FiShoppingBag, FiPrinter, FiUsers
} from 'react-icons/fi';
import SalesTable from './components/SalesTable';
import FabricTable from './components/FabricTable';
import DevelopmentsTable from './components/DevelopmentsTable';
import DocketSheet from './components/DocketSheet';
import CuttingSheet from './components/CuttingSheet';
import StatsPanel from './components/StatsPanel';
import CustomerPage from './components/CustomerPage';
import { formatDate, getDateValue, formatCurrency, compactSizes, getGoogleDriveThumbnail, getGoogleDriveDownloadLink } from './utils/index';
import { useData } from './useData';
import './styles.css';

function App() {
  // For development/testing - set to false when Google Script is working
  const USE_MOCK_DATA = process.env.NODE_ENV === 'development';
  
  const { data: realData, loading, error } = useData();
  const data = USE_MOCK_DATA ? { sales_po: [], fabric: [], insert_pattern: [] } : realData;
  
  console.log("Full Data Object:", data);
  console.log("Fabric Data:", data?.fabric);

  useEffect(() => {
    if (data && !data.fabric) {
      console.error("Fabric data is undefined or not loaded:", data);
    }
  }, [data]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    TYPE: "",
    "LIVE STATUS": "",
    "FIT STATUS": "",
    "CUSTOMER NAME": ""
  });
  const [fabricFilters, setFabricFilters] = useState({
    TYPE: "",
    "CUSTOMER NAME": "",
    SUPPLIER: ""
  });
  const [activeTab, setActiveTab] = useState("sales");
  const [previewImage, setPreviewImage] = useState({
    url: null,
    visible: false,
    position: { x: 0, y: 0 },
    direction: 'below'
  });
  const [poInput, setPoInput] = useState("");
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showStats, setShowStats] = useState(false); // Default to false to hide stats initially
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

<<<<<<< HEAD
  const [salesSort, setSalesSort] = useState({ column: null, direction: 'asc' });
  const [fabricSort, setFabricSort] = useState({ column: null, direction: 'asc' });
  const [developmentsSort, setDevelopmentsSort] = useState({ column: null, direction: 'asc' });

=======
  // PURE BLACK TEXT COLORS
>>>>>>> 7320c5fb90426341fcc7c87942543f8b88645f75
  const colors = darkMode ? {
    primary: "#6366F1",
    primaryLight: "#818CF8",
    primaryDark: "#4F46E5",
    secondary: "#EC4899",
    secondaryLight: "#F472B6",
    secondaryDark: "#DB2777",
    accent: "#F59E0B",
    accentLight: "#FBBF24",
    accentDark: "#D97706",
    danger: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
    textDark: "#000000",
    textMedium: "#000000",
    textLight: "#FFFFFF",
    background: "#111827",
    cardBg: "#1F2937",
    border: "#374151",
    rowEven: "#1F2937",
    rowOdd: "#111827",
    headerBg: "#374151",
    headerText: "#000000",
    activeTab: "#CD5E77",
    inactiveTab: "#6B7280",
    actionButton: "#1B4D3E",
    statCardBg: "#1F2937",
    statCardBorder: "#374151",
    accentRgb: "245, 158, 11",
    successRgb: "16, 185, 129",
    warningRgb: "245, 158, 11",
    infoRgb: "59, 130, 246",
    activeTabRgb: "205, 94, 119"
  } : {
    primary: "#6366F1",
    primaryLight: "#818CF8",
    primaryDark: "#4F46E5",
    secondary: "#EC4899",
    secondaryLight: "#F472B6",
    secondaryDark: "#DB2777",
    accent: "#F59E0B",
    accentLight: "#FBBF24",
    accentDark: "#D97706",
    danger: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
    textDark: "#000000",
    textMedium: "#000000",
    textLight: "#FFFFFF",
    background: "#F9FAFB",
    cardBg: "#FFFFFF",
    border: "#E5E7EB",
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "#F3F4F6",
    headerText: "#000000",
    activeTab: "#CD5E77",
    inactiveTab: "#9CA3AF",
    actionButton: "#1B4D3E",
    statCardBg: "#FFFFFF",
    statCardBorder: "#E5E7EB",
    accentRgb: "245, 158, 11",
    successRgb: "16, 185, 129",
    warningRgb: "245, 158, 11",
    infoRgb: "59, 130, 246",
    activeTabRgb: "205, 94, 119"
  };

  const formLinks = [
    {
      label: "Development Form",
      url: "https://forms.gle/hq1pgP4rz1BSjiCc6",
      icon: <FiFileText size={16} />,
      color: colors.primary,
      external: true
    },
    {
      label: "Insert Pattern Form",
      url: "https://forms.gle/LBQwrpMjJuFzLTsC8",
      icon: <FiLayers size={16} />,
      color: colors.secondary,
      external: true
    },
    {
      label: "PD & KAIIA Dashboard",
      url: "/pd-kaiia",
      icon: <FiUsers size={16} />,
      color: colors.accent,
      external: false
    }
  ];

  const productionStats = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastQuarterStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const lastQuarterEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const currentFiscalYear = now.getFullYear() - (now.getMonth() < 6 ? 1 : 0);
    const currentYearStart = new Date(currentFiscalYear, 6, 1);
    const currentYearEnd = new Date(currentFiscalYear + 1, 5, 30);
    const lastYearStart = new Date(currentFiscalYear - 1, 6, 1);
    const lastYearEnd = new Date(currentFiscalYear, 5, 30);

    let stats = {
      totalOrders: 0,
      totalUnits: 0,
      deliveredLast30Days: 0,
      deliveredUnitsLast30Days: 0,
      unitsDeliveredLastQuarter: 0,
      lastQuarterLabel: "",
      inProduction: 0,
      fabricOrdered: 0,
      pendingUnits: 0,
      goldSealSent: 0,
      lastDeliveryDateFormatted: "N/A",
      ordersLastYear: 0,
      unitsDeliveredLastYear: 0,
      lastYearLabel: "",
      unitsDeliveredCurrentYear: 0,
      currentYearLabel: "",
      lastYearOrdersLabel: ""
    };

    if (data && data.sales_po) {
      const getFiscalYearLabel = (year) => `FY ${year.toString().slice(-2)}-${(year + 1).toString().slice(-2)}`;

      stats.lastQuarterLabel = `${lastQuarterStart.toLocaleString('default', { month: 'short' })} - ${lastQuarterEnd.toLocaleString('default', { month: 'short' })}`;
      stats.lastYearLabel = getFiscalYearLabel(currentFiscalYear - 1);
      stats.currentYearLabel = getFiscalYearLabel(currentFiscalYear);
      stats.lastYearOrdersLabel = `${stats.lastYearLabel} Orders`;

      let lastDeliveryDate = null;

      stats.totalOrders = data.sales_po.length;
      stats.totalUnits = data.sales_po.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);

      data.sales_po.forEach(row => {
        const deliveryDate = getDateValue(row["REAL DD"]);
        const units = parseInt(row["TOTAL UNITS"] || 0);

        if (deliveryDate >= oneMonthAgo) {
          stats.deliveredLast30Days++;
          stats.deliveredUnitsLast30Days += units;
        }

        if (deliveryDate >= lastQuarterStart && deliveryDate <= lastQuarterEnd) {
          stats.unitsDeliveredLastQuarter += units;
        }

        if (deliveryDate >= currentYearStart && deliveryDate <= currentYearEnd) {
          stats.unitsDeliveredCurrentYear += units;
        }

        if (deliveryDate >= lastYearStart && deliveryDate <= lastYearEnd) {
          stats.unitsDeliveredLastYear += units;
          stats.ordersLastYear++;
        }

        if (row["LIVE STATUS"] === "In Production") stats.inProduction += units;
        if (row["LIVE STATUS"] === "Pending") stats.pendingUnits += units;
        if (row["FIT STATUS"] === "Gold Seal") stats.goldSealSent++;

        if (row["REAL DD"] && (!lastDeliveryDate || deliveryDate > lastDeliveryDate)) {
          lastDeliveryDate = deliveryDate;
        }
      });

      if (lastDeliveryDate) {
        stats.lastDeliveryDateFormatted = formatDate(lastDeliveryDate);
      }
    }

    if (data && data.fabric) {
      stats.fabricOrdered = data.fabric.reduce((sum, row) => sum + parseInt(row["ORDER UNITS FABRIC/TRIM COST"] || 0), 0);
    }

    return stats;
  }, [data]);

  const getValueForSort = (column, value) => {
    if (['XFACT DD', 'REAL DD', 'DATE', 'Timestamp'].includes(column)) {
      return getDateValue(value);
    }
    if (['TOTAL UNITS', 'PRICE', 'CMT PRICE', 'ACTUAL CMT', 'TOTAL', 'ORDER UNITS FABRIC/TRIM COST', 'FABRIC/TRIM PRICE', 'TOTAL ARRIVED', 'TOTAL GARMENT PRICE', 'CMT PRICE'].includes(column) || column.match(/^\d+$/)) {
      return parseFloat(value) || 0;
    }
    return value?.toString().toLowerCase() ?? '';
  };

  const filteredSales = useMemo(() => {
    if (!data || !data.sales_po) return [];
    let filtered = data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters.TYPE || (row["TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["LIVE STATUS"] || (row["LIVE STATUS"] || "").toLowerCase() === filters["LIVE STATUS"].toLowerCase())
      .filter(row => !filters["FIT STATUS"] || (row["FIT STATUS"] || "").toLowerCase() === filters["FIT STATUS"].toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));

    if (salesSort.column) {
      filtered.sort((a, b) => {
        const va = getValueForSort(salesSort.column, a[salesSort.column]);
        const vb = getValueForSort(salesSort.column, b[salesSort.column]);
        if (va < vb) return salesSort.direction === 'asc' ? -1 : 1;
        if (va > vb) return salesSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, search, filters, salesSort]);

  const filteredFabric = useMemo(() => {
<<<<<<< HEAD
    if (!data || !data.fabric) return [];
    let filtered = data.fabric
      .filter(row => row["NO."] && row["H-NUMBER"] && row["ORDER REF"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !fabricFilters.TYPE || (row["TYPE"] || "").toLowerCase() === fabricFilters.TYPE.toLowerCase())
      .filter(row => !fabricFilters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === fabricFilters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !fabricFilters.SUPPLIER || (row["SUPPLIER"] || "").toLowerCase() === fabricFilters.SUPPLIER.toLowerCase())
      .sort((a, b) => getDateValue(b["DATE"]) - getDateValue(a["DATE"]));

    if (fabricSort.column) {
      filtered.sort((a, b) => {
        const va = getValueForSort(fabricSort.column, a[fabricSort.column]);
        const vb = getValueForSort(fabricSort.column, b[fabricSort.column]);
        if (va < vb) return fabricSort.direction === 'asc' ? -1 : 1;
        if (va > vb) return fabricSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, search, fabricFilters, fabricSort]);
=======
    console.log("Raw Fabric Data:", data.fabric);
    if (!data.fabric) {
      console.error("Fabric data is undefined or empty");
      return [];
    }
    return data.fabric
      .filter(row => true)
      .sort((a, b) => (b["NO."] || "").localeCompare(a["NO."] || ""));
  }, [data.fabric]);
>>>>>>> 7320c5fb90426341fcc7c87942543f8b88645f75

  const filteredDevelopments = useMemo(() => {
    if (!data || !data.insert_pattern) return [];
    let filtered = data.insert_pattern
      .filter(row => row["H-NUMBER"] && row["STYLE TYPE"] && row["CUSTOMER CODE"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters.TYPE || (row["STYLE TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));

    if (developmentsSort.column) {
      filtered.sort((a, b) => {
        const va = getValueForSort(developmentsSort.column, a[developmentsSort.column]);
        const vb = getValueForSort(developmentsSort.column, b[developmentsSort.column]);
        if (va < vb) return developmentsSort.direction === 'asc' ? -1 : 1;
        if (va > vb) return developmentsSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, search, filters, developmentsSort]);

  const getMatchingSalesImage = (hNumber) => {
    if (!data || !data.sales_po) return null;
    const matchingSale = data.sales_po.find(sale => sale["H-NUMBER"] === hNumber);
    return matchingSale ? matchingSale.IMAGE : null;
  };

  const handleMouseEnter = (url, e) => {
    if (!url) return;
    
    // Preload image for faster display
    const img = new Image();
    img.src = getGoogleDriveThumbnail(url);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const isNearBottom = window.innerHeight - rect.bottom < 250;
    setPreviewImage({
      url: getGoogleDriveThumbnail(url),
      visible: true,
      position: { x: rect.left + rect.width / 2, y: rect.top + window.scrollY },
      direction: isNearBottom ? 'above' : 'below'
    });
  };

  const handleMouseLeave = () => {
    setPreviewImage(prev => ({ ...prev, visible: false }));
  };

  const handleSalesSort = (column) => {
    setSalesSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleFabricSort = (column) => {
    setFabricSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleDevelopmentsSort = (column) => {
    setDevelopmentsSort(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSales = filteredSales.slice(indexOfFirstItem, indexOfLastItem);
  const currentFabric = filteredFabric.slice(indexOfFirstItem, indexOfLastItem);
  const currentDevelopments = filteredDevelopments.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <FiShoppingBag size={32} className="spin" />
        </div>
        <h2>Loading Dashboard</h2>
        <p>Fetching the latest data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="error-screen">
      <div className="error-content">
        <div className="error-icon">
          <FiAlertCircle size={48} />
        </div>
        <h2>Error Loading Data</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="retry-button"
        >
          <FiShoppingBag size={16} /> Try Again
        </button>
      </div>
    </div>
  );

  return (
<<<<<<< HEAD
    <Routes>
      <Route path="/" element={
        <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
          <header className="app-header no-print">
            <div className="header-content">
              <div className="header-left">
                <h1 className="header-title">
                  <FiShoppingBag size={20} />
                  High5 Production Dashboard
                </h1>
                <button 
                  onClick={() => setDarkMode(!darkMode)} 
                  className="theme-toggle"
                  aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
              </div>
              <div className="search-bar">
                <FiSearch className="search-icon" size={16} />
                <input
                  type="text"
                  placeholder="Search by PO, Style, Customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search"
                />
              </div>
              <div className="header-right">
                <div className="form-links">
                  {formLinks.map((link, i) => (
                    <Link
                      key={i}
                      to={link.url}
                      className={`form-link ${link.external ? 'external' : ''}`}
                      style={{ borderColor: link.color, color: link.color }}
                      target={link.external ? "_blank" : "_self"}
                      rel={link.external ? "noopener noreferrer" : undefined}
                    >
                      {link.icon}
                      {link.label}
                      {link.external && <FiExternalLink size={12} />}
                    </Link>
                  ))}
                </div>
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="action-button"
                  aria-label={showStats ? "Hide Stats" : "Show Stats"}
                >
                  {showStats ? 'Hide Stats' : 'Show Stats'}
                </button>
              </div>
            </div>
          </header>

          <div className="tabs-container no-print">
            {[
              { id: "sales", label: "Sales Orders", icon: <FiShoppingBag size={16} /> },
              { id: "fabric", label: "Fabric Orders", icon: <FiDatabase size={16} /> },
              { id: "developments", label: "Developments", icon: <FiBarChart2 size={16} /> },
              { id: "production", label: "Production Sheets", icon: <FiPrinter size={16} /> }
            ].map(tab => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {showStats && <StatsPanel productionStats={productionStats} colors={colors} />}

            {activeTab !== "production" && (
              <div className="filters-container no-print">
                <div className="filter-item">
                  <label className="filter-label">Type</label>
                  <select
                    value={activeTab === "fabric" ? fabricFilters.TYPE : filters.TYPE}
                    onChange={(e) => activeTab === "fabric" 
                      ? setFabricFilters({ ...fabricFilters, TYPE: e.target.value })
                      : setFilters({ ...filters, TYPE: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">All Types</option>
                    {activeTab === "fabric" && data && data.fabric
                      ? [...new Set(data.fabric.map(row => row.TYPE).filter(Boolean))].map(type => <option key={type} value={type}>{type}</option>)
                      : data && data.sales_po
                        ? [...new Set(data.sales_po.map(row => row.TYPE).filter(Boolean))].map(type => <option key={type} value={type}>{type}</option>)
                        : null}
                  </select>
                </div>
                {activeTab !== "fabric" && (
                  <>
                    <div className="filter-item">
                      <label className="filter-label">Live Status</label>
                      <select
                        value={filters["LIVE STATUS"]}
                        onChange={(e) => setFilters({ ...filters, "LIVE STATUS": e.target.value })}
                        className="filter-select"
                      >
                        <option value="">All Status</option>
                        {data && data.sales_po
                          ? [...new Set(data.sales_po.map(row => row["LIVE STATUS"]).filter(Boolean))].map(status => <option key={status} value={status}>{status}</option>)
                          : null}
                      </select>
                    </div>
                    <div className="filter-item">
                      <label className="filter-label">Fit Status</label>
                      <select
                        value={filters["FIT STATUS"]}
                        onChange={(e) => setFilters({ ...filters, "FIT STATUS": e.target.value })}
                        className="filter-select"
                      >
                        <option value="">All Status</option>
                        {data && data.sales_po
                          ? [...new Set(data.sales_po.map(row => row["FIT STATUS"]).filter(Boolean))].map(status => <option key={status} value={status}>{status}</option>)
                          : null}
                      </select>
                    </div>
                  </>
                )}
                <div className="filter-item">
                  <label className="filter-label">Customer</label>
                  <select
                    value={activeTab === "fabric" ? fabricFilters["CUSTOMER NAME"] : filters["CUSTOMER NAME"]}
                    onChange={(e) => activeTab === "fabric" 
                      ? setFabricFilters({ ...fabricFilters, "CUSTOMER NAME": e.target.value })
                      : setFilters({ ...filters, "CUSTOMER NAME": e.target.value })}
                    className="filter-select"
                  >
                    <option value="">All Customers</option>
                    {activeTab === "fabric" && data && data.fabric
                      ? [...new Set(data.fabric.map(row => row["CUSTOMER NAME"]).filter(Boolean))].map(customer => <option key={customer} value={customer}>{customer}</option>)
                      : data && data.sales_po
                        ? [...new Set(data.sales_po.map(row => row["CUSTOMER NAME"]).filter(Boolean))].map(customer => <option key={customer} value={customer}>{customer}</option>)
                        : null}
                  </select>
                </div>
                {activeTab === "fabric" && (
                  <div className="filter-item">
                    <label className="filter-label">Supplier</label>
                    <select
                      value={fabricFilters.SUPPLIER}
                      onChange={(e) => setFabricFilters({ ...fabricFilters, SUPPLIER: e.target.value })}
                      className="filter-select"
                    >
                      <option value="">All Suppliers</option>
                      {data && data.fabric
                        ? [...new Set(data.fabric.map(row => row.SUPPLIER).filter(Boolean))].map(supplier => <option key={supplier} value={supplier}>{supplier}</option>)
                        : null}
                    </select>
                  </div>
                )}
              </div>
            )}

            {activeTab === "sales" && (
              <div className="table-container">
                <SalesTable
                  data={currentSales}
                  filters={filters}
                  setFilters={setFilters}
                  colors={colors}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseLeave={handleMouseLeave}
                  getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                  getGoogleDriveDownloadLink={getGoogleDriveDownloadLink}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  compactSizes={compactSizes}
                  onSort={handleSalesSort}
                  sort={salesSort}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalItems={filteredSales.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}

            {activeTab === "fabric" && (
              <div className="table-container">
                <FabricTable
                  data={currentFabric}
                  fabricFilters={fabricFilters}
                  setFabricFilters={setFabricFilters}
                  colors={colors}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseLeave={handleMouseLeave}
                  getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                  getMatchingSalesImage={getMatchingSalesImage}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  onSort={handleFabricSort}
                  sort={fabricSort}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalItems={filteredFabric.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}

            {activeTab === "developments" && (
              <div className="table-container">
                <DevelopmentsTable
                  data={currentDevelopments}
                  filters={filters}
                  setFilters={setFilters}
                  colors={colors}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseLeave={handleMouseLeave}
                  getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  onSort={handleDevelopmentsSort}
                  sort={developmentsSort}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalItems={filteredDevelopments.length}
                  itemsPerPage={itemsPerPage}
                />
              </div>
            )}

            {activeTab === "production" && (
              <div className="no-print">
                <div className="po-input-container">
                  <div className="filter-item" style={{ flex: 1 }}>
                    <textarea
                      value={poInput}
                      onChange={(e) => setPoInput(e.target.value)}
                      placeholder="Enter PO Numbers e.g., PO0004 PO0001,PO0002"
                      rows={1}
                      className="filter-select"
                      style={{ width: '100%', height: '40px', overflow: 'hidden' }}
                    />
                  </div>
                  <div className="po-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={() => {
                        const pos = poInput.split(/[\n, ]+/).map(p => p.trim()).filter(Boolean);
                        setSelectedPOs(pos);
                      }}
                      className="action-button generate-button"
                    >
                      Generate Sheets
                    </button>
                    <button onClick={() => window.print()} className="action-button print-button">
                      <FiPrinter size={14} /> Print Sheets
                    </button>
                  </div>
                </div>

                {selectedPOs.length > 0 && (
                  <div className="sheets-container" style={{ marginTop: '20px' }}>
                    <DocketSheet selectedData={data && data.sales_po ? data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"])) : []} />
                    <CuttingSheet selectedData={data && data.sales_po ? data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"])) : []} />
                  </div>
                )}
              </div>
            )}
          </div>

          {previewImage.visible && (
            <div 
              className={`image-preview ${previewImage.direction} no-print`}
              style={{
                left: `${previewImage.position.x}px`,
                [previewImage.direction === 'below' ? 'top' : 'bottom']: 
                  `${previewImage.direction === 'below' ? previewImage.position.y + 20 : window.innerHeight - previewImage.position.y + 20}px`
              }}
            >
              <img 
                src={previewImage.url} 
                alt="Preview"
                className="preview-image"
              />
              <div className="preview-arrow"></div>
            </div>
          )}

          <footer className="app-footer no-print">
            <div className="footer-content">
              <div>High5 Production Dashboard © {new Date().getFullYear()}</div>
              <div>
                Last Updated: {new Date().toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </footer>
        </div>
      } />
      <Route path="/pd-kaiia" element={<CustomerPage />} />
    </Routes>
=======
    <Router>
      <Routes>
        <Route path="/" element={
          <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
            <div className="app-content">
              <header className="app-header no-print">
                <div className="header-left">
                  <h1 className="app-title">High5 Production Dashboard</h1>
                  <div className="form-links">
                    {formLinks.map((link, index) => (
                      link.external ? (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="form-link"
                          style={{ color: link.color }}
                          aria-label={link.label}
                        >
                          {link.icon}
                          <span>{link.label}</span>
                        </a>
                      ) : (
                        <Link
                          key={index}
                          to={link.url}
                          className="form-link"
                          style={{ color: link.color }}
                          aria-label={link.label}
                        >
                          {link.icon}
                          <span>{link.label}</span>
                        </Link>
                      )
                    ))}
                  </div>
                </div>
                <div className="header-center">
                  <div className="tab-container">
                    <div className="tabs">
                      {["sales", "fabric", "developments", "production"].map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                        >
                          {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="header-right">
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="action-button show-stats-button"
                  >
                    {showStats ? 'Hide Stats' : 'Show Stats'}
                  </button>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="action-button dark-mode-toggle"
                  >
                    {darkMode ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="action-button export-button"
                  >
                    <FiDownload size={14} /> Export
                  </button>
                </div>
              </header>

              {showStats && (
                <StatsPanel productionStats={productionStats} colors={colors} />
              )}

              <div className="main-content">
                <div className="search-box-container">
                  <div className="search-box">
                    <FiSearch size={16} />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      aria-label="Search sales, fabric, or developments"
                    />
                  </div>
                </div>

                {activeTab !== "production" && (
                  <div className="filter-container no-print">
                    {activeTab === "sales" && (
                      <div className="filter-row">
                        {[
                          { key: "TYPE", label: "Type", options: [...new Set(data.sales_po?.map(row => row["TYPE"]).filter(Boolean))] },
                          { key: "CUSTOMER NAME", label: "Customer Name", options: [...new Set(data.sales_po?.map(row => row["CUSTOMER NAME"]).filter(Boolean))] },
                          { key: "LIVE STATUS", label: "Live Status", options: [...new Set(data.sales_po?.map(row => row["LIVE STATUS"]).filter(Boolean))] },
                          { key: "FIT STATUS", label: "Fit Status", options: [...new Set(data.sales_po?.map(row => row["FIT STATUS"]).filter(Boolean))] }
                        ].map(filter => (
                          <div key={filter.key} className="filter-item">
                            <label>{filter.label}</label>
                            <select
                              value={filters[filter.key]}
                              onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
                              className="filter-select"
                            >
                              <option value="">All</option>
                              {filter.options.map((option, i) => (
                                <option key={i} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "fabric" && (
                      <div className="filter-row">
                        {[
                          { key: "TYPE", label: "Type", options: [...new Set(data.fabric?.map(row => row["TYPE"]).filter(Boolean))] },
                          { key: "CUSTOMER NAME", label: "Customer Name", options: [...new Set(data.fabric?.map(row => row["CUSTOMER NAME"]).filter(Boolean))] },
                          { key: "SUPPLIER", label: "Supplier", options: [...new Set(data.fabric?.map(row => row["SUPPLIER"]).filter(Boolean))] }
                        ].map(filter => (
                          <div key={filter.key} className="filter-item">
                            <label>{filter.label}</label>
                            <select
                              value={fabricFilters[filter.key]}
                              onChange={(e) => setFabricFilters({ ...fabricFilters, [filter.key]: e.target.value })}
                              className="filter-select"
                            >
                              <option value="">All</option>
                              {filter.options.map((option, i) => (
                                <option key={i} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                    {activeTab === "developments" && (
                      <div className="filter-row">
                        {[
                          { key: "STYLE TYPE", label: "Style Type", options: [...new Set(data.insert_pattern?.map(row => row["STYLE TYPE"]).filter(Boolean))] },
                          { key: "CUSTOMER NAME", label: "Customer Name", options: [...new Set(data.insert_pattern?.map(row => row["CUSTOMER NAME"]).filter(Boolean))] },
                          { key: "FIT SAMPLE", label: "Fit Sample", options: [...new Set(data.insert_pattern?.map(row => row["FIT SAMPLE"]).filter(Boolean))] }
                        ].map(filter => (
                          <div key={filter.key} className="filter-item">
                            <label>{filter.label}</label>
                            <select
                              value={filters[filter.key]}
                              onChange={(e) => setFilters({ ...filters, [filter.key]: e.target.value })}
                              className="filter-select"
                            >
                              <option value="">All</option>
                              {filter.options.map((option, i) => (
                                <option key={i} value={option}>{option}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "sales" && (
                  <div className="table-container">
                    <SalesTable
                      data={filteredSales}
                      filters={filters}
                      setFilters={setFilters}
                      colors={colors}
                      handleMouseEnter={handleMouseEnter}
                      handleMouseLeave={handleMouseLeave}
                      getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                      getGoogleDriveDownloadLink={getGoogleDriveDownloadLink}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      compactSizes={compactSizes}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      totalItems={filteredSales.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}

                {activeTab === "fabric" && (
                  <div className="table-container">
                    <FabricTable
                      data={filteredFabric}
                      fabricFilters={fabricFilters}
                      setFabricFilters={setFabricFilters}
                      colors={colors}
                      handleMouseEnter={handleMouseEnter}
                      handleMouseLeave={handleMouseLeave}
                      getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                      getMatchingSalesImage={getMatchingSalesImage}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      totalItems={filteredFabric.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}

                {activeTab === "developments" && (
                  <div className="table-container">
                    <DevelopmentsTable
                      data={filteredDevelopments}
                      filters={filters}
                      setFilters={setFilters}
                      colors={colors}
                      handleMouseEnter={handleMouseEnter}
                      handleMouseLeave={handleMouseLeave}
                      getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                      currentPage={currentPage}
                      setCurrentPage={setCurrentPage}
                      totalItems={filteredDevelopments.length}
                      itemsPerPage={itemsPerPage}
                    />
                  </div>
                )}

                {activeTab === "production" && (
                  <div className="no-print">
                    <div className="po-input-container">
                      <div className="filter-item" style={{ flex: 1 }}>
                        <textarea
                          value={poInput}
                          onChange={(e) => setPoInput(e.target.value)}
                          placeholder="Enter PO Numbers e.g., PO0004 PO0001,PO0002"
                          rows={1}
                          className="filter-select"
                          style={{ width: '100%', height: '40px', overflow: 'hidden' }}
                        />
                      </div>
                      <div className="po-buttons" style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                          onClick={() => {
                            const pos = poInput.split(/[\n, ]+/).map(p => p.trim()).filter(Boolean);
                            setSelectedPOs(pos);
                          }}
                          className="action-button generate-button"
                        >
                          Generate Sheets
                        </button>
                        <button onClick={() => window.print()} className="action-button print-button">
                          <FiPrinter size={14} /> Print Sheets
                        </button>
                      </div>
                    </div>

                    {selectedPOs.length > 0 && (
                      <div className="sheets-container" style={{ marginTop: '20px' }}>
                        <DocketSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
                        <CuttingSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {previewImage.visible && (
                <div 
                  className={`image-preview ${previewImage.direction} no-print`}
                  style={{
                    left: `${previewImage.position.x}px`,
                    top: previewImage.direction === 'below' ? 
                      `${previewImage.position.y + 20}px` : 
                      'auto',
                    bottom: previewImage.direction === 'above' ? 
                      `${window.innerHeight - previewImage.position.y + 20}px` : 
                      'auto'
                  }}
                >
                  <img 
                    src={previewImage.url} 
                    alt="Preview"
                    className="preview-image"
                  />
                  <div className="preview-arrow"></div>
                </div>
              )}

              <footer className="app-footer no-print">
                <div className="footer-content">
                  <div>High5 Production Dashboard © {new Date().getFullYear()}</div>
                  <div>
                    Last Updated: {new Date().toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </footer>
            </div>
          </div>
        } />
        <Route path="/pd-kaiia" element={<CustomerPage />} />
      </Routes>
    </Router>
>>>>>>> 7320c5fb90426341fcc7c87942543f8b88645f75
  );
}

export default App;