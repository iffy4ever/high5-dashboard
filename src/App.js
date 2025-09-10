// src/App.js
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

  // PURE BLACK TEXT COLORS
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
    textMedium: "#6B7280",
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

  const salesFilterOptions = useMemo(() => [
    {
      key: "TYPE",
      label: "Type",
      options: [...new Set((data.sales_po ?? []).map(row => row.TYPE).filter(Boolean))]
    },
    {
      key: "LIVE STATUS",
      label: "Live Status",
      options: [...new Set((data.sales_po ?? []).map(row => row["LIVE STATUS"]).filter(Boolean))]
    },
    {
      key: "FIT STATUS",
      label: "Fit Status",
      options: [...new Set((data.sales_po ?? []).map(row => row["FIT STATUS"]).filter(Boolean))]
    },
    {
      key: "CUSTOMER NAME",
      label: "Customer",
      options: [...new Set((data.sales_po ?? []).map(row => row["CUSTOMER NAME"]).filter(Boolean))]
    }
  ], [data.sales_po]);

  const fabricFilterOptions = useMemo(() => [
    {
      key: "TYPE",
      label: "Type",
      options: [...new Set((data.fabric ?? []).map(row => row.TYPE).filter(Boolean))]
    },
    {
      key: "CUSTOMER NAME",
      label: "Customer",
      options: [...new Set((data.fabric ?? []).map(row => row["CUSTOMER NAME"]).filter(Boolean))]
    },
    {
      key: "SUPPLIER",
      label: "Supplier",
      options: [...new Set((data.fabric ?? []).map(row => row.SUPPLIER).filter(Boolean))]
    }
  ], [data.fabric]);

  const filteredSales = useMemo(() => {
    if (!data.sales_po) return [];
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters.TYPE || (row.TYPE || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["LIVE STATUS"] || (row["LIVE STATUS"] || "").toLowerCase() === filters["LIVE STATUS"].toLowerCase())
      .filter(row => !filters["FIT STATUS"] || (row["FIT STATUS"] || "").toLowerCase() === filters["FIT STATUS"].toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));
  }, [data.sales_po, search, filters]);

  const filteredFabric = useMemo(() => {
    if (!data.fabric) return [];
    return data.fabric
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !fabricFilters.TYPE || (row.TYPE || "").toLowerCase() === fabricFilters.TYPE.toLowerCase())
      .filter(row => !fabricFilters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === fabricFilters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !fabricFilters.SUPPLIER || (row.SUPPLIER || "").toLowerCase() === fabricFilters.SUPPLIER.toLowerCase())
      .sort((a, b) => getDateValue(b["DATE"]) - getDateValue(a["DATE"]));
  }, [data.fabric, search, fabricFilters]);

  const filteredDevelopments = useMemo(() => {
    if (!data.insert_pattern) return [];
    return data.insert_pattern
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !filters.TYPE || (row["STYLE TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));
  }, [data.insert_pattern, search, filters]);

  const handleMouseEnter = (url, e) => {
    if (!url) return;
    
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

  const productionStats = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor((currentMonth + 3) / 3);
    let previousQuarter = currentQuarter - 1;
    let previousYear = currentYear;
    if (previousQuarter === 0) {
      previousQuarter = 4;
      previousYear -= 1;
    }
    const lastQuarterLabel = `Q${previousQuarter} ${previousYear}`;

    // Previous quarter start and end dates
    const quarterStartMonth = (previousQuarter - 1) * 3;
    const quarterStart = new Date(previousYear, quarterStartMonth, 1).getTime();
    const quarterEnd = new Date(previousYear, quarterStartMonth + 3, 0).getTime();

    // Last year start and end
    const lastYearStart = new Date(currentYear - 1, 0, 1).getTime();
    const lastYearEnd = new Date(currentYear - 1, 11, 31).getTime();

    // Current year start
    const currentYearStart = new Date(currentYear, 0, 1).getTime();

    const stats = {
      totalOrders: (data.sales_po ?? []).length,
      totalUnits: (data.sales_po ?? []).reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0),
      deliveredLast30Days: (data.sales_po ?? []).filter(row => {
        const date = getDateValue(row["REAL DD"]);
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return date >= thirtyDaysAgo;
      }).length,
      deliveredUnitsLast30Days: (data.sales_po ?? []).filter(row => {
        const date = getDateValue(row["REAL DD"]);
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return date >= thirtyDaysAgo;
      }).reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0),
      lastQuarterLabel: lastQuarterLabel,
      unitsDeliveredLastQuarter: (data.sales_po ?? []).filter(row => {
        const date = getDateValue(row["REAL DD"]);
        return date >= quarterStart && date <= quarterEnd;
      }).reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0),
      inProduction: (data.sales_po ?? []).filter(row => row["LIVE STATUS"] === "In Production").length,
      fabricOrdered: (data.fabric ?? []).filter(row => row["STATUS"] === "Ordered").length,
      pendingUnits: (data.sales_po ?? []).filter(row => row["LIVE STATUS"] === "Pending").reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0),
      goldSealSent: (data.sales_po ?? []).filter(row => row["FIT STATUS"] === "Gold Seal").length,
      lastDeliveryDateFormatted: formatDate((data.sales_po ?? []).sort((a, b) => getDateValue(b["REAL DD"]) - getDateValue(a["REAL DD"]))[0]?.["REAL DD"]) || "N/A",
      lastYearOrdersLabel: `Orders ${currentYear - 1}`,
      ordersLastYear: (data.sales_po ?? []).filter(row => {
        const date = getDateValue(row["REAL DD"]);
        return date >= lastYearStart && date <= lastYearEnd;
      }).length,
      lastYearLabel: `${currentYear - 1}`,
      unitsDeliveredLastYear: (data.sales_po ?? []).filter(row => {
        const date = getDateValue(row["REAL DD"]);
        return date >= lastYearStart && date <= lastYearEnd;
      }).reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0),
      currentYearLabel: `${currentYear}`,
      unitsDeliveredCurrentYear: (data.sales_po ?? []).filter(row => {
        const date = getDateValue(row["REAL DD"]);
        return date >= currentYearStart;
      }).reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0)
    };
    return stats;
  }, [data.sales_po, data.fabric]);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <FiShoppingBag size={32} className="spin" />
        </div>
        <h2>Loading High5 Production Dashboard</h2>
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
    <Router>
      <Routes>
        <Route path="/" element={
          <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
            <div className="app-content">
              <header className="app-header no-print">
                <div className="header-content">
                  <h1>High5 Production Dashboard</h1>
                  <div className="header-actions">
                    <Link to="/pd-kaiia" className="action-button" aria-label="Go to PD & KAIIA Dashboard">
                      <FiUsers size={16} /> PD & KAIIA
                    </Link>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className="action-button"
                      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    >
                      {darkMode ? "Light" : "Dark"}
                    </button>
                    <button
                      onClick={() => setShowStats(!showStats)}
                      className="action-button"
                      aria-label={showStats ? "Hide stats" : "Show stats"}
                    >
                      {showStats ? "Hide Stats" : "Show Stats"}
                    </button>
                  </div>
                </div>
              </header>

              {showStats && (
                <StatsPanel productionStats={productionStats} colors={colors} />
              )}

              <div className="tabs no-print">
                <button
                  className={`tab-button ${activeTab === "sales" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("sales");
                    setCurrentPage(1);
                  }}
                  style={{ backgroundColor: activeTab === "sales" ? colors.activeTab : colors.inactiveTab }}
                  aria-label="View sales"
                >
                  Sales
                </button>
                <button
                  className={`tab-button ${activeTab === "fabric" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("fabric");
                    setCurrentPage(1);
                  }}
                  style={{ backgroundColor: activeTab === "fabric" ? colors.activeTab : colors.inactiveTab }}
                  aria-label="View fabric"
                >
                  Fabric
                </button>
                <button
                  className={`tab-button ${activeTab === "developments" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("developments");
                    setCurrentPage(1);
                  }}
                  style={{ backgroundColor: activeTab === "developments" ? colors.activeTab : colors.inactiveTab }}
                  aria-label="View developments"
                >
                  Developments
                </button>
                <button
                  className={`tab-button ${activeTab === "production" ? "active" : ""}`}
                  onClick={() => {
                    setActiveTab("production");
                    setCurrentPage(1);
                  }}
                  style={{ backgroundColor: activeTab === "production" ? colors.activeTab : colors.inactiveTab }}
                  aria-label="View production"
                >
                  Production
                </button>
              </div>

              <div className="filter-container no-print">
                <div className="search-bar">
                  <FiSearch size={16} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="search-input"
                    aria-label="Search data"
                  />
                </div>
                {activeTab === "sales" && (
                  <div className="filters">
                    {salesFilterOptions.map(filter => (
                      <div key={filter.key} className="filter-item">
                        <select
                          value={filters[filter.key]}
                          onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                          className="filter-select"
                          aria-label={`Filter by ${filter.label}`}
                        >
                          <option value="">All {filter.label}</option>
                          {filter.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "fabric" && (
                  <div className="filters">
                    {fabricFilterOptions.map(filter => (
                      <div key={filter.key} className="filter-item">
                        <select
                          value={fabricFilters[filter.key]}
                          onChange={(e) => setFabricFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                          className="filter-select"
                          aria-label={`Filter by ${filter.label}`}
                        >
                          <option value="">All {filter.label}</option>
                          {filter.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === "developments" && (
                  <div className="filters">
                    {[
                      {
                        key: "TYPE",
                        label: "Type",
                        options: [...new Set((data.insert_pattern ?? []).map(row => row["STYLE TYPE"]).filter(Boolean))]
                      },
                      {
                        key: "CUSTOMER NAME",
                        label: "Customer",
                        options: [...new Set((data.insert_pattern ?? []).map(row => row["CUSTOMER NAME"]).filter(Boolean))]
                      }
                    ].map(filter => (
                      <div key={filter.key} className="filter-item">
                        <select
                          value={filters[filter.key]}
                          onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
                          className="filter-select"
                          aria-label={`Filter by ${filter.label}`}
                        >
                          <option value="">All {filter.label}</option>
                          {filter.options.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="content">
                {activeTab === "sales" && (
                  <div className="table-container">
                    <SalesTable
                      data={filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
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
                      data={filteredFabric.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                      fabricFilters={fabricFilters}
                      setFabricFilters={setFabricFilters}
                      colors={colors}
                      handleMouseEnter={handleMouseEnter}
                      handleMouseLeave={handleMouseLeave}
                      getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                      getMatchingSalesImage={() => {}}
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
                      data={filteredDevelopments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
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
                        <DocketSheet selectedData={(data.sales_po ?? []).filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
                        <CuttingSheet selectedData={(data.sales_po ?? []).filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
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
  );
}

export default App;