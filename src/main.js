const textarea = document.getElementById("main");
const display = document.getElementById("textDisplay");

const cursor = document.getElementById("cursor");

let tabs_ = await get_tabs();
update_active(tabs_.length);

let info = await retrieve_last_opened();

if (info[0] === "None") (info[0] = ""), (info[1] = "");

window.title = $("#title");
window.main = $("#main");
window.themeInput = $("#themeInput");
window.css = $("#cssStyling");

const popup = $("#popup");

let theme = await get_theme();
if (theme) changeTheme(theme), window.themeInput.val(theme);

window.path = info[0];
update_words(info[1]);

autosize(window.title);

const shortCutList = [
  {
    // use the comment above to understand what each key does
    description: "Close current file",
    specialKeys: ["Ctrl"],
    inputKey: "W",
  },
  {
    description: "Open file",
    specialKeys: ["Ctrl"],
    inputKey: "O",
  },
  {
    description: "Switch file (quick)",
    specialKeys: ["Ctrl"],
    inputKey: "Tab",
  },
  {
    description: "Switch focus",
    specialKeys: ["Tab"],
    inputKey: "",
  },
  {
    description: "Switch file",
    specialKeys: ["Ctrl"],
    inputKey: "1-9",
  },
  {
    description: "New file",
    specialKeys: ["Ctrl"],
    inputKey: "N",
  },
  {
    description: "Command pallet",
    specialKeys: ["Ctrl"],
    inputKey: "P",
  },
  {
    description: "Copy HTML output",
    specialKeys: ["Ctrl", "Shift"],
    inputKey: "H",
  },
  {
    description: "Change theme",
    specialKeys: ["Ctrl", "Alt"],
    inputKey: "S",
  },
]

// Language support
const supportedLanguages = [
  "en",
  "fr",
  "de",
  "es",
  "pt",
  "ru",
  "zh-cn",
  "ja",
  "ko",
  "pl",
  "hu",
  "ro",
];

// Get the user's browser language or use a default language
const userLanguage = navigator.language || "en";

// Check if the user's language is in the list of supported languages
const selectedLanguage = supportedLanguages.includes(userLanguage)
  ? userLanguage
  : "en";

window.editor = await BalloonEditor.create(document.querySelector("#main"), {
  extraPlugins: ["Markdown"],
  language: selectedLanguage,
}).catch((error) => {
  console.error(error);
});

window.title.val(decodeURIComponent(info[0]));
editor.setData(info[1]);

autosize.update(title);

window.title.on("input", async () => {
  const encodedTitle = encodeURIComponent(window.title.val());

  save_title(window.path, encodedTitle);
  manage_tabs(await get_tabs());

  window.path = encodedTitle;
});

/* ***** */
const observer = new MutationObserver(function (mutations) {
  mutations.forEach(function (mutation) {
    if (mutation.type === "childList" || mutation.type === "characterData") {
      const content = editor.getData();

      update_words(content);
      save(window.path, content);
    }
  });
});

observer.observe(textarea, {
  childList: true,
  characterData: true,
  subtree: true,
});

/* ***** */

window.title.keydown(function (e) {
  if (!/[a-zA-Z0-9]| |\:|\!|\"|\'|\,|\./.test(e.key) || e.key == "Enter")
    return e.preventDefault();
});

$(".pages").on("click", (event) => {
  const target = event.target;

  if (event.ctrlKey) return delete_tab(target);

  switch_tab(target);
});

const isMac = navigator.userAgent.toLowerCase().includes("mac");

themeInput.keydown((e) => {
  if (e.key === "Enter") {
    changeTheme(themeInput.val());
  }
});

$("body").keydown(async (e) => {
  const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

  if (e.key === "p" && ctrlKey) {
    e.preventDefault();
    createItemList();
    document.addEventListener("keydown", handleArrowNavigation);

    animateDiv(undefined, popup); // handle command pallet
  }

  if (e.key === "Escape") {
    e.preventDefault();

    animateDiv(true, popup); // force exit command pallet
    animateDiv(true, $("#cssStyling")); // force exit themes
  }

  if (e.key === "w" && ctrlKey) {
    e.preventDefault();

    handleCommandPrompt("Close current file");
  }
  if (/^[1-9]*$/.test(e.key) && ctrlKey) {
    e.preventDefault();

    handleCommandPrompt("Switch file", e.key);
  }
  if (e.key === "n" && ctrlKey) {
    e.preventDefault();

    handleCommandPrompt("New file");
  }
  if (e.key === "o" && ctrlKey) {
    e.preventDefault();

    const arg = await ask_for_file();

    handleCommandPrompt("Open file", arg);
  }

  if (e.key === "H" && ctrlKey && e.shiftKey) {
    e.preventDefault();

    handleCommandPrompt("Copy HTML output");
  }

  if (e.key === "Tab" && ctrlKey) {
    e.preventDefault();

    handleCommandPrompt("Switch file (quick)");
  }
  if (e.code === "KeyS" && ctrlKey && e.altKey) {
    e.preventDefault();

    animateDiv(undefined, css);
  }

  const focused = document.querySelector(".focused");

  if (e.key == "Enter" && focused) {
    const suggestion = focused.querySelector(".left-content span");
    const content = suggestion.textContent;

    if (content === "Switch file") {
      handleCommandPrompt(content, 1); // default to switch to 1st tab
    } 
    else if (content === "Open file") {
      const arg = await ask_for_file();
        handleCommandPrompt(content, arg);
    }
    else handleCommandPrompt(content);

    animateDiv(true, popup); // force exit command pallet
    animateDiv(true, $("#cssStyling")); // force exit themes
  }
});

window.animateDiv = async function (forceClose, el) {
  let isDisabled = el.prop("disabled");

  if (isDisabled === undefined) isDisabled = true;
  if (forceClose) isDisabled = false;

  const fadeAction = isDisabled ? "fadeIn" : "fadeOut";

  const windowHeight = $(window).height();

  el.find(".results").css("min-height", windowHeight / 2);

  const popupHeight = el.outerHeight();

  const scrollPosition = $(window).scrollTop();

  const topPosition = scrollPosition + (windowHeight - popupHeight) / 2;

  el.css("top", topPosition);

  el[fadeAction](250, function () {
    el.prop("disabled", !isDisabled);

    if (isDisabled) {
      $(".input").focus();
      $("body").css("overflow-y", "hidden");
    } else {
      window.main.focus();
      $("body").css("overflow-y", "auto");
    }
  });
};

function createItemList() {
  const suggestions = document.querySelectorAll(".suggestion");

  for (let i = 0; i < suggestions.length; i++) {
    suggestions[i].remove();
  }

  const list = document.getElementById("suggestionList");

  for (let i = 0; i < shortCutList.length; i++) {
    let currentItem = shortCutList[i];
    const li = document.createElement("li");
    const div = document.createElement("div");
    const leftContent = document.createElement("div");
    const rightContent = document.createElement("div");

    div.classList.add("suggestion");
    leftContent.classList.add("left-content");
    rightContent.classList.add("right-content");

    const span = document.createElement("span");

    span.textContent = currentItem.description;

    leftContent.appendChild(span);

    for (let j = 0; j < currentItem.specialKeys.length; j++) {
      let currentKey = currentItem.specialKeys[j];

      const kbd = document.createElement("kbd");
      kbd.textContent = currentKey;

      rightContent.appendChild(kbd);
      
      if (currentItem.inputKey != "") {
        const span = document.createElement("span");
        span.textContent = "+";
        rightContent.appendChild(span);
      }
    }
    
    if (currentItem.inputKey != "") {
      const kbd = document.createElement("kbd");
      kbd.textContent = currentItem.inputKey;
      rightContent.appendChild(kbd);
    }

    div.appendChild(leftContent);
    div.appendChild(rightContent);
    li.appendChild(div);

    list.appendChild(li);
  }
}

function handleArrowNavigation(event) {
  !popup.prop("disabled") && ["ArrowUp", "ArrowDown"].includes(event.key)
    ? event.preventDefault()
    : "";

  const navigableDivs = document.querySelectorAll(".suggestion");
  let currentIndex = -1;

  for (let i = 0; i < navigableDivs.length; i++) {
    if (navigableDivs[i].classList.contains("focused")) {
      currentIndex = i;
      navigableDivs[i].classList.remove("focused");
    }
  }

  let nextIndex;

  switch (event.key) {
    case "ArrowUp":
      nextIndex =
        currentIndex > 0 ? currentIndex - 1 : navigableDivs.length - 1;
      break;

    case "ArrowDown":
      nextIndex =
        currentIndex < navigableDivs.length - 1 ? currentIndex + 1 : 0;
      break;

    default:
      return;
  }

  navigableDivs[nextIndex].classList.add("focused");
  
  // scroll to the focused div
  navigableDivs[nextIndex].scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "nearest",
  });
}

const options = {
  valueNames: ["left-content"],
  fuzzySearch: {
    searchClass: "fuzzy-search",
    location: 0,
    distance: 100,
    threshold: 0.4,
    multiSearch: true,
  },
};


const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", (event) => {
  const query = event.target.value;
  const sl = new List("suggestionContainer", options);

  sl.fuzzySearch(query);

  updatePromptHeight();
});

function updatePromptHeight() {
  const list = document.getElementById("suggestionList");
  const newHeight = Math.min(list.children.length * 35, 500);
  const sc = document.getElementById("suggestionContainer");

  $(sc).animate({ height: `${newHeight}px` }, 100);
}

updatePromptHeight();