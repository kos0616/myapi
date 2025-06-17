const headers = { 'Access-Control-Allow-Origin': '*' };

export default async function handleIdentity(request, env) {
	const { method, url } = request;
	const { searchParams } = new URL(url);
	const { pathname } = new URL(url);

	const id = searchParams.get('id');

	// /api/identity/me
	if (pathname === '/api/identity/me' && method === 'GET') return await handleGetMe();

	if (pathname === '/api/identity/logout' && method === 'POST') return await handleLogout();
	if (pathname === '/api/identity/login' && method === 'POST') return await handleLogin();
}

// 處理獲取當前用戶信息的請求
async function handleGetMe() {
	const data = {
		permissions: [
			{
				code: 'role-r',
				subjectId: 'role',
				subjectName: '角色管理',
				actionId: 'r',
				actionName: '讀取',
				sort: 1,
			},
			{
				code: 'role-w',
				subjectId: 'role',
				subjectName: '角色管理',
				actionId: 'w',
				actionName: '寫入',
				sort: 1,
			},
			{
				code: 'user-r',
				subjectId: 'user',
				subjectName: '使用者管理',
				actionId: 'r',
				actionName: '讀取',
				sort: 2,
			},
			{
				code: 'user-w',
				subjectId: 'user',
				subjectName: '使用者管理',
				actionId: 'w',
				actionName: '寫入',
				sort: 2,
			},
		],
		id: '71d1fc49-eb9b-4c7f-8861-4037c6903f74',
		userName: 'root',
		email: 'root@localhost',
		roles: ['admin'],
		lockout: null,
	};
	return new Response(JSON.stringify(data), { status: 200, headers });
}

async function handleLogout() {
	// 處理登出請求
	return new Response('Logout successful', {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json',
		},
	});
}

async function handleLogin() {
	return new Response('Login successful', {
		status: 200,
		headers: {
			'Access-Control-Allow-Origin': '*',
			'Content-Type': 'application/json',
		},
	});
}
