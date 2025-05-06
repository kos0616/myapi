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
	console.log(dataStr);

	let data = [];
	if (dataStr === null) {
		data = [];
	} else {
		data = JSON.parse(dataStr);
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
		data = JSON.parse(dataStr);
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
		data = JSON.parse(dataStr);
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

async function handleRequest(request, env) {
	const { method, url } = request;
	const { searchParams } = new URL(url);
	const id = searchParams.get('id');
	console.log(method, url, id);

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
