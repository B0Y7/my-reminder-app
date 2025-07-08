const SHEET_URL = "https://script.google.com/macros/s/AKfycbx4SSMyPML_fD7KlEVx1xnPqJkB5pN-pKrLX41IerLBgm8VDiAEGFmGNbOede3Lv2KnLQ/exec";

async function fetchSchedule() {
  try {
    const res = await fetch(SHEET_API_URL);
    const data = await res.json();
    renderCalendar(data);
    suggestFreeTime(data);
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu:", err);
  }
}

function renderCalendar(data) {
  const calendarEl = document.getElementById('calendar');

  const dayMap = {
    "Sunday": 0, "Monday": 1, "Tuesday": 2,
    "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6
  };

  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));

  const events = data.map(row => {
    const offset = dayMap[row.Day];
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + offset);

    const dateStr = date.toISOString().split('T')[0];

    return {
      title: row.Subject,
      start: `${dateStr}T${row["Start Time"]}:00`,
      end: `${dateStr}T${row["End Time"]}:00`,
      description: row.Description
    };
  });

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek'
    },
    events: events,
    locale: 'vi',
    eventClick: function (info) {
      alert(`📌 ${info.event.title}\n🕒 ${info.event.start.toLocaleTimeString()} - ${info.event.end.toLocaleTimeString()}\n📝 ${info.event.extendedProps.description}`);
    }
  });

  calendar.render();
}

function suggestFreeTime(data) {
  const freeTime = data.find(row =>
    row.Day === "Sunday" &&
    row["Start Time"] === "14:00" &&
    row.Subject === "Làm dự án nhẹ nhàng"
  );
  if (freeTime && !localStorage.getItem("suggestionShown")) {
    alert("📝 Gợi ý: Bạn có thể dùng thời gian này để hoàn thành truyện audio!");
    localStorage.setItem("suggestionShown", "yes");
  }
}

fetchSchedule();

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(() => {
    console.log("✅ Service Worker registered");
  });
}