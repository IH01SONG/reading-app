// js/expense.js

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let currentExpenseDate = new Date(); // Track current month for expense calendar
let selectedCalendarDate = null; // To highlight selected date in calendar

// DOM Elements - 이들은 initExpenseTab() 내부에서 한 번만 참조됩니다.
let expenseForm;
let expenseList;
let totalIncomeSpan;
let totalExpenseSpan;
let balanceSpan;
let expenseCalendarEl;
let expenseCurrentMonthYearEl;
let expensePrevMonthBtn;
let expenseNextMonthBtn;
let expenseCategorySummaryEl;
let categorySummaryMessage;

// 초기화 함수
function initExpenseTab() {
  // 요소가 이미 초기화되었는지 확인하여 불필요한 재설정 방지
  if (!expenseForm) {
    expenseForm = document.getElementById("expense-form");
    expenseList = document.getElementById("expense-list");
    totalIncomeSpan = document.getElementById("total-income");
    totalExpenseSpan = document.getElementById("total-expense");
    balanceSpan = document.getElementById("balance");
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
      selectedCalendarDate = null; // Reset selection on month change
      updateAllExpenseViews(); // Re-render everything
    });

    expenseNextMonthBtn.addEventListener("click", () => {
      currentExpenseDate.setMonth(currentExpenseDate.getMonth() + 1);
      selectedCalendarDate = null; // Reset selection on month change
      updateAllExpenseViews(); // Re-render everything
    });
  }

  // 탭이 활성화될 때마다 모든 뷰를 업데이트
  updateAllExpenseViews();
}

function updateAllExpenseViews() {
  saveExpenses(); // 데이터 저장 및 모든 뷰 업데이트 트리거
  updateSummary();
  renderExpenseList(selectedCalendarDate); // 선택된 날짜에 따라 내역 표시
  updateExpenseCalendar();
  updateExpenseCategorySummary(selectedCalendarDate); // 선택된 날짜에 따라 카테고리 요약 표시
}

// =========================================================================
// 1. 가계부 데이터 처리 함수
// =========================================================================

function saveExpenses() {
  localStorage.setItem("expenses", JSON.stringify(expenses));
  // 여기서 updateSummary, renderExpenseList 등을 직접 호출하지 않습니다.
  // updateAllExpenseViews()가 이를 관리합니다.
}

function handleExpenseFormSubmit(e) {
  e.preventDefault();
  const description = document.getElementById("expense-description").value;
  const amount = document.getElementById("expense-amount").value;
  const category = document.getElementById("expense-category").value;
  const type = document.getElementById("expense-type").value;

  const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식
  expenses.push({
    description,
    amount: parseFloat(amount),
    category,
    type,
    date,
  });
  saveExpenses(); // 데이터 저장 (이 함수 내부에서 모든 뷰 업데이트 트리거)

  expenseForm.reset();
  document.getElementById("expense-description").focus();
}

function deleteExpense(index) {
  expenses.splice(index, 1);
  saveExpenses(); // 데이터 저장 (이 함수 내부에서 모든 뷰 업데이트 트리거)
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
    const currentMonthStart = new Date(year, month, 1)
      .toISOString()
      .split("T")[0];
    const currentMonthEnd = new Date(year, month + 1, 0)
      .toISOString()
      .split("T")[0];

    filteredExpenses = expenses.filter((item) => {
      return item.date >= currentMonthStart && item.date <= currentMonthEnd;
    });
    if (filteredExpenses.length === 0) {
      expenseList.innerHTML =
        '<li class="list-group-item text-center text-muted">이번 달 내역이 없습니다.</li>';
    }
  }

  filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신 내역부터

  filteredExpenses.forEach((item) => {
    // 원본 배열에서의 인덱스를 찾아야 정확하게 삭제 가능
    const originalIndex = expenses.findIndex(
      (exp) =>
        exp.description === item.description &&
        exp.amount === item.amount &&
        exp.category === item.category &&
        exp.type === item.type &&
        exp.date === item.date
    );

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
            <button class="btn btn-sm btn-outline-danger delete-expense-btn" data-index="${originalIndex}">
                <i class="bi bi-x-lg"></i>
            </button>
        `;
    expenseList.appendChild(li);
  });

  // Delete button event listener
  expenseList.querySelectorAll(".delete-expense-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      const index = parseInt(e.currentTarget.dataset.index);
      deleteExpense(index);
    });
  });
}

function updateSummary() {
  let totalIncome = 0;
  let totalExpense = 0;

  const year = currentExpenseDate.getFullYear();
  const month = currentExpenseDate.getMonth();
  const currentMonthStart = new Date(year, month, 1)
    .toISOString()
    .split("T")[0];
  const currentMonthEnd = new Date(year, month + 1, 0)
    .toISOString()
    .split("T")[0];

  expenses.forEach((item) => {
    if (item.date >= currentMonthStart && item.date <= currentMonthEnd) {
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
  balanceSpan.textContent = `${balance.toLocaleString()}원`;

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
      updateExpenseCategorySummary(selectedCalendarDate);
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
// 3. 카테고리별 통계 함수
// =========================================================================

function updateExpenseCategorySummary(filterDate = null) {
  expenseCategorySummaryEl.innerHTML = "";
  categorySummaryMessage.style.display = "none";

  let filteredExpensesForSummary = expenses;

  if (filterDate) {
    filteredExpensesForSummary = expenses.filter(
      (item) => item.date === filterDate
    );
  } else {
    const year = currentExpenseDate.getFullYear();
    const month = currentExpenseDate.getMonth();
    const currentMonthStart = new Date(year, month, 1)
      .toISOString()
      .split("T")[0];
    const currentMonthEnd = new Date(year, month + 1, 0)
      .toISOString()
      .split("T")[0];
    filteredExpensesForSummary = expenses.filter((item) => {
      return item.date >= currentMonthStart && item.date <= currentMonthEnd;
    });
  }

  if (filteredExpensesForSummary.length === 0) {
    categorySummaryMessage.textContent = filterDate
      ? "선택된 날짜에 내역이 없습니다."
      : "현재 달에 내역이 없습니다.";
    categorySummaryMessage.style.display = "block";
    return;
  }

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

  let hasContent = false;
  for (const category in categorySummary) {
    const summary = categorySummary[category];
    const li = document.createElement("li");
    li.className = "list-group-item expense-category-item";

    let content = `
            <span class="category-name">${category}</span>
            <div>
        `;
    if (summary.income > 0) {
      content += `<span class="category-amount text-success">+${summary.income.toLocaleString()}원</span>`;
    }
    if (summary.expense > 0) {
      if (summary.income > 0) content += " ";
      content += `<span class="category-amount text-danger">-${summary.expense.toLocaleString()}원</span>`;
    }
    content += `</div>`;
    li.innerHTML = content;
    expenseCategorySummaryEl.appendChild(li);
    hasContent = true;
  }

  if (!hasContent) {
    categorySummaryMessage.textContent = filterDate
      ? "선택된 날짜에 카테고리별 통계가 없습니다."
      : "현재 달에 카테고리별 통계가 없습니다.";
    categorySummaryMessage.style.display = "block";
  }
}

// initExpenseTab 함수를 전역 스코프에 노출하여 main.js에서 호출할 수 있도록 함
window.initExpenseTab = initExpenseTab;
