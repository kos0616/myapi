import handleCORSHeaders from './lib/handleCORSHeaders.js';
import dayjs from 'dayjs';

/**
 * 數據趨勢圖測試資料
 */
export default function handleChart(request) {
	const { url } = request;
	const { searchParams } = new URL(url);
	const start = searchParams.get('start');
	const end = searchParams.get('end');

	const count = 1000;

	const ids = ['01', '02', '03', '04', '05']; // IDs to choose from
	const data = [];
	const startDate = start ? new Date(start) : dayjs().startOf('month').toDate();
	const endDate = end ? new Date(end) : dayjs().endOf('month').toDate();
	const generateId = () => Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);

	for (let i = 0; i < count; i++) {
		const randomId = ids[Math.floor(Math.random() * 5)]; // Random ID between 01 and 05
		const randomTime = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

		const randomValue = Math.floor(86 + Math.random() * (92 - 86)); // Random value between 86 and 92

		data.push({
			id: generateId().toString(),
			time: randomTime.toISOString(),
			name: `D${randomId}`,
			value: randomValue,
		});
	}

	return new Response(JSON.stringify(data), { status: 200, headers: handleCORSHeaders(request) });
}
