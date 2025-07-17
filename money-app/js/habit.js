// js/habit.js

document.addEventListener("DOMContentLoaded", () => {
  // ... (기존 DOM 요소 및 변수 선언) ...

  // Chart 인스턴스 (const 대신 let으로 변경)
  let monthlyChart = null;
  let overallChart = null;

  // ... (기존 saveHabits, renderActiveHabitList 함수) ...

  // --- 통합 달력 렌더링 (renderIntegratedCalendar) ---
  function renderIntegratedCalendar() {
    // ... (기존 달력 렌더링 로직) ...
  }

  // --- 통계 렌더링 및 그래프 호출 (renderHabitStats) ---
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
      return;
    }
    noHabitStatsMessage.style.display = "none";
    monthlyPracticeChartCanvas.style.display = "block";
    overallPracticeChartCanvas.style.display = "block";
    noMonthlyChartDataMessage.style.display = "none";
    noOverallChartDataMessage.style.display = "none";

    // ... (기존 통계 숫자 계산 및 표시 로직) ...

    renderMonthlyPracticeChart(); // 그래프도 함께 업데이트
    renderOverallPracticeChart(); // 그래프도 함께 업데이트
  }

  // --- 월별 습관 실천 횟수 그래프 (renderMonthlyPracticeChart) ---
  function renderMonthlyPracticeChart() {
    if (monthlyChart) {
      monthlyChart.destroy();
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
            backgroundColor: primaryColor, // 네온 그린
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
              color: getComputedStyle(document.documentElement)
                .getPropertyValue("--border-color")
                .trim(), // 그리드 색상
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                if (value % 1 === 0) return value;
              },
              color: textColor, // y축 레이블 색상
            },
            grid: {
              color: getComputedStyle(document.documentElement)
                .getPropertyValue("--border-color")
                .trim(), // 그리드 색상
            },
          },
        },
      },
    });
  }

  // --- 전체 습관 실천 비율 그래프 (renderOverallPracticeChart) ---
  function renderOverallPracticeChart() {
    if (overallChart) {
      overallChart.destroy();
    }

    const habitNames = habits.map((h) => h.name);
    const practiceCounts = habits.map((habit) => {
      return Object.values(habitRecords[habit.id] || {}).filter(Boolean).length;
    });

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

    const backgroundColors = [
      currentPrimaryColor, // 네온 그린 (주)
      currentSecondaryColor, // 밝은 네온 그린 (부)
      currentInfoColor, // 파란색
      currentWarningColor, // 노란색
      currentDangerColor, // 빨간색
      currentSuccessColor, // 초록색 (이 색상도 필요하면 다크모드에 맞게 조정)
    ];
    // Chart.js는 배열이 짧으면 반복해서 사용하므로, 굳이 habits.length만큼 맞출 필요는 없습니다.

    overallChart = new Chart(overallPracticeChartCanvas, {
      type: "doughnut",
      data: {
        labels: habitNames,
        datasets: [
          {
            label: "총 실천 횟수",
            data: practiceCounts,
            backgroundColor: backgroundColors,
            borderColor: getComputedStyle(document.documentElement)
              .getPropertyValue("--card-background-color")
              .trim(), // 테마 배경색에 맞게
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

  // ... (기존 이벤트 핸들러) ...

  // 초기 렌더링 함수들을 전역으로 노출
  window.renderTransactions = () => {}; // expense.js에서 정의됨
  window.renderTodos = () => {}; // todo.js에서 정의됨

  // habit 탭의 모든 렌더링 함수를 묶어서 전역 함수로 노출
  window.renderHabits = () => {
    renderActiveHabitList();
    renderIntegratedCalendar();
    renderHabitStats(); // 그래프 렌더링 포함
  };
  // 차트 업데이트를 위해 renderHabitStats 함수 자체도 노출
  window.renderHabitStats = renderHabitStats;

  // ... (기존 DOMContentLoaded 끝) ...
});
