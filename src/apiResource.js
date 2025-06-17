import { formatArrayResponse, formatResponse } from './lib/formatResponse.js';
import { getDataFromDB, saveDataToDB } from './lib/setData.js';
const headers = { 'Access-Control-Allow-Origin': '*' };

/** 自由表單設定 */
export default async function handleUser(request, env, KEY) {
	const { method, url } = request;
	const { searchParams } = new URL(url);
	const id = searchParams.get('id');

	switch (method) {
		case 'GET':
			return await handleGet(request, env, id, KEY);
		case 'POST':
			return await handlePost(request, env, KEY);
		case 'PUT':
			return await handlePut(request, env, id, KEY);
		case 'DELETE':
			return await handleDelete(request, env, id, KEY);
		default:
			return new Response('Method Not Allowed', { status: 405 });
	}
}

// 處理函式
async function handleGet(request, env, id, KEY) {
	const data = await getDataFromDB(env, KEY);
	if (id) {
		const item = data.find((obj) => obj.id === parseInt(id));
		if (!item) return new Response('Not Found', { status: 404, headers });
		return new Response(JSON.stringify(formatResponse(item)), { status: 200, headers });
	}
	return new Response(JSON.stringify(formatArrayResponse(data)), { status: 200, headers });
}

async function handlePost(request, env, KEY) {
	let payload;
	try {
		payload = await request.json();
		// 產生隨機 UUID 作為 id
		payload.id = crypto.randomUUID();
	} catch {
		return new Response('Invalid JSON', { status: 400 });
	}

	const data = await getDataFromDB(env, KEY);
	data.push(payload);
	await saveDataToDB(env, KEY, data);

	return new Response(JSON.stringify(formatResponse(payload)), { status: 201, headers });
}

async function handlePut(request, env, id, KEY) {
	if (!id) return new Response('Missing ID parameter', { status: 400, headers });

	let payload;
	try {
		payload = await request.json();
	} catch {
		return new Response('Invalid JSON', { status: 400, headers });
	}

	const data = await getDataFromDB(env, KEY);
	const index = data.findIndex((obj) => obj.id === parseInt(id));
	if (index === -1) return new Response('Not Found', { status: 404, headers });

	data[index] = payload;
	await saveDataToDB(env, KEY, data);

	return new Response(JSON.stringify(formatResponse(payload)), { status: 200, headers });
}

async function handleDelete(request, env, id, KEY) {
	if (!id) return new Response('Missing ID parameter', { status: 400, headers });

	const data = await getDataFromDB(env, KEY);
	const index = data.findIndex((obj) => obj.id === parseInt(id));
	if (index === -1) return new Response('Not Found', { status: 404, headers });

	const removed = data.splice(index, 1);
	await saveDataToDB(env, KEY, data);

	return new Response(JSON.stringify(formatResponse(removed)), { status: 200, headers });
}
