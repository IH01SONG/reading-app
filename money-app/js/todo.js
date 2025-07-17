// js/todo.js

let todos = JSON.parse(localStorage.getItem("todos")) || [];

// DOM Elements (initTodoTab 내부에서 초기화)
let todoForm;
let todoText;
let todoPriority;
let todoFilter;
let todoList;

// 초기화 함수
function initTodoTab() {
  // 요소가 이미 초기화되었는지 확인하여 불필요한 재설정 방지
  if (!todoForm) {
    todoForm = document.getElementById("todo-form");
    todoText = document.getElementById("todo-text");
    todoPriority = document.getElementById("todo-priority");
    todoFilter = document.getElementById("todo-filter");
    todoList = document.getElementById("todo-list");

    // 이벤트 리스너는 한 번만 등록
    todoForm.addEventListener("submit", handleTodoFormSubmit);
    todoFilter.addEventListener("change", renderTodoList);
  }

  // 탭이 활성화될 때마다 할 일 목록을 업데이트
  renderTodoList();
}

// =========================================================================
// 1. 할 일 데이터 처리 함수
// =========================================================================

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
  renderTodoList(); // 데이터 변경 시 할 일 목록 다시 렌더링
}

function handleTodoFormSubmit(e) {
  e.preventDefault();
  const text = todoText.value.trim();
  const priority = todoPriority.value;
  if (text === "") return;

  todos.push({ id: Date.now(), text, completed: false, priority });
  saveTodos();

  todoForm.reset();
  todoText.focus();
}

function toggleTodo(id) {
  const todo = todos.find((t) => t.id === id);
  if (todo) {
    todo.completed = !todo.completed;
    saveTodos();
  }
}

function deleteTodo(id) {
  todos = todos.filter((t) => t.id !== id);
  saveTodos();
}

function renderTodoList() {
  todoList.innerHTML = "";
  const filterValue = todoFilter.value;

  const filteredTodos = todos.filter((todo) => {
    if (filterValue === "active") return !todo.completed;
    if (filterValue === "completed") return todo.completed;
    return true;
  });

  // 우선순위에 따라 정렬: 높음 > 보통 > 낮음
  filteredTodos.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  if (filteredTodos.length === 0) {
    let message = "할 일이 없습니다.";
    if (filterValue === "active") message = "진행 중인 할 일이 없습니다.";
    if (filterValue === "completed") message = "완료된 할 일이 없습니다.";
    todoList.innerHTML = `<li class="list-group-item text-center text-muted">${message}</li>`;
    return;
  }

  filteredTodos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = `list-group-item d-flex justify-content-between align-items-center todo-item ${
      todo.completed ? "completed" : ""
    }`;

    let priorityClass = "";
    if (todo.priority === "high") priorityClass = "text-danger fw-bold";
    else if (todo.priority === "medium") priorityClass = "text-warning";
    else if (todo.priority === "low") priorityClass = "text-info";

    li.innerHTML = `
            <div class="form-check d-flex align-items-center">
                <input type="checkbox" class="form-check-input me-2" ${
                  todo.completed ? "checked" : ""
                } data-id="${todo.id}">
                <label class="form-check-label ${
                  todo.completed
                    ? "text-decoration-line-through text-muted"
                    : ""
                } ${priorityClass}">
                    ${todo.text}
                </label>
            </div>
            <button class="btn btn-sm btn-outline-danger delete-todo-btn" data-id="${
              todo.id
            }">
                <i class="bi bi-x-lg"></i>
            </button>
        `;
    todoList.appendChild(li);
  });

  todoList.querySelectorAll(".form-check-input").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      toggleTodo(parseInt(e.target.dataset.id));
    });
  });

  todoList.querySelectorAll(".delete-todo-btn").forEach((button) => {
    button.addEventListener("click", (e) => {
      deleteTodo(parseInt(e.currentTarget.dataset.id));
    });
  });
}

// initTodoTab 함수를 전역 스코프에 노출하여 main.js에서 호출할 수 있도록 함
window.initTodoTab = initTodoTab;
