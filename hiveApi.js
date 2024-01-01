const { client, renderer } = require("./hiveClient");
const { fetchPosts, escapeHTML } = require("./utils");
const { setToCache } = require("./cacheUtils"); // Use setToCache from cacheUtils
const { renderPosts } = require("./renderUtils"); // Use renderPosts from renderUtils

// fetchIndividualPost - Fetches an individual post using the Hive client
function fetchIndividualPost(username, postSlug) {
  return client.database.call('get_content', [username, postSlug])
    .then(post => post)
    .catch(error => {
      throw new Error('Error fetching the individual post:', error);
    });
}

// fetchUserProfile - Fetches the user profile using the Hive client
function fetchUserProfile(username) {
  return client.database.call('get_accounts', [[username]])
    .then(accounts => accounts.length > 0 ? accounts[0] : null)
    .catch(error => {
      throw new Error('Error fetching user profile:', error);
    });
}

// fetchUserPosts - Fetches posts for a specific user using the Hive client
function fetchUserPosts(username, limit = 5) {
  const postQuery = { tag: username, limit };
  return fetchPosts(3, 2000, postQuery, client)
    .then(posts => posts)
    .catch(error => {
      throw new Error(`Error fetching posts for user ${username}:`, error);
    });
}

module.exports = { fetchIndividualPost, fetchUserProfile, fetchUserPosts };
