import handleCORSHeaders from '../lib/handleCORSHeaders.js';

export default async function handleIdentity(request, env) {
	const { method, url } = request;
	const { searchParams } = new URL(url);
	const { pathname } = new URL(url);

	// /api/permissions
	if (pathname === '/api/permissions' && method === 'GET') return await handleGetPermissions(request);
}

// 處理獲取當前用戶信息的請求
async function handleGetPermissions(request) {
	const data = {
		success: true,
		message: null,
		data: [
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
	};
	return new Response(JSON.stringify(data), { status: 200, headers: handleCORSHeaders(request) });
}
