/**
 * 麥爾法 id path 預處理器
 */

const list = [{ path: 'onlineRegistration/courseNature', id: 'cp13_cne_id' }];

export default function mirfakPreformater(req_path) {
	console.log(req_path);

	const match = list.find((item) => req_path.includes(item.path));
	return match ? match.id : 'id';
}
