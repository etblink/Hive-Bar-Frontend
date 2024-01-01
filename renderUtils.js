const { parseMetadata } = require("./utils");

// Define a utility function to render posts as HTML
function renderPosts(posts) {
  return posts
    .map((post) => {
      const metadata = parseMetadata(post.json_metadata);
      let description = metadata.description || "No description available";
      return `<div class="post">
              <h2 class="post__title">${post.title}</h2>
              <p class="post__description">${description}</p>
              <a href="/@${post.author}" class="post__author-link"><div class="post__author">${post.author}</div></a>
              <a href="/${post.category}/@${post.author}/${post.permlink}" class="post__read-more">Read more</a>
              <div class="post__button-flex">
                <div class="post__img-wrapper" onclick="upvoteWithKeychain('${post.author}', '${post.permlink}')">
                  <img src="./assets/like.svg" alt="Like" class="post__button post__button--like">
                </div>
                <div class="post__img-wrapper" onclick="downvoteWithKeychain('${post.author}', '${post.permlink}')">
                  <img src="./assets/dislike.svg" alt="Dislike" class="post__button post__button--dislike">
                </div>
              </div>
            </div>`;
    })
    .join("");
}

module.exports = { renderPosts };