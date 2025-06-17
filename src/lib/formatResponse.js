export function formatArrayResponse(arr) {
	return {
		success: true,
		message: 'Array Data retrieved successfully',
		data: arr,
		page: 1,
		pageSize: 1,
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
