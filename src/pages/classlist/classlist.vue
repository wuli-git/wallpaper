<template>
	<view class="classlist">
		<view class="loadingLayout" v-if="!classList.length && !noData ">
			<uni-load-more status="loading"></uni-load-more>
		</view>
		
		<view class="content">
			<navigator :url="'/pages/preview/preview?id='+item._id" class="item" v-for="item in classList" :key="item._id">
				<image :src="item.smallPicurl" mode="aspectFill"></image>
			</navigator>
		</view>
		
		<view class="loadingLayout" v-if="classList.length || noData">
			<uni-load-more :status="noData?'noMore':'loading'"></uni-load-more>
		</view>
	</view>
</template>

<script setup>
	import {
		ref
	} from "vue";
	import {
		onLoad,onUnload,onReachBottom
	} from "@dcloudio/uni-app"
	import {
		apiGetClassList,apiGetHistoryList
	} from "../../api/apis";
	//分类列表数据
	const classList = ref([]);
	const noData=ref(false);
	//定义data参数
	const queryParams={
		pageNum:1,
		pageSize:12
	}
	let pageName;
	onLoad((e) => {
		let {id=null,name=null,type=null} = e;
		if(type) queryParams.type=type;
		if(id) queryParams.classid=id;
		pageName = name;
		uni.setNavigationBarTitle({
			title:name
		})
		getClassList();
	});

	onReachBottom(()=>{
		if(noData.value) return;
		queryParams.pageNum++;
		getClassList();
	})
	
	//获取分类列表网络数据
	const getClassList = async () => {
		let res;
		if(queryParams.classid)
		 res = await apiGetClassList(queryParams);
		if(queryParams.type)
		res = await apiGetHistoryList(queryParams);
		classList.value = [...classList.value , ...res.data];
		if(queryParams.pageSize > res.data.length)
			noData.value=true;
		uni.setStorageSync("storageClassList",classList.value);
	}
	
	onUnload(()=>{
		uni.removeStorageSync("storageClassList")
	})
</script>

<style lang="scss" scoped> 
	.classlist {
		.content {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			gap: 5rpx;
			padding: 5rpx;

			.item {
				height: 440rpx;

				image {
					width: 100%;
					height: 100%;
					display: block;
				}
			}
		}
	}
</style>