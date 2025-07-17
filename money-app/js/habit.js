// js/habit.js

let habits = JSON.parse(localStorage.getItem("habits")) || [];
let currentHabitDate = new Date(); // 현재 달력을 위한 날짜 객체

// DOM Elements (initHabitTab 내부에서 초기화)
let habitForm;
let habitList;
let currentMonthYearEl;
let prevMonthBtn;
let nextMonthBtn;
let habitCalendarEl;
let habitStatsEl;
let noHabitStatsMessage;

// 초기화 함수
function initHabitTab() {
  // 요소가 이미 초기화되었는지 확인하여 불필요한 재설정 방지
  if (!habitForm) {
    habitForm = document.getElementById("habit-form");
    habitList = document.getElementById("habit-list");
    currentMonthYearEl = document.getElementById("current-month-year");
    prevMonthBtn = document.getElementById("prev-month");
    nextMonthBtn = document.getElementById("next-month");
    habitCalendarEl = document.getElementById("habit-calendar");
    habitStatsEl = document.getElementById("habit-stats");
    noHabitStatsMessage = document.getElementById("no-habit-stats-message");

    // 이벤트 리스너는 한 번만 등록
    habitForm.addEventListener("submit", handleHabitFormSubmit);
    prevMonthBtn.addEventListener("click", () => {
      currentHabitDate.setMonth(currentHabitDate.getMonth() - 1);
      updateHabitViews();
    });
    nextMonthBtn.addEventListener("click", () => {
      currentHabitDate.setMonth(currentHabitDate.getMonth() + 1);
      updateHabitViews();
    });
  }

  // 탭이 활성화될 때마다 모든 뷰를 업데이트
  updateHabitViews();
}

function updateHabitViews() {
  saveHabits(); // 습관 목록, 달력, 통계 업데이트를 트리거
  renderHabitList();
  updateHabitCalendar();
  updateHabitStats();
}

// =========================================================================
// 1. 습관 데이터 처리 함수
// =========================================================================

function saveHabits() {
  localStorage.setItem("habits", JSON.stringify(habits));
  // 여기서 다른 업데이트 함수를 직접 호출하지 않습니다.
  // updateHabitViews()가 이를 관리합니다.
}

function handleHabitFormSubmit(e) {
  e.preventDefault();
  const habitName = document.getElementById("habit-name").value;
  if (habits.some((habit) => habit.name === habitName)) {
    alert("이미 같은 이름의 습관이 있습니다.");
    return;
  }
  habits.push({ name: habitName, records: {} }); // records: { 'YYYY-MM-DD': true/false }
  saveHabits(); // 데이터 저장 (이 함수 내부에서 모든 뷰 업데이트 트리거)
  habitForm.reset();
}

function renderHabitList() {
  habitList.innerHTML = "";
  if (habits.length === 0) {
    habitList.innerHTML =
      '<li class="list-group-item text-center text-muted">아직 등록된 습관이 없습니다.</li>';
    return;
  }
  habits.forEach((habit, index) => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `
            <span>${habit.name}</span>
            <button class="btn btn-sm btn-outline-danger delete-habit-btn" data-index="${index}">
                <i class="bi bi-x-lg"></i>
            </button>
        `;
    habitList.appendChild(li);
  });

  habitList.querySelectorAll(".delete-habit-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      if (confirm(`'${habits[index].name}' 습관을 삭제하시겠습니까?`)) {
        habits.splice(index, 1);
        saveHabits(); // 데이터 저장 (이 함수 내부에서 모든 뷰 업데이트 트리거)
      }
    });
  });
}

// =========================================================================
// 2. 습관 달력 함수
// =========================================================================

function updateHabitCalendar() {
  habitCalendarEl.innerHTML = "";
  const year = currentHabitDate.getFullYear();
  const month = currentHabitDate.getMonth(); // 0-indexed

  currentMonthYearEl.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // 이전 달의 날짜 채우기
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement("div");
    cell.className = "day-cell empty";
    cell.textContent = prevMonthDays - firstDay + i + 1;
    habitCalendarEl.appendChild(cell);
  }

  // 현재 달의 날짜 채우기
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    cell.className = "day-cell";

    let dayContent = `<span class="day-number">${day}</span>`;
    if (habits.length > 0) {
      dayContent += '<div class="habit-check-indicators">';
      habits.forEach((habit, habitIndex) => {
        const isCompleted = habit.records[fullDate];
        dayContent += `
                    <input type="checkbox" 
                           class="habit-check" 
                           data-date="${fullDate}" 
                           data-habit-index="${habitIndex}" 
                           ${isCompleted ? "checked" : ""}>
                `;
      });
      dayContent += "</div>";
    }

    cell.innerHTML = dayContent;
    habitCalendarEl.appendChild(cell);
  }

  // 다음 달의 날짜 채우기
  const totalCells = firstDay + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainingCells; i++) {
    const cell = document.createElement("div");
    cell.className = "day-cell empty";
    cell.textContent = i;
    habitCalendarEl.appendChild(cell);
  }

  // 체크박스 이벤트 리스너 추가
  habitCalendarEl.querySelectorAll(".habit-check").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const date = e.target.dataset.date;
      const habitIndex = parseInt(e.target.dataset.habitIndex);
      habits[habitIndex].records[date] = e.target.checked;
      saveHabits(); // 데이터 저장 (이 함수 내부에서 모든 뷰 업데이트 트리거)
    });
  });
}

// =========================================================================
// 3. 습관 통계 함수
// =========================================================================

function updateHabitStats() {
  habitStatsEl.innerHTML = '<h3 class="mb-3">습관 통계</h3>'; // 통계 섹션 초기화

  if (habits.length === 0) {
    noHabitStatsMessage.style.display = "block";
    return;
  } else {
    noHabitStatsMessage.style.display = "none";
  }

  // 월별 통계를 위한 현재 월의 시작과 끝 날짜
  const year = currentHabitDate.getFullYear();
  const month = currentHabitDate.getMonth();
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0); // 이 달의 마지막 날

  habits.forEach((habit) => {
    let completedCount = 0;
    let totalDaysInMonthWithRecords = 0; // 해당 월에 기록이 있는 총 일수

    // 해당 월의 모든 날짜를 순회하며 기록 확인
    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const dateString = d.toISOString().split("T")[0];
      if (habit.records.hasOwnProperty(dateString)) {
        totalDaysInMonthWithRecords++; // 기록이 있는 날짜 카운트
        if (habit.records[dateString]) {
          completedCount++;
        }
      }
    }

    // 해당 월에 기록이 전혀 없는 습관은 통계에 표시하지 않음
    if (totalDaysInMonthWithRecords === 0) {
      return;
    }

    const percentage =
      totalDaysInMonthWithRecords > 0
        ? ((completedCount / totalDaysInMonthWithRecords) * 100).toFixed(1)
        : 0;

    const habitStatDiv = document.createElement("div");
    habitStatDiv.className = "card mb-3 p-3";
    habitStatDiv.innerHTML = `
            <h5>${habit.name}</h5>
            <p>완료 횟수: ${completedCount}회</p>
            <div class="progress" style="height: 25px;">
                <div class="progress-bar" role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100">
                    ${percentage}%
                </div>
            </div>
            <small class="text-muted mt-2">이 달에 ${totalDaysInMonthWithRecords}일 중 ${completedCount}일 완료</small>
        `;
    habitStatsEl.appendChild(habitStatDiv);
  });

  if (
    habits.every((habit) => {
      const year = currentHabitDate.getFullYear();
      const month = currentHabitDate.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      let totalDaysInMonthWithRecords = 0;
      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const dateString = d.toISOString().split("T")[0];
        if (habit.records.hasOwnProperty(dateString)) {
          totalDaysInMonthWithRecords++;
        }
      }
      return totalDaysInMonthWithRecords === 0;
    })
  ) {
    noHabitStatsMessage.textContent = "현재 달에 기록된 습관 통계가 없습니다.";
    noHabitStatsMessage.style.display = "block";
  }
}

// initHabitTab 함수를 전역 스코프에 노출하여 main.js에서 호출할 수 있도록 함
window.initHabitTab = initHabitTab;
