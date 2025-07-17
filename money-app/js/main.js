// js/main.js

// PWA 관련 변수
let deferredPrompt;
const installAppButton = document.getElementById("install-app-button");
let installGuideModalInstance; // Bootstrap 모달 인스턴스를 저장할 변수

document.addEventListener("DOMContentLoaded", () => {
  // Bootstrap 모달 인스턴스를 DOMContentLoaded 이후에 생성
  const installGuideModalElement = document.getElementById("installGuideModal");
  if (installGuideModalElement) {
    installGuideModalInstance = new bootstrap.Modal(installGuideModalElement);
  }

  // 서비스 워커 등록
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((registration) => {
        console.log(
          "Service Worker registered with scope:",
          registration.scope
        );
      })
      .catch((error) => {
        console.log("Service Worker registration failed:", error);
      });
  }

  // PWA 설치 프롬프트 이벤트 리스너
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installAppButton) {
      installAppButton.style.display = "block";
    }
  });

  // '앱 설치하기' 버튼 클릭 이벤트
  if (installAppButton) {
    installAppButton.addEventListener("click", () => {
      if (installGuideModalInstance) {
        installGuideModalInstance.show();
      }
    });
  }

  // 앱이 설치되었을 때 '앱 설치하기' 버튼 숨기기
  window.addEventListener("appinstalled", () => {
    if (installAppButton) {
      installAppButton.style.display = "none";
    }
    if (installGuideModalInstance) {
      installGuideModalInstance.hide();
    }
  });

  // 탭 전환 이벤트 리스너
  const myTabEl = document.querySelector("#myTab");
  if (myTabEl) {
    myTabEl.addEventListener("shown.bs.tab", (event) => {
      // 각 탭으로 이동 시 해당 기능의 초기화/업데이트 함수 호출
      if (event.target.id === "expense-tab") {
        if (typeof initExpenseTab === "function") {
          initExpenseTab();
        }
      } else if (event.target.id === "todo-tab") {
        if (typeof initTodoTab === "function") {
          initTodoTab();
        }
      }
      // 습관 추적기 관련 로직 제거됨
    });
  }

  // 다크 모드 스위치 이벤트 리스너
  const darkModeSwitch = document.getElementById("darkModeSwitch");
  const currentTheme = localStorage.getItem("theme");

  if (currentTheme) {
    document.body.classList.add(currentTheme);
    if (currentTheme === "dark-theme") {
      darkModeSwitch.checked = true;
    }
  }

  darkModeSwitch.addEventListener("change", () => {
    if (darkModeSwitch.checked) {
      document.body.classList.add("dark-theme");
      localStorage.setItem("theme", "dark-theme");
      document.documentElement.style.setProperty("--dark-mode-filter", "1");
    } else {
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light-theme");
      document.documentElement.style.setProperty("--dark-mode-filter", "0");
    }
    // 테마 변경 시 차트도 업데이트 (charts.js에 정의된 함수 호출)
    if (typeof updateChartsTheme === "function") {
      updateChartsTheme();
    }
  });

  // 초기 로드 시 다크 모드 스위치에 따라 Close 버튼 필터 설정
  if (document.body.classList.contains("dark-theme")) {
    document.documentElement.style.setProperty("--dark-mode-filter", "1");
  } else {
    document.documentElement.style.setProperty("--dark-mode-filter", "0");
  }

  // 페이지 초기 로드 시 활성화된 탭의 내용 초기화
  const activeTabButton = document.querySelector("#myTab .nav-link.active");
  if (activeTabButton) {
    const activeTabId = activeTabButton.id;
    if (activeTabId === "expense-tab") {
      if (typeof initExpenseTab === "function") {
        initExpenseTab();
      }
    } else if (activeTabId === "todo-tab") {
      if (typeof initTodoTab === "function") {
        initTodoTab();
      }
    }
    // 습관 추적기 관련 로직 제거됨
  }
});
