// js/habit.js

document.addEventListener("DOMContentLoaded", () => {
  const habitForm = document.getElementById("habit-form");
  const activeHabitList = document.getElementById("active-habit-list");
  const currentMonthYearDisplay = document.getElementById("current-month-year");
  const prevMonthBtn = document.getElementById("prev-month-btn");
  const nextMonthBtn = document.getElementById("next-month-btn");
  const calendarDaysGrid = document.getElementById("calendar-days-grid");
  const habitStatsDiv = document.getElementById("habit-stats");
  const noHabitStatsMessage = document.getElementById("no-habit-stats-message");

  // 그래프 관련 DOM 및 변수
  const monthlyPracticeChartCanvas = document.getElementById(
    "monthlyPracticeChart"
  );
  const overallPracticeChartCanvas = document.getElementById(
    "overallPracticeChart"
  );
  const noMonthlyChartDataMessage = document.getElementById(
    "no-monthly-chart-data"
  );
  const noOverallChartDataMessage = document.getElementById(
    "no-overall-chart-data"
  );

  let monthlyChart = null; // 월별 차트 인스턴스
  let overallChart = null; // 전체 차트 인스턴스

  // 모달 관련 DOM
  const habitDetailModal = new bootstrap.Modal(
    document.getElementById("habitDetailModal")
  );
  const habitDetailModalLabel = document.getElementById(
    "habitDetailModalLabel"
  );
  const habitDetailModalBody = document.getElementById("habitDetailModalBody");

  // habits: { id, name, createdDate }
  // habitRecords: { habitId: { 'YYYY-MM-DD': true/false, ... }, ... }
  let habits = JSON.parse(localStorage.getItem("habits")) || [];
  let habitRecords = JSON.parse(localStorage.getItem("habitRecords")) || {};

  let currentHabitCalendarDate = new Date(); // 현재 달력의 기준 날짜 (월/년도)

  // --- 데이터 저장/로드 헬퍼 함수 ---
  function saveHabits() {
    localStorage.setItem("habits", JSON.stringify(habits));
    localStorage.setItem("habitRecords", JSON.stringify(habitRecords));
  }

  // --- 활성 습관 목록 렌더링 (편집/삭제용) ---
  function renderActiveHabitList() {
    activeHabitList.innerHTML = "";
    if (habits.length === 0) {
      activeHabitList.innerHTML =
        '<li class="list-group-item text-muted text-center">아직 등록된 습관이 없습니다.</li>';
      return;
    }

    habits.forEach((habit) => {
      const listItem = document.createElement("li");
      listItem.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-center"
      );
      listItem.innerHTML = `
                <div>${habit.name}</div>
                <div>
                    <button class="btn btn-sm btn-outline-secondary me-1" data-id="${habit.id}" data-action="edit-habit">편집</button>
                    <button class="btn btn-sm btn-outline-danger" data-id="${habit.id}" data-action="delete-habit">삭제</button>
                </div>
            `;
      activeHabitList.appendChild(listItem);
    });
  }

  // --- 통합 달력 렌더링 ---
  function renderIntegratedCalendar() {
    calendarDaysGrid.innerHTML = "";
    const year = currentHabitCalendarDate.getFullYear();
    const month = currentHabitCalendarDate.getMonth(); // 0-11

    currentMonthYearDisplay.textContent = `${year}년 ${month + 1}월`;

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0(일) ~ 6(토)
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 해당 월의 마지막 날짜

    // 빈 칸 채우기 (첫 요일까지)
    for (let i = 0; i < firstDayOfMonth; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.classList.add("calendar-day", "empty");
      calendarDaysGrid.appendChild(emptyCell);
    }

    // 날짜 채우기
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;

      const dayCell = document.createElement("div");
      dayCell.classList.add("calendar-day");
      dayCell.textContent = day;
      dayCell.dataset.date = dateStr; // 클릭 시 날짜 정보를 쉽게 가져오기 위함

      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      if (dateStr === todayStr) {
        dayCell.classList.add("today");
      }

      // 그 날짜에 실천한 습관 표시
      // 모든 습관이 해당 날짜에 실천되었는지 확인
      const allHabitsPracticed =
        habits.length > 0 &&
        habits.every(
          (habit) => habitRecords[habit.id] && habitRecords[habit.id][dateStr]
        );

      // 하나라도 실천했는지 확인
      const anyHabitPracticed = habits.some(
        (habit) => habitRecords[habit.id] && habitRecords[habit.id][dateStr]
      );

      if (allHabitsPracticed) {
        dayCell.classList.add("completed"); // 모든 습관 완료 시 'completed' 클래스 추가
      } else if (anyHabitPracticed) {
        // 일부 습관 완료 시 작은 체크 아이콘 여러 개 표시
        dayCell.innerHTML += `<div class="habit-indicators"></div>`;
        const indicatorsDiv = dayCell.querySelector(".habit-indicators");
        habits.forEach((habit) => {
          if (habitRecords[habit.id] && habitRecords[habit.id][dateStr]) {
            const icon = document.createElement("i");
            icon.classList.add("bi", "bi-check-circle-fill", "text-success"); // Bootstrap Icons 사용
            indicatorsDiv.appendChild(icon);
          }
        });
        dayCell.classList.add("has-practices"); // 하나라도 실천했음을 표시
      }

      calendarDaysGrid.appendChild(dayCell);
    }
  }

  // --- 통계 렌더링 ---
  function renderHabitStats() {
    habitStatsDiv.innerHTML = "";
    if (habits.length === 0) {
      noHabitStatsMessage.style.display = "block";
      monthlyPracticeChartCanvas.style.display = "none";
      overallPracticeChartCanvas.style.display = "none";
      noMonthlyChartDataMessage.style.display = "block";
      noOverallChartDataMessage.style.display = "block";
      if (monthlyChart) monthlyChart.destroy();
      if (overallChart) overallChart.destroy();
      monthlyChart = null; // 인스턴스 초기화
      overallChart = null; // 인스턴스 초기화
      return;
    }
    noHabitStatsMessage.style.display = "none";
    monthlyPracticeChartCanvas.style.display = "block";
    overallPracticeChartCanvas.style.display = "block";
    noMonthlyChartDataMessage.style.display = "none";
    noOverallChartDataMessage.style.display = "none";

    habits.forEach((habit) => {
      let totalPractices = 0;
      let currentStreak = 0;
      let longestStreak = 0;
      let lastDate = null;

      const sortedDates = Object.keys(habitRecords[habit.id] || {})
        .filter((date) => habitRecords[habit.id][date])
        .sort();

      for (let i = 0; i < sortedDates.length; i++) {
        totalPractices++;
        const currentDate = new Date(sortedDates[i]);

        if (lastDate) {
          const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // 다음날 연속
            currentStreak++;
          } else if (diffDays > 1) {
            // 불연속
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1; // 새 스트릭 시작
          }
          // else if diffDays === 0 : 같은 날 중복 체크는 스트릭에 영향 없음
        } else {
          currentStreak = 1; // 첫 실천
        }
        lastDate = currentDate;
      }
      longestStreak = Math.max(longestStreak, currentStreak); // 마지막 스트릭 반영

      const habitStatCard = document.createElement("div");
      habitStatCard.classList.add("col-md-6", "mb-3");
      habitStatCard.innerHTML = `
                <div class="card p-3 h-100">
                    <h5>${habit.name}</h5>
                    <p class="mb-1">총 실천 횟수: <span class="badge bg-primary">${totalPractices}회</span></p>
                    <p class="mb-1">현재 연속 기록: <span class="badge bg-success">${currentStreak}일</span></p>
                    <p class="mb-1">최대 연속 기록: <span class="badge bg-info">${longestStreak}일</span></p>
                </div>
            `;
      habitStatsDiv.appendChild(habitStatCard);
    });

    // 그래프 렌더링 호출
    renderMonthlyPracticeChart();
    renderOverallPracticeChart();
  }

  // --- 월별 습관 실천 횟수 그래프 (막대 그래프) ---
  function renderMonthlyPracticeChart() {
    if (monthlyChart) {
      monthlyChart.destroy(); // 기존 차트가 있다면 파괴
      monthlyChart = null; // 인스턴스 초기화
    }

    const labels = habits.map((h) => h.name);
    const data = habits.map((habit) => {
      const year = currentHabitCalendarDate.getFullYear();
      const month = String(currentHabitCalendarDate.getMonth() + 1).padStart(
        2,
        "0"
      );
      let count = 0;
      for (const date in habitRecords[habit.id]) {
        if (
          date.startsWith(`${year}-${month}`) &&
          habitRecords[habit.id][date]
        ) {
          count++;
        }
      }
      return count;
    });

    if (labels.length === 0 || data.every((d) => d === 0)) {
      monthlyPracticeChartCanvas.style.display = "none";
      noMonthlyChartDataMessage.style.display = "block";
      return;
    } else {
      monthlyPracticeChartCanvas.style.display = "block";
      noMonthlyChartDataMessage.style.display = "none";
    }

    // 테마에 따른 색상 설정 (CSS 변수 값 가져오기)
    const primaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary-color")
      .trim();
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--text-color")
      .trim();
    const borderColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--border-color")
      .trim(); // 그리드 색상용

    monthlyChart = new Chart(monthlyPracticeChartCanvas, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: `${currentHabitCalendarDate.getFullYear()}년 ${
              currentHabitCalendarDate.getMonth() + 1
            }월 실천 횟수`,
            data: data,
            backgroundColor: primaryColor,
            borderColor: primaryColor,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              color: textColor, // 범례 텍스트 색상
            },
          },
          title: {
            display: false,
          },
        },
        scales: {
          x: {
            ticks: {
              color: textColor, // x축 레이블 색상
            },
            grid: {
              color: borderColor, // 그리드 색상
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                if (value % 1 === 0) return value;
              }, // 정수만 표시
              color: textColor, // y축 레이블 색상
            },
            grid: {
              color: borderColor, // 그리드 색상
            },
          },
        },
      },
    });
  }

  // --- 전체 습관 실천 비율 그래프 (도넛 차트) ---
  function renderOverallPracticeChart() {
    if (overallChart) {
      overallChart.destroy(); // 기존 차트가 있다면 파괴
      overallChart = null; // 인스턴스 초기화
    }

    const habitNames = habits.map((h) => h.name);
    const practiceCounts = habits.map((habit) => {
      return Object.values(habitRecords[habit.id] || {}).filter(Boolean).length;
    });

    // 데이터가 없는 경우 차트 숨김
    if (habitNames.length === 0 || practiceCounts.every((c) => c === 0)) {
      overallPracticeChartCanvas.style.display = "none";
      noOverallChartDataMessage.style.display = "block";
      return;
    } else {
      overallPracticeChartCanvas.style.display = "block";
      noOverallChartDataMessage.style.display = "none";
    }

    // 테마에 따른 동적 색상 설정
    const currentPrimaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--primary-color")
      .trim();
    const currentSecondaryColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--secondary-color")
      .trim();
    const currentInfoColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--info-color")
      .trim();
    const currentWarningColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--warning-color")
      .trim();
    const currentDangerColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--danger-color")
      .trim();
    const currentSuccessColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--success-color")
      .trim();
    const textColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--text-color")
      .trim();
    const cardBgColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--card-background-color")
      .trim();

    // Chart.js에서 사용할 색상 배열 (다크 모드에 맞춰 더 밝고 선명한 색상 조합)
    const backgroundColors = [
      currentPrimaryColor, // 네온 그린 (주)
      currentSecondaryColor, // 네온 그린의 살짝 어두운 변형
      currentInfoColor, // 파랑 계열
      currentWarningColor, // 노랑 계열
      currentDangerColor, // 빨강 계열
      currentSuccessColor, // 초록 계열 (주로 성공을 나타내는 색)
    ];
    // 데이터셋이 많아지면 Chart.js가 이 색상들을 반복해서 사용합니다.

    overallChart = new Chart(overallPracticeChartCanvas, {
      type: "doughnut",
      data: {
        labels: habitNames,
        datasets: [
          {
            label: "총 실천 횟수",
            data: practiceCounts,
            backgroundColor: backgroundColors,
            borderColor: cardBgColor, // 카드 배경색과 동일하게 (구분선)
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: textColor, // 범례 텍스트 색상
            },
          },
          title: {
            display: false,
          },
        },
      },
    });
  }

  // --- 이벤트 핸들러 ---
  habitForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const habitNameInput = document.getElementById("habit-name");
    const name = habitNameInput.value.trim();

    if (name === "") {
      alert("습관 이름을 입력해주세요.");
      return;
    }

    if (habits.some((h) => h.name === name)) {
      alert("이미 같은 이름의 습관이 존재합니다.");
      return;
    }

    const newHabit = {
      id: Date.now(),
      name,
      createdDate: new Date().toISOString().split("T")[0],
    };
    habits.push(newHabit);
    habitRecords[newHabit.id] = {};

    saveHabits();
    habitForm.reset();
    renderActiveHabitList();
    renderIntegratedCalendar();
    renderHabitStats(); // 그래프도 함께 업데이트
  });

  document.addEventListener("click", (e) => {
    const target = e.target;

    if (target.dataset.action === "edit-habit") {
      const habitId = parseInt(target.dataset.id);
      const habitIndex = habits.findIndex((h) => h.id === habitId);
      if (habitIndex === -1) return;

      const newName = prompt(
        "습관 이름을 수정해주세요:",
        habits[habitIndex].name
      );
      if (newName !== null && newName.trim() !== "") {
        if (habits.some((h, idx) => idx !== habitIndex && h.name === newName)) {
          alert("이미 같은 이름의 습관이 존재합니다.");
          return;
        }
        habits[habitIndex].name = newName.trim();
        saveHabits();
        renderActiveHabitList();
        renderIntegratedCalendar();
        renderHabitStats(); // 그래프도 함께 업데이트
      } else if (newName !== null) {
        alert("습관 이름은 비워둘 수 없습니다.");
      }
    } else if (target.dataset.action === "delete-habit") {
      const habitId = parseInt(target.dataset.id);
      const habitIndex = habits.findIndex((h) => h.id === habitId);
      if (habitIndex === -1) return;

      if (
        confirm(
          `정말 '${habits[habitIndex].name}' 습관을 삭제하시겠습니까? 관련 모든 기록도 삭제됩니다.`
        )
      ) {
        delete habitRecords[habitId];
        habits.splice(habitIndex, 1);
        saveHabits();
        renderActiveHabitList();
        renderIntegratedCalendar();
        renderHabitStats(); // 그래프도 함께 업데이트
      }
    } else if (target.id === "prev-month-btn") {
      currentHabitCalendarDate.setMonth(
        currentHabitCalendarDate.getMonth() - 1
      );
      renderIntegratedCalendar();
      renderMonthlyPracticeChart(); // 월별 그래프 업데이트
    } else if (target.id === "next-month-btn") {
      currentHabitCalendarDate.setMonth(
        currentHabitCalendarDate.getMonth() + 1
      );
      renderIntegratedCalendar();
      renderMonthlyPracticeChart(); // 월별 그래프 업데이트
    } else if (
      target.classList.contains("calendar-day") &&
      !target.classList.contains("empty")
    ) {
      const clickedDate = target.dataset.date;
      habitDetailModalLabel.textContent = `${clickedDate}의 습관`;
      habitDetailModalBody.innerHTML = "";

      if (habits.length === 0) {
        habitDetailModalBody.innerHTML =
          '<p class="text-muted text-center">등록된 습관이 없습니다.</p>';
      } else {
        habits.forEach((habit) => {
          const isPracticed =
            habitRecords[habit.id] && habitRecords[habit.id][clickedDate];
          const div = document.createElement("div");
          div.classList.add("form-check", "mb-2");
          div.innerHTML = `
                        <input class="form-check-input" type="checkbox" id="habit-${
                          habit.id
                        }-${clickedDate}" data-habit-id="${
            habit.id
          }" data-date="${clickedDate}" ${isPracticed ? "checked" : ""}>
                        <label class="form-check-label" for="habit-${
                          habit.id
                        }-${clickedDate}">
                            ${habit.name}
                        </label>
                    `;
          habitDetailModalBody.appendChild(div);
        });
      }
      habitDetailModal.show();
    }
  });

  habitDetailModalBody.addEventListener("change", (e) => {
    if (
      e.target.type === "checkbox" &&
      e.target.classList.contains("form-check-input")
    ) {
      const habitId = parseInt(e.target.dataset.habitId);
      const date = e.target.dataset.date;
      const isChecked = e.target.checked;

      if (!habitRecords[habitId]) {
        habitRecords[habitId] = {};
      }

      if (isChecked) {
        habitRecords[habitId][date] = true;
      } else {
        delete habitRecords[habitId][date];
      }
      saveHabits();
      renderIntegratedCalendar();
      renderHabitStats(); // 그래프도 함께 업데이트
    }
  });

  // --- 초기 렌더링 및 main.js에서 호출할 함수 전역 노출 ---
  // DOMContentLoaded 시에 한 번 호출
  renderActiveHabitList();
  renderIntegratedCalendar();
  renderHabitStats(); // 초기 로드 시 모든 것 (그래프 포함) 렌더링

  // main.js에서 호출할 수 있도록 함수들을 전역으로 노출
  window.renderHabits = () => {
    renderActiveHabitList();
    renderIntegratedCalendar();
    renderHabitStats();
  };
  window.renderHabitStats = renderHabitStats; // 테마 변경 시 차트만 업데이트하기 위해 노출
});
