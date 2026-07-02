// 챗봇의 webhook 기능을 통해, 챗봇이 채팅방에 입장 or 퇴장할 때마다 애플리케이션이 요청을 받음.

import { getInstance } from './URLMapper';
const URLMapper = getInstance();
import * as ChatRoomListManager from './ChatRoomListManager';
import * as DBManager from './DBManager';
import * as z from 'zod';

const ChatbotUpdateBody = z.object({
    my_chat_member: z.object({
        chat: z.object({
            id: z.number(),
            title: z.string().optional(),
        }),
        new_chat_member: z.object({
            status: z.string(),
        }),
    }),
});

async function initURLMapper() {
    // 챗봇 webhook를 통해 챗봇이 채팅방에 입장, 탈퇴할 때마다 애플리케이션에 알림
    // 아래의 path에서 챗봇의 알림 request를 처리하여 애플리케이션의 DB를 업데이트
    URLMapper.addPath('/chatbotUpdate', async function (request: Request) {
        if (request.headers.get("X-Telegram-Bot-Api-Secret-Token") !== DBManager.env().CHATBOT_WEBHOOK_TOKEN)
            return new Response("401 Unauthorized", { status: 401 });

        console.log("Getting chatbot update request...");
        const body = await request.json();
        console.log("chatbotUpdate body: ");
        console.log(body);

        console.log("Parsing chatbotUpdate body...");
        const parsedBody = ChatbotUpdateBody.parse(body);


        const chatroomId = parsedBody.my_chat_member.chat.id;
        const chatroomTitle = parsedBody.my_chat_member.chat.title ?? "";
        const status = parsedBody.my_chat_member.new_chat_member.status;

        if (status === "member") {
            await ChatRoomListManager.addChatRoom(String(chatroomId), chatroomTitle);
        }
        else if (status === "left") {
            await ChatRoomListManager.deleteChatRoom(String(chatroomId));
        }

        return new Response("success", { status: 200 });
    }, "POST");
}

export { initURLMapper };