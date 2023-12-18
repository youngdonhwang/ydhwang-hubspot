import dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: "../../.env" });

const { G_HUBSPOT_DEV_API_KEY, G_HUBSPOT_APP_ID } = process.env;

// 조회
const url = `https://api.hubapi.com/automationextensions/v1/definitions?hapikey=${G_HUBSPOT_DEV_API_KEY}&applicationId=${G_HUBSPOT_APP_ID}`;

const results = await axios.get(url);
console.log(results.data);
