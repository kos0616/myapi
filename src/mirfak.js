import { formatMirfakArrayResponse, formatMirfakResponse } from './lib/formatResponse.js';
import { getDataFromDB, saveDataToDB } from './lib/setData.js';
import handleCORSHeaders from './lib/handleCORSHeaders.js';
import { mirfakPreformater, extractIdPrefix } from './lib/mirfakLib.js';

/** 自由表單設定, 麥爾法版 */
export default async function handleUser(request, env, KEY) {
	const { method, url } = request;
	const { pathname } = new URL(url);
	const id_name = mirfakPreformater(pathname);
	const prefix = extractIdPrefix(id_name) || 'cp13_xx_';

	switch (method) {
		case 'GET':
			return await handleGet(request, env, KEY);
		case 'POST':
			return await handlePost(request, env, KEY);
		case 'PUT':
			return await handlePut(request, env, KEY);
		case 'DELETE':
			return await handleDelete(request, env, KEY);
		default:
			return new Response('Method Not Allowed', { status: 405 });
	}

	// 處理函式
	async function handleGet(request, env, KEY) {
		const data = await getDataFromDB(env, KEY);
		// 從 URL 的 query parameters 中取得資料
		const { searchParams } = new URL(request.url);
		const id = searchParams.get(id_name);

		if (id) {
			const item = data.find((obj) => obj[id_name] === id);
			if (!item) return new Response('Not Found', { status: 404, headers: handleCORSHeaders(request) });
			return new Response(JSON.stringify(formatMirfakResponse(item)), { status: 200, headers: handleCORSHeaders(request) });
		}
		return new Response(JSON.stringify(formatMirfakArrayResponse(data)), { status: 200, headers: handleCORSHeaders(request) });
	}

	async function handlePost(request, env, KEY) {
		let payload;
		try {
			const formData = await request.formData();
			// 將 FormData 轉換為普通物件
			payload = {};
			for (const [key, value] of formData.entries()) {
				payload[key] = value;
			}
			// 產生隨機 UUID 作為 id
			payload[id_name] = crypto.randomUUID();
			payload[prefix + 'created_at'] = Math.floor(Date.now() / 1000); // Unix timestamp
			payload[prefix + 'updated_at'] = Math.floor(Date.now() / 1000); // Unix timestamp
		} catch {
			return new Response('Invalid FormData', { status: 400, headers: handleCORSHeaders(request) });
		}

		const data = await getDataFromDB(env, KEY);
		data.push(payload);
		await saveDataToDB(env, KEY, data);

		return new Response(JSON.stringify(formatMirfakResponse(payload)), { status: 200, headers: handleCORSHeaders(request) });
	}

	async function handlePut(request, env, KEY) {
		let payload;
		try {
			const formData = await request.formData();
			// 將 FormData 轉換為普通物件
			payload = {};
			for (const [key, value] of formData.entries()) {
				payload[key] = value;
			}
			const id = payload[id_name];
			payload[prefix + 'updated_at'] = Math.floor(Date.now() / 1000); // Unix timestamp
			if (!id) return new Response('Missing ID parameter', { status: 400, headers: handleCORSHeaders(request) });
		} catch {
			return new Response('Invalid JSON', { status: 400, headers: handleCORSHeaders(request) });
		}
		const id = payload[id_name];
		const data = await getDataFromDB(env, KEY);
		const index = data.findIndex((obj) => obj[id_name] === id);
		if (index === -1) return new Response('Not Found', { status: 404, headers: handleCORSHeaders(request) });

		data[index] = payload;
		await saveDataToDB(env, KEY, data);

		return new Response(JSON.stringify(formatMirfakResponse(payload)), { status: 200, headers: handleCORSHeaders(request) });
	}

	async function handleDelete(request, env, KEY) {
		// 從 URL 的 query parameters 中取得資料
		const { searchParams } = new URL(request.url);
		const deleteKey = id_name + 's'; // cp13_cne_ids
		const deleteKeyArray = deleteKey + '[]'; // cp13_cne_ids[]

		// 先嘗試陣列格式，再嘗試一般格式
		let idsParam = searchParams.get(deleteKeyArray) || searchParams.get(deleteKey);

		if (!idsParam) return new Response('Missing ID parameter', { status: 400, headers: handleCORSHeaders(request) });

		// 如果是多個 ID，可能需要分割（取決於前端如何傳送）
		const ids = Array.isArray(idsParam) ? idsParam : idsParam.split(',');

		const data = await getDataFromDB(env, KEY);
		const indexs = ids.map((id) => data.findIndex((obj) => obj[id_name] === id));

		if (indexs.includes(-1)) return new Response('Not Found', { status: 404, headers: handleCORSHeaders(request) });

		const removed = indexs.map((index) => data.splice(index, 1));
		await saveDataToDB(env, KEY, data);

		return new Response(JSON.stringify(formatMirfakResponse(removed)), { status: 200, headers: handleCORSHeaders(request) });
	}
}
