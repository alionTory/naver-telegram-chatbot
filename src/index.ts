/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import * as requestToAppManager from './requestToAppManager';
import * as AdminPageController from './AdminPageController';
import { getInstance } from './URLMapper';
const URLMapper = getInstance();
import * as DBManager from './DBManager';
import * as ChatbotReqeuqstController from './ChatbotRequestController';
import * as AppPeriodicWorkManager from './AppPeriodicWorkManager';

export default {
	async scheduled(event, env, ctx) {
		DBManager.initDBManager(env);
		try {
			await AppPeriodicWorkManager.checkNewArticlesAndSendMessageToBot();
		} catch (e) {
			console.log(e);
			throw e;
		}
	},

	async fetch(request, env, ctx) {
		DBManager.initDBManager(env);
		//DBManager.setKey("chatroom-list", '{"1231231":"춤별혼 통합","412341":"일본조","459710":"비극조"}');  // 테스트용

		AdminPageController.initURLMapper();
		ChatbotReqeuqstController.initURLMapper();
		return requestToAppManager.appProcessRequest(request);
	},
} satisfies ExportedHandler<Env>;
