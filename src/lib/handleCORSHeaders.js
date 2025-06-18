export default function getCORSHeaders(request) {
	const origin = request.headers.get('Origin');
	// 只允許你的前端網域
	const allowedOrigins = ['https://cycling-battery.pages.dev', 'http://localhost'];
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
