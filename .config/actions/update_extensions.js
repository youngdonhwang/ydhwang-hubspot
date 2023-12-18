import dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: "../../.env" });

const { G_HUBSPOT_DEV_API_KEY, G_HUBSPOT_APP_ID, G_DOMAIN } = process.env;

const definitionid = 167503;
const latestVersion = 0;

// 수정
const url = `https://api.hubapi.com/automationextensions/v1/definitions/${definitionid}?hapikey=${G_HUBSPOT_DEV_API_KEY}&applicationId=${G_HUBSPOT_APP_ID}`;

const payload = {
  id: definitionid,
  latestVersion: latestVersion,
  version: latestVersion + 1,
  integrationAppId: G_HUBSPOT_APP_ID,
  extensionName: "SMS",
  webhookUrl: "https://" + G_DOMAIN + "/kakao/webhook_sms",
  fieldMetadata: [
    {
      label: "발신자 번호",
      key: "sender_number",
      fieldType: "TEXT",
      values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
      required: true,
    },
    {
      label: "수신자 번호",
      key: "receiver_number",
      fieldType: "TEXT",
      values: [{ type: "STATIC_VALUE", allowsMergeTags: true }],
      required: true,
    },
    {
      label: "메세지",
      key: "message",
      fieldType: "TEXTAREA",
      values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
      required: true,
    },
    {
      label: "첨부 이미지 URL",
      key: "image_url",
      fieldType: "TEXT",
      values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
      required: false,
    },
    // {
    //   label: "회사명",
    //   key: "company_name",
    //   fieldType: "TEXT",
    //   values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
    // },
    // {
    //   label: "수신거부",
    //   key: "refusal_number",
    //   fieldType: "TEXT",
    //   values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
    // },
  ],
};

const results = await axios.put(url, payload);
console.log(results.data);
