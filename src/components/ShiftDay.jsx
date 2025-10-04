import React from "react";

export default function ShiftDay({
  day,
  dayData,
  onToggleDay,
  onAddShift,
  onRemoveShift,
  onUpdateShift
}) {
  const checked = !!dayData.enabled;

  return (
    <div className="shift-container" id={`shift-container-${day}`}>
      <div className="checkbox-container">
        <input
  type="checkbox"
  id={`check-${day}`}
  checked={checked}
  onChange={(e) => onToggleDay(day, e.target.checked)}
/>
        <label htmlFor={`check-${day}`}>{day}</label>
      </div>

      <div id={`shifts-${day}`} className="shifts-list">
        {dayData.shifts.map((shift, idx) => {
          const enabled = checked;
          return (
            <div key={idx} className="shift-entry">
              <div className="form-group">
                <label htmlFor={`start-${day}-${idx}`}>Start Time:</label>
                <input
                  type="time"
                  id={`start-${day}-${idx}`}
                  disabled={!enabled}
                  value={shift.startTime || ""}
                  onChange={(e) => onUpdateShift(day, idx, "startTime", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor={`end-${day}-${idx}`}>End Time:</label>
                <input
                  type="time"
                  id={`end-${day}-${idx}`}
                  disabled={!enabled}
                  value={shift.endTime || ""}
                  onChange={(e) => onUpdateShift(day, idx, "endTime", e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor={`loc-${day}-${idx}`}>Location:</label>
                <select
                  id={`loc-${day}-${idx}`}
                  disabled={!enabled}
                  value={shift.location || "Gosford"}
                  onChange={(e) => onUpdateShift(day, idx, "location", e.target.value)}
                >
                  <option value="Gosford">Gosford</option>
                  <option value="Islington">Islington</option>
                  <option value="Adamstown">Adamstown</option>
                </select>
              </div>

              {idx > 0 && (
                <button
                  type="button"
                  className="btn-remove-shift"
                  disabled={!enabled}
                  onClick={() => onRemoveShift(day, idx)}
                >
                  Remove Shift
                </button>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="btn-add-shift"
        id={`add-shift-${day}`}
        onClick={() => onAddShift(day)}
        disabled={!checked}
        type="button"
      >
        Add Shift
      </button>
    </div>
  );
}
