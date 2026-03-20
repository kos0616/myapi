import dayjs from 'dayjs';

const SITE_NAMES = {
	S01: '苗栗工作站',
	S02: '公館工作站',
	S03: '後龍工作站',
	S04: '大潭工作站',
	S05: '竹南工作站',
};

const SUBJECTS = [
	['map', '地圖'],
	['histroy', '水情展示'],
	['iws', '圖控'],
	['flood', '汛期監測'],
	['alert', '警示管理'],
];

const ROLE_LABELS = {
	admin: '系統管理員',
	operator: '操作員',
	viewer: '檢視人員',
};

const LOCATION_CATALOG = [
	{
		siteCode: 'S01',
		locationCode: 'S01P01',
		name: 'A01 排水門',
		riverSystem: '中港溪',
		gateType: 1,
		sort: 10,
		gateCount: 1,
	},
	{
		siteCode: 'S01',
		locationCode: 'S01P02',
		name: 'A02 橡皮壩',
		riverSystem: '中港溪',
		gateType: 1,
		sort: 20,
		gateCount: 1,
	},
	{
		siteCode: 'S02',
		locationCode: 'S02P04',
		name: 'B01 制水門',
		riverSystem: '後龍溪',
		gateType: 2,
		sort: 30,
		gateCount: 2,
	},
	{
		siteCode: 'S03',
		locationCode: 'S03P06',
		name: 'C01 倒伏堰',
		riverSystem: '西湖溪',
		gateType: 3,
		sort: 40,
		gateCount: 1,
	},
	{
		siteCode: 'S03',
		locationCode: 'S03P10',
		name: 'C02 橡皮壩',
		riverSystem: '後龍溪',
		gateType: 1,
		sort: 50,
		gateCount: 1,
	},
	{
		siteCode: 'S04',
		locationCode: 'S04P04',
		name: 'D01 抽水站',
		riverSystem: '後龍溪',
		gateType: 5,
		sort: 60,
		gateCount: 2,
	},
	{
		siteCode: 'S05',
		locationCode: 'S05P03-1',
		name: 'E01 制水門',
		riverSystem: '中港溪',
		gateType: 2,
		sort: 70,
		gateCount: 2,
	},
	{
		siteCode: 'S05',
		locationCode: 'S05P07',
		name: 'E02 倒伏堰',
		riverSystem: '中港溪',
		gateType: 3,
		sort: 80,
		gateCount: 1,
	},
];

const ALL_PERMISSION_CODES = SUBJECTS.flatMap(([subjectId]) => [`${subjectId}-r`, `${subjectId}-w`]);

const ROLE_PERMISSION_CODES = {
	admin: ALL_PERMISSION_CODES,
	operator: SUBJECTS.flatMap(([subjectId]) =>
		['iws', 'histroy', 'map', 'flood', 'alert', 'LocationCameras', 'DisasterCameras', 'log'].includes(subjectId)
			? [`${subjectId}-r`, `${subjectId}-w`]
			: []
	),
	viewer: SUBJECTS.flatMap(([subjectId]) => [`${subjectId}-r`]),
};

function nowIso() {
	return dayjs().format('YYYY-MM-DDTHH:mm:ss');
}

function cloneDeep(value) {
	return JSON.parse(JSON.stringify(value));
}

function unique(arr) {
	return [...new Set(arr)];
}

function plc(Name, Tag, Value, Status = true) {
	return { Name, TagType: typeof Value === 'boolean' ? 1 : 0, Tag, Value, Status, UpdateTime: nowIso() };
}

function permissionFromCode(code) {
	const [subjectId, actionId] = code.split('-');
	const subjectName = SUBJECTS.find(([id]) => id === subjectId)?.[1] || subjectId;
	return {
		Code: code,
		SubjectId: subjectId,
		SubjectName: subjectName,
		ActionId: actionId,
		ActionName: actionId === 'w' ? '寫入' : '讀取',
	};
}

function createAccount(userName, chiName, email, roles, siteCode = null, extra = {}) {
	return {
		UserName: userName,
		ChiName: chiName,
		Email: email,
		Roles: roles,
		SiteCode: siteCode,
		Lockout: false,
		IsLineNotify: false,
		IsLineLinked: false,
		Password: 'demo',
		StationRights: siteCode ? [{ StationId: siteCode, Level: 0 }] : [],
		...extra,
	};
}

function toSvgDataUrl(svg) {
	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildCameraSvg(meta, label) {
	const siteName = SITE_NAMES[meta.siteCode] || meta.siteCode;
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#0f172a"/>
  <rect x="56" y="56" width="1168" height="608" rx="32" fill="#111827"/>
  <rect x="96" y="96" width="1088" height="528" rx="24" fill="#1e293b"/>
  <circle cx="160" cy="160" r="14" fill="#ef4444"/>
  <text x="190" y="170" font-size="28" font-family="Arial" fill="#e2e8f0">DEMO CAMERA</text>
  <text x="110" y="322" font-size="72" font-family="Arial" fill="#f8fafc">${siteName}</text>
  <text x="110" y="414" font-size="58" font-family="Arial" fill="#cbd5e1">${meta.name}</text>
  <text x="110" y="494" font-size="34" font-family="Arial" fill="#94a3b8">${label}</text>
  <text x="110" y="564" font-size="28" font-family="Arial" fill="#64748b">${meta.locationCode}</text>
</svg>`;
}

function camera(meta, suffix, label) {
	return {
		Code: `${meta.locationCode}-${suffix}`,
		Name: `${meta.name}${label}`,
		Url: toSvgDataUrl(buildCameraSvg(meta, label)),
	};
}

function createCommonSections(meta, index) {
	const waterLevel = 72 + index * 11;
	const gateCount = meta.gateCount || 1;
	const thresholds = [
		plc('一級警戒', '606', 110 + index * 4),
		plc('二級警戒', '607', 150 + index * 4),
		plc('三級警戒', '608', 190 + index * 4),
		plc('枯水警戒', '619', 45 + index * 3),
		plc('一級警戒啟用', '672', true),
		plc('二級警戒啟用', '673', true),
		plc('三級警戒啟用', '674', true),
		plc('枯水警戒啟用', '675', true),
	];

	for (let i = 1; i <= Math.max(gateCount, 1); i++) {
		thresholds.push(
			plc(`一級警戒 ${i}`, `606-${i}`, 108 + index * 4 + i * 2),
			plc(`二級警戒 ${i}`, `607-${i}`, 148 + index * 4 + i * 2),
			plc(`三級警戒 ${i}`, `608-${i}`, 188 + index * 4 + i * 2),
			plc(`枯水警戒 ${i}`, `619-${i}`, 43 + index * 3 + i * 2)
		);
	}

	const waterSensors = [
		plc('上游水位', '251', waterLevel),
		plc('下游水位', '252', Math.max(waterLevel - 18, 12)),
		plc('示意水位', '267', Math.max(waterLevel - 6, 10)),
		plc('比例尺', '653', 260),
		plc('水位標示', '677', Math.round(waterLevel / 2)),
	];

	for (let i = 1; i <= gateCount; i++) {
		waterSensors.push(
			plc(`上游水位 ${i}`, `251-${i}`, waterLevel - i * 3),
			plc(`水位標示 ${i}`, `677-${i}`, Math.round((waterLevel - i * 3) / 2))
		);
	}

	const settingSection = [
		plc('壓力上限', '303', 22),
		plc('壓力設定', '304', 18),
		plc('橡皮壩目標', '310', 65),
		plc('橡皮壩目前', '311', 54),
		plc('倒伏堰設定', '314', 72),
		plc('倒伏堰目前', '320', 60),
		plc('安全係數', '369', 88),
		plc('流量設定', '605', 35),
	];

	const warningSection = [
		plc('停電警報', '167', false),
		plc('網路警報', '168', false, true),
		plc('防盜系統', '179', true),
	];

	const statusSection = [
		plc('狀態總覽', '412', true),
		plc('幫浦待機', '901', false),
		plc('幫浦運轉', '902', true),
		plc('馬達過熱', '903', false),
		plc('震動異常', '904', false),
		plc('水位恢復', '905', false),
		plc('橡皮壩充氣', '906', false),
		plc('閘門開啟中', '907', false),
		plc('閘門關閉中', '909', false),
		plc('警示燈 1', '913', false),
		plc('警示燈 2', '914', false),
		plc('蜂鳴器 1', '916', false),
		plc('蜂鳴器 2', '917', false),
		plc('遠端控制 1', '918', false),
		plc('遠端控制 2', '920', false),
		plc('人工模式', '921', false),
		plc('自動模式', '922', true),
		plc('定位完成', '924', true),
		plc('進氣閥作動', '207', false),
		plc('排氣閥作動', '209', false),
		plc('排水閥作動', '211', false),
	];

	const autoSection = [];
	for (let i = 1; i <= gateCount; i++) {
		const suffix = gateCount === 1 ? '' : `-${i}`;
		autoSection.push(
			plc(`自動開啟門檻 ${i}`, `312${suffix}`, 95 + i * 2),
			plc(`自動關閉門檻 ${i}`, `313${suffix}`, 72 + i * 2),
			plc(`自動開啟 ${i}`, `431${suffix}`, false),
			plc(`自動關閉輔助 ${i}`, `432${suffix}`, false),
			plc(`自動開關 ${i}`, `433${suffix}`, false),
			plc(`開門水位 ${i}`, `612${suffix}`, 102 + i * 2),
			plc(`關門水位 ${i}`, `613${suffix}`, 76 + i * 2),
			plc(`自動模式 ${i}`, `669${suffix}`, false),
			plc(`閉門模式 ${i}`, `676${suffix}`, false),
			plc(`抽水啟動 ${i}`, `436${suffix}`, false)
		);
	}

	return [
		{ SectionType: 1, PLCs: [plc('投光燈 1', '301', true), plc('投光燈 2', '413', false), plc('投光燈 3', '414', false), plc('投光燈 4', '415', false)] },
		{ SectionType: 2, PLCs: thresholds },
		{ SectionType: 3, PLCs: waterSensors },
		{ SectionType: 4, PLCs: settingSection },
		{ SectionType: 5, PLCs: warningSection },
		{ SectionType: 6, PLCs: statusSection },
		{ SectionType: 7, PLCs: autoSection },
	];
}

function createMapSection(meta) {
	const plcs = [
		plc('地圖比例', '654', 320),
		plc('閘門高度', '659', 160),
		plc('狀態總覽', '412', false),
		plc('幫浦運轉', '902', false),
		plc('震動異常', '904', false),
		plc('水位恢復', '905', false),
		plc('閘門開啟中', '907', false),
		plc('閘門關閉中', '909', false),
		plc('警示燈 2', '914', false),
		plc('蜂鳴器 1', '916', false),
		plc('遠端控制 1', '918', true),
		plc('遠端控制 2', '920', false),
		plc('自動模式', '922', true),
		plc('定位完成', '924', true),
	];

	if (meta.gateType === 1) {
		plcs.push(
			plc('進氣閥開', '401', false),
			plc('進氣閥關', '402', true),
			plc('排氣閥開', '404', false),
			plc('排氣閥關', '405', true),
			plc('排水閥開', '407', false),
			plc('排水閥關', '408', true)
		);
	}

	return { PLCs: plcs };
}

function createDamSections(meta) {
	if (meta.gateType === 1) {
		return [
			{
				DamSectionType: 0,
				Name: '橡皮壩',
				PLCs: [
					plc('鼓風機 A', '101', false),
					plc('鼓風機 B', '102', true),
					plc('抽氣閥', '103', false),
					plc('進氣閥', '104', false),
					plc('壓力值', '175', 11),
					plc('壩體高度', '204', 290),
					plc('壩體開度', '205', 240),
					plc('進氣閥作動', '207', false),
					plc('排氣閥作動', '209', false),
					plc('排水閥作動', '211', false),
					plc('主馬達', '401', false),
					plc('備援馬達', '402', true),
					plc('左側閥門', '404', false),
					plc('右側閥門', '405', true),
					plc('左側排氣', '407', false),
					plc('右側排氣', '408', true),
					plc('狀態總覽', '412', false),
					plc('充氣模式', '453', false),
					plc('排氣模式', '454', false),
					plc('壩體趨勢', '471', 46),
					plc('幫浦待機', '901', true),
					plc('橡皮壩充氣', '906', false),
					plc('警示燈 1', '913', false),
					plc('蜂鳴器 2', '917', false),
					plc('人工模式', '921', false),
				],
			},
		];
	}

	if (meta.gateType === 2) {
		return [1, 2].map((gateNumber) => ({
			DamSectionType: gateNumber,
				Name: `${gateNumber}號水門`,
				PLCs: [
					plc(`啟動 ${gateNumber}`, `153-${gateNumber}`, false),
					plc(`開門速度 ${gateNumber}`, `165-${gateNumber}`, false),
					plc(`開門警示 ${gateNumber}`, `178-${gateNumber}`, false),
					plc(`機頭/配電盤 ${gateNumber}`, `201-${gateNumber}`, true),
					plc(`遠端操作 ${gateNumber}`, `204-${gateNumber}`, true),
					plc(`現場操作 ${gateNumber}`, `205-${gateNumber}`, false),
					plc(`自動開啟 ${gateNumber}`, `215-${gateNumber}`, false),
					plc(`自動停止 ${gateNumber}`, `216-${gateNumber}`, false),
					plc(`手動開啟 ${gateNumber}`, `217-${gateNumber}`, false),
					plc(`手動停止 ${gateNumber}`, `218-${gateNumber}`, false),
					plc(`開度 ${gateNumber}`, `259-${gateNumber}`, 28 + gateNumber * 12),
					plc(`流量 ${gateNumber}`, `306-${gateNumber}`, 9 + gateNumber),
					plc(`瞬時流量 ${gateNumber}`, `307-${gateNumber}`, 11 + gateNumber),
					plc(`日累積 ${gateNumber}`, `308-${gateNumber}`, 26 + gateNumber),
					plc(`指定開度 ${gateNumber}`, `317-${gateNumber}`, 36 + gateNumber * 6),
					plc(`限位上 ${gateNumber}`, `466-${gateNumber}`, false),
					plc(`限位下 ${gateNumber}`, `467-${gateNumber}`, false),
					plc(`手動模式 ${gateNumber}`, `468-${gateNumber}`, false),
					plc(`自動模式 ${gateNumber}`, `472-${gateNumber}`, false),
				],
			}));
	}

	if (meta.gateType === 3) {
		return [
			{
				DamSectionType: 0,
				Name: '倒伏堰',
				PLCs: [
					plc('馬達過載', '111', false),
					plc('開門警示', '178', false),
					plc('遠端操作', '204', true),
					plc('現場操作', '205', false),
					plc('倒伏完成', '219', false),
					plc('起立完成', '220', true),
					plc('開度', '259', 18),
					plc('日累積', '306', 17),
					plc('瞬時流量', '307', 19),
					plc('累積流量', '308', 36),
					plc('指定開度', '317', 34),
					plc('模式切換', '319', 1),
					plc('機箱操作', '459', false),
					plc('閘門起立中', '463', false),
					plc('閘門倒伏中', '464', false),
					plc('限位上', '466', false),
					plc('限位下', '467', false),
					plc('手動模式', '468', false),
					plc('起立超極限', '469', false),
					plc('系統待命', '472', false),
				],
			},
		];
	}

	return [1, 2].map((gateNumber) => ({
		DamSectionType: gateNumber,
		Name: `${gateNumber}號抽水機`,
		PLCs: [
			plc(`故障狀態 ${gateNumber}`, `181-${gateNumber}`, false),
			plc(`機頭/配電盤 ${gateNumber}`, `201-${gateNumber}`, true),
			plc(`遠端操作 ${gateNumber}`, `204-${gateNumber}`, true),
			plc(`現場操作 ${gateNumber}`, `205-${gateNumber}`, false),
			plc(`自動開啟 ${gateNumber}`, `215-${gateNumber}`, false),
			plc(`自動停止 ${gateNumber}`, `216-${gateNumber}`, true),
			plc(`手動開啟 ${gateNumber}`, `217-${gateNumber}`, false),
			plc(`手動停止 ${gateNumber}`, `218-${gateNumber}`, false),
			plc(`抽水啟停 ${gateNumber}`, `228-${gateNumber}`, false),
			plc(`輸出頻率 ${gateNumber}`, `272-${gateNumber}`, 0),
			plc(`電流量 ${gateNumber}`, `279-${gateNumber}`, 0),
			plc(`設定頻率 ${gateNumber}`, `352-${gateNumber}`, 48 + gateNumber * 4),
			plc(`抽水模式 ${gateNumber}`, `479-${gateNumber}`, false),
			plc(`排水模式 ${gateNumber}`, `480-${gateNumber}`, true),
		],
	}));
}

function createGate(meta, index) {
	return {
		Name: meta.name,
		_id: `mock-${meta.locationCode}`,
		SiteCode: meta.siteCode,
		LocationCode: meta.locationCode,
		Cameras: [camera(meta, 'cam-1', '主鏡頭'), camera(meta, 'cam-2', '側視鏡頭')],
		Sections: createCommonSections(meta, index),
		Gate: {
			GateType: meta.gateType,
			MapSection: createMapSection(meta),
			DamSections: createDamSections(meta),
		},
	};
}

function seedAlarm(meta, index) {
	const time = dayjs().subtract(index + 1, 'hour').format('YYYY-MM-DDTHH:mm:ss');
	return {
		AlarmMessage: index % 2 === 0 ? '高水位警報 ON' : '網路異常 ON',
		LocationCode: meta.locationCode,
		Tag: index % 2 === 0 ? '167' : '168',
		Time: time,
		CheckTime: null,
		CheckUser: null,
	};
}

function seedOperationHistory(locations) {
	return locations.flatMap(({ meta }, index) => [
		{
			UserName: 'demo',
			DisplayNmae: '作品集展示帳號',
			LocationCode: meta.locationCode,
			ActionDisplay: '初始設備巡檢',
			TagAction: 'True',
			IPAddress: '127.0.0.1',
			Time: dayjs().subtract(index + 1, 'day').format('YYYY-MM-DDTHH:mm:ss'),
			LocationName: meta.name,
		},
	]);
}

function seedLoginHistory(accounts) {
	return accounts.flatMap((account, index) => [
		{
			Browser: 'Chrome',
			Device: index % 2 === 0 ? 'Mac' : 'Windows',
			IpAddress: '127.0.0.1',
			LoginTime: dayjs().subtract(index + 2, 'hour').format('YYYY-MM-DDTHH:mm:ss'),
			OS: index % 2 === 0 ? 'macOS' : 'Windows 11',
			Succeeded: true,
			UserAgent: 'Mock Demo Agent',
			UserName: account.UserName,
		},
	]);
}

function seedSchedules() {
	return [
		{
			Id: 1,
			LocationCode: 'S04P04',
			WaterPumpName: '抽水機A',
			DateTime: dayjs().add(1, 'day').hour(9).minute(0).second(0).format('YYYY-MM-DDTHH:mm:ss'),
			Action: 'Start',
			Status: 'Pending',
			Result: null,
		},
		{
			Id: 2,
			LocationCode: 'S04P04',
			WaterPumpName: '抽水機A',
			DateTime: dayjs().add(1, 'day').hour(18).minute(0).second(0).format('YYYY-MM-DDTHH:mm:ss'),
			Action: 'Stop',
			Status: 'Pending',
			Result: null,
		},
	];
}

function buildState() {
	const accounts = [createAccount('demo', '作品集展示帳號', 'demo@portfolio.local', ['admin'])];

	const locations = LOCATION_CATALOG.map((meta, index) => ({
		meta,
		gate: createGate(meta, index),
		cameras: [camera(meta, 'cam-1', '主鏡頭'), camera(meta, 'cam-2', '側視鏡頭')],
		disasterCameras: [camera(meta, 'disaster-1', '防災鏡頭')],
		alarms: [seedAlarm(meta, index), seedAlarm(meta, index + 1)],
		images: ['overview', 'layout'],
	}));

	locations.forEach((locationState) => synchronizeLocationState(locationState));

	return {
		currentUserName: 'demo',
		nextScheduleId: 3,
		rolePermissionsByRole: cloneDeep(ROLE_PERMISSION_CODES),
		accounts,
		locations,
		operationHistory: seedOperationHistory(locations),
		loginHistory: seedLoginHistory(accounts),
		schedules: seedSchedules(),
		waterLevelAlarmConfig: { Period: 30, Enable: true },
		onlineUsers: { ConnectionCount: 1, OnlineUserCount: 1 },
	};
}

let state = buildState();

export function getState() {
	return state;
}

export function resetState() {
	state = buildState();
	return state;
}

export function getAccountByName(userName) {
	return state.accounts.find((account) => account.UserName === userName);
}

export function getCurrentAccount() {
	return getAccountByName(state.currentUserName) || state.accounts[0];
}

export function getAccountPermissions(account) {
	const codes = unique((account.Roles || []).flatMap((role) => state.rolePermissionsByRole[role] || []));
	return codes.map(permissionFromCode);
}

export function buildMeResponse(account = getCurrentAccount()) {
	return {
		UserName: account.UserName,
		ChiName: account.ChiName,
		Email: account.Email,
		Roles: account.Roles || [],
		SiteCode: account.SiteCode ?? null,
		IsLineNotify: account.IsLineNotify ?? false,
		IsLineLinked: account.IsLineLinked ?? false,
		StationRights: account.StationRights || [],
		Permissions: getAccountPermissions(account),
	};
}

export function listAccounts() {
	return state.accounts.map((account) => ({
		UserName: account.UserName,
		ChiName: account.ChiName,
		Email: account.Email,
		Roles: account.Roles,
		SiteCode: account.SiteCode,
		Lockout: account.Lockout,
		IsLineNotify: account.IsLineNotify,
		IsLineLinked: account.IsLineLinked,
	}));
}

export function listRoles() {
	return Object.entries(ROLE_LABELS).map(([Name, DisplayNmae]) => ({ Name, DisplayNmae }));
}

export function getRoleInfo(name) {
	const permissionCodes = state.rolePermissionsByRole[name];
	if (!permissionCodes) return null;
	return {
		Name: name,
		DisplayNmae: ROLE_LABELS[name] || name,
		Permissions: permissionCodes.map(permissionFromCode),
	};
}

export function getAllPermissions() {
	return ALL_PERMISSION_CODES.map(permissionFromCode);
}

export function getLocationState(locationCode) {
	return state.locations.find((item) => item.meta.locationCode === locationCode);
}

function findPlcFromGroup(plcs, tag) {
	return (plcs || []).find((item) => item.Tag === tag);
}

function findPlcs(locationState, tag) {
	const found = [];
	for (const section of locationState.gate.Sections || []) {
		for (const item of section.PLCs || []) {
			if (item.Tag === tag) found.push(item);
		}
	}
	for (const item of locationState.gate.Gate?.MapSection?.PLCs || []) {
		if (item.Tag === tag) found.push(item);
	}
	for (const section of locationState.gate.Gate?.DamSections || []) {
		for (const item of section.PLCs || []) {
			if (item.Tag === tag) found.push(item);
		}
	}
	return found;
}

function readBoolean(locationState, tag) {
	return findPlc(locationState, tag)?.Value === true;
}

function readNumber(locationState, tag, fallback = 0) {
	const value = Number(findPlc(locationState, tag)?.Value);
	return Number.isFinite(value) ? value : fallback;
}

function clamp(value, min, max) {
	return Math.min(Math.max(value, min), max);
}

function setTagValue(locationState, tag, value, updateTime = nowIso()) {
	for (const plc of findPlcs(locationState, tag)) {
		plc.Value = value;
		plc.UpdateTime = updateTime;
		if (typeof value === 'boolean') plc.Status = true;
	}
}

function syncType1(locationState, updateTime) {
	const isInflating = readBoolean(locationState, '453');
	const isDeflating = readBoolean(locationState, '454');
	const blowerOn = readBoolean(locationState, '412');
	const intakeOn = readBoolean(locationState, '401') && !readBoolean(locationState, '402');
	const exhaustOn = readBoolean(locationState, '404') && !readBoolean(locationState, '405');
	const drainOn = readBoolean(locationState, '407') && !readBoolean(locationState, '408');
	const isManualIntake = blowerOn && intakeOn && !isInflating && !isDeflating;
	const isMovingUp = isInflating || isManualIntake;
	const isMovingDown = isDeflating || exhaustOn || drainOn;

	let pressure = readNumber(locationState, '175', 10);
	let gateOpening = readNumber(locationState, '205', 220);
	let gateHeight = readNumber(locationState, '204', 260);
	let trend = readNumber(locationState, '471', 42);

	if (isMovingUp) {
		pressure = clamp(pressure + 2, 0, 24);
		gateOpening = clamp(gateOpening + 18, 0, 320);
		gateHeight = clamp(gateHeight + 14, 120, 360);
		trend = clamp(trend + 6, 0, 100);
	}

	if (isMovingDown) {
		pressure = clamp(pressure - 2, 0, 24);
		gateOpening = clamp(gateOpening - 18, 0, 320);
		gateHeight = clamp(gateHeight - 14, 120, 360);
		trend = clamp(trend - 6, 0, 100);
	}

	setTagValue(locationState, '175', pressure, updateTime);
	setTagValue(locationState, '204', gateHeight, updateTime);
	setTagValue(locationState, '205', gateOpening, updateTime);
	setTagValue(locationState, '471', trend, updateTime);
	setTagValue(locationState, '207', intakeOn, updateTime);
	setTagValue(locationState, '209', exhaustOn, updateTime);
	setTagValue(locationState, '211', drainOn, updateTime);
	setTagValue(locationState, '905', isManualIntake, updateTime);
	setTagValue(locationState, '906', isMovingUp, updateTime);
	setTagValue(locationState, '901', !isMovingUp, updateTime);
	setTagValue(locationState, '913', pressure >= 18, updateTime);
	setTagValue(locationState, '917', pressure >= 20 || drainOn, updateTime);
	setTagValue(locationState, '412', blowerOn, updateTime);
}

function syncType2(locationState, updateTime) {
	for (const section of locationState.gate.Gate?.DamSections || []) {
		const gateNumber = section.DamSectionType;
		const suffix = `-${gateNumber}`;
		const isOpenCommand = readBoolean(locationState, `466${suffix}`);
		const isStopCommand = readBoolean(locationState, `467${suffix}`);
		const isCloseCommand = readBoolean(locationState, `468${suffix}`);
		const useSpecifyOpening = readBoolean(locationState, `472${suffix}`);
		const targetOpening = readNumber(locationState, `317${suffix}`, 40);
		let degree = readNumber(locationState, `259${suffix}`, 30);
		let isOpening = false;
		let isClosing = false;

		if (isOpenCommand) {
			degree = clamp(degree + 12, 0, 100);
			isOpening = degree < 100;
		} else if (isCloseCommand) {
			degree = clamp(degree - 12, 0, 100);
			isClosing = degree > 0;
		} else if (!isStopCommand && useSpecifyOpening) {
			if (degree < targetOpening) {
				degree = clamp(Math.min(degree + 10, targetOpening), 0, 100);
				isOpening = degree < targetOpening;
			} else if (degree > targetOpening) {
				degree = clamp(Math.max(degree - 10, targetOpening), 0, 100);
				isClosing = degree > targetOpening;
			}
		}

		setTagValue(locationState, `201${suffix}`, true, updateTime);
		setTagValue(locationState, `204${suffix}`, true, updateTime);
		setTagValue(locationState, `205${suffix}`, false, updateTime);
		setTagValue(locationState, `217${suffix}`, isOpening, updateTime);
		setTagValue(locationState, `218${suffix}`, isClosing, updateTime);
		setTagValue(locationState, `215${suffix}`, degree >= 95, updateTime);
		setTagValue(locationState, `216${suffix}`, degree <= 5, updateTime);
		setTagValue(locationState, `259${suffix}`, degree, updateTime);
	}
}

function syncType3(locationState, updateTime) {
	const isOpenCommand = readBoolean(locationState, '468');
	const isStopCommand = readBoolean(locationState, '467');
	const isCloseCommand = readBoolean(locationState, '466');
	const useSpecifyOpening = readBoolean(locationState, '472');
	const targetOpening = readNumber(locationState, '317', 30);
	let degree = readNumber(locationState, '259', 18);
	let isOpening = false;
	let isClosing = false;

	if (isOpenCommand) {
		degree = clamp(degree + 10, 0, 90);
		isOpening = degree < 90;
	} else if (isCloseCommand) {
		degree = clamp(degree - 10, 0, 90);
		isClosing = degree > 0;
	} else if (!isStopCommand && useSpecifyOpening) {
		if (degree < targetOpening) {
			degree = clamp(Math.min(degree + 8, targetOpening), 0, 90);
			isOpening = degree < targetOpening;
		} else if (degree > targetOpening) {
			degree = clamp(Math.max(degree - 8, targetOpening), 0, 90);
			isClosing = degree > targetOpening;
		}
	}

	setTagValue(locationState, '204', true, updateTime);
	setTagValue(locationState, '205', false, updateTime);
	setTagValue(locationState, '259', degree, updateTime);
	setTagValue(locationState, '463', isClosing, updateTime);
	setTagValue(locationState, '464', isOpening, updateTime);
	setTagValue(locationState, '219', degree >= 85, updateTime);
	setTagValue(locationState, '220', degree <= 5, updateTime);
	setTagValue(locationState, '111', false, updateTime);
	setTagValue(locationState, '178', false, updateTime);
	setTagValue(locationState, '459', false, updateTime);
	setTagValue(locationState, '469', false, updateTime);
}

function syncType5(locationState, updateTime) {
	for (const section of locationState.gate.Gate?.DamSections || []) {
		const gateNumber = section.DamSectionType;
		const suffix = `-${gateNumber}`;
		const isRunning = readBoolean(locationState, `479${suffix}`);
		const isStopped = readBoolean(locationState, `480${suffix}`);
		const configFrequency = readNumber(locationState, `352${suffix}`, 50);
		const outputFrequency = isRunning ? configFrequency : 0;
		const electricValue = isRunning ? Math.max(Math.round(configFrequency * 0.42), 12) : 0;

		setTagValue(locationState, `201${suffix}`, true, updateTime);
		setTagValue(locationState, `204${suffix}`, true, updateTime);
		setTagValue(locationState, `205${suffix}`, false, updateTime);
		setTagValue(locationState, `228${suffix}`, isRunning && !isStopped, updateTime);
		setTagValue(locationState, `272${suffix}`, outputFrequency, updateTime);
		setTagValue(locationState, `279${suffix}`, electricValue, updateTime);
		setTagValue(locationState, `181${suffix}`, false, updateTime);
	}
}

function synchronizeLocationState(locationState, updateTime = nowIso()) {
	const gateType = locationState.meta.gateType;
	if (gateType === 1) syncType1(locationState, updateTime);
	if (gateType === 2) syncType2(locationState, updateTime);
	if (gateType === 3) syncType3(locationState, updateTime);
	if (gateType === 5) syncType5(locationState, updateTime);
}

export function findPlc(locationState, tag) {
	if (!locationState) return null;
	for (const section of locationState.gate.Sections || []) {
		const found = findPlcFromGroup(section.PLCs, tag);
		if (found) return found;
	}
	const mapFound = findPlcFromGroup(locationState.gate.Gate?.MapSection?.PLCs, tag);
	if (mapFound) return mapFound;
	for (const section of locationState.gate.Gate?.DamSections || []) {
		const found = findPlcFromGroup(section.PLCs, tag);
		if (found) return found;
	}
	return null;
}

function gaugeThresholdValue(locationState, tag) {
	return findPlc(locationState, tag)?.Value ?? null;
}

export function buildWaterGaugeRow(locationState) {
	const meta = locationState.meta;
	const waterLevel = Number(findPlc(locationState, '251')?.Value ?? 0);
	const flowRate = Math.round((waterLevel / 8) * 10) / 10;
	return {
		Tag: `${meta.locationCode}.251`,
		Id: `${meta.siteCode}.${meta.locationCode}.251`,
		SiteCode: meta.siteCode,
		Name: `${SITE_NAMES[meta.siteCode] || meta.siteCode}_${meta.name}`,
		LocationCode: meta.locationCode,
		FlowRate: flowRate,
		WaterLevel: waterLevel,
		LowWaterLevel: gaugeThresholdValue(locationState, '619'),
		FirstAlertWaterLevel: gaugeThresholdValue(locationState, '606'),
		SecondAlertWaterLevel: gaugeThresholdValue(locationState, '607'),
		ThirdAlertWaterLevel: gaugeThresholdValue(locationState, '608'),
		IsLowWaterAlertEnabled: Boolean(findPlc(locationState, '675')?.Value),
		IsFirstAlertEnabled: Boolean(findPlc(locationState, '672')?.Value),
		IsSecondAlertEnabled: Boolean(findPlc(locationState, '673')?.Value),
		IsThirdAlertEnabled: Boolean(findPlc(locationState, '674')?.Value),
		Section: cloneDeep(locationState.gate.Sections.find((section) => section.SectionType === 7) || null),
		RiverSystem: meta.riverSystem,
		LastUpdatedTime: findPlc(locationState, '251')?.UpdateTime || nowIso(),
		HasLocationSetting: true,
		GateType: meta.gateType,
		Status: findPlc(locationState, '168')?.Status === false ? 'Bad' : 'Good',
	};
}

export function buildAllLocationRow(locationState) {
	return {
		LocationCode: locationState.meta.locationCode,
		Name: locationState.meta.name,
		Section2: cloneDeep(locationState.gate.Sections.find((section) => section.SectionType === 2)),
		Section3Plcs: null,
		WaterPlcs: cloneDeep(locationState.gate.Sections.find((section) => section.SectionType === 3)?.PLCs || []),
		Sort: locationState.meta.sort,
	};
}

export function buildGaugeHistory(id, start, end) {
	const [, locationCode] = id.split('.');
	const locationState = getLocationState(locationCode);
	if (!locationState) return null;
	const startDate = dayjs(start);
	const endDate = dayjs(end);
	const count = Math.max(Math.min(endDate.diff(startDate, 'hour'), 96), 12);
	const currentWater = Number(findPlc(locationState, '251')?.Value ?? 80);
	const points = [];

	for (let index = 0; index <= count; index++) {
		const time = startDate.add(index * 60, 'minute');
		if (time.isAfter(endDate)) break;
		const wave = Math.sin(index / 2) * 7;
		points.push({
			Id: id,
			Time: time.format('YYYY-MM-DDTHH:mm:ss'),
			WaterLevel: Math.round((currentWater + wave) * 10) / 10,
			FirstAlertWaterLevel: gaugeThresholdValue(locationState, '606'),
			SecondAlertWaterLevel: gaugeThresholdValue(locationState, '607'),
			ThirdAlertWaterLevel: gaugeThresholdValue(locationState, '608'),
			LowWaterLevel: gaugeThresholdValue(locationState, '619'),
			GateOpening1: Number(findPlc(locationState, '259-1')?.Value ?? findPlc(locationState, '205')?.Value ?? 0),
			GateOpening2: Number(findPlc(locationState, '259-2')?.Value ?? 0),
			GateOpening3: Number(findPlc(locationState, '259-3')?.Value ?? 0),
			RubberDamPressure: Number(findPlc(locationState, '175')?.Value ?? 0),
			FlowRate: Math.round(((currentWater + wave) / 8) * 10) / 10,
		});
	}

	return points;
}

export function buildGaugeExport(start, end) {
	const header = '時間,站點,水位(㎝),流量(CMS)';
	const rows = state.locations.flatMap((locationState) => {
		const id = `${locationState.meta.siteCode}.${locationState.meta.locationCode}.251`;
		return (buildGaugeHistory(id, start, end) || []).slice(0, 8).map((item) =>
			[item.Time, locationState.meta.name, item.WaterLevel, item.FlowRate].join(',')
		);
	});
	return [header, ...rows].join('\n');
}

export function listLocationCameras() {
	return state.locations.map((locationState) => ({
		LocationCode: locationState.meta.locationCode,
		Cameras: cloneDeep(locationState.cameras),
	}));
}

export function listDisasterCameras() {
	return state.locations.map((locationState) => ({
		LocationCode: locationState.meta.locationCode,
		Cameras: cloneDeep(locationState.disasterCameras),
	}));
}

export function listLocationImages(locationCode) {
	return cloneDeep(getLocationState(locationCode)?.images || []);
}

export function addLocationImage(locationCode, fileName) {
	const locationState = getLocationState(locationCode);
	if (!locationState) return false;
	if (!locationState.images.includes(fileName)) locationState.images.push(fileName);
	return true;
}

export function deleteLocationImage(locationCode, fileName) {
	const locationState = getLocationState(locationCode);
	if (!locationState) return false;
	locationState.images = locationState.images.filter((item) => item !== fileName);
	return true;
}

export function buildLocationImageSvg(locationCode, fileName) {
	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="#0f4c5c"/>
  <rect x="50" y="50" width="1180" height="620" rx="28" fill="#edf6f9" opacity="0.92"/>
  <text x="120" y="220" font-size="72" font-family="Arial" fill="#0f4c5c">${locationCode}</text>
  <text x="120" y="320" font-size="48" font-family="Arial" fill="#205e6f">${fileName}</text>
  <text x="120" y="430" font-size="34" font-family="Arial" fill="#3b6d7f">Mock Location Image</text>
  <circle cx="1040" cy="240" r="92" fill="#84a59d"/>
  <circle cx="940" cy="420" r="68" fill="#f6bd60"/>
</svg>`;
}

export function listLocationAlarms(locationCode) {
	return cloneDeep(getLocationState(locationCode)?.alarms || []);
}

export function markAlarmChecked(locationCode, tag, time) {
	const locationState = getLocationState(locationCode);
	if (!locationState) return false;
	const alarm = locationState.alarms.find((item) => item.Tag === tag && item.Time === time);
	if (!alarm) return false;
	alarm.CheckTime = nowIso();
	alarm.CheckUser = getCurrentAccount().UserName;
	state.operationHistory.unshift({
		UserName: getCurrentAccount().UserName,
		DisplayNmae: getCurrentAccount().ChiName,
		LocationCode: locationCode,
		ActionDisplay: `警報 ${alarm.AlarmMessage} 已解除`,
		TagAction: 'False',
		IPAddress: '127.0.0.1',
		Time: nowIso(),
		LocationName: locationState.meta.name,
	});
	return true;
}

export function writeLocationPlc(locationCode, items) {
	const locationState = getLocationState(locationCode);
	if (!locationState) return null;
	const updateTime = nowIso();
	const updated = [];

	for (const item of items) {
		for (const target of findPlcs(locationState, item.Tag)) {
			target.Value = item.Value;
			target.UpdateTime = updateTime;
			if (typeof item.Value === 'boolean') target.Status = true;
		}

		updated.push({
			Tag: item.Tag,
			Status: true,
			Message: '',
			OperationLog: `${locationState.meta.name} ${item.Tag} 更新成功`,
			UpdateTime: updateTime,
		});
		if (item.isRevert !== true) {
			state.operationHistory.unshift({
				UserName: getCurrentAccount().UserName,
				DisplayNmae: getCurrentAccount().ChiName,
				LocationCode: locationCode,
				ActionDisplay: `${locationState.meta.name} ${item.Tag} 控制成功`,
				TagAction: String(item.Value),
				IPAddress: '127.0.0.1',
				Time: updateTime,
				LocationName: locationState.meta.name,
			});
		}
	}

	synchronizeLocationState(locationState, updateTime);
	return updated;
}

export function listOperationHistory(query = '', pageLimit = 20, pageNumber = 1) {
	const keyword = (query || '').toLowerCase();
	const filtered = state.operationHistory.filter((item) => {
		if (!keyword) return true;
		return [item.UserName, item.LocationCode, item.ActionDisplay, item.LocationName]
			.filter(Boolean)
			.some((value) => String(value).toLowerCase().includes(keyword));
	});

	const start = (pageNumber - 1) * pageLimit;
	const histories = filtered.slice(start, start + pageLimit);
	return {
		histories: cloneDeep(histories),
		Pagination: {
			PageLimit: pageLimit,
			TotalNumber: filtered.length,
			TotalPages: Math.max(Math.ceil(filtered.length / pageLimit), 1),
		},
	};
}

export function listLoginHistory(pageIndex = 0, pageSize = 20) {
	const start = pageIndex * pageSize;
	return cloneDeep(state.loginHistory.slice(start, start + pageSize));
}

export function createLoginRecord({ userName, succeeded }) {
	state.loginHistory.unshift({
		Browser: 'Chrome',
		Device: 'Mac',
		IpAddress: '127.0.0.1',
		LoginTime: nowIso(),
		OS: 'macOS',
		Succeeded: Boolean(succeeded),
		UserAgent: 'Mock Demo Agent',
		UserName: userName,
	});
}

export function createAccountStats() {
	return {
		WeeklyActiveAccounts: unique(
			state.loginHistory
				.filter((item) => dayjs(item.LoginTime).isAfter(dayjs().subtract(7, 'day')) && item.Succeeded)
				.map((item) => item.UserName)
		).length,
		NonLockedOutAccounts: state.accounts.filter((account) => account.Lockout !== true).length,
		LockoutAccounts: state.accounts.filter((account) => account.Lockout === true).length,
	};
}

export function createSchedulesFromRequest(req) {
	const start = dayjs(req.DateFrom);
	const end = dayjs(req.DateTo);
	const allowDays = new Set(
		req.WorkDay ? [1, 2, 3, 4, 5] : req.Weekend ? [0, 6] : req.CustomDays || []
	);
	const rows = [];

	for (let cursor = start; cursor.isBefore(end) || cursor.isSame(end, 'day'); cursor = cursor.add(1, 'day')) {
		if (allowDays.size > 0 && !allowDays.has(cursor.day())) continue;
		for (const pumpName of req.WaterPumpNames || []) {
			rows.push({
				LocationCode: req.LocationCode,
				WaterPumpName: pumpName,
				DateTime: cursor.hour(Number(req.StartTime.split(':')[0] || 0)).minute(Number(req.StartTime.split(':')[1] || 0)).second(0).format('YYYY-MM-DDTHH:mm:ss'),
				Action: 'Start',
			});
			rows.push({
				LocationCode: req.LocationCode,
				WaterPumpName: pumpName,
				DateTime: cursor.hour(Number(req.StopTime.split(':')[0] || 0)).minute(Number(req.StopTime.split(':')[1] || 0)).second(0).format('YYYY-MM-DDTHH:mm:ss'),
				Action: 'Stop',
			});
		}
	}

	return rows;
}

export function listSchedules() {
	return cloneDeep(state.schedules);
}

export function createSchedules(items) {
	for (const item of items) {
		state.schedules.push({
			Id: state.nextScheduleId++,
			LocationCode: item.LocationCode,
			WaterPumpName: item.WaterPumpName,
			DateTime: item.DateTime,
			Action: item.Action,
			Status: 'Pending',
			Result: null,
		});
	}
}

export function updateSchedule(id, dateTime) {
	const schedule = state.schedules.find((item) => item.Id === Number(id));
	if (!schedule) return false;
	schedule.DateTime = dateTime;
	return true;
}

export function deleteSchedule(id) {
	const before = state.schedules.length;
	state.schedules = state.schedules.filter((item) => item.Id !== Number(id));
	return state.schedules.length !== before;
}

export function deleteSchedulesByRange(locationCode, start, end) {
	const startDate = dayjs(start);
	const endDate = dayjs(end);
	const before = state.schedules.length;
	state.schedules = state.schedules.filter((item) => {
		if (item.LocationCode !== locationCode) return true;
		const date = dayjs(item.DateTime);
		return date.isBefore(startDate) || date.isAfter(endDate);
	});
	return state.schedules.length !== before;
}
