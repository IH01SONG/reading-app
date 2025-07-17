// script.js

let books = []; // 독서 목록 데이터를 저장할 배열
let currentGenreFilter = null; // 현재 선택된 장르 필터
let currentCompletionFilter = null; // 현재 선택된 완결 여부 필터
let currentSearchTerm = ""; // 현재 검색어

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
      "--primary-color": "#A89078", // 은은한 베이지 톤
      "--secondary-color": "#D3BCA0", // 좀 더 밝은 베이지
      "--success-color": "#B8B08B", // 차분한 크림색
      "--info-color": "#E6DDCB", // 밝은 크림색 배경
      "--danger-color": "#D2A68E", // 살짝 톤 다운된 베이지
      "--warning-color": "#F1E3D1", // 아주 밝은 베이지
      "--background-color": "#F8F4E8", // 부드러운 베이지 배경
      "--card-background-color": "#FAF0E6", // 아이보리색 카드 배경
      "--text-color": "#5E4D3A", // 차분한 갈색 텍스트
      "--muted-text-color": "#8C785F", // 좀 더 밝은 갈색 텍스트
      "--border-color": "#D6CABA", // 부드러운 베이지 테두리
    },
  },
  "cozy-autumn": {
    name: "아늑한 가을 (Color Hunt)",
    colors: {
      "--primary-color": "#DF7857",
      "--secondary-color": "#6C757D",
      "--success-color": "#8A307F",
      "--info-color": "#FFB084",
      "--danger-color": "#D62246",
      "--warning-color": "#F2A154",
      "--background-color": "#FEFBF3",
      "--card-background-color": "#F6F0E0",
      "--text-color": "#4A4A4A",
      "--muted-text-color": "#888888",
      "--border-color": "#D9D3C8",
    },
  },
};

// --- 테마 관련 DOM 요소 ---
const mainApp = document.getElementById("mainApp");
const themeSelector = document.getElementById("themeSelector"); // 테마 선택 드롭다운

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
    themeSelector.value = savedTheme; // 드롭다운 값도 업데이트
  } else {
    applyTheme("default"); // 기본 테마 적용
    themeSelector.value = "default";
  }

  // 초기에는 메인 앱 화면을 보이도록 설정
  mainApp.style.display = "block";

  loadBooks();
  applyFilter();
  generateStats();
  updateFilterButtons();
});

// 테마 적용 함수
function applyTheme(themeKey) {
  const theme = THEMES[themeKey];
  if (!theme) {
    console.warn(`알 수 없는 테마 키: ${themeKey}`);
    return;
  }

  const root = document.documentElement; // :root 요소에 접근

  for (const prop in theme.colors) {
    root.style.setProperty(prop, theme.colors[prop]);
  }

  // 선택된 테마를 로컬 스토리지에 저장
  localStorage.setItem("selectedTheme", themeKey);
}

// --- 기존 독서 목록 앱 로직 (변화 없음) ---

function saveBooks() {
  localStorage.setItem("myReadingList", JSON.stringify(books));
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
  const addedDate = new Date().toISOString().split("T")[0];

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

  const bookListDiv = document.getElementById("bookList");
  bookListDiv.innerHTML = "";

  let filteredBooks = books;

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
  updateFilterButtons();
}

function showReview(title) {
  const book = books.find((b) => b.title === title);
  if (book) {
    alert(
      `[\${book.title}] 감상평:\n\n\${book.review || '작성된 감상평이 없습니다.'}`
    );
  }
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
  addButton.onclick = null;
  addButton.onclick = () => {
    updateBook(titleToEdit);
    addButton.textContent = "책 추가";
    addButton.onclick = addBook;
  };
  alert(
    `'\${titleToEdit}' 정보를 수정할 수 있도록 입력 필드에 로드했습니다. '정보 업데이트' 버튼을 클릭하세요.`
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
    alert(`'\${updatedTitle}' 정보가 업데이트되었습니다!`);

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

  // 가장 높은 별점 책 찾기 (빈 배열 처리 추가)
  const highestRatedBook =
    books.length > 0
      ? books.reduce((prev, current) => {
          return (prev.rating || 0) > (current.rating || 0) ? prev : current;
        })
      : null; // 책이 없으면 null

  const booksWithChapterInfo = books.filter(
    (book) => book.totalChapters !== null && book.readChapters !== null
  );
  const totalProgress = booksWithChapterInfo.reduce((acc, book) => {
    // 총 회차가 0일 경우 NaN 방지
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

  // 평균 독서 진도율은 관련 책이 있을 때만 표시
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
    // 올바른 반복문으로 각 장르와 개수 출력
    for (const genre of allGenres) {
      html += `<li>${genre}: ${genreCounts[genre]}권</li>`;
    }
  }
  html += `</ul></li>`;

  // 가장 높은 별점 책은 책이 존재하고 별점 정보가 있을 때만 표시
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
    button.className = "btn btn-sm btn-outline-primary";
    if (currentCompletionFilter === type.value) {
      button.classList.add("active");
    }
    button.textContent = type.text;
    button.onclick = () => applyFilter(null, type.value);
    filterButtonsDiv.appendChild(button);
  });

  const uniqueGenres = [
    ...new Set(books.map((book) => book.genre || "미지정")),
  ].sort();

  uniqueGenres.forEach((genre) => {
    const button = document.createElement("button");
    button.className = "btn btn-sm btn-outline-info";
    if (currentGenreFilter === genre) {
      button.classList.add("active");
    }
    button.textContent = genre;
    button.onclick = () => applyFilter(genre, null);
    filterButtonsDiv.appendChild(button);
  });
}
