import express from "express";
import axios from "axios";
import "dotenv/config";
import { check_apikey } from "../controllers/c_check.js";

const router = express.Router();

router.get("/point-check", async (req, res) => {
  try {
    const { apikey } = req.query;
    if (check_apikey(apikey)) return res.render("index.ejs", { domain: process.env.G_DOMAIN });

    const { G_FUNSMS_API_ID, G_FUNSMS_API_KEY } = process.env;
    const url = "https://funsms.kr/API/v2/member/getPoint.php";

    const requestBody = {
      id: G_FUNSMS_API_ID,
      apiKey: G_FUNSMS_API_KEY,
    };

    const results = await axios.post(url, requestBody);

    res.render("response.ejs", results.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

export { router };
