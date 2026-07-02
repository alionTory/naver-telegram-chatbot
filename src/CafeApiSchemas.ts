import * as z from 'zod';

// "https://apis.naver.com/cafe-web/cafe2/CafeGateInfo.json?cafeId=" + cafeId
export const CafeGateInfo = z.object({
    message: z.object({
        result: z.object({
            cafeInfoView: z.object({
                cafeUrl: z.string(),
            }),
        }),
    }),
});

// cafe article schema
export const CafeArticle = z.object({
    articleId: z.number(),
    subject: z.string(),
    writerNickname: z.string(),
    refArticleId: z.number(),
    menuName: z.string(),
    menuId: z.number(),
    writeDateTimestamp: z.number(),
    representImage: z.string().optional(),
});

// "https://apis.naver.com/cafe-web/cafe2/ArticleListV2dot1.json?search.clubid=" + cafeId + "&search.queryType=lastArticle&search.page=1&search.perPage=1"
export const CafeArticleList = z.object({
    message: z.object({
        result: z.object({
            articleList: z.array(CafeArticle),
        }),
    }),
});

// "https://article.cafe.naver.com/gw/v3.1/cafes/" + cafeId + "/articles/" + articleId + "/siblings?limit=3"
export const CafeArticleListWithImages = z.object({
    result: z.object({
        articles: z.object({
            items: z.array(z.object({
                id: z.number(),
                image: z.object({
                    url: z.string(),
                }).optional(),
            })),
        }),
    }),
});
