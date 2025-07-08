const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbx4SSMyPML_fD7KlEVx1xnPqJkB5pN-pKrLX41IerLBgm8VDiAEGFmGNbOede3Lv2KnLQ/exec";

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
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay())); // Chủ nhật đầu tuần

  const events = data.map(row => {
    const offset = dayMap[row.Day];
    const eventDate = new Date(weekStart);
    eventDate.setDate(weekStart.getDate() + offset); // Gán đúng ngày theo thứ

    const startTime = new Date(row["Start Time"]);
    const endTime = new Date(row["End Time"]);

    const startDateTime = new Date(eventDate);
    startDateTime.setHours(startTime.getUTCHours(), startTime.getUTCMinutes());

    const endDateTime = new Date(eventDate);
    endDateTime.setHours(endTime.getUTCHours(), endTime.getUTCMinutes());

    return {
      title: row.Subject,
      start: startDateTime.toISOString(),
      end: endDateTime.toISOString(),
      description: row.Description || ""
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
