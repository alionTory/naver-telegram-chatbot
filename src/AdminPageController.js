const URLMapper = require('./urlMapper').getInstance();
const DBManager = require('./DBManager');
const ChatRoomListManager = require('./ChatRoomListManager');
const cookieModule = require('cookie');
const pages = require('./AdminPages');
const ChatbotManager = require('./ChatbotManager');
const CafeRequester = require('./CafeRequester');

// 서버에서 세션 id를 가져오는 함수
async function getSessionId() {
    let sessionId = await DBManager.getKey("session-id");
    let sesssionDeadline = await DBManager.getKey("session-deadline");
    if(sessionId && sesssionDeadline && Date.now() < sesssionDeadline){
        return sessionId;
    }
    return null;
}

// 클리이언트가 인증되었는지 쿠키로 확인
async function isClientAuthenticated(request) {
    const cookies = cookieModule.parse(request.headers.get('Cookie') ?? '');
    const clientSessionId = cookies['session-id'];
    const serverSessionId = await getSessionId();
    if (clientSessionId && serverSessionId && clientSessionId === serverSessionId)
        return true;
    return false;
}

// 서버에서 디버그 페이지를 활성화했는지 확인
async function isDebugPageEnabled() {
    const debugPageEnabled = await DBManager.getKey("debug-page-enabled");
    if (debugPageEnabled === "true")
        return true;
    return false;
}


function initURLMapper() {
    URLMapper.addPath('/admin/authenticate', async function (request) {
        return new Response(pages.authenticatePage, { headers: { 'Content-Type': 'text/html' } });
    });


    URLMapper.addPath('/admin/authenticate', async function (request) {
        const body = await request.json();
        const password = body.password;

        if (password === DBManager.getEnvironmentVariable("ADMIN_PAGE_PASSWORD")) {
            const sessionId = crypto.randomUUID();
            await DBManager.setKey("session-id", sessionId);
            await DBManager.setKey("session-deadline", Date.now() + 1000 * 60 * 60);

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

        let currentCafeId = await DBManager.getKey("cafe-id");
        let currentNoticeMenuId = await DBManager.getKey("notice-menu-id");
        let currentChatrooms = await ChatRoomListManager.getChatRoomList();
        let activeChatrooms = await ChatRoomListManager.getActiveChatRoomList();
        let chatbotApiToken = DBManager.getEnvironmentVariable("CHATBOT_API_TOKEN");
        let lastArticleTimestamp = await DBManager.getKey("cafe-article-last-timestamp");
        const pageHTML = pages.getAdminPage(currentCafeId, currentNoticeMenuId, currentChatrooms, activeChatrooms, chatbotApiToken, lastArticleTimestamp);
        return new Response(pageHTML, { headers: { 'Content-Type': 'text/html' } });
    });

    URLMapper.addPath('/admin/cafeId', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const cafeCode = await CafeRequester.requestCafeCode(body.cafeId);

        // 카페 id가 달라졌을 경우, 저장된 최근 게시글 타임스탬프 정보 수정
        if (body.cafeId !== await DBManager.getKey("cafe-id"))
            await DBManager.setKey("cafe-article-last-timestamp", Date.now());

        await DBManager.setKey("cafe-id", body.cafeId);
        await DBManager.setKey("cafe-code", cafeCode);
        return new Response("카페 ID 변경 완료", { status: 200 });
    }, "PUT");

    URLMapper.addPath('/admin/noticeMenuId', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        await DBManager.setKey("notice-menu-id", body.noticeMenuId);
        return new Response("공지사항 메뉴 ID 변경 완료", { status: 200 });
    }, "PUT");

    URLMapper.addPath('/admin/lastArticleTimestamp', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        await DBManager.setKey("cafe-article-last-timestamp", body.lastArticleTimestamp);
        return new Response("최근 게시글 타임스탬프 변경 완료", { status: 200 });
    }, "PUT");

    URLMapper.addPath('/admin/activeChatroomList', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const chatroomId = body.chatroomId;
        await ChatRoomListManager.addActiveChatRoom(chatroomId);
        return new Response("채팅방 활성화 완료", { status: 200 });
    }, "POST");

    URLMapper.addPath('/admin/activeChatroomList', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const chatroomId = body.chatroomId;
        await ChatRoomListManager.deactivateChatRoom(chatroomId);
        return new Response("채팅방 비활성화 완료", { status: 200 });
    }, "DELETE");

    URLMapper.addPath('/admin/chatbotWebhookURL', async function (request) {
        if (!await isDebugPageEnabled())
            return new Response("503 Service Unavailable", { status: 503 });
        if (!await isClientAuthenticated(request))
            return new Response(pages.page401, { status: 401, headers: { 'Content-Type': 'text/html' } });

        const body = await request.json();
        const webhookURL = body.webhookURL;
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
}

module.exports = { initURLMapper };