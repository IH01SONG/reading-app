// expense.js
document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const totalIncomeSpan = document.getElementById("total-income");
  const totalExpenseSpan = document.getElementById("total-expense");
  const balanceSpan = document.getElementById("balance");

  // Calendar elements for Expense tab
  const expenseCalendarEl = document.getElementById("expense-calendar");
  const expenseCurrentMonthYearEl = document.getElementById(
    "expense-current-month-year"
  );
  const expensePrevMonthBtn = document.getElementById("expense-prev-month");
  const expenseNextMonthBtn = document.getElementById("expense-next-month");

  // Category Summary elements
  const expenseCategorySummaryEl = document.getElementById(
    "expense-category-summary"
  );
  const categorySummaryMessage = document.getElementById(
    "category-summary-message"
  );

  let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
  let currentExpenseDate = new Date(); // Track current month for expense calendar
  let selectedCalendarDate = null; // To highlight selected date in calendar

  // =========================================================================
  // 1. 가계부 데이터 처리 함수
  // =========================================================================

  function saveExpenses() {
    localStorage.setItem("expenses", JSON.stringify(expenses));
    updateSummary();
    renderExpenseList();
    updateExpenseCalendar(); // 가계부 내역 변경 시 달력 업데이트
    updateExpenseCategorySummary(); // 가계부 내역 변경 시 카테고리 요약 업데이트
  }

  function addExpense(description, amount, category, type) {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식
    expenses.push({
      description,
      amount: parseFloat(amount),
      category,
      type,
      date,
    });
    saveExpenses();
  }

  function deleteExpense(index) {
    expenses.splice(index, 1);
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
      // 현재 달력의 월에 해당하는 내역만 필터링
      const currentMonthStart = new Date(
        currentExpenseDate.getFullYear(),
        currentExpenseDate.getMonth(),
        1
      );
      const currentMonthEnd = new Date(
        currentExpenseDate.getFullYear(),
        currentExpenseDate.getMonth() + 1,
        0
      );

      filteredExpenses = expenses.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= currentMonthStart && itemDate <= currentMonthEnd;
      });
      if (filteredExpenses.length === 0) {
        expenseList.innerHTML =
          '<li class="list-group-item text-center text-muted">이번 달 내역이 없습니다.</li>';
      }
    }

    filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)); // 최신 내역부터

    filteredExpenses.forEach((item, index) => {
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
                <button class="btn btn-sm btn-outline-danger delete-expense-btn" data-index="${expenses.indexOf(
                  item
                )}">
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

    // 현재 달력의 월에 해당하는 내역만 요약
    const currentMonthStart = new Date(
      currentExpenseDate.getFullYear(),
      currentExpenseDate.getMonth(),
      1
    );
    const currentMonthEnd = new Date(
      currentExpenseDate.getFullYear(),
      currentExpenseDate.getMonth() + 1,
      0
    );

    expenses.forEach((item) => {
      const itemDate = new Date(item.date);
      if (itemDate >= currentMonthStart && itemDate <= currentMonthEnd) {
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

    // 잔액에 따라 색상 변경
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
    expenseCategorySummaryEl.innerHTML = ""; // 달력 변경 시 카테고리 요약 초기화
    categorySummaryMessage.style.display = "block"; // 메시지 다시 표시

    const year = currentExpenseDate.getFullYear();
    const month = currentExpenseDate.getMonth(); // 0-indexed

    // Update month/year display
    expenseCurrentMonthYearEl.textContent = `${year}년 ${month + 1}월`;

    // Get first day of the month (0 = Sunday, 6 = Saturday)
    const firstDay = new Date(year, month, 1).getDay();
    // Get number of days in the month
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Previous month's dates to fill leading empty cells
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = 0; i < firstDay; i++) {
      const cell = document.createElement("div");
      cell.className = "day-cell empty";
      cell.textContent = prevMonthDays - firstDay + i + 1; // Display prev month's dates
      expenseCalendarEl.appendChild(cell);
    }

    // Current month's dates
    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div");
      const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      cell.className = "day-cell expense-day-cell";
      cell.dataset.date = fullDate;

      // Check if this date has expenses/income
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

      // Highlight selected date if it matches
      if (selectedCalendarDate === fullDate) {
        cell.classList.add("selected-date");
      }

      // Click event for date selection
      cell.addEventListener("click", () => {
        // Remove previous selection highlight
        if (selectedCalendarDate) {
          const prevSelectedCell = expenseCalendarEl.querySelector(
            `[data-date="${selectedCalendarDate}"]`
          );
          if (prevSelectedCell) {
            prevSelectedCell.classList.remove("selected-date");
          }
        }
        // Set new selection
        selectedCalendarDate = fullDate;
        cell.classList.add("selected-date");

        renderExpenseList(selectedCalendarDate); // Update expense list for selected date
        updateExpenseCategorySummary(selectedCalendarDate); // Update category summary for selected date
      });

      expenseCalendarEl.appendChild(cell);
    }

    // Next month's dates to fill trailing empty cells
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= remainingCells; i++) {
      const cell = document.createElement("div");
      cell.className = "day-cell empty";
      cell.textContent = i; // Display next month's dates
      expenseCalendarEl.appendChild(cell);
    }
  }

  // Event listeners for month navigation
  expensePrevMonthBtn.addEventListener("click", () => {
    currentExpenseDate.setMonth(currentExpenseDate.getMonth() - 1);
    selectedCalendarDate = null; // Reset selection on month change
    saveExpenses(); // Re-render everything
  });

  expenseNextMonthBtn.addEventListener("click", () => {
    currentExpenseDate.setMonth(currentExpenseDate.getMonth() + 1);
    selectedCalendarDate = null; // Reset selection on month change
    saveExpenses(); // Re-render everything
  });

  // =========================================================================
  // 3. 카테고리별 통계 함수
  // =========================================================================

  function updateExpenseCategorySummary(filterDate = null) {
    expenseCategorySummaryEl.innerHTML = "";
    categorySummaryMessage.style.display = "none"; // 메시지 숨기기

    let filteredExpensesForSummary = expenses;

    if (filterDate) {
      // 특정 날짜가 선택된 경우
      filteredExpensesForSummary = expenses.filter(
        (item) => item.date === filterDate
      );
    } else {
      // 월 전체를 기준으로 하는 경우
      const currentMonthStart = new Date(
        currentExpenseDate.getFullYear(),
        currentExpenseDate.getMonth(),
        1
      );
      const currentMonthEnd = new Date(
        currentExpenseDate.getFullYear(),
        currentExpenseDate.getMonth() + 1,
        0
      );
      filteredExpensesForSummary = expenses.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= currentMonthStart && itemDate <= currentMonthEnd;
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

    // Display summary
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
        if (summary.income > 0) content += " "; // Add space if both exist
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

  // =========================================================================
  // 4. 초기화 및 이벤트 리스너
  // =========================================================================

  // 가계부 폼 제출 이벤트
  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const description = document.getElementById("expense-description").value;
    const amount = document.getElementById("expense-amount").value;
    const category = document.getElementById("expense-category").value; // 카테고리 값 가져오기
    const type = document.getElementById("expense-type").value;

    addExpense(description, amount, category, type);

    expenseForm.reset();
    document.getElementById("expense-description").focus(); // 입력 후 포커스 유지
  });

  // 전역 스코프에 함수 노출 (main.js에서 호출할 수 있도록)
  window.updateExpenseCalendar = updateExpenseCalendar;
  window.updateExpenseCategorySummary = updateExpenseCategorySummary;

  // 초기 로드 시 가계부 요약, 내역, 달력, 카테고리 통계 업데이트
  saveExpenses(); // 이 함수가 모든 것을 호출합니다

  // 페이지 로드 시 현재 탭이 expense-tab 이면 달력과 통계 업데이트
  const activeTab = document.querySelector("#myTab .nav-link.active");
  if (activeTab && activeTab.id === "expense-tab") {
    updateExpenseCalendar();
    updateExpenseCategorySummary();
  }
});
