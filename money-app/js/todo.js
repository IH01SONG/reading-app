// js/todo.js

document.addEventListener("DOMContentLoaded", () => {
  const todoForm = document.getElementById("todo-form");
  const todoList = document.getElementById("todo-list");

  let todos = JSON.parse(localStorage.getItem("todos")) || [];

  function saveTodos() {
    localStorage.setItem("todos", JSON.stringify(todos));
  }

  function renderTodos() {
    todoList.innerHTML = "";

    // 정렬: 미완료 > 마감일 임박 > 우선순위 높음 > 생성일 최신순
    todos.sort((a, b) => {
      // 1. 완료 여부: 미완료 (false)가 완료 (true)보다 앞에
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // 2. 마감일 (due date) 기준: 임박한 순서 (날짜 없는 것이 뒤로)
      const dateA = a.dueDate ? new Date(a.dueDate) : null;
      const dateB = b.dueDate ? new Date(b.dueDate) : null;
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 오늘 날짜만 비교

      if (dateA && dateB) {
        // 둘 다 마감일이 있으면 더 가까운 날짜가 먼저
        return dateA.getTime() - dateB.getTime();
      } else if (dateA) {
        // A만 마감일이 있으면 A가 먼저
        return -1;
      } else if (dateB) {
        // B만 마감일이 있으면 B가 먼저
        return 1;
      }

      // 3. 우선순위 (high > medium > low)
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }

      // 4. 생성일 (최신순) - 동일 조건일 경우 나중에 생성된 것이 앞에
      return b.createdAt - a.createdAt;
    });

    if (todos.length === 0) {
      todoList.innerHTML =
        '<li class="list-group-item text-muted text-center">아직 등록된 할 일이 없습니다.</li>';
      return;
    }

    todos.forEach((todo) => {
      const listItem = document.createElement("li");
      listItem.classList.add(
        "list-group-item",
        "d-flex",
        "justify-content-between",
        "align-items-center",
        "mb-2",
        "shadow-sm"
      );

      // 완료된 할 일에 대한 스타일
      if (todo.completed) {
        listItem.classList.add(
          "list-group-item-secondary",
          "text-decoration-line-through"
        );
      }

      // 마감일 관련 클래스 추가
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (todo.dueDate && !todo.completed) {
        const dueDateObj = new Date(todo.dueDate);
        dueDateObj.setHours(0, 0, 0, 0);
        if (dueDateObj < today) {
          listItem.classList.add("list-group-item-danger"); // 마감일 지남
        } else if (dueDateObj.getTime() === today.getTime()) {
          listItem.classList.add("list-group-item-warning"); // 오늘이 마감일
        }
      }

      // 우선순위 뱃지 색상 클래스 매핑
      let priorityBadgeClass = "";
      switch (todo.priority) {
        case "high":
          priorityBadgeClass = "bg-danger";
          break;
        case "medium":
          priorityBadgeClass = "bg-warning";
          break;
        case "low":
          priorityBadgeClass = "bg-info";
          break;
      }

      listItem.innerHTML = `
                <div class="form-check d-flex align-items-center flex-grow-1">
                    <input class="form-check-input me-2" type="checkbox" data-id="${
                      todo.id
                    }" ${todo.completed ? "checked" : ""}>
                    <div>
                        <span class="d-block ${
                          todo.completed ? "text-muted" : ""
                        }">${todo.text}</span>
                        <div class="d-flex flex-wrap align-items-center mt-1">
                            ${
                              todo.dueDate
                                ? `<small class="text-muted me-2"><i class="bi bi-calendar"></i> ${todo.dueDate}</small>`
                                : ""
                            }
                            <span class="badge ${priorityBadgeClass} me-2">${
        todo.priority === "low"
          ? "낮음"
          : todo.priority === "medium"
          ? "중간"
          : "높음"
      }</span>
                            <small class="text-muted fst-italic">생성: ${new Date(
                              todo.createdAt
                            ).toLocaleDateString()}</small>
                        </div>
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline-secondary me-1" data-id="${
                      todo.id
                    }" data-action="edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" data-id="${
                      todo.id
                    }" data-action="delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            `;
      todoList.appendChild(listItem);
    });
  }

  todoForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const todoTextInput = document.getElementById("todo-text");
    const todoDueDateInput = document.getElementById("todo-due-date");
    const todoPriorityInput = document.getElementById("todo-priority");

    const text = todoTextInput.value.trim();
    const dueDate = todoDueDateInput.value;
    const priority = todoPriorityInput.value;

    // 유효성 검사 (Bootstrap is-invalid 활용)
    todoTextInput.classList.remove("is-invalid");
    if (text === "") {
      todoTextInput.classList.add("is-invalid");
      alert("할 일을 입력해주세요.");
      return;
    }

    const newTodo = {
      id: Date.now(), // 고유 ID (생성 시간)
      text,
      dueDate: dueDate || null, // 마감일이 없으면 null
      priority,
      completed: false,
      createdAt: Date.now(), // 생성 시간 추가
    };
    todos.push(newTodo);
    saveTodos();
    todoForm.reset();
    renderTodos();
  });

  todoList.addEventListener("click", (e) => {
    const target = e.target;
    const id = parseInt(target.dataset.id);

    if (target.type === "checkbox") {
      const todoIndex = todos.findIndex((todo) => todo.id === id);
      if (todoIndex !== -1) {
        todos[todoIndex].completed = target.checked;
        saveTodos();
        renderTodos();
      }
    } else if (
      target.dataset.action === "delete" ||
      target.closest('[data-action="delete"]')
    ) {
      const deleteId =
        id || parseInt(target.closest('[data-action="delete"]').dataset.id);
      if (confirm("정말 이 할 일을 삭제하시겠습니까?")) {
        todos = todos.filter((todo) => todo.id !== deleteId);
        saveTodos();
        renderTodos();
      }
    } else if (
      target.dataset.action === "edit" ||
      target.closest('[data-action="edit"]')
    ) {
      const editId =
        id || parseInt(target.closest('[data-action="edit"]').dataset.id);
      const todoToEdit = todos.find((todo) => todo.id === editId);
      if (todoToEdit) {
        const newText = prompt("할 일을 수정해주세요:", todoToEdit.text);
        if (newText !== null && newText.trim() !== "") {
          todoToEdit.text = newText.trim();
          saveTodos();
          renderTodos();
        } else if (newText !== null) {
          // 사용자가 취소하지 않고 빈 문자열 입력
          alert("할 일은 비워둘 수 없습니다.");
        }
      }
    }
  });

  // 초기 렌더링
  renderTodos();

  // main.js에서 호출할 수 있도록 함수를 전역으로 노출
  window.renderTodos = renderTodos;
});
