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
async function fetchPosts(retries, delayMs, query) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const posts = await client.database.getDiscussions("created", query);
      return posts;
    } catch (error) {
      console.error(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) throw error;
      await delay(delayMs);
      console.log(`Retrying... (${attempt + 1} out of ${retries})`);
    }
  }
}

// Define a route to fetch posts from the Hive community and return as HTML
app.get("/community/posts/", async (req, res) => {
  console.log("Fetching posts...");
  try {
    const postQuery = {
      tag: "hive-167922",
      limit: 5
    };
    const retries = 3; // Number of attempts to fetch posts before giving up
    const retryDelay = 2000; // Delay between retries in milliseconds
    // Use the fetchPosts function with our defined retries and delay
    const posts = await fetchPosts(retries, retryDelay, postQuery);
    console.log(`Fetched ${posts.length} posts`);

    // Convert the posts to HTML
    let postsHtml = posts
      .map((post) => {
        return `<div class="post">
                    <h2>${post.title}</h2>
                    <p>${post.summary}</p>
                    <a href="/hive-167922/@${post.author}/${post.permlink}">Read more</a>
                    <div class="img-wrapper">
                      <img src="./assets/dislike.svg" alt="Dislike" class="dislike-button">
                    </div>                    
                    <div class="img-wrapper" onclick="upvoteWithKeychain('${post.author}', '${post.permlink}')">
    <img src="./assets/like.svg" alt="Like" class="like-button">
  </div>
</div>`;
      })
      .join("");

    // Send the HTML as a response
      res.send(postsHtml);
        } catch (error) {
            console.error("Error fetching posts:", error);
            res.status(500).send("Error fetching posts from Hive community");
          }
        });

// Endpoint to handle individual post page requests
app.get("/hive-167922/@:username/:postTitle", async (req, res) => {
  const username = req.params.username;
  const postPermlink = req.params.postTitle;
  try {
    const postQuery = {
      tag: username, 
      limit: 1,
      start_author: username,
      start_permlink: postPermlink
    };
    

    
    const posts = await client.database.call('get_content', [username, postPermlink]);

    const renderedBody = renderer.render(posts.body);
    

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

            .post img {
                max-width: 100%;
            }

            .post {
                max-width: 640px;
                margin: auto;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background-color: #f9f9f9;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);                
            }

            main {
                padding: 20px;
                background-color: #efefef;
            }
          </style>
          </head>
          <header>
              <h1>${posts.title}</h1>
              <nav>
                  <a href="/">Home</a>
                  <a href="/community.html">Community</a>
              </nav>
          </header>
      `;
    const postHtml = `
          ${headerHtml}
          <main>
            <div class="post">
                <h2>${posts.title}</h2>
                <a href="/@${posts.author}"><span>${posts.author}</span></a>
                <div>${renderedBody}</div>
            </div>
          </main>
          <footer>
            <p>&copy; 2023 Bar on the Hive - Community</p>
          </footer>
      `;

    res.send(postHtml);
  } catch (error) {
      res.status(500).send("Error fetching the individual post from Hive community");
    }
  });

// Endpoint to display a user's profile
app.get("/@:username", async (req, res) => {
  const username = req.params.username;

  console.log(`Fetching profile for ${username}...`); // Log #6: Endpoint for user profile hit

  try {
    const accounts = await client.database.call("get_accounts", [[username]]);
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
                <a href="/">Home</a>
                <a href="/community.html">Community</a>
            </nav>
        </header>
    `;

    const profileHtml = `
            ${headerHtml}
            <div class="profile">
            <h2>${profile.name}</h2>
            <p>${profile.about}</p>
            <img src="${profile.profile_image}" alt="${profile.name}'s profile image">
        </div>`;

    res.send(profileHtml);
  } catch (error) {
    console.error("Error fetching user profile:", error); // Log #7: Error details while fetching user profile
    res.status(500).send("Error fetching user profile from Hive community");
  }
});

// Placeholder for additional API endpoints

// Start the server and listen on the specified port
app
.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
})
.setTimeout(600000);
