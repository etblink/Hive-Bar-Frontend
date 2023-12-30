# 4th Street Bar on the Hive
Welcome to the 4th Street Bar on the Hive web application! This project creates an online community platform hosted on the Hive blockchain, where users can interact, share posts, and engage with content. Employing HTMX, we've enabled seamless user interactions with dynamic content loading, thus enhancing the user experience without writing complex JavaScript. The application leverages Hive's blockchain technology to fetch and display community posts, user profiles, and individual post details and integrate upvote functionality through the Hive Keychain extension.

## Features
- **Dynamic Content Loading**: Utilizing HTMX to enrich the web pages by loading new or updated content without a full page refresh.
- **Responsive UI**: Crafting a better readability and ease of use across various devices.
- **Hive Blockchain Integration**: Fetch and display the latest posts from the Hive community in a user-friendly web layout.

### Additional Features
- Retrieve and present individual user profiles with information from the Hive blockchain.
- Render individual blog posts authored by users within the Hive community.
- Integrated with Hive Keychain for secure and decentralized interactions.

## HTMX Integration
HTMX is used in this project to effortlessly implement AJAX, WebSocket, and Server Sent Events functionalities which have been traditionally done with JavaScript. With HTMX, you can, for instance, load, submit, and update parts of your web pages directly from HTML markup. In this application, HTMX handles dynamic content loading when users view community posts, facilitating a smooth user experience without full page reloads.

## Getting Started

Before you can run the project, you'll need to have Node.js installed on your system.

### Installation

1. Clone the repository to your local machine:
```shell
git clone https://github.com/your-repository/4th-street-bar-hive.git
```

2. Navigate to the project directory:
```shell
cd 4th-street-bar-hive
```

3. Install the necessary Node.js dependencies:
```shell
npm install
```

4. Start the server:
```shell
npm start
```

The application should now be running on [http://localhost:3000](http://localhost:3000).

## Usage

The application provides the following endpoints:

- `GET /community/posts/`: Fetches a list of the latest posts from the Hive community.
- `GET /@:username`: Retrieves a user's profile using their Hive username.
- `GET /:postCategory/@:username/:postTitle`: Displays an individual post page based on the given category, author, and title.

Navigate to these routes in your web browser to interact with the Hive community content.

## Dependencies

This project uses the following Node.js modules:

- `@hiveio/dhive`: A client library for the Hive blockchain.
- `@hiveio/content-renderer`: Renders Hive's markdown content to HTML.
- `express`: A web application framework for creating server-side applications.

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check ([issues page](https://github.com/etblink/Hive-Bar-Frontend/issues)) if you want to contribute.

## License

Distributed under the ISC License. See `LICENSE` for more information.

## Contact

For any comments or questions, please reach out through the repository's issue tracker or directly reach out to the maintainer's email.

## Acknowledgments

- Hive Community for providing the blockchain platform.
- Node.js community for packages and tools that made this project possible.

