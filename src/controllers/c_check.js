import "dotenv/config";

/* G_APP_API_KEY 체크 */
const check_apikey = (apikey) => process.env.G_APP_API_KEY !== apikey;

export { check_apikey };
