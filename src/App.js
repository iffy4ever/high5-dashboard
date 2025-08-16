import React, { useEffect, useState, useMemo, useCallback } from "react";
import * as XLSX from 'xlsx';
import {
  FiTruck, FiCalendar, FiClock, FiAlertCircle, 
  FiDatabase, FiDownload, FiFilter, FiSearch, FiExternalLink,
  FiImage, FiFileText, FiDollarSign, FiUsers, FiCheckCircle,
  FiLayers, FiShoppingBag, FiPrinter, FiBarChart2
} from 'react-icons/fi';
import { FaCircle } from 'react-icons/fa';
import SalesTable from './components/SalesTable';
import FabricTable from './components/FabricTable';
import DevelopmentsTable from './components/DevelopmentsTable';
import StatsPanel from './components/StatsPanel';
import Notifications from './components/Notifications';
import DocketSheet from './components/DocketSheet';
import CuttingSheet from './components/CuttingSheet';
import './styles.css';

const formatDate = (value) => {
  if (!value) return "";
  try {
    let date;
    if (typeof value === 'number') {
      date = new Date((value - 25569) * 86400 * 1000);
    } else {
      date = new Date(value);
    }
    if (isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(value);
  }
};

const getDateValue = (value) => {
  if (!value) return 0;
  let date;
  if (typeof value === 'number') {
    date = new Date((value - 25569) * 86400 * 1000);
  } else {
    date = new Date(value);
  }
  return isNaN(date.getTime()) ? 0 : date.getTime();
};

const getGoogleDriveThumbnail = (url) => {
  if (!url) return "";
  try {
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    if (!fileId) {
      console.warn("No valid file ID found in URL:", url);
      return "";
    }
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  } catch (e) {
    console.error("Error generating thumbnail URL:", e);
    return "";
  }
};

function App() {
  const [data, setData] = useState({
    sales_po: [],
    fabric_po: [],
    insert_pattern: []
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    TYPE: "",
    "STYLE TYPE": "",
    COLOUR: "",
    "LIVE STATUS": "",
    "FIT STATUS": "",
    "CUSTOMER NAME": "",
    "FIT SAMPLE": ""
  });
  const [fabricFilters, setFabricFilters] = useState({
    TYPE: "",
    COLOUR: "",
    SUPPLIER: ""
  });
  const [activeTab, setActiveTab] = useState("dashboard");
  const [previewImage, setPreviewImage] = useState({
    url: null,
    visible: false,
    position: { x: 0, y: 0 },
    direction: 'below'
  });
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [poInput, setPoInput] = useState("");
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [showStats, setShowStats] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    textMedium: "#9CA3AF",
    textLight: "#000000",
    background: "#111827",
    cardBg: "#1F2937",
    border: "#374151",
    rowEven: "#1F2937",
    rowOdd: "#111827",
    headerBg: "#1F2937",
    headerText: "#000000",
    activeTab: "#6366F1",
    inactiveTab: "#6B7280",
    actionButton: "#10B981",
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
    textLight: "#000000",
    background: "#F9FAFB",
    cardBg: "#FFFFFF",
    border: "#E5E7EB",
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "#FFFFFF",
    headerText: "#000000",
    activeTab: "#6366F1",
    inactiveTab: "#9CA3AF",
    actionButton: "#10B981",
    statCardBg: "#FFFFFF",
    statCardBorder: "#E5E7EB",
  };

  const formLinks = [
    {
      label: "Development Form",
      url: "https://forms.gle/hq1pgP4rz1BSjiCc6",
      icon: <FiFileText size={16} />,
      color: colors.primary
    },
    {
      label: "Insert Pattern Form",
      url: "https://forms.gle/LBQwrpMjJuFzLTsC8",
      icon: <FiLayers size={16} />,
      color: colors.secondary
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
      unitsDeliveredCurrentYear: 0,
      unitsDeliveredLastYear: 0,
      ordersLastYear: 0,
      pendingUnits: 0,
      inProduction: 0,
      fabricOrdered: 0,
      notDelivered: 0,
      goldSealSent: 0,
      lastDeliveryDate: null,
      statusDistribution: {},
      colorDistribution: {},
      customerDistribution: {}
    };

    data.sales_po.forEach(order => {
      const status = String(order["LIVE STATUS"] || "").toUpperCase().trim();
      const totalUnits = parseInt(order["TOTAL UNITS"] || 0);
      const color = order["COLOUR"] || "Unknown";
      const customer = order["CUSTOMER NAME"] || "Unknown";
      
      stats.totalUnits += totalUnits;
      stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1;
      stats.colorDistribution[color] = (stats.colorDistribution[color] || 0) + 1;
      stats.customerDistribution[customer] = (stats.customerDistribution[customer] || 0) + 1;

      let deliveryDate = null;
      try {
        if (order["REAL DD"]) {
          if (typeof order["REAL DD"] === 'number') {
            deliveryDate = new Date((order["REAL DD"] - 25569) * 86400 * 1000);
          } else {
            deliveryDate = new Date(order["REAL DD"]);
          }
          if (isNaN(deliveryDate.getTime())) deliveryDate = null;
        }
      } catch (e) {
        deliveryDate = null;
      }

      stats.totalOrders++;

      if (status === "DELIVERED" && deliveryDate) {
        if (deliveryDate > oneMonthAgo) {
          stats.deliveredLast30Days++;
          stats.deliveredUnitsLast30Days += totalUnits;
        }

        if (deliveryDate >= lastQuarterStart && deliveryDate <= lastQuarterEnd) {
          stats.unitsDeliveredLastQuarter += totalUnits;
        }

        if (deliveryDate >= currentYearStart && deliveryDate <= currentYearEnd) {
          stats.unitsDeliveredCurrentYear += totalUnits;
        }

        if (deliveryDate >= lastYearStart && deliveryDate <= lastYearEnd) {
          stats.unitsDeliveredLastYear += totalUnits;
          stats.ordersLastYear++;
        }
        
        if (!stats.lastDeliveryDate || deliveryDate > stats.lastDeliveryDate) {
          stats.lastDeliveryDate = deliveryDate;
        }
      } else {
        stats.pendingUnits += totalUnits;
      }

      if (status === "IN PRODUCTION") {
        stats.inProduction++;
      } else if (status === "FABRIC ORDERED") {
        stats.fabricOrdered++;
      } else if (status !== "DELIVERED") {
        stats.notDelivered++;
      }

      if (String(order["FIT STATUS"] || "").toUpperCase().trim() === "GS SENT") {
        stats.goldSealSent++;
      }
    });

    const lastQuarterMonth = lastQuarterStart.toLocaleString('en-GB', { month: 'short' });
    const lastQuarterEndMonth = lastQuarterEnd.toLocaleString('en-GB', { month: 'short' });
    const lastQuarterYear = lastQuarterStart.getFullYear();
    const lastQuarterLabel = `Units (${lastQuarterMonth}-${lastQuarterEndMonth} ${lastQuarterYear})`;

    const currentYearLabel = `Units (FY${currentFiscalYear})`;

    const lastYearLabel = `Units (FY${currentFiscalYear-1})`;

    const lastYearOrdersLabel = `Orders (FY${currentFiscalYear-1})`;

    return {
      ...stats,
      lastDeliveryDateFormatted: stats.lastDeliveryDate 
        ? stats.lastDeliveryDate.toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }) 
        : "No Deliveries Yet",
      topCustomers: Object.entries(stats.customerDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
      lastQuarterLabel,
      currentYearLabel,
      lastYearLabel,
      lastYearOrdersLabel
    };
  }, [data.sales_po]);

  const formatCurrency = (value) => {
    if (!value) return "£0.00";
    const number = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g, "")) : value;
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);
  };

  const compactSizes = (row) => {
    const sizes = ["4", "6", "8", "10", "12", "14", "16", "18"];
    return sizes.map(s => row[s] ? `${s}-${row[s]}` : "").filter(Boolean).join(", ");
  };

  const getGoogleDriveDownloadLink = (url) => {
    if (!url) return "";
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    return fileId ? `https://drive.google.com/file/d/${fileId}/view` : "";
  };

  const handleMouseEnter = (imageUrl, e) => {
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    const showAbove = mouseY > windowHeight * 0.7;
    setPreviewImage({
      url: getGoogleDriveThumbnail(imageUrl).replace("w200", "w800"),
      visible: true,
      position: { x: e.clientX, y: e.clientY },
      direction: showAbove ? 'above' : 'below'
    });
  };

  const handleMouseLeave = () => {
    setPreviewImage(prev => ({ ...prev, visible: false }));
  };

  const getMatchingSalesImage = (orderRef) => {
    const matchingSales = data.sales_po.find(sales => sales["PO NUMBER"] === orderRef);
    return matchingSales ? matchingSales.IMAGE : null;
  };

  const exportToExcel = () => {
    let dataToExport, columnOrder;
    if (activeTab === "dashboard") {
      dataToExport = filteredSales;
      columnOrder = [
        "IMAGE", "FIT STATUS", "H-NUMBER", "CUSTOMER NAME", "PO NUMBER", "STYLE NUMBER", "DESCRIPTION", 
        "COLOUR", "PRICE", "TOTAL UNITS", "XFACT DD", "REAL DD", "LIVE STATUS", "CMT PRICE", "ACTUAL CMT",
        "PACKING LIST", "SIZES"
      ];
    } else if (activeTab === "fabric") {
      dataToExport = filteredFabric.map(row => ({
        ...row,
        IMAGE: getMatchingSalesImage(row["ORDER REF"]) || "N/A"
      }));
      columnOrder = [
        "NO.", "IMAGE", "DATE", "H-NUMBER", "ORDER REF", "TYPE", 
        "DESCRIPTION", "COLOUR", "TOTAL", "FABRIC/TRIM PRICE", "FABRIC PO LINKS"
      ];
    } else if (activeTab === "developments") {
      dataToExport = filteredDevelopments;
      columnOrder = [
        "TIMESTAMP", "H-NUMBER", "CUSTOMER NAME", "STYLE TYPE", "CUSTOMER CODE", "FRONT IMAGE", "BACK IMAGE",
        "SIDE IMAGE", "PATTERN IMAGE", "FIT SAMPLE", "TOTAL COST", "CMT PRICE", "COSTING LINK"
      ];
    }

    const exportData = dataToExport.map(row => {
      const newRow = {};
      columnOrder.forEach(key => {
        const originalKey = key === "FABRIC/TRIM PRICE" ? "FABRIC/TRIM PRICE" : 
                          key === "FIT SAMPLE" ? "FIT SAMPLE" : 
                          key === "TIMESTAMP" ? "Timestamp" : key;
        if (originalKey in row) {
          if (["PRICE", "CMT PRICE", "ACTUAL CMT", "FABRIC/TRIM PRICE", "TOTAL COST"].includes(originalKey)) {
            newRow[key] = formatCurrency(row[originalKey]);
          } else if (["XFACT DD", "REAL DD", "DATE", "TIMESTAMP"].includes(originalKey)) {
            newRow[key] = formatDate(row[originalKey]);
          } else if (key === "SIZES") {
            newRow[key] = compactSizes(row);
          } else {
            newRow[key] = row[originalKey];
          }
        }
      });
      return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(exportData, { header: columnOrder });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}Data`);

    const fileName = `High5_${activeTab}_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const generateNotifications = useCallback(() => {
    const statuses = ["DELAYED", "URGENT", "NEW ORDER", "FABRIC RECEIVED"];
    const customers = ["Customer A", "Customer B", "Customer C", "Customer D"];
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      type: statuses[i % statuses.length],
      message: `Order #${1000 + i} from ${customers[i % customers.length]} is ${statuses[i % statuses.length]}`,
      time: new Date(now.getTime() - (i * 3600000)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    }));
  }, []);

  const fetchDataWithRetry = async (retries = 3, delay = 1000) => {
    const scriptUrl = `https://script.google.com/macros/s/AKfycbwdQGsEV8yYmE9FyS47oyARI5wLpfnoa1ZO2SNi6LUuhcLtMDgwSz_84qT5FERrEE0lkQ/exec`;
    
    const fetchData = () => new Promise((resolve, reject) => {
      // Set up JSONP callback
      const callbackName = 'jsonpCallback_' + Math.round(100000 * Math.random());
      window[callbackName] = (fetched) => {
        try {
          console.log('JSONP data received from:', scriptUrl, fetched);
          if (!fetched || typeof fetched !== 'object') {
            throw new Error('Invalid JSONP response: Data is not an object');
          }
          setData({
            sales_po: Array.isArray(fetched.sales_po) ? fetched.sales_po : [],
            fabric_po: Array.isArray(fetched.fabric_po) ? fetched.fabric_po : [],
            insert_pattern: Array.isArray(fetched.insert_pattern) ? fetched.insert_pattern : []
          });
          setNotifications(generateNotifications());
          resolve();
        } catch (e) {
          console.error('Error parsing JSONP data:', e);
          reject(new Error(`Error parsing JSONP data: ${e.message}`));
        } finally {
          delete window[callbackName];
        }
      };

      // Create script element
      const script = document.createElement("script");
      script.src = `${scriptUrl}?callback=${callbackName}`;
      script.async = true;
      script.onerror = (err) => {
        console.error('Script loading error for URL:', scriptUrl, err);
        reject(new Error(`Failed to load script: ${err.message || 'Network error'}`));
      };
      document.body.appendChild(script);

      // Timeout for JSONP request
      const timeout = setTimeout(() => {
        console.error('JSONP request timed out for URL:', scriptUrl);
        reject(new Error('JSONP request timed out after 10 seconds'));
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
        delete window[callbackName];
      }, 10000);

      // Cleanup on success
      script.onload = () => {
        clearTimeout(timeout);
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    });

    for (let i = 0; i < retries; i++) {
      try {
        await fetchData();
        console.log(`Data fetch successful on attempt ${i + 1}`);
        setLoading(false);
        return;
      } catch (e) {
        console.warn(`Retry ${i + 1}/${retries} failed for ${scriptUrl}:`, e.message);
        if (i < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        setError(`Failed to load data after ${retries} attempts: ${e.message}`);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log('Initiating data fetch...');
    fetchDataWithRetry().catch(err => {
      console.error('Data fetch failed:', err);
      setError(`Failed to initialize data fetch: ${err.message}`);
      setLoading(false);
    });
  }, [generateNotifications]);

  const filteredSales = useMemo(() => {
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(filters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()))
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));
  }, [data.sales_po, search, filters]);

  const filteredFabric = useMemo(() => {
    return data.fabric_po
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(fabricFilters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()))
      .sort((a, b) => getDateValue(b["DATE"]) - getDateValue(a["DATE"]));
  }, [data.fabric_po, search, fabricFilters]);

  const filteredDevelopments = useMemo(() => {
    return data.insert_pattern
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(filters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()))
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));
  }, [data.insert_pattern, search, filters]);

  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSales.slice(start, start + itemsPerPage);
  }, [filteredSales, currentPage]);

  const paginatedFabric = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredFabric.slice(start, start + itemsPerPage);
  }, [filteredFabric, currentPage]);

  const paginatedDevelopments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDevelopments.slice(start, start + itemsPerPage);
  }, [filteredDevelopments, currentPage]);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <FiShoppingBag size={32} className="spin" />
        </div>
        <h2>Loading Production Dashboard</h2>
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
          onClick={() => {
            setLoading(true);
            setError(null);
            console.log('Retrying data fetch...');
            fetchDataWithRetry().catch(err => {
              console.error('Retry failed:', err);
              setError(`Retry failed: ${err.message}`);
              setLoading(false);
            });
          }}
          className="retry-button"
        >
          <FiShoppingBag size={16} /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`} role="main">
      <div className="main-content">
        <header className="top-nav no-print">
          <div className="nav-left">
            <h1>High5 Production Dashboard</h1>
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="toggle-icon">
                {darkMode ? '☀️' : '🌙'}
              </span>
            </button>
          </div>
          <div className="nav-right">
            <button 
              className="stats-toggle"
              onClick={() => setShowStats(!showStats)}
              aria-label="Toggle statistics panel"
              style={{ color: colors.primary }}
            >
              <FiBarChart2 size={18} />
            </button>
            <Notifications notifications={notifications} setNotifications={setNotifications} colors={colors} />
          </div>
        </header>

        {showStats && (
          <StatsPanel productionStats={productionStats} colors={colors} />
        )}

        <div className="content-wrapper no-print">
          <div className="form-links-grid">
            {formLinks.map((form, index) => (
              <a
                key={index}
                href={form.url}
                target="_blank"
                rel="noopener noreferrer"
                className="form-link"
                style={{ backgroundColor: form.color }}
                aria-label={`Open ${form.label}`}
              >
                <div className="form-icon">{form.icon}</div>
                <div className="form-content">
                  <div className="form-label">{form.label}</div>
                  <div className="form-subtext">Submit</div>
                </div>
                <FiExternalLink size={14} />
              </a>
            ))}
          </div>

          <div className="tab-container">
            <div className="tabs">
              {[
                { id: "dashboard", label: "Sales Orders", icon: <FiShoppingBag size={16} /> },
                { id: "fabric", label: "Fabric Orders", icon: <FiLayers size={16} /> },
                { id: "developments", label: "Developments", icon: <FiLayers size={16} /> },
                { id: "production", label: "Production Sheets", icon: <FiPrinter size={16} /> }
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                  aria-label={`Switch to ${tab.label} tab`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="search-filter-container">
            <div className="search-box">
              <FiSearch className="search-icon" size={16} />
              <input
                placeholder="Search Orders, Styles, Colors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
                aria-label="Search orders"
              />
            </div>
            
            <div className="action-buttons">
              <button
                onClick={() => {
                  if (activeTab === "dashboard") {
                    setFilters({
                      TYPE: "",
                      COLOUR: "",
                      "LIVE STATUS": "",
                      "FIT STATUS": ""
                    });
                  } else if (activeTab === "fabric") {
                    setFabricFilters({
                      TYPE: "",
                      COLOUR: "",
                      SUPPLIER: ""
                    });
                  } else if (activeTab === "developments") {
                    setFilters({
                      "STYLE TYPE": "",
                      "CUSTOMER NAME": "",
                      "FIT SAMPLE": ""
                    });
                  }
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="secondary-button"
                aria-label="Clear filters"
              >
                <FiFilter size={14} />
                Clear Filters
              </button>

              <button
                onClick={exportToExcel}
                className="primary-button"
                aria-label="Export to Excel"
              >
                <FiDownload size={14} />
                Export
              </button>

              <button
                onClick={() => window.print()}
                className="secondary-button"
                aria-label="Print"
              >
                <FiPrinter size={14} />
                Print
              </button>
            </div>
          </div>

          {activeTab === "dashboard" && (
            <SalesTable
              data={paginatedSales}
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
          )}

          {activeTab === "fabric" && (
            <FabricTable
              data={paginatedFabric}
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
          )}

          {activeTab === "developments" && (
            <DevelopmentsTable
              data={paginatedDevelopments}
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
          )}

          {activeTab === "production" && (
            <div className="tab-content no-print">
              <div className="po-input-container" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', borderTop: `2px solid ${colors.border}`, paddingTop: '1rem', marginTop: '1.5rem'}}>
                <div className="filter-item" style={{flex: 1}}>
                  <textarea
                    value={poInput}
                    onChange={(e) => setPoInput(e.target.value)}
                    placeholder="Enter PO Numbers e.g., PO0004 PO0001,PO0002"
                    rows={1}
                    className="filter-select"
                    style={{width: '100%', height: '40px', overflow: 'hidden'}}
                    aria-label="Enter PO Numbers"
                  />
                </div>
                <div className="po-buttons" style={{display: 'flex', gap: '0.75rem'}}>
                  <button
                    onClick={() => {
                      const pos = poInput.split(/[\n, ]+/).map(p => p.trim()).filter(Boolean);
                      setSelectedPOs(pos);
                    }}
                    className="primary-button"
                    aria-label="Generate Production Sheets"
                  >
                    Generate Sheets
                  </button>
                  <button onClick={() => window.print()} className="primary-button" aria-label="Print Sheets">
                    <FiPrinter size={14} /> Print Sheets
                  </button>
                </div>
              </div>

              {selectedPOs.length > 0 && (
                <div className="sheets-container" style={{marginTop: '20px'}}>
                  <DocketSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} formatDate={formatDate} getGoogleDriveThumbnail={getGoogleDriveThumbnail} />
                  <CuttingSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} formatDate={formatDate} getGoogleDriveThumbnail={getGoogleDriveThumbnail} />
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
            aria-hidden="true"
          >
            <img 
              src={previewImage.url} 
              alt="Image Preview" 
              className="preview-image"
              loading="lazy"
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
  );
}

export default App;