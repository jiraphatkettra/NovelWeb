const { createServer } = require("http");
const next = require("next");

const dev = false;
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      await handle(req, res);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  server.once("error", (err) => {
    console.error("Server error:", err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Novel & Manga Platform Ready on http://localhost:${port}`);
  });
});
