// src/App.js
import React, { useState, useMemo, useEffect, useCallback } from "react";
import * as XLSX from 'xlsx';
import { Routes, Route, Link } from 'react-router-dom';
import {
  FiAlertCircle,
  FiDownload, 
  FiSearch,
  FiFileText, 
  FiLayers, 
  FiShoppingBag, 
  FiPrinter, 
  FiUsers
} from 'react-icons/fi';
import SalesTable from './components/SalesTable';
import FabricTable from './components/FabricTable';
import DevelopmentsTable from './components/DevelopmentsTable';
import DocketSheet from './components/DocketSheet';
import CuttingSheet from './components/CuttingSheet';
import StatsPanel from './components/StatsPanel';
import CustomerPage from './components/CustomerPage';
import { formatDate, getDateValue, formatCurrency, compactSizes, getGoogleDriveThumbnail, getGoogleDriveDownloadLink, preloadImages } from './utils/index';
import { useData } from './useData';
import './styles.css';

function App() {
  const { data, loading, error } = useData();
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
  const [showStats, setShowStats] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const colors = useMemo(() => darkMode ? {
    primary: "#6366F1",
    primaryLight: "#818CF8",
    primaryDark: "#4F46E5",
    secondary: "#EC4899",
    secondaryLight: "#F472B6",
    secondaryDark: "##DB2777",
    accent: "#F59E0B",
    accentLight: "#FBBF24",
    accentDark: "#D97706",
    danger: "#EF4444",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
    textDark: "#F3F4F6",
    textMedium: "#9CA3AF",
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
  }, [darkMode]);

  // Preload images when data changes
  useEffect(() => {
    if (data.sales_po) {
      const salesImages = data.sales_po.map(row => row.IMAGE).filter(Boolean);
      preloadImages(salesImages);
    }
    
    if (data.insert_pattern) {
      const devImages = data.insert_pattern.flatMap(row => [
        row["FRONT IMAGE"],
        row["BACK IMAGE"], 
        row["SIDE IMAGE"]
      ]).filter(Boolean);
      preloadImages(devImages);
    }
  }, [data]);

  const formLinks = useMemo(() => [
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
      external: true // Changed to true to open in new window
    }
  ], [colors]);

  const productionStats = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const stats = {
      totalOrders: 0,
      totalUnits: 0,
      deliveredLast30Days: 0,
      deliveredUnitsLast30Days: 0,
      pendingUnits: 0,
      inProduction: 0,
      fabricOrdered: 0,
      notDelivered: 0,
      goldSealSent: 0,
      lastDeliveryDateFormatted: "-",
    };

    if (data.sales_po && data.sales_po.length > 0) {
      data.sales_po.forEach(row => {
        const units = parseInt(row["TOTAL UNITS"] || 0);
        const status = row["LIVE STATUS"];
        const deliveryDate = getDateValue(row["REAL DD"]);
        
        stats.totalOrders++;
        stats.totalUnits += isNaN(units) ? 0 : units;
        
        if (status === "DELIVERED" && deliveryDate >= oneMonthAgo.getTime()) {
          stats.deliveredLast30Days++;
          stats.deliveredUnitsLast30Days += isNaN(units) ? 0 : units;
        }
        
        if (status !== "DELIVERED") {
          stats.pendingUnits += isNaN(units) ? 0 : units;
          stats.notDelivered++;
        }
        
        if (status === "IN PRODUCTION") stats.inProduction += isNaN(units) ? 0 : units;
        if (status === "FABRIC ORDERED") stats.fabricOrdered += isNaN(units) ? 0 : units;
        if (row["FIT STATUS"] === "GS SENT") stats.goldSealSent += isNaN(units) ? 0 : units;
      });

      // Find last delivery
      const deliveredOrders = data.sales_po.filter(row => row["LIVE STATUS"] === "DELIVERED");
      if (deliveredOrders.length > 0) {
        const lastDelivery = deliveredOrders.reduce((latest, row) => {
          const date = getDateValue(row["REAL DD"]);
          return !latest || date > getDateValue(latest["REAL DD"]) ? row : latest;
        }, null);

        if (lastDelivery) {
          stats.lastDeliveryDateFormatted = formatDate(lastDelivery["REAL DD"]);
        }
      }
    }

    return stats;
  }, [data.sales_po]);

  const filteredSales = useMemo(() => {
    if (!data.sales_po) return [];
    
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => {
        const searchLower = search.toLowerCase();
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      })
      .filter(row => !filters.TYPE || (row["TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["LIVE STATUS"] || (row["LIVE STATUS"] || "").toLowerCase() === filters["LIVE STATUS"].toLowerCase())
      .filter(row => !filters["FIT STATUS"] || (row["FIT STATUS"] || "").toLowerCase() === filters["FIT STATUS"].toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));
  }, [data.sales_po, search, filters]);

  const filteredFabric = useMemo(() => {
    if (!data.fabric) return [];
    
    return data.fabric
      .filter(row => {
        const searchLower = search.toLowerCase();
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      })
      .filter(row => !fabricFilters.TYPE || (row["TYPE"] || "").toLowerCase() === fabricFilters.TYPE.toLowerCase())
      .filter(row => !fabricFilters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === fabricFilters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !fabricFilters.SUPPLIER || (row["SUPPLIER"] || "").toLowerCase() === fabricFilters.SUPPLIER.toLowerCase())
      .sort((a, b) => (b["NO."] || "").localeCompare(a["NO."] || ""));
  }, [data.fabric, search, fabricFilters]);

  const filteredDevelopments = useMemo(() => {
    if (!data.insert_pattern) return [];
    
    return data.insert_pattern
      .filter(row => {
        const searchLower = search.toLowerCase();
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      })
      .filter(row => !filters.TYPE || (row["STYLE TYPE"] || "").toLowerCase() === filters.TYPE.toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !filters["FIT SAMPLE"] || (row["FIT SAMPLE"] || "").toLowerCase() === filters["FIT SAMPLE"].toLowerCase())
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));
  }, [data.insert_pattern, search, filters]);

  const handleMouseEnter = useCallback((url, e) => {
    if (!url) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const isNearBottom = window.innerHeight - rect.bottom < 250;
    setPreviewImage({
      url: getGoogleDriveThumbnail(url),
      visible: true,
      position: { x: rect.left + rect.width / 2, y: rect.top + window.scrollY },
      direction: isNearBottom ? 'above' : 'below'
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setPreviewImage(prev => ({ ...prev, visible: false }));
  }, []);

  const exportToExcel = useCallback(() => {
    let exportData = [];
    let sheetName = '';
    
    if (activeTab === 'sales') {
      exportData = filteredSales;
      sheetName = 'Sales';
    } else if (activeTab === 'fabric') {
      exportData = filteredFabric;
      sheetName = 'Fabric';
    } else if (activeTab === 'developments') {
      exportData = filteredDevelopments;
      sheetName = 'Developments';
    }

    if (exportData.length === 0) {
      alert('No data to export!');
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${sheetName}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data. Please try again.');
    }
  }, [activeTab, filteredSales, filteredFabric, filteredDevelopments]);

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
                  disabled={!filteredSales.length && !filteredFabric.length && !filteredDevelopments.length}
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
                            onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
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
                            onChange={(e) => setFabricFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
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
                            onChange={(e) => setFilters(prev => ({ ...prev, [filter.key]: e.target.value }))}
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
                <SalesTable
                  data={filteredSales}
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
              )}

              {activeTab === "fabric" && (
                <FabricTable
                  data={filteredFabric}
                  colors={colors}
                  handleMouseEnter={handleMouseEnter}
                  handleMouseLeave={handleMouseLeave}
                  getGoogleDriveThumbnail={getGoogleDriveThumbnail}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  totalItems={filteredFabric.length}
                  itemsPerPage={itemsPerPage}
                />
              )}

              {activeTab === "developments" && (
                <DevelopmentsTable
                  data={filteredDevelopments}
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
                        disabled={!poInput.trim()}
                      >
                        Generate Sheets
                      </button>
                      <button 
                        onClick={() => window.print()} 
                        className="action-button print-button"
                        disabled={selectedPOs.length === 0}
                      >
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
                  [previewImage.direction === 'below' ? 'top' : 'bottom']: 
                    `${previewImage.direction === 'below' ? previewImage.position.y + 20 : window.innerHeight - previewImage.position.y + 20}px`
                }}
              >
                <img 
                  src={previewImage.url} 
                  alt="Preview"
                  className="preview-image"
                  onError={(e) => {
                    e.target.src = "/fallback-image.png";
                  }}
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
  );
}

export default App;