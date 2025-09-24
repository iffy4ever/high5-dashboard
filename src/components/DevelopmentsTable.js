import React from 'react';
import { FiAlertCircle, FiImage, FiDollarSign } from 'react-icons/fi';

const DevelopmentsTable = ({
  data,
  colors,
  getGoogleDriveThumbnail,
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
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {[
                { label: "TIMESTAMP" },
                { label: "H-NUMBER" },
                { label: "CUSTOMER NAME" },
                { label: "STYLE TYPE" },
                { label: "CUSTOMER CODE" },
                { label: "FRONT IMAGE", icon: <FiImage size={14} /> },
                { label: "BACK IMAGE", icon: <FiImage size={14} /> },
                { label: "SIDE IMAGE", icon: <FiImage size={14} /> },
                { label: "FIT SAMPLE" },
                { label: "CMT PRICE", icon: <FiDollarSign size={14} /> },
                { label: "TOTAL GARMENT PRICE", icon: <FiDollarSign size={14} /> }
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
                    <div>No Matching Developments Found</div>
                    <p>Try Adjusting Your Search Or Filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr key={i}>
                  <td className="nowrap">{formatDate(row["Timestamp"])}</td>
                  <td className="highlight-cell">{row["H-NUMBER"]}</td>
                  <td>{row["CUSTOMER NAME"] || "N/A"}</td>
                  <td>{row["STYLE TYPE"]}</td>
                  <td>{row["CUSTOMER CODE"] || "N/A"}</td>
                  <td className="image-cell">
                    {row["FRONT IMAGE"] ? (
                      <div>
                        <a href={row["FRONT IMAGE"]} target="_blank" rel="noopener noreferrer" aria-label="View front image">
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
                        <a href={row["BACK IMAGE"]} target="_blank" rel="noopener noreferrer" aria-label="View back image">
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
                        <a href={row["SIDE IMAGE"]} target="_blank" rel="noopener noreferrer" aria-label="View side image">
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

export default DevelopmentsTable;