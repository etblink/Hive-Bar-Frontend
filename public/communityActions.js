function upvoteWithKeychain(author, permlink) {
    // Checks if Hive Keychain is available
    if (!window.hive_keychain) {
        alert("Hive Keychain is not installed");
        return;
    }
    const voter = localStorage.getItem("hive_username");
    if (!voter) {
        alert("You must be logged in to vote");
        return;
    }
    const weight = 10000; // represents a 100% upvote weight
    // Prepare the vote operation
    const voteOperation = [
        "vote",
        {
            "voter": voter,
            "author": author,
            "permlink": permlink,
            "weight": weight
        }
    ];
    // Perform the voting operation using the Hive Keychain extension
    hive_keychain.requestBroadcast(voter, [voteOperation], "active", function(response) {
        // Handle the response here
        if (response.success) {
            alert("Upvote successful!");
            // Optionally, update the UI here to reflect the successful upvote
        } else {
            alert("Upvote failed: " + response.message);
        }
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const loginButton = document.getElementById("loginButton");
    const logoutButton = document.getElementById("logoutButton");
    function checkLoginState() {
      if (localStorage.getItem("hive_username")) {
        loginButton.style.display = "none";
        logoutButton.style.display = "block";
      } else {
        loginButton.style.display = "block";
        logoutButton.style.display = "none";
      }
    }
    function handleLogout() {
      localStorage.removeItem("hive_username");
      checkLoginState();
    }

  checkLoginState(); // Check login state when the page loads

  loginButton.addEventListener("click", function () {
    if (window.hive_keychain) {
      const username = prompt("Please enter your Hive username:");
      if (username) {
        hive_keychain.requestSignBuffer(
          username,
          JSON.stringify({ time: Date.now() }),
          "Posting",
          function (response) {
            console.log(response);
            if (response.success) {
              alert("Login successful");
              localStorage.setItem("hive_username", username); // Save the username in localStorage
              checkLoginState();
            } else {
              alert("Login failed: " + response.message);
            }
          },
        );
      } else {
        alert("Username is required to login.");
      }
    } else {
      alert("Hive Keychain extension is not installed or not unlocked.");
    }
  });
  logoutButton.addEventListener("click", handleLogout);

});

document.body.addEventListener('htmx:responseError', function(event) {
  if (event.target.id === 'posts') {
    document.getElementById('error-message').style.display = 'block';
  }
});