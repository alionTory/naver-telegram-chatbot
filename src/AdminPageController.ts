import { getInstance } from './URLMapper';
const URLMapper = getInstance();
import * as DBManager from './DBManager';
import * as ChatRoomListManager from './ChatRoomListManager';
import * as cookieModule from 'cookie';
import * as pages from './AdminPages';
import * as ChatbotManager from './ChatbotManager';
import * as CafeRequester from './CafeRequester';
import * as z from 'zod';
import * as AppPeriodicWorkManager from './AppPeriodicWorkManager';

// 서버에서 세션 id를 가져오는 함수
async function getSessionId() {
    const sessionId = await DBManager.get("session-id");
    const sesssionDeadline = await DBManager.get("session-deadline");
    if (sessionId && sesssionDeadline && Date.now() < Number(sesssionDeadline)) {
        return sessionId;
    }
    return null;
}

// 클리이언트가 인증되었는지 쿠키로 확인
async function isClientAuthenticated(request: Request) {
    const cookies = cookieModule.parse(request.headers.get('Cookie') ?? '');
    const clientSessionId = cookies['session-id'];
    const serverSessionId = await getSessionId();
    if (clientSessionId && serverSessionId && clientSessionId === serverSessionId)
        return true;
    return false;
}

// 서버에서 디버그 페이지를 활성화했는지 확인
async function isDebugPageEnabled() {
    const debugPageEnabled = await DBManager.get("debug-page-enabled");
    if (debugPageEnabled === "true")
        return true;
    return false;
}

/**
 * target에 string 타입 key가 존재하면 해당 string 값 반환, 아니면 undefined 반환.
 */
function getStringKey(target: unknown, key: string) {
    const schema = z.object({ [key]: z.string() });
    const result = schema.safeParse(target);
    if (result.success) {
        return result.data[key];
    } else {
        console.log("getStringKey: target does not have string key '" + key + "'.");
        console.log("Zod error message: " + result.error.message);
        return undefined;
    }
}


function initURLMapper() {
    URLMapper.addPath('/admin/authenticate', async function (request) {
        return new Response(pages.authenticatePage, { headers: { 'Content-Type': 'text/html' } });
    });


    URLMapper.addPath('/admin/authenticate', async function (request) {
        const body = await request.json();
        const password = getStringKey(body, "password");

        if (!password)
            return new Response("Invalid request body", { status: 400 });

        if (password === DBManager.env().ADMIN_PAGE_PASSWORD) {
            const sessionId = crypto.randomUUID();
            await DBManager.set("session-id", sessionId);
            await DBManager.set("session-deadline", String(Date.now() + 1000 * 60 * 60));

            const setCookie = cookieModule.serialize('session-id', sessionId, { secure: true, path: '/', sameSite: 'strict', httpOnly: true });
            return new Response("로그인 성공", { status: 200, headers: { 'Set-Cookie': setCookie } });
        }
        return new Response("로그인 실패", { status: 401 });
    }, "POST");


    URLMapper.addPath('/admin', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const currentCafeId = await DBManager.getNumber("cafe-id");
        const currentNoticeMenuId = await DBManager.getNumber("notice-menu-id");
        const currentChatrooms = await ChatRoomListManager.getChatRoomList();
        const activeChatrooms = await ChatRoomListManager.getActiveChatRoomList();
        const chatbotApiToken = DBManager.env().CHATBOT_API_TOKEN;
        const lastArticleTimestamp = await DBManager.getNumber("cafe-article-last-timestamp");
        const pageHTML = pages.getAdminPage(currentCafeId, currentNoticeMenuId, currentChatrooms, activeChatrooms, chatbotApiToken, lastArticleTimestamp);
        return new Response(pageHTML, { headers: { 'Content-Type': 'text/html' } });
    });

    URLMapper.addPath('/admin/cafeId', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const cafeId = getStringKey(body, "cafeId");
        if (!cafeId)
            return new Response("Invalid request body", { status: 400 });

        const cafeCode = await CafeRequester.requestCafeCode(cafeId);

        // 카페 id가 달라졌을 경우, 저장된 최근 게시글 타임스탬프 정보 수정
        if (cafeId !== await DBManager.get("cafe-id"))
            await DBManager.set("cafe-article-last-timestamp", String(Date.now()));

        await DBManager.set("cafe-id", cafeId);
        await DBManager.set("cafe-code", cafeCode);
        return new Response("카페 ID 변경 완료", { status: 200 });
    }, "PUT");

    URLMapper.addPath('/admin/noticeMenuId', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const noticeMenuId = getStringKey(body, "noticeMenuId");
        if (!noticeMenuId)
            return new Response("Invalid request body", { status: 400 });

        await DBManager.set("notice-menu-id", noticeMenuId);
        return new Response("공지사항 메뉴 ID 변경 완료", { status: 200 });
    }, "PUT");

    URLMapper.addPath('/admin/lastArticleTimestamp', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const lastArticleTimestamp = getStringKey(body, "lastArticleTimestamp");
        if (!lastArticleTimestamp)
            return new Response("Invalid request body", { status: 400 });

        await DBManager.set("cafe-article-last-timestamp", lastArticleTimestamp);
        return new Response("최근 게시글 타임스탬프 변경 완료", { status: 200 });
    }, "PUT");

    URLMapper.addPath('/admin/activeChatroomList', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const chatroomId = getStringKey(body, "chatroomId");
        if (!chatroomId)
            return new Response("Invalid request body", { status: 400 });

        await ChatRoomListManager.addActiveChatRoom(chatroomId);
        return new Response("채팅방 활성화 완료", { status: 200 });
    }, "POST");

    URLMapper.addPath('/admin/activeChatroomList', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const chatroomId = getStringKey(body, "chatroomId");
        if (!chatroomId)
            return new Response("Invalid request body", { status: 400 });

        await ChatRoomListManager.deactivateChatRoom(chatroomId);
        return new Response("채팅방 비활성화 완료", { status: 200 });
    }, "DELETE");

    URLMapper.addPath('/admin/chatbotWebhookURL', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const webhookURL = getStringKey(body, "webhookURL");
        if (!webhookURL)
            return new Response("Invalid request body", { status: 400 });

        const chatbotRespond = await ChatbotManager.setWebhook(webhookURL);
        const chatbotRespondJson = await chatbotRespond.json();
        console.log("chatbot webhook url setting response: ");
        console.log(chatbotRespondJson);
        return new Response("Webhook URL 변경 완료", { status: 200 });
    }, "PUT");

    URLMapper.addPath('/admin/chatbotWebhookURL', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const chatbotRespond = await ChatbotManager.deleteWebhook();
        const chatbotRespondJson = await chatbotRespond.json();
        console.log("chatbot webhook url delete response: ");
        console.log(JSON.stringify(chatbotRespondJson));
        return new Response("Webhook URL 삭제 완료", { status: 200 });
    }, "DELETE");

    URLMapper.addPath('/admin/triggerManualCronJob', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        try {
            await AppPeriodicWorkManager.checkNewArticlesAndSendMessageToBot();
        } catch (e) {
            console.error("Error occurred while manually executing cron job:");
            console.error(e);
            return new Response("Error occurred while manually executing cron job: " + e, { status: 500 });
        }
        return new Response("Manual cron job executed successfully", { status: 200 });
    }, "POST");
}

export { initURLMapper };