// js/expense.js

document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const totalIncomeSpan = document.getElementById("total-income");
  const totalExpenseSpan = document.getElementById("total-expense");
  const balanceSpan = document.getElementById("balance");

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  function saveTransactions() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }

  function renderTransactions() {
    expenseList.innerHTML = "";
    let totalIncome = 0;
    let totalExpense = 0;

    // 최신순으로 정렬 (날짜, 시간 모두 고려)
    transactions.sort(
      (a, b) =>
        new Date(b.date + "T" + (b.time || "00:00:00")) -
        new Date(a.date + "T" + (a.time || "00:00:00"))
    );

    transactions.forEach((transaction) => {
      const listItem = document.createElement("li");
      listItem.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-center",
        "mb-2",
        "shadow-sm"
      );

      const typeClass =
        transaction.type === "income" ? "text-success" : "text-danger";
      const sign = transaction.type === "income" ? "+" : "-";

      // 날짜와 시간 포맷 개선
      const displayDate = transaction.date;
      const displayTime = transaction.time
        ? ` ${transaction.time.substring(0, 5)}`
        : ""; // 시:분만 표시

      listItem.innerHTML = `
                <div>
                    <small class="text-muted">${displayDate}${displayTime}</small><br>
                    <strong>${transaction.item}</strong>
                    <p class="mb-0 text-muted small">${
                      transaction.memo || ""
                    }</p>
                </div>
                <div class="d-flex align-items-center">
                    <span class="amount fw-bold ${typeClass}">${sign}${transaction.amount.toLocaleString()}원</span>
                    <button class="btn btn-sm btn-outline-danger ms-3" data-id="${
                      transaction.id
                    }">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
      expenseList.appendChild(listItem);

      if (transaction.type === "income") {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }
    });

    const balance = totalIncome - totalExpense;

    totalIncomeSpan.textContent = `${totalIncome.toLocaleString()}원`;
    totalExpenseSpan.textContent = `${totalExpense.toLocaleString()}원`;
    balanceSpan.textContent = `${balance.toLocaleString()}원`;

    // 잔액에 따른 색상 변경
    if (balance > 0) {
      balanceSpan.classList.remove("text-danger");
      balanceSpan.classList.add("text-success");
    } else if (balance < 0) {
      balanceSpan.classList.remove("text-success");
      balanceSpan.classList.add("text-danger");
    } else {
      balanceSpan.classList.remove("text-success", "text-danger");
    }
  }

  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const dateInput = document.getElementById("date");
    const itemInput = document.getElementById("item");
    const amountInput = document.getElementById("amount");
    const typeInput = document.getElementById("type");
    const memoInput = document.getElementById("memo");

    // 간단한 유효성 검사 (Bootstrap is-invalid 클래스 활용)
    let isValid = true;
    [dateInput, itemInput, amountInput].forEach((input) => {
      input.classList.remove("is-invalid");
      if (!input.value.trim()) {
        input.classList.add("is-invalid");
        isValid = false;
      }
    });

    if (!isValid) {
      alert("날짜, 항목, 금액은 필수 입력 사항입니다.");
      return;
    }

    const amountValue = parseInt(amountInput.value);
    if (isNaN(amountValue) || amountValue <= 0) {
      amountInput.classList.add("is-invalid");
      alert("금액은 0보다 큰 숫자여야 합니다.");
      return;
    }

    const newTransaction = {
      id: Date.now(), // 고유 ID 생성
      date: dateInput.value,
      // 현재 시간 추가 (같은 날 여러 기록 시 정렬을 위함)
      time: new Date().toTimeString().split(" ")[0],
      item: itemInput.value.trim(),
      amount: amountValue,
      type: typeInput.value,
      memo: memoInput.value.trim(),
    };

    transactions.push(newTransaction);
    saveTransactions();
    expenseForm.reset(); // 폼 초기화
    renderTransactions();
  });

  expenseList.addEventListener("click", (e) => {
    if (e.target.closest(".btn-outline-danger")) {
      const button = e.target.closest(".btn-outline-danger");
      const transactionId = parseInt(button.dataset.id);
      if (confirm("이 내역을 삭제하시겠습니까?")) {
        transactions = transactions.filter((t) => t.id !== transactionId);
        saveTransactions();
        renderTransactions();
      }
    }
  });

  // 초기 렌더링
  renderTransactions();

  // main.js에서 호출할 수 있도록 함수를 전역으로 노출
  window.renderTransactions = renderTransactions;
});
