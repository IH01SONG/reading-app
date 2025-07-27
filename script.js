// script.js

let books = [];
let currentGenreFilter = null;
let currentCompletionFilter = null;
let currentSearchTerm = "";
let currentSortOrder = "addedDate_desc";

// --- 테마 관련 설정 ---
const THEMES = {
  default: {
    name: "기본 테마",
    colors: {
      "--primary-color": "#0d6efd",
      "--secondary-color": "#6c757d",
      "--success-color": "#198754",
      "--info-color": "#0dcaf0",
      "--danger-color": "#dc3545",
      "--warning-color": "#ffc107",
      "--background-color": "#f8f9fa",
      "--card-background-color": "#ffffff",
      "--text-color": "#212529",
      "--muted-text-color": "#6c757d",
      "--border-color": "#dee2e6",
      "--header-bg-color": "rgba(255, 255, 255, 0.95)",
    },
  },
  "summer-breeze": {
    name: "여름 바람",
    colors: {
      "--primary-color": "#00ADB5",
      "--secondary-color": "#EEEEEE",
      "--success-color": "#6CC4A1",
      "--info-color": "#7DE5ED",
      "--danger-color": "#FC4F4F",
      "--warning-color": "#FCE700",
      "--background-color": "#222831",
      "--card-background-color": "#393E46",
      "--text-color": "#EEEEEE",
      "--muted-text-color": "#A9A9A9",
      "--border-color": "#5C677D",
      "--header-bg-color": "rgba(57, 62, 70, 0.95)",
    },
  },
  "soft-beige": {
    name: "부드러운 베이지",
    colors: {
      "--primary-color": "#A89078",
      "--secondary-color": "#D3BCA0",
      "--success-color": "#B8B08B",
      "--info-color": "#E6DDCB",
      "--danger-color": "#D2A68E",
      "--warning-color": "#F1E3D1",
      "--background-color": "#F8F4E8",
      "--card-background-color": "#FAF0E6",
      "--text-color": "#5E4D3A",
      "--muted-text-color": "#8C785F",
      "--border-color": "#D6CABA",
      "--header-bg-color": "rgba(250, 240, 230, 0.95)",
    },
  },
  "spring-blossom": {
    name: "따뜻한 봄날",
    colors: {
      "--primary-color": "#A7D9B4",
      "--secondary-color": "#F8E8A6",
      "--success-color": "#8BBF9D",
      "--info-color": "#CDE7B4",
      "--danger-color": "#FFB6C1",
      "--warning-color": "#FFDDC1",
      "--background-color": "#FDF9F3",
      "--card-background-color": "#FFFFFF",
      "--text-color": "#5C6D7D",
      "--muted-text-color": "#8797A7",
      "--border-color": "#E0E7E9",
      "--header-bg-color": "rgba(255, 255, 255, 0.95)",
    },
  },
};

// --- DOM 요소 ---
const themeSelector = document.getElementById("themeSelector");
const genreRankingList = document.getElementById("genreRankingList");
const noRankingMessage = document.getElementById("noRankingMessage");
const annualGoalInput = document.getElementById("annualGoal");
const currentAnnualGoalDisplay = document.getElementById("currentAnnualGoal");
const completedThisYearDisplay = document.getElementById("completedThisYear");
const goalProgressBar = document.getElementById("goalProgressBar");
const sortOrderSelect = document.getElementById("sortOrder");
const addOrUpdateBookBtn = document.getElementById("addOrUpdateBookBtn");
const navLinks = document.querySelectorAll(".nav-link");
const views = document.querySelectorAll(".view");

// --- 앱 초기화 및 이벤트 리스너 ---
document.addEventListener("DOMContentLoaded", () => {
  initializeThemes();
  loadBooks();
  loadReadingGoal();
  initializeAppState();

  // 내비게이션 링크 클릭 이벤트
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href").substring(1);
      switchView(targetId);
    });
  });

  // 책 추가/수정 버튼 이벤트
  addOrUpdateBookBtn.addEventListener("click", handleAddOrUpdateBook);
});

function initializeThemes() {
  for (const themeKey in THEMES) {
    const option = document.createElement("option");
    option.value = themeKey;
    option.textContent = THEMES[themeKey].name;
    themeSelector.appendChild(option);
  }
  const savedTheme = localStorage.getItem("selectedTheme") || "default";
  applyTheme(savedTheme);
  themeSelector.value = savedTheme;
}

function initializeAppState() {
  switchView("add-book-view"); // 초기 화면 설정
  updateReadingGoalDisplay();
  applyFilter();
  generateStats();
  updateFilterButtons();
  generateGenreRanking();
}

// --- 화면 전환 (SPA) 로직 ---
function switchView(targetId) {
  views.forEach((view) => {
    view.classList.remove("active");
  });
  const targetView = document.getElementById(targetId);
  if (targetView) {
    targetView.classList.add("active");
  }

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${targetId}`) {
      link.classList.add("active");
    }
  });

  // '나의 구절' 탭이 활성화될 때마다 필요한 데이터를 새로고침
  if (targetId === "memo-view") {
    initializeMemoView();
  }

  // Bootstrap의 Collapse 메뉴가 열려있으면 닫기 (모바일 환경)
  const navbarCollapse = document.getElementById("navbarNav");
  if (navbarCollapse.classList.contains("show")) {
    new bootstrap.Collapse(navbarCollapse).hide();
  }

  window.scrollTo(0, 0); // 화면 전환 시 스크롤을 최상단으로 이동
}

// --- 테마 적용 ---
function applyTheme(themeKey) {
  const theme = THEMES[themeKey];
  if (!theme) return;
  const root = document.documentElement;
  for (const prop in theme.colors) {
    root.style.setProperty(prop, theme.colors[prop]);
  }
  // Bootstrap 색상 변환을 위한 RGB 값 추가 (포커스 효과 등)
  const primaryColorHex = theme.colors["--primary-color"].substring(1);
  const r = parseInt(primaryColorHex.substring(0, 2), 16);
  const g = parseInt(primaryColorHex.substring(2, 4), 16);
  const b = parseInt(primaryColorHex.substring(4, 6), 16);
  root.style.setProperty("--primary-color-rgb", `${r}, ${g}, ${b}`);

  localStorage.setItem("selectedTheme", themeKey);
}

// --- 독서 목표 ---
function setReadingGoal() {
  const goal = parseInt(annualGoalInput.value);
  if (isNaN(goal) || goal < 0) {
    alert("유효한 목표 권수를 입력해주세요.");
    return;
  }
  localStorage.setItem("annualReadingGoal", goal);
  updateReadingGoalDisplay();
  alert(`올해 독서 목표가 ${goal}권으로 설정되었습니다!`);
}

function loadReadingGoal() {
  const savedGoal = localStorage.getItem("annualReadingGoal");
  if (savedGoal) annualGoalInput.value = savedGoal;
}

function updateReadingGoalDisplay() {
  const annualGoal = parseInt(localStorage.getItem("annualReadingGoal")) || 0;
  const currentYear = new Date().getFullYear();
  const completedBooksThisYear = books.filter(
    (book) =>
      book.status === "completed" &&
      new Date(book.addedDate).getFullYear() === currentYear
  ).length;

  currentAnnualGoalDisplay.textContent = `${annualGoal}권`;
  completedThisYearDisplay.textContent = `${completedBooksThisYear}권`;

  let percentage =
    annualGoal > 0 ? (completedBooksThisYear / annualGoal) * 100 : 0;
  if (percentage > 100) percentage = 100;

  goalProgressBar.style.width = `${percentage}%`;
  goalProgressBar.setAttribute("aria-valuenow", percentage);
  goalProgressBar.textContent = `${percentage.toFixed(1)}%`;
  goalProgressBar.classList.toggle("bg-success", percentage >= 100);
  goalProgressBar.classList.toggle("text-dark", annualGoal === 0);
}

// --- 데이터 저장 및 로드 ---
function saveBooks() {
  localStorage.setItem("myReadingList", JSON.stringify(books));
  generateGenreRanking();
  updateReadingGoalDisplay();
}

function loadBooks() {
  const storedBooks = localStorage.getItem("myReadingList");
  if (storedBooks) books = JSON.parse(storedBooks);
}

// --- 책 추가/수정/삭제 ---
function handleAddOrUpdateBook() {
  const originalTitle = addOrUpdateBookBtn.dataset.editingTitle;
  if (originalTitle) {
    updateBook(originalTitle);
  } else {
    addBook();
  }
}

function getBookDataFromForm() {
  return {
    title: document.getElementById("bookTitle").value.trim(),
    author: document.getElementById("bookAuthor").value.trim(),
    genre: document.getElementById("bookGenre").value.trim() || "미지정",
    status: document.getElementById("bookStatus").value,
    completionStatus: document.getElementById("completionStatus").value || null,
    totalChapters:
      Number(document.getElementById("totalChapters").value) || null,
    readChapters: Number(document.getElementById("readChapters").value) || null,
    rating: Number(document.getElementById("bookRating").value) || 0,
    review: document.getElementById("bookReview").value.trim(),
  };
}

function validateBookData(data) {
  if (data.title === "" || data.author === "") {
    alert("도서 제목과 저자는 필수 입력 항목입니다!");
    return false;
  }
  if (
    data.readChapters &&
    data.totalChapters &&
    data.readChapters > data.totalChapters
  ) {
    alert("읽은 회차는 총 회차보다 많을 수 없습니다.");
    return false;
  }
  return true;
}

function clearForm() {
  document.getElementById("bookTitle").value = "";
  document.getElementById("bookAuthor").value = "";
  document.getElementById("bookGenre").value = "";
  document.getElementById("bookStatus").value = "wish";
  document.getElementById("completionStatus").value = "";
  document.getElementById("totalChapters").value = "";
  document.getElementById("readChapters").value = "";
  document.getElementById("bookRating").value = "";
  document.getElementById("bookReview").value = "";

  addOrUpdateBookBtn.textContent = "책 추가";
  delete addOrUpdateBookBtn.dataset.editingTitle;
}

function addBook() {
  const newBookData = getBookDataFromForm();
  if (!validateBookData(newBookData)) return;

  if (books.some((book) => book.title === newBookData.title)) {
    alert("동일한 제목의 책이 이미 존재합니다.");
    return;
  }

  newBookData.addedDate = new Date().toISOString().split("T")[0];
  newBookData.memos = []; // 새 책에 빈 메모 배열 추가
  books.push(newBookData);
  saveBooks();
  applyFilter();
  generateStats();
  updateFilterButtons();
  clearForm();
  alert(`'${newBookData.title}'이(가) 추가되었습니다.`);
}

function updateBook(originalTitle) {
  const updatedBookData = getBookDataFromForm();
  if (!validateBookData(updatedBookData)) return;

  const bookIndex = books.findIndex((book) => book.title === originalTitle);
  if (bookIndex === -1) {
    alert("업데이트할 책을 찾을 수 없습니다.");
    clearForm();
    return;
  }

  if (
    originalTitle !== updatedBookData.title &&
    books.some((b) => b.title === updatedBookData.title)
  ) {
    alert("업데이트하려는 제목이 이미 다른 책에 사용 중입니다.");
    return;
  }

  books[bookIndex] = { ...books[bookIndex], ...updatedBookData }; // memos 배열은 유지됨
  saveBooks();
  applyFilter();
  generateStats();
  updateFilterButtons();
  clearForm();
  alert(`'${updatedBookData.title}' 정보가 업데이트되었습니다!`);
}

function removeBook(titleToRemove) {
  if (!confirm(`'${titleToRemove}'을(를) 정말 삭제하시겠습니까?`)) return;

  books = books.filter((book) => book.title !== titleToRemove);
  saveBooks();
  applyFilter();
  generateStats();
  updateFilterButtons();
}

function editBook(titleToEdit) {
  const book = books.find((b) => b.title === titleToEdit);
  if (!book) return;

  document.getElementById("bookTitle").value = book.title;
  document.getElementById("bookAuthor").value = book.author;
  document.getElementById("bookGenre").value = book.genre;
  document.getElementById("bookStatus").value = book.status;
  document.getElementById("completionStatus").value =
    book.completionStatus || "";
  document.getElementById("totalChapters").value = book.totalChapters || "";
  document.getElementById("readChapters").value = book.readChapters || "";
  document.getElementById("bookRating").value = book.rating;
  document.getElementById("bookReview").value = book.review;

  addOrUpdateBookBtn.textContent = "정보 업데이트";
  addOrUpdateBookBtn.dataset.editingTitle = titleToEdit;

  switchView("add-book-view");
  window.scrollTo(0, 0);
  alert(
    `'${titleToEdit}' 정보를 수정합니다. 완료 후 '정보 업데이트' 버튼을 클릭하세요.`
  );
}

function showReview(title) {
  const book = books.find((b) => b.title === title);
  if (book) {
    alert(
      `[${book.title}] 감상평:\n\n${book.review || "작성된 감상평이 없습니다."}`
    );
  }
}

// --- 필터 및 정렬 ---
function applyFilter() {
  currentGenreFilter =
    document.querySelector("#filterButtons .btn-outline-info.active")?.dataset
      .genre || null;
  currentCompletionFilter =
    document.querySelector("#filterButtons .btn-outline-primary.active")
      ?.dataset.completion || null;
  currentSearchTerm = document
    .getElementById("searchBook")
    .value.trim()
    .toLowerCase();
  currentSortOrder = sortOrderSelect.value;

  let filteredBooks = books;

  if (currentGenreFilter)
    filteredBooks = filteredBooks.filter(
      (book) => book.genre === currentGenreFilter
    );
  if (currentCompletionFilter)
    filteredBooks = filteredBooks.filter(
      (book) => book.completionStatus === currentCompletionFilter
    );
  if (currentSearchTerm) {
    filteredBooks = filteredBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(currentSearchTerm) ||
        book.author.toLowerCase().includes(currentSearchTerm)
    );
  }

  filteredBooks.sort((a, b) => {
    switch (currentSortOrder) {
      case "addedDate_desc":
        return new Date(b.addedDate) - new Date(a.addedDate);
      case "addedDate_asc":
        return new Date(a.addedDate) - new Date(b.addedDate);
      case "title_asc":
        return a.title.localeCompare(b.title);
      case "title_desc":
        return b.title.localeCompare(a.title);
      case "author_asc":
        return a.author.localeCompare(b.author);
      case "author_desc":
        return b.author.localeCompare(a.author);
      case "rating_desc":
        return (b.rating || 0) - (a.rating || 0);
      case "rating_asc":
        return (a.rating || 0) - (b.rating || 0);
      default:
        return 0;
    }
  });

  renderBookList(filteredBooks);
}

function renderBookList(bookArray) {
  const bookListDiv = document.getElementById("bookList");
  bookListDiv.innerHTML = "";

  if (bookArray.length === 0) {
    bookListDiv.innerHTML =
      '<p class="text-muted text-center mt-3">조건에 맞는 도서가 없습니다.</p>';
    return;
  }

  bookArray.forEach((book) => {
    const statusMap = {
      wish: "읽고 싶은 책",
      reading: "읽는 중",
      completed: "완독",
    };
    const completionMap = { completed: "완결작", serialized: "연재작" };

    const item = document.createElement("div");
    item.className =
      "list-group-item list-group-item-action d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 shadow-sm";
    item.innerHTML = `
            <div class="book-item-content me-md-3">
                <h5 class="mb-1">${
                  book.title
                } <small class="text-muted fw-normal">by ${
      book.author
    }</small></h5>
                <p class="mb-1 small">
                    <strong>장르:</strong> ${
                      book.genre
                    } | <strong>상태:</strong> ${
      statusMap[book.status]
    } | <strong>완결:</strong> ${
      completionMap[book.completionStatus] || "미지정"
    } | <strong>별점:</strong> ${
      book.rating > 0 ? "⭐".repeat(book.rating) : "평가 없음"
    }
                </p>
                <p class="text-muted small fst-italic">${
                  book.review
                    ? book.review.substring(0, 80) +
                      (book.review.length > 80 ? "..." : "")
                    : "감상평 없음"
                }</p>
            </div>
            <div class="book-item-actions d-flex flex-shrink-0 mt-2 mt-md-0">
                <button class="btn btn-outline-info btn-sm me-2" onclick="showReview('${book.title.replace(
                  /'/g,
                  "\\'"
                )}')">감상평</button>
                <button class="btn btn-outline-secondary btn-sm me-2" onclick="editBook('${book.title.replace(
                  /'/g,
                  "\\'"
                )}')">편집</button>
                <button class="btn btn-outline-danger btn-sm" onclick="removeBook('${book.title.replace(
                  /'/g,
                  "\\'"
                )}')">삭제</button>
            </div>
        `;
    bookListDiv.appendChild(item);
  });
}

function updateFilterButtons() {
  const filterButtonsDiv = document.getElementById("filterButtons");
  if (!filterButtonsDiv) return;
  filterButtonsDiv.innerHTML = "";

  const createButton = (text, value, type, isActive) => {
    const button = document.createElement("button");
    const typeClass =
      type === "genre" ? "btn-outline-info" : "btn-outline-primary";
    button.className = `btn btn-sm ${typeClass} ${isActive ? "active" : ""}`;
    button.textContent = text;
    button.onclick = () => {
      const currentActive = document.querySelector(
        `#filterButtons .${typeClass}.active`
      );
      if (currentActive) currentActive.classList.remove("active");
      if (!isActive) button.classList.add("active");
      applyFilter();
    };
    return button;
  };

  const allButton = document.createElement("button");
  allButton.className = `btn btn-sm btn-outline-secondary ${
    !currentGenreFilter && !currentCompletionFilter ? "active" : ""
  }`;
  allButton.textContent = "전체";
  allButton.onclick = () => {
    const currentActive = document.querySelector("#filterButtons .btn.active");
    if (currentActive) currentActive.classList.remove("active");
    allButton.classList.add("active");
    currentGenreFilter = null;
    currentCompletionFilter = null;
    applyFilter();
  };
  filterButtonsDiv.appendChild(allButton);

  [
    { value: "completed", text: "완결작" },
    { value: "serialized", text: "연재작" },
  ].forEach((type) => {
    filterButtonsDiv.appendChild(
      createButton(
        type.text,
        type.value,
        "completion",
        currentCompletionFilter === type.value
      )
    );
  });

  [...new Set(books.map((book) => book.genre || "미지정"))]
    .sort()
    .forEach((genre) => {
      filterButtonsDiv.appendChild(
        createButton(genre, genre, "genre", currentGenreFilter === genre)
      );
    });
}

// --- 통계 및 랭킹 (요약 정보) ---
function generateStats() {
  // 요약 정보는 이제 별도 섹션이 없으므로 이 함수는 비워두거나 다른 용도로 활용 가능.
  // 혹은 특정 위치에 작은 요약 정보를 표시하도록 수정할 수 있음.
}

function generateGenreRanking() {
  const ratedBooks = books.filter((book) => book.rating > 0);
  const genreStats = ratedBooks.reduce((acc, book) => {
    if (!acc[book.genre]) acc[book.genre] = { totalRating: 0, count: 0 };
    acc[book.genre].totalRating += book.rating;
    acc[book.genre].count++;
    return acc;
  }, {});

  const genreAverages = Object.keys(genreStats)
    .map((genre) => ({
      genre: genre,
      averageRating: (
        genreStats[genre].totalRating / genreStats[genre].count
      ).toFixed(2),
      bookCount: genreStats[genre].count,
    }))
    .sort((a, b) => b.averageRating - a.averageRating);

  genreRankingList.innerHTML = "";
  if (genreAverages.length === 0) {
    noRankingMessage.style.display = "block";
  } else {
    noRankingMessage.style.display = "none";
    genreAverages.forEach((item, index) => {
      const listItem = document.createElement("div");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center mb-1";
      listItem.innerHTML = `<div><strong class="text-primary">${index + 1}. ${
        item.genre
      }</strong><small class="text-muted ms-2">(${
        item.bookCount
      }권)</small></div><span class="badge bg-warning text-dark rounded-pill">${"⭐".repeat(
        Math.round(item.averageRating)
      )} (${item.averageRating})</span>`;
      genreRankingList.appendChild(listItem);
    });
  }
}

// --- 나의 구절 기록장 관련 함수 ---
function initializeMemoView() {
  const memoBookSelect = document.getElementById("memoBookSelect");
  if (memoBookSelect) {
    populateMemoBookSelect(memoBookSelect);
  }
  renderMemoList();
}

function populateMemoBookSelect(selectElement) {
  selectElement.innerHTML = '<option value="">기록할 책 선택...</option>';
  books.forEach((book) => {
    const option = document.createElement("option");
    option.value = book.title;
    option.textContent = book.title;
    selectElement.appendChild(option);
  });
}

function addMemo() {
  const title = document.getElementById("memoBookSelect").value;
  const page = document.getElementById("memoPage").value.trim();
  const content = document.getElementById("memoContent").value.trim();

  if (!title) {
    alert("메모를 기록할 책을 선택해주세요.");
    return;
  }
  if (!content) {
    alert("기록할 구절이나 메모를 입력해주세요.");
    return;
  }

  const book = books.find((b) => b.title === title);
  if (book) {
    const newMemo = {
      id: "m" + Date.now(),
      page: page,
      content: content,
      date: new Date().toISOString().split("T")[0],
    };
    if (!book.memos) {
      book.memos = [];
    }
    book.memos.push(newMemo);
    saveBooks();
    renderMemoList();

    document.getElementById("memoPage").value = "";
    document.getElementById("memoContent").value = "";
  }
}

function renderMemoList() {
  const memoListDiv = document.getElementById("memoList");
  if (!memoListDiv) return;
  memoListDiv.innerHTML = "";

  const allMemos = books
    .flatMap((book) =>
      (book.memos || []).map((memo) => ({ ...memo, bookTitle: book.title }))
    )
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (allMemos.length === 0) {
    memoListDiv.innerHTML =
      '<p class="text-muted text-center mt-4">아직 기록된 구절이 없습니다.</p>';
    return;
  }

  allMemos.forEach((memo) => {
    const card = document.createElement("div");
    card.className = "memo-card";
    card.innerHTML = `
            <blockquote class="mb-0">
                <p>"${memo.content.replace(/"/g, "&quot;")}"</p>
            </blockquote>
            <footer>
                - ${memo.bookTitle} ${memo.page ? `(${memo.page})` : ""}
            </footer>
            <div class="memo-card-actions">
                <button class="btn btn-outline-danger btn-sm" onclick="deleteMemo('${memo.bookTitle.replace(
                  /'/g,
                  "\\'"
                )}', '${memo.id}')">삭제</button>
            </div>
        `;
    memoListDiv.appendChild(card);
  });
}

function deleteMemo(bookTitle, memoId) {
  if (!confirm("이 구절을 정말 삭제하시겠습니까?")) return;

  const book = books.find((b) => b.title === bookTitle);
  if (book && book.memos) {
    book.memos = book.memos.filter((memo) => memo.id !== memoId);
    saveBooks();
    renderMemoList();
  }
}
