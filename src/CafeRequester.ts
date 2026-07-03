import * as DBManager from './DBManager';
import * as cookieModule from 'cookie';
import * as CafeApiSchemas from './CafeApiSchemas';
import * as z from 'zod';

function getCafeId(): Promise<string> {
    let cafeId = DBManager.getStringCache("cafe-id");
    if (!cafeId) {
        cafeId = (async () => {
            console.log("Fetching cafe-id from DB...");
            return z.string().parse(await DBManager.get("cafe-id"));
        })();
        DBManager.setStringCache("cafe-id", cafeId);
    }
    return cafeId;
}

function getCafeCode(): Promise<string> {
    let cafeCode = DBManager.getStringCache("cafe-code");
    if (!cafeCode) {
        cafeCode = (async () => {
            console.log("Fetching cafe-code from DB...");
            return z.string().parse(await DBManager.get("cafe-code"));
        })();
        DBManager.setStringCache("cafe-code", cafeCode);
    }
    return cafeCode;
}

function getNoticeMenuId(): Promise<number> {
    let cafeNoticeMenuId = DBManager.getNumberCache("notice-menu-id");
    if (!cafeNoticeMenuId) {
        cafeNoticeMenuId = (async () => {
            console.log("Fetching notice-menu-id from DB...");
            return z.number().parse(await DBManager.getNumber("notice-menu-id"));
        })();
        DBManager.setNumberCache("notice-menu-id", cafeNoticeMenuId);
    }
    return cafeNoticeMenuId;
}

function getCookie() {
    let cafeAuthCookie = DBManager.getStringCacheSync("cafe-auth-cookie");
    if (!cafeAuthCookie) {
        cafeAuthCookie = "NID_AUT=";
        cafeAuthCookie += DBManager.env().CAFE_COOKIE_NID_AUT;
        cafeAuthCookie += "; NID_SES=";
        cafeAuthCookie += DBManager.env().CAFE_COOKIE_NID_SES;
        DBManager.setStringCacheSync("cafe-auth-cookie", cafeAuthCookie);
    }
    return cafeAuthCookie;
}

// 게시글 url을 구하기 위해서는 카페 id뿐만 아니라 영어가 섞인 카페 url 코드도 필요.
async function requestCafeCode(cafeId: string) {
    console.log("Start requesting cafe code by cafe id: " + cafeId);

    console.log("Requesting cafe code from Naver API...");
    const response = await fetch("https://apis.naver.com/cafe-web/cafe2/CafeGateInfo.json?cafeId=" + cafeId);
    const body = await response.json();

    console.log("Parsing response body to get cafe code...");
    const parsedBody = CafeApiSchemas.CafeGateInfo.parse(body);
    const cafeCode = parsedBody.message.result.cafeInfoView.cafeUrl;

    console.log("Cafe code found successfully: " + cafeCode);
    return cafeCode;
}

/**
 * Return number type value of key "cafe-article-last-timestamp" from DB.  
 * If value not found in DB, return 0.
 */
async function getDbLastArticleTimestamp() {
    let result = 0;
    const dbLastArticleTimestampParseResult = z.number().safeParse(await DBManager.get("cafe-article-last-timestamp"));
    if (dbLastArticleTimestampParseResult.success)
        result = dbLastArticleTimestampParseResult.data;
    return result;
}

async function isLastOneArticleNew() {
    console.log("Start checking cafe last article is new");
    const cafeId = await getCafeId();

    console.log("Requesting last article from Naver API...");
    const response = await fetch("https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=" + cafeId + "&search.queryType=lastArticle&search.page=1&search.perPage=1");
    const body = await response.json();

    console.log("Parsing response body to get last article...");
    const parsedBody = CafeApiSchemas.CafeArticleList.parse(body);
    let article = parsedBody.message.result.articleList[0];

    let result: boolean;
    if (!article)
        result = false;
    else {
        result = (article.writeDateTimestamp > await getDbLastArticleTimestamp());
    }

    console.log("isLastOneArticleNew() to cafeid " + cafeId + " result: " + result);
    return result;
}

async function getLastArticles() {
    console.log("Start getting last 5 articles");

    console.log("Requesting last articles from Naver API...");
    const response = await fetch("https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=" + await getCafeId() + "&search.queryType=lastArticle&search.page=1&search.perPage=5",
        {
            headers: {
                "Cookie": getCookie()
            }
        });
    const body = await response.json();

    console.log("Parsing response body to get last articles...");
    const parsedBody = CafeApiSchemas.CafeArticleList.parse(body);
    const articles = parsedBody.message.result.articleList;

    const dbLastArticleTimestamp = await getDbLastArticleTimestamp();
    const filterResult = articles
        .filter(article => article.writeDateTimestamp > dbLastArticleTimestamp)
        .map(cafeArticleParser);
    const result = await Promise.all(filterResult);

    console.log("last " + result.length + " new articles are found ");
    console.log("Parsed last articles: ");
    console.log(JSON.stringify(result));
    return result;
}

type CleanCafeArticle = {
    title: string;
    writer: string;
    url: string;
    menuName: string;
    previewImgUrl?: string;
    isNotice: boolean;
    timestamp: number;
}

async function cafeArticleParser(article: z.infer<typeof CafeApiSchemas.CafeArticle>) {
    let result: CleanCafeArticle = {
        title: article.subject,
        writer: article.writerNickname,
        url: "https://cafe.naver.com/" + (await getCafeCode()) + "/" + article.refArticleId,
        menuName: article.menuName,
        isNotice: article.menuId == (await getNoticeMenuId()),
        timestamp: article.writeDateTimestamp,
    }

    if (article.representImage) {
        const previewImgUrl = await getPreviewImgUrl(article.articleId);
        result.previewImgUrl = (previewImgUrl ?? article.representImage);
    }

    return result;
}

/**
 * Try to get preview image url of article.
 * Return undefined if preview image url not found.
 */
async function getPreviewImgUrl(articleId: number) {
    console.log("Start getting preview image of article id: " + articleId);

    console.log("Requesting article siblings from Naver API...");
    const response = await fetch("https://article.cafe.naver.com/gw/v3.1/cafes/" + await getCafeId() + "/articles/" + articleId + "/siblings?limit=3",
        {
            headers: {
                "Cookie": getCookie()
            }
        });
    const body = await response.json();

    console.log("Parsing response body to get preview image url...");
    const parsedBody = CafeApiSchemas.CafeArticleListWithImages.parse(body);
    const articles = parsedBody.result.articles.items;

    let result: string | undefined = undefined;
    for (let article of articles) {
        if (article.id == articleId) {
            result = article?.image?.url;
            break;
        }
    }

    if (!result) {
        console.log("Preview image url not found for article id: " + articleId);
        console.log("Using low resolution image instead.");
    } else {
        console.log("Preview image url found: " + result);
    }
    return result;
}

export { getCafeId, requestCafeCode, isLastOneArticleNew, getLastArticles, getPreviewImgUrl };