const $ = (selector) => document.querySelector(selector);
const statusContainers = { want: $("#want-books .book-items"), reading: $("#reading-books .book-items"), finished: $("#finished-books .book-items") };
const statusNames = { want: "읽고 싶은 책", reading: "읽는 중", finished: "읽은 책" };
function createBookId() { return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`; }
let books = (JSON.parse(localStorage.getItem("books")) || []).map((book) => ({ ...book, id: book.id || createBookId() }));
function today() { return new Date().toISOString().slice(0, 10); }
function readingDays(book) {
  if (!book.startedDate || !book.finishedDate) return null;
  const start = new Date(`${book.startedDate}T00:00:00`), end = new Date(`${book.finishedDate}T00:00:00`);
  const days = Math.round((end - start) / 86400000) + 1;
  return days > 0 ? days : null;
}
function updateBookDateFields() {
  const status = $("#book-status").value;
  $("#book-added-date-field").hidden = status !== "want";
  $("#book-started-date-field").hidden = status === "want";
  $("#book-finished-date-field").hidden = status === "want";
  if (status === "want" && !$("#book-added-date").value) $("#book-added-date").value = today();
  if (status !== "want" && !$("#book-started-date").value) $("#book-started-date").value = today();
}

async function findBookCover(book) {
  try {
    const params = new URLSearchParams({ title: book.title, author: book.author });
    const response = await fetch(`/api/book-search?${params}`);
    if (!response.ok) return;
    const result = await response.json();
    const savedBook = books.find((item) => item.id === book.id);
    if (!savedBook) return;
    savedBook.coverUrl = result.coverUrl || "";
    savedBook.isbn = result.isbn || "";
    saveBooks(); renderBooks();
  } catch (error) { console.info("표지 자동 검색을 건너뜁니다.", error); }
}

function saveBooks() { localStorage.setItem("books", JSON.stringify(books)); }
function emptyMessage(text) { const p = document.createElement("p"); p.className = "empty-message"; p.textContent = text; return p; }
function renderSummary() {
  [["#author-summary", "author", "작가 미입력"], ["#category-summary", "category", "기타"]].forEach(([id, key, fallback]) => {
    const target = $(id); target.replaceChildren();
    const counts = books.reduce((total, book) => { const value = book[key] || fallback; total[value] = (total[value] || 0) + 1; return total; }, {});
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"));
    if (!entries.length) target.append(emptyMessage("아직 등록한 책이 없어요."));
    entries.forEach(([name, count]) => {
      const row = document.createElement(key === "author" ? "button" : "div"); row.className = "summary-row";
      const label = document.createElement("span"); label.textContent = name; const value = document.createElement("strong"); value.textContent = `${count}권`; row.append(label, value);
      if (key === "author") { row.type = "button"; row.addEventListener("click", () => showAuthorBooks(name, fallback)); }
      target.append(row);
    });
  });
  const readingSummary = $("#reading-summary"); readingSummary.replaceChildren();
  const finishedBooks = books.filter((book) => book.status === "finished");
  const durations = finishedBooks.map(readingDays).filter(Boolean);
  const average = durations.length ? Math.round(durations.reduce((sum, days) => sum + days, 0) / durations.length) : null;
  [["읽는 중", `${books.filter((book) => book.status === "reading").length}권`], ["완독", `${finishedBooks.length}권`], ["평균 완독 기간", average ? `${average}일` : "기록 없음"]].forEach(([labelText, valueText]) => { const row = document.createElement("div"); row.className = "summary-row"; const label = document.createElement("span"); label.textContent = labelText; const value = document.createElement("strong"); value.textContent = valueText; row.append(label, value); readingSummary.append(row); });
  if (!durations.length) { const note = document.createElement("p"); note.className = "summary-note"; note.textContent = "시작일과 읽은 날짜가 있는 책을 기준으로 계산합니다."; readingSummary.append(note); }
}
function showAuthorBooks(author, fallback) {
  const target = $("#author-books"); target.replaceChildren();
  const readBooks = books.filter((book) => (book.author || fallback) === author && book.status === "finished");
  const heading = document.createElement("h4"); heading.textContent = `${author}의 읽은 책`;
  target.append(heading);
  if (!readBooks.length) { target.append(emptyMessage("아직 읽은 책으로 등록된 항목이 없어요.")); return; }
  const list = document.createElement("ul");
  readBooks.forEach((book) => { const item = document.createElement("li"); item.textContent = book.finishedDate ? `${book.title} · ${book.finishedDate}` : book.title; list.append(item); });
  target.append(list);
}
function renderBooks() {
  Object.values(statusContainers).forEach((container) => container.replaceChildren());
  if (!books.length) statusContainers.want.append(emptyMessage("첫 책을 등록해 보세요."));
  books.forEach((book, index) => {
    const item = document.createElement("div"); item.className = "book-item";
    const content = document.createElement("div"); content.className = "book-content";
    const cover = document.createElement("div"); cover.className = "book-cover";
    if (book.coverUrl) { const image = document.createElement("img"); image.src = book.coverUrl; image.alt = `${book.title} 표지`; image.addEventListener("error", () => { image.remove(); cover.textContent = "📚"; }); cover.append(image); } else { cover.textContent = "📚"; }
    const text = document.createElement("div");
    const title = document.createElement("h4"); title.textContent = book.title;
    const duration = readingDays(book);
    const dateText = book.status === "want" ? (book.addedDate ? ` · 담은 날 ${book.addedDate}` : "") : `${book.startedDate ? ` · 시작 ${book.startedDate}` : ""}${book.finishedDate ? ` · 완료 ${book.finishedDate}` : ""}${duration ? ` · ${duration}일` : ""}`;
    const details = document.createElement("p"); details.className = "book-details"; details.textContent = `${book.author || "작가 미입력"} · ${book.category || "기타"}${dateText}`;
    text.append(title, details); content.append(cover, text);
    const actions = document.createElement("div"); actions.className = "book-actions";
    const select = document.createElement("select");
    Object.entries(statusNames).forEach(([value, name]) => select.add(new Option(name, value, false, book.status === value)));
    select.addEventListener("change", () => { books[index].status = select.value; if (select.value === "want" && !books[index].addedDate) books[index].addedDate = today(); if ((select.value === "reading" || select.value === "finished") && !books[index].startedDate) books[index].startedDate = today(); if (select.value === "finished" && !books[index].finishedDate) books[index].finishedDate = today(); saveBooks(); renderBooks(); });
    const edit = document.createElement("button"); edit.type = "button"; edit.className = "book-edit"; edit.textContent = "수정";
    edit.addEventListener("click", () => {
      if (item.querySelector(".book-edit-form")) return;
      const form = document.createElement("div"); form.className = "book-edit-form";
      const titleInput = document.createElement("input"); titleInput.type = "text"; titleInput.value = book.title; titleInput.maxLength = 100; titleInput.setAttribute("aria-label", "책 제목 수정");
      const authorInput = document.createElement("input"); authorInput.type = "text"; authorInput.value = book.author || ""; authorInput.maxLength = 60; authorInput.setAttribute("aria-label", "작가 수정");
      const categoryInput = document.createElement("select"); ["소설", "역사", "인문", "사회", "과학", "예술", "외국어", "자기계발", "기타"].forEach((category) => categoryInput.add(new Option(category, category, false, (book.category || "기타") === category)));
      const addedInput = document.createElement("input"); addedInput.type = "date"; addedInput.value = book.addedDate || ""; addedInput.setAttribute("aria-label", "담은 날짜 수정");
      const startedInput = document.createElement("input"); startedInput.type = "date"; startedInput.value = book.startedDate || ""; startedInput.setAttribute("aria-label", "읽기 시작일 수정");
      const dateInput = document.createElement("input"); dateInput.type = "date"; dateInput.value = book.finishedDate || ""; dateInput.setAttribute("aria-label", "읽은 날짜 수정");
      const save = document.createElement("button"); save.type = "button"; save.textContent = "저장";
      save.addEventListener("click", () => { const nextTitle = titleInput.value.trim(), nextAuthor = authorInput.value.trim(); if (!nextTitle || !nextAuthor) { alert("책 제목과 작가를 입력해 주세요."); return; } const changedSearch = books[index].title !== nextTitle || books[index].author !== nextAuthor; books[index] = { ...books[index], title: nextTitle, author: nextAuthor, category: categoryInput.value, addedDate: addedInput.value, startedDate: startedInput.value, finishedDate: dateInput.value, coverUrl: changedSearch ? "" : books[index].coverUrl }; saveBooks(); renderBooks(); if (changedSearch || !books[index].coverUrl) findBookCover(books[index]); });
      const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "book-edit-cancel"; cancel.textContent = "취소"; cancel.addEventListener("click", () => form.remove());
      if (book.status === "want") form.append(titleInput, authorInput, categoryInput, addedInput, save, cancel); else form.append(titleInput, authorInput, categoryInput, startedInput, dateInput, save, cancel); item.append(form); titleInput.focus();
    });
    const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "삭제";
    remove.addEventListener("click", () => { books.splice(index, 1); saveBooks(); renderBooks(); });
    actions.append(select, edit, remove); item.append(content, actions); (statusContainers[book.status] || statusContainers.want).append(item);
  });
  renderSummary(); renderCalendar();
}
$("#add-book").addEventListener("click", () => {
  const title = $("#book-title").value.trim(), author = $("#book-author").value.trim();
  if (!title || !author) { alert(!title ? "책 제목을 입력해 주세요." : "작가를 입력해 주세요."); (!title ? $("#book-title") : $("#book-author")).focus(); return; }
  if (books.some((book) => book.title.toLowerCase() === title.toLowerCase() && (book.author || "").toLowerCase() === author.toLowerCase())) { alert("이미 등록된 책입니다."); return; }
  const status = $("#book-status").value, addedDate = $("#book-added-date").value, startedDate = $("#book-started-date").value, finishedDate = $("#book-finished-date").value;
  const book = { id: createBookId(), title, author, category: $("#book-category").value, status, addedDate: status === "want" ? (addedDate || today()) : "", startedDate: status === "want" ? "" : (startedDate || today()), finishedDate: status === "finished" ? (finishedDate || today()) : "", coverUrl: "" };
  books.push(book); saveBooks(); renderBooks(); findBookCover(book); $("#book-title").value = ""; $("#book-author").value = ""; $("#book-added-date").value = ""; $("#book-started-date").value = ""; $("#book-finished-date").value = ""; updateBookDateFields(); $("#book-title").focus();
});
$("#book-status").addEventListener("change", updateBookDateFields);
updateBookDateFields();
[$("#book-title"), $("#book-author")].forEach((input) => input.addEventListener("keydown", (event) => { if (event.key === "Enter") $("#add-book").click(); }));
const calendarGrid = $("#calendar-grid");
const calendarMonth = $("#calendar-month");
const calendarDetail = $("#calendar-detail");
let viewingMonth = new Date();
viewingMonth = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth(), 1);

function dateKey(year, month, day) { return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }
function showCalendarDetail(key, dayBooks) {
  calendarDetail.replaceChildren();
  const [year, month, day] = key.split("-").map(Number);
  const heading = document.createElement("h3"); heading.textContent = `${year}년 ${month}월 ${day}일에 읽은 책`;
  calendarDetail.append(heading);
  if (!dayBooks.length) { calendarDetail.append(emptyMessage("이 날 읽은 책이 없어요.")); return; }
  const list = document.createElement("div"); list.className = "calendar-book-list";
  dayBooks.forEach((book) => { const item = document.createElement("article"); item.className = "calendar-book"; const cover = document.createElement("div"); cover.className = "calendar-detail-cover"; if (book.coverUrl) { const image = document.createElement("img"); image.src = book.coverUrl; image.alt = `${book.title} 표지`; image.addEventListener("error", () => { image.remove(); cover.textContent = "📚"; }); cover.append(image); } else { cover.textContent = "📚"; } const text = document.createElement("div"); const title = document.createElement("strong"); title.textContent = book.title; const author = document.createElement("span"); author.textContent = book.author || "작가 미입력"; text.append(title, author); item.append(cover, text); list.append(item); });
  calendarDetail.append(list);
}
function renderCalendar() {
  if (!calendarGrid) return;
  const year = viewingMonth.getFullYear(), month = viewingMonth.getMonth();
  calendarMonth.textContent = `${year}년 ${month + 1}월`;
  calendarGrid.replaceChildren();
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let blank = 0; blank < startDay; blank += 1) { const cell = document.createElement("div"); cell.className = "calendar-day is-empty"; calendarGrid.append(cell); }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = dateKey(year, month, day); const dayBooks = books.filter((book) => book.status === "finished" && book.finishedDate === key);
    const cell = document.createElement("button"); cell.type = "button"; cell.className = "calendar-day"; cell.setAttribute("aria-label", `${year}년 ${month + 1}월 ${day}일, 읽은 책 ${dayBooks.length}권`);
    const number = document.createElement("span"); number.className = "calendar-date"; number.textContent = day; cell.append(number);
    const covers = document.createElement("div"); covers.className = "calendar-covers";
    dayBooks.slice(0, 3).forEach((book) => { const cover = document.createElement("span"); cover.className = "calendar-cover"; if (book.coverUrl) { const image = document.createElement("img"); image.src = book.coverUrl; image.alt = ""; image.addEventListener("error", () => { image.remove(); cover.textContent = "📚"; }); cover.append(image); } else { cover.textContent = "📚"; } covers.append(cover); });
    if (dayBooks.length > 3) { const more = document.createElement("span"); more.className = "calendar-more"; more.textContent = `+${dayBooks.length - 3}`; covers.append(more); }
    cell.append(covers); cell.addEventListener("click", () => showCalendarDetail(key, dayBooks)); calendarGrid.append(cell);
  }
  calendarDetail.replaceChildren();
}
$("#previous-month").addEventListener("click", () => { viewingMonth = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() - 1, 1); renderCalendar(); });
$("#next-month").addEventListener("click", () => { viewingMonth = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() + 1, 1); renderCalendar(); });
renderBooks();

const recommendInput = $("#recommend-input"), recommendButton = $("#recommend-button"), recommendResult = $("#recommend-result");
recommendButton.addEventListener("click", () => {
  const input = recommendInput.value.trim(); if (!input) { recommendResult.innerHTML = '<div class="error-message">추천받을 조건을 입력해 주세요.</div>'; return; }
  recommendResult.innerHTML = '<div class="loading">책을 찾고 있어요. 잠시만 기다려 주세요.</div>'; recommendButton.disabled = true;
  fetch("/api/recommend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) })
    .then((response) => { if (!response.ok) throw new Error(); return response.json(); })
    .then((data) => { recommendResult.replaceChildren(); const card = document.createElement("div"); card.className = "recommend-card"; card.innerHTML = '<span class="tag">AI RECOMMENDATION</span><h3></h3><p class="author"></p><p class="reason"></p>'; card.querySelector("h3").textContent = data.title || "추천 도서"; card.querySelector(".author").textContent = `작가 · ${data.author || "정보 없음"}`; card.querySelector(".reason").textContent = data.reason || "추천 이유를 불러오지 못했습니다."; recommendResult.append(card); })
    .catch(() => { recommendResult.innerHTML = '<div class="error-message">추천을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</div>'; })
    .finally(() => { recommendButton.disabled = false; });
});

let records = JSON.parse(localStorage.getItem("readingRecords")) || [];
$("#record-date").value = today();
function renderRecords() {
  const list = $("#record-list"); list.replaceChildren();
  records.slice().reverse().forEach((record, reverseIndex) => { const index = records.length - 1 - reverseIndex, item = document.createElement("article"); item.className = "record-item"; const top = document.createElement("div"); top.className = "record-top"; const title = document.createElement("h3"); title.textContent = record.title; const del = document.createElement("button"); del.type = "button"; del.className = "record-delete"; del.textContent = "삭제"; del.addEventListener("click", () => { records.splice(index, 1); localStorage.setItem("readingRecords", JSON.stringify(records)); renderRecords(); }); top.append(title, del); const meta = document.createElement("p"); meta.className = "record-meta"; meta.textContent = `${"★".repeat(Number(record.rating))} · ${record.date}`; item.append(top, meta); [["한줄평", record.review], ["기억하고 싶은 문장", record.quote], ["나에게 남은 것", record.thought]].forEach(([label, text]) => { if (!text) return; const p = document.createElement("p"), labelElement = document.createElement("span"); labelElement.className = "label"; labelElement.textContent = `${label} · `; p.append(labelElement, document.createTextNode(text)); item.append(p); }); list.append(item); });
}
$("#save-record").addEventListener("click", () => { const title = $("#record-title").value.trim(); if (!title) { $("#record-message").textContent = "책 제목을 입력해 주세요."; return; } records.push({ title, rating: $("#record-rating").value, review: $("#record-review").value.trim(), quote: $("#record-quote").value.trim(), thought: $("#record-thought").value.trim(), date: $("#record-date").value || today() }); localStorage.setItem("readingRecords", JSON.stringify(records)); renderRecords(); ["#record-title", "#record-review", "#record-quote", "#record-thought"].forEach((id) => { $(id).value = ""; }); $("#record-rating").value = "5"; $("#record-date").value = today(); $("#record-message").textContent = "독서 기록을 저장했습니다."; });
renderRecords();
