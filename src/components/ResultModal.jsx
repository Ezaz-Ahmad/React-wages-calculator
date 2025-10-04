import React from "react";

export default function ResultModal({ open, data, onClose, onSavePdf }) {
  if (!open) return null;

  return (
    // Force it visible even though .modal in CSS defaults to display:none
    <div
      id="result-modal"
      className="modal"
      style={{ display: "block" }}
      onClick={onClose}
    >
      <div className="modal-content card" onClick={(e) => e.stopPropagation()}>
        <h2>Total Wages Breakdown</h2>
        <div id="result-content" className="modal-body">
          <p><strong>Date:</strong> {data.date}</p>
          <p><strong>Employee Name:</strong> {data.employeeName}</p>
          <p><strong>Employee Address:</strong> {data.employeeAddress}</p>
          <p><strong>Total Hours Worked:</strong> {data.totalHours.toFixed(2)}</p>
          <p><strong>Fuel Cost:</strong> ${data.totalFuelCost.toFixed(2)}</p>
          <p><strong>Other Expenses:</strong> ${data.others.toFixed(2)}</p>
          <p><strong>Grand Total Wages (Before Transfer):</strong> ${data.grandTotalBeforeTax.toFixed(2)}</p>
          <p><strong>Transferred Amount:</strong> ${data.taxAmount.toFixed(2)}</p>
          <p><strong>Grand Total Wages (After Transfer):</strong> ${data.grandTotalWages.toFixed(2)}</p>
          <p><strong>Closing Amount:</strong> ${data.closingAmount.toFixed(2)}</p>
          <p><strong>Wages Left Over:</strong> ${data.wagesLeftOver.toFixed(2)}</p>
        </div>
        <div className="modal-buttons">
          <button onClick={onClose} className="btn-secondary">OK</button>
          <button onClick={onSavePdf} className="btn-primary">Save as PDF</button>
        </div>
      </div>
    </div>
  );
}
