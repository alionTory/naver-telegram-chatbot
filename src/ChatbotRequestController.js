// 챗봇의 webhook 기능을 통해, 챗봇이 채팅방에 입장 or 퇴장할 때마다 애플리케이션이 요청을 받음.

const URLMapper = require('./urlMapper').getInstance();
const ChatRoomListManager = require('./ChatRoomListManager');
const DBManager = require('./DBManager');

async function initURLMapper() {
    // 챗봇 webhook를 통해 챗봇이 채팅방에 입장, 탈퇴할 때마다 애플리케이션에 알림
    // 아래의 path에서 챗봇의 알림 request를 처리하여 애플리케이션의 DB를 업데이트
    URLMapper.addPath('/chatbotUpdate', async function (request) {
        if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== DBManager.getEnvironmentVariable("CHATBOT_WEBHOOK_TOKEN"))
            return new Response("401 Unauthorized", { status: 401 });

        console.log("getting chatbot update request");

        const body = await request.json();
        console.log("chatbotUpdate body: ");
        console.log(body);

        const chatroomId = body.my_chat_member.chat.id;
        const chatroomTitle = body.my_chat_member.chat.title ?? "";
        const status = body.my_chat_member.new_chat_member.status;

        if (status === "member") {
            await ChatRoomListManager.addChatRoom(chatroomId, chatroomTitle);
        }
        else if (status === "left") {
            await ChatRoomListManager.deleteChatRoom(chatroomId);
        }

        return new Response("success", { status: 200 });
    }, "POST");
}

module.exports = { initURLMapper };