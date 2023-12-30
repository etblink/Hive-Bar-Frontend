const express = require("express");
const { Client } = require("@hiveio/dhive");
const { DefaultRenderer } = require("@hiveio/content-renderer");
const app = express();
const port = 3000;

// Initialize Hive blockchain client with extended fallback APIs
const client = new Client([
  "https://api.hive.blog",
  "https://api.openhive.network",
  "https://hived.privex.io",
  "https://hive-api.arcange.eu",
  "https://anyx.io",
  "https://api.hive-engine.com",
]);

const renderer = new DefaultRenderer({
  baseUrl: "https://hive.blog/",
  breaks: true,
  skipSanitization: false,
  allowInsecureScriptTags: false,
  addNofollowToLinks: true,
  doNotShowImages: false,
  ipfsPrefix: "",
  assetsWidth: 640,
  assetsHeight: 480,
  imageProxyFn: (url) => url,
  usertagUrlFn: (account) => "/@" + account,
  hashtagUrlFn: (hashtag) => "/trending/" + hashtag,
  isLinkSafeFn: (url) => true,
});

// General request logging
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Serve static files from the 'public' directory
app.use(express.static("public"));

// Function to perform retries with a delay
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
// Function to fetch posts with retries
function fetchPosts(retries, delayMs, query) {
  let attempt = 1;
  function attemptFetch(resolve, reject) {
    client.database.getDiscussions("created", query)
      .then(posts => resolve(posts))
      .catch(error => {
        console.error(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt === retries) {
          reject(error);
        } else {
          attempt++;
          delay(delayMs).then(() => {
            console.log(`Retrying... (${attempt} out of ${retries})`);
            attemptFetch(resolve, reject);
          });
        }
      });
  }
  return new Promise(attemptFetch);
}

// Function to parse JSON metadata
function parseMetadata(jsonMetadata) {
  try {
    return JSON.parse(jsonMetadata);
  } catch (e) {
    console.error("Error parsing json_metadata", e);
    return {}; // Return an empty object if parsing fails
  }
}

// Define a route to fetch posts from the Hive community and return as HTML
app.get("/community/posts/", (req, res) => {
  console.log("Fetching posts...");
  const postQuery = {
    tag: "hive-167922",
    limit: 2,
  };
  const retries = 3; // Number of attempts to fetch posts before giving up
  const retryDelay = 2000; // Delay between retries in milliseconds
  // Use the fetchPosts function with our defined retries and delay
  fetchPosts(retries, retryDelay, postQuery)
    .then(posts => {
      console.log(`Fetched ${posts.length} posts`);
      // Convert the posts to HTML
      let postsHtml = posts
      .map((post) => {
        const metadata = parseMetadata(post.json_metadata);
        let description = metadata.description || "No description available"
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
      // Send the HTML as a response
      res.send(postsHtml);
    })
    .catch(error => {
      console.error("Error fetching posts:", error);
      res.status(500).send("Error fetching posts from Hive community");
    });
});

// Define a route to serve individual post pages
app.get("/:postCategory/@:username/:postTitle", (req, res) => {
  // Extract parameters from the URL
  const { username, postTitle, postCategory } = req.params;
  console.log("Fetching individual post...");
  // Fetch the post data
  client.database.call('get_content', [username, postTitle])
    .then(post => {
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
      // Send the rendered HTML as the response
      res.send(html);
    })
    .catch(error => {
      console.error("Error fetching the individual post:", error);
      res.status(500).send("Error fetching the individual post from Hive community");
    });
});
// Helper function to escape HTML to prevent XSS
function escapeHTML(unsafeString) {
  return unsafeString.replace(/[&<"'>/]/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
    "'": '&#39;', '/': '&#x2F;'
  })[m]);
}

// Endpoint to display a user's profile
app.get("/@:username", (req, res) => {
  const username = req.params.username;

  console.log(`Fetching profile for ${username}...`); // Log #6: Endpoint for user profile hit

  client.database.call("get_accounts", [[username]])
    .then(accounts => {
      const account = accounts[0];

      if (!account) {
        return res.status(404).send("User profile not found");
      }

      const postingMetadata = JSON.parse(account.posting_json_metadata);
      const { profile } = postingMetadata;

      const headerHtml = `
        <head>
        <style>
          body {
              font-family: Arial, sans-serif;
          }

          header {
              background-color: #333;
              color: #fff;
              padding: 10px 0;
              text-align: center;
          }

          nav a {
              color: #fff;
              text-decoration: none;
              padding: 0 10px;
          }

          nav a:hover {
              text-decoration: underline;
          }
        </style>
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

      res.send(profileHtml);
    })
    .catch(error => {
      console.error("Error fetching user profile:", error); // Log #7: Error details while fetching user profile
      res.status(500).send("Error fetching user profile from Hive community");
    });
});

// Placeholder for additional API endpoints

// Start the server and listen on the specified port
app
.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
})
.setTimeout(600000);
