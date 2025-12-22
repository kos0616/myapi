import handleCORSHeaders from '../lib/handleCORSHeaders.js';
import arr from './device.json';

export default async function handleDevice(request, env) {
	const { method, url } = request;
	const { searchParams } = new URL(url);
	const { pathname } = new URL(url);
	console.log(searchParams); //{ 'type' => '直線機', 'page' => '1', 'pageSize' => '100' }

	// /api/devices
	if (pathname === '/api/devices' && method === 'GET') return await handleGetDevices(request, searchParams);
	// /api/devices/{character}/permissions
	if (pathname.startsWith('/api/devices/') && pathname.endsWith('/permissions')) {
		// const body = await request.json();
		// console.log(body); // ['role-w'];
		const parts = pathname.split('/');
		const character = parts[2];
		return await handleGetPermissionsByCharacter(request, character);
	}

	//api/roles/{character}
	if (pathname.startsWith('/api/roles/') && method === 'GET') {
		const character = pathname.split('/').pop();
		return await handleGetRoleByCharacter(request, character);
	}
}

// 處理獲取當前用戶信息的請求
async function handleGetDevices(request, searchParams) {
	const type = searchParams.get('type') || '';
	const page = parseInt(searchParams.get('page')) || 1;
	const pageSize = parseInt(searchParams.get('pageSize')) || 27;

	// 過濾資料
	let filteredData = arr;
	if (type) filteredData = filteredData.filter((item) => item.type === type);

	// 分頁處理
	const startIndex = (page - 1) * pageSize;
	const endIndex = startIndex + pageSize;
	const paginatedData = filteredData.slice(startIndex, endIndex);

	const data = {
		data: paginatedData,
		total: filteredData.length,
		page: page,
		pageSize: 27,
	};
	return new Response(JSON.stringify(data), { status: 200, headers: handleCORSHeaders(request) });
}

async function handleGetRoleByCharacter(request, character) {
	const data = {
		data: {
			displayName: character,
			name: character,
			permissions: [
				{
					code: 'role-r',
					subjectId: 'role',
					subjectName: '角色管理',
					actionId: 'r',
					actionName: '讀取',
					sort: 0,
				},
				{
					code: 'role-w',
					subjectId: 'role',
					subjectName: '角色管理',
					actionId: 'w',
					actionName: '寫入',
					sort: 0,
				},
				{
					code: 'user-r',
					subjectId: 'user',
					subjectName: '使用者管理',
					actionId: 'r',
					actionName: '讀取',
					sort: 0,
				},
				{
					code: 'user-w',
					subjectId: 'user',
					subjectName: '使用者管理',
					actionId: 'w',
					actionName: '寫入',
					sort: 0,
				},
			],
		},
		message: null,
		success: true,
	};
	return new Response(JSON.stringify(data), { status: 200, headers: handleCORSHeaders(request) });
}

async function handleGetPermissionsByCharacter(request, character) {
	const data = { success: true, message: null, data: null };
	return new Response(JSON.stringify(data), { status: 200, headers: handleCORSHeaders(request) });
}
