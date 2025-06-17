// 工具函式
export const getDataFromDB = async (env, key) => {
	const dataStr = await env.DB.get(key);
	try {
		return dataStr ? JSON.parse(dataStr) : [];
	} catch {
		return [];
	}
};

export const saveDataToDB = async (env, key, data) => {
	await env.DB.put(key, JSON.stringify(data));
};
