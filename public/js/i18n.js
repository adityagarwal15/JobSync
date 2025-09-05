// Make sure i18next + plugins are loaded via CDN in index.ejs BEFORE this file
i18next
  .use(i18nextHttpBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    debug: true,
    fallbackLng: "en",
    backend: {
      loadPath: "/locales/{{lng}}/translation.json"
    }
  }, function (err, t) {
    if (err) {
      console.error("i18next init failed:", err);
    } else {
      updateContent();
    }
  });


function updateContent() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.innerHTML = i18next.t(key);
  });
}

// Example: dropdown for switching languages
const langSwitcher = document.getElementById("langSwitcher");
if (langSwitcher) {
  langSwitcher.addEventListener("change", (e) => {
    const lng = e.target.value;
    i18next.changeLanguage(lng, () => updateContent());
  });
}
document.addEventListener("DOMContentLoaded", () => {
  const switcher = document.getElementById("languageSwitcher");

  // Load saved language if exists
  const savedLang = localStorage.getItem("lang") || "en";
  i18next.changeLanguage(savedLang);
  switcher.value = savedLang;

  // On change, update language + persist
  switcher.addEventListener("change", (e) => {
    const selectedLang = e.target.value;
    i18next.changeLanguage(selectedLang, () => {
      updateContent();
    });
    localStorage.setItem("lang", selectedLang);
  });
});
