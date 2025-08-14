// js/main.js

// PWA 관련 변수
let deferredPrompt;

document.addEventListener("DOMContentLoaded", () => {
  // 서비스 워커 등록
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./service-worker.js")
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

  // PWA 설치 프롬프트 표시 제어 (버튼이 있을 때만 노출)
  const installAppButton = document.getElementById("install-app-button");
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installAppButton) {
      installAppButton.style.display = "block";
    }
  });
  if (installAppButton) {
    installAppButton.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installAppButton.style.display = "none";
    });
  }

  // 탭 전환: 네비게이션 a[data-tab]과 컨텐츠 #id 연동
  const navLinks = document.querySelectorAll("a[data-tab]");
  const tabContents = document.querySelectorAll(".tab-content");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.getAttribute("data-tab");

      // nav active 토글
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");

      // 콘텐츠 토글
      tabContents.forEach((c) => c.classList.remove("active"));
      const targetEl = document.getElementById(target);
      if (targetEl) targetEl.classList.add("active");

      // 탭별 초기화
      if (target === "expense" && typeof initExpenseTab === "function") {
        initExpenseTab();
      }
      if (target === "todo" && typeof initTodoTab === "function") {
        initTodoTab();
      }
    });
  });

  // 다크 모드: 스위치와 상단 버튼 동기화
  const darkModeSwitch = document.getElementById("dark-mode-toggle");
  const themeToggleButton = document.getElementById("theme-toggle");
  const setTheme = (theme) => {
    const isDark = theme === "dark-theme";
    document.body.classList.toggle("dark-theme", isDark);
    localStorage.setItem("theme", isDark ? "dark-theme" : "light-theme");
    document.documentElement.style.setProperty(
      "--dark-mode-filter",
      isDark ? "1" : "0"
    );
    if (darkModeSwitch) darkModeSwitch.checked = isDark;
    if (themeToggleButton) {
      const icon = themeToggleButton.querySelector("i");
      if (icon) {
        icon.classList.toggle("bi-moon-fill", !isDark);
        icon.classList.toggle("bi-sun-fill", isDark);
      }
    }
    if (typeof updateChartsTheme === "function") {
      updateChartsTheme();
    }
  };

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) setTheme(savedTheme);

  if (darkModeSwitch) {
    darkModeSwitch.addEventListener("change", () => {
      setTheme(darkModeSwitch.checked ? "dark-theme" : "light-theme");
    });
  }
  if (themeToggleButton) {
    themeToggleButton.addEventListener("click", () => {
      const isDark = document.body.classList.contains("dark-theme");
      setTheme(isDark ? "light-theme" : "dark-theme");
    });
  }

  // 초기 활성 탭 컨텐츠 초기화
  if (document.getElementById("expense")?.classList.contains("active")) {
    if (typeof initExpenseTab === "function") initExpenseTab();
  } else if (document.getElementById("todo")?.classList.contains("active")) {
    if (typeof initTodoTab === "function") initTodoTab();
  }
});
