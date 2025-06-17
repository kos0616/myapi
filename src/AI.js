import { getDataFromDB, saveDataToDB } from './lib/setData.js';

export const handleGetAIResponse = async (request, env) => {
	const response = await fetch('https://api.xygeng.cn/one').then((res) => res.json());
	const message = `${response.data?.content} - ${response.data?.origin}` || '取得詞句時發生了意外的錯誤';

	const data = await getDataFromDB(env, 'chatHistory');
	data.push({ id: data.length + 1, type: 'response', update: new Date(), message });
	await saveDataToDB(env, 'chatHistory', data);

	// 隨機延遲 1 到 3 秒
	await new Promise((resolve) => setTimeout(resolve, Math.random() * 2000 + 1000));

	return new Response(JSON.stringify(data), { status: 200, headers });
};
