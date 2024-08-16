const DBManager = require('./DBManager');

async function getChatRoomList() {
    let chatRoomJson = await DBManager.getKey("chatroom-list");
    if (!chatRoomJson)
        chatRoomJson = "{}";

    let chatRoomList = JSON.parse(chatRoomJson);

    return chatRoomList;
}

async function addChatRoom(chatRoomId, chatRoomName) {
    let chatRoomList = await getChatRoomList();
    chatRoomList[chatRoomId] = chatRoomName;
    console.log("Adding chatroom id: " + chatRoomId + " name: " + chatRoomName);
    return DBManager.setKey("chatroom-list", JSON.stringify(chatRoomList));
}

async function getActiveChatRoomList() {
    let activeChatRoomJson = await DBManager.getKey("active-chatroom-list");
    if (!activeChatRoomJson)
        activeChatRoomJson = "[]";
    let activeChatRoomSet = new Set(JSON.parse(activeChatRoomJson));

    return activeChatRoomSet;
}

async function addActiveChatRoom(chatRoomId) {
    let chatRoomMap = await getChatRoomList();
    if (!chatRoomMap[chatRoomId]) {
        console.log("Chatroom ID active cancelled because chatroomid " + chatRoomId + " not found in list");
        return;
    }

    let activeChatRoomSet = await getActiveChatRoomList();
    activeChatRoomSet.add(chatRoomId);

    console.log("Activating chatroom id: " + chatRoomId);
    return DBManager.setKey("active-chatroom-list", JSON.stringify(Array.from(activeChatRoomSet)));
}

async function deactivateChatRoom(chatRoomId) {
    let activeChatRoomSet = await getActiveChatRoomList();
    if (!activeChatRoomSet.has(chatRoomId)) {
        console.log("Chatroom ID deactive cancelled because chatroomid " + chatRoomId + " not found in active list");
        return;
    }
    activeChatRoomSet.delete(chatRoomId);

    console.log("Deactivating chatroom id: " + chatRoomId);
    return DBManager.setKey("active-chatroom-list", JSON.stringify(Array.from(activeChatRoomSet)));
}

async function deleteChatRoom(chatRoomId) {
    console.log("start deleting chatroom id: " + chatRoomId);
    await deactivateChatRoom(chatRoomId);

    let chatRoomList = await getChatRoomList();
    delete chatRoomList[chatRoomId];

    console.log("Deleting chatroom id: " + chatRoomId);
    return DBManager.setKey("chatroom-list", JSON.stringify(chatRoomList));
}

module.exports = { getChatRoomList, addChatRoom, getActiveChatRoomList, addActiveChatRoom, deactivateChatRoom, deleteChatRoom };