/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

var worker_default = {
	async fetch(request, env, ctx) {
		return await handleRequest(request, env);
	},
};

var handleGet = async (request, env, id) => {
	const dataStr = await env.DB.get('chatHistory');

	let data = [];
	if (dataStr === null) {
		data = [];
	} else {
		try {
			data = JSON.parse(dataStr);
		} catch (error) {
			data = [];
		}
	}
	if (id) {
		const index = data.findIndex((chat) => chat['id'] === parseInt(id));
		if (index === -1) {
			return new Response('Not Found', { status: 404 });
		}
		return new Response(JSON.stringify(data[index]), { status: 200 });
	}
	return new Response(JSON.stringify(data), { status: 200 });
};

var handlePut = async (request, env, id) => {
	const payload = await request.json();
	const dataStr = await env.DB.get('chatHistory');
	let data = [];
	if (dataStr === null) {
		data = [];
	} else {
		try {
			data = JSON.parse(dataStr);
		} catch (error) {
			data = [];
		}
	}
	if (id) {
		const index = data.findIndex((chat) => chat['id'] === parseInt(id));
		if (index === -1) {
			return new Response('Not Found', { status: 404 });
		}
		data[index] = payload;
		await env.DB.put('chatHistory', JSON.stringify(data));
		return new Response(JSON.stringify(payload), { status: 200 });
	} else {
		return new Response('Missing ID parameter', { status: 400 });
	}
};

var handleDelete = async (request, env, id) => {
	const dataStr = await env.DB.get('chatHistory');
	let data = [];
	if (dataStr === null) {
		data = [];
	} else {
		try {
			data = JSON.parse(dataStr);
		} catch (error) {
			data = [];
		}
	}
	if (id) {
		const index = data.findIndex((chat) => chat['id'] === parseInt(id));
		if (index === -1) {
			return new Response('Not Found', { status: 404 });
		}
		const removed = data.splice(index, 1);
		await env.DB.put('chatHistory', JSON.stringify(data));
		return new Response(JSON.stringify(removed), { status: 200 });
	} else {
		return new Response('Missing ID parameter', { status: 400 });
	}
};

var handlePost = async (request, env) => {
	let payload = undefined;
	try {
		payload = await request.json();
	} catch (error) {
		payload = undefined;
	}
	const dataStr = await env.DB.get('chatHistory');
	let data;
	if (dataStr === null) {
		data = [];
	} else {
		try {
			data = JSON.parse(dataStr);
		} catch (error) {
			data = [];
		}
	}

	if (payload) data.push(payload);
	await env.DB.put('chatHistory', JSON.stringify(data));
	return new Response(JSON.stringify(payload), { status: 201 });
};

var handleGetAIResponse = async (request, env) => {
	const response = await fetch('https://api.xygeng.cn/one').then((res) => res.json());
	const content = response.data?.content;

	const dataStr = await env.DB.get('chatHistory');
	let data;
	if (dataStr === null) {
		data = [];
	} else {
		try {
			data = JSON.parse(dataStr);
		} catch (error) {
			data = [];
		}
	}
	if (content) {
		data.push({ id: data.length + 1, type: 'response', update: new Date(), content });
	} else {
		data.push({ id: data.length + 1, type: 'response', update: new Date(), content: '取得詞句時發生了意外的錯誤' });
	}
	await env.DB.put('chatHistory', JSON.stringify(data));
	// await deplay random time from 1 to 3 seconds
	await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 2000) + 1000));
	return new Response(JSON.stringify(data), { status: 200 });
};

async function handleRequest(request, env) {
	const { method, url } = request;
	const { searchParams } = new URL(url);
	const id = searchParams.get('id');

  /** 取得 AI 的回應 */
	if (url.includes('/api/ai')) {
		return await handleGetAIResponse(request, env);
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
	}
}

// export default {
// 	async fetch(request, env, ctx) {
// 		return new Response('FUCK World!');
// 	},
// };

export { worker_default as default };
