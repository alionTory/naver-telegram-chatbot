function formatNewArticleNoticeMessage(menuName:string, title:string, writer:string, url:string, isNotice = false, previewImageURl?: string) {
    let message = isNotice ? "<b>카페에 새 공지가 올라왔습니다.</b>\n\n" : "카페에 새 글이 올라왔습니다.\n\n";
    message += `[${menuName}] ${title}
작성자 : ${writer}
${url}`;
    return message;
}

export { formatNewArticleNoticeMessage };