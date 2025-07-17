// script.js

let books = [];
let currentGenreFilter = null;
let currentCompletionFilter = null;
let currentSearchTerm = "";
let currentSortOrder = "addedDate_desc"; // 기본 정렬 순서

let genreChartInstance = null;
let statusChartInstance = null;
let monthlyChartInstance = null;

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
    },
  },
  "summer-breeze": {
    name: "여름 바람 (Color Hunt)",
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
    },
  },
  "vibrant-colors": {
    name: "활기찬 색상",
    colors: {
      "--primary-color": "#77BEF0",
      "--secondary-color": "#FFCB61",
      "--success-color": "#609966",
      "--info-color": "#EA5B6F",
      "--danger-color": "#FF894F",
      "--warning-color": "#F1E3D1",
      "--background-color": "#F8F9FA",
      "--card-background-color": "#FFFFFF",
      "--text-color": "#212529",
      "--muted-text-color": "#6c757d",
      "--border-color": "#dee2e6",
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
    },
  },
};

// --- DOM 요소 ---
const mainApp = document.getElementById("mainApp");
const themeSelector = document.getElementById("themeSelector");
const genreRankingList = document.getElementById("genreRankingList");
const noRankingMessage = document.getElementById("noRankingMessage");

// 독서 목표 관련 DOM 요소
const annualGoalInput = document.getElementById("annualGoal");
const currentAnnualGoalDisplay = document.getElementById("currentAnnualGoal");
const completedThisYearDisplay = document.getElementById("completedThisYear");
const goalProgressBar = document.getElementById("goalProgressBar");

// 정렬 선택 DOM 요소
const sortOrderSelect = document.getElementById("sortOrder");

// 차트 관련 DOM 요소
const genreChartCanvas = document.getElementById("genreChart");
const statusChartCanvas = document.getElementById("statusChart");
const monthlyChartCanvas = document.getElementById("monthlyChart");

// 앱 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
  // 테마 선택 옵션 채우기
  for (const themeKey in THEMES) {
    const option = document.createElement("option");
    option.value = themeKey;
    option.textContent = THEMES[themeKey].name;
    themeSelector.appendChild(option);
  }

  // 로컬 스토리지에서 저장된 테마 불러오기
  const savedTheme = localStorage.getItem("selectedTheme");
  if (savedTheme && THEMES[savedTheme]) {
    applyTheme(savedTheme);
    themeSelector.value = savedTheme;
  } else {
    applyTheme("default");
    themeSelector.value = "default";
  }

  mainApp.style.display = "block";

  loadBooks();
  loadReadingGoal(); // 독서 목표 로드
  updateReadingGoalDisplay(); // 독서 목표 디스플레이 업데이트
  applyFilter(); // 필터 및 정렬 적용
  generateStats();
  updateFilterButtons();
  generateGenreRanking();
  renderCharts(); // 차트 렌더링

  // Bootstrap 탭 클릭 시 차트 리렌더링 (숨겨진 상태에서 그려지면 크기 오류 발생 가능)
  document
    .getElementById("chartTabs")
    .addEventListener("shown.bs.tab", function (event) {
      renderCharts();
    });
});

// 테마 적용 함수
function applyTheme(themeKey) {
  const theme = THEMES[themeKey];
  if (!theme) {
    console.warn(`알 수 없는 테마 키: ${themeKey}`);
    return;
  }

  const root = document.documentElement;

  for (const prop in theme.colors) {
    root.style.setProperty(prop, theme.colors[prop]);
  }
  localStorage.setItem("selectedTheme", themeKey);
}

// --- 독서 목표 설정 및 추적 기능 ---
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
  if (savedGoal) {
    annualGoalInput.value = savedGoal;
  }
}

function updateReadingGoalDisplay() {
  const annualGoal = parseInt(localStorage.getItem("annualReadingGoal")) || 0;
  const currentYear = new Date().getFullYear();

  const completedBooksThisYear = books.filter((book) => {
    // 책이 완독 상태이고, 추가된 연도가 현재 연도와 일치하는 경우
    const bookYear = new Date(book.addedDate).getFullYear();
    return book.status === "completed" && bookYear === currentYear;
  }).length;

  currentAnnualGoalDisplay.textContent = `${annualGoal}권`;
  completedThisYearDisplay.textContent = `${completedBooksThisYear}권`;

  let percentage = 0;
  if (annualGoal > 0) {
    percentage = (completedBooksThisYear / annualGoal) * 100;
    if (percentage > 100) percentage = 100; // 100% 초과 방지
  }

  goalProgressBar.style.width = `${percentage}%`;
  goalProgressBar.setAttribute("aria-valuenow", percentage);
  goalProgressBar.textContent = `${percentage.toFixed(1)}%`;

  if (percentage >= 100) {
    goalProgressBar.classList.remove("bg-primary");
    goalProgressBar.classList.add("bg-success");
  } else {
    goalProgressBar.classList.remove("bg-success");
    goalProgressBar.classList.add("bg-primary");
  }
}

// --- 데이터 저장 및 로드 ---
function saveBooks() {
  localStorage.setItem("myReadingList", JSON.stringify(books));
  generateGenreRanking();
  updateReadingGoalDisplay(); // 책 추가/삭제/수정 시 목표 달성률 업데이트
  renderCharts(); // 책 데이터 변경 시 차트 업데이트
}

function loadBooks() {
  const storedBooks = localStorage.getItem("myReadingList");
  if (storedBooks) {
    books = JSON.parse(storedBooks);
  }
}

function addBook() {
  const titleInput = document.getElementById("bookTitle");
  const authorInput = document.getElementById("bookAuthor");
  const genreInput = document.getElementById("bookGenre");
  const statusSelect = document.getElementById("bookStatus");
  const completionStatusSelect = document.getElementById("completionStatus");
  const totalChaptersInput = document.getElementById("totalChapters");
  const readChaptersInput = document.getElementById("readChapters");
  const ratingSelect = document.getElementById("bookRating");
  const reviewTextarea = document.getElementById("bookReview");

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const genre = genreInput.value.trim();
  const status = statusSelect.value;
  const completionStatus = completionStatusSelect.value;
  const totalChapters = Number(totalChaptersInput.value);
  const readChapters = Number(readChaptersInput.value);
  const rating = Number(ratingSelect.value) || 0;
  const review = reviewTextarea.value.trim();
  const addedDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 형식으로 저장

  if (title === "" || author === "") {
    alert("도서 제목과 저자는 필수 입력 항목입니다!");
    return;
  }

  if (books.some((book) => book.title === title)) {
    alert("동일한 제목의 책이 이미 존재합니다. 제목은 고유해야 합니다.");
    return;
  }

  if (
    (!isNaN(totalChapters) && totalChapters < 0) ||
    (!isNaN(readChapters) && readChapters < 0)
  ) {
    alert("회차는 0보다 작을 수 없습니다.");
    return;
  }
  if (
    !isNaN(totalChapters) &&
    !isNaN(readChapters) &&
    readChapters > totalChapters
  ) {
    alert("읽은 회차는 총 회차보다 많을 수 없습니다.");
    return;
  }

  const newBook = {
    title,
    author,
    genre: genre === "" ? "미지정" : genre,
    status,
    completionStatus: completionStatus === "" ? null : completionStatus,
    totalChapters: isNaN(totalChapters) ? null : totalChapters,
    readChapters: isNaN(readChapters) ? null : readChapters,
    rating,
    review,
    addedDate,
  };
  books.push(newBook);

  saveBooks();
  applyFilter();
  generateStats();
  updateFilterButtons();

  // 입력 필드 초기화
  titleInput.value = "";
  authorInput.value = "";
  genreInput.value = "";
  statusSelect.value = "wish";
  completionStatusSelect.value = "";
  totalChaptersInput.value = "";
  readChaptersInput.value = "";
  ratingSelect.value = "";
  reviewTextarea.value = "";
}

function removeBook(button) {
  const li = button.closest(".list-group-item");
  const title = li.dataset.title;

  const indexToRemove = books.findIndex((book) => book.title === title);
  if (indexToRemove !== -1) {
    books.splice(indexToRemove, 1);
  }

  saveBooks();
  li.remove();
  applyFilter();
  generateStats();
  updateFilterButtons();
}

function editBook(titleToEdit) {
  const book = books.find((b) => b.title === titleToEdit);
  if (!book) {
    alert("편집할 책을 찾을 수 없습니다.");
    return;
  }

  document.getElementById("bookTitle").value = book.title;
  document.getElementById("bookAuthor").value = book.author;
  document.getElementById("bookGenre").value = book.genre;
  document.getElementById("bookStatus").value = book.status;
  document.getElementById("completionStatus").value =
    book.completionStatus || "";
  document.getElementById("totalChapters").value =
    book.totalChapters !== null ? book.totalChapters : "";
  document.getElementById("readChapters").value =
    book.readChapters !== null ? book.readChapters : "";
  document.getElementById("bookRating").value = book.rating;
  document.getElementById("bookReview").value = book.review;

  const addButton = document.querySelector(".btn.btn-primary");
  addButton.textContent = "정보 업데이트";
  addButton.onclick = null; // 기존 핸들러 제거
  addButton.onclick = () => {
    updateBook(titleToEdit);
    addButton.textContent = "책 추가"; // 버튼 텍스트 원상 복구
    addButton.onclick = addBook; // 핸들러 원상 복구
  };
  alert(
    `'${titleToEdit}' 정보를 수정할 수 있도록 입력 필드에 로드했습니다. '정보 업데이트' 버튼을 클릭하세요.`
  );
}

function updateBook(originalTitle) {
  const titleInput = document.getElementById("bookTitle");
  const authorInput = document.getElementById("bookAuthor");
  const genreInput = document.getElementById("bookGenre");
  const statusSelect = document.getElementById("bookStatus");
  const completionStatusSelect = document.getElementById("completionStatus");
  const totalChaptersInput = document.getElementById("totalChapters");
  const readChaptersInput = document.getElementById("readChapters");
  const ratingSelect = document.getElementById("bookRating");
  const reviewTextarea = document.getElementById("bookReview");

  const updatedTitle = titleInput.value.trim();
  const updatedAuthor = authorInput.value.trim();
  const updatedGenre = genreInput.value.trim();
  const updatedStatus = statusSelect.value;
  const updatedCompletionStatus = completionStatusSelect.value;
  const updatedTotalChapters = Number(totalChaptersInput.value);
  const updatedReadChapters = Number(readChaptersInput.value);
  const updatedRating = Number(ratingSelect.value) || 0;
  const updatedReview = reviewTextarea.value.trim();

  if (updatedTitle === "" || updatedAuthor === "") {
    alert("도서 제목과 저자는 필수 입력 항목입니다!");
    return;
  }

  if (
    (!isNaN(updatedTotalChapters) && updatedTotalChapters < 0) ||
    (!isNaN(updatedReadChapters) && updatedReadChapters < 0)
  ) {
    alert("회차는 0보다 작을 수 없습니다.");
    return;
  }
  if (
    !isNaN(updatedTotalChapters) &&
    !isNaN(updatedReadChapters) &&
    updatedReadChapters > updatedTotalChapters
  ) {
    alert("읽은 회차는 총 회차보다 많을 수 없습니다.");
    return;
  }

  const bookIndex = books.findIndex((book) => book.title === originalTitle);
  if (bookIndex > -1) {
    if (
      originalTitle !== updatedTitle &&
      books.some((book) => book.title === updatedTitle)
    ) {
      alert(
        "업데이트하려는 제목이 이미 다른 책에 사용 중입니다. 고유한 제목을 입력해주세요."
      );
      return;
    }

    books[bookIndex] = {
      ...books[bookIndex],
      title: updatedTitle,
      author: updatedAuthor,
      genre: updatedGenre === "" ? "미지정" : updatedGenre,
      status: updatedStatus,
      completionStatus:
        updatedCompletionStatus === "" ? null : updatedCompletionStatus,
      totalChapters: isNaN(updatedTotalChapters) ? null : updatedTotalChapters,
      readChapters: isNaN(updatedReadChapters) ? null : updatedReadChapters,
      rating: updatedRating,
      review: updatedReview,
    };
    saveBooks();
    applyFilter();
    generateStats();
    updateFilterButtons();
    alert(`'${updatedTitle}' 정보가 업데이트되었습니다!`);

    // 입력 필드 초기화
    titleInput.value = "";
    authorInput.value = "";
    genreInput.value = "";
    statusSelect.value = "wish";
    completionStatusSelect.value = "";
    totalChaptersInput.value = "";
    readChaptersInput.value = "";
    ratingSelect.value = "";
    reviewTextarea.value = "";
  } else {
    alert("업데이트할 책을 찾을 수 없습니다.");
  }
}

function showReview(title) {
  const book = books.find((b) => b.title === title);
  if (book) {
    alert(
      `[${book.title}] 감상평:\n\n${book.review || "작성된 감상평이 없습니다."}`
    );
  }
}

// --- 필터 및 정렬 기능 ---
function applyFilter(
  genre = currentGenreFilter,
  completion = currentCompletionFilter
) {
  currentGenreFilter = genre;
  currentCompletionFilter = completion;
  currentSearchTerm = document
    .getElementById("searchBook")
    .value.trim()
    .toLowerCase();
  currentSortOrder = sortOrderSelect.value; // 정렬 순서 가져오기

  const bookListDiv = document.getElementById("bookList");
  bookListDiv.innerHTML = "";

  let filteredBooks = books;

  // 필터링
  if (currentGenreFilter) {
    filteredBooks = filteredBooks.filter(
      (book) => book.genre === currentGenreFilter
    );
  }
  if (currentCompletionFilter) {
    filteredBooks = filteredBooks.filter(
      (book) => book.completionStatus === currentCompletionFilter
    );
  }
  if (currentSearchTerm) {
    filteredBooks = filteredBooks.filter(
      (book) =>
        book.title.toLowerCase().includes(currentSearchTerm) ||
        book.author.toLowerCase().includes(currentSearchTerm)
    );
  }

  // 정렬
  filteredBooks.sort((a, b) => {
    switch (currentSortOrder) {
      case "addedDate_desc": // 추가일 최신순
        return (
          new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime()
        );
      case "addedDate_asc": // 추가일 오래된순
        return (
          new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime()
        );
      case "title_asc": // 제목 오름차순
        return a.title.localeCompare(b.title);
      case "title_desc": // 제목 내림차순
        return b.title.localeCompare(a.title);
      case "author_asc": // 저자 오름차순
        return a.author.localeCompare(b.author);
      case "author_desc": // 저자 내림차순
        return b.author.localeCompare(a.author);
      case "rating_desc": // 별점 높은순 (별점 없는 경우 0점으로 간주)
        return (b.rating || 0) - (a.rating || 0);
      case "rating_asc": // 별점 낮은순
        return (a.rating || 0) - (b.rating || 0);
      default:
        return 0;
    }
  });

  if (filteredBooks.length === 0) {
    bookListDiv.innerHTML =
      '<p class="text-muted text-center">조건에 맞는 도서가 없습니다.</p>';
    return;
  }

  filteredBooks.forEach((book) => {
    const item = document.createElement("div");
    item.className =
      "list-group-item list-group-item-action d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-2 shadow-sm";
    item.dataset.title = book.title;

    const statusText = {
      wish: "읽고 싶은 책",
      reading: "읽는 중",
      completed: "완독",
    }[book.status];

    const completionText =
      {
        completed: "완결작",
        serialized: "연재작",
      }[book.completionStatus] || "미지정";

    const ratingStars =
      book.rating > 0 ? "⭐".repeat(book.rating) : "평가 없음";
    const reviewPreview =
      book.review.length > 80
        ? book.review.substring(0, 80) + "..."
        : book.review;

    let chapterInfo = "";
    if (book.totalChapters !== null && book.readChapters !== null) {
      chapterInfo = ` | 회차: ${book.readChapters}/${book.totalChapters}`;
    } else if (book.readChapters !== null) {
      chapterInfo = ` | 읽은 회차: ${book.readChapters}`;
    } else if (book.totalChapters !== null) {
      chapterInfo = ` | 총 회차: ${book.totalChapters}`;
    }

    item.innerHTML = `
            <div class="book-item-content">
                <h4 class="mb-1 text-primary">${
                  book.title
                } <small class="text-muted fs-6">by ${book.author}</small></h4>
                <p class="mb-1">
                    <strong>장르:</strong> ${
                      book.genre
                    } | <strong>상태:</strong> ${statusText} | <strong>완결:</strong> ${completionText} | <strong>별점:</strong> ${ratingStars} ${chapterInfo}
                </p>
                <p class="text-muted small">${
                  reviewPreview || "작성된 감상평이 없습니다."
                }</p>
            </div>
            <div class="book-item-actions d-flex flex-column flex-md-row mt-2 mt-md-0">
                <button class="btn btn-outline-info btn-sm me-md-2 mb-2 mb-md-0" onclick="showReview('${book.title.replace(
                  /'/g,
                  "\\'"
                )}')">감상평 보기</button>
                <button class="btn btn-outline-secondary btn-sm me-md-2 mb-2 mb-md-0" onclick="editBook('${book.title.replace(
                  /'/g,
                  "\\'"
                )}')">편집</button>
                <button class="btn btn-outline-danger btn-sm" onclick="removeBook(this)">삭제</button>
            </div>
        `;
    bookListDiv.appendChild(item);
  });
  updateFilterButtons(); // 필터 버튼 상태 업데이트
}

// 필터 버튼 업데이트
function updateFilterButtons() {
  const filterButtonsDiv = document.getElementById("filterButtons");
  filterButtonsDiv.innerHTML = "";

  const allButton = document.createElement("button");
  allButton.className = "btn btn-sm btn-outline-secondary";
  allButton.textContent = "전체";
  allButton.onclick = () => applyFilter(null, null);
  if (currentGenreFilter === null && currentCompletionFilter === null) {
    allButton.classList.add("active");
  }
  filterButtonsDiv.appendChild(allButton);

  const completionTypes = [
    { value: "completed", text: "완결작" },
    { value: "serialized", text: "연재작" },
  ];
  completionTypes.forEach((type) => {
    const button = document.createElement("button");
    button.className = `btn btn-sm btn-outline-primary ${
      currentCompletionFilter === type.value ? "active" : ""
    }`;
    button.textContent = type.text;
    button.onclick = () => applyFilter(null, type.value);
    filterButtonsDiv.appendChild(button);
  });

  const uniqueGenres = [
    ...new Set(books.map((book) => book.genre || "미지정")),
  ].sort();

  uniqueGenres.forEach((genre) => {
    const button = document.createElement("button");
    button.className = `btn btn-sm btn-outline-info ${
      currentGenreFilter === genre ? "active" : ""
    }`;
    button.textContent = genre;
    button.onclick = () => applyFilter(genre, null);
    filterButtonsDiv.appendChild(button);
  });
}

// --- 독서 통계 생성 ---
function generateStats() {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  const totalBooks = books.length;
  const completedBooks = books.filter((book) => book.status === "completed");

  const genreCounts = books.reduce((acc, book) => {
    const genre = book.genre || "미지정";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const allGenres = [
    ...new Set(books.map((book) => book.genre || "미지정")),
  ].sort();

  const completedWorksCount = books.filter(
    (book) => book.completionStatus === "completed"
  ).length;
  const serializedWorksCount = books.filter(
    (book) => book.completionStatus === "serialized"
  ).length;

  const highestRatedBook =
    books.length > 0
      ? books.reduce((prev, current) => {
          return (prev.rating || 0) > (current.rating || 0) ? prev : current;
        })
      : null;

  const booksWithChapterInfo = books.filter(
    (book) => book.totalChapters !== null && book.readChapters !== null
  );
  const totalProgress = booksWithChapterInfo.reduce((acc, book) => {
    const progress =
      book.totalChapters > 0
        ? (book.readChapters / book.totalChapters) * 100
        : 0;
    return acc + progress;
  }, 0);
  const averageProgress =
    booksWithChapterInfo.length > 0
      ? (totalProgress / booksWithChapterInfo.length).toFixed(2)
      : "0.00";

  let html = '<h3 class="text-primary mb-3">독서 통계</h3>';
  html += '<ul class="list-group list-group-flush">';
  html += `<li class="list-group-item d-flex justify-content-between align-items-center">총 등록된 책<span class="badge bg-primary rounded-pill">${totalBooks}권</span></li>`;
  html += `<li class="list-group-item d-flex justify-content-between align-items-center">완독한 책<span class="badge bg-success rounded-pill">${completedBooks.length}권</span></li>`;

  if (booksWithChapterInfo.length > 0) {
    html += `<li class="list-group-item d-flex justify-content-between align-items-center">평균 독서 진도율<span class="badge bg-info rounded-pill">${averageProgress}%</span></li>`;
  }

  html += `<li class="list-group-item"><strong>완결/연재작:</strong><ul class="list-unstyled mt-2">`;
  html += `<li>완결작: ${completedWorksCount}권</li>`;
  html += `<li>연재작: ${serializedWorksCount}권</li>`;
  html += `</ul></li>`;

  html += `<li class="list-group-item"><strong>장르별 분포:</strong><ul class="list-unstyled mt-2">`;
  if (Object.keys(genreCounts).length === 0) {
    html += "<li>등록된 장르가 없습니다.</li>";
  } else {
    for (const genre of allGenres) {
      html += `<li>${genre}: ${genreCounts[genre]}권</li>`;
    }
  }
  html += `</ul></li>`;

  if (highestRatedBook && highestRatedBook.rating > 0) {
    html += `<li class="list-group-item">가장 높은 별점 책: <strong>${
      highestRatedBook.title
    }</strong> (${"⭐".repeat(highestRatedBook.rating)})</li>`;
  } else {
    html += `<li class="list-group-item text-muted">아직 평가된 책이 없거나 별점이 등록되지 않았습니다.</li>`;
  }

  html += "</ul>";

  resultsDiv.innerHTML = html;
}

// --- 장르별 별점 순위 생성 함수 ---
function generateGenreRanking() {
  const ratedBooks = books.filter((book) => book.rating > 0);

  const genreStats = ratedBooks.reduce((acc, book) => {
    const genre = book.genre || "미지정";
    if (!acc[genre]) {
      acc[genre] = { totalRating: 0, count: 0 };
    }
    acc[genre].totalRating += book.rating;
    acc[genre].count++;
    return acc;
  }, {});

  const genreAverages = Object.keys(genreStats).map((genre) => {
    const stats = genreStats[genre];
    return {
      genre: genre,
      averageRating: (stats.totalRating / stats.count).toFixed(2),
      bookCount: stats.count,
    };
  });

  genreAverages.sort((a, b) => b.averageRating - a.averageRating);

  genreRankingList.innerHTML = "";

  if (genreAverages.length === 0) {
    noRankingMessage.style.display = "block";
  } else {
    noRankingMessage.style.display = "none";
    genreAverages.forEach((item, index) => {
      const listItem = document.createElement("div");
      listItem.className =
        "list-group-item d-flex justify-content-between align-items-center mb-1";
      listItem.innerHTML = `
                <div>
                    <strong class="text-primary">${index + 1}. ${
        item.genre
      }</strong>
                    <small class="text-muted ms-2">(${item.bookCount}권)</small>
                </div>
                <span class="badge bg-secondary rounded-pill">${"⭐".repeat(
                  Math.round(item.averageRating)
                )} (${item.averageRating})</span>
            `;
      genreRankingList.appendChild(listItem);
    });
  }
}

// --- 데이터 시각화 (Chart.js) 기능 ---
function renderCharts() {
  // 기존 차트 인스턴스 파괴 (차트가 여러 번 그려지는 것 방지 및 업데이트 시 필요)
  if (genreChartInstance) genreChartInstance.destroy();
  if (statusChartInstance) statusChartInstance.destroy();
  if (monthlyChartInstance) monthlyChartInstance.destroy();

  // 1. 장르별 독서 비율 (도넛 차트)
  const genreCounts = books.reduce((acc, book) => {
    const genre = book.genre || "미지정";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  const genreLabels = Object.keys(genreCounts);
  const genreData = Object.values(genreCounts);
  const genreBackgroundColors = generateRandomColors(genreLabels.length);

  genreChartInstance = new Chart(genreChartCanvas, {
    type: "doughnut",
    data: {
      labels: genreLabels,
      datasets: [
        {
          data: genreData,
          backgroundColor: genreBackgroundColors,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "장르별 독서 비율",
        },
      },
    },
  });

  // 2. 독서 상태별 비율 (파이 차트)
  const statusCounts = books.reduce((acc, book) => {
    acc[book.status] = (acc[book.status] || 0) + 1;
    return acc;
  }, {});

  const statusMap = {
    wish: "읽고 싶은 책",
    reading: "읽는 중",
    completed: "완독",
  };
  const statusLabels = Object.keys(statusCounts).map((key) => statusMap[key]);
  const statusData = Object.values(statusCounts);
  // 부트스트랩 기본 색상과 유사한 색상 팔레트
  const statusBackgroundColors = ["#0dcaf0", "#ffc107", "#198754"]; // info, warning, success

  statusChartInstance = new Chart(statusChartCanvas, {
    type: "pie",
    data: {
      labels: statusLabels,
      datasets: [
        {
          data: statusData,
          backgroundColor: statusBackgroundColors,
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "독서 상태별 비율",
        },
      },
    },
  });

  // 3. 월별 완독 도서 수 (막대 차트)
  const currentYear = new Date().getFullYear();
  const monthlyCompleted = Array(12).fill(0); // 1월부터 12월까지 0으로 초기화

  books
    .filter(
      (book) =>
        book.status === "completed" &&
        new Date(book.addedDate).getFullYear() === currentYear
    )
    .forEach((book) => {
      const month = new Date(book.addedDate).getMonth(); // 0부터 11까지 (JavaScript 월은 0부터 시작)
      monthlyCompleted[month]++;
    });

  const monthNames = [
    "1월",
    "2월",
    "3월",
    "4월",
    "5월",
    "6월",
    "7월",
    "8월",
    "9월",
    "10월",
    "11월",
    "12월",
  ];

  monthlyChartInstance = new Chart(monthlyChartCanvas, {
    type: "bar",
    data: {
      labels: monthNames,
      datasets: [
        {
          label: `완독 도서 수 (${currentYear}년)`,
          data: monthlyCompleted,
          backgroundColor: "rgba(75, 192, 192, 0.6)", // 청록 계열 색상
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: false, // 범례 숨김
        },
        title: {
          display: true,
          text: `${currentYear}년 월별 완독 도서 수`,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              if (value % 1 === 0) return value;
            }, // 정수만 표시
          },
        },
      },
    },
  });
}

// 랜덤 색상 생성 헬퍼 함수 (차트 데이터가 많을 때 유용)
function generateRandomColors(numColors) {
  const colors = [];
  for (let i = 0; i < numColors; i++) {
    const r = Math.floor(Math.random() * 200) + 50; // 50~249
    const g = Math.floor(Math.random() * 200) + 50;
    const b = Math.floor(Math.random() * 200) + 50;
    colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`); // 투명도 0.7
  }
  return colors;
}
