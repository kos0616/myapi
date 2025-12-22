export function formatArrayResponse(arr) {
	return {
		success: true,
		message: 'Array Data retrieved successfully by Auto generatoring API',
		data: arr,
		page: 1,
		pageSize: 100,
		total: arr.length,
	};
}

export function formatResponse(data) {
	return {
		success: true,
		message: 'Data retrieved successfully',
		data: data,
	};
}

export function formatMirfakResponse(data) {
	return {
		code: 0,
		response: data,
	};
}

export function formatMirfakArrayResponse(arr) {
	return {
		code: 0,
		response: {
			list: arr,
			paginator: {
				sort: 'asc',
				sort_type: undefined,
				count: arr.length,
				page_num: 1,
				page: 1,
				perpage: 100,
			},
		},
	};
}
