import express from "express";
import "dotenv/config";
import axios from "axios";
import { check_apikey } from "../controllers/c_check.js";

const router = express.Router();

/*******************************************************************
  HubSpot : WSEKOREA-KAKAO
  CRM card : Data fetch URL
*******************************************************************/
router.get("/main", async (req, res) => {
  try {
    const { G_BASE_URL, G_APP_API_KEY } = process.env;
    let { hs_object_id, phone, mobilephone } = req.query;

    if (mobilephone) {
      phone = mobilephone.replaceAll("-", "").replace("+82", "0");
    } else if (phone) {
      phone = phone.replaceAll("-", "").replace("+82", "0");
    } else {
      phone = "";
    }

    const sms_url = `${G_BASE_URL}/kakao/sms/${hs_object_id}?apikey=${G_APP_API_KEY}`;
    const alim_url = `${G_BASE_URL}/kakao/alim/${hs_object_id}?apikey=${G_APP_API_KEY}&phone=${phone}`;
    const chingu_url = `${G_BASE_URL}/kakao/chingu/${hs_object_id}?apikey=${G_APP_API_KEY}&phone=${phone}`;

    const t = "IFRAME";
    const w = 890;
    const h = 748;

    const data = {
      results: [
        {
          objectId: 245,
          title: "SMS,알림톡,친구톡",
          priority: "HIGH",
          actions: [
            { type: t, width: w, height: h, uri: sms_url, label: "SMS", associatedObjectProperties: [] },
            { type: t, width: w, height: h, uri: alim_url, label: "알림톡", associatedObjectProperties: [] },
            { type: t, width: w, height: h, uri: chingu_url, label: "친구톡", associatedObjectProperties: [] },
          ],
        },
      ],
    };

    res.send(data);
  } catch (e) {
    console.error(e);
    res.status(500).send("Internal Server Error");
  }
});

/*******************************************************************
  GET
*******************************************************************/
/* SMS 화면 */
router.get("/sms/:hs_object_id", async (req, res) => {
  try {
    const { apikey, phone } = req.query;
    // const hs_object_id = req.params.hs_object_id;

    if (check_apikey(apikey)) return res.render("index.ejs", { domain: process.env.G_DOMAIN });

    res.render("sms-send.ejs", { phone: phone });
  } catch (err) {
    console.log(err);
  }
});

/* 알림톡 화면 */
router.get("/alim/:hs_object_id", async (req, res) => {
  try {
    const { apikey, phone } = req.query;
    // const hs_object_id = req.params.hs_object_id;

    if (check_apikey(apikey)) return res.render("index.ejs", { domain: process.env.G_DOMAIN });

    const alim = await getTempList("alim");

    res.render("kakao-alim.ejs", { alim: alim, phone: phone });
  } catch (err) {}
});

/* 친구톡 화면 */
router.get("/chingu/:hs_object_id", async (req, res) => {
  try {
    const { apikey, phone } = req.query;
    // const hs_object_id = req.params.hs_object_id;

    if (check_apikey(apikey)) return res.render("index.ejs", { domain: process.env.G_DOMAIN });

    const chingu = await getTempList("chingu");

    res.render("kakao-chingu.ejs", { chingu: chingu, phone: phone });
  } catch (err) {}
});

/*******************************************************************
  POST
*******************************************************************/
/* WorkFlow 알림톡 템플릿 List */
router.post("/dataUrl_alimtalk", async (req, res) => {
  try {
    const alim = await getTempList("alim");
    const results = {};
    for (const a of alim) {
      results[a.name] = a.keycode;
    }

    res.send({ options: { select: results } });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* WorkFlow 친구톡 템플릿 List */
router.post("/dataUrl", async (req, res) => {
  try {
    const chingu = await getTempList("chingu");
    const results = {};
    for (const a of chingu) {
      results[a.name] = a.keycode;
    }

    res.send({ options: { select: results } });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* WorkFlow SMS 전송 */
router.post("/webhook_sms", async (req, res) => {
  try {
    const { G_FUNSMS_API_ID, G_FUNSMS_API_KEY, G_HUBSPOT_API_KEY } = process.env;

    const { sender_number, receiver_number, message, image_url } = req.body.fields;

    // 발신번호
    const sendNumber = String(sender_number).trim().replaceAll("-", "").replace("+82", "0");

    // 수신번호
    const rcvNumber = String(receiver_number).trim().replaceAll("-", "").replace("+82", "0");

    const data = {
      accountType: "M",
      id: G_FUNSMS_API_ID,
      apiKey: G_FUNSMS_API_KEY,
      // subject: "",
      msg: message,
      callNumber: sendNumber,
      recvData: [{ recvNumber: rcvNumber }],
    };

    let url, base64Img;
    if (image_url) {
      try {
        const resImg = await axios.get(image_url, { responseType: "arraybuffer" });
        base64Img = Buffer.from(resImg.data, "binary").toString("base64");
      } catch (error) {
        base64Img = "";
      }
    }

    if (base64Img) {
      url = "https://api.funsms.kr/v3/biz/mms";
      data["imgData"] = [{ imgFile: base64Img }];
    } else {
      url = "https://api.funsms.kr/v3/biz/lms";
    }

    const results = await axios.post(url, data);

    if (results.data.code === "0") {
      const hs_object_id = req.body.object.objectId;
      const headers = {
        "Content-type": "application/json",
        Authorization: "Bearer " + G_HUBSPOT_API_KEY,
      };

      const hs_note = `Message Type: SMS</br>Message: ${message}</br>Receiver Number: ${rcvNumber} ${
        image_url ? `</br>Img Url: ${image_url}` : ""
      }`;
      const note = {
        engagement: {
          active: true,
          // ownerId: 1,
          type: "NOTE",
        },
        associations: {
          contactIds: [hs_object_id],
          companyIds: [],
          dealIds: [],
          ownerIds: [],
          ticketIds: [],
        },
        attachments: [],
        metadata: {
          body: hs_note,
        },
      };

      await axios.post("https://api.hubapi.com/engagements/v1/engagements", note, { headers: headers });
    }

    res.send(results.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* WorkFlow 알림톡 전송 */
router.post("/webhook_alimtalk", async (req, res) => {
  try {
    const { G_FUNSMS_API_ID, G_FUNSMS_API_KEY, G_HUBSPOT_API_KEY } = process.env;

    const { select, receiver_number, custom_properties } = req.body.fields;
    const { senderKey, tempCode } = JSON.parse(select);

    const alim = await getTempList("alim");

    // 수신번호
    const rcvNumber = String(receiver_number).trim().replaceAll("-", "").replace("+82", "0");

    // 템플릿 메시지
    let tempContent = alim.filter((a) => a.keycode === select)[0].tempContent;

    if (custom_properties) {
      const properties = custom_properties.split(",");

      // #{} 값 치환
      for (const a of properties) {
        tempContent = tempContent.replace(/#{([^}]+)}/, a);
      }
    }

    const data = {
      accountType: "M", // 계정 유형 (M:운영자, S:부운영자
      id: G_FUNSMS_API_ID, // 아이디
      apiKey: G_FUNSMS_API_KEY, // API 발급 키
      senderKey: senderKey, // 발신 프로필 키
      tempCode: tempCode, // 템플릿 코드
      recvData: [
        {
          tempContent: tempContent, // 템플릿 내용 (1000bytes 이하)
          recvNumber: rcvNumber, // 수신자 전화번호 (‘-‘ 제외한 숫자)
        },
      ],
    };
    // console.log(data);

    const results = await axios.post("https://api.funsms.kr/v3/kakao/kat", data);
    // console.log(results.data);

    if (results.data.code === "0") {
      const hs_object_id = req.body.object.objectId;
      const headers = {
        "Content-type": "application/json",
        Authorization: "Bearer " + G_HUBSPOT_API_KEY,
      };

      const templateName = alim.filter((a) => a.keycode === select)[0].name;
      const hs_note = `Message Type: AlimTalk</br>Template: ${templateName}</br>Message: ${tempContent}</br>Receiver Number: ${rcvNumber}`;
      const note = {
        engagement: {
          active: true,
          // ownerId: 1,
          type: "NOTE",
        },
        associations: {
          contactIds: [hs_object_id],
          companyIds: [],
          dealIds: [],
          ownerIds: [],
          ticketIds: [],
        },
        attachments: [],
        metadata: {
          body: hs_note,
        },
      };

      await axios.post("https://api.hubapi.com/engagements/v1/engagements", note, { headers: headers });
    }

    res.send(results.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* WorkFlow 친구톡 전송 */
router.post("/webhook", async (req, res) => {
  try {
    const { G_FUNSMS_API_ID, G_FUNSMS_API_KEY, G_HUBSPOT_API_KEY } = process.env;

    const { select, receiver_number, custom_properties, message } = req.body.fields;
    const { senderKey, tempCode } = JSON.parse(select);

    const chingu = await getTempList("chingu");

    // 수신번호
    const rcvNumber = String(receiver_number).trim().replaceAll("-", "").replace("+82", "0");

    // 템플릿 메시지
    let tempContent;
    if (tempCode) {
      tempContent = chingu.filter((a) => a.keycode === select)[0].tempContent;

      if (custom_properties) {
        const properties = custom_properties.split(",");

        // #{} 값 치환
        for (const a of properties) {
          tempContent = tempContent.replace(/#{([^}]+)}/, a);
        }
      }
    } else {
      tempContent = message;
    }

    const data = {
      accountType: "M", // 계정 유형 (M:운영자, S:부운영자
      id: G_FUNSMS_API_ID, // 아이디
      apiKey: G_FUNSMS_API_KEY, // API 발급 키
      senderKey: senderKey, // 발신 프로필 키
      // tempCode: , // 템플릿 코드
      recvData: [
        {
          tempContent: tempContent, // 템플릿 내용 (1000bytes 이하)
          recvNumber: rcvNumber, // 수신자 전화번호 (‘-‘ 제외한 숫자)
        },
      ],
    };

    if (tempCode) {
      data["tempCode"] = tempCode;
    }
    // console.log(data);

    const results = await axios.post("https://api.funsms.kr/v3/kakao/kftt", data);
    // console.log(results.data);

    if (results.data.code === "0") {
      const hs_object_id = req.body.object.objectId;
      const headers = {
        "Content-type": "application/json",
        Authorization: "Bearer " + G_HUBSPOT_API_KEY,
      };

      const templateName = chingu.filter((a) => a.keycode === select)[0].name;
      const hs_note = `Message Type: ChinguTalk</br>Template: ${templateName}</br>Message: ${tempContent}</br>Receiver Number: ${rcvNumber}`;
      const note = {
        engagement: {
          active: true,
          // ownerId: 1,
          type: "NOTE",
        },
        associations: {
          contactIds: [hs_object_id],
          companyIds: [],
          dealIds: [],
          ownerIds: [],
          ticketIds: [],
        },
        attachments: [],
        metadata: {
          body: hs_note,
        },
      };

      await axios.post("https://api.hubapi.com/engagements/v1/engagements", note, { headers: headers });
    }
    res.send(results.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* SMS 전송 */
router.post("/sms/:hs_object_id", async (req, res) => {
  try {
    const { G_FUNSMS_API_ID, G_FUNSMS_API_KEY, G_HUBSPOT_API_KEY } = process.env;

    const hs_object_id = req.params.hs_object_id;

    const { sendNum, receiveNum1, messageContents, select_type, img_url } = req.body;

    const data = {
      accountType: "M",
      id: G_FUNSMS_API_ID,
      apiKey: G_FUNSMS_API_KEY,
      // subject: "",
      msg: messageContents,
      callNumber: sendNum,
      recvData: [{ recvNumber: receiveNum1 }],
    };

    let url, base64Img;
    if (select_type === "img_type" && img_url) {
      try {
        const resImg = await axios.get(img_url, { responseType: "arraybuffer" });
        base64Img = Buffer.from(resImg.data, "binary").toString("base64");
      } catch (error) {
        base64Img = "";
      }
    }

    if (base64Img) {
      url = "https://api.funsms.kr/v3/biz/mms";
      data["imgData"] = [{ imgFile: base64Img }];
    } else {
      url = "https://api.funsms.kr/v3/biz/lms";
    }

    const results = await axios.post(url, data);

    if (results.data.code === "0" && hs_object_id !== "undefined") {
      const headers = {
        "Content-type": "application/json",
        Authorization: "Bearer " + G_HUBSPOT_API_KEY,
      };

      const hs_note = `Message Type: SMS</br>Message: ${messageContents}</br>Receiver Number: ${receiveNum1} ${
        img_url ? `</br>Img Url: ${img_url}` : ""
      }`;
      const note = {
        engagement: {
          active: true,
          // ownerId: 1,
          type: "NOTE",
        },
        associations: {
          contactIds: [hs_object_id],
          companyIds: [],
          dealIds: [],
          ownerIds: [],
          ticketIds: [],
        },
        attachments: [],
        metadata: {
          body: hs_note,
        },
      };

      await axios.post("https://api.hubapi.com/engagements/v1/engagements", note, { headers: headers });
    }

    res.send(results.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* 알림톡 전송 */
router.post("/alim/:hs_object_id", async (req, res) => {
  try {
    const { G_FUNSMS_API_ID, G_FUNSMS_API_KEY, G_HUBSPOT_API_KEY } = process.env;

    const hs_object_id = req.params.hs_object_id;

    const { keycode, receiveNum1, tempContent } = req.body;
    const { senderKey, tempCode } = JSON.parse(keycode);

    const data = {
      accountType: "M", // 계정 유형 (M:운영자, S:부운영자
      id: G_FUNSMS_API_ID, // 아이디
      apiKey: G_FUNSMS_API_KEY, // API 발급 키
      senderKey: senderKey, // 발신 프로필 키
      tempCode: tempCode, // 템플릿 코드
      recvData: [
        {
          tempContent: tempContent, // 템플릿 내용 (1000bytes 이하)
          recvNumber: receiveNum1, // 수신자 전화번호 (‘-‘ 제외한 숫자)
        },
      ],
    };

    const results = await axios.post("https://api.funsms.kr/v3/kakao/kat", data);

    if (results.data.code === "0" && hs_object_id !== "undefined") {
      const headers = {
        "Content-type": "application/json",
        Authorization: "Bearer " + G_HUBSPOT_API_KEY,
      };

      const alim = await getTempList("alim");
      const templateName = alim.filter((a) => a.keycode === keycode)[0].name;
      const hs_note = `Message Type: AlimTalk</br>Template: ${templateName}</br>Message: ${tempContent}</br>Receiver Number: ${receiveNum1}`;
      const note = {
        engagement: {
          active: true,
          // ownerId: 1,
          type: "NOTE",
        },
        associations: {
          contactIds: [hs_object_id],
          companyIds: [],
          dealIds: [],
          ownerIds: [],
          ticketIds: [],
        },
        attachments: [],
        metadata: {
          body: hs_note,
        },
      };

      await axios.post("https://api.hubapi.com/engagements/v1/engagements", note, { headers: headers });
    }

    res.send(results.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/* 친구톡 전송 */
router.post("/chingu/:hs_object_id", async (req, res) => {
  try {
    const { G_FUNSMS_API_ID, G_FUNSMS_API_KEY, G_HUBSPOT_API_KEY } = process.env;

    const hs_object_id = req.params.hs_object_id;

    const { keycode, receiveNum1, tempContent } = req.body;
    const { senderKey, tempCode } = JSON.parse(keycode);

    const data = {
      accountType: "M", // 계정 유형 (M:운영자, S:부운영자
      id: G_FUNSMS_API_ID, // 아이디
      apiKey: G_FUNSMS_API_KEY, // API 발급 키
      senderKey: senderKey, // 발신 프로필 키
      // tempCode: "", // 템플릿 코드
      recvData: [
        {
          tempContent: tempContent, // 템플릿 내용 (1000bytes 이하)
          recvNumber: receiveNum1, // 수신자 전화번호 (‘-‘ 제외한 숫자)
        },
      ],
    };

    if (tempCode) {
      data["tempCode"] = tempCode;
    }

    const results = await axios.post("https://api.funsms.kr/v3/kakao/kftt", data);

    if (results.data.code === "0" && hs_object_id !== "undefined") {
      const headers = {
        "Content-type": "application/json",
        Authorization: "Bearer " + G_HUBSPOT_API_KEY,
      };

      const chingu = await getTempList("chingu");
      const templateName = chingu.filter((a) => a.keycode === keycode)[0].name;
      const hs_note = `Message Type: ChinguTalk</br>Template: ${templateName}</br>Message: ${tempContent}</br>Receiver Number: ${receiveNum1}`;
      const note = {
        engagement: {
          active: true,
          // ownerId: 1,
          type: "NOTE",
        },
        associations: {
          contactIds: [hs_object_id],
          companyIds: [],
          dealIds: [],
          ownerIds: [],
          ticketIds: [],
        },
        attachments: [],
        metadata: {
          body: hs_note,
        },
      };

      await axios.post("https://api.hubapi.com/engagements/v1/engagements", note, { headers: headers });
    }
    res.send(results.data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

async function getTempList(mode) {
  const { G_FUNSMS_API_ID, G_FUNSMS_API_KEY } = process.env;

  const tempList = [];
  const uuids = {};
  // const apis = [];
  const data = {
    accountType: "M",
    id: G_FUNSMS_API_ID,
    apiKey: G_FUNSMS_API_KEY,
  };

  /* 발신프로필 조회 */
  try {
    const profiles = await axios.post("https://api.funsms.kr/v3/kakao/profile", data);
    for (const profile of profiles.data.data) {
      const { uuid, senderKey } = profile;

      uuids[senderKey] = uuid;

      if (mode === "chingu") {
        tempList.push({
          name: `${uuid} : 직접입력`,
          keycode: JSON.stringify({
            senderKey: senderKey,
            tempCode: "",
          }),
          templateMsg: "",
        });
      }

      /* 템플릿 목록 조회 */
      try {
        const templates = await axios.post("https://api.funsms.kr/v3/kakao/template", {
          ...data,
          senderKey: senderKey,
        });
        for (const template of templates.data.data) {
          if (template.tempStatus !== "APR") continue;

          /* 템플릿 목록 상세조회 */
          try {
            const templateDetail = await axios.post("https://api.funsms.kr/v3/kakao/template_detail", {
              ...data,
              senderKey: senderKey,
              tempCode: template.tempCode,
            });

            tempList.push({
              name: `${uuids[senderKey]} : ${templateDetail.data.data.tempName}`,
              keycode: JSON.stringify({
                senderKey: senderKey,
                tempCode: templateDetail.data.data.tempCode,
              }),
              tempContent: templateDetail.data.data.tempContent,
            });
          } catch (e) {
            console.log(`error at v3/kakao/template_detail\ntempCode: ${tempCode}\nmsg: ${e.message}`);
            continue;
          }
        }
      } catch (e) {
        console.log(`error at v3/kakao/template\n msg: ${e.message}`);
        continue;
      }
    }

    // console.log(tempList);
    return tempList;
  } catch (e) {
    console.log(`error at v3/kakao/profile\nmsg: ${e.message}`);
    return [];
  }
}

export { router };
