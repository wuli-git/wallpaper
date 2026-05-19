<template>
	<view class="homelayout pageBg">
		<!-- 导航栏 -->
		<custom-nav-bar title="推荐"></custom-nav-bar>
		<!-- 轮播器 -->
		<view class="banner">
			<swiper circular indicator-dots indicator-color="rgba(255,255,255,0.5)"
			indicator-active-color="#fff"autoplay>
				<swiper-item v-for="item in bannerList" :key="item._id">
					<image :src="item.picurl" mode="aspectFill"></image>
				</swiper-item>
			</swiper>
		</view>
		<!-- 每日公告 -->
		<view class="notice">
			<view class="left">
				<uni-icons type="sound-filled" size="20"></uni-icons>
				<text class="text">公告</text>
				</view>
			<view class="center">
				<swiper vertical autoplay interval="1500" duration="300" circular>
					<swiper-item>
						<navigator url="/pages/notice/detail">
						<text>零儿爱喵喵，版权公告</text>
					</navigator>
					</swiper-item>
					<swiper-item>
						<navigator url="/pages/notice/detail">
						<text>欢迎关注零儿爱喵喵壁纸</text>
					</navigator>
					</swiper-item>
				</swiper>
			</view>
			<view class="right">
				<uni-icons type="right" size="16" color="16"></uni-icons>
			</view>
		</view>
		<!-- 每日推荐 -->
		<view class="select">
			<common-title><template #name>每日推荐</template>
			<template #custom>
				<view class="date">
					<uni-icons type="calendar" size="18"></uni-icons>
					<view class="text">
					<uni-dateformat :date="Date.now()"format="dd日"></uni-dateformat>
					</view>
				</view>
			</template>
			</common-title>
			<view class="content">
				<scroll-view scroll-x>
					<view class="box" v-for="item in randomList" :key="item._id" @click="gopreview(item._id)">
						<image :src="item.smallPicurl" mode="aspectFill"></image>
					</view>
				</scroll-view>
			</view>
		</view>
		<!-- 专题精选 -->
		<view class="theme">
			<common-title><template #name>专题精选</template>
			<template #custom>
				<navigator url=""class="more">More+</navigator>
			</template>
			</common-title>
			<view class="content">
				<theme-item v-for="item in classifyList" :key="item._id" :item="item">
					
				</theme-item>
				<theme-item :isMore="true"></theme-item>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue';
import {apiGetBanner,apiGetClassify,apiGetDayRandom,apiGetNotice} from "@/api/apis.js";
import {onShareAppMessage} from "@dcloudio/uni-app"
	const bannerList=ref([]);
	const randomList=ref([]);
	const noticeList=ref([]);
	const classifyList=ref([]);
	
	const getBanner=async()=>{
		try{
			let res=await apiGetBanner();
			bannerList.value=res.data || [];
		}catch(err){
			console.error('getBanner failed', err);
		}
	}
	
	const getDayRandom=async()=>{
		try{
			let res=await apiGetDayRandom();
			randomList.value=res.data || [];
		}catch(err){
			console.error('getDayRandom failed', err);
		}
	}
	
	const getNotice=async()=>{
		try{
			let res=await apiGetNotice({select:true});
			noticeList.value=res.data || [];
		}catch(err){
			console.error('getNotice failed', err);
		}
	}
	
	const getClassify=async ()=>{
		try{
			let res=await apiGetClassify({
				select:true
			});
			classifyList.value=res.data || [];
		}catch(err){
			console.error('getClassify failed', err);
		}
	}
	
	const gopreview=(id)=>{
		uni.setStorageSync("storageClassList",randomList.value);
		uni.navigateTo({
			url:"/pages/preview/preview?id="+id
		})
	}
	
	//分享好友
	onShareAppMessage((e)=>{
		return {
			title:"壁纸",
			path:"/pages/index/index"
		}
	})
	getBanner();
	getDayRandom();
	getNotice();
	getClassify();
</script>

<style lang="scss"scoped>
	.homelayout{
		.banner{
			width:750rpx;
			padding: 30rpx 0;
			swiper{
				width:750rpx;
				height:340rpx;
				&-item{
					width:100%;
					height:100%;
					padding: 0 30rpx;
					image{
						width:100%;
						height: 100%;
						border-radius: 10rpx;
					}
				}
			}
		}
		.notice{
			width:690rpx;
			height:80rpx;
			line-height: 80rpx;
			background: #f9f9f9;
			margin:0 auto;
			border-radius: 80rpx;
			display: flex;
			.left{
				width:140rpx;
				display:flex;
				align-items: center;
				justify-content:center;
				:deep(){
					.uni-icons{
						color:$brand-theme-color !important;
					}
				}
				
				.text{
					color:$brand-theme-color;
					font-weight: 600;
					font-size:28rpx;
				}
			}
			.center{
				flex:1;
				swiper{
					height:100%;
					&-item{
						height: 100%;
						font-size: 30rpx;
						color:#666;
						overflow: hidden;
						white-space:nowrap;
						text-overflow: ellipsis;
					}
				}
			}
			.right{
				width:70rpx;
				display:flex;
				align-items: center;
				justify-content:center;
			}
		}
		.select{
			padding-top: 50rpx;
			.content{
				width:720rpx;
				margin-left: 30rpx;
				margin-top: 30rpx;
				scroll-view{
					white-space: nowrap;
					.box{
						width:200rpx;
						height:430rpx;
						display:inline-block;
						margin-right: 15rpx;
						image{
							width:100%;
							height:100%;
							border-radius: 12rpx;
						}
					}
					.box:last-child{margin-right:30rpx;}
				}
			}
			.date{
				color:$brand-theme-color;
				display:flex;
				align-items: center;
				:deep(){
					.uni-icons{
						color:$brand-theme-color !important;
					}
				}
				.text{
					margin-left:5rpx;
				}
			}
		}
		.theme{
			padding: 50rpx 0;
			.more{
				font-size:32rpx;
				color:#888;
			}
			.content{
				margin-top:30rpx;
				padding:0 30rpx;
				display:grid;
				grid-template-columns: repeat(3,1fr);
				gap:15rpx;
			}
		}
	}
</style>
