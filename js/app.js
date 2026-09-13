const bookTitle = document.querySelector("#book-title");
const addBookButton = document.querySelector("#add-book");
const bookStatus = document.querySelector("#book-status");
const statusContainers = {
    want: document.querySelector("#want-books .book-items"),
    reading: document.querySelector("#reading-books .book-items"),
    finished: document.querySelector("#finished-books .book-items")
};

let books = JSON.parse(localStorage.getItem("books")) || [];

function saveBooks() {
    localStorage.setItem("books", JSON.stringify(books));
}

function renderBooks() {
    Object.values(statusContainers).forEach(function (container) { container.innerHTML = ""; });

    books.forEach(function (book, index) {
        const item = document.createElement("div");
        item.className = "book-item";

        const title = document.createElement("h4");
        title.textContent = book.title;
        item.appendChild(title);

        const actions = document.createElement("div");
        actions.className = "book-actions";

        const statusSelect = document.createElement("select");
        [["want","읽고 싶은 책"],["reading","읽는 중"],["finished","읽은 책"]].forEach(function (optionData) {
            const option = document.createElement("option");
            option.value = optionData[0];
            option.textContent = optionData[1];
            option.selected = book.status === optionData[0];
            statusSelect.appendChild(option);
        });
        statusSelect.addEventListener("change", function () {
            books[index].status = statusSelect.value;
            saveBooks();
            renderBooks();
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "삭제";
        deleteButton.addEventListener("click", function () {
            books.splice(index, 1);
            saveBooks();
            renderBooks();
        });

        actions.append(statusSelect, deleteButton);
        item.appendChild(actions);
        (statusContainers[book.status] || statusContainers.want).appendChild(item);
    });
}

addBookButton.addEventListener("click", function () {
    const title = bookTitle.value.trim();
    if (!title) { alert("책 제목을 입력해주세요."); return; }
    if (books.some(function (book) { return book.title.toLowerCase() === title.toLowerCase(); })) {
        alert("이미 등록된 책입니다."); return;
    }
    books.push({ title: title, status: bookStatus.value });
    saveBooks();
    renderBooks();
    bookTitle.value = "";
});
bookTitle.addEventListener("keydown", function (event) { if (event.key === "Enter") addBookButton.click(); });
renderBooks();

const recommendInput = document.querySelector("#recommend-input");
const recommendButton = document.querySelector("#recommend-button");
const recommendResult = document.querySelector("#recommend-result");

function showRecommendation(data) {
    recommendResult.innerHTML = "";
    const card = document.createElement("div"); card.className = "recommend-card";
    const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = "AI RECOMMENDATION";
    const title = document.createElement("h3"); title.textContent = data.title || "추천 도서";
    const author = document.createElement("p"); author.className = "author"; author.textContent = "저자 · " + (data.author || "정보 없음");
    const reason = document.createElement("p"); reason.className = "reason"; reason.textContent = data.reason || "추천 이유를 불러오지 못했습니다.";
    card.append(tag, title, author, reason); recommendResult.appendChild(card);
}

recommendButton.addEventListener("click", function () {
    const input = recommendInput.value.trim();
    if (!input) { recommendResult.innerHTML = '<div class="error-message">추천받을 조건을 입력해주세요.</div>'; return; }

    recommendResult.innerHTML = '<div class="loading">책을 찾고 있어요. 잠시만 기다려주세요.</div>';
    recommendButton.disabled = true;

    fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input })
    })
    .then(function (response) {
        console.log("HTTP 상태코드:", response.status);
        console.log("요청 성공 여부:", response.ok);
        if (!response.ok) throw new Error("API 요청 실패: " + response.status);
        return response.json();
    })
    .then(showRecommendation)
    .catch(function (error) {
        recommendResult.innerHTML = '<div class="error-message">추천을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.</div>';
        console.error(error);
    })
    .finally(function () { recommendButton.disabled = false; });
});

const recordTitle = document.querySelector("#record-title");
const recordRating = document.querySelector("#record-rating");
const recordReview = document.querySelector("#record-review");
const recordQuote = document.querySelector("#record-quote");
const recordThought = document.querySelector("#record-thought");
const saveRecordButton = document.querySelector("#save-record");
const recordMessage = document.querySelector("#record-message");
const recordList = document.querySelector("#record-list");
let records = JSON.parse(localStorage.getItem("readingRecords")) || [];

function saveRecords() { localStorage.setItem("readingRecords", JSON.stringify(records)); }
function renderRecords() {
    recordList.innerHTML = "";
    records.slice().reverse().forEach(function (record, reverseIndex) {
        const originalIndex = records.length - 1 - reverseIndex;
        const item = document.createElement("article"); item.className = "record-item";
        const top = document.createElement("div"); top.className = "record-top";
        const title = document.createElement("h3"); title.textContent = record.title;
        const del = document.createElement("button"); del.type = "button"; del.className = "record-delete"; del.textContent = "삭제";
        del.addEventListener("click", function () { records.splice(originalIndex, 1); saveRecords(); renderRecords(); });
        top.append(title, del);
        const meta = document.createElement("p"); meta.className = "record-meta"; meta.textContent = "★".repeat(Number(record.rating)) + " · " + record.date;
        item.append(top, meta);
        [["한줄평",record.review],["기억하고 싶은 문장",record.quote],["나에게 남은 것",record.thought]].forEach(function (part) {
            if (!part[1]) return;
            const p = document.createElement("p");
            const label = document.createElement("span"); label.className = "label"; label.textContent = part[0] + " · ";
            p.append(label, document.createTextNode(part[1])); item.appendChild(p);
        });
        recordList.appendChild(item);
    });
}

saveRecordButton.addEventListener("click", function () {
    const title = recordTitle.value.trim();
    if (!title) { recordMessage.textContent = "책 제목을 입력해주세요."; recordTitle.focus(); return; }
    records.push({
        title: title, rating: recordRating.value, review: recordReview.value.trim(), quote: recordQuote.value.trim(), thought: recordThought.value.trim(),
        date: new Date().toLocaleDateString("ko-KR")
    });
    saveRecords(); renderRecords();
    recordTitle.value = ""; recordReview.value = ""; recordQuote.value = ""; recordThought.value = ""; recordRating.value = "5";
    recordMessage.textContent = "독서 기록을 저장했습니다.";
});
renderRecords();
