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
    // clear inner html
    searchResults.innerHTML = "";
    axios
      .get(`/api/search?q=${this.value}`)
      .then((res) => {
        if (res.data.length) {
          searchResults.innerHTML = dompurify.sanitize(
            searchResultsHTML(res.data)
          );
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });
  // handle keyboard inputs
  searchInput.on("keyup", (e) => {
    if (searchResults.children.length < 1 && searchResults.innerHTML === "") {
      searchResults.innerHTML = `No results found for ${dompurify.sanitize(
        searchInput.innerHTML
      )}`;
    }
    // If not pressing up, down, or enter return
    if (![38, 40, 13].includes(e.keyCode)) {
      return; // skip it
    }
    //
    let indexOrig = index;
    switch (true) {
      // no search results.
      case searchResults.children.length < 1:
        if (index) index = undefined; // nothing in search result but index contains something. reset to undefined
        return; // Nothing in search results to work with
      case index === undefined:
        // new search results. Set user at 1st choice
        index = 0;
        searchResults.children[index].classList.add("search__result--active");
        return;
      case e.key === "Enter":
        searchResults.children[index].click();
        return;
      case e.key === "ArrowDown":
        if (index === searchResults.children.length - 1) {
          // reset index
          index = 0;
        } else {
          index++;
        }
        break;
      case e.key === "ArrowUp":
        if (index === 0) {
          // set index to last element
          index = searchResults.children.length - 1;
        } else {
          index--;
        }
        break;
    }
    console.log(`index: ${index}   element: ${searchResults.children[index]}`);
    searchResults.children[indexOrig].classList.remove(
      "search__result--active"
    );
    searchResults.children[index].classList.add("search__result--active");

    console.log(e);
  });
}

export default typeAhead;
