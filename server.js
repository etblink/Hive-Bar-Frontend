// server.js
module.exports.start = (app, port) => {
  app
    .listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    })
    .setTimeout(600000);
};
