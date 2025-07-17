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
    let newTheme;
    if (body.classList.contains("light-theme")) {
      body.classList.remove("light-theme");
      body.classList.add("dark-theme");
      newTheme = "dark-theme";
    } else {
      body.classList.remove("dark-theme");
      body.classList.add("light-theme");
      newTheme = "light-theme";
    }
    localStorage.setItem("theme", newTheme);
    updateToggleButton(newTheme);

    // 테마 변경 후 차트 다시 그리기 (색상 변경 적용)
    // 각 탭의 렌더링 함수가 전역으로 노출되어 있다고 가정
    // 현재 활성화된 탭에 따라 해당 탭의 렌더링 함수를 호출
    const activeTab = document.querySelector(".nav-link.active");
    if (activeTab) {
      const activeTabId = activeTab.id;
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
        typeof window.renderHabitStats === "function"
      ) {
        // 습관 탭은 통계만 새로 그리면 됨
        window.renderHabitStats();
      }
    }
  });

  // 3. 버튼 텍스트와 아이콘 업데이트 함수
  function updateToggleButton(currentTheme) {
    const icon = themeToggleButton.querySelector("i"); // 아이콘 요소가 버튼 내부에 직접 포함되어 있으므로 다시 찾음
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

  // 4. Bootstrap 탭 이벤트 리스너 (탭 전환 시 해당 탭 렌더링)
  const myTab = document.getElementById("myTab");
  if (myTab) {
    myTab.addEventListener("shown.bs.tab", function (e) {
      const activeTabId = e.target.id;
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
        // 습관 탭은 모든 요소를 다시 렌더링해야 함 (달력, 목록, 통계)
        window.renderHabits();
      }
    });
  }

  // 5. 각 JS 파일의 초기 렌더링 함수를 DOMContentLoaded에서 직접 호출
  // 각 스크립트 파일은 이제 자체적으로 DOMContentLoaded 리스너를 가지고 있으며,
  // 그 내부에서 초기 렌더링을 수행하고, window 객체에 필요한 함수들을 노출합니다.
  // 따라서 이 main.js의 DOMContentLoaded 에서는 별도의 초기 렌더링 호출은 필요 없습니다.
  // 탭 전환 시에만 각 탭의 렌더링 함수를 호출하면 됩니다.
});

// js/main.js 파일 (또는 PWA 관련 스크립트가 있는 곳)

let deferredPrompt;
const installAppButton = document.getElementById("install-app-button");
const installGuideModal = new bootstrap.Modal(
  document.getElementById("installGuideModal")
); // Bootstrap 모달 인스턴스 생성

window.addEventListener("beforeinstallprompt", (e) => {
  // 설치 프롬프트를 나중에 트리거할 수 있도록 이벤트 저장
  e.preventDefault();
  deferredPrompt = e;
  // '앱 설치하기' 버튼을 표시
  if (installAppButton) {
    installAppButton.style.display = "block";
  }
});

if (installAppButton) {
  installAppButton.addEventListener("click", () => {
    // '앱 설치하기' 버튼 클릭 시 설치 가이드 모달 띄우기
    installGuideModal.show();

    // 모달에서 '설치' 버튼을 클릭했을 때 실제 프롬프트 띄우고 싶다면
    // 모달 내부에 별도의 설치 버튼을 만들고 여기에 deferredPrompt.prompt()를 연결해야 합니다.
    // 현재는 가이드만 보여주며, 실제 설치는 사용자가 브라우저 메뉴를 통해 진행하도록 안내합니다.
    // 만약 모달에서 직접 설치 프롬프트를 띄우고 싶다면, 모달 내에 버튼을 추가하고
    // 그 버튼의 클릭 이벤트에 deferredPrompt.prompt()를 넣으면 됩니다.
  });
}

// (선택 사항) 만약 모달 내에 "직접 설치" 버튼을 만들고 싶다면:
// index.html 모달 바디 안에 <button id="modal-install-btn" class="btn btn-primary mt-3">앱 직접 설치</button> 추가
// 그리고 아래 js 코드 추가:
/*
document.getElementById('modal-install-btn')?.addEventListener('click', () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the A2HS prompt');
            } else {
                console.log('User dismissed the A2HS prompt');
            }
            deferredPrompt = null;
            installGuideModal.hide(); // 모달 숨기기
            installAppButton.style.display = 'none'; // 버튼 숨기기
        });
    }
});
*/

// 앱이 설치되었을 때 '앱 설치하기' 버튼 숨기기
window.addEventListener("appinstalled", () => {
  if (installAppButton) {
    installAppButton.style.display = "none";
  }
  if (installGuideModal) {
    installGuideModal.hide();
  }
});
