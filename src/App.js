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
  const [loading, setLoading] = useState(false);
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
    direction: 'below' // 'above' or 'below'
  });

  // Color scheme
  const colors = {
    primary: "#2c3e50",
    secondary: "#3498db",
    background: "#f8f9fa",
    headerBg: "#2c3e50",
    headerText: "#ffffff",
    rowEven: "#ffffff",
    rowOdd: "#f8f9fa",
    link: "#2980b9",
    activeTab: "#3498db",
    inactiveTab: "#95a5a6",
    actionButton: "#4CAF50"
  };

  // Form links
  const formLinks = {
    development: "https://forms.gle/hq1pgP4rz1BSjiCc6",
    fitStatus: "https://forms.gle/5BxFQWWTubZTq21g9",
    insertPattern: "https://forms.gle/LBQwrpMjJuFzLTsC8"
  };

  // Load data
  useEffect(() => {
    setLoading(true);
    setError(null);

    window.jsonpCallback = (fetched) => {
      setData({
        sales_po: fetched.sales_po || [],
        fabric_po: fetched.fabric_po || [],
        insert_pattern: fetched.insert_pattern || []
      });
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

  // Utility functions
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString();
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

  // Image hover handling
  const handleMouseEnter = (imageUrl, e) => {
    const windowHeight = window.innerHeight;
    const mouseY = e.clientY;
    const showAbove = mouseY > windowHeight * 0.7; // Show above if in bottom 30% of screen
    
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

  const handleMouseMove = (e) => {
    if (previewImage.visible) {
      setPreviewImage(prev => ({
        ...prev,
        position: { x: e.clientX + 20, y: e.clientY + 20 }
      }));
    }
  };

  // Excel export
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
    } else { // Only fabric PO remains
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

  // Filtered data
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

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Loading data...</div>;
  if (error) return <div style={{ padding: "20px", color: "red" }}>Error: {error}</div>;

  return (
    <div 
      style={{ padding: "20px", fontFamily: "Arial, sans-serif", backgroundColor: colors.background, minHeight: "100vh" }}
      onMouseMove={handleMouseMove}
    >
      {/* Form Buttons Row */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        gap: "15px", 
        marginBottom: "20px",
        flexWrap: "wrap"
      }}>
        <a
          href={formLinks.development}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: colors.secondary,
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            textDecoration: "none",
            fontWeight: "bold",
            textAlign: "center",
            minWidth: "180px"
          }}
        >
          Development Form
        </a>
        <a
          href={formLinks.fitStatus}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: colors.secondary,
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            textDecoration: "none",
            fontWeight: "bold",
            textAlign: "center",
            minWidth: "180px"
          }}
        >
          Fit Status Form
        </a>
        <a
          href={formLinks.insertPattern}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: colors.secondary,
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            textDecoration: "none",
            fontWeight: "bold",
            textAlign: "center",
            minWidth: "180px"
          }}
        >
          Insert Pattern Form
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", marginBottom: "20px" }}>
        <button onClick={() => setActiveTab("dashboard")} style={{
          padding: "10px 20px",
          backgroundColor: activeTab === "dashboard" ? colors.activeTab : colors.inactiveTab,
          color: "white",
          border: "none",
          cursor: "pointer",
          marginRight: "5px",
          borderRadius: "5px 5px 0 0"
        }}>
          Sales PO
        </button>
        <button onClick={() => setActiveTab("fabric")} style={{
          padding: "10px 20px",
          backgroundColor: activeTab === "fabric" ? colors.activeTab : colors.inactiveTab,
          color: "white",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px 5px 0 0"
        }}>
          Fabric PO
        </button>
      </div>

      {/* Search and Export */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", gap: "20px" }}>
        <input
          placeholder="Search anything..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "12px",
            width: "60%",
            border: `1px solid ${colors.secondary}`,
            borderRadius: "5px",
            fontSize: "16px"
          }}
        />
        <button
          onClick={exportToExcel}
          style={{
            backgroundColor: colors.actionButton,
            color: "white",
            padding: "12px 20px",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Export to Excel
        </button>
      </div>

      {/* Sales PO Tab */}
      {activeTab === "dashboard" && (
        <>
          <div style={{
            display: "flex",
            gap: "15px",
            marginBottom: "25px",
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
            {Object.keys(filters).map((key) => (
              <div key={key} style={{ minWidth: "200px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "5px",
                  fontWeight: "bold",
                  color: colors.primary
                }}>{key}</label>
                <select
                  value={filters[key]}
                  onChange={(e) => setFilters({ ...filters, [key]: e.target.value })}
                  style={{
                    padding: "10px",
                    width: "100%",
                    border: `1px solid ${colors.secondary}`,
                    borderRadius: "5px",
                    backgroundColor: "white"
                  }}
                >
                  <option value="">All {key}</option>
                  {[...new Set(data.sales_po.map(item => item[key]).filter(Boolean))].map((value, i) => (
                    <option key={i} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div style={{ overflowX: "auto", boxShadow: "0 0 10px rgba(0,0,0,0.1)", borderRadius: "5px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", backgroundColor: "white" }}>
              <thead>
                <tr style={{ backgroundColor: colors.headerBg, color: colors.headerText }}>
                  <th style={{ padding: "15px" }}>IMAGE</th>
                  <th style={{ padding: "15px" }}>H-NUMBER</th>
                  <th style={{ padding: "15px" }}>PO NUMBER</th>
                  <th style={{ padding: "15px" }}>STYLE NUMBER</th>
                  <th style={{ padding: "15px" }}>DESCRIPTION</th>
                  <th style={{ padding: "15px" }}>COLOUR</th>
                  <th style={{ padding: "15px" }}>PRICE</th>
                  <th style={{ padding: "15px" }}>TOTAL UNITS</th>
                  <th style={{ padding: "15px" }}>FIT STATUS</th>
                  <th style={{ padding: "15px" }}>CUSTOMER NAME</th>
                  <th style={{ padding: "15px" }}>XFACT DD</th>
                  <th style={{ padding: "15px" }}>REAL DD</th>
                  <th style={{ padding: "15px" }}>LIVE STATUS</th>
                  <th style={{ padding: "15px" }}>CMT PRICE</th>
                  <th style={{ padding: "15px" }}>ACTUAL CMT</th>
                  <th style={{ padding: "15px" }}>PACKING LIST</th>
                  <th style={{ padding: "15px" }}>SIZES</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length === 0 ? (
                  <tr><td colSpan="17" style={{ padding: "20px", textAlign: "center" }}>No data available</td></tr>
                ) : (
                  filteredSales.map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? colors.rowEven : colors.rowOdd }}>
                      <td style={{ padding: "0", width: "120px", height: "80px" }}>
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
                                  objectFit: "contain",
                                  display: "block",
                                  cursor: "pointer"
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
                            backgroundColor: "#f5f5f5"
                          }}>
                            No Image
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>{row["H-NUMBER"]}</td>
                      <td style={{ padding: "12px" }}>{row["PO NUMBER"]}</td>
                      <td style={{ padding: "12px" }}>{row["STYLE NUMBER"]}</td>
                      <td style={{ padding: "12px" }}>{row["DESCRIPTION"]}</td>
                      <td style={{ padding: "12px" }}>{row["COLOUR"]}</td>
                      <td style={{ padding: "12px" }}>{formatCurrency(row["PRICE"])}</td>
                      <td style={{ padding: "12px" }}>{row["TOTAL UNITS"]}</td>
                      <td style={{ padding: "12px" }}>{row["FIT STATUS"]}</td>
                      <td style={{ padding: "12px" }}>{row["CUSTOMER NAME"]}</td>
                      <td style={{ padding: "12px" }}>{formatDate(row["XFACT DD"])}</td>
                      <td style={{ padding: "12px" }}>{formatDate(row["REAL DD"])}</td>
                      <td style={{ padding: "12px" }}>{row["LIVE STATUS"]}</td>
                      <td style={{ padding: "12px" }}>{formatCurrency(row["CMT PRICE"])}</td>
                      <td style={{ padding: "12px" }}>{formatCurrency(row["ACTUAL CMT"])}</td>
                      <td style={{ padding: "12px" }}>
                        {row["PACKING LIST"] ? (
                          <a
                            href={getGoogleDriveDownloadLink(row["PACKING LIST"])}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: colors.actionButton,
                              color: "white",
                              padding: "8px 16px",
                              borderRadius: "4px",
                              textDecoration: "none",
                              display: "inline-block",
                              minWidth: "120px",
                              textAlign: "center",
                              fontWeight: "bold"
                            }}
                          >
                            Download
                          </a>
                        ) : (
                          <span style={{ fontStyle: "italic" }}>N/A</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>{compactSizes(row)}</td>
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
          <div style={{ display: "flex", gap: "15px", marginBottom: "25px", flexWrap: "wrap", justifyContent: "center" }}>
            {Object.keys(fabricFilters).map((key) => (
              <div key={key} style={{ minWidth: "200px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: colors.primary }}>{key}</label>
                <select
                  value={fabricFilters[key] || ""}
                  onChange={(e) => setFabricFilters({ ...fabricFilters, [key]: e.target.value })}
                  style={{ padding: "10px", width: "100%", border: `1px solid ${colors.secondary}`, borderRadius: "5px", backgroundColor: "white" }}
                >
                  <option value="">All {key}</option>
                  {[...new Set(data.fabric_po.map(item => item[key]).filter(Boolean))].map((value, i) => (
                    <option key={i} value={value}>{value}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <div style={{ overflowX: "auto", boxShadow: "0 0 10px rgba(0,0,0,0.1)", borderRadius: "5px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", backgroundColor: "white" }}>
              <thead>
                <tr style={{ backgroundColor: colors.headerBg, color: colors.headerText }}>
                  <th style={{ padding: "15px" }}>NO.</th>
                  <th style={{ padding: "15px" }}>DATE</th>
                  <th style={{ padding: "15px" }}>H-NUMBER</th>
                  <th style={{ padding: "15px" }}>ORDER REF</th>
                  <th style={{ padding: "15px" }}>TYPE</th>
                  <th style={{ padding: "15px" }}>DESCRIPTION</th>
                  <th style={{ padding: "15px" }}>COLOUR</th>
                  <th style={{ padding: "15px" }}>TOTAL</th>
                  <th style={{ padding: "15px" }}>FABRIC/TRIM PRICE</th>
                  <th style={{ padding: "15px" }}>FABRIC PO LINK</th>
                </tr>
              </thead>
              <tbody>
                {filteredFabric.length === 0 ? (
                  <tr><td colSpan="10" style={{ padding: "20px", textAlign: "center" }}>No data available</td></tr>
                ) : (
                  filteredFabric.map((row, i) => (
                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? colors.rowEven : colors.rowOdd }}>
                      <td style={{ padding: "12px" }}>{row["NO."]}</td>
                      <td style={{ padding: "12px" }}>{formatDate(row["DATE"])}</td>
                      <td style={{ padding: "12px" }}>{row["H-NUMBER"]}</td>
                      <td style={{ padding: "12px" }}>{row["ORDER REF"]}</td>
                      <td style={{ padding: "12px" }}>{row["TYPE"]}</td>
                      <td style={{ padding: "12px" }}>{row["DESCRIPTION"]}</td>
                      <td style={{ padding: "12px" }}>{row["COLOUR"]}</td>
                      <td style={{ padding: "12px" }}>{row["TOTAL"]}</td>
                      <td style={{ padding: "12px" }}>{formatCurrency(row["FABRIC/TRIM PRICE"])}</td>
                      <td style={{ padding: "12px" }}>
                        {row["FABRIC PO LINKS"] ? (
                          <a
                            href={row["FABRIC PO LINKS"]}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              backgroundColor: colors.actionButton,
                              color: "white",
                              padding: "8px 16px",
                              borderRadius: "4px",
                              textDecoration: "none",
                              display: "inline-block",
                              minWidth: "120px",
                              textAlign: "center",
                              fontWeight: "bold"
                            }}
                          >
                            View PO
                          </a>
                        ) : "No Link"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Image Preview */}
      {previewImage.visible && (
        <div 
          style={{
            position: "fixed",
            left: `${previewImage.position.x}px`,
            top: previewImage.direction === 'below' 
              ? `${previewImage.position.y}px` 
              : 'auto',
            bottom: previewImage.direction === 'above' 
              ? `${window.innerHeight - previewImage.position.y}px` 
              : 'auto',
            zIndex: 1000,
            width: "25vw",
            height: "auto",
            pointerEvents: "none",
            backgroundColor: "white",
            padding: "10px",
            borderRadius: "5px",
            boxShadow: "0 0 10px rgba(0,0,0,0.3)",
            transform: previewImage.direction === 'above' 
              ? 'translateY(-100%)' 
              : 'none'
          }}
        >
          <img 
            src={previewImage.url} 
            alt="Preview" 
            style={{ 
              width: "100%",
              height: "auto",
              maxHeight: "60vh",
              objectFit: "contain"
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;