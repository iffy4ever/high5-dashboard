import React from 'react';
import { formatDate, getGoogleDriveThumbnail } from '../utils';

const CuttingSheet = ({ selectedData }) => {
  const totalUnits = selectedData.reduce((sum, row) => sum + parseInt(row["TOTAL UNITS"] || 0), 0);
  const maxPOs = 6;
  const numPOs = Math.min(selectedData.length, maxPOs);
  const paddedData = selectedData.slice(0, numPOs);
  const sizes = ["4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26"];
  const totalBySize = sizes.reduce((acc, size) => {
    acc[size] = selectedData.reduce((sum, row) => sum + parseInt(row[size] || 0), 0);
    return acc;
  }, {});

  return (
    <div className="printable-sheet">
      <div style={{ fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', color: '#dc3545', backgroundColor: '#ffebee', padding: '2mm', borderRadius: '4px', marginBottom: '3mm' }}>CUTTING SHEET</div>

      <div className="delivery-info" style={{ color: '#FF0000' }}>
        Delivery Date: {formatDate(selectedData[0]?.["XFACT DD"] || "")}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2mm', marginBottom: '3mm', overflow: 'hidden', border: '1px solid #000000' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40mm' }}>
            {i < numPOs && paddedData[i].IMAGE ? <img src={getGoogleDriveThumbnail(paddedData[i].IMAGE)} alt={paddedData[i]["DESCRIPTION"]} style={{ width: '100%', height: '100%', objectFit: 'contain' }} loading="lazy" onError={(e) => { e.target.src = "/fallback-image.png"; }} /> : 'No Image'}
          </div>
        ))}
      </div>

      <table className="table">
        <tbody>
          <tr>
            <th style={{ lineHeight: 'fit-content' }}>Fabric Name 1:</th>
            <th style={{ lineHeight: 'fit-content' }}>Fabric Name 2:</th>
            <th style={{ lineHeight: 'fit-content' }}>Fabric Name 3:</th>
            <th style={{ lineHeight: 'fit-content' }}>Binding details</th>
          </tr>
          <tr>
            <td style={{ height: '20mm', lineHeight: 'fit-content' }}></td>
            <td style={{ height: '20mm', lineHeight: 'fit-content' }}></td>
            <td style={{ height: '20mm', lineHeight: 'fit-content' }}></td>
            <td style={{ height: '20mm', lineHeight: 'fit-content' }}></td>
          </tr>
          <tr>
            <td style={{ lineHeight: 'fit-content' }}>Width:</td>
            <td style={{ lineHeight: 'fit-content' }}>Width:</td>
            <td style={{ lineHeight: 'fit-content' }}>Width:</td>
            <td style={{ lineHeight: 'fit-content' }}></td>
          </tr>
        </tbody>
      </table>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: '15%', lineHeight: 'fit-content' }}>PO Number</th>
            <th style={{ width: '25%', lineHeight: 'fit-content' }}>Style #</th>
            <th style={{ width: '20%', lineHeight: 'fit-content' }}>Colour</th>
            <th style={{ width: '10%', lineHeight: 'fit-content' }}>Department</th>
            <th style={{ width: '10%', lineHeight: 'fit-content' }}>Units</th>
            <th style={{ width: '10%', lineHeight: 'fit-content' }}>H Number</th>
            <th style={{ width: '10%', lineHeight: 'fit-content' }}>Type</th>
            <th style={{ width: '10%', lineHeight: 'fit-content' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="main-data red-text" style={{ lineHeight: 'fit-content' }}>{row["PO NUMBER"] || ""}</td>
              <td style={{ lineHeight: 'fit-content' }}>{row["STYLE NUMBER"] || ""}</td>
              <td className="main-data" style={{ lineHeight: 'fit-content' }}>{row["COLOUR"] || ""}</td>
              <td style={{ lineHeight: 'fit-content' }}>{row["DEPARTMENT"] || "-"}</td>
              <td style={{ lineHeight: 'fit-content' }}>{row["TOTAL UNITS"] || ""}</td>
              <td className="red-text" style={{ lineHeight: 'fit-content' }}>{row["H-NUMBER"] || ""}</td>
              <td style={{ lineHeight: 'fit-content' }}>{row["TYPE"] || ""}</td>
              {i === 0 && (
                <td rowSpan={numPOs} className="merged-total" style={{ backgroundColor: '#ffff00', textAlign: 'center', verticalAlign: 'middle', lineHeight: 'fit-content' }}>
                  {totalUnits}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <table className="table sizes-table">
        <colgroup>
          <col style={{ width: '10%' }} />
          <col style={{ width: '15%' }} />
          {sizes.map((_, i) => (
            <col key={i} style={{ width: '5%' }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            <th style={{ lineHeight: 'fit-content' }}>PO Number</th>
            <th style={{ lineHeight: 'fit-content' }}>Colour</th>
            {sizes.map(size => <th key={size} style={{ lineHeight: 'fit-content' }}>{size}</th>)}
          </tr>
        </thead>
        <tbody>
          {paddedData.map((row, i) => (
            <tr key={i}>
              <td className="main-data red-text" style={{ lineHeight: 'fit-content' }}>{row["PO NUMBER"] || ""}</td>
              <td className="main-data" style={{ lineHeight: 'fit-content' }}>{row["COLOUR"] || ""}</td>
              {sizes.map(size => (
                <td key={size} style={{ lineHeight: 'fit-content' }}>{row[size] || ""}</td>
              ))}
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={2} style={{ lineHeight: 'fit-content' }}>Total:</td>
            {sizes.map(size => (
              <td key={size} style={{ lineHeight: 'fit-content' }}>{totalBySize[size]}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <table className="ratio-section">
        <tbody>
          <tr>
            <td style={{ lineHeight: 'fit-content' }}>RATIO:.</td>
          </tr>
          {Array.from({ length: 1 }).map((_, i) => (
            <tr key={i}>
              <td style={{ lineHeight: 'fit-content' }}></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CuttingSheet;