import handleCORSHeaders from './lib/handleCORSHeaders.js';
import dayjs from 'dayjs';
/**
 * 稼動率資料
 */
export default function handleChart(request) {
	const { url } = request;
	const { searchParams } = new URL(url);
	const startDate = !!searchParams.get('date') ? dayjs() : dayjs(searchParams.get('date')); // 預設為今天
	const date = startDate.format('YYYY-MM-DD');

	const ids = ['01', '02', '03', '04', '05']; // IDs to choose from
	const generateId = () => Number(`${Date.now()}${Math.floor(Math.random() * 10000)}`);

	// from day begin to day end
	// status 'working' 'maintain' 'standby' 'stop'
	// ramdom status in ['working', 'maintain', 'standby', 'stop']
	// every step is 10 min
	// maintain, standby, stop 0~3 times a day, maintain is 10 ~ 20 min, standby is 10~20 min stop is 10 ~ 30 min
	// 正常 保養 待生產 停機
	// const statusOptions = ['working', 'maintain', 'standby', 'stop'];

	const basicSchedule = [
		{
			time: date + ' 00:00',
			value: 'working',
		},
		{
			time: date + ' 08:00',
			value: 'working',
		},
		{
			time: date + ' 08:00',
			value: 'maintain',
		},
		{
			time: date + ' 08:30',
			value: 'maintain',
		},
		{
			time: date + ' 08:30',
			value: 'working',
		},
		{
			time: date + ' 12:00',
			value: 'standby',
		},
		{
			time: date + ' 13:00',
			value: 'standby',
		},
		{
			time: date + ' 24:00',
			value: 'working',
		},
	];

	const result = ids
		.map((id) => {
			const arr = [...basicSchedule, ...generateRandomTime()].sort((a, b) => {
				const timeA = dayjs(a.time, 'YYYY-MM-DD HH:mm');
				const timeB = dayjs(b.time, 'YYYY-MM-DD HH:mm');
				return timeA - timeB;
			});

			return arr.map((schedule) => {
				return {
					id: generateId().toString(),
					time: schedule.time,
					name: `D${id}`,
					value: schedule.value,
				};
			});
		})
		.flat();

	return new Response(JSON.stringify(result), { status: 200, headers: handleCORSHeaders(request) });
}

function generateRandomTime() {
	const randomStopCounts = Math.floor(Math.random() * 3);

	return Array.from({ length: randomStopCounts })
		.map(() => {
			const randomStopDurationGenerator = Math.floor(Math.random() * 20) + 10; // 停機時間 10 ~ 30 分鐘
			const randomStopStart = Math.floor(Math.random() * 24 * 6) * 10; // 隨機停機開始時間，單位為10分鐘
			const startTime = dayjs(date).startOf('day').add(randomStopStart, 'minute');
			const endTime = startTime.add(randomStopDurationGenerator, 'minute');

			return [
				{
					time: startTime.format('YYYY:MM:DD HH:mm'),
					value: 'stop',
				},
				{
					time: endTime.format('YYYY:MM:DD HH:mm'),
					value: 'stop',
				},
			];
		})
		.flat();
}
