function formatNewArticleNoticeMessage(menuName, title, writer, url, isNotice = false, previewImageURl = null) {
    let message = isNotice ? "<b>카페에 새 공지가 올라왔습니다.</b>\n\n" : "카페에 새 글이 올라왔습니다.\n\n";
    message += `[${menuName}] ${title}
작성자 : ${writer}
${url}`;
    return message;
}

module.exports = { formatNewArticleNoticeMessage };