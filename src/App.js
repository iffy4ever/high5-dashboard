import React, { useEffect, useState, useMemo, useCallback } from "react";
import * as XLSX from 'xlsx';
import { 
  FiHome, FiPackage, FiTruck, FiCalendar, FiClock, FiAlertCircle, 
  FiDatabase, FiDownload, FiFilter, FiX, FiSearch, FiExternalLink,
  FiImage, FiFileText, FiDollarSign, FiTag, FiUsers, FiCheckCircle,
  FiTrendingUp, FiLayers, FiShoppingBag, FiGrid, FiPrinter, FiRefreshCw,
  FiBarChart2, FiPieChart, FiSettings, FiBell, FiUser, FiLogOut
} from 'react-icons/fi';
import { FaCircle } from 'react-icons/fa';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
    COLOUR: "",
    "LIVE STATUS": "",
    "FIT STATUS": ""
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showCharts, setShowCharts] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Premium Color Scheme with dark mode support
  const colors = darkMode ? {
    primary: "#8B5CF6",       // Purple
    primaryLight: "#A78BFA",
    primaryDark: "#7C3AED",
    secondary: "#10B981",     // Emerald
    secondaryLight: "#34D399",
    secondaryDark: "#059669",
    accent: "#F97316",        // Orange
    accentLight: "#FB923C",
    accentDark: "#EA580C",
    danger: "#EF4444",        // Red
    dangerLight: "#F87171",
    dangerDark: "#DC2626",
    success: "#10B981",       // Emerald
    warning: "#F59E0B",       // Amber
    info: "#3B82F6",         // Blue
    textDark: "#F3F4F6",      // Gray-100
    textMedium: "#D1D5DB",    // Gray-300
    textLight: "#111827",     // Gray-900
    background: "#111827",    // Gray-900
    cardBg: "#1F2937",       // Gray-800
    border: "#374151",       // Gray-700
    rowEven: "#1F2937",      // Gray-800
    rowOdd: "#1A202E",       // Slightly darker
    headerBg: "#030712",     // Gray-950
    headerText: "#F9FAFB",
    activeTab: "#8B5CF6",
    inactiveTab: "#6B7280",  // Gray-500
    actionButton: "#10B981",
    statCardBg: "#1F2937",
    statCardBorder: "#374151",
    chartBg: "#1F2937"
  } : {
    primary: "#6366F1",       // Indigo
    primaryLight: "#818CF8",
    primaryDark: "#4F46E5",
    secondary: "#10B981",     // Emerald
    secondaryLight: "#34D399",
    secondaryDark: "#059669",
    accent: "#F97316",        // Orange
    accentLight: "#FB923C",
    accentDark: "#EA580C",
    danger: "#EF4444",        // Red
    dangerLight: "#F87171",
    dangerDark: "#DC2626",
    success: "#10B981",       // Emerald
    warning: "#F59E0B",       // Amber
    info: "#3B82F6",         // Blue
    textDark: "#1F2937",      // Gray-800
    textMedium: "#6B7280",    // Gray-500
    textLight: "#F9FAFB",     // Gray-50
    background: "#F9FAFB",    // Gray-50
    cardBg: "#FFFFFF",
    border: "#E5E7EB",       // Gray-200
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "#111827",     // Gray-900
    headerText: "#F9FAFB",
    activeTab: "#6366F1",
    inactiveTab: "#9CA3AF",  // Gray-400
    actionButton: "#10B981",
    statCardBg: "#FFFFFF",
    statCardBorder: "#E5E7EB",
    chartBg: "#FFFFFF"
  };

  // Form links with icons
  const formLinks = [
    {
      label: "Development Form",
      url: "https://forms.gle/hq1pgP4rz1BSjiCc6",
      icon: <FiFileText size={18} />,
      color: colors.primary
    },
    {
      label: "Fit Status Form",
      url: "https://forms.gle/5BxFQWWTubZTq21g9",
      icon: <FiCheckCircle size={18} />,
      color: colors.secondary
    },
    {
      label: "Insert Pattern Form",
      url: "https://forms.gle/LBQwrpMjJuFzLTsC8",
      icon: <FiLayers size={18} />,
      color: colors.accent
    }
  ];

  // Navigation items
  const navItems = [
    { label: "Dashboard", icon: <FiHome size={20} />, active: true },
    { label: "Orders", icon: <FiShoppingBag size={20} /> },
    { label: "Inventory", icon: <FiPackage size={20} /> },
    { label: "Reports", icon: <FiBarChart2 size={20} /> },
    { label: "Settings", icon: <FiSettings size={20} /> }
  ];

  // Calculate production statistics
  const productionStats = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    let stats = {
      totalOrders: 0,
      deliveredLast30Days: 0,
      deliveredUnitsLast30Days: 0,
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
      
      // Update status distribution
      stats.statusDistribution[status] = (stats.statusDistribution[status] || 0) + 1;
      stats.colorDistribution[color] = (stats.colorDistribution[color] || 0) + 1;
      stats.customerDistribution[customer] = (stats.customerDistribution[customer] || 0) + 1;

      // Parse REAL DD date
      let deliveryDate = null;
      try {
        if (order["REAL DD"]) {
          if (typeof order["REAL DD"] === 'number') {
            // Convert Excel serial number to JS date
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

      // Count delivered orders and units in last 30 days
      if (status === "DELIVERED" && deliveryDate) {
        if (deliveryDate > oneMonthAgo) {
          stats.deliveredLast30Days++;
          stats.deliveredUnitsLast30Days += totalUnits;
        }
        
        // Track last delivery date
        if (!stats.lastDeliveryDate || deliveryDate > stats.lastDeliveryDate) {
          stats.lastDeliveryDate = deliveryDate;
        }
      }

      // Count production status
      if (status === "IN PRODUCTION") {
        stats.inProduction++;
      } else if (status === "FABRIC ORDERED") {
        stats.fabricOrdered++;
      } else if (status !== "DELIVERED") {
        stats.notDelivered++;
      }

      // Count GS SENT status
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

  // Chart data
  const chartData = useMemo(() => {
    const statusLabels = Object.keys(productionStats.statusDistribution);
    const colorLabels = Object.keys(productionStats.colorDistribution);
    
    return {
      statusDistribution: {
        labels: statusLabels,
        datasets: [{
          data: statusLabels.map(label => productionStats.statusDistribution[label]),
          backgroundColor: [
            colors.success,
            colors.info,
            colors.warning,
            colors.danger,
            colors.primary,
            colors.accent
          ],
          borderColor: darkMode ? colors.border : colors.cardBg,
          borderWidth: 2
        }]
      },
      colorDistribution: {
        labels: colorLabels,
        datasets: [{
          data: colorLabels.map(label => productionStats.colorDistribution[label]),
          backgroundColor: colorLabels.map(color => getColorCode(color)),
          borderColor: darkMode ? colors.border : colors.cardBg,
          borderWidth: 2
        }]
      },
      customerDistribution: {
        labels: productionStats.topCustomers.map(c => c[0]),
        datasets: [{
          label: 'Orders',
          data: productionStats.topCustomers.map(c => c[1]),
          backgroundColor: colors.primary,
          borderColor: colors.primaryDark,
          borderWidth: 2
        }]
      }
    };
  }, [productionStats, darkMode]);

  // Utility Functions
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

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

  const getGoogleDriveThumbnail = (url) => {
    if (!url) return "";
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w200` : "";
  };

  const getGoogleDriveDownloadLink = (url) => {
    if (!url) return "";
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : "";
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

  const exportToExcel = () => {
    let dataToExport, columnOrder;
    
    if (activeTab === "dashboard") {
      dataToExport = filteredSales;
      columnOrder = [
        "IMAGE", "H-NUMBER", "PO NUMBER", "STYLE NUMBER", "DESCRIPTION", 
        "COLOUR", "PRICE", "TOTAL UNITS", "FIT STATUS", "CUSTOMER NAME",
        "XFACT DD", "REAL DD", "LIVE STATUS", "CMT PRICE", "ACTUAL CMT",
        "PACKING LIST", "SIZES"
      ];
    } else {
      dataToExport = filteredFabric;
      columnOrder = [
        "NO.", "DATE", "H-NUMBER", "ORDER REF", "TYPE", 
        "DESCRIPTION", "COLOUR", "TOTAL", "FABRIC/TRIM PRICE", "FABRIC PO LINKS"
      ];
    }

    const exportData = dataToExport.map(row => {
      const newRow = {};
      columnOrder.forEach(key => {
        const originalKey = key === "FABRIC/TRIM PRICE" ? "FABRIC/TRIM PRICE" : key;
        if (originalKey in row) {
          if (["PRICE", "CMT PRICE", "ACTUAL CMT", "FABRIC/TRIM PRICE"].includes(originalKey)) {
            newRow[key] = formatCurrency(row[originalKey]);
          } else if (["XFACT DD", "REAL DD", "DATE"].includes(originalKey)) {
            newRow[key] = formatDate(row[originalKey]);
          } else {
            newRow[key] = row[originalKey];
          }
        }
      });
      return newRow;
    });

    const ws = XLSX.utils.json_to_sheet(exportData, { header: columnOrder });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ExportedData");
    
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
        setNotifications(generateNotifications());
      } catch (e) {
        setError("Error Parsing Data");
        console.error(e);
      }
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://script.google.com/macros/s/AKfycbzLeG4jbwZ5AOCUGuEc-d4o0akKIfw0KOb8qDb8wF3Pp0WXhzkSbmOyTZblV_U5vUMLLw/exec?callback=jsonpCallback`;
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
      .filter(row => Object.entries(filters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()));
  }, [data.sales_po, search, filters]);

  const filteredFabric = useMemo(() => {
    return data.fabric_po
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => Object.entries(fabricFilters).every(([k, v]) => !v || (row[k] || "").toLowerCase() === v.toLowerCase()));
  }, [data.fabric_po, search, fabricFilters]);

  // Loading State
  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <FiRefreshCw size={32} />
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
          <FiRefreshCw size={16} /> Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>High5</h2>
          <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>
            <FiX size={24} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <a 
              key={index} 
              href="#" 
              className={`nav-item ${item.active ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.active && <span className="active-indicator"></span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-footer">
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
          >
            <span className="toggle-icon">
              {darkMode ? '☀️' : '🌙'}
            </span>
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <div className="user-profile">
            <div className="avatar">U</div>
            <div className="user-info">
              <div className="user-name">Admin User</div>
              <div className="user-role">Administrator</div>
            </div>
            <button className="logout-button">
              <FiLogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <header className="top-nav">
          <div className="nav-left">
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1>Production Dashboard</h1>
          </div>
          <div className="nav-right">
            <button 
              className="notification-button"
              onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
            >
              <FiBell size={20} />
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
          <div className="notification-dropdown">
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
              <a href="#">View all notifications</a>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        <div className="content-wrapper">
          {/* Production Metrics Dashboard */}
          <div className="metrics-grid">
            {/* Metric Cards */}
            {[
              {
                title: "Total Orders",
                value: productionStats.totalOrders,
                subtitle: `${filteredSales.length} Matching Filters`,
                icon: <FiShoppingBag size={20} />,
                color: colors.primary,
                trend: null,
                change: null
              },
              {
                title: "Delivered (30 Days)",
                value: productionStats.deliveredLast30Days,
                subtitle: `${productionStats.deliveredUnitsLast30Days} Units`,
                icon: <FiTruck size={20} />,
                color: colors.success,
                trend: "up",
                change: "+12%"
              },
              {
                title: "Last Delivery Date",
                value: productionStats.lastDeliveryDateFormatted,
                subtitle: "Based On Real DD Date",
                icon: <FiCalendar size={20} />,
                color: colors.secondary,
                trend: null,
                change: null
              },
              {
                title: "In Production",
                value: productionStats.inProduction,
                subtitle: "Currently Being Manufactured",
                icon: <FiClock size={20} />,
                color: colors.accent,
                trend: "neutral",
                change: "0%"
              },
              {
                title: "Not Delivered",
                value: productionStats.notDelivered,
                subtitle: "Pending Completion",
                icon: <FiAlertCircle size={20} />,
                color: colors.warning,
                trend: "down",
                change: "-5%"
              },
              {
                title: "Fabric Ordered",
                value: productionStats.fabricOrdered,
                subtitle: "Materials Ordered",
                icon: <FiDatabase size={20} />,
                color: colors.info,
                trend: "up",
                change: "+8%"
              }
            ].map((metric, index) => (
              <div key={index} className="metric-card">
                <div className="metric-header">
                  <div className="metric-icon" style={{ color: metric.color, backgroundColor: `${metric.color}15` }}>
                    {metric.icon}
                  </div>
                  <div className="metric-trend">
                    {metric.trend === 'up' && <FiTrendingUp size={16} color={colors.success} />}
                    {metric.trend === 'down' && <FiTrendingUp size={16} color={colors.danger} style={{ transform: 'rotate(180deg)' }} />}
                    {metric.trend === 'neutral' && <div style={{ width: 16, height: 16 }}></div>}
                    {metric.change && <span className={`trend-value ${metric.trend}`}>{metric.change}</span>}
                  </div>
                </div>
                <div className="metric-body">
                  <div className="metric-value">{metric.value}</div>
                  <div className="metric-title">{metric.title}</div>
                </div>
                <div className="metric-footer">
                  {metric.subtitle}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          {showCharts && (
            <div className="charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Order Status Distribution</h3>
                  <FiPieChart size={20} color={colors.primary} />
                </div>
                <div className="chart-container">
                  <Doughnut 
                    data={chartData.statusDistribution} 
                    options={{
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: colors.textDark,
                            font: {
                              family: "'Inter', sans-serif"
                            }
                          }
                        },
                        tooltip: {
                          backgroundColor: colors.cardBg,
                          titleColor: colors.textDark,
                          bodyColor: colors.textDark,
                          borderColor: colors.border,
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 4
                        }
                      },
                      cutout: '70%',
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Color Distribution</h3>
                  <FiPieChart size={20} color={colors.primary} />
                </div>
                <div className="chart-container">
                  <Doughnut 
                    data={chartData.colorDistribution} 
                    options={{
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            color: colors.textDark,
                            font: {
                              family: "'Inter', sans-serif"
                            }
                          }
                        },
                        tooltip: {
                          backgroundColor: colors.cardBg,
                          titleColor: colors.textDark,
                          bodyColor: colors.textDark,
                          borderColor: colors.border,
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 4
                        }
                      },
                      cutout: '70%',
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Top Customers</h3>
                  <FiBarChart2 size={20} color={colors.primary} />
                </div>
                <div className="chart-container">
                  <Bar 
                    data={chartData.customerDistribution} 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          backgroundColor: colors.cardBg,
                          titleColor: colors.textDark,
                          bodyColor: colors.textDark,
                          borderColor: colors.border,
                          borderWidth: 1,
                          padding: 12,
                          boxPadding: 4
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: colors.border
                          },
                          ticks: {
                            color: colors.textMedium
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          },
                          ticks: {
                            color: colors.textMedium
                          }
                        }
                      },
                      maintainAspectRatio: false
                    }}
                  />
                </div>
              </div>
            </div>
          )}

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
                  <div className="form-subtext">Quick Submission Form</div>
                </div>
                <FiExternalLink size={16} />
              </a>
            ))}
          </div>

          {/* Toggle Charts Button */}
          <div className="toggle-charts">
            <button 
              onClick={() => setShowCharts(!showCharts)}
              className="toggle-button"
            >
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
          </div>

          {/* Tabs */}
          <div className="tab-container">
            <div className="tabs">
              {[
                { id: "dashboard", label: "Sales Orders", icon: <FiShoppingBag size={18} /> },
                { id: "fabric", label: "Fabric Orders", icon: <FiGrid size={18} /> }
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
            <div className="tab-divider"></div>
          </div>

          {/* Search and Filters */}
          <div className="search-filter-container">
            <div className="search-box">
              <FiSearch className="search-icon" size={18} />
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
                  } else {
                    setFabricFilters({
                      TYPE: "",
                      COLOUR: "",
                      SUPPLIER: ""
                    });
                  }
                  setSearch("");
                }}
                className="secondary-button"
              >
                <FiFilter size={16} />
                Clear Filters
              </button>

              <button
                onClick={exportToExcel}
                className="primary-button"
              >
                <FiDownload size={16} />
                Export Excel
              </button>

              <button
                onClick={() => window.print()}
                className="secondary-button"
              >
                <FiPrinter size={16} />
                Print
              </button>
            </div>
          </div>

          {/* Sales PO Tab */}
          {activeTab === "dashboard" && (
            <>
              {/* Filters */}
              <div className="filter-grid">
                {Object.keys(filters).map((key) => (
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

              {/* Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "IMAGE", icon: <FiImage size={16} /> },
                        { label: "H-NUMBER" },
                        { label: "PO NUMBER" },
                        { label: "STYLE NUMBER" },
                        { label: "DESCRIPTION" },
                        { label: "COLOUR" },
                        { label: "PRICE", icon: <FiDollarSign size={16} /> },
                        { label: "TOTAL UNITS" },
                        { label: "FIT STATUS" },
                        { label: "CUSTOMER NAME", icon: <FiUsers size={16} /> },
                        { label: "XFACT DD" },
                        { label: "REAL DD" },
                        { label: "LIVE STATUS" },
                        { label: "CMT PRICE", icon: <FiDollarSign size={16} /> },
                        { label: "ACTUAL CMT", icon: <FiDollarSign size={16} /> },
                        { label: "PACKING LIST", icon: <FiFileText size={16} /> },
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
                            <FiAlertCircle size={32} />
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
                          <td className="highlight-cell">{row["H-NUMBER"]}</td>
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
                          <td className="highlight-cell">{formatCurrency(row["PRICE"])}</td>
                          <td className="bold-cell">{row["TOTAL UNITS"]}</td>
                          <td>
                            <span className={`status-badge ${row["FIT STATUS"] === "GS SENT" ? 'success' : 'warning'}`}>
                              {row["FIT STATUS"]}
                            </span>
                          </td>
                          <td>{row["CUSTOMER NAME"]}</td>
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
                          <td className="nowrap bold-cell">{formatCurrency(row["CMT PRICE"])}</td>
                          <td className="nowrap bold-cell">{formatCurrency(row["ACTUAL CMT"])}</td>
                          <td>
                            {row["PACKING LIST"] ? (
                              <a
                                href={getGoogleDriveDownloadLink(row["PACKING LIST"])}
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
            <>
              {/* Filters */}
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

              {/* Table */}
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "NO." },
                        { label: "DATE" },
                        { label: "H-NUMBER" },
                        { label: "ORDER REF" },
                        { label: "TYPE" },
                        { label: "DESCRIPTION" },
                        { label: "COLOUR" },
                        { label: "TOTAL" },
                        { label: "FABRIC/TRIM PRICE", icon: <FiDollarSign size={16} /> },
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
                        <td colSpan="10">
                          <div className="empty-content">
                            <FiAlertCircle size={32} />
                            <div>No Matching Fabric Orders Found</div>
                            <p>Try Adjusting Your Search Or Filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredFabric.map((row, i) => (
                        <tr key={i}>
                          <td className="bold-cell">{row["NO."]}</td>
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
                          <td className="nowrap bold-cell">{formatCurrency(row["FABRIC/TRIM PRICE"])}</td>
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
        </div>

        {/* Image Preview */}
        {previewImage.visible && (
          <div 
            className={`image-preview ${previewImage.direction}`}
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
        <footer className="app-footer">
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          line-height: 1.5;
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
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: ${darkMode ? '#374151' : '#f1f1f1'};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#6B7280' : '#c1c1c1'};
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#9CA3AF' : '#a1a1a1'};
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
      `}</style>

      {/* Component styles */}
      <style jsx>{`
        .app-container {
          min-height: 100vh;
          display: flex;
          background-color: ${colors.background};
          color: ${colors.textDark};
        }

        .app-container.light {
          --shadow-color: rgba(0, 0, 0, 0.1);
          --hover-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .app-container.dark {
          --shadow-color: rgba(0, 0, 0, 0.3);
          --hover-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
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
          animation: spin 1.5s linear infinite;
          margin-bottom: 1.5rem;
          color: ${colors.primary};
        }

        .loading-content h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: ${colors.textDark};
        }

        .loading-content p {
          color: ${colors.textMedium};
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
          margin-bottom: 1.5rem;
        }

        .error-content h2 {
          font-size: 1.5rem;
          margin-bottom: 0.5rem;
          color: ${colors.textDark};
        }

        .error-content p {
          color: ${colors.textMedium};
          margin-bottom: 1.5rem;
        }

        .retry-button {
          background-color: ${colors.primary};
          color: ${colors.textLight};
          padding: 0.75rem 1.5rem;
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

        /* Sidebar Styles */
        .sidebar {
          width: 280px;
          height: 100vh;
          background-color: ${colors.cardBg};
          border-right: 1px solid ${colors.border};
          position: fixed;
          top: 0;
          left: -280px;
          z-index: 1000;
          transition: left 0.3s ease;
          display: flex;
          flex-direction: column;
          box-shadow: 2px 0 10px var(--shadow-color);
        }

        .sidebar.open {
          left: 0;
        }

        .sidebar-header {
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid ${colors.border};
        }

        .sidebar-header h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: ${colors.primary};
        }

        .close-sidebar {
          color: ${colors.textMedium};
          transition: all 0.2s;
        }

        .close-sidebar:hover {
          color: ${colors.textDark};
          transform: rotate(90deg);
        }

        .sidebar-nav {
          flex: 1;
          padding: 1rem 0;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          margin: 0.25rem 0;
          position: relative;
          color: ${colors.textMedium};
          transition: all 0.2s;
        }

        .nav-item:hover {
          color: ${colors.primary};
          background-color: ${colors.primary}10;
        }

        .nav-item.active {
          color: ${colors.primary};
          font-weight: 500;
        }

        .nav-icon {
          margin-right: 1rem;
          display: flex;
          align-items: center;
        }

        .nav-label {
          flex: 1;
        }

        .active-indicator {
          width: 4px;
          height: 24px;
          background-color: ${colors.primary};
          border-radius: 2px;
          position: absolute;
          right: 0;
        }

        .sidebar-footer {
          padding: 1.5rem;
          border-top: 1px solid ${colors.border};
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
          color: ${colors.textDark};
          transition: all 0.2s;
        }

        .theme-toggle:hover {
          background-color: ${colors.primary}10;
          color: ${colors.primary};
        }

        .toggle-icon {
          font-size: 1.25rem;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .user-profile:hover {
          background-color: ${colors.primary}10;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: ${colors.primary};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: ${colors.textDark};
        }

        .user-role {
          font-size: 0.75rem;
          color: ${colors.textMedium};
        }

        .logout-button {
          color: ${colors.textMedium};
          transition: all 0.2s;
        }

        .logout-button:hover {
          color: ${colors.danger};
        }

        /* Main Content Styles */
        .main-content {
          flex: 1;
          margin-left: 0;
          transition: margin-left 0.3s ease;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .sidebar.open + .main-content {
          margin-left: 280px;
        }

        /* Top Navigation */
        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem 2rem;
          background-color: ${colors.cardBg};
          border-bottom: 1px solid ${colors.border};
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .nav-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .sidebar-toggle {
          color: ${colors.textMedium};
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sidebar-toggle:hover {
          color: ${colors.primary};
          transform: scale(1.1);
        }

        .top-nav h1 {
          font-size: 1.25rem;
          font-weight: 600;
          color: ${colors.textDark};
        }

        .nav-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .notification-button {
          position: relative;
          color: ${colors.textMedium};
          transition: all 0.2s;
        }

        .notification-button:hover {
          color: ${colors.primary};
        }

        .notification-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background-color: ${colors.danger};
          color: white;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.625rem;
          font-weight: 600;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: ${colors.primary};
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          cursor: pointer;
        }

        /* Notification Dropdown */
        .notification-dropdown {
          position: absolute;
          top: 60px;
          right: 2rem;
          width: 320px;
          background-color: ${colors.cardBg};
          border-radius: 0.75rem;
          box-shadow: 0 10px 25px var(--shadow-color);
          z-index: 110;
          overflow: hidden;
          animation: fadeIn 0.2s ease-out;
          border: 1px solid ${colors.border};
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid ${colors.border};
        }

        .notification-header h3 {
          font-size: 1rem;
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
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-item {
          display: flex;
          padding: 1rem;
          gap: 0.75rem;
          transition: all 0.2s;
        }

        .notification-item.unread {
          background-color: ${colors.primary}08;
        }

        .notification-item:hover {
          background-color: ${colors.primary}15;
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
          font-size: 0.875rem;
          color: ${colors.textDark};
          margin-bottom: 0.25rem;
        }

        .notification-time {
          font-size: 0.75rem;
          color: ${colors.textMedium};
        }

        .notification-footer {
          padding: 0.75rem 1rem;
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
          padding: 2rem;
        }

        /* Metrics Grid */
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .metric-card {
          background-color: ${colors.cardBg};
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          border: 1px solid ${colors.border};
        }

        .metric-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--hover-shadow);
        }

        .metric-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .trend-value {
          font-size: 0.75rem;
          font-weight: 600;
        }

        .trend-value.up {
          color: ${colors.success};
        }

        .trend-value.down {
          color: ${colors.danger};
        }

        .trend-value.neutral {
          color: ${colors.warning};
        }

        .metric-body {
          margin-bottom: 1rem;
        }

        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
          color: ${colors.textDark};
          margin-bottom: 0.5rem;
        }

        .metric-title {
          font-size: 1rem;
          font-weight: 600;
          color: ${colors.textDark};
        }

        .metric-footer {
          font-size: 0.875rem;
          color: ${colors.textMedium};
        }

        /* Charts Grid */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          background-color: ${colors.cardBg};
          border-radius: 1rem;
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          border: 1px solid ${colors.border};
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .chart-header h3 {
          font-size: 1rem;
          font-weight: 600;
          color: ${colors.textDark};
        }

        .chart-container {
          height: 250px;
          position: relative;
        }

        /* Form Links Grid */
        .form-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .form-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          border-radius: 1rem;
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .form-link:hover {
          transform: translateY(-3px);
          box-shadow: var(--hover-shadow);
        }

        .form-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background-color: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .form-content {
          flex: 1;
        }

        .form-label {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .form-subtext {
          font-size: 0.875rem;
          opacity: 0.9;
        }

        /* Toggle Charts Button */
        .toggle-charts {
          display: flex;
          justify-content: center;
          margin-bottom: 2rem;
        }

        .toggle-button {
          background-color: ${colors.cardBg};
          color: ${colors.primary};
          padding: 0.75rem 1.5rem;
          border-radius: 2rem;
          font-weight: 600;
          border: 1px solid ${colors.primary};
          transition: all 0.3s ease;
        }

        .toggle-button:hover {
          background-color: ${colors.primary};
          color: white;
        }

        /* Tab Container */
        .tab-container {
          margin-bottom: 1.5rem;
          position: relative;
          border-bottom: 1px solid ${colors.border};
        }

        .tabs {
          display: flex;
        }

        .tab-button {
          padding: 0.75rem 1.5rem;
          background-color: transparent;
          color: ${colors.inactiveTab};
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          position: relative;
          transition: all 0.2s;
          margin-right: 0.5rem;
          border-radius: 0.5rem 0.5rem 0 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tab-button:hover {
          color: ${colors.primary};
          background: ${colors.primary}10;
        }

        .tab-button.active {
          color: ${colors.primary};
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background-color: ${colors.primary};
          border-radius: 3px 3px 0 0;
        }

        .tab-divider {
          flex: 1;
          border-bottom: 1px solid ${colors.border};
          margin-bottom: -1px;
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
          min-width: 300px;
          max-width: 600px;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: ${colors.textMedium};
        }

        .search-input {
          padding: 0.875rem 1.25rem 0.875rem 2.75rem;
          width: 100%;
          border: 1px solid ${colors.border};
          border-radius: 0.75rem;
          font-size: 0.875rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.04);
          transition: all 0.2s;
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
          background-color: ${colors.primary};
          color: ${colors.textLight};
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.75rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 2px 8px ${colors.primary}30;
        }

        .primary-button:hover {
          background-color: ${colors.primaryDark};
          transform: translateY(-2px);
        }

        .secondary-button {
          background-color: ${colors.cardBg};
          color: ${colors.textMedium};
          padding: 0.75rem 1.5rem;
          border: 1px solid ${colors.border};
          border-radius: 0.75rem;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .secondary-button:hover {
          background-color: ${colors.primary}10;
          color: ${colors.primary};
          border-color: ${colors.primary};
        }

        /* Filter Grid */
        .filter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1rem;
          margin-bottom: 1.5rem;
          background: ${colors.cardBg};
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border: 1px solid ${colors.border};
        }

        .filter-item {
          display: flex;
          flex-direction: column;
        }

        .filter-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: ${colors.textDark};
          font-size: 0.8125rem;
        }

        .filter-select {
          padding: 0.75rem 2.5rem 0.75rem 1rem;
          width: 100%;
          border: 1px solid ${colors.border};
          border-radius: 0.75rem;
          background-color: ${colors.cardBg};
          font-size: 0.875rem;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${encodeURIComponent(colors.textMedium)}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          background-size: 1rem;
          transition: all 0.2s;
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
          border-radius: 1rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          background: ${colors.cardBg};
          border: 1px solid ${colors.border};
          margin-bottom: 2.5rem;
        }

        .data-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          font-size: 0.875rem;
          min-width: 1200px;
        }

        .data-table thead tr {
          background-color: ${colors.headerBg};
          color: ${colors.headerText};
          position: sticky;
          top: 0;
        }

        .data-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          font-size: 0.8125rem;
          border-bottom: 2px solid ${colors.primary};
          white-space: nowrap;
          position: relative;
        }

        .header-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .header-icon {
          display: flex;
          align-items: center;
        }

        .data-table th::after {
          content: '';
          position: absolute;
          bottom: 0.25rem;
          left: 1rem;
          right: 1rem;
          height: 1px;
          background-color: rgba(255,255,255,0.1);
        }

        .data-table tbody tr {
          background-color: ${colors.rowEven};
          transition: all 0.2s;
        }

        .data-table tbody tr:nth-child(odd) {
          background-color: ${colors.rowOdd};
        }

        .data-table tbody tr:hover {
          background-color: ${darkMode ? '#1E293B' : '#F5F9FF'};
        }

        .data-table td {
          padding: 1rem;
          vertical-align: middle;
        }

        /* Special cell styles */
        .image-cell {
          width: 120px;
          height: 80px;
          padding: 0.75rem !important;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: transform 0.2s;
          border: 1px solid ${colors.border};
        }

        .product-image:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-style: italic;
          color: ${colors.textMedium};
          background-color: ${darkMode ? '#374151' : '#F3F4F6'};
          border-radius: 0.5rem;
          border: 1px dashed ${colors.border};
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
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-badge {
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          font-weight: 600;
          font-size: 0.75rem;
          display: inline-block;
          white-space: nowrap;
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
          padding: 0.5rem 0.75rem;
          border-radius: 0.5rem;
          background: ${colors.primary}15;
          color: ${colors.primary};
          font-weight: 600;
          font-size: 0.75rem;
          display: inline-block;
          white-space: nowrap;
        }

        .download-button, .view-button {
          background-color: ${colors.secondary};
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          text-decoration: none;
          display: inline-block;
          min-width: 100px;
          text-align: center;
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
          font-size: 0.8125rem;
          color: ${colors.textMedium};
        }

        /* Empty state */
        .empty-state td {
          padding: 3rem;
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
          margin-top: 0.5rem;
          color: ${colors.textMedium};
        }

        /* Image preview */
        .image-preview {
          position: fixed;
          z-index: 1000;
          width: 320px;
          height: auto;
          pointer-events: none;
          background-color: ${colors.cardBg};
          padding: 1rem;
          border-radius: 0.75rem;
          box-shadow: 0 10px 30px var(--shadow-color);
          transform: translateX(-50%);
          transition: transform 0.1s ease-out;
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
          max-height: 400px;
          object-fit: contain;
          border-radius: 0.5rem;
          border: 1px solid ${colors.border};
        }

        .preview-arrow {
          position: absolute;
          width: 1.25rem;
          height: 1.25rem;
          background-color: ${colors.cardBg};
          transform: rotate(45deg);
          border-right: 1px solid ${colors.border};
          z-index: -1;
        }

        .image-preview.below .preview-arrow {
          top: -0.625rem;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-bottom: 1px solid ${colors.border};
        }

        .image-preview.above .preview-arrow {
          bottom: -0.625rem;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-top: 1px solid ${colors.border};
        }

        /* Footer */
        .app-footer {
          background: ${colors.cardBg};
          color: ${colors.textMedium};
          padding: 1rem 2rem;
          border-top: 1px solid ${colors.border};
        }

        .footer-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8125rem;
        }

        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .sidebar.open + .main-content {
            margin-left: 0;
          }
          
          .content-wrapper {
            padding: 1.5rem;
          }
          
          .metrics-grid, .charts-grid, .form-links-grid {
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .top-nav {
            padding: 1rem;
          }
          
          .content-wrapper {
            padding: 1rem;
          }
          
          .search-filter-container {
            flex-direction: column;
          }
          
          .search-box {
            min-width: 100%;
          }
          
          .action-buttons {
            width: 100%;
            justify-content: flex-end;
          }
        }

        @media (max-width: 480px) {
          .metric-card {
            padding: 1rem;
          }
          
          .form-link {
            flex-direction: column;
            text-align: center;
            gap: 0.75rem;
          }
          
          .form-icon {
            margin: 0 auto;
          }
          
          .action-buttons {
            flex-direction: column;
            gap: 0.5rem;
          }
          
          .primary-button, .secondary-button {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );

  // Helper function to get color codes
  function getColorCode(color) {
    if (!color) return "#8B5CF6";
    const colorLower = color.toLowerCase();
    if (colorLower.includes("red")) return "#EF4444";
    if (colorLower.includes("blue")) return "#3B82F6";
    if (colorLower.includes("green")) return "#10B981";
    if (colorLower.includes("black")) return "#1F2937";
    if (colorLower.includes("white")) return "#E5E7EB";
    if (colorLower.includes("pink")) return "#EC4899";
    if (colorLower.includes("yellow")) return "#F59E0B";
    if (colorLower.includes("purple")) return "#8B5CF6";
    if (colorLower.includes("gray") || colorLower.includes("grey")) return "#6B7280";
    if (colorLower.includes("navy")) return "#1E40AF";
    if (colorLower.includes("teal")) return "#0D9488";
    if (colorLower.includes("orange")) return "#F97316";
    return "#8B5CF6";
  }
}

export default App;