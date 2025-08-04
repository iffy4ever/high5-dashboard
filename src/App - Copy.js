import React, { useEffect, useState, useMemo, useCallback } from "react";
import * as XLSX from 'xlsx';
import {
  FiTruck, FiCalendar, FiClock, FiAlertCircle, 
  FiDatabase, FiDownload, FiFilter, FiSearch, FiExternalLink,
  FiImage, FiFileText, FiDollarSign, FiUsers, FiCheckCircle,
  FiLayers, FiShoppingBag, FiPrinter, FiBarChart2
} from 'react-icons/fi';
import { FaCircle } from 'react-icons/fa';

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
  // State declarations
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

  // Modern Color Scheme with dark mode support
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
    textDark: "#F3F4F6",
    textMedium: "#9CA3AF",
    textLight: "#1F2937",
    background: "#111827",
    cardBg: "#1F2937",
    border: "#374151",
    rowEven: "#1F2937",
    rowOdd: "#111827",
    headerBg: "#1F2937",
    headerText: "#F3F4F6",
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
    textDark: "#1F2937",
    textMedium: "#6B7280",
    textLight: "#F9FAFB",
    background: "#F9FAFB",
    cardBg: "#FFFFFF",
    border: "#E5E7EB",
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "#FFFFFF",
    headerText: "#1F2937",
    activeTab: "#6366F1",
    inactiveTab: "#9CA3AF",
    actionButton: "#10B981",
    statCardBg: "#FFFFFF",
    statCardBorder: "#E5E7EB",
  };

  // Form links with icons
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

  // Calculate production statistics
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
                {darkMode ? '☀️' : '🌙'}
              </span>
            </button>
          </div>
          <div className="nav-right">
            <button 
              className="stats-toggle"
              onClick={() => setShowStats(!showStats)}
              style={{ color: colors.primary }}
            >
              <FiBarChart2 size={18} />
            </button>
            <button 
              className="notification-button"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              <FiShoppingBag size={18} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="notification-badge">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Stats Panel */}
        {showStats && (
          <div className="stats-panel no-print">
            <div className="stats-grid">
              {[
                {
                  title: "Total Orders",
                  value: productionStats.totalOrders,
                  icon: <FiShoppingBag size={16} />,
                  color: colors.primary,
                },
                {
                  title: "Total Units",
                  value: productionStats.totalUnits,
                  icon: <FiShoppingBag size={16} />,
                  color: colors.primary,
                },
                {
                  title: "Orders (Last 30d)",
                  value: productionStats.deliveredLast30Days,
                  icon: <FiTruck size={16} />,
                  color: colors.success,
                },
                {
                  title: "Units (Last 30d)",
                  value: productionStats.deliveredUnitsLast30Days,
                  icon: <FiShoppingBag size={16} />,
                  color: colors.success,
                },
                {
                  title: productionStats.lastQuarterLabel,
                  value: productionStats.unitsDeliveredLastQuarter,
                  icon: <FiTruck size={16} />,
                  color: colors.success,
                },
                {
                  title: "In Prod.",
                  value: productionStats.inProduction,
                  icon: <FiClock size={16} />,
                  color: colors.accent,
                },
                {
                  title: "Fabric Ord.",
                  value: productionStats.fabricOrdered,
                  icon: <FiDatabase size={16} />,
                  color: colors.info,
                },
                {
                  title: "Pend. Units",
                  value: productionStats.pendingUnits,
                  icon: <FiAlertCircle size={16} />,
                  color: colors.warning,
                },
                {
                  title: "Gold Seal Sent",
                  value: productionStats.goldSealSent,
                  icon: <FiCheckCircle size={16} />,
                  color: colors.success,
                },
                {
                  title: "Last Delivery",
                  value: productionStats.lastDeliveryDateFormatted,
                  icon: <FiCalendar size={16} />,
                  color: colors.secondary,
                },
                {
                  title: productionStats.lastYearOrdersLabel,
                  value: productionStats.ordersLastYear,
                  icon: <FiBarChart2 size={16} />,
                  color: colors.secondary,
                },
                {
                  title: productionStats.lastYearLabel,
                  value: productionStats.unitsDeliveredLastYear,
                  icon: <FiTruck size={16} />,
                  color: colors.success,
                },
                {
                  title: productionStats.currentYearLabel,
                  value: productionStats.unitsDeliveredCurrentYear,
                  icon: <FiTruck size={16} />,
                  color: colors.success,
                },
              ].map((metric, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: `${metric.color}20`, color: metric.color }}>
                    {metric.icon}
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{metric.value}</div>
                    <div className="stat-title">{metric.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                                href={getGoogleDriveDownloadLink(row["PACKING LIST"])}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-button"
                              >
                                View PL
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
            <>
              <div className="filter-grid">
                {Object.keys(fabricFilters).map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">
                      {key}
                    </label>
                    <select
                      value={fabricFilters[key] || ""}
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
                                href={row["FABRIC PO LINKS"]}
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
            </>
          )}

          {/* Developments Tab */}
          {activeTab === "developments" && (
            <>
              <div className="filter-grid">
                {["STYLE TYPE", "CUSTOMER NAME", "FIT SAMPLE"].map((key) => (
                  <div key={key} className="filter-item">
                    <label className="filter-label">{key === "STYLE TYPE" ? "TYPE" : key}</label>
                    <select
                      value={filters[key] || ""}
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
                                href={row["COSTING LINK"]}
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
            </>
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

      {/* Global styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Roboto', sans-serif;
          font-weight: 300;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          line-height: 1.6;
        }
        
        input, select, button {
          font-family: inherit;
          font-size: inherit;
        }
        
        a {
          text-decoration: none;
          color: inherit;
        }
        
        button {
          cursor: pointer;
          background: none;
          border: none;
        }
        
        /* Scrollbar styles */
        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkMode ? '#2D3748' : '#F3F4F6'};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#6B7280' : '#D1D5DB'};
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#9CA3AF' : '#9CA3AF'};
        }
        
        /* Modern focus styles */
        *:focus-visible {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }
        
        /* Smooth transitions */
        a, button, input, select {
          transition: all 0.2s ease;
        }

        /* Animation */
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .spin {
          animation: spin 1.5s linear infinite;
        }
      `}</style>

      {/* Component styles */}
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          background-color: ${colors.background};
          color: ${colors.textDark};
          display: flex;
          flex-direction: column;
          width: 100%;
          margin: 0;
          padding: 0;
        }

        .app-container.light {
          --shadow-color: rgba(0, 0, 0, 0.1);
          --hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .app-container.dark {
          --shadow-color: rgba(0, 0, 0, 0.3);
          --hover-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }

        /* Loading Screen */
        .loading-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: ${colors.background};
        }

        .loading-content {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
          animation: fadeIn 0.3s ease-out;
        }

        .spinner {
          margin-bottom: 1rem;
          color: ${colors.primary};
        }

        .loading-content h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          color: ${colors.textDark};
        }

        .loading-content p {
          color: ${colors.textMedium};
          font-size: 0.875rem;
        }

        /* Error Screen */
        .error-screen {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: ${colors.background};
        }

        .error-content {
          text-align: center;
          max-width: 400px;
          padding: 2rem;
          animation: fadeIn 0.3s ease-out;
        }

        .error-icon {
          color: ${colors.danger};
          margin-bottom: 1rem;
        }

        .error-content h2 {
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          color: ${colors.textDark};
        }

        .error-content p {
          color: ${colors.textMedium};
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .retry-button {
          background-color: ${colors.primary};
          color: ${colors.textLight};
          padding: 0.5rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .retry-button:hover {
          background-color: ${colors.primaryDark};
          transform: translateY(-1px);
        }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        /* Top Navigation */
        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background: ${colors.headerBg};
          color: ${colors.headerText};
          box-shadow: 0 2px 8px var(--shadow-color);
          position: sticky;
          top: 0;
          z-index: 100;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .top-nav h1 {
          font-size: 1.25rem;
          font-weight: 700;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: ${colors.headerText};
          font-size: 0.875rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
        }

        .theme-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .toggle-icon {
          font-size: 1rem;
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stats-toggle {
          color: ${colors.textMedium};
          transition: all 0.2s;
          padding: 0.5rem;
          border-radius: 0.5rem;
        }

        .stats-toggle:hover {
          color: ${colors.primary};
          background: ${colors.primary}10;
        }

        /* Stats Panel */
        .stats-panel {
          background: ${colors.cardBg};
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px var(--shadow-color);
          margin: 1rem;
          padding: 0.5rem;
          border: 1px solid ${colors.border};
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.5rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 0.5rem;
          background: ${colors.cardBg};
          transition: all 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--hover-shadow);
        }

        .stat-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: ${colors.textDark};
        }

        .stat-title {
          font-size: 0.65rem;
          color: ${colors.textMedium};
        }

        /* Notification Dropdown */
        .notification-dropdown {
          position: absolute;
          top: 60px;
          right: 2rem;
          width: 280px;
          background-color: ${colors.cardBg};
          border-radius: 0.75rem;
          box-shadow: 0 8px 20px var(--shadow-color);
          z-index: 110;
          overflow: hidden;
          animation: fadeIn 0.2s ease-out;
          border: 1px solid ${colors.border};
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          border-bottom: 1px solid ${colors.border};
        }

        .notification-header h3 {
          font-size: 0.875rem;
          font-weight: 600;
          color: ${colors.textDark};
        }

        .mark-all-read {
          font-size: 0.75rem;
          color: ${colors.primary};
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .mark-all-read:hover {
          color: ${colors.primaryDark};
        }

        .notification-list {
          max-height: 240px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          padding: 0.75rem;
          gap: 0.5rem;
          transition: all 0.2s;
        }

        .notification-item.unread {
          background-color: ${colors.primary}05;
        }

        .notification-item:hover {
          background-color: ${colors.primary}10;
        }

        .notification-icon {
          display: flex;
          align-items: flex-start;
          padding-top: 0.25rem;
        }

        .notification-icon svg {
          color: ${colors.primary};
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          font-size: 0.8125rem;
          color: ${colors.textDark};
          margin-bottom: 0.25rem;
        }

        .notification-time {
          font-size: 0.75rem;
          color: ${colors.textMedium};
        }

        .notification-footer {
          padding: 0.5rem 0.75rem;
          text-align: center;
          border-top: 1px solid ${colors.border};
        }

        .notification-footer a {
          font-size: 0.75rem;
          color: ${colors.primary};
          transition: all 0.2s;
        }

        .notification-footer a:hover {
          color: ${colors.primaryDark};
        }

        /* Content Wrapper */
        .content-wrapper {
          flex: 1;
          padding: 1.5rem;
          width: 100%;
          margin: 0;
          background: ${colors.cardBg};
          border-radius: 1rem;
          box-shadow: 0 4px 16px var(--shadow-color);
          margin-top: 1rem;
          transition: all 0.3s ease;
        }

        /* Form Links Grid */
        .form-links-grid {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .form-link {
          flex: 1;
          min-width: 200px;
          max-width: 300px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px var(--shadow-color);
        }

        .form-link:hover {
          transform: translateY(-2px);
          box-shadow: var(--hover-shadow);
        }

        .form-icon {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background-color: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
        }

        .form-content {
          flex: 1;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .form-subtext {
          font-size: 0.75rem;
          opacity: 0.9;
        }

        /* Tab Container */
        .tab-container {
          margin-bottom: 1.5rem;
          border-bottom: 2px solid ${colors.border};
        }

        .tabs {
          display: flex;
          gap: 0.5rem;
        }

        .tab-button {
          padding: 0.75rem 1.25rem;
          background-color: transparent;
          color: ${colors.inactiveTab};
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
          border-radius: 0.5rem 0.5rem 0 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tab-button:hover {
          color: ${colors.primary};
          background: ${colors.primary}05;
        }

        .tab-button.active {
          color: ${colors.activeTab};
          background: ${colors.activeTab}10;
          border-bottom: 2px solid ${colors.activeTab};
        }

        /* Search and Filter Container */
        .search-filter-container {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .search-box {
          flex: 1;
          position: relative;
          min-width: 280px;
          max-width: 500px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: ${colors.textMedium};
        }

        .search-input {
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          width: 100%;
          border: 1px solid ${colors.border};
          border-radius: 0.75rem;
          font-size: 0.875rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          background: ${colors.cardBg};
          color: ${colors.textDark};
        }

        .search-input:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primary}20;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .primary-button {
          background-color: ${colors.actionButton};
          color: ${colors.textLight};
          padding: 0.5rem 1.25rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 6px ${colors.actionButton}30;
        }

        .primary-button:hover {
          background-color: ${colors.success};
          transform: translateY(-1px);
        }

        .secondary-button {
          background-color: ${colors.cardBg};
          color: ${colors.textMedium};
          padding: 0.5rem 1.25rem;
          border: 1px solid ${colors.border};
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .secondary-button:hover {
          background-color: ${colors.primary}05;
          color: ${colors.primary};
          border-color: ${colors.primary};
        }

        /* PO Input Container */
        .po-input-container {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
        }

        .po-buttons {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        /* Filter Grid */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding: 1rem;
          border-radius: 0.75rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          border: 1px solid ${colors.border};
        }

        .filter-item {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: ${colors.textDark};
          font-size: 0.8125rem;
        }

        .filter-select {
          padding: 0.5rem 2rem 0.5rem 0.75rem;
          border: 1px solid ${colors.border};
          border-radius: 0.5rem;
          background-color: ${colors.cardBg};
          font-size: 0.875rem;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.textMedium)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.5rem center;
          background-size: 0.875rem;
          color: ${colors.textDark};
        }

        .filter-select:hover {
          border-color: ${colors.primary};
        }

        .filter-select:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primary}20;
        }

        /* Table Container */
        .table-container {
          overflow-x: auto;
          border-radius: 0.75rem;
          box-shadow: 0 4px 12px var(--shadow-color);
          background: ${colors.cardBg};
          border: 1px solid ${colors.border};
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          border-spacing: 0;
          font-size: 0.875rem;
          min-width: 1000px;
        }

        .developments-table {
          table-layout: fixed;
        }

        .data-table thead tr {
          background: ${colors.primaryLight};
          color: #ffffff;
          position: sticky;
          top: 0;
        }

        .data-table th {
          padding: 0 0.5rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.8125rem;
          border-bottom: 2px solid ${colors.primary};
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .data-table tbody tr {
          background-color: ${colors.rowEven};
          transition: all 0.2s;
        }

        .data-table tbody tr:nth-child(odd) {
          background-color: ${colors.rowOdd};
        }

        .data-table tbody tr:hover {
          background-color: ${darkMode ? '#2D3748' : '#F0F7FF'};
          transform: translateY(-1px);
        }

        .data-table td {
          padding: 0.1rem 0.3rem;
          vertical-align: middle;
          line-height: 1.1;
          height: 1.5rem;
        }

        /* Special cell styles */
        .image-cell {
          padding: 0 !important;
        }

        .product-image {
          width: 100%;
          height: auto;
          max-height: 120px;
          object-fit: contain;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .product-image:hover {
          transform: scale(1.05);
        }

        .no-image {
          width: 100%;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-style: italic;
          color: ${colors.textMedium};
          background-color: ${darkMode ? '#374151' : '#F3F4F6'};
          border-radius: 0.5rem;
          font-size: 0.75rem;
        }

        .highlight-cell {
          font-weight: 600;
          color: ${colors.primary};
        }

        .bold-cell {
          font-weight: 600;
        }

        .nowrap {
          white-space: nowrap;
        }

        .color-cell {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .color-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.75rem;
          display: inline-block;
        }

        .status-badge.success {
          background: ${colors.success}15;
          color: ${colors.success};
        }

        .status-badge.warning {
          background: ${colors.warning}15;
          color: ${colors.warning};
        }

        .status-badge.info {
          background: ${colors.info}15;
          color: ${colors.info};
        }

        .type-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          background: ${colors.primary}15;
          color: ${colors.primary};
          font-weight: 600;
          font-size: 0.75rem;
        }

        .download-button, .view-button {
          background-color: ${colors.secondary};
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.75rem;
          transition: all 0.2s;
        }

        .download-button:hover, .view-button:hover {
          background-color: ${colors.secondaryDark};
          transform: translateY(-1px);
        }

        .na-text {
          font-style: italic;
          color: ${colors.textMedium};
        }

        .sizes-cell {
          font-size: 0.75rem;
          color: ${colors.textMedium};
        }

        .price-cell {
          color: ${colors.success};
          font-weight: 600;
        }

        /* Empty state */
        .empty-state td {
          padding: 2rem;
          text-align: center;
          color: ${colors.textMedium};
          font-style: italic;
          background-color: ${colors.cardBg};
        }

        .empty-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .empty-content svg {
          opacity: 0.5;
          margin-bottom: 0.5rem;
        }

        .empty-content div {
          font-size: 1rem;
          font-weight: 600;
          color: ${colors.textDark};
        }

        .empty-content p {
          font-size: 0.875rem;
          color: ${colors.textMedium};
        }

        /* Image preview */
        .image-preview {
          position: fixed;
          z-index: 1000;
          width: 300px;
          background-color: ${colors.cardBg};
          padding: 0.75rem;
          border-radius: 0.75rem;
          box-shadow: 0 8px 20px var(--shadow-color);
          transform: translateX(-50%);
          border: 1px solid ${colors.border};
        }

        .image-preview.below {
          top: 0;
        }

        .image-preview.above {
          bottom: 0;
          transform: translateX(-50%) translateY(-100%);
        }

        .preview-image {
          width: 100%;
          height: auto;
          max-height: 360px;
          object-fit: contain;
          border-radius: 0.5rem;
        }

        .preview-arrow {
          position: absolute;
          width: 1rem;
          height: 1rem;
          background-color: ${colors.cardBg};
          transform: rotate(45deg);
          border-right: 1px solid ${colors.border};
          z-index: -1;
        }

        .image-preview.below .preview-arrow {
          top: -0.5rem;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-bottom: 1px solid ${colors.border};
        }

        .image-preview.above .preview-arrow {
          bottom: -0.5rem;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-top: 1px solid ${colors.border};
        }

        /* Footer */
        .app-footer {
          background: ${colors.cardBg};
          color: ${colors.textMedium};
          padding: 1rem 1.5rem;
          border-top: 1px solid ${colors.border};
          margin-top: auto;
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          width: 100%;
          margin: 0;
        }

        /* Sheets Container */
        .sheets-container {
          display: flex;
          gap: 1rem;
          margin-top: 20px;
        }

        /* Printable Sheets */
        .printable-sheet {
          width: 210mm;
          max-height: 297mm;
          margin: 0;
          padding: 5mm;
          box-sizing: border-box;
          font-size: 8pt;
          page-break-after: always;
          page-break-inside: avoid;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }

        .printable-sheet table {
          margin-bottom: 3mm;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          border-width: 0.5pt;
        }

        .table th, .table td {
          border: 0.5pt solid #000;
          padding: 1mm;
          vertical-align: top;
          text-align: left;
          font-size: 8pt;
          font-weight: normal;
        }

        .table th {
          background-color: #f0f0f0;
        }

        .merged-total {
          background-color: #ffff00;
          text-align: center;
          vertical-align: middle;
          font-size: 48pt;
          font-weight: bold;
          line-height: 1;
        }

        .notes-section, .ratio-section {
          border: none;
          width: 100%;
        }

        .notes-section td, .ratio-section td {
          border: none;
          height: 5mm;
        }

        .image-cell {
          height: 70mm;
        }

        .image-cell img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .sizes-table td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 7pt;
        }

        .main-data {
          font-weight: normal;
          color: #000000;
        }

        .delivery-info {
          margin: 2mm 0;
          font-size: 16pt;
          color: #FF0000;
        }

        .total-row {
          color: #000000;
          font-size: 12pt;
          font-weight: normal;
        }

        .red-text {
          color: #FF0000;
        }

        /* Hide non-printable elements during print */
        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          body * {
            visibility: hidden;
          }

          .sheets-container, .sheets-container * {
            visibility: visible;
          }

          .sheets-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block;
          }

          .printable-sheet {
            margin: 0;
            border: initial;
            border-radius: initial;
            width: initial;
            min-height: initial;
            box-shadow: initial;
            background: initial;
            page-break-after: always;
          }

          .printable-sheet:last-child {
            page-break-after: avoid;
          }

          @page {
            size: A4 portrait;
            margin: 0;
          }
          .table, .table th, .table td {
            border-width: 0.5pt !important;
          }
        }

        /* Mobile Header Stats */
        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }
        }
      `}</style>
    </div>
  );
}

const getColorCode = (color) => {
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

const DocketSheet = ({ selectedData }) => {
  const totalUnits = selectedData.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
  const maxPOs = 6;
  const numPOs = Math.min(selectedData.length, maxPOs);
  const paddedData = selectedData.slice(0, numPOs);
  return (
    <div className="printable-sheet" style={{backgroundColor: '#ffffff'}}>
      <div style={{fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', color: '#28a745', backgroundColor: '#e0f7fa', padding: '2mm', borderRadius: '4px', marginBottom: '3mm'}}>DOCKET SHEET</div>
      <table className="table" style={{border: '1px solid #000'}}>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="red-text">{row["H-NUMBER"] || ""}</td>
              <td colSpan={7}>{row["DESCRIPTION"] || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="delivery-info" style={{color: '#FF0000'}}>
        Delivery Date: {formatDate(selectedData[0]?.["XFACT DD"] || "")}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2mm', marginBottom: '3mm', overflow: 'hidden', border: '1px solid #000'}}>
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} style={{overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40mm'}}>
            {i < numPOs && paddedData[i].IMAGE ? <img src={getGoogleDriveThumbnail(paddedData[i].IMAGE)} alt={paddedData[i]["DESCRIPTION"]} style={{width: '100%', height: '100%', objectFit: 'contain'}} /> : 'No Image'}
          </div>
        ))}
      </div>

      <table className="table" style={{border: '1px solid #000'}}>
        <thead>
          <tr>
            <th style={{width: '15%'}}>PO Number</th>
            <th style={{width: '25%'}}>Style #</th>
            <th style={{width: '20%'}}>Colour</th>
            <th style={{width: '10%'}}>Department</th>
            <th style={{width: '10%'}}>Units</th>
            <th style={{width: '10%'}}>H Number</th>
            <th style={{width: '10%'}}>Type</th>
            <th style={{width: '10%'}}>Total</th>
          </tr>
        </thead>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="main-data red-text">{row["PO NUMBER"] || ""}</td>
              <td>{row["STYLE NUMBER"] || ""}</td>
              <td className="main-data">{row["COLOUR"] || ""}</td>
              <td>{row["DEPARTMENT"] || "-"}</td>
              <td>{row["TOTAL UNITS"] || ""}</td>
              <td className="red-text">{row["H-NUMBER"] || ""}</td>
              <td>{row["TYPE"] || ""}</td>
              {i === 0 && (
                <td rowSpan={numPOs} className="merged-total" style={{backgroundColor: '#ffff00', textAlign: 'center', verticalAlign: 'middle'}}>
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
            <col key={i} style={{width: `${90 / numPOs}%`}} />
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
          <tr className="total-row" style={{color: '#000000'}}>
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
          {Array.from({length: 1}).map((_, i) => (
            <tr key={i}>
              <td></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CuttingSheet = ({ selectedData }) => {
  const totalUnits = selectedData.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
  const maxPOs = 6;
  const numPOs = Math.min(selectedData.length, maxPOs);
  const paddedData = selectedData.slice(0, numPOs);
  const sizes = ["4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26"];
  const totalBySize = sizes.reduce((acc, size) => {
    acc[size] = selectedData.reduce((sum, row) => sum + parseInt(row[size] || 0), 0);
    return acc;
  }, {});

  return (
    <div className="printable-sheet" style={{backgroundColor: '#ffffff'}}>
      <div style={{fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', color: '#dc3545', backgroundColor: '#ffebee', padding: '2mm', borderRadius: '4px', marginBottom: '3mm'}}>CUTTING SHEET</div>

      <div className="delivery-info" style={{color: '#FF0000'}}>
        Delivery Date: {formatDate(selectedData[0]?.["XFACT DD"] || "")}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2mm', marginBottom: '3mm', overflow: 'hidden', border: '1px solid #000'}}>
        {Array.from({length: 6}).map((_, i) => (
          <div key={i} style={{overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40mm'}}>
            {i < numPOs && paddedData[i].IMAGE ? <img src={getGoogleDriveThumbnail(paddedData[i].IMAGE)} alt={paddedData[i]["DESCRIPTION"]} style={{width: '100%', height: '100%', objectFit: 'contain'}} /> : 'No Image'}
          </div>
        ))}
      </div>

      <table className="table" style={{border: '1px solid #000'}}>
        <tbody>
          <tr>
            <th>Fabric Name 1:</th>
            <th>Fabric Name 2:</th>
            <th>Fabric Name 3:</th>
            <th style={{color: '#000000'}}>Binding details</th>
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
            <th style={{width: '15%'}}>PO Number</th>
            <th style={{width: '25%'}}>Style #</th>
            <th style={{width: '20%'}}>Colour</th>
            <th style={{width: '10%'}}>Department</th>
            <th style={{width: '10%'}}>Units</th>
            <th style={{width: '10%'}}>H Number</th>
            <th style={{width: '10%'}}>Type</th>
            <th style={{width: '10%'}}>Total</th>
          </tr>
        </thead>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="main-data red-text">{row["PO NUMBER"] || ""}</td>
              <td>{row["STYLE NUMBER"] || ""}</td>
              <td className="main-data">{row["COLOUR"] || ""}</td>
              <td>{row["DEPARTMENT"] || "-"}</td>
              <td>{row["TOTAL UNITS"] || ""}</td>
              <td className="red-text">{row["H-NUMBER"] || ""}</td>
              <td>{row["TYPE"] || ""}</td>
              {i === 0 && (
                <td rowSpan={numPOs} className="merged-total" style={{backgroundColor: '#ffff00', textAlign: 'center', verticalAlign: 'middle'}}>
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
              <td className="main-data red-text">{row["PO NUMBER"] || ""}</td>
              <td className="main-data">{row["COLOUR"] || ""}</td>
              {sizes.map(size => (
                <td key={size}>{row[size] || ""}</td>
              ))}
            </tr>
          ))}
          <tr className="total-row" style={{color: '#000000'}}>
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
          {Array.from({length: 1}).map((_, i) => (
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