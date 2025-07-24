import React, { useEffect, useState, useMemo, useCallback } from "react";
import * as XLSX from 'xlsx';
import {
  FiTruck, FiCalendar, FiClock, FiAlertCircle, 
  FiDatabase, FiDownload, FiFilter, FiSearch, FiExternalLink,
  FiImage, FiFileText, FiDollarSign, FiUsers, FiCheckCircle,
  FiLayers, FiShoppingBag, FiPrinter, FiBell, FiMoon, FiSun
} from 'react-icons/fi';
import { FaCircle } from 'react-icons/fa';
import './App.css';

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

const getGoogleDriveViewLink = (url) => {
  if (!url) return "";
  try {
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    if (!fileId) {
      console.warn("No valid file ID found in URL:", url);
      return "";
    }
    return `https://drive.google.com/file/d/${fileId}/view`;
  } catch (e) {
    console.error("Error generating view URL:", e);
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

  // Premium Color Scheme with dark mode support
  const colors = darkMode ? {
    primary: "#60A5FA",
    primaryLight: "#DBEAFE",
    primaryDark: "#2563EB",
    secondary: "#A78BFA",
    secondaryLight: "#EDE9FE",
    secondaryDark: "#7C3AED",
    accent: "#F472B6",
    accentLight: "#FBCFE8",
    accentDark: "#DB2777",
    danger: "#FCA5A5",
    success: "#4ADE80",
    warning: "#FBBF24",
    info: "#38BDF8",
    textDark: "#F3F4F6",
    textMedium: "#9CA3AF",
    textLight: "#111827",
    background: "#1F2937",
    cardBg: "#374151",
    border: "#4B5563",
    rowEven: "#374151",
    rowOdd: "#2D3748",
    headerBg: "#2563EB",
    headerText: "#F3F4F6",
    activeTab: "#A78BFA",
    inactiveTab: "#6B7280",
    actionButton: "#4ADE80",
    statCardBg: "#374151",
    statCardBorder: "#4B5563",
  } : {
    primary: "#2563EB",
    primaryLight: "#60A5FA",
    primaryDark: "#1E40AF",
    secondary: "#7C3AED",
    secondaryLight: "#A78BFA",
    secondaryDark: "#5B21B6",
    accent: "#DB2777",
    accentLight: "#F472B6",
    accentDark: "#BE185D",
    danger: "#EF4444",
    success: "#22C55E",
    warning: "#F59E0B",
    info: "#0EA5E9",
    textDark: "#111827",
    textMedium: "#6B7280",
    textLight: "#FFFFFF",
    background: "#F9FAFB",
    cardBg: "#FFFFFF",
    border: "#E5E7EB",
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "#2563EB",
    headerText: "#FFFFFF",
    activeTab: "#7C3AED",
    inactiveTab: "#9CA3AF",
    actionButton: "#22C55E",
    statCardBg: "#FFFFFF",
    statCardBorder: "#E5E7EB",
  };

  // Form links with icons (removed Fit Status Form)
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
      color: colors.accent
    }
  ];

  // Calculate production statistics
  const productionStats = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const lastQuarterStart = new Date('2025-04-01');
    const lastQuarterEnd = new Date('2025-06-30');
    const currentYearStart = new Date('2024-07-01');
    const currentYearEnd = new Date('2025-06-30');

    let stats = {
      totalOrders: 0,
      deliveredLast30Days: 0,
      deliveredUnitsLast30Days: 0,
      unitsDeliveredLastQuarter: 0,
      unitsDeliveredCurrentYear: 0,
      pendingUnits: 0,
      inProduction: 0,
      fabricOrdered: 0,
      notDelivered: 0,
      gsSent: 0,
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
        stats.gsSent++;
      }
    });

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
        .slice(0, 5)
    };
  }, [data.sales_po]);

  // Utility Functions
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

  const getGoogleDriveViewLink = (url) => {
    if (!url) return "";
    try {
      const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
      if (!fileId) {
        console.warn("No valid file ID found in URL:", url);
        return "";
      }
      return `https://drive.google.com/file/d/${fileId}/view`;
    } catch (e) {
      console.error("Error generating view URL:", e);
      return "";
    }
  };

  const handleMouseEnter = (imageUrl, e) => {
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    const showAbove = mouseY > window.innerHeight * 0.7;
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
        "SIDE IMAGE", "PATTERN IMAGE", "FIT SAMPLE", "TOTAL GARMENT PRICE", "CMT PRICE", "COSTING LINK"
      ];
    }

    const exportData = dataToExport.map(row => {
      const newRow = {};
      columnOrder.forEach(key => {
        const originalKey = key === "FABRIC/TRIM PRICE" ? "FABRIC/TRIM PRICE" : 
                            key === "FIT SAMPLE" ? "FIT SAMPLE" : 
                            key === "TIMESTAMP" ? "Timestamp" : key;
        if (originalKey in row) {
          if (["PRICE", "CMT PRICE", "ACTUAL CMT", "FABRIC/TRIM PRICE", "TOTAL GARMENT PRICE"].includes(originalKey)) {
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

  // Generate sample notifications
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

  // Data Loading
  useEffect(() => {
    setLoading(true);
    setError(null);
    window.jsonpCallback = (fetched) => {
      try {
        setData({
          sales_po: fetched.sales_po || [],
          fabric_po: fetched.fabric_po || [],
          insert_pattern: fetched.insert_pattern || []
        });
        console.log('Insert Pattern keys:', Object.keys(fetched.insert_pattern[0] || {}));
        setNotifications(generateNotifications());
      } catch (e) {
        setError("Error Parsing Data");
        console.error(e);
      }
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://script.google.com/macros/s/AKfycbwdQGsEV8yYmE9FyS47oyARI5wLpfnoa1ZO2SNi6LUuhcLtMDgwSz_84qT5FERrEE0lkQ/exec`;
    script.async = true;
    script.onerror = () => {
      setError("Failed To Load Data");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      delete window.jsonpCallback;
      document.body.removeChild(script);
    };
  }, [generateNotifications]);

  // Filtered Data
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

  // Loading State
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

  // Error State
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
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <header className="top-nav no-print">
          <div className="nav-left">
            <h1>High5 Production Dashboard</h1>
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              <span className="toggle-icon">
                {darkMode ? '' : ''}
              </span>
            </button>
          </div>
          <div className="nav-stats">
            {[
              {
                title: "Total Orders",
                value: productionStats.totalOrders,
                icon: <FiShoppingBag size={16} />,
                color: colors.primary,
              },
              {
                title: "Delivered (30d)",
                value: productionStats.deliveredLast30Days,
                icon: <FiTruck size={16} />,
                color: colors.success,
              },
              {
                title: "Units Delivered (30d)",
                value: productionStats.deliveredUnitsLast30Days,
                icon: <FiShoppingBag size={16} />,
                color: colors.success,
              },
              {
                title: "Units Del. Last Qtr",
                value: productionStats.unitsDeliveredLastQuarter,
                icon: <FiTruck size={16} />,
                color: colors.success,
              },
              {
                title: "Units Del. Curr Year",
                value: productionStats.unitsDeliveredCurrentYear,
                icon: <FiTruck size={16} />,
                color: colors.success,
              },
              {
                title: "Last Delivery",
                value: productionStats.lastDeliveryDateFormatted,
                icon: <FiCalendar size={16} />,
                color: colors.secondary,
              },
              {
                title: "In Production",
                value: productionStats.inProduction,
                icon: <FiClock size={16} />,
                color: colors.accent,
              },
              {
                title: "Fabric Ordered",
                value: productionStats.fabricOrdered,
                icon: <FiDatabase size={16} />,
                color: colors.info,
              },
              {
                title: "Not Delivered",
                value: productionStats.notDelivered,
                icon: <FiAlertCircle size={16} />,
                color: colors.warning,
              },
              {
                title: "Pending Units",
                value: productionStats.pendingUnits,
                icon: <FiAlertCircle size={16} />,
                color: colors.warning,
              },
              {
                title: "GS Sent",
                value: productionStats.gsSent,
                icon: <FiCheckCircle size={16} />,
                color: colors.success,
              }
            ].map((metric, index) => (
              <div key={index} className="nav-stat-item">
                <div className="nav-stat-icon" style={{ color: metric.color }}>
                  {metric.icon}
                </div>
                <div className="nav-stat-content">
                  <div className="nav-stat-value">{metric.value}</div>
                  <div className="nav-stat-title">{metric.title}</div>
                </div>
                {index < 10 && <div className="nav-stat-divider"></div>}
              </div>
            ))}
          </div>
          <div className="nav-right">
            <button 
              className="notification-button"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              <FiBell size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="notification-badge">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
            <div className="user-menu">
              <div className="user-avatar">A</div>
            </div>
          </div>
        </header>

        {/* Notification Dropdown */}
        {notifications.filter(n => !n.read).length > 0 && (
          <div className="notification-dropdown no-print">
            <div className="notification-header">
              <h3>Notifications</h3>
              <button 
                className="mark-all-read"
                onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
              >
                Mark all as read
              </button>
            </div>
            <div className="notification-list">
              {notifications.slice(0, 3).map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                >
                  <div className="notification-icon">
                    <FaCircle size={8} />
                  </div>
                  <div className="notification-content">
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{notification.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="notification-footer">
              <a href="/" onClick={(e) => e.preventDefault()}>View all notifications</a>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="content-wrapper no-print">
          {/* Form Buttons Row */}
          <div className="form-links-grid">
            {formLinks.map((form, index) => (
              <a
                key={index}
                href={form.url}
                target="_blank"
                rel="noopener noreferrer"
                className="form-link"
                style={{ backgroundColor: form.color }}
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

          {/* Tabs */}
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="search-filter-container">
            <div className="search-box">
              <FiSearch className="search-icon" size={16} />
              <input
                placeholder="Search Orders, Styles, Colors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
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
                }}
                className="secondary-button"
              >
                <FiFilter size={14} />
                Clear Filters
              </button>

              <button
                onClick={exportToExcel}
                className="primary-button"
              >
                <FiDownload size={14} />
                Export
              </button>

              <button
                onClick={() => window.print()}
                className="secondary-button"
              >
                <FiPrinter size={14} />
                Print
              </button>
            </div>
          </div>

          {/* Sales PO Tab */}
          {activeTab === "dashboard" && (
            <>
              <div className="filter-grid">
                {Object.keys(filters).filter(key => key !== "STYLE TYPE" && key !== "CUSTOMER NAME" && key !== "FIT SAMPLE").map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">
                      {key}
                    </label>
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                      className="filter-select"
                    >
                      <option value="">All {key}</option>
                      {[...new Set(data.sales_po.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                        <option key={i} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "IMAGE", icon: <FiImage size={14} /> },
                        { label: "FIT STATUS" },
                        { label: "H-NUMBER" },
                        { label: "CUSTOMER NAME", icon: <FiUsers size={14} /> },
                        { label: "PO NUMBER" },
                        { label: "STYLE NUMBER" },
                        { label: "DESCRIPTION" },
                        { label: "COLOUR" },
                        { label: "PRICE", icon: <FiDollarSign size={14} /> },
                        { label: "TOTAL UNITS" },
                        { label: "XFACT DD" },
                        { label: "REAL DD" },
                        { label: "LIVE STATUS" },
                        { label: "CMT PRICE", icon: <FiDollarSign size={14} /> },
                        { label: "ACTUAL CMT", icon: <FiDollarSign size={14} /> },
                        { label: "PACKING LIST", icon: <FiFileText size={14} /> },
                        { label: "SIZES" }
                      ].map((header, index) => (
                        <th key={index}>
                          <div className="header-content">
                            {header.icon && <span className="header-icon">{header.icon}</span>}
                            {header.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.length === 0 ? (
                      <tr className="empty-state">
                        <td colSpan="17">
                          <div className="empty-content">
                            <FiAlertCircle size={28} />
                            <div>No Matching Orders Found</div>
                            <p>Try Adjusting Your Search Or Filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((row, i) => (
                        <tr key={i}>
                          <td className="image-cell">
                            {row.IMAGE ? (
                              <div 
                                onMouseEnter={(e) => handleMouseEnter(row.IMAGE, e)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <a href={row.IMAGE} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={getGoogleDriveThumbnail(row.IMAGE)}
                                    alt="Product"
                                    className="product-image"
                                    loading="lazy"
                                  />
                                </a>
                              </div>
                            ) : (
                              <div className="no-image">
                                No Image
                              </div>
                            )}
                          </td>
                          <td>
                            <span className={`status-badge ${row["FIT STATUS"] === "GS SENT" ? 'success' : 'warning'}`}>
                              {row["FIT STATUS"]}
                            </span>
                          </td>
                          <td className="highlight-cell">{row["H-NUMBER"]}</td>
                          <td>{row["CUSTOMER NAME"]}</td>
                          <td>{row["PO NUMBER"]}</td>
                          <td>{row["STYLE NUMBER"]}</td>
                          <td>{row["DESCRIPTION"]}</td>
                          <td>
                            <div className="color-cell">
                              {row["COLOUR"] && (
                                <span 
                                  className="color-dot" 
                                  style={{
                                    backgroundColor: getColorCode(row["COLOUR"])
                                  }}
                                ></span>
                              )}
                              {row["COLOUR"]}
                            </div>
                          </td>
                          <td className="price-cell">{formatCurrency(row["PRICE"])}</td>
                          <td className="bold-cell">{row["TOTAL UNITS"]}</td>
                          <td className="nowrap">{formatDate(row["XFACT DD"])}</td>
                          <td className="nowrap">{formatDate(row["REAL DD"])}</td>
                          <td>
                            <span className={`status-badge ${
                              row["LIVE STATUS"] === "DELIVERED" ? 'success' : 
                              row["LIVE STATUS"] === "FABRIC ORDERED" ? 'info' : 'warning'
                            }`}>
                              {row["LIVE STATUS"]}
                            </span>
                          </td>
                          <td className="price-cell nowrap bold-cell">{formatCurrency(row["CMT PRICE"])}</td>
                          <td className="price-cell nowrap bold-cell">{formatCurrency(row["ACTUAL CMT"])}</td>
                          <td>
                            {row["PACKING LIST"] ? (
                              <a
                                href={getGoogleDriveViewLink(row["PACKING LIST"])}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="download-button"
                              >
                                Download
                              </a>
                            ) : (
                              <span className="na-text">N/A</span>
                            )}
                          </td>
                          <td className="sizes-cell">{compactSizes(row)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Fabric PO Tab */}
          {activeTab === "fabric" && (
            <React.Fragment>
              <div className="filter-grid">
                {Object.keys(fabricFilters).map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">
                      {key}
                    </label>
                    <select
                      value={fabricFilters[key]}
                      onChange={(e) => setFabricFilters({ ...fabricFilters, [key]: e.target.value })}
                      className="filter-select"
                    >
                      <option value="">All {key}</option>
                      {[...new Set(data.fabric_po.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                        <option key={i} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "NO." },
                        { label: "IMAGE", icon: <FiImage size={14} /> },
                        { label: "DATE" },
                        { label: "H-NUMBER" },
                        { label: "ORDER REF" },
                        { label: "TYPE" },
                        { label: "DESCRIPTION" },
                        { label: "COLOUR" },
                        { label: "TOTAL" },
                        { label: "FABRIC/TRIM PRICE", icon: <FiDollarSign size={14} /> },
                        { label: "FABRIC PO LINKS" }
                      ].map((header, index) => (
                        <th key={index}>
                          <div className="header-content">
                            {header.icon && <span className="header-icon">{header.icon}</span>}
                            {header.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFabric.length === 0 ? (
                      <tr className="empty-state">
                        <td colSpan="11">
                          <div className="empty-content">
                            <FiAlertCircle size={28} />
                            <div>No Matching Fabric Orders Found</div>
                            <p>Try Adjusting Your Search Or Filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredFabric.map((row, i) => (
                        <tr key={i}>
                          <td className="bold-cell">{row["NO."]}</td>
                          <td className="image-cell">
                            {getMatchingSalesImage(row["ORDER REF"]) ? (
                              <div 
                                onMouseEnter={(e) => handleMouseEnter(getMatchingSalesImage(row["ORDER REF"]), e)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <a href={getMatchingSalesImage(row["ORDER REF"])} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={getGoogleDriveThumbnail(getMatchingSalesImage(row["ORDER REF"]))}
                                    alt="Product"
                                    className="product-image"
                                    loading="lazy"
                                  />
                                </a>
                              </div>
                            ) : (
                              <div className="no-image">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="nowrap">{formatDate(row["DATE"])}</td>
                          <td className="highlight-cell">{row["H-NUMBER"]}</td>
                          <td>{row["ORDER REF"]}</td>
                          <td>
                            <span className="type-badge">
                              {row["TYPE"]}
                            </span>
                          </td>
                          <td>{row["DESCRIPTION"]}</td>
                          <td>
                            <div className="color-cell">
                              {row["COLOUR"] && (
                                <span 
                                  className="color-dot" 
                                  style={{
                                    backgroundColor: getColorCode(row["COLOUR"])
                                  }}
                                ></span>
                              )}
                              {row["COLOUR"]}
                            </div>
                          </td>
                          <td className="bold-cell">{row["TOTAL"]}</td>
                          <td className="price-cell nowrap bold-cell">{formatCurrency(row["FABRIC/TRIM PRICE"])}</td>
                          <td>
                            {row["FABRIC PO LINKS"] ? (
                              <a
                                href={getGoogleDriveViewLink(row["FABRIC PO LINKS"])}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-button"
                              >
                                View PO
                              </a>
                            ) : (
                              <span className="na-text">No Link</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </React.Fragment>
          )}

          {/* Developments Tab */}
          {activeTab === "developments" && (
            <React.Fragment>
              <div className="filter-grid">
                {["STYLE TYPE", "CUSTOMER NAME", "FIT SAMPLE"].map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">{key === "STYLE TYPE" ? "TYPE" : key}</label>
                    <select
                      value={filters[key]}
                      onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                      className="filter-select"
                    >
                      <option value="">All {key === "STYLE TYPE" ? "Types" : key}</option>
                      {[...new Set(data.insert_pattern.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
                        <option key={i} value={value}>{value}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="table-container">
                <table className="data-table developments-table">
                  <thead>
                    <tr>
                      {[
                        { label: "TIMESTAMP" },
                        { label: "H-NUMBER" },
                        { label: "CUSTOMER NAME" },
                        { label: "TYPE" },
                        { label: "CUSTOMER CODE" },
                        { label: "FRONT IMAGE", icon: <FiImage size={14} /> },
                        { label: "BACK IMAGE", icon: <FiImage size={14} /> },
                        { label: "SIDE IMAGE", icon: <FiImage size={14} /> },
                        { label: "PATTERN IMAGE", icon: <FiImage size={14} /> },
                        { label: "FIT SAMPLE" },
                        { label: "TOTAL COST", icon: <FiDollarSign size={14} /> },
                        { label: "CMT PRICE", icon: <FiDollarSign size={14} /> },
                        { label: "COSTING LINK", icon: <FiExternalLink size={14} /> }
                      ].map((header, index) => (
                        <th key={index}>
                          <div className="header-content">
                            {header.icon && <span className="header-icon">{header.icon}</span>}
                            {header.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevelopments.length === 0 ? (
                      <tr className="empty-state">
                        <td colSpan="13">
                          <div className="empty-content">
                            <FiAlertCircle size={28} />
                            <div>No Matching Patterns Found</div>
                            <p>Try Adjusting Your Search Or Filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredDevelopments.map((row, i) => (
                        <tr key={i}>
                          <td className="nowrap">{formatDate(row["Timestamp"])}</td>
                          <td className="highlight-cell">{row["H-NUMBER"]}</td>
                          <td>{row["CUSTOMER NAME"] || "N/A"}</td>
                          <td>{row["STYLE TYPE"]}</td>
                          <td>{row["CUSTOMER CODE"] || "N/A"}</td>
                          <td className="image-cell">
                            {row["FRONT IMAGE"] ? (
                              <div 
                                onMouseEnter={(e) => handleMouseEnter(row["FRONT IMAGE"], e)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <a href={row["FRONT IMAGE"]} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={getGoogleDriveThumbnail(row["FRONT IMAGE"])}
                                    alt="Front"
                                    className="product-image"
                                    loading="lazy"
                                  />
                                </a>
                              </div>
                            ) : (
                              <div className="no-image">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="image-cell">
                            {row["BACK IMAGE"] ? (
                              <div 
                                onMouseEnter={(e) => handleMouseEnter(row["BACK IMAGE"], e)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <a href={row["BACK IMAGE"]} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={getGoogleDriveThumbnail(row["BACK IMAGE"])}
                                    alt="Back"
                                    className="product-image"
                                    loading="lazy"
                                  />
                                </a>
                              </div>
                            ) : (
                              <div className="no-image">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="image-cell">
                            {row["SIDE IMAGE"] ? (
                              <div 
                                onMouseEnter={(e) => handleMouseEnter(row["SIDE IMAGE"], e)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <a href={row["SIDE IMAGE"]} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={getGoogleDriveThumbnail(row["SIDE IMAGE"])}
                                    alt="Side"
                                    className="product-image"
                                    loading="lazy"
                                  />
                                </a>
                              </div>
                            ) : (
                              <div className="no-image">
                                No Image
                              </div>
                            )}
                          </td>
                          <td className="image-cell">
                            {row["PATTERN IMAGE"] ? (
                              <div 
                                onMouseEnter={(e) => handleMouseEnter(row["PATTERN IMAGE"], e)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <a href={row["PATTERN IMAGE"]} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={getGoogleDriveThumbnail(row["PATTERN IMAGE"])}
                                    alt="Pattern"
                                    className="product-image"
                                    loading="lazy"
                                  />
                                </a>
                              </div>
                            ) : (
                              <div className="no-image">
                                No Image
                              </div>
                            )}
                          </td>
                          <td>{row["FIT SAMPLE"] || "N/A"}</td>
                          <td className="price-cell nowrap bold-cell">{formatCurrency(row["TOTAL GARMENT PRICE"])}</td>
                          <td className="price-cell nowrap bold-cell">{formatCurrency(row["CMT PRICE"])}</td>
                          <td>
                            {row["COSTING LINK"] ? (
                              <a
                                href={getGoogleDriveViewLink(row["COSTING LINK"])}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-button"
                              >
                                View
                              </a>
                            ) : (
                              <span className="na-text">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </React.Fragment>
          )}

          {/* Production Sheets Tab */}
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
                  />
                </div>
                <div className="po-buttons" style={{display: 'flex', gap: '0.75rem'}}>
                  <button
                    onClick={() => {
                      const pos = poInput.split(/[\n, ]+/).map(p => p.trim()).filter(Boolean);
                      setSelectedPOs(pos);
                    }}
                    className="primary-button"
                  >
                    Generate Sheets
                  </button>
                  <button onClick={() => window.print()} className="primary-button">
                    <FiPrinter size={14} /> Print Sheets
                  </button>
                </div>
              </div>

              {selectedPOs.length > 0 && (
                <div className="sheets-container" style={{marginTop: '20px'}}>
                  <DocketSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
                  <CuttingSheet selectedData={data.sales_po.filter(row => selectedPOs.includes(row["PO NUMBER"]))} />
                </div>
              )}
            </div>
          )}

        </div>

        {/* Image Preview */}
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

        {/* Footer */}
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

function getColorCode(color) {
  if (!color) return "#7C3AED";
  const colorLower = color.toLowerCase();
  if (colorLower.includes("red")) return "#EF4444";
  if (colorLower.includes("blue")) return "#3B82F6";
  if (colorLower.includes("green")) return "#22C55E";
  if (colorLower.includes("black")) return "#111827";
  if (colorLower.includes("white")) return "#E5E7EB";
  if (colorLower.includes("pink")) return "#EC4899";
  if (colorLower.includes("yellow")) return "#F59E0B";
  if (colorLower.includes("purple")) return "#7C3AED";
  if (colorLower.includes("gray") || colorLower.includes("grey")) return "#6B7280";
  if (colorLower.includes("navy")) return "#1E40AF";
  if (colorLower.includes("teal")) return "#0D9488";
  if (colorLower.includes("orange")) return "#F97316";
  return "#7C3AED";
};

function DocketSheet({ selectedData }) {
  const totalUnits = selectedData.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
  const maxPOs = 6;
  const numPOs = Math.min(selectedData.length, maxPOs);
  const paddedData = [...selectedData.slice(0, numPOs), ...Array(maxPOs - numPOs).fill({})]; // Pad with empty objects for consistency

  return (
    <div className="printable-sheet docket-sheet">
      <div style={{fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', color: '#28a745', backgroundColor: '#e0f7fa', padding: '2mm', borderRadius: '4px', marginBottom: '3mm'}}>DOCKET SHEET</div>
      <table className="table" style={{border: '1px solid #000'}}>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td>{row["H-NUMBER"] || ""}</td>
              <td colSpan={7}>{row["DESCRIPTION"] || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="delivery-info">
        Delivery Date: {formatDate(selectedData[0]?.["XFACT DD"] || "")}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2mm', marginBottom: '3mm', border: '1px solid #000', padding: '1mm', overflow: 'hidden'}}>
        {paddedData.map((row, i) => (
          <div key={i} style={{overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30mm', border: '1px dashed #000'}}>
            {row.IMAGE ? <img src={getGoogleDriveThumbnail(row.IMAGE)} alt={row["DESCRIPTION"] || ""} style={{width: '100%', height: '100%', objectFit: 'contain'}} loading="lazy" /> : 'No Image'}
          </div>
        ))}
      </div>

      <table className="table" style={{border: '1px solid #000'}}>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Style #</th>
            <th style={{width: '20%'}}>Colour</th>
            <th>Department</th>
            <th>Units</th>
            <th>H Number</th>
            <th>Type</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="main-data">{row["PO NUMBER"] || ""}</td>
              <td>{row["STYLE NUMBER"] || ""}</td>
              <td className="main-data">{row["COLOUR"] || ""}</td>
              <td>{row["DEPARTMENT"] || "-"}</td>
              <td>{row["TOTAL UNITS"] || ""}</td>
              <td>{row["H-NUMBER"] || ""}</td>
              <td>{row["TYPE"] || ""}</td>
              {i === 0 && (
                <td rowSpan={maxPOs} className="merged-total" style={{backgroundColor: '#ffff00', textAlign: 'center'}}>
                  {totalUnits}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="table" style={{border: '1px solid #000'}}>
        <colgroup>
          <col style={{width: '10%'}} />
          {paddedData.map((_, i) => (
            <col key={i} style={{width: `${90 / maxPOs}%`}} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>SIZES</th>
            {paddedData.map((row, i) => (
              <th key={i}>{row["TYPE"] || ""} {row["PO NUMBER"] || ""}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {["4", "6", "8", "10", "12", "14", "16", "18"].map(size => (
            <tr key={size}>
              <td>UK {size}</td>
              {paddedData.map((row, j) => (
                <td key={j}>{row[size] || ""}</td>
              ))}
            </tr>
          ))}
          <tr className="total-row">
            <td>TOTAL : -</td>
            {paddedData.map((row, i) => (
              <td key={i}>{row["TOTAL UNITS"] || ""}</td>
            ))}
          </tr>
        </tbody>
      </table>

      <table className="notes-section">
        <tbody>
          <tr>
            <td>NOTES : -</td>
          </tr>
          {Array.from({length: 3}).map((_, i) => (
            <tr key={i}>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function CuttingSheet({ selectedData }) {
  const totalUnits = selectedData.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
  const maxPOs = 6;
  const numPOs = Math.min(selectedData.length, maxPOs);
  const paddedData = [...selectedData.slice(0, numPOs), ...Array(maxPOs - numPOs).fill({})];
  const sizes = ["4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26"];
  const totalBySize = sizes.reduce((acc, size) => {
    acc[size] = selectedData.reduce((sum, row) => sum + parseInt(row[size] || 0), 0);
    return acc;
  }, {});

  return (
    <div className="printable-sheet cutting-sheet">
      <div style={{fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', color: '#dc3545', backgroundColor: '#ffebee', padding: '2mm', borderRadius: '4px', marginBottom: '3mm'}}>CUTTING SHEET</div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2mm', marginBottom: '3mm', border: '1px solid #000', padding: '1mm', overflow: 'hidden'}}>
        {paddedData.map((row, i) => (
          <div key={i} style={{overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '30mm', border: '1px dashed #000'}}>
            {row.IMAGE ? <img src={getGoogleDriveThumbnail(row.IMAGE)} alt={row["DESCRIPTION"] || ""} style={{width: '100%', height: '100%', objectFit: 'contain'}} loading="lazy" /> : 'No Image'}
          </div>
        ))}
      </div>

      <table className="table" style={{border: '1px solid #000'}}>
        <tbody>
          <tr>
            <th>Fabric Name 1:</th>
            <th>Fabric Name 2:</th>
            <th>Fabric Name 3:</th>
            <th style={{color: 'red'}}>Binding details</th>
          </tr>
          <tr>
            <td style={{height: '20mm'}}></td>
            <td style={{height: '20mm'}}></td>
            <td style={{height: '20mm'}}></td>
            <td style={{height: '20mm'}}></td>
          </tr>
          <tr>
            <td>Width:</td>
            <td>Width:</td>
            <td>Width:</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <table className="table" style={{border: '1px solid #000'}}>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Style #</th>
            <th style={{width: '20%'}}>Colour</th>
            <th>Department</th>
            <th>Units</th>
            <th>H Number</th>
            <th>Type</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="main-data">{row["PO NUMBER"] || ""}</td>
              <td>{row["STYLE NUMBER"] || ""}</td>
              <td className="main-data">{row["COLOUR"] || ""}</td>
              <td>{row["DEPARTMENT"] || "-"}</td>
              <td>{row["TOTAL UNITS"] || ""}</td>
              <td>{row["H-NUMBER"] || ""}</td>
              <td>{row["TYPE"] || ""}</td>
              {i === 0 && (
                <td rowSpan={maxPOs} className="merged-total" style={{backgroundColor: '#ffff00', textAlign: 'center'}}>
                  {totalUnits}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="table sizes-table" style={{border: '1px solid #000'}}>
        <colgroup>
          <col style={{width: '10%'}} />
          <col style={{width: '15%'}} />
          {sizes.map((_, i) => (
            <col key={i} style={{width: '5%'}} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th>PO Number</th>
            <th>Colour</th>
            {sizes.map(size => <th key={size}>{size}</th>)}
          </tr>
        </thead>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="main-data">{row["PO NUMBER"] || ""}</td>
              <td className="main-data">{row["COLOUR"] || ""}</td>
              {sizes.map(size => (
                <td key={size}>{row[size] || ""}</td>
              ))}
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={2}>Total:</td>
            {sizes.map(size => (
              <td key={size}>{totalBySize[size]}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <table className="ratio-section">
        <tbody>
          <tr>
            <td>RATIO:.</td>
          </tr>
          {Array.from({length: 3}).map((_, i) => (
            <tr key={i}>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default App;