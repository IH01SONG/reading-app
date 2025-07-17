// js/main.js

document.addEventListener("DOMContentLoaded", () => {
  const themeToggleButton = document.getElementById("theme-toggle-btn");
  const body = document.body;

  // 1. 저장된 테마 불러오기 (새로고침 시 유지)
  const savedTheme = localStorage.getItem("theme") || "light-theme";
  body.classList.add(savedTheme);
  updateToggleButton(savedTheme);

  // 2. 테마 토글 버튼 클릭 이벤트
  themeToggleButton.addEventListener("click", () => {
    if (body.classList.contains("light-theme")) {
      body.classList.remove("light-theme");
      body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark-theme");
      updateToggleButton("dark-theme");
    } else {
      body.classList.remove("dark-theme");
      body.classList.add("light-theme");
      localStorage.setItem("theme", "light-theme");
      updateToggleButton("light-theme");
    }
    // 테마 변경 후 차트 다시 그리기 (색상 변경 적용)
    if (typeof renderHabitStats === "function") {
      renderHabitStats();
    }
  });

  // 3. 버튼 텍스트와 아이콘 업데이트 함수
  function updateToggleButton(currentTheme) {
    const icon = themeToggleButton.querySelector("i");
    if (currentTheme === "dark-theme") {
      themeToggleButton.innerHTML =
        '<i class="bi bi-sun-fill me-2"></i>라이트 모드';
      themeToggleButton.classList.remove("btn-outline-secondary");
      themeToggleButton.classList.add("btn-outline-primary"); // 네온 그린 버튼으로
    } else {
      themeToggleButton.innerHTML =
        '<i class="bi bi-moon-fill me-2"></i>나이트 모드';
      themeToggleButton.classList.remove("btn-outline-primary");
      themeToggleButton.classList.add("btn-outline-secondary");
    }
  }

  // 4. Bootstrap 탭 이벤트 리스너 (기존 탭 전환 로직 유지)
  const myTab = document.getElementById("myTab");
  if (myTab) {
    myTab.addEventListener("shown.bs.tab", function (e) {
      const activeTabId = e.target.id;
      // 각 JS 파일의 렌더링 함수를 전역으로 호출 (window 객체에 추가했다고 가정)
      if (
        activeTabId === "expense-tab" &&
        typeof window.renderTransactions === "function"
      ) {
        window.renderTransactions();
      } else if (
        activeTabId === "todo-tab" &&
        typeof window.renderTodos === "function"
      ) {
        window.renderTodos();
      } else if (
        activeTabId === "habit-tab" &&
        typeof window.renderHabits === "function"
      ) {
        // habit 탭의 경우 모든 하위 렌더링 함수를 호출하도록 renderHabits를 직접 정의해야 함
        // 또는 habit.js에서 하나의 main render 함수로 통합
        window.renderHabits(); // 이 함수는 habit.js에 정의된 모든 렌더링을 포함해야 함
      }
    });
  }

  // 초기 렌더링 함수들을 전역으로 노출
  // 각 JS 파일 (expense.js, todo.js, habit.js)의 맨 위나 필요한 함수 정의 후 추가
  // 예:
  // // expense.js
  // window.renderTransactions = renderTransactions;
  //
  // // todo.js
  // window.renderTodos = renderTodos;
  //
  // // habit.js
  // window.renderHabits = () => { renderActiveHabitList(); renderIntegratedCalendar(); renderHabitStats(); };
  // window.renderHabitStats = renderHabitStats; // 차트 업데이트를 위해 통계 렌더링 함수도 노출
});
