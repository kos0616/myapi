export default function getCORSHeaders(request) {
	const origin = request.headers.get('Origin');
	// console.log('Request Origin:', origin); // Debug: 記錄請求來源
	// 只允許你的前端網域
	const allowedOrigins = [
		'http://localhost', // 本地測試
		'http://localhost:5173', // 本地測試
		'http://localhost:8080',
		'http://192.168.0.11:8088', // 客戶端（修正埠號）
		'http://192.168.1.113:5173', // 我的wifi本地端
		'https://factory-demo.pages.dev',
		'https://jutai.idareyoutodo.workers.dev'
	];

	const allowedOrigin = allowedOrigins.includes(origin) ? origin : null;
	if (!allowedOrigin) {
		return {};
	}
	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-branch-source, x-authorisation, Access-Control-Allow-Origin',
		'Access-Control-Allow-Credentials': 'true',
	};
}
