import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { days } from "../constants/days.js";

const calcDuration = (start, end) => {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(":").map(Number);
  let [eH, eM] = end.split(":").map(Number);
  if (eH < sH || (eH === sH && eM < sM)) eH += 24;
  return (eH * 60 + eM - (sH * 60 + sM)) / 60;
};

const getRate = (dayName, startTime, weekdayRate, weekendRate) => {
  const isWeekend = dayName === "Friday" || dayName === "Saturday" ||
    (dayName === "Sunday" && (!startTime || parseInt(startTime.split(":")[0], 10) < 6));
  return isWeekend ? weekendRate : weekdayRate;
};

export async function generatePdf(form, wageDetails, totals) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const formData = {
    date: form.date || "N/A",
    employeeName: form.employeeName || "Unknown",
    employeeAddress: form.employeeAddress || "N/A",
    weekdayRate: parseFloat(form.weekdayRate || 0),
    weekendRate: parseFloat(form.weekendRate || 0),
    fuelCost: parseFloat(form.fuelCost || 0),
    others: parseFloat(form.others || 0),
    expenseExplanation: form.expenseExplanation || "No additional expenses.",
    taxAmount: parseFloat(form.taxAmount || 0),
    pouchDay: form.pouchDay || "N/A",
    pouchDate: form.pouchDate || "N/A",
    closingAmount: parseFloat(form.closingAmount || 0)
  };

  // Recompute exact values for the PDF table (identical to UI behavior)
  let totalHours = 0, totalFuelCost = 0, grandTotalWages = 0;
  wageDetails.forEach(dayObj => {
    dayObj.shifts.forEach(shift => {
      if (shift.startTime && shift.endTime) {
        const duration = calcDuration(shift.startTime, shift.endTime);
        const earnings = duration * getRate(dayObj.day, shift.startTime, formData.weekdayRate, formData.weekendRate);
        totalHours += duration;
        if (shift.location === "Gosford") totalFuelCost += formData.fuelCost;
        grandTotalWages += earnings;
      }
    });
  });
  grandTotalWages += totalFuelCost + formData.others - formData.taxAmount;
  const grandTotalBeforeTax = grandTotalWages + formData.taxAmount;
  const wagesLeftOver = formData.closingAmount - grandTotalWages;

  // Page 1
  const page1 = pdfDoc.addPage([595, 842]);
  let y = page1.getHeight() - 40;
  const drawText = (text, x, yPos, opt = {}) => {
    const { bold = false, color = rgb(0, 0, 0), size = 12, lineHeight = 15, maxWidth = 515 } = opt;
    page1.drawText(text, { x, y: yPos, font: bold ? boldFont : font, size, color, maxWidth });
    return yPos - lineHeight;
  };

  page1.drawRectangle({ x: 0, y: page1.getHeight() - 70, width: page1.getWidth(), height: 70, color: rgb(0, 0.48, 1) });
  y = drawText("EzyMart Wages Report", 40, page1.getHeight() - 35, { size: 24, color: rgb(1,1,1), bold: true });
  page1.drawLine({ start: { x: 40, y: page1.getHeight() - 75 }, end: { x: 555, y: page1.getHeight() - 75 }, thickness: 2, color: rgb(0, 0.76, 0.8) });
  y = page1.getHeight() - 90;

  // Employee Info
  y = drawText("Employee Information", 40, y, { size: 16, color: rgb(0, 0.48, 1), bold: true, lineHeight: 20 });
  y = drawText(`Date: ${formData.date}`, 40, y);
  y = drawText(`Employee Name: ${formData.employeeName}`, 40, y);
  y = drawText(`Address: ${formData.employeeAddress}`, 40, y, { lineHeight: 20 });

  // Rates (Right)
  let rightY = page1.getHeight() - 90;
  const drawRight = (text, opt={}) => { rightY = drawText(text, 320, rightY, opt); };
  drawRight("Hourly Rates", { size: 16, color: rgb(0, 0.48, 1), bold: true, lineHeight: 20 });
  drawRight(`Weekday: $${formData.weekdayRate.toFixed(2)}`);
  drawRight(`Weekend: $${formData.weekendRate.toFixed(2)}`, { lineHeight: 20 });

  // Work Schedule header
  y -= 10;
  y = drawText("Work Schedule", 40, y, { size: 16, color: rgb(0, 0.48, 1), bold: true, lineHeight: 20 });
  page1.drawRectangle({ x: 40, y: y - 5, width: 515, height: 20, color: rgb(0.95, 0.95, 0.95) });
  y = drawText("Day", 45, y, { bold: true, size: 10 });
  drawText("Start", 120, y + 15, { bold: true, size: 10 });
  drawText("End", 190, y + 15, { bold: true, size: 10 });
  drawText("Location", 260, y + 15, { bold: true, size: 10 });
  drawText("Hours", 360, y + 15, { bold: true, size: 10 });
  drawText("Earnings", 430, y + 15, { bold: true, size: 10 });
  y -= 20;

  // Rows
  wageDetails.forEach(dayObj => {
    dayObj.shifts.forEach(shift => {
      if (shift.startTime && shift.endTime) {
        const duration = calcDuration(shift.startTime, shift.endTime);
        const earnings = duration * getRate(dayObj.day, shift.startTime, formData.weekdayRate, formData.weekendRate);
        y = drawText(dayObj.day, 45, y, { size: 10, lineHeight: 15 });
        drawText(shift.startTime, 120, y + 15, { size: 10, lineHeight: 15 });
        drawText(shift.endTime, 190, y + 15, { size: 10, lineHeight: 15 });
        drawText(shift.location, 260, y + 15, { size: 10, lineHeight: 15 });
        drawText(duration.toFixed(2), 360, y + 15, { size: 10, lineHeight: 15 });
        drawText(`$${earnings.toFixed(2)}`, 430, y + 15, { size: 10, lineHeight: 15 });
        y -= 15;
      }
    });
  });

  // Summary Left
  y -= 10;
  y = drawText("Summary", 40, y, { size: 16, color: rgb(0,0.48,1), bold: true, lineHeight: 20 });
  y = drawText(`Total Hours: ${totalHours.toFixed(2)}`, 40, y);
  y = drawText(`Fuel Cost: $${totalFuelCost.toFixed(2)}`, 40, y);
  y = drawText(`Other Expenses: $${formData.others.toFixed(2)}`, 40, y, { lineHeight: 20 });

  // Financial Right
  rightY = Math.min(rightY, y - 20);
  drawRight("Financial Summary", { size: 16, color: rgb(0,0.48,1), bold: true, lineHeight: 20 });
  drawRight(`Total Before Tax: $${grandTotalBeforeTax.toFixed(2)}`, { size: 12, bold: true, color: rgb(0.6,0,0) });
  drawRight(`Tax/Transferred: $${formData.taxAmount.toFixed(2)}`, { size: 12, bold: true, color: rgb(0,0,0.6) });
  drawRight(`Total After Tax: $${grandTotalWages.toFixed(2)}`, { size: 12, bold: true, color: rgb(0.6,0,0) });
  drawRight(`Closing Amount: $${formData.closingAmount.toFixed(2)}`);
  drawRight(`AMOUNT LEFT AFTER SORTING: $${wagesLeftOver.toFixed(2)}`, { bold: true, lineHeight: 20 });

  // Footer page 1
  page1.drawRectangle({ x: 0, y: 20, width: page1.getWidth(), height: 20, color: rgb(0.95, 0.95, 0.95) });
  page1.drawText("Developed by Ezaz Ahmad | Version: 1.1.3V | Page 1 of 2", {
    x: 40, y: 30, font, size: 10, color: rgb(0.4,0.4,0.4)
  });

  // Page 2
  const page2 = pdfDoc.addPage([595, 842]);
  let y2 = page2.getHeight() - 40;
  const drawText2 = (text, x, yPos, opt = {}) => {
    const { bold = false, color = rgb(0, 0, 0), size = 12, lineHeight = 15, maxWidth = 515 } = opt;
    page2.drawText(text, { x, y: yPos, font: bold ? boldFont : font, size, color, maxWidth });
    return yPos - lineHeight;
  };

  page2.drawRectangle({ x: 0, y: page2.getHeight() - 70, width: page2.getWidth(), height: 70, color: rgb(0, 0.48, 1) });
  y2 = drawText2("Additional Notes", 40, page2.getHeight() - 35, { size: 24, color: rgb(1,1,1), bold: true });
  page2.drawLine({ start: { x: 40, y: page2.getHeight() - 75 }, end: { x: 555, y: page2.getHeight() - 75 }, thickness: 2, color: rgb(0,0.76,0.8) });
  y2 = page2.getHeight() - 90;

  y2 = drawText2("Expense Explanation", 40, y2, { size: 16, color: rgb(0,0.48,1), bold: true, lineHeight: 20 });
  y2 = drawText2(formData.expenseExplanation, 40, y2, { size: 12, lineHeight: 18 });
  y2 -= 10;

  y2 = drawText2("Closing Amount Details", 40, y2, { size: 16, color: rgb(0,0.48,1), bold: true, lineHeight: 20 });
  y2 = drawText2(`Closing Amount Day and Date: ${formData.pouchDay} (${formData.pouchDate})`, 40, y2, { size: 12, lineHeight: 20 });
  y2 = drawText2(`Closing Amount: $${formData.closingAmount.toFixed(2)}. Wages left after transfer: $${grandTotalWages.toFixed(2)}.`, 40, y2, { size: 12, lineHeight: 20 });
  y2 = drawText2(`MONEY LEFT AFTER SORTING THE WAGES: $${formData.closingAmount.toFixed(2)} - $${grandTotalWages.toFixed(2)} = $${wagesLeftOver.toFixed(2)}`, 40, y2, { size: 12, bold: true, lineHeight: 20 });
  y2 = drawText2(`The remaining amount has been left in the usual place for Gosford’s closing money.`, 40, y2, { size: 12, lineHeight: 20 });

  // Footer page 2
  page2.drawRectangle({ x: 0, y: 20, width: page2.getWidth(), height: 20, color: rgb(0.95, 0.95, 0.95) });
  page2.drawText("Developed by Ezaz Ahmad | Version: 1.1.3V | Page 2 of 2", {
    x: 40, y: 30, font, size: 10, color: rgb(0.4,0.4,0.4)
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${formData.employeeName}_WagesReport_${formData.date}.pdf`;
  link.click();
}
