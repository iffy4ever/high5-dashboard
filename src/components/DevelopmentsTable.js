import React from 'react';
import { FiAlertCircle, FiImage, FiDollarSign, FiExternalLink } from 'react-icons/fi';

const DevelopmentsTable = ({
  data,
  colors,
  handleMouseEnter,
  handleMouseLeave,
  getGoogleDriveThumbnail,
  formatCurrency,
  formatDate,
  currentPage,
  setCurrentPage,
  totalItems,
  itemsPerPage
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
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
          {(!paginatedData || paginatedData.length === 0) ? (
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
            paginatedData.map((row, i) => (
              <tr key={i}>
                <td className="nowrap">{formatDate(row["Timestamp"])}</td>
                <td className="highlight-cell">{row["H-NUMBER"]}</td>
                <td>{row["CUSTOMER NAME"] || "N/A"}</td>
                <td>{row["STYLE TYPE"] || "N/A"}</td>
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
                          onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Front image failed to load:", row["FRONT IMAGE"]); }}
                        />
                      </a>
                    </div>
                  ) : (
                    <div className="no-image">No Image</div>
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
                          onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Back image failed to load:", row["BACK IMAGE"]); }}
                        />
                      </a>
                    </div>
                  ) : (
                    <div className="no-image">No Image</div>
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
                          onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Side image failed to load:", row["SIDE IMAGE"]); }}
                        />
                      </a>
                    </div>
                  ) : (
                    <div className="no-image">No Image</div>
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
                          onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Pattern image failed to load:", row["PATTERN IMAGE"]); }}
                        />
                      </a>
                    </div>
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </td>
                <td>{row["FIT SAMPLE"] || "N/A"}</td>
                <td className="price-cell nowrap bold-cell">{formatCurrency(row["TOTAL COST"])}</td>
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

      {totalPages > 1 && (
        <div className="pagination" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span>{`Page ${currentPage} of ${totalPages}`}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DevelopmentsTable;