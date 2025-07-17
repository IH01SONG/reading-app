document.addEventListener("DOMContentLoaded", () => {
  const expenseForm = document.getElementById("expense-form");
  const expenseList = document.getElementById("expense-list");
  const totalIncomeSpan = document.getElementById("total-income");
  const totalExpenseSpan = document.getElementById("total-expense");
  const balanceSpan = document.getElementById("balance");

  let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  // 거래 내역을 화면에 렌더링하고 잔액을 업데이트하는 함수
  function renderTransactions() {
    expenseList.innerHTML = ""; // 기존 목록 초기화
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach((transaction) => {
      const listItem = document.createElement("li");
      listItem.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-center"
      );

      const amountClass = transaction.type === "income" ? "income" : "expense";
      const sign = transaction.type === "income" ? "+" : "-";

      listItem.innerHTML = `
                <div>
                    <strong>${transaction.item}</strong>
                    <small class="text-muted d-block">${transaction.date} - ${
        transaction.memo ? transaction.memo : ""
      }</small>
                </div>
                <div class="amount ${amountClass}">
                    ${sign}${transaction.amount.toLocaleString()}원
                    <button class="btn btn-sm btn-danger ms-2" data-id="${
                      transaction.id
                    }">삭제</button>
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

    // 잔액에 따라 색상 변경
    if (balance < 0) {
      balanceSpan.classList.remove("text-success");
      balanceSpan.classList.add("text-danger");
    } else if (balance > 0) {
      balanceSpan.classList.remove("text-danger");
      balanceSpan.classList.add("text-success");
    } else {
      balanceSpan.classList.remove("text-success", "text-danger");
    }
  }

  // 새 거래 추가
  expenseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const date = document.getElementById("date").value;
    const item = document.getElementById("item").value;
    const amount = parseInt(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const memo = document.getElementById("memo").value;

    if (date && item && amount) {
      const newTransaction = {
        id: Date.now(), // 고유 ID 생성
        date,
        item,
        amount,
        type,
        memo,
      };
      transactions.push(newTransaction);
      localStorage.setItem("transactions", JSON.stringify(transactions));
      expenseForm.reset(); // 폼 초기화
      renderTransactions(); // 목록 다시 렌더링
    } else {
      alert("날짜, 항목, 금액은 필수 입력 사항입니다.");
    }
  });

  // 거래 삭제
  expenseList.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-danger")) {
      const idToDelete = parseInt(e.target.dataset.id);
      transactions = transactions.filter(
        (transaction) => transaction.id !== idToDelete
      );
      localStorage.setItem("transactions", JSON.stringify(transactions));
      renderTransactions();
    }
  });

  // 페이지 로드 시 초기 렌더링
  renderTransactions();
});
// 전역으로 노출 (main.js에서 호출할 수 있도록)
window.renderTransactions = renderTransactions;
