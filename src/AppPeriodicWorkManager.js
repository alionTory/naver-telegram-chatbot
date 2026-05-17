const CafeRequester = require('./CafeRequester');
const ChatRoomListManager = require('./ChatRoomListManager');
const ChatbotManager = require('./ChatbotManager');
const MessageFormatter = require('./MessageFormatter');
const DBManager = require('./DBManager');

async function checkNewArticlesAndSendMessageToBot() {
    if (!(await CafeRequester.getCafeId())) {
        console.log("Cafe id not found. Stopping precess.");
        return;
    }

    if (!await CafeRequester.isLastOneArticleNew())
        return;

    const activeChatRoomSet = await ChatRoomListManager.getActiveChatRoomList();
    if (activeChatRoomSet.size === 0) {
        console.log("No active chatroom. Stopping process.");
        return;
    }

    const lastArticles = await CafeRequester.getLastArticles();

    for (let article of lastArticles) {
        let message = MessageFormatter.formatNewArticleNoticeMessage
            (article.menuName, article.title, article.writer, article.url, article.isNotice, article.previewImgUrl);
        let body = ChatbotManager.sendMessageBodyFormmatter(message, article.previewImgUrl);
        await ChatbotManager.sendMessage(activeChatRoomSet, body);
    }

    await DBManager.setKey("cafe-article-last-timestamp", lastArticles[0].timestamp);
}

module.exports = { checkNewArticlesAndSendMessageToBot };