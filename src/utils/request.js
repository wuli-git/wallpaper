const BASE_URL = 'https://tea.qingnian8.com/api/bizhi';
const ACCESS_KEY = '1328433750wuli@';
const CACHE_MAP = {
	'/homeBanner': 'homeBanner',
	'/randomWall': 'randomWall',
	'/wallNewsList?select=true': 'wallNewsList-select',
	'/classify?select=true': 'classify-select',
	'/classify?pageSize=15': 'classify'
};

function appendAccessKey(url) {
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}access-key=${encodeURIComponent(ACCESS_KEY)}`;
}

function normalizeQuery(data = {}) {
	const params = new URLSearchParams();
	Object.keys(data).sort().forEach(key => {
		const value = data[key];
		if (value !== undefined && value !== null && value !== '') {
			params.append(key, value);
		}
	});
	return params.toString();
}

function getCacheName(path, data = {}, method = 'GET') {
	if (method.toUpperCase() !== 'GET') return '';
	const query = normalizeQuery(data);
	return CACHE_MAP[query ? `${path}?${query}` : path] || '';
}

function requestCache(cacheName) {
	return new Promise((resolve, reject) => {
		if (!cacheName) return reject();
		uni.request({
			url: `/wallpaper/static/api-cache/${cacheName}.json`,
			success: res => resolve(res.data),
			fail: reject
		})
	})
}

export function request(config={}){	
	let {
		url,
		data={},
		method="GET",
		header={}
	} = config
	const path = url
	const cacheName = getCacheName(path, data, method)
	
	url = BASE_URL+url

	// #ifdef H5
	url = appendAccessKey(url)
	// #endif

	// #ifndef H5
	header['access-key'] = ACCESS_KEY
	// #endif
	
	
	return new Promise((resolve,reject)=>{		
		uni.request({
			url,
			data,
			method,
			header,
			success:res=>{
				if(res.data.errCode===0){
					resolve(res.data)
				}else if(res.data.errCode === 400){
					uni.showModal({
						title:"错误提示",
						content:res.data.errMsg,
						showCancel:false
					})
					reject(res.data)
				}else{
					uni.showToast({
						title:res.data.errMsg,
						icon:"none"
					})
					reject(res.data)
				}				
			},
			fail:err=>{
				// #ifdef H5
				requestCache(cacheName).then(resolve).catch(() => reject(err))
				// #endif
				// #ifndef H5
				reject(err)
				// #endif
			}
		})
	})
}
