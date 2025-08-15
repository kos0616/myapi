export default function getCORSHeaders(request) {
	const origin = request.headers.get('Origin');
	// 只允許你的前端網域
	const allowedOrigins = [
		// 電池交換系統	'https://cycling-battery.pages.dev',
		'http://ju-tai.vdr.tw', // 久泰精業
		'http://localhost', // 本地測試
		'http://localhost:5173', // 本地測試
		'http://192.168.0.11',
	];

	const allowedOrigin = allowedOrigins.includes(origin) ? origin : null;
	if (!allowedOrigin) {
		return {};
	}
	return {
		'Access-Control-Allow-Origin': allowedOrigin,
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Allow-Credentials': 'true',
	};
}
