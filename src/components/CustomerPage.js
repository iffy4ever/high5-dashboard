import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiAlertCircle, FiShoppingBag, FiDollarSign, FiImage, FiExternalLink } from 'react-icons/fi';
import { useData } from '../useData';
import '../styles.css';

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

const getGoogleDriveThumbnail = (url) => {
  if (!url) return "";
  try {
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    if (!fileId) {
      console.warn("No valid file ID found in URL:", url);
      return "/fallback-image.png";
    }
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
  } catch (e) {
    console.error("Error generating thumbnail URL:", e);
    return "/fallback-image.png";
  }
};

const CustomerPage = () => {
  const { data, loading, error } = useData();
  const [activeTab, setActiveTab] = useState("developments");
  const [search, setSearch] = useState("");
  const [customerNameFilter, setCustomerNameFilter] = useState("");
  const [fitSampleFilter, setFitSampleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [darkMode, setDarkMode] = useState(false); // Added darkMode state

  const filteredDevelopments = useMemo(() => {
    if (!data.insert_pattern) return [];
    return data.insert_pattern
      .filter(row => {
        const customer = (row["CUSTOMER NAME"] || "").toLowerCase();
        return customer === "public desire" || customer === "kaiia";
      })
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !customerNameFilter || (row["CUSTOMER NAME"] || "").toLowerCase() === customerNameFilter.toLowerCase())
      .filter(row => !fitSampleFilter || (row["FIT SAMPLE"] || "").toLowerCase() === fitSampleFilter.toLowerCase())
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));
  }, [data.insert_pattern, search, customerNameFilter, fitSampleFilter]);

  const filteredOrders = useMemo(() => {
    if (!data.sales_po) return [];
    return data.sales_po
      .filter(row => row["PO NUMBER"] && row["STYLE NUMBER"] && row["TOTAL UNITS"])
      .filter(row => Object.values(row).join(" ").toLowerCase().includes(search.toLowerCase()))
      .filter(row => !statusFilter || (row["LIVE STATUS"] || "").toLowerCase() === statusFilter.toLowerCase())
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));
  }, [data.sales_po, search, statusFilter]);

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="spinner">
          <FiShoppingBag size={32} className="spin" />
        </div>
        <h2>Loading PD & KAIIA Dashboard</h2>
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
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="main-content">
        <header className="top-nav no-print">
          <div className="nav-left">
            <h1>PD & KAIIA Dashboard</h1>
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
            >
              <span className="toggle-icon">
                {darkMode ? '☀️' : '🌙'}
              </span>
            </button>
          </div>
        </header>

        <div className="content-wrapper no-print">
          <div className="tab-container">
            <div className="tabs">
              {[
                { id: "developments", label: "Developments" },
                { id: "orders", label: "Orders" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="search-filter-container">
            <div className="search-box">
              <FiSearch className="search-icon" size={16} />
              <input
                placeholder="Search H-Numbers, Styles, Colors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            {activeTab === "developments" && (
              <div className="action-buttons">
                <div className="filter-item">
                  <label className="filter-label">Customer Name</label>
                  <select
                    value={customerNameFilter}
                    onChange={(e) => setCustomerNameFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All</option>
                    <option value="public desire">Public Desire</option>
                    <option value="kaiia">Kaiia</option>
                  </select>
                </div>
                <div className="filter-item">
                  <label className="filter-label">Fit Sample</label>
                  <select
                    value={fitSampleFilter}
                    onChange={(e) => setFitSampleFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            )}
            {activeTab === "orders" && (
              <div className="action-buttons">
                <div className="filter-item">
                  <label className="filter-label">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All</option>
                    <option value="delivered">Delivered</option>
                    <option value="in production">In Production</option>
                    <option value="fabric ordered">Fabric Ordered</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {activeTab === "developments" && (
            <div className="tab-content">
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
                              <img
                                src={getGoogleDriveThumbnail(row["FRONT IMAGE"])}
                                alt="Front"
                                className="product-image"
                                loading="lazy"
                                onError={(e) => { e.target.src = "/fallback-image.png"; }}
                              />
                            ) : (
                              <div className="no-image">No Image</div>
                            )}
                          </td>
                          <td className="image-cell">
                            {row["BACK IMAGE"] ? (
                              <img
                                src={getGoogleDriveThumbnail(row["BACK IMAGE"])}
                                alt="Back"
                                className="product-image"
                                loading="lazy"
                                onError={(e) => { e.target.src = "/fallback-image.png"; }}
                              />
                            ) : (
                              <div className="no-image">No Image</div>
                            )}
                          </td>
                          <td className="image-cell">
                            {row["SIDE IMAGE"] ? (
                              <img
                                src={getGoogleDriveThumbnail(row["SIDE IMAGE"])}
                                alt="Side"
                                className="product-image"
                                loading="lazy"
                                onError={(e) => { e.target.src = "/fallback-image.png"; }}
                              />
                            ) : (
                              <div className="no-image">No Image</div>
                            )}
                          </td>
                          <td className="image-cell">
                            {row["PATTERN IMAGE"] ? (
                              <img
                                src={getGoogleDriveThumbnail(row["PATTERN IMAGE"])}
                                alt="Pattern"
                                className="product-image"
                                loading="lazy"
                                onError={(e) => { e.target.src = "/fallback-image.png"; }}
                              />
                            ) : (
                              <div className="no-image">No Image</div>
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
            </div>
          )}
          {activeTab === "orders" && (
            <div className="tab-content">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "IMAGE", icon: <FiImage size={14} /> },
                        { label: "FIT STATUS" },
                        { label: "H-NUMBER" },
                        { label: "CUSTOMER NAME" },
                        { label: "PO NUMBER" },
                        { label: "STYLE NUMBER" },
                        { label: "DESCRIPTION" },
                        { label: "TOTAL UNITS" },
                        { label: "XFACT DD" },
                        { label: "REAL DD" },
                        { label: "LIVE STATUS" }
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
                    {filteredOrders.length === 0 ? (
                      <tr className="empty-state">
                        <td colSpan="11">
                          <div className="empty-content">
                            <FiAlertCircle size={28} />
                            <div>No Matching Orders Found</div>
                            <p>Try Adjusting Your Search Or Filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((row, i) => (
                        <tr key={i}>
                          <td className="image-cell">
                            {row.IMAGE ? (
                              <img
                                src={getGoogleDriveThumbnail(row.IMAGE)}
                                alt="Product"
                                className="product-image"
                                loading="lazy"
                                onError={(e) => { e.target.src = "/fallback-image.png"; }}
                              />
                            ) : (
                              <div className="no-image">No Image</div>
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
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

CustomerPage.propTypes = {
  data: PropTypes.shape({
    sales_po: PropTypes.arrayOf(PropTypes.object),
    insert_pattern: PropTypes.arrayOf(PropTypes.object)
  })
};

export default CustomerPage;