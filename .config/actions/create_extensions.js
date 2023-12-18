import dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: "../../.env" });

const { G_HUBSPOT_DEV_API_KEY, G_HUBSPOT_APP_ID, G_DOMAIN } = process.env;

/***************************************************************
  extensionList 에 사용할 extension 작성 후 실행.
  hubspot에 extension이 있는지 조회후 없을때만 생성.
***************************************************************/

const url = `https://api.hubapi.com/automationextensions/v1/definitions?hapikey=${G_HUBSPOT_DEV_API_KEY}&applicationId=${G_HUBSPOT_APP_ID}`;
const headers = { "Content-type": "application/json" };

// sms 생성
const create_sms = async () => {
  const payload = {
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

  const results = await axios.post(url, payload, headers);
  console.log(`SMS definitionid : ${results.data.id}`);
}; // sms 생성 끝

// 알림톡 생성
const create_alim = async () => {
  const payload = {
    integrationAppId: G_HUBSPOT_APP_ID,
    extensionName: "알림톡",
    webhookUrl: "https://" + G_DOMAIN + "/kakao/webhook_alimtalk",
    dataUrl: "https://" + G_DOMAIN + "/kakao/dataUrl_alimtalk",
    fieldMetadata: [
      {
        key: "select",
        label: "채널 선택",
        values: [{ allowsMergeTags: false, type: "EXTERNAL_DATA" }],
        fieldType: "SELECT",
        required: true,
      },
      {
        label: "입력 속성",
        key: "custom_properties",
        fieldType: "TEXTAREA",
        values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
        required: false,
      },
      {
        label: "수신자 번호",
        key: "receiver_number",
        fieldType: "TEXT",
        values: [{ type: "STATIC_VALUE", allowsMergeTags: true }],
        required: true,
      },
    ],
  };

  const results = await axios.post(url, payload, headers);
  console.log(`알림톡 definitionid : ${results.data.id}`);
}; // 알림톡 생성 끝

// 친구톡 생성
const create_cingu = async () => {
  const payload = {
    integrationAppId: G_HUBSPOT_APP_ID,
    extensionName: "친구톡",
    webhookUrl: "https://" + G_DOMAIN + "/kakao/webhook",
    dataUrl: "https://" + G_DOMAIN + "/kakao/dataUrl",
    fieldMetadata: [
      {
        key: "select",
        label: "템플릿 선택",
        values: [{ allowsMergeTags: false, type: "EXTERNAL_DATA" }],
        fieldType: "SELECT",
        required: true,
      },
      {
        label: "입력 속성",
        key: "custom_properties",
        fieldType: "TEXTAREA",
        values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
        required: false,
      },
      {
        label: "메시지",
        key: "message",
        fieldType: "TEXTAREA",
        values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
        required: false,
      },
      {
        label: "수신자 번호",
        key: "receiver_number",
        fieldType: "TEXT",
        values: [{ type: "STATIC_VALUE", allowsMergeTags: true }],
        required: true,
      },
      // {
      //   label: "첨부 이미지 URL",
      //   key: "image_url",
      //   fieldType: "TEXT",
      //   values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
      // },
      // {
      //   label: "이미지 링크",
      //   key: "image_hyperlink",
      //   fieldType: "TEXT",
      //   values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
      // },
      // {
      //   label: "버튼 이름",
      //   key: "button_name",
      //   fieldType: "TEXT",
      //   values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
      // },
      // {
      //   label: "버튼 모바일 링크",
      //   key: "button_mobile_link",
      //   fieldType: "TEXT",
      //   values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
      // },
      // {
      //   label: "버튼 PC 링크",
      //   key: "button_pc_link",
      //   fieldType: "TEXT",
      //   values: [{ type: "STATIC_VALUE", allowsMergeTags: false }],
      // },
    ],
  };

  const results = await axios.post(url, payload, headers);
  console.log(`친구톡 definitionid : ${results.data.id}`);
}; // 친구톡 생성 끝

// extension 목록
const extensionList = [
  { type: "sms", extensionName: "SMS", definitionid: undefined, func: create_sms },
  { type: "alim", extensionName: "알림톡", definitionid: undefined, func: create_alim },
  { type: "cingu", extensionName: "친구톡", definitionid: undefined, func: create_cingu },
];

// 조회
const getList = await axios.get(url);

for (const g of getList.data) {
  if (!g.hasOwnProperty("deletedAt")) {
    for (const e of extensionList) {
      if (g.extensionName === e.extensionName) {
        e.definitionid = g.id;
      }
    }
  }
}

// 없는 extension 생성
for (const e of extensionList) {
  if (e.definitionid) {
    console.log(`${e.extensionName} definitionid : ${e.definitionid}`);
  } else {
    console.log(`================ ${e.extensionName} 생성 시작 ================`);
    await e.func();
    console.log(`================ ${e.extensionName} 생성 끝 ================`);
  }
}
