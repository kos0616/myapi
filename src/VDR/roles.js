import handleCORSHeaders from '../lib/handleCORSHeaders.js';

export default async function handleIdentity(request, env) {
	const { method, url } = request;
	const { searchParams } = new URL(url);
	const { pathname } = new URL(url);

	// /api/roles
	if (pathname === '/api/roles' && method === 'GET') return await handleGetRoles(request);
	// /api/roles/{character}/permissions
	if (pathname.startsWith('/api/roles/') && pathname.endsWith('/permissions')) {
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
async function handleGetRoles(request) {
	const data = {
		data: [
			{
				displayName: 'user',
				name: 'user',
			},
			{
				displayName: 'admin',
				name: 'admin',
			},
		],
		message: null,
		success: true,
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
