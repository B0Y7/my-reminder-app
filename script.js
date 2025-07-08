const SHEET_URL = "https://script.google.com/macros/s/AKfycbx4SSMyPML_fD7KlEVx1xnPqJkB5pN-pKrLX41IerLBgm8VDiAEGFmGNbOede3Lv2KnLQ/exec";

const scheduleBody = document.getElementById("scheduleBody");
const dayFilter = document.getElementById("dayFilter");

function getRowClass(description) {
  if (description.includes("Công ty")) return "row-work";
  if (description.includes("đi") || description.includes("xe")) return "row-commute";
  if (description.includes("Nhà")) return "row-home";
  if (description.includes("truyện") || description.includes("Side project")) return "row-personal";
  if (description.includes("Ngủ")) return "row-sleep";
  
  return "";
}

function renderSchedule(data) {
  scheduleBody.innerHTML = "";
  data.forEach(row => {
    if (dayFilter.value === "" || row["Day"] === dayFilter.value) {
      const tr = document.createElement("tr");
      tr.className = getRowClass(row.Description);

      tr.innerHTML = `
        <td>${row.Day}</td>
        <td>${row["Start Time"]} - ${row["End Time"]}</td>
        <td>${row.Subject}</td>
        <td>${row.Description}</td>
      `;
      scheduleBody.appendChild(tr);
    }
  });
}
function suggestFreeTime(data) {
  const freeTime = data.find(row =>
    row.Day === "Sunday" &&
    row["Start Time"] === "14:00" &&
    row.Subject === "Làm dự án nhẹ nhàng"
  );
  if (freeTime) {
    const suggested = localStorage.getItem("suggestionShown");
    if (!suggested) {
      alert("📝 Gợi ý: Bạn có thể dùng thời gian này để hoàn thành truyện audio!");
      localStorage.setItem("suggestionShown", "yes");
    }
  }
}
async function fetchSchedule() {
  const res = await fetch(SHEET_URL);
  const data = await res.json();
  renderSchedule(data);
  suggestFreeTime(data);
}

dayFilter.addEventListener("change", fetchSchedule);
fetchSchedule();

// Đăng ký Service Worker cho PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log("Service Worker registered");
  });
}