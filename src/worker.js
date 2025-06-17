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
import handleIdentity from './identity.js';

// 處理 OPTIONS 預檢請求
function handlePreRequest() {
	// 設置允許的來源
	const allowedOrigin = '*'; // 或者指定特定的來源，例如 "https://your-frontend-domain.com"

	return new Response(null, {
		status: 204,
		headers: {
			'Access-Control-Allow-Origin': allowedOrigin,
			'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		},
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
	/** 取得user清單 */
	// if (pathname === '/api/user') return await handleUser(request, env);

	// 處理身份驗證相關請求
	if (pathname.startsWith('/api/identity')) return await handleIdentity(request, env);

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
