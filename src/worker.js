/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const headers = { 'Access-Control-Allow-Origin': '*' };

// 工具函式
const getDataFromDB = async (env, key) => {
	const dataStr = await env.DB.get(key);
	try {
		return dataStr ? JSON.parse(dataStr) : [];
	} catch {
		return [];
	}
};

const saveDataToDB = async (env, key, data) => {
	await env.DB.put(key, JSON.stringify(data));
};

// 處理函式
const handleGet = async (request, env, id) => {
	const data = await getDataFromDB(env, 'chatHistory');
	if (id) {
		const item = data.find((chat) => chat.id === parseInt(id));
		if (!item) return new Response('Not Found', { status: 404, headers });
		return new Response(JSON.stringify(item), { status: 200, headers });
	}
	return new Response(JSON.stringify(data), { status: 200, headers });
};

const handlePost = async (request, env) => {
	let payload;
	try {
		payload = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	const data = await getDataFromDB(env, 'chatHistory');
	data.push(payload);
	await saveDataToDB(env, 'chatHistory', data);

	return new Response(JSON.stringify(payload), { status: 201, headers });
};

const handlePut = async (request, env, id) => {
	if (!id) return new Response('Missing ID parameter', { status: 400, headers });

	let payload;
	try {
		payload = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400, headers });
	}

	const data = await getDataFromDB(env, 'chatHistory');
	const index = data.findIndex((chat) => chat.id === parseInt(id));
	if (index === -1) return new Response('Not Found', { status: 404, headers });

	data[index] = payload;
	await saveDataToDB(env, 'chatHistory', data);

	return new Response(JSON.stringify(payload), { status: 200, headers });
};

const handleDelete = async (request, env, id) => {
	if (!id) return new Response('Missing ID parameter', { status: 400, headers });

	const data = await getDataFromDB(env, 'chatHistory');
	const index = data.findIndex((chat) => chat.id === parseInt(id));
	if (index === -1) return new Response('Not Found', { status: 404, headers });

	const removed = data.splice(index, 1);
	await saveDataToDB(env, 'chatHistory', data);

	return new Response(JSON.stringify(removed), { status: 200, headers });
};

const handleGetAIResponse = async (request, env) => {
	const response = await fetch('https://api.xygeng.cn/one').then((res) => res.json()).data;
	const message = `${response?.content} - ${response?.origin}` || '取得詞句時發生了意外的錯誤';

	const data = await getDataFromDB(env, 'chatHistory');
	data.push({ id: data.length + 1, type: 'response', update: new Date(), message });
	await saveDataToDB(env, 'chatHistory', data);

	// 隨機延遲 1 到 3 秒
	await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000));

	return new Response(JSON.stringify(data), { status: 200, headers });
};

const handleChatPost = async (request, env) => {
	const data = await getDataFromDB(env, 'chatHistory');

	// payload default type { type: 'request', message: string | undefined }
	let payload = { id: data.length + 1, type: 'request', update: new Date(), message: undefined };
	try {
		const req = await request.json();
		payload = { ...payload, ...req };
	} catch {
		return new Response('Invalid JSON', { status: 400, headers });
	}

	data.push(payload);
	await saveDataToDB(env, 'chatHistory', data);
	return new Response(JSON.stringify(payload), { status: 201, headers });
};

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
	const { searchParams, pathname } = new URL(url);
	const id = searchParams.get('id');

	if (request.method === 'OPTIONS') {
		return handlePreRequest(request);
	}

	if (pathname.includes('/api/ai') && method === 'GET') {
		// 取得 AI 的回應
		return await handleGetAIResponse(request, env);
	}
	if (pathname.includes('/api/chat') && method === 'POST') {
		// 處理聊天請求
		return await handleChatPost(request, env);
	}

	switch (method) {
		case 'GET':
			return await handleGet(request, env, id);
		case 'POST':
			return await handlePost(request, env);
		case 'PUT':
			return await handlePut(request, env, id);
		case 'DELETE':
			return await handleDelete(request, env, id);
		default:
			return new Response('Method Not Allowed', { status: 405 });
	}
}

// 預設導出
export default {
	async fetch(request, env, ctx) {
		return await handleRequest(request, env);
	},
};
