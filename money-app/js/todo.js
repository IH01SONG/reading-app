// js/todo.js

document.addEventListener("DOMContentLoaded", () => {
  const todoForm = document.getElementById("todo-form");
  const todoList = document.getElementById("todo-list");

  let todos = JSON.parse(localStorage.getItem("todos")) || [];

  // To-Do 항목을 화면에 렌더링하는 함수
  function renderTodos() {
    todoList.innerHTML = ""; // 기존 목록 초기화

    // 마감일이 가까운 순으로 정렬 (선택 사항)
    todos.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1; // 완료된 항목은 뒤로
      }
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });

    if (todos.length === 0) {
      todoList.innerHTML =
        '<li class="list-group-item text-muted text-center">아직 할 일이 없습니다.</li>';
      return;
    }

    todos.forEach((todo) => {
      const listItem = document.createElement("li");
      listItem.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-center",
        "my-1", // 여백 추가
        `priority-${todo.priority}` // 우선순위에 따른 클래스
      );

      // 완료된 할 일에 대한 스타일
      if (todo.completed) {
        listItem.classList.add("list-group-item-secondary", "completed-todo");
      }

      // 마감일이 지났거나 임박한 할 일에 대한 경고
      let dueDateText = todo.dueDate ? ` (마감: ${todo.dueDate})` : "";
      if (todo.dueDate && !todo.completed) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(todo.dueDate);
        due.setHours(0, 0, 0, 0);

        if (due < today) {
          listItem.classList.add("list-group-item-danger"); // 마감일 지남
          dueDateText += " - 기한 지남!";
        } else if (due.getTime() === today.getTime()) {
          listItem.classList.add("list-group-item-warning"); // 오늘 마감
          dueDateText += " - 오늘 마감!";
        }
      }

      listItem.innerHTML = `
                <div class="form-check d-flex align-items-center">
                    <input class="form-check-input me-2" type="checkbox" data-id="${
                      todo.id
                    }" ${todo.completed ? "checked" : ""}>
                    <label class="form-check-label ${
                      todo.completed ? "text-muted" : ""
                    }">
                        <strong class="${
                          todo.completed ? "text-decoration-line-through" : ""
                        }">${todo.text}</strong>
                        <small class="d-block text-muted">${dueDateText}</small>
                        <span class="badge bg-${getPriorityBadgeColor(
                          todo.priority
                        )} ms-2">${getPriorityText(todo.priority)}</span>
                    </label>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-secondary me-1" data-id="${
                      todo.id
                    }" data-action="edit">편집</button>
                    <button class="btn btn-sm btn-outline-danger" data-id="${
                      todo.id
                    }" data-action="delete">삭제</button>
                </div>
            `;
      todoList.appendChild(listItem);
    });
  }

  // 우선순위 뱃지 색상 헬퍼
  function getPriorityBadgeColor(priority) {
    switch (priority) {
      case "high":
        return "danger";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "secondary";
    }
  }

  // 우선순위 텍스트 헬퍼
  function getPriorityText(priority) {
    switch (priority) {
      case "high":
        return "높음";
      case "medium":
        return "중간";
      case "low":
        return "낮음";
      default:
        return "미정";
    }
  }

  // 할 일 추가
  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const todoTextInput = document.getElementById("todo-text");
    const todoDueDateInput = document.getElementById("todo-due-date");
    const todoPrioritySelect = document.getElementById("todo-priority");

    const text = todoTextInput.value.trim();
    const dueDate = todoDueDateInput.value; // YYYY-MM-DD 형식
    const priority = todoPrioritySelect.value;

    if (text === "") {
      alert("할 일 내용을 입력해주세요.");
      return;
    }

    const newTodo = {
      id: Date.now(),
      text,
      dueDate,
      priority,
      completed: false, // 초기에는 완료되지 않음
    };

    todos.push(newTodo);
    localStorage.setItem("todos", JSON.stringify(todos));
    todoForm.reset(); // 폼 초기화
    renderTodos(); // 목록 다시 렌더링
  });

  // 할 일 완료, 편집, 삭제 처리 (이벤트 위임)
  todoList.addEventListener("click", (e) => {
    const id = parseInt(e.target.dataset.id);
    const todoIndex = todos.findIndex((todo) => todo.id === id);

    if (todoIndex === -1) return; // 해당 ID의 할 일을 찾지 못하면 종료

    // 완료 체크박스 클릭
    if (e.target.type === "checkbox") {
      todos[todoIndex].completed = e.target.checked;
    }
    // 삭제 버튼 클릭
    else if (e.target.dataset.action === "delete") {
      if (confirm("정말 이 할 일을 삭제하시겠습니까?")) {
        todos.splice(todoIndex, 1);
      }
    }
    // 편집 버튼 클릭
    else if (e.target.dataset.action === "edit") {
      const todo = todos[todoIndex];
      const newText = prompt("할 일 내용을 수정해주세요:", todo.text);
      if (newText !== null && newText.trim() !== "") {
        todo.text = newText.trim();
        const newDueDate = prompt(
          "마감일을 수정해주세요 (YYYY-MM-DD):",
          todo.dueDate || ""
        );
        todo.dueDate = newDueDate;

        const newPriority = prompt(
          "우선순위를 수정해주세요 (high, medium, low):",
          todo.priority
        );
        if (["high", "medium", "low"].includes(newPriority)) {
          todo.priority = newPriority;
        } else {
          alert("유효하지 않은 우선순위입니다. (high, medium, low 중 선택)");
        }
      } else if (newText !== null) {
        alert("할 일 내용은 비워둘 수 없습니다.");
      }
    }

    localStorage.setItem("todos", JSON.stringify(todos));
    renderTodos(); // 변경 사항 반영하여 목록 다시 렌더링
  });

  // 초기 로드 시 할 일 목록 렌더링
  renderTodos();
});
// 전역으로 노출 (main.js에서 호출할 수 있도록)
window.renderTodos = renderTodos;
