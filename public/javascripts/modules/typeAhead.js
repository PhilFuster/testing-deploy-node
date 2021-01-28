const axios = require("axios");
import dompurify from "dompurify";

function searchResultsHTML(stores) {
  return (
    stores
      .map((store) => {
        return `
      <a href="/store/${store.slug}" class="search__result">
        <strong>${store.name}</strong>
      </a>
    `;
      })
      // map returns us an array. We just want a string
      .join(" ")
  );
}
function typeAhead(search) {
  // no search on page. return
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"');
  const searchResults = search.querySelector(".search__results");
  // search results index for search results selection using up/down key
  let index;
  searchInput.on("input", function () {
    // No value, quit it.
    if (!this.value) {
      searchResults.style.display = "none";
      return;
    }
    // show the search results!
    searchResults.style.display = "block";
    axios
      .get(`/api/search?q=${this.value}`)
      .then((res) => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(
            searchResultsHTML(res.data)
          );
          return;
        }
        searchResults.innerHTML = dompurify.sanitize(
          `no results for ${this.value} found.`
        );
      })
      .catch((err) => {
        console.error(err);
      });
  });
  // handle keyboard inputs
  searchInput.on("keyup", (e) => {
    // If not pressing up, down, or enter return
    if (![38, 40, 13].includes(e.keyCode)) {
      return; // skip it
    }
    //
    const activeClass = "search__result--active";
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll(".search__result");
    let next;
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1];
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13) {
      window.location = current.href;
      return;
    }
    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
}

export default typeAhead;
