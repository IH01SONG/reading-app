// js/expense.js

let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
let currentExpenseDate = new Date(); // Track current month for expense calendar
let selectedCalendarDate = null; // To highlight selected date in calendar

// DOM Elements - 이들은 initExpenseTab() 내부에서 한 번만 참조됩니다.
let expenseForm;
let expenseDescriptionInput; // input 요소 참조를 정확히 가져오도록 변수명 변경
let expenseAmountInput; // input 요소 참조를 정확히 가져오도록 변수명 변경
let expenseCategorySelect; // select 요소 참조를 정확히 가져오도록 변수명 변경
let expenseTypeSelect; // select 요소 참조를 정확히 가져오도록 변수명 변경

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
    // 처음 로드될 때만 DOM 요소 참조 및 이벤트 리스너 등록
    expenseForm = document.getElementById("expense-form");

    // 새로 추가된 input/select 요소 참조
    expenseDescriptionInput = document.getElementById("expense-description");
    expenseAmountInput = document.getElementById("expense-amount");
    expenseCategorySelect = document.getElementById("expense-category");
    expenseTypeSelect = document.getElementById("expense-type");

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
  // 이 부분이 핵심 변경: 데이터를 저장한 후, 화면을 즉시 업데이트하도록 호출합니다.
  updateAllExpenseViews();
}

function handleExpenseFormSubmit(e) {
  e.preventDefault();
  // DOM 요소에서 직접 value를 가져오도록 수정
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
  }); // 고유 ID 추가
  saveExpenses(); // 데이터 저장 (이제 이 함수 내부에서 모든 뷰 업데이트 트리거)

  expenseForm.reset();
  expenseDescriptionInput.focus(); // 첫 번째 입력 필드로 포커스 이동
}

// ID를 기반으로 항목 삭제
function deleteExpense(id) {
  expenses = expenses.filter((item) => item.id !== id);
  saveExpenses(); // 데이터 저장 및 모든 뷰 업데이트
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
    // 현재 달의 내역만 필터링
    filteredExpenses = expenses.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    });
    if (filteredExpenses.length === 0) {
      expenseList.innerHTML =
        '<li class="list-group-item text-center text-muted">이번 달 내역이 없습니다.</li>';
    }
  }

  // 최신 내역부터 보이도록 정렬
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

  // Delete button event listener 등록 (매번 다시 렌더링되므로, 이 위치에서 등록해야 함)
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

  // 현재 월의 내역만 요약
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
    filteredExpensesForSummary = expenses.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
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
