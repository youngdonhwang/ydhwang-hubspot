import express from "express";
import "dotenv/config";
import { check_apikey } from "../controllers/c_check.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // if (!isAuthorized()) return res.render('login');
    // if (isTokenExpired()) await refreshToken();
    const { apikey } = req.query;
    if (check_apikey(apikey)) return res.render("index.ejs", { domain: process.env.G_DOMAIN });

    res.render("main.ejs", { apikey: apikey });
  } catch (e) {
    console.error(e);
  }
});

export { router };
