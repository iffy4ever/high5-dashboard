// src/components/FabricTable.js
import React from 'react';
import { FiAlertCircle, FiImage, FiDollarSign } from 'react-icons/fi';
import { getColorCode } from '../utils/index';

const FabricTable = ({
  data,
  fabricFilters,
  setFabricFilters,
  colors,
  handleMouseEnter,
  handleMouseLeave,
  getGoogleDriveThumbnail,
  getMatchingSalesImage,
  formatCurrency,
  formatDate,
  currentPage,
  setCurrentPage,
  totalItems,
  itemsPerPage
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <>
      <div className="filter-grid">
        {Object.keys(fabricFilters).map((key) => (
          <div key={key} className="filter-item">
            <label className="filter-label">{key}</label>
            <select
              value={fabricFilters[key] || ""}
              onChange={(e) => setFabricFilters({ ...fabricFilters, [key]: e.target.value })}
              className="filter-select"
              aria-label={`Filter by ${key}`}
            >
              <option value="">All {key}</option>
              {[...new Set(data.map(item => item[key]).filter(Boolean))].sort().map((value, i) => (
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
            {data.length === 0 ? (
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
              data.map((row, i) => (
                <tr key={i}>
                  <td className="bold-cell">{row["NO."]}</td>
                  <td className="image-cell">
                    {getMatchingSalesImage(row["ORDER REF"]) ? (
                      <div 
                        onMouseEnter={(e) => handleMouseEnter(getMatchingSalesImage(row["ORDER REF"]), e)}
                        onMouseLeave={handleMouseLeave}
                      >
                        <a href={getMatchingSalesImage(row["ORDER REF"])} target="_blank" rel="noopener noreferrer" aria-label="View product image">
                          <img
                            src={getGoogleDriveThumbnail(getMatchingSalesImage(row["ORDER REF"]))}
                            alt="Product"
                            className="product-image"
                            loading="lazy"
                          />
                        </a>
                      </div>
                    ) : (
                      <div className="no-image">No Image</div>
                    )}
                  </td>
                  <td className="nowrap">{formatDate(row["DATE"])}</td>
                  <td className="highlight-cell">{row["H-NUMBER"]}</td>
                  <td>{row["ORDER REF"]}</td>
                  <td>
                    <span className="type-badge">{row["TYPE"]}</span>
                  </td>
                  <td>{row["DESCRIPTION"]}</td>
                  <td>
                    <div className="color-cell">
                      {row["COLOUR"] && (
                        <span 
                          className="color-dot" 
                          style={{ backgroundColor: getColorCode(row["COLOUR"]) }}
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
                        aria-label="View fabric PO"
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

      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-button"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span aria-live="polite">{`Page ${currentPage} of ${totalPages}`}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-button"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
};

export default FabricTable;