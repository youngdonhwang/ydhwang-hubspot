import express from "express";
import { Client } from "@hubspot/api-client";
import _ from "lodash";
import "dotenv/config";

const router = express.Router();

let tokenStore = {};
const hubspotClient = new Client();

const { G_HUBSPOT_CLIENT_ID, G_HUBSPOT_CLIENT_SECRET, G_BASE_URL } = process.env

const CLIENT_ID = G_HUBSPOT_CLIENT_ID;
const CLIENT_SECRET = G_HUBSPOT_CLIENT_SECRET;
const SCOPES = 'crm.objects.contacts.read';
const REDIRECT_URI = `${G_BASE_URL}/oauth-callback`;
const GRANT_TYPES = {
  AUTHORIZATION_CODE: "authorization_code",
  REFRESH_TOKEN: "refresh_token",
};

const logResponse = (message, data) => {
  console.log(message, JSON.stringify(data, null, 1));
};

const isAuthorized = () => {
  return !_.isEmpty(tokenStore.refreshToken);
};

const isTokenExpired = () => {
  return Date.now() >= tokenStore.updatedAt + tokenStore.expiresIn * 1000;
};

const refreshToken = async () => {
  const result = await hubspotClient.oauth.tokensApi.create(
    GRANT_TYPES.REFRESH_TOKEN,
    undefined,
    undefined,
    CLIENT_ID,
    CLIENT_SECRET,
    tokenStore.refreshToken
  );
  tokenStore = result;
  tokenStore.updatedAt = Date.now();
  console.log("Updated tokens", tokenStore);

  hubspotClient.setAccessToken(tokenStore.accessToken);
};

router.get("/oauth", async (req, res) => {
  try {
    const authorizationUrl = hubspotClient.oauth.getAuthorizationUrl(
      CLIENT_ID,
      REDIRECT_URI,
      SCOPES,
    );
    console.log("Authorization Url", authorizationUrl);

    res.redirect(authorizationUrl);
  } catch (e) {
    console.error(e);
  }
});

router.get("/oauth-callback", async (req, res) => {
  try {
    const code = _.get(req, "query.code");

    console.log("Retrieving access token by code:", code);
    const getTokensResponse = await hubspotClient.oauth.tokensApi.create(
      GRANT_TYPES.AUTHORIZATION_CODE,
      code,
      REDIRECT_URI,
      CLIENT_ID,
      CLIENT_SECRET
    );

    logResponse("Retrieving access token result:", getTokensResponse);

    tokenStore = getTokensResponse;
    tokenStore.updatedAt = Date.now();

    // Set token for the
    // https://www.npmjs.com/package/@hubspot/api-client
    hubspotClient.setAccessToken(tokenStore.accessToken);

    console.log("tokenStore : " + tokenStore);
    res.redirect("/");
  } catch (e) {
    console.error(e);
  }
});

export { router };
