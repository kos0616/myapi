import handleCORSHeaders from '../lib/handleCORSHeaders.js';
import {
	addLocationImage,
	buildAllLocationRow,
	buildGaugeExport,
	buildGaugeHistory,
	buildLocationImageSvg,
	buildMeResponse,
	buildWaterGaugeRow,
	createAccountStats,
	createLoginRecord,
	createSchedules,
	createSchedulesFromRequest,
	deleteLocationImage,
	deleteSchedule,
	deleteSchedulesByRange,
	findPlc,
	getAccountByName,
	getAllPermissions,
	getCurrentAccount,
	getLocationState,
	getRoleInfo,
	getState,
	listAccounts,
	listDisasterCameras,
	listLocationAlarms,
	listLocationCameras,
	listLocationImages,
	listLoginHistory,
	listOperationHistory,
	listRoles,
	listSchedules,
	markAlarmChecked,
	updateSchedule,
	writeLocationPlc,
	getAccountPermissions,
} from './state.js';

function stripPrefix(pathname) {
	if (pathname.startsWith('/riverbar')) {
		return pathname.slice('/riverbar'.length) || '/';
	}
	return pathname;
}

export function isRiverBarPath(pathname) {
	return (
		pathname.startsWith('/riverbar/') ||
		pathname.startsWith('/api/auth/') ||
		pathname.startsWith('/api/Location/') ||
		pathname.startsWith('/api/WaterLevelGauge') ||
		pathname.startsWith('/api/WaterPumpSchedules') ||
		pathname.startsWith('/api/system/') ||
		pathname.startsWith('/api/System/') ||
		pathname.startsWith('/api/UserOperateHistory/') ||
		pathname.startsWith('/LineNotify/') ||
		pathname.startsWith('/line/')
	);
}

function responseHeaders(request, extra = {}) {
	return {
		'Content-Type': 'application/json; charset=utf-8',
		...handleCORSHeaders(request),
		...extra,
	};
}

function jsonResponse(request, data, status = 200, extra = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: responseHeaders(request, extra),
	});
}

function textResponse(request, text, status = 200, contentType = 'text/plain; charset=utf-8') {
	return new Response(text, {
		status,
		headers: {
			...handleCORSHeaders(request),
			'Content-Type': contentType,
		},
	});
}

function emptyResponse(request, status = 204) {
	return new Response(null, { status, headers: handleCORSHeaders(request) });
}

function errorResponse(request, status, Message, Details = []) {
	return jsonResponse(request, { Message, Details }, status);
}

async function readJson(request) {
	try {
		return await request.json();
	} catch {
		return null;
	}
}

function getLocationInfo(locationCode) {
	const locationState = getLocationState(locationCode);
	return locationState ? JSON.parse(JSON.stringify(locationState.gate)) : null;
}

function getAccountInfo(userName) {
	const account = getAccountByName(userName);
	if (!account) return null;
	return {
		UserName: account.UserName,
		ChiName: account.ChiName,
		Email: account.Email,
		Roles: account.Roles || [],
		SiteCode: account.SiteCode ?? null,
		Lockout: account.Lockout ?? false,
		IsLineNotify: account.IsLineNotify ?? false,
		isLineLinked: account.IsLineLinked ?? false,
		StationRights: account.StationRights || [],
		Permissions: getAccountPermissions(account),
	};
}

function mutateRolePermissions(roleName, codes, mode) {
	const state = getState();
	const current = new Set(state.rolePermissionsByRole[roleName] || []);
	for (const code of codes || []) {
		if (mode === 'add') current.add(code);
		if (mode === 'remove') current.delete(code);
	}
	state.rolePermissionsByRole[roleName] = [...current];
	return getRoleInfo(roleName);
}

function withPagination(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function handleRiverBarRequest(request) {
	const url = new URL(request.url);
	const pathname = stripPrefix(url.pathname);
	const { searchParams } = url;
	const method = request.method.toUpperCase();
	const state = getState();

	if (method === 'OPTIONS') return emptyResponse(request, 204);

	if (pathname === '/api/identity/login' && method === 'POST') {
		const account = state.accounts[0] || null;
		createLoginRecord({ userName: account?.UserName || 'demo', succeeded: true });
		if (!account) return errorResponse(request, 500, 'Demo 帳號不存在');
		state.currentUserName = account.UserName;
		return emptyResponse(request, 200);
	}

	if (pathname === '/api/identity/me' && method === 'GET') {
		return jsonResponse(request, buildMeResponse());
	}

	if (pathname === '/api/identity/logout' && method === 'POST') {
		state.currentUserName = state.accounts[0]?.UserName || 'demo';
		return emptyResponse(request, 200);
	}

	if (pathname === '/api/identity/change-password' && method === 'POST') {
		const payload = (await readJson(request)) || {};
		const account = getCurrentAccount();
		account.Password = payload.NewPassword || account.Password;
		return emptyResponse(request, 200);
	}

	if (pathname === '/api/auth/permissions' && method === 'GET') {
		return jsonResponse(request, getAllPermissions());
	}

	if (pathname === '/api/auth/roles' && method === 'GET') {
		return jsonResponse(request, listRoles());
	}

	if (pathname.startsWith('/api/auth/roles/') && pathname.endsWith('/permissions')) {
		const roleName = pathname.replace('/api/auth/roles/', '').replace('/permissions', '');
		const payload = (await readJson(request)) || [];
		if (!getRoleInfo(roleName)) return errorResponse(request, 404, '找不到指定角色');
		if (method === 'POST') return jsonResponse(request, mutateRolePermissions(roleName, payload, 'add'));
		if (method === 'DELETE') return jsonResponse(request, mutateRolePermissions(roleName, payload, 'remove'));
	}

	if (pathname.startsWith('/api/auth/roles/') && method === 'GET') {
		const roleName = pathname.replace('/api/auth/roles/', '');
		const role = getRoleInfo(roleName);
		return role ? jsonResponse(request, role) : errorResponse(request, 404, '找不到指定角色');
	}

	if (pathname === '/api/auth/accounts/stats' && method === 'GET') {
		return jsonResponse(request, createAccountStats());
	}

	if (pathname === '/api/auth/accounts/login-history' && method === 'GET') {
		const pageIndex = withPagination(searchParams.get('pageIndex'), 0);
		const pageSize = withPagination(searchParams.get('pageSize'), 20);
		return jsonResponse(request, listLoginHistory(pageIndex, pageSize));
	}

	if (pathname === '/api/auth/accounts' && method === 'GET') {
		return jsonResponse(request, listAccounts());
	}

	if (pathname === '/api/auth/accounts' && method === 'POST') {
		const payload = (await readJson(request)) || {};
		if (!payload.UserName || !payload.Email || !payload.Password) {
			return errorResponse(request, 400, '資料驗證失敗', ['帳號、Email、Password 為必填']);
		}
		if (getAccountByName(payload.UserName)) {
			return errorResponse(request, 400, '資料驗證失敗', ['帳號已存在']);
		}
		state.accounts.push({
			UserName: payload.UserName,
			ChiName: payload.ChiName || payload.UserName,
			Email: payload.Email,
			Password: payload.Password,
			Roles: payload.Roles || ['viewer'],
			SiteCode: payload.SiteCode || null,
			Lockout: false,
			IsLineNotify: false,
			IsLineLinked: false,
			StationRights: payload.SiteCode ? [{ StationId: payload.SiteCode, Level: 0 }] : [],
		});
		return jsonResponse(request, getAccountInfo(payload.UserName), 201);
	}

	if (pathname.startsWith('/api/auth/accounts/')) {
		const segments = pathname.split('/').filter(Boolean);
		const userName = segments[3];
		const account = getAccountByName(userName);
		if (!account) return errorResponse(request, 404, '找不到該帳號');

		if (segments[4] === 'password' && method === 'PUT') {
			const payload = (await readJson(request)) || {};
			account.Password = payload.NewPassword || account.Password;
			return jsonResponse(request, { Success: true, Message: '', Data: null });
		}

		if (segments[4] === 'stations' && method === 'POST') {
			const payload = (await readJson(request)) || {};
			account.SiteCode = payload.StationId || account.SiteCode;
			account.StationRights = payload.StationId ? [{ StationId: payload.StationId, Level: 0 }] : [];
			return jsonResponse(request, getAccountInfo(userName));
		}

		if (segments[4] === 'stations' && method === 'DELETE') {
			account.SiteCode = null;
			account.StationRights = [];
			return jsonResponse(request, getAccountInfo(userName));
		}

		if (method === 'GET') return jsonResponse(request, getAccountInfo(userName));

		if (method === 'PUT') {
			const payload = (await readJson(request)) || {};
			account.ChiName = payload.ChiName ?? account.ChiName;
			account.Email = payload.Email ?? account.Email;
			account.SiteCode = payload.SiteCode ?? null;
			account.Lockout = Boolean(payload.Lockout);
			account.Roles = payload.Roles || account.Roles;
			account.StationRights = account.SiteCode ? [{ StationId: account.SiteCode, Level: 0 }] : [];
			return jsonResponse(request, getAccountInfo(userName));
		}

		if (method === 'DELETE') {
			state.accounts = state.accounts.filter((item) => item.UserName !== userName);
			if (state.currentUserName === userName) state.currentUserName = state.accounts[0]?.UserName || 'demo';
			return emptyResponse(request, 204);
		}
	}

	if (pathname === '/api/WaterLevelGauge' && method === 'GET') {
		return jsonResponse(request, state.locations.map(buildWaterGaugeRow));
	}

	if (pathname === '/api/WaterLevelGauge/history/export' && method === 'GET') {
		return textResponse(request, buildGaugeExport(searchParams.get('start'), searchParams.get('end')));
	}

	if (pathname.startsWith('/api/WaterLevelGauge/') && pathname.endsWith('/history') && method === 'GET') {
		const id = pathname.replace('/api/WaterLevelGauge/', '').replace('/history', '');
		const data = buildGaugeHistory(id, searchParams.get('start'), searchParams.get('end'));
		return data ? jsonResponse(request, data) : errorResponse(request, 404, '找不到指定測站');
	}

	if (pathname === '/api/Location/GetAllLocation' && method === 'GET') {
		return jsonResponse(request, state.locations.map(buildAllLocationRow));
	}

	if (pathname === '/api/Location/GetLocationCameras' && method === 'GET') {
		return jsonResponse(request, listLocationCameras());
	}

	if (pathname === '/api/Location/GetDisasterCameras' && method === 'GET') {
		return jsonResponse(request, listDisasterCameras());
	}

	if (pathname.startsWith('/api/Location/GetTagsByLocation/') && method === 'GET') {
		const locationCode = pathname.replace('/api/Location/GetTagsByLocation/', '');
		const info = getLocationInfo(locationCode);
		return info ? jsonResponse(request, info) : errorResponse(request, 404, '找不到指定現地端');
	}

	if (pathname.startsWith('/api/Location/WritePlc/') && method === 'PUT') {
		const locationCode = pathname.replace('/api/Location/WritePlc/', '');
		const payload = (await readJson(request)) || [];
		const data = writeLocationPlc(locationCode, payload);
		return data ? jsonResponse(request, data) : errorResponse(request, 404, '找不到指定現地端');
	}

	if (pathname === '/api/Location/GetLocationAlarmsByLocationCode' && method === 'GET') {
		return jsonResponse(request, listLocationAlarms(searchParams.get('locationCode')));
	}

	if (pathname === '/api/Location/MarkAlarmChecked' && method === 'POST') {
		const payload = (await readJson(request)) || {};
		const ok = markAlarmChecked(payload.LocationCode, payload.Tag, payload.Time);
		return ok
			? jsonResponse(request, { Success: true, Message: '', Data: null })
			: errorResponse(request, 404, '警報不存在');
	}

	if (pathname.startsWith('/api/Location/StopWaterLevelAlarm/') && method === 'POST') {
		const locationCode = pathname.replace('/api/Location/StopWaterLevelAlarm/', '');
		const locationState = getLocationState(locationCode);
		if (!locationState) return errorResponse(request, 404, '找不到現地端');
		state.operationHistory.unshift({
			UserName: getCurrentAccount().UserName,
			DisplayNmae: getCurrentAccount().ChiName,
			LocationCode: locationCode,
			ActionDisplay: `${locationState.meta.name} 已暫停警報通知`,
			TagAction: 'False',
			IPAddress: '127.0.0.1',
			Time: new Date().toISOString(),
			LocationName: locationState.meta.name,
		});
		return jsonResponse(request, { Success: true, Message: '已暫停通知' });
	}

	if (pathname === '/api/Location/GetLocationImageNameList' && method === 'GET') {
		return jsonResponse(request, listLocationImages(searchParams.get('locationCode')));
	}

	if (pathname === '/api/Location/GetLocationImage' && method === 'GET') {
		const locationCode = searchParams.get('locationCode');
		const fileName = searchParams.get('fileName');
		if (!listLocationImages(locationCode).includes(fileName)) {
			return textResponse(request, 'Not Found', 404);
		}
		return textResponse(request, buildLocationImageSvg(locationCode, fileName), 200, 'image/svg+xml');
	}

	if (pathname === '/api/Location/UploadLocationImage' && method === 'POST') {
		const locationCode = searchParams.get('locationCode');
		const fileName = searchParams.get('fileName');
		if (!locationCode || !fileName) return errorResponse(request, 400, '缺少必要參數');
		addLocationImage(locationCode, fileName);
		return jsonResponse(request, { Success: true, Message: '', Data: null });
	}

	if (pathname === '/api/Location/DeleteLocationImage' && method === 'DELETE') {
		const locationCode = searchParams.get('locationCode');
		const fileName = searchParams.get('fileName');
		if (!locationCode || !fileName) return errorResponse(request, 400, '缺少必要參數');
		deleteLocationImage(locationCode, fileName);
		return jsonResponse(request, { Success: true, Message: '', Data: null });
	}

	if (pathname === '/api/system/online-users' && method === 'GET') {
		return jsonResponse(request, state.onlineUsers);
	}

	if (pathname === '/api/System/water-level-alarm-config' && method === 'GET') {
		return jsonResponse(request, state.waterLevelAlarmConfig);
	}

	if (pathname === '/api/UserOperateHistory/GetUserOperateHistoryList' && method === 'GET') {
		const query = searchParams.get('query') || '';
		const pageLimit = withPagination(searchParams.get('PageLimit'), 20);
		const pageNumber = withPagination(searchParams.get('PageNumber'), 1);
		return jsonResponse(request, listOperationHistory(query, pageLimit, pageNumber));
	}

	if (pathname === '/api/WaterPumpSchedules/GenerateCreateRequest' && method === 'GET') {
		const requestData = {
			LocationCode: searchParams.get('LocationCode'),
			WaterPumpNames: searchParams.getAll('WaterPumpNames'),
			DateFrom: searchParams.get('DateFrom'),
			DateTo: searchParams.get('DateTo'),
			StartTime: searchParams.get('StartTime'),
			StopTime: searchParams.get('StopTime'),
			WorkDay: searchParams.get('WorkDay') === 'true',
			Weekend: searchParams.get('Weekend') === 'true',
			CustomDays: searchParams.getAll('CustomDays').map((value) => Number(value)),
		};
		return jsonResponse(request, { Success: true, Message: '', Data: createSchedulesFromRequest(requestData) });
	}

	if (pathname === '/api/WaterPumpSchedules' && method === 'GET') {
		return jsonResponse(request, { Success: true, Message: '', Data: listSchedules() });
	}

	if (pathname === '/api/WaterPumpSchedules' && method === 'POST') {
		const payload = (await readJson(request)) || [];
		createSchedules(payload);
		return jsonResponse(request, { Success: true, Message: '', Data: null });
	}

	if (pathname === '/api/WaterPumpSchedules/BatchDelete' && method === 'DELETE') {
		deleteSchedulesByRange(searchParams.get('locationCode'), searchParams.get('start'), searchParams.get('end'));
		return jsonResponse(request, { Success: true, Message: '', Data: null });
	}

	if (pathname.startsWith('/api/WaterPumpSchedules/') && method === 'PUT') {
		const id = pathname.replace('/api/WaterPumpSchedules/', '');
		const payload = (await readJson(request)) || {};
		return updateSchedule(id, payload.DateTime)
			? jsonResponse(request, { Success: true, Message: '', Data: null })
			: errorResponse(request, 404, '找不到排程');
	}

	if (pathname.startsWith('/api/WaterPumpSchedules/') && method === 'DELETE') {
		const id = pathname.replace('/api/WaterPumpSchedules/', '');
		return deleteSchedule(id)
			? jsonResponse(request, { Success: true, Message: '', Data: null })
			: errorResponse(request, 404, '找不到排程');
	}

	if (pathname === '/LineNotify/generate-temp-token' && method === 'POST') {
		return jsonResponse(request, { Token: `mock-line-token-${Date.now()}` });
	}

	if (pathname === '/LineNotify/unregister' && method === 'POST') {
		const account = getCurrentAccount();
		account.IsLineNotify = false;
		account.IsLineLinked = false;
		return jsonResponse(request, { Token: '' });
	}

	if (pathname === '/LineNotify/register' && method === 'GET') {
		return textResponse(
			request,
			`<!doctype html><html><head><meta charset="utf-8"><title>Mock Line Register</title></head><body style="font-family:Arial;padding:40px"><h1>Mock Line Notify 已完成綁定</h1><p>此為作品集 demo，不會連到真實 LINE Notify。</p><p><a href="/">返回系統</a></p></body></html>`,
			200,
			'text/html; charset=utf-8'
		);
	}

	if (pathname === '/line/unlink' && method === 'POST') {
		const account = getCurrentAccount();
		account.IsLineLinked = false;
		account.IsLineNotify = false;
		return jsonResponse(request, { Success: true });
	}

	return errorResponse(request, 404, 'Mock API Not Found');
}
