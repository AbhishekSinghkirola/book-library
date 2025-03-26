/* ------------------------- Grid View and List view ------------------------ */
const listViewBtn = document.getElementById("list-view");
const gridViewBtn = document.getElementById("grid-view");
const booksViewEl = document.querySelector(".books-view");

listViewBtn.addEventListener("click", () => {
  booksViewEl.classList.add("list");
  booksViewEl.classList.remove("grid");

  listViewBtn.classList.add("active");
  gridViewBtn.classList.remove("active");
});

gridViewBtn.addEventListener("click", () => {
  booksViewEl.classList.add("grid");
  booksViewEl.classList.remove("list");

  gridViewBtn.classList.add("active");
  listViewBtn.classList.remove("active");
});

window.onload = listViewBtn.click();

/* -------------------------- Manage Books Library -------------------------- */
const sortBooksEl = document.getElementById("sort-books");
const loaderEl = document.getElementById("loading");

let books = [];
let curPage = 0;
let curLimit = 32;
let isLoading = false;

const fetchBooks = async (page = 1, limit = 10) => {
  try {
    const response = await fetch(
      `https://api.freeapi.app/api/v1/public/books?page=${page}&limit=${limit}`
    );

    if (!response.ok) throw new Error("Failed to fetch books");

    const books = await response.json();

    return books?.data?.data || [];
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
};

const formatDate = (date) => {
  const timestamp = Date.parse(date);

  if (isNaN(timestamp) === false) {
    const d = new Date(timestamp);

    return `${d.toLocaleString("default", {
      month: "long",
    })}, ${d.getFullYear()}`;
  }

  return null;
};

const generateCardHTML = (book) => {
  return `
    <div class="card">
        <div class="image">
        <a href="${book?.volumeInfo?.infoLink}" target="_blank"><img src="${
    book?.volumeInfo?.imageLinks?.thumbnail
  }" alt="${book?.volumeInfo?.title || "Book Name"}" /></a>
        </div>
        <div class="content">
        <a href="${
          book?.volumeInfo?.infoLink
        }" target="_blank"><h3 class="title">${
    book?.volumeInfo?.title || "Book Name"
  }</h3></a>
        <p class="author">${
          book?.volumeInfo?.authors?.join(" and ") || "Author Name"
        }</p>
        <div class="publishing-details">
            <p class="publisher">${
              book?.volumeInfo?.publisher || "Publisher Name"
            }</p>
            <p class="published-date">${
              formatDate(book?.volumeInfo?.publishedDate) || "Published Date"
            }</p>
        </div>
        </div>
    </div>`;
};

const displayBooks = async (search = "", sort = "") => {
  console.log(isLoading);
  if (isLoading) return;

  isLoading = true;
  if (search || sort) {
    if (search) {
      // search book by title or author name
      const filteredBooks = books.filter(
        (book) =>
          (book?.volumeInfo?.title || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (book?.volumeInfo?.authors || []).some((author) =>
            author.toLowerCase().includes(search.toLowerCase())
          )
      );

      loaderEl.style.display = "none";

      if (filteredBooks.length) {
        const booksHtml = filteredBooks
          .map((book) => generateCardHTML(book))
          .join("");

        booksViewEl.innerHTML = booksHtml;
      } else {
        booksViewEl.innerHTML = `<p style="text-align: center;">No Books Found</p>`;
      }
    }

    if (sort) {
      switch (sort) {
        case "title-desc":
          books.sort((book1, book2) => {
            const book1Title = book1.volumeInfo.title.toLowerCase();
            const book2Title = book2.volumeInfo.title.toLowerCase();

            return book2Title.localeCompare(book1Title);
          });

          break;

        case "title-asc":
          books.sort((book1, book2) => {
            const book1Title = book1.volumeInfo.title.toLowerCase();
            const book2Title = book2.volumeInfo.title.toLowerCase();

            return book1Title.localeCompare(book2Title);
          });
          break;

        case "newest":
          books.sort((book1, book2) => {
            const dateA = Date.parse(book1.volumeInfo.publishedDate) || 0;
            const dateB = Date.parse(book2.volumeInfo.publishedDate) || 0;

            return dateB - dateA;
          });
          break;

        case "oldest":
          books.sort((book1, book2) => {
            const dateA = Date.parse(book1.volumeInfo.publishedDate) || 0;
            const dateB = Date.parse(book2.volumeInfo.publishedDate) || 0;

            return dateA - dateB;
          });
          break;
      }
      const booksHtml = books.map((book) => generateCardHTML(book)).join("");
      booksViewEl.innerHTML = booksHtml;
    }
  } else {
    loaderEl.style.display = "block";
    curPage++;
    const booksData = await fetchBooks(curPage, curLimit);

    if (booksData.length) {
      books.push(...booksData);
    } else {
      observer.unobserve(loaderEl);
      loaderEl.remove();
    }
    const booksHtml = books.map((book) => generateCardHTML(book)).join("");
    booksViewEl.innerHTML = booksHtml;
  }

  isLoading = false;
};

const debounce = (func, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
};

const handleSearchBooks = () => {
  const searchText = document.getElementById("search-books").value;

  displayBooks(searchText);
};

const debouncedHandleSearch = debounce(handleSearchBooks, 500);

const handleSortBooks = (e) => {
  const sortBy = e.target.value;

  displayBooks("", sortBy);
};

window.onload = () => displayBooks("", "");

document
  .getElementById("search-books")
  .addEventListener("keyup", debouncedHandleSearch);

sortBooksEl.addEventListener("change", handleSortBooks);

const options = {
  rootMargin: "300px",
};

const observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && entries[0].boundingClientRect.top > 330) {
    displayBooks();
  }
}, options);

observer.observe(loaderEl);
