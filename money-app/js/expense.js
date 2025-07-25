// js/expense.js

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let currentExpenseDate = new Date(); // Track current month for expense calendar
let selectedCalendarDate = null; // To highlight selected selected date in calendar

// DOM Elements - 이들은 initExpenseTab() 내부에서 한 번만 참조됩니다.
let expenseForm;
let expenseDescriptionInput;
let expenseAmountInput;
let expenseCategorySelect;
let expenseTypeSelect;

let expenseList;
let totalIncomeSpan;
let totalExpenseSpan;
let balanceSpan;
let incomeExpenseRatioInlineSpan; // 인라인 비율 표시 span 참조 변경
let expenseCalendarEl;
let expenseCurrentMonthYearEl;
let expensePrevMonthBtn;
let expenseNextMonthBtn;
let expenseCategorySummaryEl;
let categorySummaryMessage; // 고급 필터 메시지 요소

// 초기화 함수
function initExpenseTab() {
  // 요소가 이미 초기화되었는지 확인하여 불필요한 재설정 방지
  if (!expenseForm) {
    // 처음 로드될 때만 DOM 요소 참조 및 이벤트 리스너 등록
    expenseForm = document.getElementById("expense-form");

    expenseDescriptionInput = document.getElementById("expense-description");
    expenseAmountInput = document.getElementById("expense-amount");
    expenseCategorySelect = document.getElementById("expense-category");
    expenseTypeSelect = document.getElementById("expense-type");

    expenseList = document.getElementById("expense-list");
    totalIncomeSpan = document.getElementById("total-income");
    totalExpenseSpan = document.getElementById("total-expense");
    balanceSpan = document.getElementById("balance");
    incomeExpenseRatioInlineSpan = document.getElementById(
      "income-expense-ratio-inline"
    ); // DOM 요소 참조 ID 변경
    expenseCalendarEl = document.getElementById("expense-calendar");
    expenseCurrentMonthYearEl = document.getElementById(
      "expense-current-month-year"
    );
    expensePrevMonthBtn = document.getElementById("expense-prev-month");
    expenseNextMonthBtn = document.getElementById("expense-next-month");
    expenseCategorySummaryEl = document.getElementById(
      "expense-category-summary"
    );
    categorySummaryMessage = document.getElementById(
      "category-summary-message"
    );

    // 이벤트 리스너는 한 번만 등록
    expenseForm.addEventListener("submit", handleExpenseFormSubmit);

    expensePrevMonthBtn.addEventListener("click", () => {
      currentExpenseDate.setMonth(currentExpenseDate.getMonth() - 1);
      selectedCalendarDate = null; // 월 변경 시 선택된 날짜 초기화
      updateAllExpenseViews();
    });

    expenseNextMonthBtn.addEventListener("click", () => {
      currentExpenseDate.setMonth(currentExpenseDate.getMonth() + 1);
      selectedCalendarDate = null; // 월 변경 시 선택된 날짜 초기화
      updateAllExpenseViews();
    });
  }

  // 탭이 활성화될 때마다 모든 뷰를 업데이트
  updateAllExpenseViews();
}

function updateAllExpenseViews() {
  updateSummary(); // 요약 업데이트
  renderExpenseList(selectedCalendarDate); // 내역 리스트 업데이트
  updateExpenseCalendar(); // 달력 업데이트
  updateExpenseCategorySummary(selectedCalendarDate); // 카테고리별 요약 업데이트 (강화된 부분)

  // 차트 렌더링 (expense.js의 expenses 변수를 직접 전달)
  renderExpenseCharts(expenses, selectedCalendarDate);
}

// =========================================================================
// 1. 가계부 데이터 처리 함수
// =========================================================================

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
  updateAllExpenseViews();
}

function handleExpenseFormSubmit(e) {
  e.preventDefault();

  const description = expenseDescriptionInput.value;
  const amount = expenseAmountInput.value;
  const category = expenseCategorySelect.value;
  const type = expenseTypeSelect.value;

  if (!description || !amount || parseFloat(amount) <= 0) {
    alert("내역과 금액을 정확히 입력해주세요.");
    return;
  }

  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식
  expenses.push({
    description,
    amount: parseFloat(amount),
    category,
    type,
    date,
    id: Date.now(),
  });
  saveExpenses();

  expenseForm.reset();
  expenseDescriptionInput.focus();
}

function deleteExpense(id) {
  expenses = expenses.filter((item) => item.id !== id);
  saveExpenses();
}

function renderExpenseList(filterDate = null) {
  expenseList.innerHTML = "";
  let filteredExpenses = expenses;

  if (filterDate) {
    filteredExpenses = expenses.filter((item) => item.date === filterDate);
    if (filteredExpenses.length === 0) {
      expenseList.innerHTML =
        '<li class="list-group-item text-center text-muted">이 날짜에는 내역이 없습니다.</li>';
    }
  } else {
    const year = currentExpenseDate.getFullYear();
    const month = currentExpenseDate.getMonth();
    filteredExpenses = expenses.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    });
    if (filteredExpenses.length === 0) {
      expenseList.innerHTML =
        '<li class="list-group-item text-center text-muted">이번 달 내역이 없습니다.</li>';
    }
  }

  filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  filteredExpenses.forEach((item) => {
    const li = document.createElement("li");
    li.className =
      "list-group-item d-flex justify-content-between align-items-center";

    let amountClass = item.type === "income" ? "text-success" : "text-danger";
    let sign = item.type === "income" ? "+" : "-";

    li.innerHTML = `
            <div>
                <strong>${item.description}</strong><br>
                <small class="text-muted">(${item.category}) ${
      item.date
    }</small>
            </div>
            <span class="fw-bold ${amountClass}">${sign}${item.amount.toLocaleString()}원</span>
            <button class="btn btn-sm btn-outline-danger delete-expense-btn" data-id="${
              item.id
            }">
                <i class="bi bi-x-lg"></i>
            </button>
        `;
    expenseList.appendChild(li);
  });

  expenseList.querySelectorAll(".delete-expense-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      if (confirm("이 내역을 삭제하시겠습니까?")) {
        deleteExpense(id);
      }
    });
  });
}

function updateSummary() {
  let totalIncome = 0;
  let totalExpense = 0;

  const year = currentExpenseDate.getFullYear();
  const month = currentExpenseDate.getMonth();

  expenses.forEach((item) => {
    const itemDate = new Date(item.date);
    if (itemDate.getFullYear() === year && itemDate.getMonth() === month) {
      if (item.type === "income") {
        totalIncome += item.amount;
      } else {
        totalExpense += item.amount;
      }
    }
  });

  const balance = totalIncome - totalExpense;

  totalIncomeSpan.textContent = `${totalIncome.toLocaleString()}원`;
  totalExpenseSpan.textContent = `${totalExpense.toLocaleString()}원`;
  balanceSpan.textContent = `${balance.toLocaleString()}원`; // 잔액은 여전히 balanceSpan이 업데이트

  // 수익 대비 지출 비율 계산 및 표시
  let ratio = 0;
  if (totalIncome > 0) {
    ratio = (totalExpense / totalIncome) * 100;
  }
  // incomeExpenseRatioInlineSpan에 직접 업데이트
  incomeExpenseRatioInlineSpan.textContent = `${ratio.toFixed(1)}%`;

  if (balance >= 0) {
    balanceSpan.className = "text-success";
  } else {
    balanceSpan.className = "text-danger";
  }
}

// =========================================================================
// 2. 가계부 달력 함수
// =========================================================================

function updateExpenseCalendar() {
  expenseCalendarEl.innerHTML = "";

  const year = currentExpenseDate.getFullYear();
  const month = currentExpenseDate.getMonth(); // 0-indexed

  expenseCurrentMonthYearEl.textContent = `${year}년 ${month + 1}월`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = 0; i < firstDay; i++) {
    const cell = document.createElement("div");
    cell.className = "day-cell empty";
    cell.textContent = prevMonthDays - firstDay + i + 1;
    expenseCalendarEl.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    cell.className = "day-cell expense-day-cell";
    cell.dataset.date = fullDate;

    const dailySummary = expenses
      .filter((item) => item.date === fullDate)
      .reduce(
        (acc, item) => {
          if (item.type === "income") acc.income += item.amount;
          else acc.expense += item.amount;
          return acc;
        },
        { income: 0, expense: 0 }
      );

    cell.innerHTML = `
            <span class="day-number">${day}</span>
            ${
              dailySummary.income > 0
                ? `<span class="income-amount">${dailySummary.income.toLocaleString()}원</span>`
                : ""
            }
            ${
              dailySummary.expense > 0
                ? `<span class="expense-amount">-${dailySummary.expense.toLocaleString()}원</span>`
                : ""
            }
        `;

    if (selectedCalendarDate === fullDate) {
      cell.classList.add("selected-date");
    }

    cell.addEventListener("click", () => {
      if (selectedCalendarDate) {
        const prevSelectedCell = expenseCalendarEl.querySelector(
          `[data-date="${selectedCalendarDate}"]`
        );
        if (prevSelectedCell) {
          prevSelectedCell.classList.remove("selected-date");
        }
      }
      selectedCalendarDate = fullDate;
      cell.classList.add("selected-date");

      renderExpenseList(selectedCalendarDate);
      updateExpenseCategorySummary(selectedCalendarDate); // 날짜 선택 시 카테고리 요약도 업데이트
      renderExpenseCharts(expenses, selectedCalendarDate); // 날짜 선택 시 차트도 업데이트
    });

    expenseCalendarEl.appendChild(cell);
  }

  const totalCells = firstDay + daysInMonth;
  const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remainingCells; i++) {
    const cell = document.createElement("div");
    cell.className = "day-cell empty";
    cell.textContent = i;
    expenseCalendarEl.appendChild(cell);
  }
}

// =========================================================================
// 3. 카테고리별 통계 함수 (강화된 고급 필터)
// =========================================================================

function updateExpenseCategorySummary(filterDate = null) {
  expenseCategorySummaryEl.innerHTML = ""; // 기존 목록 초기화
  categorySummaryMessage.style.display = "none"; // 메시지 숨김

  let filteredExpensesForSummary = expenses;

  // 필터링 기준 설정 (선택된 날짜 또는 현재 월)
  let summaryPeriodText = "";
  if (filterDate) {
    filteredExpensesForSummary = expenses.filter(
      (item) => item.date === filterDate
    );
    summaryPeriodText = `선택된 날짜 (${filterDate}) `;
  } else {
    const year = currentExpenseDate.getFullYear();
    const month = currentExpenseDate.getMonth();
    filteredExpensesForSummary = expenses.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    });
    summaryPeriodText = `현재 달 (${year}년 ${month + 1}월) `;
  }

  // 데이터가 없을 경우 메시지 표시
  if (filteredExpensesForSummary.length === 0) {
    categorySummaryMessage.textContent =
      summaryPeriodText + "내역이 없어 카테고리별 통계를 표시할 수 없습니다.";
    categorySummaryMessage.style.display = "block";
    return;
  }

  // 카테고리별 수입/지출 집계
  const categorySummary = {};
  filteredExpensesForSummary.forEach((item) => {
    if (!categorySummary[item.category]) {
      categorySummary[item.category] = { income: 0, expense: 0 };
    }
    if (item.type === "income") {
      categorySummary[item.category].income += item.amount;
    } else {
      categorySummary[item.category].expense += item.amount;
    }
  });

  // 집계된 데이터를 바탕으로 목록 생성
  let hasContent = false;
  for (const category in categorySummary) {
    const summary = categorySummary[category];

    // 해당 카테고리에 수입도 지출도 없다면 건너뜀 (거의 발생하지 않음)
    if (summary.income === 0 && summary.expense === 0) {
      continue;
    }

    const li = document.createElement("li");
    li.className =
      "list-group-item expense-category-item d-flex justify-content-between align-items-center";

    let categoryAmountsHtml = "";
    if (summary.income > 0) {
      categoryAmountsHtml += `<span class="category-amount text-success">+${summary.income.toLocaleString()}원</span>`;
    }
    if (summary.expense > 0) {
      // 수입도 있고 지출도 있으면 간격 추가
      if (summary.income > 0) categoryAmountsHtml += " ";
      categoryAmountsHtml += `<span class="category-amount text-danger">-${summary.expense.toLocaleString()}원</span>`;
    }

    li.innerHTML = `
            <span class="category-name fw-bold">${category}</span>
            <div>${categoryAmountsHtml}</div>
        `;
    expenseCategorySummaryEl.appendChild(li);
    hasContent = true;
  }

  // 모든 카테고리에 데이터가 없거나, 필터링 후 내용이 없을 때
  if (!hasContent) {
    categorySummaryMessage.textContent =
      summaryPeriodText +
      "내역은 있으나, 카테고리별 수입/지출 통계를 표시할 항목이 없습니다.";
    categorySummaryMessage.style.display = "block";
  }
}

// initExpenseTab 함수를 전역 스코프에 노출하여 main.js에서 호출할 수 있도록 함
window.initExpenseTab = initExpenseTab;
