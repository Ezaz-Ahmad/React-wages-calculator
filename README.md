# 🧮 React Wages Calculator

A modern **Wages Calculator web app** built with **React + Vite**, designed to make employee wage calculation fast, accurate, and simple.  
This project is a React translation of my earlier vanilla JS app — rebuilt with a modular structure, reusable components, and modern tooling.  

🔗 **Live Demo:** [https://Ezaz-Ahmad.github.io/React-wages-calculator](https://Ezaz-Ahmad.github.io/React-wages-calculator)

---

## 🚀 Features

- **Landing Page → Calculator Flow**  
  Clean intro page leading into the calculator screen.

- **Employee Information**  
  Collects date, name, and optional address.

- **Work Schedule with Shifts**  
  - Add/remove shifts dynamically for each day.  
  - Enable/disable days with checkboxes.  
  - Supports overnight shifts and multiple locations (Gosford, Islington, Adamstown).  
  - Data persists via `localStorage`.

- **Rates & Expenses**  
  - Weekday vs Weekend rates.  
  - Fuel cost per day.  
  - Other expenses with explanation.  
  - Amount transferred (tax).  
  - Pouch day/date and closing balance.

- **Wage Calculations**  
  - Total hours worked.  
  - Fuel & other expenses.  
  - Gross and net wages (before/after transfer).  
  - Remaining wages after closing balance.  

- **Results Modal**  
  - Displays breakdown of all wage data.  
  - Export wages report to PDF.

- **PDF Export**  
  - Professionally formatted 2-page PDF using [pdf-lib](https://pdf-lib.js.org/).  
  - Includes employee details, shift table, financial summary, and notes.  
  - Auto-downloads report.

- **Wave Overlay Loader**  
  Animated overlay when generating PDFs.

---


