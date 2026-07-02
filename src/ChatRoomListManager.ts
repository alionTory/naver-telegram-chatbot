import * as DBManager from './DBManager';
import * as z from 'zod';

const ChatRoomList = z.record(z.string(), z.string());
type ChatRoomList = z.infer<typeof ChatRoomList>;

async function getChatRoomList() {
    console.log("Getting chatroom list from DB...");
    let chatRoomJson = await DBManager.get("chatroom-list");
    if (!chatRoomJson)
        chatRoomJson = "{}";

    console.log("Parsing chatroom list json...");
    const parsedChatRoomList = ChatRoomList.parse(chatRoomJson);

    console.log("Successfully retrieved and parsed chatroom list.");
    return parsedChatRoomList;
}

async function addChatRoom(chatRoomId: string, chatRoomName: string) {
    let chatRoomList = await getChatRoomList();
    chatRoomList[chatRoomId] = chatRoomName;
    console.log("Adding chatroom id: " + chatRoomId + " name: " + chatRoomName);
    await DBManager.set("chatroom-list", JSON.stringify(chatRoomList));
}

async function getActiveChatRoomList(): Promise<Set<string>> {
    let activeChatRoomJson = await DBManager.get("active-chatroom-list");
    if (!activeChatRoomJson)
        activeChatRoomJson = "[]";
    let activeChatRoomSet = new Set(JSON.parse(activeChatRoomJson));

    console.log("Parsing DB value of key 'active-chatroom-list' to Set<string>...");
    return z.set(z.string()).parse(activeChatRoomSet);
}

async function addActiveChatRoom(chatRoomId: string) {
    let chatRoomMap = await getChatRoomList();
    if (!chatRoomMap[chatRoomId]) {
        console.log("Chatroom ID active cancelled because chatroomid " + chatRoomId + " not found in list");
        return;
    }

    let activeChatRoomSet = await getActiveChatRoomList();
    activeChatRoomSet.add(chatRoomId);

    console.log("Activating chatroom id: " + chatRoomId);
    await DBManager.set("active-chatroom-list", JSON.stringify(Array.from(activeChatRoomSet)));
}

async function deactivateChatRoom(chatRoomId: string) {
    let activeChatRoomSet = await getActiveChatRoomList();
    if (!activeChatRoomSet.has(chatRoomId)) {
        console.log("Chatroom ID deactive cancelled because chatroomid " + chatRoomId + " not found in active list");
        return;
    }
    activeChatRoomSet.delete(chatRoomId);

    console.log("Deactivating chatroom id: " + chatRoomId);
    await DBManager.set("active-chatroom-list", JSON.stringify(Array.from(activeChatRoomSet)));
}

async function deleteChatRoom(chatRoomId: string) {
    console.log("start deleting chatroom id: " + chatRoomId);
    await deactivateChatRoom(chatRoomId);

    let chatRoomList = await getChatRoomList();
    delete chatRoomList[chatRoomId];

    console.log("Deleting chatroom id: " + chatRoomId);
    await DBManager.set("chatroom-list", JSON.stringify(chatRoomList));
}

export { getChatRoomList, addChatRoom, getActiveChatRoomList, addActiveChatRoom, deactivateChatRoom, deleteChatRoom };