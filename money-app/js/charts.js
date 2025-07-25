// js/charts.js

// 차트 인스턴스를 저장할 변수 (새로고침 시 기존 차트 파괴 후 재생성 위함)
let expenseChartInstance = null; // 지출 차트
let incomeChartInstance = null; // 수입 차트 (필요하다면 추가)

// 차트를 업데이트하는 함수. expense.js에서 호출됩니다.
function updateChartsTheme() {
  // 현재 테마에 따라 텍스트 색상 결정
  const isDarkTheme = document.body.classList.contains("dark-theme");
  const textColor = isDarkTheme ? "#ffffff" : "#333333";
  const gridColor = isDarkTheme
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";

  // 기존 차트가 있다면 업데이트
  if (expenseChartInstance) {
    expenseChartInstance.options.scales.x.ticks.color = textColor;
    expenseChartInstance.options.scales.y.ticks.color = textColor;
    expenseChartInstance.options.scales.x.grid.color = gridColor;
    expenseChartInstance.options.scales.y.grid.color = gridColor;
    expenseChartInstance.options.plugins.legend.labels.color = textColor;
    expenseChartInstance.update();
  }
  if (incomeChartInstance) {
    // 수입 차트도 있다면
    incomeChartInstance.options.scales.x.ticks.color = textColor;
    incomeChartInstance.options.scales.y.ticks.color = textColor;
    incomeChartInstance.options.scales.x.grid.color = gridColor;
    incomeChartInstance.options.scales.y.grid.color = gridColor;
    incomeChartInstance.options.plugins.legend.labels.color = textColor;
    incomeChartInstance.update();
  }
}

function renderExpenseCharts(expensesData, filterDate = null) {
  const expenseChartCanvas = document.getElementById("expenseCategoryChart");
  if (!expenseChartCanvas) {
    console.warn("Expense chart canvas not found. Skipping chart rendering.");
    return;
  }

  let filteredExpenses = expensesData;

  // 필터 날짜가 있으면 해당 날짜로 필터링, 없으면 currentExpenseDate (현재 월) 기준으로 필터링
  if (filterDate) {
    filteredExpenses = expensesData.filter((item) => item.date === filterDate);
  } else if (typeof currentExpenseDate !== "undefined") {
    // currentExpenseDate가 정의되어 있는지 확인
    const year = currentExpenseDate.getFullYear();
    const month = currentExpenseDate.getMonth();
    filteredExpenses = expensesData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    });
  }

  const categoryExpense = {};
  let totalExpenses = 0; // 전체 지출 합계를 저장할 변수

  filteredExpenses.forEach((item) => {
    if (item.type === "expense") {
      if (!categoryExpense[item.category]) {
        categoryExpense[item.category] = 0;
      }
      categoryExpense[item.category] += item.amount;
      totalExpenses += item.amount; // 전체 지출 합계에 추가
    }
  });

  const labels = Object.keys(categoryExpense);
  const data = Object.values(categoryExpense);

  // 차트를 그릴 데이터가 없으면 기존 차트 파괴하고 메시지 표시
  if (labels.length === 0) {
    if (expenseChartInstance) {
      expenseChartInstance.destroy();
      expenseChartInstance = null;
    }
    // 차트 캔버스 위에 메시지 표시 (임시, CSS로 위치 조절 필요)
    expenseChartCanvas.style.display = "none"; // 캔버스 숨기기
    let chartMessageDiv = document.getElementById("expense-chart-message");
    if (!chartMessageDiv) {
      chartMessageDiv = document.createElement("div");
      chartMessageDiv.id = "expense-chart-message";
      // expenseChartCanvas의 부모 노드에 메시지를 추가합니다.
      expenseChartCanvas.parentNode.insertBefore(
        chartMessageDiv,
        expenseChartCanvas
      );
    }
    chartMessageDiv.textContent = filterDate
      ? "선택된 날짜에 지출 내역이 없습니다."
      : "현재 달에 지출 내역이 없습니다.";
    chartMessageDiv.style.textAlign = "center";
    chartMessageDiv.style.marginTop = "20px";
    return;
  } else {
    expenseChartCanvas.style.display = "block"; // 캔버스 다시 보이기
    let chartMessageDiv = document.getElementById("expense-chart-message");
    if (chartMessageDiv) {
      chartMessageDiv.remove(); // 메시지 삭제
    }
  }

  // 기존 차트가 있으면 파괴 후 재생성 (업데이트는 오류 발생 가능성이 있음)
  if (expenseChartInstance) {
    expenseChartInstance.destroy();
  }

  // 현재 테마에 따라 텍스트 색상 결정
  const isDarkTheme = document.body.classList.contains("dark-theme");
  const textColor = isDarkTheme ? "#ffffff" : "#333333";
  // gridColor는 파이 차트에는 직접 사용되지 않지만, 다른 차트 유형을 위해 유지
  // const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  expenseChartInstance = new Chart(expenseChartCanvas, {
    type: "pie", // 원형 차트 사용
    data: {
      labels: labels,
      datasets: [
        {
          label: "카테고리별 지출",
          data: data,
          backgroundColor: [
            "rgba(255, 99, 132, 0.8)", // 식비 (Red)
            "rgba(54, 162, 235, 0.8)", // 교통비 (Blue)
            "rgba(255, 206, 86, 0.8)", // 문화생활 (Yellow)
            "rgba(75, 192, 192, 0.8)", // 생활용품 (Green)
            "rgba(153, 102, 255, 0.8)", // 고정비 (Purple)
            "rgba(255, 159, 64, 0.8)", // 기타 (Orange)
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: textColor, // 범례 텍스트 색상
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.label || "";
              if (label) {
                label += ": ";
              }
              if (context.parsed !== null) {
                label += context.parsed.toLocaleString() + "원";
              }
              return label;
            },
            // 여기서 백분율을 추가합니다.
            afterLabel: function (context) {
              // 전체 지출 합계가 0이 아니면 백분율 계산
              if (totalExpenses > 0) {
                const percentage = (
                  (context.parsed / totalExpenses) *
                  100
                ).toFixed(1); // 소수점 첫째 자리까지
                return `(${percentage}%)`;
              }
              return "";
            },
          },
        },
      },
    },
  });
}
