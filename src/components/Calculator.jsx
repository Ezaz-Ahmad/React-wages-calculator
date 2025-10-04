import React, { useEffect, useMemo, useRef, useState } from "react";
import { days } from "../constants/days.js";
import ShiftDay from "./ShiftDay.jsx";
import ResultModal from "./ResultModal.jsx";
import WaveOverlay from "./WaveOverlay.jsx";
import { generatePdf } from "../utils/pdf.js";

const initWageDetails = () =>
  days.map((day) => ({
    day,
    enabled: false,
    shifts: [{ startTime: null, endTime: null, location: "Gosford" }],
  }));

export default function Calculator() {
  const [wageDetails, setWageDetails] = useState(initWageDetails);
  const [showOverlay, setShowOverlay] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const formRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    date: "",
    employeeName: "",
    employeeAddress: "",
    weekdayRate: "",
    weekendRate: "",
    fuelCost: "",
    others: "",
    expenseExplanation: "",
    taxAmount: "",
    pouchDay: "",
    pouchDate: "",
    closingAmount: "",
  });

  // Restore from localStorage (shifts only) + backfill enabled flag
  useEffect(() => {
    const saved = localStorage.getItem("wageDetails");
    if (saved) {
      const parsed = JSON.parse(saved).map((d) => ({
        ...d,
        enabled:
          typeof d.enabled === "boolean"
            ? d.enabled
            : d.shifts?.some((s) => s.startTime || s.endTime) || false,
        shifts:
          d.shifts?.length
            ? d.shifts
            : [{ startTime: null, endTime: null, location: "Gosford" }],
      }));
      setWageDetails(parsed);
    }
  }, []);

  // Persist shifts to localStorage
  useEffect(() => {
    localStorage.setItem("wageDetails", JSON.stringify(wageDetails));
  }, [wageDetails]);

  const handleFormChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(":").map(Number);
    let [eH, eM] = end.split(":").map(Number);
    if (eH < sH || (eH === sH && eM < sM)) eH += 24; // overnight
    return (eH * 60 + eM - (sH * 60 + sM)) / 60;
  };

  const getHourlyRate = (dayName, startTime) => {
    const isWeekend =
      dayName === "Friday" ||
      dayName === "Saturday" ||
      (dayName === "Sunday" &&
        (!startTime || parseInt(startTime.split(":")[0], 10) < 6));
    const r = isWeekend
      ? parseFloat(form.weekendRate || 0)
      : parseFloat(form.weekdayRate || 0);
    return isNaN(r) ? 0 : r;
  };

  const totals = useMemo(() => {
    let totalHours = 0;
    let totalFuelCost = 0;
    let grandTotalWages = 0;

    wageDetails.forEach((dayObj) => {
      dayObj.shifts.forEach((shift) => {
        if (shift.startTime && shift.endTime) {
          const duration = calculateDuration(shift.startTime, shift.endTime);
          const rate = getHourlyRate(dayObj.day, shift.startTime);
          const earnings = duration * rate;
          totalHours += duration;
          if (shift.location === "Gosford") {
            totalFuelCost += parseFloat(form.fuelCost || 0);
          }
          grandTotalWages += earnings;
        }
      });
    });

    const others = parseFloat(form.others || 0) || 0;
    const taxAmount = parseFloat(form.taxAmount || 0) || 0;
    grandTotalWages += totalFuelCost + others - taxAmount;
    const grandTotalBeforeTax = grandTotalWages + taxAmount;
    const closingAmount = parseFloat(form.closingAmount || 0) || 0;
    const wagesLeftOver = closingAmount - grandTotalWages;

    return {
      totalHours,
      totalFuelCost,
      others,
      taxAmount,
      grandTotalBeforeTax,
      grandTotalWages,
      closingAmount,
      wagesLeftOver,
    };
  }, [wageDetails, form]);

  // Shift handlers
  const toggleDay = (day, checked) => {
    setWageDetails((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        return {
          ...d,
          enabled: checked,
          shifts: checked
            ? d.shifts.length
              ? d.shifts
              : [{ startTime: null, endTime: null, location: "Gosford" }]
            : d.shifts.map(() => ({
                startTime: null,
                endTime: null,
                location: "Gosford",
              })),
        };
      })
    );
  };

  const addShift = (day) => {
    setWageDetails((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        return {
          ...d,
          shifts: [
            ...d.shifts,
            { startTime: null, endTime: null, location: "Gosford" },
          ],
        };
      })
    );
  };

  const removeShift = (day, index) => {
    setWageDetails((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        if (d.shifts.length <= 1) return d;
        const next = d.shifts.slice();
        next.splice(index, 1);
        return { ...d, shifts: next };
      })
    );
  };

  const updateShift = (day, index, field, value) => {
    setWageDetails((prev) =>
      prev.map((d) => {
        if (d.day !== day) return d;
        const next = d.shifts.slice();
        next[index] = { ...next[index], [field]: value };
        return { ...d, shifts: next };
      })
    );
  };

  const onCalculate = () => {
    // use native form validation
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
    setModalOpen(true);
  };

  const clearAll = () => {
    setForm({
      date: "",
      employeeName: "",
      employeeAddress: "",
      weekdayRate: "",
      weekendRate: "",
      fuelCost: "",
      others: "",
      expenseExplanation: "",
      taxAmount: "",
      pouchDay: "",
      pouchDate: "",
      closingAmount: "",
    });
    localStorage.removeItem("wageDetails");
    setWageDetails(initWageDetails());
  };

  const onSavePdf = async () => {
    setShowOverlay(true);
    try {
      await generatePdf(form, wageDetails, totals);
      // After PDF: reset to original behavior
      localStorage.removeItem("wageDetails");
      setWageDetails(initWageDetails());
      clearAll();
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to generate PDF.");
    } finally {
      setShowOverlay(false);
    }
  };

  return (
    <div id="calculator-page" className="screen active" style={{ display: "block" }}>
      <div className="container">
        <h1 className="calculator-title">Wages Calculator</h1>

        <form ref={formRef} className="card" onSubmit={(e) => e.preventDefault()}>
          {/* Employee Details */}
          <div className="form-section">
            <h2>Employee Details</h2>

            <div className="form-group">
              <label htmlFor="date">Date:</label>
              <input
                type="date"
                id="date"
                required
                value={form.date}
                onChange={(e) => handleFormChange("date", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="employee-name">Employee Name:</label>
              <input
                type="text"
                id="employee-name"
                required
                value={form.employeeName}
                onChange={(e) => handleFormChange("employeeName", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="employee-address">Employee Address:</label>
              <input
                type="text"
                id="employee-address"
                value={form.employeeAddress}
                onChange={(e) => handleFormChange("employeeAddress", e.target.value)}
              />
            </div>
          </div>

          {/* Work Schedule */}
          <div className="form-section">
            <h2>Work Schedule</h2>
            <div id="shifts-container">
              {wageDetails.map((d) => (
                <ShiftDay
                  key={d.day}
                  day={d.day}
                  dayData={d}
                  onToggleDay={toggleDay}
                  onAddShift={addShift}
                  onRemoveShift={removeShift}
                  onUpdateShift={updateShift}
                />
              ))}
            </div>
          </div>

          {/* Rates & Expenses */}
          <div className="form-section">
            <h2>Rates & Expenses</h2>

            <div className="form-group">
              <label htmlFor="weekday-rate">Weekday Rate ($):</label>
              <input
                type="number"
                id="weekday-rate"
                step="0.01"
                required
                value={form.weekdayRate}
                onChange={(e) => handleFormChange("weekdayRate", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="weekend-rate">Weekend Rate ($):</label>
              <input
                type="number"
                id="weekend-rate"
                step="0.01"
                required
                value={form.weekendRate}
                onChange={(e) => handleFormChange("weekendRate", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="fuel-cost">Fuel Cost per Day ($):</label>
              <input
                type="number"
                id="fuel-cost"
                step="0.01"
                required
                value={form.fuelCost}
                onChange={(e) => handleFormChange("fuelCost", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="others">Other Expenses ($):</label>
              <input
                type="number"
                id="others"
                step="0.01"
                value={form.others}
                onChange={(e) => handleFormChange("others", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="expense-explanation">Expense Explanation:</label>
              <textarea
                id="expense-explanation"
                disabled={!form.others || form.others === "0"}
                value={form.expenseExplanation}
                onChange={(e) => handleFormChange("expenseExplanation", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="tax-amount">Amount Transferred ($):</label>
              <input
                type="number"
                id="tax-amount"
                step="0.01"
                required
                value={form.taxAmount}
                onChange={(e) => handleFormChange("taxAmount", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pouch-day">Pouch Day:</label>
              <input
                type="text"
                id="pouch-day"
                value={form.pouchDay}
                onChange={(e) => handleFormChange("pouchDay", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pouch-date">Pouch Date:</label>
              <input
                type="date"
                id="pouch-date"
                value={form.pouchDate}
                onChange={(e) => handleFormChange("pouchDate", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="closing-amount">Closing Amount ($):</label>
              <input
                type="number"
                id="closing-amount"
                step="0.01"
                required
                value={form.closingAmount}
                onChange={(e) => handleFormChange("closingAmount", e.target.value)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="buttons">
            <button type="button" onClick={onCalculate} className="btn-primary">
              Calculate
            </button>
            <button type="button" onClick={clearAll} className="btn-secondary">
              Clear
            </button>
          </div>
        </form>

        <footer>Developed by Ezaz Ahmad | Version: 1.1.3V</footer>
      </div>

      {/* Modal + Overlay */}
      <ResultModal
        open={modalOpen}
        data={{
          date: form.date || "",
          employeeName: form.employeeName || "",
          employeeAddress: form.employeeAddress || "",
          totalHours: totals.totalHours || 0,
          totalFuelCost: totals.totalFuelCost || 0,
          others: totals.others || 0,
          grandTotalBeforeTax: totals.grandTotalBeforeTax || 0,
          taxAmount: totals.taxAmount || 0,
          grandTotalWages: totals.grandTotalWages || 0,
          closingAmount: totals.closingAmount || 0,
          wagesLeftOver: totals.wagesLeftOver || 0,
        }}
        onClose={() => setModalOpen(false)}
        onSavePdf={onSavePdf}
      />

      <WaveOverlay show={showOverlay} />
    </div>
  );
}
