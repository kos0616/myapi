/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import handleGetNews from './news.js';
import { handleGetAIResponse } from './AI.js';
// import handleUser from './user.js';
import handleChat from './chat.js';
import handleApiResource from './apiResource.js';
import handleMirfakApiResource from './mirfak.js';
import handleIdentity from './identity.js';
import handleCORSHeaders from './lib/handleCORSHeaders.js';
import handleChart from './machineChart.js';
import handleUptime from './machineUptime.js';

// 處理 OPTIONS 預檢請求
function handlePreRequest(request) {
	return new Response(null, {
		status: 204,
		headers: handleCORSHeaders(request),
	});
}

// 主處理函式
async function handleRequest(request, env) {
	const { method, url } = request;
	const { pathname } = new URL(url);

	if (request.method === 'OPTIONS') {
		return handlePreRequest(request);
	}

	// 取得 假AI 的回應
	if (pathname === '/api/ai' && method === 'GET') return await handleGetAIResponse(request, env);
	// 處理聊天請求
	if (pathname === '/api/chat') return await handleChat(request, env);
	/** 取得即時新聞 */
	if (pathname === '/api/news' && method === 'GET') return await handleGetNews(request, env);
	/** 取得假資料 數據趨勢圖 */
	if (pathname === '/api/chart' && method === 'GET') return handleChart(request);
	if (pathname === '/api/uptime' && method === 'GET') return handleUptime(request);

	/** 取得user清單 */
	// if (pathname === '/api/user') return await handleUser(request, env);

	// 處理身份驗證相關請求
	if (pathname.startsWith('/api/identity')) return await handleIdentity(request, env);

	/** 自由編輯表單- 麥爾法 */
	if (pathname.startsWith('/mirfakapi/')) {
		const apiResource = extractApiResource(pathname);

		return await handleMirfakApiResource(request, env, apiResource);

		function extractApiResource(pathname) {
			// 匹配 /mirfakapi/xxx/yyy 格式，將其組合為 xxx-yyy
			const match = pathname.match(/^\/mirfakapi\/([^\/\?]+)\/([^\/\?]+)(?:\/|$)/);
			if (match && match[2]) {
				return `${match[1]}-${match[2]}`; // 例如: onlineRegistration-courseCategory
			}
			// 如果只有一個路徑段，就返回原本的邏輯
			const singleMatch = pathname.match(/^\/mirfakapi\/([^\/\?]+)(?:\/|$)/);
			return singleMatch ? singleMatch[1] : null;
		}
	}

	/** 自由編輯表單 */
	if (pathname.startsWith('/api/')) {
		const apiResource = extractApiResource(pathname);

		return await handleApiResource(request, env, apiResource);

		function extractApiResource(pathname) {
			// 匹配 /api/xxx 或 /api/xxx/others
			const match = pathname.match(/^\/api\/([^\/\?]+)(?:\/|$)/);
			return match ? match[1] : null;
		}
	}

	return new Response('Method Not Allowed', { status: 405 });
}

// 預設導出
export default {
	async fetch(request, env, ctx) {
		return await handleRequest(request, env);
	},
};
