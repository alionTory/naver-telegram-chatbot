const DBManager = require('./DBManager');
const CookieModule = require('cookie')

let cafeId = null;
let cafeCode = null;
let cafeNoticeMenuId = null;
let cafeAuthCookie = null;

async function getCafeId() {
    if (!cafeId) {
        cafeId = await DBManager.getKey("cafe-id");
    }
    return cafeId;
}

async function getCafeCode() {
    if (!cafeCode) {
        cafeCode = await DBManager.getKey("cafe-code");
    }
    return cafeCode;
}

async function getNoticeMenuId() {
    if (!cafeNoticeMenuId) {
        cafeNoticeMenuId = await DBManager.getKey("notice-menu-id");
    }
    return cafeNoticeMenuId;
}

function getCookie() {
    if (!cafeAuthCookie) {
        cafeAuthCookie = "NID_AUT=";
        cafeAuthCookie += DBManager.getEnvironmentVariable("CAFE_COOKIE_NID_AUT");
        cafeAuthCookie += "; NID_SES=";
        cafeAuthCookie += DBManager.getEnvironmentVariable("CAFE_COOKIE_NID_SES");
    }
    return cafeAuthCookie;
}

// 게시글 url을 구하기 위해서는 카페 id뿐만 아니라 영어가 섞인 카페 url 코드도 필요.
async function requestCafeCode(cafeId) {
    console.log("Start requesting cafe code by cafe id: " + cafeId);
    const response = await fetch("https://apis.naver.com/cafe-web/cafe2/CafeGateInfo.json?cafeId=" + cafeId);
    const body = await response.json();
    const cafeCode = body.message.result.cafeInfoView.cafeUrl;
    if (!cafeCode)
        throw new Error("Cafe code not found");
    return cafeCode;
}

async function isLastOneArticleNew() {
    console.log("Start checking cafe last article is new");
    const cafeId = await getCafeId();
    const response = await fetch("https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=" + cafeId + "&search.queryType=lastArticle&search.page=1&search.perPage=1");
    const body = await response.json();
    const article = body.message.result.articleList[0];
    const result = (article.writeDateTimestamp > (await DBManager.getKey("cafe-article-last-timestamp") ?? 0));
    console.log("isLastOneArticleNew() to cafeid "+cafeId+" result: " + result);
    return result;
}

async function getLastArticles() {
    console.log("Start getting last 5 articles");
    const response = await fetch("https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=" + await getCafeId() + "&search.queryType=lastArticle&search.page=1&search.perPage=5",
        {
            headers: {
                "Cookie": getCookie()
            }
        });
    const body = await response.json();
    const articles = body.message.result.articleList;

    const dbLastArticleTimestamp = await DBManager.getKey("cafe-article-last-timestamp");
    let result = articles
        .filter(article => article.writeDateTimestamp > (dbLastArticleTimestamp ?? 0))
        .map(cafeArticleParser);
    result = await Promise.all(result);
    console.log("last " + result.length + " new articles are found ");
    console.log("Parsed last articles: ");
    console.log(JSON.stringify(result));
    return result;
}

async function cafeArticleParser(article) {
    let result = {
        title: article.subject,
        writer: article.writerNickname,
        url: "https://cafe.naver.com/" + (await getCafeCode()) + "/" + article.refArticleId,
        menuName: article.menuName,
        previewImgUrl: null,
        isNotice: article.menuId == (await getNoticeMenuId()),
        timestamp: article.writeDateTimestamp,
    }

    if (article.representImage) {
        const previewImgUrl = await getPreviewImgUrl(article.articleId);
        result.previewImgUrl = (previewImgUrl ?? article.representImage);
    }

    return result;
}

async function getPreviewImgUrl(articleId) {
    console.log("Start getting preview image of article id: " + articleId);
    const response = await fetch("https://article.cafe.naver.com/gw/v3.1/cafes/" + await getCafeId() + "/articles/" + articleId + "/siblings?limit=3",
        {
            headers: {
                "Cookie": getCookie()
            }
        });
    const body = await response.json();
    const articles = body.result.articles.items;

    let result = null;
    for (let article of articles) {
        if (article.id == articleId) {
            result = article.image.url;
            break;
        }
    }

    if (!result)
        throw new Error("Preview image not found");
    console.log("Preview image url found: " + result);
    return result;
}

module.exports = { getCafeId, requestCafeCode, isLastOneArticleNew, getLastArticles, getPreviewImgUrl };