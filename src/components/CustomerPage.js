import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiSearch, FiAlertCircle, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
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
  if (!url) {
    console.warn("No URL provided for thumbnail");
    return "/fallback-image.png";
  }
  try {
    const fileId = url.match(/\/file\/d\/([^/]+)/)?.[1] || url.match(/id=([^&]+)/)?.[1];
    if (!fileId) {
      console.warn("No valid file ID found in URL:", url);
      return "/fallback-image.png";
    }
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w200`;
    console.log("Generated thumbnail URL:", thumbnailUrl);
    return thumbnailUrl;
  } catch (e) {
    console.error("Error generating thumbnail URL:", e.message, "URL:", url);
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
    <div className="customer-page">
      <h1>PD & KAIIA Dashboard</h1>

      <div className="tab-container">
        <div className="tabs">
          <button
            onClick={() => setActiveTab("developments")}
            className={`tab-button ${activeTab === "developments" ? 'active' : ''}`}
          >
            All Developments
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`tab-button ${activeTab === "orders" ? 'active' : ''}`}
          >
            All Order Status
          </button>
        </div>
      </div>

      <div className="search-filter-container">
        <div className="search-box">
          <FiSearch className="search-icon" size={16} />
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
            aria-label="Search"
          />
        </div>
      </div>

      {activeTab === "developments" && (
        <>
          <div className="filter-grid">
            <div className="filter-item">
              <label className="filter-label">Customer Name</label>
              <select
                value={customerNameFilter}
                onChange={(e) => setCustomerNameFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All</option>
                <option value="Public Desire">Public Desire</option>
                <option value="Kaiia">Kaiia</option>
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
                {[...new Set(data.insert_pattern.map(item => item["FIT SAMPLE"]).filter(Boolean))].sort().map((value, i) => (
                  <option key={i} value={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>H-NUMBER</th>
                  <th>CUSTOMER NAME</th>
                  <th>CUSTOMER CODE</th>
                  <th>FRONT IMAGE</th>
                  <th>BACK IMAGE</th>
                  <th>SIDE IMAGE</th>
                  <th>FIT SAMPLE</th>
                  <th>COST PRICE</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevelopments.length === 0 ? (
                  <tr className="empty-state">
                    <td colSpan="9">
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
                      <td>{row["CUSTOMER CODE"] || "N/A"}</td>
                      <td className="image-cell">
                        {row["FRONT IMAGE"] ? (
                          <img
                            src={getGoogleDriveThumbnail(row["FRONT IMAGE"])}
                            alt="Front"
                            className="product-image"
                            loading="lazy"
                            onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Front image failed to load:", row["FRONT IMAGE"]); }}
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
                            onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Back image failed to load:", row["BACK IMAGE"]); }}
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
                            onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Side image failed to load:", row["SIDE IMAGE"]); }}
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </td>
                      <td>{row["FIT SAMPLE"] || "N/A"}</td>
                      <td className="price-cell nowrap bold-cell cost-price">{formatCurrency(row["TOTAL GARMENT PRICE"])}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === "orders" && (
        <>
          <div className="filter-grid">
            <div className="filter-item">
              <label className="filter-label">LIVE STATUS</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="">All</option>
                {[...new Set(data.sales_po.map(item => item["LIVE STATUS"]).filter(Boolean))].sort().map((value, i) => (
                  <option key={i} value={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>IMAGE</th>
                  <th>FIT STATUS</th>
                  <th>H-NUMBER</th>
                  <th>CUSTOMER NAME</th>
                  <th>PO NUMBER</th>
                  <th>STYLE NUMBER</th>
                  <th>DESCRIPTION</th>
                  <th>TOTAL UNITS</th>
                  <th>XFACT DD</th>
                  <th>REAL DD</th>
                  <th>LIVE STATUS</th>
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
                            onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Order image failed to load:", row.IMAGE); }}
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
        </>
      )}
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