const bookTitle = document.querySelector("#book-title");
const addBookButton = document.querySelector("#add-book");
const bookList = document.querySelector(".book-list");
const wantBooks = document.querySelector("#want-books");
const readingBooks = document.querySelector("#reading-books");
const finishedBooks = document.querySelector("#finished-books");
const bookStatus = document.querySelector("#book-status");



// ① localStorage에 저장된 책 데이터를 불러와 JavaScript 배열로 변환
// 저장된 데이터가 없으면 빈 배열 []로 시작
// localStorage.getItem() → 저장된 데이터 가져오기
// JSON.parse()           → 문자열(JSON)을 JavaScript 배열/객체로 변환

let books = JSON.parse(localStorage.getItem("books")) || [];

function addBookToScreen(book) {
    const newBook = document.createElement("div");
    newBook.classList.add("book-item");

    const bookTitleElement = document.createElement("h3");
    bookTitleElement.textContent = book.title;

    newBook.appendChild(bookTitleElement);

    // delete (삭제) 버튼 JavaScript 로 생성
    const deleteButton = document.createElement("button");
    deleteButton.textContent = "삭제";

    newBook.appendChild(deleteButton);

    deleteButton.addEventListener("click", function () {
        books = books.filter(function (savedBook) {
            return savedBook.title !== book.title;
        });

        localStorage.setItem("books", JSON.stringify(books));

        newBook.remove();
    });

    if (book.status === "want") {
        wantBooks.appendChild(newBook);
    } else if (book.status === "reading") {
        readingBooks.appendChild(newBook);
    } else if (book.status === "finished") {
        finishedBooks.appendChild(newBook);
    }
}


// 저장된 책들을 하나씩 꺼내 화면에 다시 표시
// 새로고침(F5)해도 저장된 책이 화면에 보이게 하는 역할

books.forEach(function (book) {
    addBookToScreen(book);
});

// 책 추가
addBookButton.addEventListener("click", function () {

    // 1. 입력한 책 제목 가져오기
    const title = bookTitle.value.trim();

    // 2. 빈 입력 검사
    if (title === "") {
        alert("책 제목을 입력해주세요.");
        return;
    }

    // 3. 중복 검사 추가
    const isDuplicate = books.some(function (book) {
        return book.title === title;
    });

    if (isDuplicate) {
        alert("이미 등록된 책입니다.");
        return;
    }

    // 4. 새 책 객체 만들기
    const newBook = {
        title: title,
        status: bookStatus.value
    };

    // 5. books 배열에 추가
    books.push(newBook);

    // 6. localStorage에 저장
    localStorage.setItem("books", JSON.stringify(books));

    // 7. 화면에 표시
    addBookToScreen(newBook);

    // 8. 입력창 비우기
    bookTitle.value = "";
});


