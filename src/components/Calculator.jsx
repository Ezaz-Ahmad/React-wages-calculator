import React, { useEffect, useMemo, useRef, useState } from "react";
import { days } from "../constants/days.js";
import ShiftDay from "./ShiftDay.jsx";
import ResultModal from "./ResultModal.jsx";
import WaveOverlay from "./WaveOverlay.jsx";
import { generatePdf } from "../utils/pdf.js";

import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import {
  doc,
  setDoc,
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

const initWageDetails = () =>
  days.map((day) => ({
    day,
    enabled: false,
    shifts: [{ startTime: null, endTime: null, location: "Gosford" }],
  }));

const initForm = {
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
};

export default function Calculator() {
  const { user } = useAuth();
  const [wageDetails, setWageDetails] = useState(initWageDetails);
  const [form, setForm] = useState(initForm);
  const [showOverlay, setShowOverlay] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [fatalError, setFatalError] = useState("");
  const formRef = useRef(null);

  // ---- hydrate-once + timestamps to avoid clobbering local typing ----
  const hydratedRef = useRef(false);
  const lastRemoteUpdatedAtRef = useRef(0);
  const saveTimer = useRef(null);

  const stateDocRef = user ? doc(db, "users", user.uid, "state", "current") : null;

  // Load (hydrate once), then stop overwriting local changes while typing
  useEffect(() => {
    if (!stateDocRef || !user) return;
    let unsub;

    try {
      unsub = onSnapshot(
        stateDocRef,
        async (snap) => {
          if (!snap.exists()) {
            await setDoc(stateDocRef, {
              wageDetails: initWageDetails(),
              form: initForm,
              updatedAt: serverTimestamp(),
            });
            return;
          }

          const data = snap.data() || {};
          const updatedAt = (data.updatedAt?.toMillis && data.updatedAt.toMillis()) || 0;

          // Only hydrate the first time, OR if remote is newer than what we last saw
          if (!hydratedRef.current || updatedAt > lastRemoteUpdatedAtRef.current) {
            hydratedRef.current = true;
            lastRemoteUpdatedAtRef.current = updatedAt;

            setWageDetails(
              (data.wageDetails && data.wageDetails.length
                ? data.wageDetails
                : initWageDetails()
              ).map((d) => ({
                ...d,
                enabled:
                  typeof d.enabled === "boolean"
                    ? d.enabled
                    : d.shifts?.some((s) => s.startTime || s.endTime) || false,
                shifts:
                  d.shifts?.length
                    ? d.shifts
                    : [{ startTime: null, endTime: null, location: "Gosford" }],
              }))
            );
            setForm({ ...initForm, ...(data.form || {}) });
            setFatalError("");
          }
        },
        (err) => {
          console.error("onSnapshot error:", err);
          setFatalError(err.message || "Failed to load user data.");
        }
      );
    } catch (err) {
      console.error("Subscribe error:", err);
      setFatalError(err.message || "Subscription failed.");
    }

    return () => unsub && unsub();
  }, [stateDocRef, user]);

  // ---- Debounced autosave (doesn't rehydrate) ----
  const queueSave = (payload) => {
    if (!stateDocRef) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await setDoc(
          stateDocRef,
          { ...payload, updatedAt: serverTimestamp() },
          { merge: true }
        );
        // we let snapshot update lastRemoteUpdatedAtRef; no need to re-set local state here
      } catch (e) {
        console.error("Auto-save error:", e);
      }
    }, 400);
  };

  useEffect(() => {
    queueSave({ wageDetails });
  }, [wageDetails]);

  useEffect(() => {
    queueSave({ form });
  }, [form]);

  // ---- Flush saves when leaving ----
  const flushSaveNow = async () => {
    if (!stateDocRef) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    try {
      await setDoc(
        stateDocRef,
        { wageDetails, form, updatedAt: serverTimestamp() },
        { merge: true }
      );
    } catch (e) {
      console.error("flushSaveNow failed:", e);
    }
  };

  useEffect(() => {
    const onBeforeUnload = () => flushSaveNow();
    const onHide = () => {
      if (document.visibilityState === "hidden") flushSaveNow();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [stateDocRef, wageDetails, form]);

  // ---- Helpers ----
  const handleFormChange = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(":").map(Number);
    let [eH, eM] = end.split(":").map(Number);
    if (eH < sH || (eH === sH && eM < sM)) eH += 24;
    return (eH * 60 + eM - (sH * 60 + sM)) / 60;
  };

  const getHourlyRate = (dayName, startTime) => {
    const isWeekend =
      dayName === "Friday" ||
      dayName === "Saturday" ||
      (dayName === "Sunday" &&
        (!startTime || parseInt(startTime.split(":")[0], 10) < 6));
    const rate = isWeekend
      ? parseFloat(form.weekendRate || 0)
      : parseFloat(form.weekdayRate || 0);
    return isNaN(rate) ? 0 : rate;
  };

  const totals = useMemo(() => {
    let totalHours = 0;
    let totalFuelCost = 0;
    let grandTotalWages = 0;

    wageDetails.forEach((day) => {
      day.shifts.forEach((shift) => {
        if (shift.startTime && shift.endTime) {
          const hrs = calculateDuration(shift.startTime, shift.endTime);
          const rate = getHourlyRate(day.day, shift.startTime);
          totalHours += hrs;
          grandTotalWages += hrs * rate;
          if (shift.location === "Gosford") {
            totalFuelCost += parseFloat(form.fuelCost || 0);
          }
        }
      });
    });

    const others = parseFloat(form.others || 0) || 0;
    const tax = parseFloat(form.taxAmount || 0) || 0;
    grandTotalWages += totalFuelCost + others - tax;
    const grandBeforeTax = grandTotalWages + tax;
    const closing = parseFloat(form.closingAmount || 0) || 0;
    const leftover = closing - grandTotalWages;

    return {
      totalHours,
      totalFuelCost,
      others,
      taxAmount: tax,
      grandTotalBeforeTax: grandBeforeTax,
      grandTotalWages,
      closingAmount: closing,
      wagesLeftOver: leftover,
    };
  }, [wageDetails, form]);

  // ---- Shift handlers ----
  const toggleDay = (day, checked) =>
    setWageDetails((prev) =>
      prev.map((d) =>
        d.day === day
          ? {
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
            }
          : d
      )
    );

  const addShift = (day) =>
    setWageDetails((p) =>
      p.map((d) =>
        d.day === day
          ? {
              ...d,
              shifts: [
                ...d.shifts,
                { startTime: null, endTime: null, location: "Gosford" },
              ],
            }
          : d
      )
    );

  const removeShift = (day, i) =>
    setWageDetails((p) =>
      p.map((d) => {
        if (d.day !== day) return d;
        if (d.shifts.length <= 1) return d;
        const next = d.shifts.slice();
        next.splice(i, 1);
        return { ...d, shifts: next };
      })
    );

  const updateShift = (day, i, field, val) =>
    setWageDetails((p) =>
      p.map((d) => {
        if (d.day !== day) return d;
        const next = d.shifts.slice();
        next[i] = { ...next[i], [field]: val };
        return { ...d, shifts: next };
      })
    );

  // ---- Actions ----
  const onCalculate = () => {
    if (!formRef.current?.checkValidity()) {
      formRef.current?.reportValidity();
      return;
    }
    hydratedRef.current = true; // keep local lead while modal open
    setModalOpen(true);
  };

  const clearAll = async () => {
    setForm(initForm);
    setWageDetails(initWageDetails());
    if (stateDocRef) {
      await setDoc(
        stateDocRef,
        { form: initForm, wageDetails: initWageDetails(), updatedAt: serverTimestamp() },
        { merge: true }
      );
      lastRemoteUpdatedAtRef.current = Date.now();
    }
  };

  const onSavePdf = async () => {
    setShowOverlay(true);
    try {
      if (user) {
        await addDoc(collection(db, "submissions"), {
          uid: user.uid,
          date: form.date || null,
          employeeName: form.employeeName || "",
          employeeAddress: form.employeeAddress || "",
          wageDetails,
          totals,
          createdAt: serverTimestamp(),
        });
      }
      await generatePdf(form, wageDetails, totals);
      await clearAll();
      setModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Failed to generate/save PDF.");
    } finally {
      setShowOverlay(false);
    }
  };

  // ---- Error fallback ----
  if (fatalError) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <div className="card">
          <h2>Couldn’t load your data</h2>
          <p style={{ color: "crimson" }}>{fatalError}</p>
          <p>Check Firestore rules and your connection.</p>
        </div>
      </div>
    );
  }

  // ---- Render ----
  return (
    <div id="calculator-page" className="screen active" style={{ display: "block" }}>
      <div className="container">
        <h1 className="calculator-title">Wages Calculator</h1>

        <form ref={formRef} className="card" onSubmit={(e) => e.preventDefault()}>
          {/* Employee Details */}
          <div className="form-section">
            <h2>Employee Details</h2>

            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                required
                value={form.date}
                onChange={(e) => handleFormChange("date", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Employee Name:</label>
              <input
                type="text"
                required
                value={form.employeeName}
                onChange={(e) => handleFormChange("employeeName", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Employee Address:</label>
              <input
                type="text"
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
              <label>Weekday Rate ($):</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.weekdayRate}
                onChange={(e) => handleFormChange("weekdayRate", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Weekend Rate ($):</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.weekendRate}
                onChange={(e) => handleFormChange("weekendRate", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Fuel Cost per Day ($):</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.fuelCost}
                onChange={(e) => handleFormChange("fuelCost", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Other Expenses ($):</label>
              <input
                type="number"
                step="0.01"
                value={form.others}
                onChange={(e) => handleFormChange("others", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Expense Explanation:</label>
              <textarea
                disabled={!form.others || form.others === "0"}
                value={form.expenseExplanation}
                onChange={(e) => handleFormChange("expenseExplanation", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Amount Transferred ($):</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.taxAmount}
                onChange={(e) => handleFormChange("taxAmount", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Pouch Day:</label>
              <input
                type="text"
                value={form.pouchDay}
                onChange={(e) => handleFormChange("pouchDay", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Pouch Date:</label>
              <input
                type="date"
                value={form.pouchDate}
                onChange={(e) => handleFormChange("pouchDate", e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Closing Amount ($):</label>
              <input
                type="number"
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
