import * as CafeRequester from './CafeRequester';
import * as ChatRoomListManager from './ChatRoomListManager';
import * as ChatbotManager from './ChatbotManager';
import * as MessageFormatter from './MessageFormatter';
import * as DBManager from './DBManager';

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
    const lastArticle = lastArticles[0];
    if (!lastArticle) {
        throw new Error("isLastOneArticleNew() returned true but getLastArticles() returned empty array.");
    }

    for (let article of lastArticles) {
        let message = MessageFormatter.formatNewArticleNoticeMessage
            (article.menuName, article.title, article.writer, article.url, article.isNotice, article.previewImgUrl);
        let body = ChatbotManager.sendMessageBodyFormmatter(message, article.previewImgUrl);
        await ChatbotManager.sendMessage(activeChatRoomSet, body);
    }

    await DBManager.set("cafe-article-last-timestamp", String(lastArticle.timestamp));
}

export { checkNewArticlesAndSendMessageToBot };