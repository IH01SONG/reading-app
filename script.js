// script.js

let books = []; // 독서 목록 데이터를 저장할 배열
let currentGenreFilter = null; // 현재 선택된 장르 필터
let currentCompletionFilter = null; // 현재 선택된 완결 여부 필터
let currentSearchTerm = ""; // 현재 검색어

// 앱 로드 시 localStorage에서 데이터 불러오기
document.addEventListener("DOMContentLoaded", () => {
  loadBooks();
  applyFilter(); // 초기 화면에 독서 목록 표시 (필터 적용)
  generateStats(); // 초기 통계 표시
  updateFilterButtons(); // 필터 버튼 초기화
});

// localStorage에 데이터 저장
function saveBooks() {
  localStorage.setItem("myReadingList", JSON.stringify(books));
}

// localStorage에서 데이터 불러오기
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
  const completionStatusSelect = document.getElementById("completionStatus"); // 완결 여부 추가
  const totalChaptersInput = document.getElementById("totalChapters");
  const readChaptersInput = document.getElementById("readChapters");
  const ratingSelect = document.getElementById("bookRating");
  const reviewTextarea = document.getElementById("bookReview");

  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const genre = genreInput.value.trim();
  const status = statusSelect.value;
  const completionStatus = completionStatusSelect.value; // 완결 여부 값 가져오기
  const totalChapters = Number(totalChaptersInput.value);
  const readChapters = Number(readChaptersInput.value);
  const rating = Number(ratingSelect.value) || 0;
  const review = reviewTextarea.value.trim();
  const addedDate = new Date().toISOString().split("T")[0];

  if (title === "" || author === "") {
    alert("도서 제목과 저자는 필수 입력 항목입니다!");
    return;
  }

  // 이미 같은 제목의 책이 있는지 확인
  if (books.some((book) => book.title === title)) {
    alert("동일한 제목의 책이 이미 존재합니다. 제목은 고유해야 합니다.");
    return;
  }

  // 회차 유효성 검사 (숫자이고, 읽은 회차가 총 회차보다 클 수 없음)
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
    completionStatus: completionStatus === "" ? null : completionStatus, // 완결 여부 저장
    totalChapters: isNaN(totalChapters) ? null : totalChapters,
    readChapters: isNaN(readChapters) ? null : readChapters,
    rating,
    review,
    addedDate,
  };
  books.push(newBook);

  saveBooks(); // 데이터 저장
  applyFilter(); // 목록 업데이트 (필터 및 검색 적용)
  generateStats(); // 통계 업데이트
  updateFilterButtons(); // 필터 버튼 업데이트

  // 입력 필드 초기화
  titleInput.value = "";
  authorInput.value = "";
  genreInput.value = "";
  statusSelect.value = "wish";
  completionStatusSelect.value = ""; // 완결 여부 초기화
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

  saveBooks(); // 데이터 저장
  li.remove(); // DOM에서 제거
  applyFilter(); // 목록 업데이트
  generateStats(); // 통계 업데이트
  updateFilterButtons(); // 필터 버튼 업데이트
}

// 모든 필터 및 검색을 적용하여 도서 목록을 표시하는 함수
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

  // 1. 장르 필터링
  if (currentGenreFilter) {
    filteredBooks = filteredBooks.filter(
      (book) => book.genre === currentGenreFilter
    );
  }

  // 2. 완결 여부 필터링
  if (currentCompletionFilter) {
    filteredBooks = filteredBooks.filter(
      (book) => book.completionStatus === currentCompletionFilter
    );
  }

  // 3. 검색어 필터링
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
      }[book.completionStatus] || "미지정"; // 완결 여부 텍스트

    const ratingStars =
      book.rating > 0 ? "⭐".repeat(book.rating) : "평가 없음";
    const reviewPreview =
      book.review.length > 80
        ? book.review.substring(0, 80) + "..."
        : book.review;

    // 회차 정보 표시
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
  updateFilterButtons(); // 필터 적용 후 버튼 활성화 상태 업데이트
}

// 감상평 전체 보기 기능
function showReview(title) {
  const book = books.find((b) => b.title === title);
  if (book) {
    alert(
      `[${book.title}] 감상평:\n\n${book.review || "작성된 감상평이 없습니다."}`
    );
  }
}

// 책 정보 편집 기능
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
    book.completionStatus || ""; // 완결 여부 로드
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
    // 업데이트 후 버튼 텍스트와 이벤트 핸들러 원래대로 복원
    addButton.textContent = "책 추가";
    addButton.onclick = addBook;
  };
  alert(
    `'${titleToEdit}' 정보를 수정할 수 있도록 입력 필드에 로드했습니다. '정보 업데이트' 버튼을 클릭하세요.`
  );
}

// 책 정보 업데이트 함수
function updateBook(originalTitle) {
  const titleInput = document.getElementById("bookTitle");
  const authorInput = document.getElementById("bookAuthor");
  const genreInput = document.getElementById("bookGenre");
  const statusSelect = document.getElementById("bookStatus");
  const completionStatusSelect = document.getElementById("completionStatus"); // 완결 여부
  const totalChaptersInput = document.getElementById("totalChapters");
  const readChaptersInput = document.getElementById("readChapters");
  const ratingSelect = document.getElementById("bookRating");
  const reviewTextarea = document.getElementById("bookReview");

  const updatedTitle = titleInput.value.trim();
  const updatedAuthor = authorInput.value.trim();
  const updatedGenre = genreInput.value.trim();
  const updatedStatus = statusSelect.value;
  const updatedCompletionStatus = completionStatusSelect.value; // 완결 여부
  const updatedTotalChapters = Number(totalChaptersInput.value);
  const updatedReadChapters = Number(readChaptersInput.value);
  const updatedRating = Number(ratingSelect.value) || 0;
  const updatedReview = reviewTextarea.value.trim();

  if (updatedTitle === "" || updatedAuthor === "") {
    alert("도서 제목과 저자는 필수 입력 항목입니다!");
    return;
  }

  // 회차 유효성 검사 (숫자이고, 읽은 회차가 총 회차보다 클 수 없음)
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
    // 기존 책이 아니면서, 업데이트할 제목이 이미 존재하는지 확인
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
        updatedCompletionStatus === "" ? null : updatedCompletionStatus, // 완결 여부 저장
      totalChapters: isNaN(updatedTotalChapters) ? null : updatedTotalChapters,
      readChapters: isNaN(updatedReadChapters) ? null : updatedReadChapters,
      rating: updatedRating,
      review: updatedReview,
    };
    saveBooks();
    applyFilter(); // 목록 업데이트
    generateStats();
    updateFilterButtons(); // 필터 버튼 업데이트
    alert(`'${updatedTitle}' 정보가 업데이트되었습니다!`);

    // 입력 필드 초기화
    titleInput.value = "";
    authorInput.value = "";
    genreInput.value = "";
    statusSelect.value = "wish";
    completionStatusSelect.value = ""; // 완결 여부 초기화
    totalChaptersInput.value = "";
    readChaptersInput.value = "";
    ratingSelect.value = "";
    reviewTextarea.value = "";
  } else {
    alert("업데이트할 책을 찾을 수 없습니다.");
  }
}

// 통계 생성 (map, filter, reduce 활용)
function generateStats() {
  const resultsDiv = document.getElementById("results");
  resultsDiv.innerHTML = "";

  const totalBooks = books.length;
  const completedBooks = books.filter((book) => book.status === "completed");

  // 각 장르별 책 수 집계
  const genreCounts = books.reduce((acc, book) => {
    const genre = book.genre || "미지정";
    acc[genre] = (acc[genre] || 0) + 1;
    return acc;
  }, {});

  // 모든 장르 목록 추출 및 중복 제거
  const allGenres = [
    ...new Set(books.map((book) => book.genre || "미지정")),
  ].sort();

  // 완결/연재작 통계
  const completedWorksCount = books.filter(
    (book) => book.completionStatus === "completed"
  ).length;
  const serializedWorksCount = books.filter(
    (book) => book.completionStatus === "serialized"
  ).length;

  // 가장 높은 별점 책 (예시)
  const highestRatedBook = books.reduce(
    (prev, current) => {
      return (prev.rating || 0) > (current.rating || 0) ? prev : current;
    },
    { rating: 0, title: "N/A" }
  );

  // 읽은 회차 통계
  const booksWithChapterInfo = books.filter(
    (book) => book.totalChapters !== null && book.readChapters !== null
  );
  const totalProgress = booksWithChapterInfo.reduce((acc, book) => {
    const progress = (book.readChapters / book.totalChapters) * 100;
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

  // 회차 정보가 있는 책이 있을 경우에만 평균 진도율 표시
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

  if (totalBooks > 0 && highestRatedBook.rating > 0) {
    html += `<li class="list-group-item">가장 높은 별점 책: <strong>${
      highestRatedBook.title
    }</strong> (${"⭐".repeat(highestRatedBook.rating)})</li>`;
  } else {
    html += `<li class="list-group-item text-muted">아직 평가된 책이 없습니다.</li>`;
  }

  html += "</ul>";

  resultsDiv.innerHTML = html;
}

// 필터 버튼 업데이트 및 표시
function updateFilterButtons() {
  const filterButtonsDiv = document.getElementById("filterButtons");
  filterButtonsDiv.innerHTML = ""; // 기존 버튼 초기화

  // '전체' 버튼 추가
  const allButton = document.createElement("button");
  allButton.className = "btn btn-sm btn-outline-secondary";
  allButton.textContent = "전체";
  allButton.onclick = () => applyFilter(null, null);
  if (currentGenreFilter === null && currentCompletionFilter === null) {
    allButton.classList.add("active");
  }
  filterButtonsDiv.appendChild(allButton);

  // 완결/연재작 필터 버튼 추가
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
    button.onclick = () => applyFilter(null, type.value); // 장르는 초기화하고 완결 여부만 필터링
    filterButtonsDiv.appendChild(button);
  });

  // 중복 없는 장르 목록 생성 및 정렬
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
    button.onclick = () => applyFilter(genre, null); // 완결 여부는 초기화하고 장르만 필터링
    filterButtonsDiv.appendChild(button);
  });
}
