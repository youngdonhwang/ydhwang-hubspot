import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

import { router as router } from "./src/routers/r_main.js";
import { router as router_oauth } from "./src/routers/r_oauth.js";
import { router as router_kakao } from "./src/routers/r_kakao.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const { G_PORT } = process.env;

//bodyParser 잘 이용해야 됨
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.set("view engine", "ejs");
app.set("views", __dirname + "/src/views");
app.use("/static", express.static(__dirname + "/src/static"));
app.use("/img", express.static(__dirname + "/src/static/img"));
app.use(express.static(__dirname + "/templates"));

app.use("/", router);
app.use("/", router_oauth);
app.use("/kakao", router_kakao);

app.get("*", (req, res) => {
  res.redirect("/");
});

app.listen(G_PORT, () => {
  console.log(`web on port ${G_PORT}...`);
});
