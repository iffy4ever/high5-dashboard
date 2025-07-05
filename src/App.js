import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from 'xlsx';

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

  // Modern Color Scheme
  const colors = {
    primary: "#4F46E5",
    primaryLight: "#6366F1",
    primaryDark: "#4338CA",
    secondary: "#10B981",
    secondaryLight: "#34D399",
    secondaryDark: "#059669",
    accent: "#F59E0B",
    accentLight: "#FCD34D",
    accentDark: "#D97706",
    danger: "#EF4444",
    dangerLight: "#FCA5A5",
    dangerDark: "#DC2626",
    success: "#10B981",
    warning: "#F59E0B",
    info: "#3B82F6",
    textDark: "#1F2937",
    textMedium: "#4B5563",
    textLight: "#F9FAFB",
    background: "#F9FAFB",
    cardBg: "#FFFFFF",
    border: "#E5E7EB",
    rowEven: "#FFFFFF",
    rowOdd: "#F9FAFB",
    headerBg: "#4F46E5",
    headerText: "#FFFFFF",
    activeTab: "#4F46E5",
    inactiveTab: "#9CA3AF",
    actionButton: "#10B981"
  };

  // Form links
  const formLinks = {
    development: "https://forms.gle/hq1pgP4rz1BSjiCc6",
    fitStatus: "https://forms.gle/5BxFQWWTubZTq21g9",
    insertPattern: "https://forms.gle/LBQwrpMjJuFzLTsC8"
  };

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
      lastDeliveryDate: null
    };

    data.sales_po.forEach(order => {
      const status = String(order["LIVE STATUS"] || "").toUpperCase().trim();
      const totalUnits = parseInt(order["TOTAL UNITS"] || 0);
      
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
        : "No deliveries yet"
    };
  }, [data.sales_po]);

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
      } catch (e) {
        setError("Error parsing data");
        console.error(e);
      }
      setLoading(false);
    };

    const script = document.createElement("script");
    script.src = `https://script.google.com/macros/s/AKfycbzLeG4jbwZ5AOCUGuEc-d4o0akKIfw0KOb8qDb8wF3Pp0WXhzkSbmOyTZblV_U5vUMLLw/exec?callback=jsonpCallback`;
    script.async = true;
    script.onerror = () => {
      setError("Failed to load data");
      setLoading(false);
    };
    document.body.appendChild(script);

    return () => {
      delete window.jsonpCallback;
      document.body.removeChild(script);
    };
  }, []);

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
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: colors.background
    }}>
      <div style={{
        padding: "40px",
        background: colors.cardBg,
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        textAlign: "center",
        border: `1px solid ${colors.border}`
      }}>
        <div style={{
          fontSize: "24px",
          fontWeight: "600",
          color: colors.primary,
          marginBottom: "20px"
        }}>Loading Production Data</div>
        <div style={{
          width: "200px",
          height: "6px",
          background: colors.border,
          borderRadius: "3px",
          overflow: "hidden",
          margin: "0 auto"
        }}>
          <div style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(90deg, ${colors.primaryLight}, ${colors.primaryDark})`,
            animation: "loading 1.5s infinite ease-in-out"
          }}></div>
        </div>
      </div>
    </div>
  );

  // Error State
  if (error) return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: colors.background
    }}>
      <div style={{
        padding: "30px 40px",
        textAlign: "center",
        background: colors.cardBg,
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: `1px solid ${colors.dangerLight}`,
        maxWidth: "500px"
      }}>
        <div style={{
          fontSize: "20px",
          fontWeight: "600",
          color: colors.danger,
          marginBottom: "15px"
        }}>
          Error Loading Data
        </div>
        <div style={{
          color: colors.textMedium,
          marginBottom: "20px"
        }}>
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: colors.primary,
            color: colors.textLight,
            padding: "10px 20px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "14px",
            transition: "all 0.2s",
            ":hover": {
              backgroundColor: colors.primaryDark,
              transform: "translateY(-1px)"
            }
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  // Main Render
  return (
    <div style={{ 
      minHeight: "100vh",
      background: colors.background,
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <header style={{
        background: colors.headerBg,
        color: colors.headerText,
        padding: "20px 0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        marginBottom: "30px",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: "700",
              letterSpacing: "0.5px"
            }}>
              HIGH5 Production Dashboard
            </h1>
            <div style={{
              fontSize: "14px",
              opacity: 0.8,
              marginTop: "4px"
            }}>
              Real-time production tracking and management
            </div>
          </div>
          <div style={{
            display: "flex",
            gap: "15px"
          }}>
            <button
              onClick={exportToExcel}
              style={{
                backgroundColor: colors.secondary,
                color: "white",
                padding: "10px 20px",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow: `0 2px 10px rgba(16, 185, 129, 0.3)`,
                ":hover": {
                  backgroundColor: colors.secondaryDark,
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 12px rgba(16, 185, 129, 0.4)`
                }
              }}
            >
              <span>Export to Excel</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{
        maxWidth: "1400px",
        margin: "0 auto",
        padding: "0 30px 40px"
      }}>
        {/* Production Metrics Dashboard */}
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          {/* Total Orders */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: `1px solid ${colors.border}`,
            borderTop: `4px solid ${colors.primary}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "14px", color: colors.textMedium, fontWeight: "500" }}>Total Orders</div>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${colors.primary}20`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary }}>
                📦
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: colors.textDark }}>
              {productionStats.totalOrders}
            </div>
            <div style={{ fontSize: "12px", color: colors.textMedium, marginTop: "4px" }}>
              {filteredSales.length} matching filters
            </div>
          </div>

          {/* Delivered Last 30 Days */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: `1px solid ${colors.border}`,
            borderTop: `4px solid ${colors.success}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "14px", color: colors.textMedium, fontWeight: "500" }}>Delivered (30 Days)</div>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${colors.success}20`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.success }}>
                🚚
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: colors.textDark }}>
              {productionStats.deliveredLast30Days}
            </div>
            <div style={{ fontSize: "12px", color: colors.textMedium, marginTop: "4px" }}>
              {productionStats.deliveredUnitsLast30Days} units
            </div>
          </div>

          {/* Last Delivery Date */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: `1px solid ${colors.border}`,
            borderTop: `4px solid ${colors.secondary}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "14px", color: colors.textMedium, fontWeight: "500" }}>Last Delivery Date</div>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${colors.secondary}20`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.secondary }}>
                📅
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: colors.textDark }}>
              {productionStats.lastDeliveryDateFormatted}
            </div>
            <div style={{ fontSize: "12px", color: colors.textMedium, marginTop: "4px" }}>
              Based on REAL DD date
            </div>
          </div>

          {/* In Production */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: `1px solid ${colors.border}`,
            borderTop: `4px solid ${colors.accent}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "14px", color: colors.textMedium, fontWeight: "500" }}>In Production</div>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${colors.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.accent }}>
                🏭
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: colors.textDark }}>
              {productionStats.inProduction}
            </div>
            <div style={{ fontSize: "12px", color: colors.textMedium, marginTop: "4px" }}>
              Currently being manufactured
            </div>
          </div>

          {/* Not Delivered */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: `1px solid ${colors.border}`,
            borderTop: `4px solid ${colors.warning}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "14px", color: colors.textMedium, fontWeight: "500" }}>Not Delivered</div>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${colors.warning}20`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.warning }}>
                ⏳
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: colors.textDark }}>
              {productionStats.notDelivered}
            </div>
            <div style={{ fontSize: "12px", color: colors.textMedium, marginTop: "4px" }}>
              Pending completion
            </div>
          </div>

          {/* Fabric Ordered */}
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            border: `1px solid ${colors.border}`,
            borderTop: `4px solid ${colors.info}`
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <div style={{ fontSize: "14px", color: colors.textMedium, fontWeight: "500" }}>Fabric Ordered</div>
              <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: `${colors.info}20`, display: "flex", alignItems: "center", justifyContent: "center", color: colors.info }}>
                🧵
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: colors.textDark }}>
              {productionStats.fabricOrdered}
            </div>
            <div style={{ fontSize: "12px", color: colors.textMedium, marginTop: "4px" }}>
              Materials ordered
            </div>
          </div>
        </div>

        {/* Form Buttons Row */}
        <div style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
          marginBottom: "30px"
        }}>
          {Object.entries(formLinks).map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: colors.primary,
                color: colors.textLight,
                padding: "18px",
                borderRadius: "12px",
                textDecoration: "none",
                fontWeight: "600",
                textAlign: "center",
                transition: "all 0.2s",
                boxShadow: `0 4px 12px ${colors.primary}30`,
                ":hover": {
                  transform: "translateY(-3px)",
                  boxShadow: `0 6px 16px ${colors.primary}40`
                }
              }}
            >
              {key.split(/(?=[A-Z])/).join(" ")}
            </a>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ 
          display: "flex", 
          marginBottom: "25px",
          borderBottom: `1px solid ${colors.border}`,
          position: "relative"
        }}>
          {["dashboard", "fabric"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "14px 30px",
                backgroundColor: "transparent",
                color: activeTab === tab ? colors.primary : colors.textMedium,
                border: "none",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "15px",
                position: "relative",
                transition: "all 0.2s",
                ":hover": {
                  color: colors.primary
                }
              }}
            >
              {tab === "dashboard" ? "Sales PO" : "Fabric PO"}
              {activeTab === tab && (
                <div style={{
                  position: "absolute",
                  bottom: "-1px",
                  left: 0,
                  right: 0,
                  height: "3px",
                  backgroundColor: colors.primary,
                  borderRadius: "3px 3px 0 0"
                }}></div>
              )}
            </button>
          ))}
          <div style={{ flex: 1, borderBottom: `1px solid ${colors.border}` }}></div>
        </div>

        {/* Search and Filters */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginBottom: "25px",
          gap: "20px",
          flexWrap: "wrap"
        }}>
          <div style={{
            flex: 1,
            position: "relative",
            maxWidth: "600px",
            minWidth: "300px"
          }}>
            <input
              placeholder="Search orders, styles, colors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "14px 20px 14px 48px",
                width: "100%",
                border: `1px solid ${colors.border}`,
                borderRadius: "10px",
                fontSize: "15px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
                background: colors.cardBg,
                ":focus": {
                  outline: "none",
                  borderColor: colors.primary,
                  boxShadow: `0 2px 12px ${colors.primary}20`
                }
              }}
            />
            <span style={{
              position: "absolute",
              left: "18px",
              top: "50%",
              transform: "translateY(-50%)",
              color: colors.textMedium
            }}>
              🔍
            </span>
          </div>
          
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
            style={{
              backgroundColor: colors.cardBg,
              color: colors.textMedium,
              padding: "12px 20px",
              border: `1px solid ${colors.border}`,
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "14px",
              transition: "all 0.2s",
              ":hover": {
                backgroundColor: colors.primary,
                color: colors.textLight,
                borderColor: colors.primary
              }
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Sales PO Tab */}
        {activeTab === "dashboard" && (
          <>
            {/* Filters */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
              background: colors.cardBg,
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: `1px solid ${colors.border}`
            }}>
              {Object.keys(filters).map((key) => (
                <div key={key}>
                  <label style={{
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: colors.textDark,
                    fontSize: "14px"
                  }}>
                    {key}
                  </label>
                  <select
                    value={filters[key]}
                    onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                    style={{
                      padding: "12px 15px",
                      width: "100%",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      backgroundColor: colors.cardBg,
                      fontSize: "14px",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      backgroundSize: "16px",
                      transition: "all 0.2s",
                      ":hover": {
                        borderColor: colors.primary
                      },
                      ":focus": {
                        outline: "none",
                        borderColor: colors.primary,
                        boxShadow: `0 0 0 2px ${colors.primary}20`
                      }
                    }}
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
            <div style={{ 
              overflowX: "auto",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              marginBottom: "40px"
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: "14px"
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: colors.headerBg,
                    color: colors.headerText,
                    position: "sticky",
                    top: 0
                  }}>
                    {[
                      "IMAGE", "H-NUMBER", "PO NUMBER", "STYLE NUMBER", "DESCRIPTION", 
                      "COLOUR", "PRICE", "TOTAL UNITS", "FIT STATUS", "CUSTOMER NAME",
                      "XFACT DD", "REAL DD", "LIVE STATUS", "CMT PRICE", "ACTUAL CMT",
                      "PACKING LIST", "SIZES"
                    ].map(header => (
                      <th key={header} style={{ 
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: "600",
                        borderBottom: `2px solid ${colors.primary}`,
                        whiteSpace: "nowrap"
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan="17" style={{ 
                        padding: "40px", 
                        textAlign: "center",
                        color: colors.textMedium,
                        fontStyle: "italic",
                        backgroundColor: colors.cardBg
                      }}>
                        <div style={{ marginBottom: "15px" }}>
                          ⚠️
                        </div>
                        No matching orders found
                        <div style={{ 
                          fontSize: "13px",
                          marginTop: "10px",
                          color: colors.textMedium
                        }}>
                          Try adjusting your search or filters
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((row, i) => (
                      <tr 
                        key={i} 
                        style={{ 
                          backgroundColor: i % 2 === 0 ? colors.rowEven : colors.rowOdd,
                          transition: "all 0.2s",
                          ":hover": {
                            backgroundColor: "#f0f4f8"
                          }
                        }}
                      >
                        <td style={{ padding: "12px", width: "120px", height: "80px" }}>
                          {row.IMAGE ? (
                            <div 
                              onMouseEnter={(e) => handleMouseEnter(row.IMAGE, e)}
                              onMouseLeave={handleMouseLeave}
                              style={{ width: "100%", height: "100%" }}
                            >
                              <a href={row.IMAGE} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={getGoogleDriveThumbnail(row.IMAGE)}
                                  alt="Product"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "transform 0.2s",
                                    border: `1px solid ${colors.border}`,
                                    ":hover": {
                                      transform: "scale(1.03)",
                                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                    }
                                  }}
                                />
                              </a>
                            </div>
                          ) : (
                            <div style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontStyle: "italic",
                              color: colors.textMedium,
                              backgroundColor: "#f5f5f5",
                              borderRadius: "6px",
                              border: `1px dashed ${colors.border}`
                            }}>
                              No Image
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", color: colors.primary }}>
                          {row["H-NUMBER"]}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "500" }}>{row["PO NUMBER"]}</td>
                        <td style={{ padding: "12px" }}>{row["STYLE NUMBER"]}</td>
                        <td style={{ padding: "12px" }}>{row["DESCRIPTION"]}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}>
                            {row["COLOUR"] && (
                              <span style={{
                                display: "inline-block",
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: row["COLOUR"].toLowerCase() === "red" ? "#EF4444" :
                                              row["COLOUR"].toLowerCase() === "blue" ? "#3B82F6" :
                                              row["COLOUR"].toLowerCase() === "green" ? "#10B981" :
                                              row["COLOUR"].toLowerCase() === "black" ? "#1F2937" :
                                              row["COLOUR"].toLowerCase() === "white" ? "#E5E7EB" : "#8B5CF6"
                              }}></span>
                            )}
                            {row["COLOUR"]}
                          </div>
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", color: colors.primary }}>
                          {formatCurrency(row["PRICE"])}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>{row["TOTAL UNITS"]}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: row["FIT STATUS"] === "GS SENT" ? "#e3faf2" : "#fff4e6",
                            color: row["FIT STATUS"] === "GS SENT" ? colors.success : colors.warning,
                            fontWeight: "600",
                            fontSize: "13px"
                          }}>
                            {row["FIT STATUS"]}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>{row["CUSTOMER NAME"]}</td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          {formatDate(row["XFACT DD"])}
                        </td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          {formatDate(row["REAL DD"])}
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: row["LIVE STATUS"] === "DELIVERED" ? "#e3faf2" : 
                                      row["LIVE STATUS"] === "FABRIC ORDERED" ? "#e6f3ff" : "#fff4e6",
                            color: row["LIVE STATUS"] === "DELIVERED" ? colors.success : 
                                 row["LIVE STATUS"] === "FABRIC ORDERED" ? colors.info : colors.warning,
                            fontWeight: "600",
                            fontSize: "13px"
                          }}>
                            {row["LIVE STATUS"]}
                          </span>
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                          {formatCurrency(row["CMT PRICE"])}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                          {formatCurrency(row["ACTUAL CMT"])}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {row["PACKING LIST"] ? (
                            <a
                              href={getGoogleDriveDownloadLink(row["PACKING LIST"])}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                backgroundColor: colors.secondary,
                                color: "white",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                display: "inline-block",
                                minWidth: "100px",
                                textAlign: "center",
                                fontWeight: "600",
                                fontSize: "13px",
                                transition: "all 0.2s",
                                ":hover": {
                                  backgroundColor: "#26a899",
                                  transform: "translateY(-1px)"
                                }
                              }}
                            >
                              Download
                            </a>
                          ) : (
                            <span style={{ fontStyle: "italic", color: colors.textMedium }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: "12px", fontSize: "13px", color: colors.textMedium }}>
                          {compactSizes(row)}
                        </td>
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
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
              background: colors.cardBg,
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              border: `1px solid ${colors.border}`
            }}>
              {Object.keys(fabricFilters).map((key) => (
                <div key={key}>
                  <label style={{
                    display: "block",
                    marginBottom: "10px",
                    fontWeight: "600",
                    color: colors.textDark,
                    fontSize: "14px"
                  }}>
                    {key}
                  </label>
                  <select
                    value={fabricFilters[key] || ""}
                    onChange={(e) => setFabricFilters({ ...fabricFilters, [key]: e.target.value })}
                    style={{
                      padding: "12px 15px",
                      width: "100%",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "8px",
                      backgroundColor: colors.cardBg,
                      fontSize: "14px",
                      cursor: "pointer",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      backgroundSize: "16px",
                      transition: "all 0.2s",
                      ":hover": {
                        borderColor: colors.primary
                      },
                      ":focus": {
                        outline: "none",
                        borderColor: colors.primary,
                        boxShadow: `0 0 0 2px ${colors.primary}20`
                      }
                    }}
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
            <div style={{ 
              overflowX: "auto",
              borderRadius: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              background: colors.cardBg,
              border: `1px solid ${colors.border}`,
              marginBottom: "40px"
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: "14px"
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: colors.headerBg,
                    color: colors.headerText,
                    position: "sticky",
                    top: 0
                  }}>
                    {[
                      "NO.", "DATE", "H-NUMBER", "ORDER REF", "TYPE", 
                      "DESCRIPTION", "COLOUR", "TOTAL", "FABRIC/TRIM PRICE", "FABRIC PO LINKS"
                    ].map(header => (
                      <th key={header} style={{ 
                        padding: "16px",
                        textAlign: "left",
                        fontWeight: "600",
                        borderBottom: `2px solid ${colors.primary}`,
                        whiteSpace: "nowrap"
                      }}>
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFabric.length === 0 ? (
                    <tr>
                      <td colSpan="10" style={{ 
                        padding: "40px", 
                        textAlign: "center",
                        color: colors.textMedium,
                        fontStyle: "italic",
                        backgroundColor: colors.cardBg
                      }}>
                        <div style={{ marginBottom: "15px" }}>
                          ⚠️
                        </div>
                        No matching fabric orders found
                        <div style={{ 
                          fontSize: "13px",
                          marginTop: "10px",
                          color: colors.textMedium
                        }}>
                          Try adjusting your search or filters
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredFabric.map((row, i) => (
                      <tr 
                        key={i} 
                        style={{ 
                          backgroundColor: i % 2 === 0 ? colors.rowEven : colors.rowOdd,
                          transition: "all 0.2s",
                          ":hover": {
                            backgroundColor: "#f0f4f8"
                          }
                        }}
                      >
                        <td style={{ padding: "12px", fontWeight: "600" }}>{row["NO."]}</td>
                        <td style={{ padding: "12px", whiteSpace: "nowrap" }}>
                          {formatDate(row["DATE"])}
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600", color: colors.primary }}>
                          {row["H-NUMBER"]}
                        </td>
                        <td style={{ padding: "12px" }}>{row["ORDER REF"]}</td>
                        <td style={{ padding: "12px" }}>
                          <span style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            background: `${colors.primary}10`,
                            color: colors.primary,
                            fontWeight: "600",
                            fontSize: "13px",
                            display: "inline-block"
                          }}>
                            {row["TYPE"]}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>{row["DESCRIPTION"]}</td>
                        <td style={{ padding: "12px" }}>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px"
                          }}>
                            {row["COLOUR"] && (
                              <span style={{
                                display: "inline-block",
                                width: "12px",
                                height: "12px",
                                borderRadius: "50%",
                                backgroundColor: row["COLOUR"].toLowerCase() === "red" ? "#EF4444" :
                                              row["COLOUR"].toLowerCase() === "blue" ? "#3B82F6" :
                                              row["COLOUR"].toLowerCase() === "green" ? "#10B981" :
                                              row["COLOUR"].toLowerCase() === "black" ? "#1F2937" :
                                              row["COLOUR"].toLowerCase() === "white" ? "#E5E7EB" : "#8B5CF6"
                              }}></span>
                            )}
                            {row["COLOUR"]}
                          </div>
                        </td>
                        <td style={{ padding: "12px", fontWeight: "600" }}>{row["TOTAL"]}</td>
                        <td style={{ padding: "12px", fontWeight: "600", whiteSpace: "nowrap" }}>
                          {formatCurrency(row["FABRIC/TRIM PRICE"])}
                        </td>
                        <td style={{ padding: "12px" }}>
                          {row["FABRIC PO LINKS"] ? (
                            <a
                              href={row["FABRIC PO LINKS"]}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                backgroundColor: colors.secondary,
                                color: "white",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                textDecoration: "none",
                                display: "inline-block",
                                minWidth: "100px",
                                textAlign: "center",
                                fontWeight: "600",
                                fontSize: "13px",
                                transition: "all 0.2s",
                                ":hover": {
                                  backgroundColor: "#26a899",
                                  transform: "translateY(-1px)"
                                }
                              }}
                            >
                              View PO
                            </a>
                          ) : (
                            <span style={{ fontStyle: "italic", color: colors.textMedium }}>No Link</span>
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
          style={{
            position: "fixed",
            left: `${previewImage.position.x}px`,
            top: previewImage.direction === 'below' 
              ? `${previewImage.position.y + 20}px` 
              : 'auto',
            bottom: previewImage.direction === 'above' 
              ? `${window.innerHeight - previewImage.position.y + 20}px` 
              : 'auto',
            zIndex: 1000,
            width: "320px",
            height: "auto",
            pointerEvents: "none",
            backgroundColor: colors.cardBg,
            padding: "15px",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            transform: previewImage.direction === 'above' 
              ? 'translateY(-100%)' 
              : 'none',
            transition: "transform 0.1s ease-out",
            border: `1px solid ${colors.border}`
          }}
        >
          <img 
            src={previewImage.url} 
            alt="Preview" 
            style={{ 
              width: "100%",
              height: "auto",
              maxHeight: "400px",
              objectFit: "contain",
              borderRadius: "6px",
              border: `1px solid ${colors.border}`
            }}
          />
          <div style={{
            position: "absolute",
            top: previewImage.direction === 'above' ? "100%" : "-10px",
            left: "20px",
            width: "20px",
            height: "20px",
            backgroundColor: colors.cardBg,
            transform: previewImage.direction === 'above' 
              ? "rotate(-45deg)" 
              : "rotate(45deg)",
            borderRight: `1px solid ${colors.border}`,
            borderBottom: previewImage.direction === 'above' 
              ? `1px solid ${colors.border}` 
              : 'none',
            borderTop: previewImage.direction === 'above' 
              ? 'none' 
              : `1px solid ${colors.border}`,
            borderLeft: previewImage.direction === 'above' 
              ? 'none' 
              : `1px solid ${colors.border}`,
            zIndex: -1
          }}></div>
        </div>
      )}

      {/* Footer */}
      <div style={{
        background: colors.primary,
        color: colors.textLight,
        padding: "20px 0",
        marginTop: "50px",
        textAlign: "center",
        fontSize: "14px"
      }}>
        <div style={{ 
          maxWidth: "1400px", 
          margin: "0 auto",
          padding: "0 30px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            HIGH5 Production Dashboard © {new Date().getFullYear()}
          </div>
          <div style={{
            opacity: 0.8,
            fontSize: "13px"
          }}>
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Add some global styles */}
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * {
          box-sizing: border-box;
        }
        
        body {
          margin: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        input, select, button {
          font-family: inherit;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </div>
  );
}

export default App;