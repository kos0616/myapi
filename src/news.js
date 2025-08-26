const BASE_URL = 'https://newsapi.org/v2/everything';

const headers = { 'Access-Control-Allow-Origin': '*' };

// 建立查詢參數的工具函式
const buildQueryParams = (params) => {
	const query = new URLSearchParams(params);
	return query.toString();
};

// 工具函式：取得昨天的日期
const getYesterdayDate = () => {
	const yesterday = new Date();
	yesterday.setDate(yesterday.getDate() - 1);
	return yesterday.toISOString().split('T')[0]; // 格式化為 YYYY-MM-DD
};

// 處理函式
export default async (request, env) => {
	const { url, headers: requestHeaders } = request;
	const { searchParams } = new URL(url);
	const query = searchParams.get('query') || 'Apple';
	const pageSize = searchParams.get('pageSize') || undefined;

	const queryParams = buildQueryParams({
		q: query,
		from: getYesterdayDate(),
		sortBy: 'popularity',
		pageSize: pageSize,
	});

	const API = `${BASE_URL}?${queryParams}`;

	const userAgent = requestHeaders.get('user-agent') || 'DefaultUserAgent/1.0';

	const response = await fetch(API, {
		headers: {
			Authorization: env.NEWS_API_KEY,
			'User-Agent': userAgent,
		},
	}).then((res) => res.json());
	// result: {"status":"ok","totalResults":137,"articles"}
	if (response.status !== 'ok') {
		return new Response(JSON.stringify({ error: 'Failed to fetch news articles' }), { status: 500, headers });
	}
	return new Response(JSON.stringify(response), { status: 200, headers });
};
