const express = require("express");
const router = express.Router();
const { fetchPosts, parseMetadata, escapeHTML } = require("./utils");
const { client, renderer } = require("./hiveClient");
const { generateCacheKey, getFromCache, isCacheValid, setToCache } = require('./cacheUtils');
const { renderPosts } = require("./renderUtils");

 
router.get("/community/posts/", (req, res) => {
  const cacheKey = generateCacheKey("community_posts", req.query);
  const cachedData = getFromCache(cacheKey);
  if (isCacheValid(cachedData)) {
    console.log("Serving posts from cache");
    // Render HTML from the cached post JSON
    const postsHtml = renderPosts(cachedData.data);
    return res.send(postsHtml);
  }
  console.log("Fetching posts...");
  const postQuery = {
    tag: "hive-167922",
    limit: 5,
  };
  const retries = 3;
  const retryDelay = 2000;

fetchPosts(retries, retryDelay, postQuery, client)
    .then((posts) => {
      console.log(`Fetched ${posts.length} posts`);
      // Cache the raw posts JSON
      setToCache(cacheKey, posts);
      // Pass the posts to the render function
      const postsHtml = renderPosts(posts);
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
    const { username, postCategory, postTitle } = req.params;
    const cacheKey = generateCacheKey("post", { username, postCategory, postTitle });
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
            <button id="loginButton">Login</button>
            <button id="logoutButton" style="display: none">Logout</button>
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
  const cacheKey = generateCacheKey("user_profile", { username });
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

      // Existing code that attempts to parse profile information:
      let postingMetadata;
      try {
        postingMetadata = JSON.parse(account.posting_json_metadata || '{}');
      } catch (e) {
        console.error("Error parsing account posting_json_metadata:", e);
        postingMetadata = {};
      }
      const profile = postingMetadata.profile || {};

      

      const headerHtml = `
        <head>
        <link rel="stylesheet" type="text/css" href="/style.css">
        <script
          src="https://unpkg.com/htmx.org@1.9.10"
          integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC"
          crossorigin="anonymous"
        ></script>
        <script src="communityActions.js"></script>
        </head>
        <header>
            <button id="loginButton">Login</button>
            <button id="logoutButton" style="display: none">Logout</button>
            <h1>${username}</h1>
            <nav>
                <a href=\"/\">Home</a>
                <a href=\"/community.html\">Community</a>
            </nav>
        </header>
    `;

      const profileHtml = `
          ${headerHtml}
          <div class="profile">
              <h2>${username}</h2>
              <p>${profile.about}</p>
              <div class="profile__image-wrapper">
                  <img src="${profile.profile_image}" alt="${username}'s profile image" class="profile__image">
              </div>
              <div id="posts"
                   hx-get="/@${username}/posts"
                   hx-trigger="load revealed"
                   hx-target="#posts"
                   hx-indicator="#spinner"
                   hx-swap="beforeend">
              </div>
              <img id="spinner" src="./assets/spinner.svg" class="htmx-indicator" />
          </div>
      `;

      // Cache the result
      setToCache(cacheKey, profileHtml);

      res.send(profileHtml);
    })
    .catch((error) => {
      console.error("Error fetching user profile:", error); // Log #7: Error details while fetching user profile
      res.status(500).send("Error fetching user profile from Hive community");
    });
});

// Endpoint to fetch user's posts
router.get("/@:username/posts", (req, res) => {
  const { username } = req.params;
  const cacheKey = generateCacheKey("user_posts", { username });
  const cachedData = getFromCache(cacheKey);
  if (isCacheValid(cachedData)) {
    console.log("Serving user's posts from cache");
    return res.send(cachedData.data);
  }
  console.log(`Fetching posts for ${username}...`);

  // Define the query for fetching user's posts
  const postQuery = {
    tag: username,
    limit: 2,
  };

  // Fetch posts with retries and delay
  fetchPosts(3, 2000, postQuery, client)
    .then((posts) => {
      console.log(`Fetched ${posts.length} posts for user ${username}`);
      // Cache the raw posts JSON
      setToCache(cacheKey, posts);
      // Render the posts
      const postsHtml = renderPosts(posts);
      res.send(postsHtml);
    })
    .catch((error) => {
      console.error(`Error fetching posts for user ${username}:`, error);
      res.status(500).send("Error fetching user's posts");
    });
});


// Placeholder for additional API endpoints

module.exports = router;