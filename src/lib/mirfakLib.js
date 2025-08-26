/**
 * 麥爾法 id path 預處理器
 */

const list = [
	{ path: 'onlineRegistration/courseNature', id: 'cp13_cne_id' },
	{ path: 'onlineRegistration/courseCategory', id: 'cp13_cc_id' },
	{ path: 'onlineRegistration/trainCategory', id: 'cp13_tcy_id' },
	{ path: 'onlineRegistration/industrialAreas', id: 'cp13_ias_id' },
];

export function mirfakPreformater(req_path) {
	console.log(req_path);

	const match = list.find((item) => req_path.includes(item.path));
	return match ? match.id : 'id';
}

// 提取 ID 前綴的函式
export function extractIdPrefix(id_name) {
	// 匹配 cp{數字}_{字串}_ 的模式
	const match = id_name.match(/^(cp\d+_[^_]+_)/);
	return match ? match[1] : null;
}
