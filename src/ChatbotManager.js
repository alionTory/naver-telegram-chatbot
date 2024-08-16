const DBManager = require('./DBManager');
const globalVariables = require('./GlobalVariables');

let apiUrl = null;

function getApiUrl() {
    if (!apiUrl) {
        apiUrl = "https://api.telegram.org/bot" + DBManager.getEnvironmentVariable("CHATBOT_API_TOKEN");
    }
    return apiUrl;
}

async function setWebhook(urlPath) {
    let webhookUrl = globalVariables.appURL + urlPath;
    console.log("Setting webhook to " + webhookUrl);
    return fetch(getApiUrl() + "/setWebhook", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ["my_chat_member"],
            secret_token: DBManager.getEnvironmentVariable("CHATBOT_WEBHOOK_TOKEN")
        }),
    });
}

async function deleteWebhook() {
    return fetch(getApiUrl() + "/deleteWebhook", {
        method: "GET",
    });
}

function sendMessage(chatroomIdSet, body) {
    console.log("bot sendMessage() body : ");
    console.log(JSON.stringify(body));
    for (let chatroomId of chatroomIdSet) {
        console.log("Sending message to chatroom id: " + chatroomId);
        body.chat_id = chatroomId;
        fetch(getApiUrl() + "/sendMessage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        })
            .then(() => {
                console.log("Message sent successfully to chatroom id: " + chatroomId);
            })
            .catch((error) => {
                console.error("Error occurred sending message to chatroom id: " + chatroomId);
                console.error(error);
            });
    }
}

// 보낼 텍스트를 입력하면 텔레그램 봇에 보낼 request body 형식에 맞게 캡슐화
// 단, chat_id는 설정되지 않은 상태로 리턴. chat_id는 sendMessage()에서 설정됨.
function sendMessageBodyFormmatter(text, previewImgUrl = null) {
    let body = {
        text: text,
        parse_mode: "HTML",
    };

    if (previewImgUrl)
        body.link_preview_options = {url: previewImgUrl};

    return body;
}

module.exports = {
    setWebhook,
    deleteWebhook,
    sendMessage,
    sendMessageBodyFormmatter,
};