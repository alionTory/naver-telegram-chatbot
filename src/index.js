/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
const requestToAppManager = require('./requestToAppManager');
const AdminPageController = require('./AdminPageController');
const URLMapper = require('./urlMapper').getInstance();
const DBManager = require('./DBManager');
const ChatbotReqeuqstController = require('./ChatbotRequestController');
const AppPeriodicWorkManager = require('./AppPeriodicWorkManager');

const CLOUDFLARE_KV_NAMESPACE = "starrysouls-chatbot";

export default {
	async scheduled(event, env, ctx) {
		DBManager.initDBManager(env, CLOUDFLARE_KV_NAMESPACE);
		try {
			const isScheduledWorkInProgress = DBManager.getKey("isScheduledWorkInProgress");
			if (isScheduledWorkInProgress === "true") {
				console.log("Scheduled work is already in progress. Skipping this time.");
				return;
			}
			await DBManager.setKey("isScheduledWorkInProgress", "true");
			await AppPeriodicWorkManager.checkNewArticlesAndSendMessageToBot();
		} catch (e) {
			console.log(e);
			await DBManager.setKey("isScheduledWorkInProgress", "false");
			throw e;
		}
	},

	async fetch(request, env, ctx) {
		DBManager.initDBManager(env, CLOUDFLARE_KV_NAMESPACE);
		//DBManager.setKey("chatroom-list", '{"1231231":"춤별혼 통합","412341":"일본조","459710":"비극조"}');  // 테스트용

		AdminPageController.initURLMapper();
		ChatbotReqeuqstController.initURLMapper();
		return requestToAppManager.appProcessRequest(request);
	},
};
