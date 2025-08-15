import React from 'react';
import { FiAlertCircle, FiImage, FiDollarSign } from 'react-icons/fi';
import { getColorCode } from '../utils';

const FabricTable = ({
  data,
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
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  return (
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
          {(!paginatedData || paginatedData.length === 0) ? (
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
            paginatedData.map((row, i) => (
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
                          onError={(e) => { e.target.src = "/fallback-image.png"; console.error("Image failed to load:", getMatchingSalesImage(row["ORDER REF"])); }}
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

export default FabricTable;