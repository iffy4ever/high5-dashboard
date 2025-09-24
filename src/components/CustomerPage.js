import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiAlertCircle } from 'react-icons/fi';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { Navigate } from 'react-router-dom';
import { useData } from '../useData';
import { getGoogleDriveThumbnail, formatDate, getDateValue, formatCurrency } from '../utils/index';
import '../styles.css';

const CustomerPage = () => {
  const { data, loading, error } = useData();
  const [activeTab, setActiveTab] = useState("developments");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    TYPE: "",
    COLOUR: "",
    "LIVE STATUS": "",
    "FIT STATUS": "",
    "CUSTOMER NAME": "",
    "FIT SAMPLE": ""
  });
  const [previewImage, setPreviewImage] = useState({
    url: null,
    visible: false,
    position: { x: 0, y: 0 },
    direction: 'below'
  });
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

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
      .filter(row => !filters.COLOUR || (row["COLOUR"] || "").toLowerCase() === filters.COLOUR.toLowerCase())
      .filter(row => !filters["LIVE STATUS"] || (row["LIVE STATUS"] || "").toLowerCase() === filters["LIVE STATUS"].toLowerCase())
      .filter(row => !filters["FIT STATUS"] || (row["FIT STATUS"] || "").toLowerCase() === filters["FIT STATUS"].toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .sort((a, b) => getDateValue(b["XFACT DD"]) - getDateValue(a["XFACT DD"]));
  }, [data.sales_po, search, filters]);

  const filteredDevelopments = useMemo(() => {
    if (!data.insert_pattern) return [];
    
    return data.insert_pattern
      .filter(row => {
        const searchLower = search.toLowerCase();
        return Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        );
      })
      .filter(row => !filters["STYLE TYPE"] || (row["STYLE TYPE"] || "").toLowerCase() === filters["STYLE TYPE"].toLowerCase())
      .filter(row => !filters["CUSTOMER NAME"] || (row["CUSTOMER NAME"] || "").toLowerCase() === filters["CUSTOMER NAME"].toLowerCase())
      .filter(row => !filters["FIT SAMPLE"] || (row["FIT SAMPLE"] || "").toLowerCase() === filters["FIT SAMPLE"].toLowerCase())
      .sort((a, b) => getDateValue(b["Timestamp"]) - getDateValue(a["Timestamp"]));
  }, [data.insert_pattern, search, filters]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(getAuth(), (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  if (loadingAuth) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <FiAlertCircle size={28} className="spin" />
          <div>Checking authentication...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="app-header">
          <div className="header-left">
            <h1 className="app-title">PD & KAIIA Dashboard</h1>
          </div>
          <div className="header-center">
            <div className="tab-container">
              <div className="tabs">
                {[
                  { key: "developments", label: "Developments" },
                  { key: "sales", label: "Sales PO" }
                ].map(tab => (
                  <button
                    key={tab.key}
                    className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="header-right">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="action-button dark-mode-toggle"
            >
              {darkMode ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button
              onClick={() => getAuth().signOut()}
              className="action-button logout-button"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="main-content" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="search-box-container">
            <div className="search-box">
              <FiSearch size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                aria-label="Search developments or sales"
              />
            </div>
          </div>

          <div className="filter-container no-print">
            {activeTab === "sales" && (
              <div className="filter-row">
                {[
                  { key: "TYPE", label: "Type", options: [...new Set(data.sales_po?.map(row => row["TYPE"]).filter(Boolean))] },
                  { key: "COLOUR", label: "Colour", options: [...new Set(data.sales_po?.map(row => row["COLOUR"]).filter(Boolean))] },
                  { key: "LIVE STATUS", label: "Live Status", options: [...new Set(data.sales_po?.map(row => row["LIVE STATUS"]).filter(Boolean))] },
                  { key: "FIT STATUS", label: "Fit Status", options: [...new Set(data.sales_po?.map(row => row["FIT STATUS"]).filter(Boolean))] },
                  { key: "CUSTOMER NAME", label: "Customer Name", options: [...new Set(data.sales_po?.map(row => row["CUSTOMER NAME"]).filter(Boolean))] }
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

          {loading && (
            <div className="loading-screen">
              <div className="loading-content">
                <FiAlertCircle size={28} className="spin" />
                <div>Loading Dashboard...</div>
              </div>
            </div>
          )}

          {error && (
            <div className="error-screen">
              <div className="error-content">
                <FiAlertCircle size={28} className="error-icon" />
                <h2>Error Loading Data</h2>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <div className="table-container">
              {activeTab === "developments" && (
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
                        { label: "TIMESTAMP" },
                        { label: "H-NUMBER" },
                        { label: "CUSTOMER NAME" },
                        { label: "STYLE TYPE" },
                        { label: "CUSTOMER CODE" },
                        { label: "FRONT IMAGE" },
                        { label: "BACK IMAGE" },
                        { label: "SIDE IMAGE" },
                        { label: "FIT SAMPLE" },
                        { label: "CMT PRICE" },
                        { label: "TOTAL GARMENT PRICE" }
                      ].map((header, index) => (
                        <th key={index}>
                          <div className="header-content">{header.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevelopments.length === 0 ? (
                      <tr className="empty-state">
                        <td colSpan="11">
                          <div className="empty-content">
                            <FiAlertCircle size={28} />
                            <div>No Matching Developments Found</div>
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
                              <div>
                                <a href={row["FRONT IMAGE"]} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={getGoogleDriveThumbnail(row["FRONT IMAGE"])}
                                    alt="Front"
                                    className="product-image"
                                    loading="eager"
                                    onError={(e) => {
                                      console.error("DevelopmentsTable front image failed to load:", {
                                        url: row["FRONT IMAGE"],
                                        message: e.message,
                                        rowData: row
                                      });
                                      e.target.src = "/fallback-image.png";
                                    }}
                                  />
                                </a>
                              </div>
                            ) : (
                              <div className="no-image">No Image</div>
                            )}
                          </td>
                          <td className="image-cell">
                            {row["BACK IMAGE"] ? (
                              <div>
                                <a href={row["BACK IMAGE"]} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={getGoogleDriveThumbnail(row["BACK IMAGE"])}
                                    alt="Back"
                                    className="product-image"
                                    loading="eager"
                                    onError={(e) => {
                                      console.error("DevelopmentsTable back image failed to load:", {
                                        url: row["BACK IMAGE"],
                                        message: e.message,
                                        rowData: row
                                      });
                                      e.target.src = "/fallback-image.png";
                                    }}
                                  />
                                </a>
                              </div>
                            ) : (
                              <div className="no-image">No Image</div>
                            )}
                          </td>
                          <td className="image-cell">
                            {row["SIDE IMAGE"] ? (
                              <div>
                                <a href={row["SIDE IMAGE"]} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={getGoogleDriveThumbnail(row["SIDE IMAGE"])}
                                    alt="Side"
                                    className="product-image"
                                    loading="eager"
                                    onError={(e) => {
                                      console.error("DevelopmentsTable side image failed to load:", {
                                        url: row["SIDE IMAGE"],
                                        message: e.message,
                                        rowData: row
                                      });
                                      e.target.src = "/fallback-image.png";
                                    }}
                                  />
                                </a>
                              </div>
                            ) : (
                              <div className="no-image">No Image</div>
                            )}
                          </td>
                          <td>{row["FIT SAMPLE"] || "N/A"}</td>
                          <td className="price-cell nowrap bold-cell">{formatCurrency(row["CMT PRICE"])}</td>
                          <td className="price-cell nowrap bold-cell">
                            {row["COSTING LINK"] ? (
                              <a 
                                href={row["COSTING LINK"]} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                style={{ color: 'inherit' }}
                              >
                                {formatCurrency(row["TOTAL GARMENT PRICE"])}
                              </a>
                            ) : (
                              formatCurrency(row["TOTAL GARMENT PRICE"])
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
              {activeTab === "sales" && (
                <table className="data-table">
                  <thead>
                    <tr>
                      {[
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
                          <div className="header-content">{header.label}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.length === 0 ? (
                      <tr className="empty-state">
                        <td colSpan="10">
                          <div className="empty-content">
                            <FiAlertCircle size={28} />
                            <div>No Matching Sales Found</div>
                            <p>Try Adjusting Your Search Or Filters</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSales.map((row, i) => (
                        <tr key={i}>
                          <td>
                            <span className="status-text" data-status={row["FIT STATUS"]}>{row["FIT STATUS"]}</span>
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
                            <span className="status-text" data-status={row["LIVE STATUS"]}>{row["LIVE STATUS"]}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

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
        </div>

        <footer className="app-footer no-print">
          <div className="footer-content">
            <div>PD & KAIIA Dashboard © {new Date().getFullYear()}</div>
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
};

CustomerPage.propTypes = {
  data: PropTypes.shape({
    sales_po: PropTypes.arrayOf(PropTypes.object),
    insert_pattern: PropTypes.arrayOf(PropTypes.object)
  })
};

export default CustomerPage;