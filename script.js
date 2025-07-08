const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbx4SSMyPML_fD7KlEVx1xnPqJkB5pN-pKrLX41IerLBgm8VDiAEGFmGNbOede3Lv2KnLQ/exec";

let scheduleData = [];

function showToday() {
  const today = new Date();
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  const day = dayNames[today.getDay()];
  const dateStr = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
  document.getElementById("todayDisplay").textContent = `Hôm nay: ${day}, ${dateStr}`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function showToast(message) {
  const toastEl = document.getElementById('statusToast');
  const toastBody = document.getElementById('toastBody');
  toastBody.textContent = message;
  new bootstrap.Toast(toastEl).show();
}

function suggestFreeTime(data) {
  const freeTime = data.find(row =>
    row.Day === "Sunday" &&
    formatTime(row["Start Time"]) === "14:17" &&
    row.Subject.includes("Ngủ sớm")
  );
  if (freeTime && !localStorage.getItem("suggestionShown")) {
    alert("📝 Gợi ý: Bạn có thể dùng thời gian này để nghỉ ngơi sớm hoặc lên kế hoạch tuần mới.");
    localStorage.setItem("suggestionShown", "yes");
  }
}

function getMinutesOfDay(dateStr) {
  const d = new Date(dateStr);
  return d.getHours() * 60 + d.getMinutes();
}

function isNowInTimeRange(startStr, endStr) {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const startMin = getMinutesOfDay(startStr);
  const endMin = getMinutesOfDay(endStr);
  return nowMin >= startMin && nowMin < endMin;
}

function isBeforeNow(endStr) {
  return getMinutesOfDay(endStr) < new Date().getHours() * 60 + new Date().getMinutes();
}

async function fetchSchedule() {
  try {
    const res = await fetch(SHEET_API_URL);
    scheduleData = await res.json();

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = dayNames[new Date().getDay()];
    const filter = document.getElementById("dayFilter");
    if (!filter.value) filter.value = todayName;

    renderTable(scheduleData);
    suggestFreeTime(scheduleData);
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu:", err);
  }
}

function renderTable(data) {
  const tbody = document.getElementById('scheduleBody');
  tbody.innerHTML = '';

  const selectedDay = document.getElementById('dayFilter').value;
  const todayTasks = data.filter(row => row.Day === selectedDay);
  let highlighted = false;

  todayTasks.forEach((row, i) => {
    const id = `${row.Day}-${row.Subject}`;
    const status = localStorage.getItem(`confirmed-${id}`);
    const start = new Date(row["Start Time"]);
    const end = new Date(row["End Time"]);
    const isNow = isNowInTimeRange(row["Start Time"], row["End Time"]);
    const isPast = isBeforeNow(row["End Time"]);

    const tr = document.createElement('tr');
    tr.dataset.id = id;

    if (status === "yes") {
      tr.classList.add('table-success');
    } else if (status === "done") {
      tr.classList.add('table-primary');
    } else if (status === "skipped") {
      tr.style.display = "none";
      return;
    } else if (isNow) {
      tr.classList.add('table-warning');
    } else if (isPast && !status) {
      tr.classList.add('table-danger');
    }

    // Đánh dấu task đang diễn ra đầu tiên
    if (!highlighted && isNow) {
      showToast(`⏳ Đang thực hiện: ${row.Subject}`);
      highlighted = true;
    }

    tr.addEventListener('click', () => {
      const currentStatus = localStorage.getItem(`confirmed-${id}`);
      let promptMsg = '';

      if (!currentStatus) {
        promptMsg = `🟡 ${row.Subject}\n\n1. Gõ 1 để XÁC NHẬN đang thực hiện\n2. Gõ 2 để BỎ QUA và đôn công việc phía sau lên`;
      } else if (currentStatus === "yes") {
        promptMsg = `✅ ${row.Subject}\n\n1. Gõ 1 để ĐÃ HOÀN THÀNH (sẽ cập nhật thời gian hợp lý cho các task sau)\n2. Gõ 2 để BỎ QUA và đôn task sau lên`;
      } else {
        return;
      }

      const choice = prompt(promptMsg);

      if (choice === "1") {
        if (!currentStatus) {
          localStorage.setItem(`confirmed-${id}`, "yes");
        } else {
          localStorage.setItem(`confirmed-${id}`, "done");
          updateTimeAfterDone(data, todayTasks, row, i);
        }
        renderTable(data);
      } else if (choice === "2") {
        shiftTasksAndRemove(data, todayTasks, row, i);
        localStorage.setItem(`confirmed-${id}`, "skipped");
        renderTable(data);
      }
    });

    tr.innerHTML = `
      <td>${row.Day}</td>
      <td>${formatTime(start)} - ${formatTime(end)}</td>
      <td>${row.Subject}</td>
      <td>${row.Description || ''}</td>
    `;

    tbody.appendChild(tr);
  });
}

function shiftTasksAndRemove(data, todayTasks, currentRow, index) {
  let prevStart = new Date(currentRow["Start Time"]);

  for (let j = index + 1; j < todayTasks.length; j++) {
    const nextTask = todayTasks[j];
    const duration = new Date(nextTask["End Time"]) - new Date(nextTask["Start Time"]);
    const newStart = new Date(prevStart);
    const newEnd = new Date(newStart.getTime() + duration);

    nextTask["Start Time"] = newStart.toString();
    nextTask["End Time"] = newEnd.toString();

    prevStart = newEnd;

    const idx = data.findIndex(r => r.Day === nextTask.Day && r.Subject === nextTask.Subject);
    if (idx !== -1) {
      data[idx]["Start Time"] = nextTask["Start Time"];
      data[idx]["End Time"] = nextTask["End Time"];
    }
  }

  const skipIdx = data.findIndex(r => r.Day === currentRow.Day && r.Subject === currentRow.Subject);
  if (skipIdx !== -1) data.splice(skipIdx, 1);
}

function updateTimeAfterDone(data, todayTasks, currentRow, index) {
  let prevEnd = new Date(currentRow["End Time"]);

  for (let j = index + 1; j < todayTasks.length; j++) {
    const task = todayTasks[j];
    const duration = new Date(task["End Time"]) - new Date(task["Start Time"]);
    const newStart = new Date(prevEnd);
    const newEnd = new Date(newStart.getTime() + duration);

    task["Start Time"] = newStart.toString();
    task["End Time"] = newEnd.toString();

    prevEnd = newEnd;

    const idx = data.findIndex(r => r.Day === task.Day && r.Subject === task.Subject);
    if (idx !== -1) {
      data[idx]["Start Time"] = task["Start Time"];
      data[idx]["End Time"] = task["End Time"];
    }
  }
}

document.getElementById("dayFilter").addEventListener("change", fetchSchedule);
document.getElementById("clearConfirmationsBtn").addEventListener("click", () => {
  if (confirm("Bạn có chắc muốn xóa toàn bộ xác nhận đã lưu không?")) {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("confirmed-")) {
        localStorage.removeItem(key);
      }
    });
    showToast("🗑️ Đã xóa tất cả xác nhận công việc.");
    fetchSchedule();
  }
});

showToday();
fetchSchedule();
