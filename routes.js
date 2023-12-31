const express = require("express");
const router = express.Router();
const { fetchPosts, parseMetadata, escapeHTML } = require("./utils");
const { client, renderer } = require("./hiveClient");
// Simple in-memory cache
const cache = {};
// Function to get data from cache by key
function getFromCache(key) {
  return cache[key];
}
// Function to set data to cache with a key and TTL (time to live)
function setToCache(key, data, ttl = 300000) { // Default TTL 5 minutes
  cache[key] = { data, expiry: Date.now() + ttl };
}
// Function to check cache validity
function isCacheValid(entry) {
  return entry && entry.expiry > Date.now();
}

// Define a route to fetch posts from the Hive community and return as HTML
router.get("/community/posts/", (req, res) => {
  const cacheKey = "community_posts";
  const cachedData = getFromCache(cacheKey);

  if (isCacheValid(cachedData)) {
    console.log("Serving posts from cache");
    return res.send(cachedData.data);
  }
  console.log("Fetching posts...");
  const postQuery = {
    tag: "hive-167922",
    limit: 2,
  };
  const retries = 3;
  const retryDelay = 2000;

  fetchPosts(retries, retryDelay, postQuery, client)
    .then((posts) => {
        console.log(`Fetched ${posts.length} posts`);
        // Convert the posts to HTML
        let postsHtml = posts
          .map((post) => {
            const metadata = parseMetadata(post.json_metadata);
            let description = metadata.description || "No description available";
            return `<div class="post">
                    <h2 class="post__title">${post.title}</h2>
                    <p class="post__description">${description}</p>
                    <a href="/@${post.author}" class="post__author-link"><div class="post__author">${post.author}</div></a>
                    <a href="/${post.category}/@${post.author}/${post.permlink}" class="post__read-more">Read more</a>
                    <div class="post__img-wrapper">
                      <img src="./assets/dislike.svg" alt="Dislike" class="post__button post__button--dislike">
                    </div>
                    <div class="post__img-wrapper" onclick="upvoteWithKeychain('${post.author}', '${post.permlink}')">
                      <img src="./assets/like.svg" alt="Like" class="post__button post__button--like">
                    </div>
                  </div>`;
          })
          .join("");
      // Cache the result
      setToCache(cacheKey, postsHtml);
        // Send the HTML as a response
        res.send(postsHtml);
      })
      .catch((error) => {
        console.error("Error fetching posts:", error);
        res.status(500).send("Error fetching posts from Hive community");
      });

  
});

// Define a route to serve individual post pages
router.get("/:postCategory/@:username/:postTitle", (req, res) => {
    // Extract parameters from the URL
    const { username, postTitle } = req.params;
    const cacheKey = `post_${username}_${postTitle}`;
    const cachedData = getFromCache(cacheKey);

    if (isCacheValid(cachedData)) {
        console.log("Serving individual post from cache");
        return res.send(cachedData.data);
    }
    console.log("Fetching individual post...");
    // Fetch the post data
    client.database
      .call("get_content", [username, postTitle])
      .then((post) => {
        // Make sure a post was found
        if (!post || !post.author) {
          return res.status(404).send("Post not found");
        }
        // Render the Markdown body to HTML
        const renderedBody = renderer.render(post.body);
        // HTML Template
        const headerHtml = `
          <header>
            <h1>${escapeHTML(post.title)}</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/community.html">Community</a>
            </nav>
          </header>
        `;
        const footerHtml = `
          <footer>
            <p>&copy; 2023 Hive Community</p>
          </footer>
        `;
        const mainContent = `
          <main style="display: block">
            <div class="post-details">
              <a href="/@${post.author}"><span>${post.author}</span></a>
              <div>${renderedBody}</div>
            </div>
          </main>
        `;
        // Combine header, main content, and footer to generate the full-page HTML
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeHTML(post.title)}</title>
            <link rel="stylesheet" type="text/css" href="/style.css">
          </head>
          <body>
            ${headerHtml}
            ${mainContent}
            ${footerHtml}
          </body>
          </html>
        `;
        // Cache the result
        setToCache(cacheKey, html);
        // Send the rendered HTML as the response
        res.send(html);
      })
      .catch((error) => {
        console.error("Error fetching the individual post:", error);
        res
          .status(500)
          .send("Error fetching the individual post from Hive community");
      });
  });
  

// Endpoint to display a user's profile
router.get("/@:username", (req, res) => {
  const { username } = req.params;
  const cacheKey = `user_profile_${username}`;
  const cachedData = getFromCache(cacheKey);
  if (isCacheValid(cachedData)) {
    console.log("Serving profile from cache");
    return res.send(cachedData.data);
  }
  console.log(`Fetching profile for ${username}...`); // Log #6: Endpoint for user profile hit

  client.database
    .call("get_accounts", [[username]])
    .then((accounts) => {
      const account = accounts[0];

      if (!account) {
        return res.status(404).send("User profile not found");
      }

      const postingMetadata = JSON.parse(account.posting_json_metadata);
      const { profile } = postingMetadata;

      const headerHtml = `
        <head>
        <link rel="stylesheet" type="text/css" href="/style.css">
        </head>
        <header>
            <h1>${profile.name}</h1>
            <nav>
                <a href=\"/\">Home</a>
                <a href=\"/community.html\">Community</a>
            </nav>
        </header>
    `;

      const profileHtml = `
            ${headerHtml}
            <div class=\"profile\">
            <h2>${profile.name}</h2>
            <p>${profile.about}</p>
            <img src=\"${profile.profile_image}\" alt=\"${profile.name}'s profile image\">
        </div>`;

      // Cache the result
      setToCache(cacheKey, profileHtml);

      res.send(profileHtml);
    })
    .catch((error) => {
      console.error("Error fetching user profile:", error); // Log #7: Error details while fetching user profile
      res.status(500).send("Error fetching user profile from Hive community");
    });
});

// Placeholder for additional API endpoints

module.exports = router;