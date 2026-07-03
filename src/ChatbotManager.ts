import * as DBManager from './DBManager';

function getApiUrl() {
    let apiUrl = DBManager.getStringCacheSync("telegram-api-url");
    if (!apiUrl) {
        apiUrl = "https://api.telegram.org/bot" + DBManager.env().CHATBOT_API_TOKEN;
        DBManager.setStringCacheSync("telegram-api-url", apiUrl);
    }
    return apiUrl;
}

async function setWebhook(urlPath: string) {
    const webhookUrl = DBManager.env().WORKER_APP_URL + urlPath;
    console.log("Setting webhook to " + webhookUrl);
    return fetch(getApiUrl() + "/setWebhook", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            url: webhookUrl,
            allowed_updates: ["my_chat_member"],
            secret_token: DBManager.env().CHATBOT_WEBHOOK_TOKEN
        }),
    });
}

async function deleteWebhook() {
    return fetch(getApiUrl() + "/deleteWebhook", {
        method: "GET",
    });
}

type SendMessageBody = {
    chat_id?: number | string;
    text: string;
    parse_mode?: "HTML" | "MarkdownV2" | "Markdown";
    link_preview_options?: {
        url: string;
    };
}

async function sendMessage(chatroomIdSet: Set<string>, body: SendMessageBody) {
    console.log("bot sendMessage() body : ");
    console.log(JSON.stringify(body));
    for (let chatroomId of chatroomIdSet) {
        console.log("Sending message to chatroom id: " + chatroomId);
        body.chat_id = chatroomId;
        try {
            const response = await fetch(getApiUrl() + "/sendMessage", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            console.log("Message sent to chatroom id: " + chatroomId);
            console.log("Response status: " + response.status);
            console.log("Response body: " + await response.text());
        } catch (error) {
            console.error("Error occurred sending message to chatroom id: " + chatroomId);
            console.error(error);
        }
    }
}

// 보낼 텍스트를 입력하면 텔레그램 봇에 보낼 request body 형식에 맞게 캡슐화
// 단, chat_id는 설정되지 않은 상태로 리턴. chat_id는 sendMessage()에서 설정됨.
function sendMessageBodyFormmatter(text: string, previewImgUrl?: string) {
    let body: SendMessageBody = {
        text: text,
        parse_mode: "HTML",
    };

    if (previewImgUrl)
        body.link_preview_options = { url: previewImgUrl };

    return body;
}

export {
    setWebhook,
    deleteWebhook,
    sendMessage,
    sendMessageBodyFormmatter,
};