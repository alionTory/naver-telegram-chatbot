const page401 = `<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>401 Unauthorized</title>
</head>
<body>
    <h1>로그인하세요</h1>
    <br>
    <a href="/admin/authenticate">로그인 페이지로</a>
</body>
</html>`;

const authenticatePage = `
<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
    $(function(){
        $("#password-submit-button").on("click",function(){
            const password = $("#password").val();
            if(!password){
                alert("비밀번호를 입력해주세요.");
                return;
            }
            
            fetch("/admin/authenticate", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({password: password})
            }).then(response => {
                if(response.status === 200){
                    location.href = "/admin";
                }else{
                    alert("로그인 실패");
                }
            });
        });
    
    });
    </script>
    <title></title>
</head>
<body>
    <h1>인증 필요</h1>
    <input type="text" name="password" id="password">
    <input type="submit" value="제출" id="password-submit-button">

</body>
</html>`;


// cafeId, noticeMenuId 는 정수, chatrooms 는 {id: name, ...} 형태의 객체, activeChatroom 은 Set.
function getAdminPage(cafeId, noticeMenuId, chatrooms, activeChatroom, chatbotApiToken, lastArticleTimestamp) {
    return `
<!doctype html>
<html>

<head>
    <meta charset="utf-8">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script>
        const cafeId = ${cafeId};
        const noticeMenuId = ${noticeMenuId};
        const chatrooms = ${JSON.stringify(chatrooms)};
        const activeChatroomId = ${JSON.stringify(Array.from(activeChatroom))};
        const chatbotApiURL = "https://api.telegram.org/bot"+"${chatbotApiToken}";
        const lastArticleTimestamp = ${lastArticleTimestamp};

        async function getWebhookURL() {
            let response = await fetch(chatbotApiURL + "/getWebhookInfo");
            let data = await response.json();
            return data.result.url;
        }
        
        async function loadWebhookInfo() {
            let webhookURL = "불러오기 실패";
            try {
                webhookURL = await getWebhookURL();
            }catch(e){
                console.error(e);
            }
            
            if(!webhookURL)
                webhookURL = "설정되지 않음";

            $("#chatbot-webhook-url-current").text(webhookURL);
        }

        function setWebhookSettingButton() {
            $("#chatbot-webhook-set").on("click", function () {
                const webhookURL = $("#chatbot-webhook-url-new").val();
                fetch('/admin/chatbotWebhookURL', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ webhookURL: webhookURL }),
                }).then(() => {
                    location.reload();
                }).catch((error) => {
                    alert('웹훅 URL 변경 중 에러 발생');
                    console.error('Error:', error);
                });
            });

            $("#chatbot-webhook-delete").on("click", function () {
                fetch('/admin/chatbotWebhookURL', {
                    method: 'DELETE',
                }).then(() => {
                    location.reload();
                }).catch((error) => {
                    alert('웹훅 URL 제거 중 에러 발생');
                    console.error('Error:', error);
                });
            });
        }

        function setCafeIdDiv() {
            const cafeIdDiv = $("#cafe-id");
            cafeIdDiv.append("<span>카페 ID: " + (cafeId ?? "없음") + "</span>");

            const span = $('<span></span>');
            const input = $('<input type="text" id="cafe-id-input">');
            span.append(input);

            const button = $('<button id="cafe-id-button">변경</button>');
            button.on("click", function () {
                fetch('/admin/cafeId', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ cafeId: input.val() }),
                }).then(() => {
                    location.reload();
                }).catch((error) => {
                    alert('카페 ID 변경 중 에러 발생');
                    console.error('Error:', error);
                });
            });

            span.append("&nbsp;&nbsp;");
            span.append(button);
            cafeIdDiv.append(span);
        }

        function setNoticeMenuIdDiv() {
            const noticeMenuIdDiv = $("#notice-menu-id");
            noticeMenuIdDiv.append("<span>공지사항 메뉴 ID: " + (noticeMenuId ?? "없음") + "</span>");

            const span = $('<span></span>');
            const input = $('<input type="text" id="notice-menu-id-input">');
            span.append(input);

            const button = $('<button id="notice-menu-id-button">변경</button>');
            button.on("click", function () {
                fetch('/admin/noticeMenuId', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ noticeMenuId: input.val() }),
                }).then(() => {
                    location.reload();
                }).catch((error) => {
                    alert('공지사항 메뉴 ID 변경 중 에러 발생');
                    console.error('Error:', error);
                });
            });

            span.append("&nbsp;&nbsp;");
            span.append(button);
            noticeMenuIdDiv.append(span);
        }

        function setLastArticleTimestampDiv() {
            const lastArticleTimestampDiv = $("#last-article-timestamp");
            lastArticleTimestampDiv.append("<span>최근 타임스탬프: " + (lastArticleTimestamp ?? "없음") + "</span>");

            const span = $('<span></span>');
            const input = $('<input type="text" id="last-article-timestamp-input">');
            span.append(input);

            const button = $('<button id="last-article-timestamp-button">변경</button>');
            button.on("click", function () {
                fetch('/admin/lastArticleTimestamp', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ lastArticleTimestamp: input.val() }),
                }).then(() => {
                    location.reload();
                }).catch((error) => {
                    alert('최근 게시글 타임스탬프 변경 중 에러 발생');
                    console.error('Error:', error);
                });
            });

            span.append("&nbsp;&nbsp;");
            span.append(button);
            lastArticleTimestampDiv.append(span);
        }

        function setChatroomsDiv() {
            const chatroomsDiv = $("#chatrooms");
            const chatroomsTable = $('<table id="chatrooms-table"></table>');

            chatroomsTable.append('<tr><th>채팅방 ID</th><th>채팅방 이름</th><th>활성화</th></tr>');
            for (let key in chatrooms) {
                const chatroomTr = $('<tr></tr>');
                chatroomTr.append('<td class="chatrooms-key">' + key + '</td>');
                chatroomTr.append('<td>' + chatrooms[key] + '</td>');
                chatroomTr.append('<td></td>');


                let button = null;
                let method = null;
                let isActive = activeChatroomId.includes(key);
                if (isActive) {
                    chatroomTr.css("background-color", "springgreen");
                    button = $('<button class="chatrooms-deactivate-button">비활성화</button>');
                    method = "DELETE";
                } else {
                    button = $('<button class="chatrooms-activate-button">활성화</button>');
                    method = "POST";
                }

                button.on("click", function () {
                    fetch('/admin/activeChatroomList', {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ chatroomId: key }),
                    }).then(() => {
                        location.reload();
                    }).catch((error) => {
                        alert('채팅방 활성화 여부 변경 중 에러 발생');
                        console.error('Error:', error);
                    });
                });

                chatroomTr.find("td:last").append(button);
                chatroomsTable.append(chatroomTr);
            }

            chatroomsDiv.append(chatroomsTable);
        }

        $(function () {
            setCafeIdDiv();
            setNoticeMenuIdDiv();
            setLastArticleTimestampDiv();
            setChatroomsDiv();
            loadWebhookInfo();
            setWebhookSettingButton();
        });
    </script>
    <style>
        table {
            border-collapse: collapse;
        }

        th,
        td {
            border: 1px solid black;
            padding: 5px;
        }

        body {
            margin: 0 auto;
            width: 800px;
        }

        input[type="text"] {
            width: 100px;
        }

        .flex-container {
            display: flex;
            justify-content: space-between;
            width: 400px;
        }
    </style>
    <title></title>
</head>

<body>
    <h1>어드민 페이지입니다.</h1>
    <div id="chatbot-webhook">
        <span>현재 챗봇 webhook URL : </span><span id="chatbot-webhook-url-current">불러오는 중</span>
        <br>
        <input type="text" id="chatbot-webhook-url-new" placeholder="웹훅 url">
        <button id="chatbot-webhook-set">변경</button>
        <button id="chatbot-webhook-delete">제거</button>
    </div>
    <br>
    <div id="cafe-id" class="flex-container"></div>
    <br>
    <div id="notice-menu-id" class="flex-container"></div>
    <br>
    <div id="last-article-timestamp" class="flex-container"></div>
    <br>
    <div id="chatrooms">
        <h3>채팅방 목록</h3>
    </div>
</body>

</html>`;
}

module.exports = { authenticatePage, page401, getAdminPage };