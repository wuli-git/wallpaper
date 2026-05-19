const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://tea.qingnian8.com/api/bizhi';
const ACCESS_KEY = '1328433750wuli@';
const USE_PROXY = Boolean(import.meta.env.VITE_API_BASE_URL);

function appendQuery(url, data = {}) {
	const params = new URLSearchParams();
	Object.keys(data).forEach(key => {
		const value = data[key];
		if (value !== undefined && value !== null && value !== '') {
			params.append(key, value);
		}
	});
	const query = params.toString();
	if (!query) return url;
	const separator = url.includes('?') ? '&' : '?';
	return `${url}${separator}${query}`;
}

export function request(config={}){	
	let {
		url,
		data={},
		method="GET",
		header={}
	} = config
	
	url = BASE_URL+url

	if (method.toUpperCase() === 'GET') {
		url = appendQuery(url, data);
		data = {};
	}

	// #ifdef H5
	if (!USE_PROXY) {
		const separator = url.includes('?') ? '&' : '?';
		url = `${url}${separator}access-key=${encodeURIComponent(ACCESS_KEY)}`;
	}
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
				console.error('request failed', url, err);
				reject(err)
			}
		})
	})
}
