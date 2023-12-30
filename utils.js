// Function to perform retries with a delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Function to fetch posts with retries
function fetchPosts(retries, delayMs, query, client) {
  let attempt = 1;
  function attemptFetch(resolve, reject) {
    client.database
      .getDiscussions("created", query)
      .then((posts) => resolve(posts))
      .catch((error) => {
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

// Helper function to escape HTML to prevent XSS
function escapeHTML(unsafeString) {
  return unsafeString.replace(
    /[&<"'>/]/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
        "/": "&#x2F;",
      })[m],
  );
}

module.exports = { delay, fetchPosts, parseMetadata, escapeHTML };