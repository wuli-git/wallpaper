<template>
	<view class="userLayout pageBg">
		<!-- 个人信息 -->
		<view class="userInfo" v-if="userinfo">
			<view class="avatar">
				<image src="../../commom/images/preview_small.webp" mode="aspectFill"></image>
			</view>
			<view class="ip">FOX</view>
			<view class="address">来自于{{userinfo.address.city}}</view>
		</view>
		<!-- 菜单 -->
		<view class="section">
			<view class="list">
				<navigator url="/pages/classlist/classlist?name=我的下载
				&type=download">
					
				<view class="row">
					<view class="left">
						<uni-icons type="download-filled" size="20"></uni-icons>
						<view class="text">我的下载</view>
					</view>
					<view class="right">
						<view class="text">{{userinfo.downloadSize}}</view>
						<uni-icons type="right" size="15"color="#aaa"></uni-icons>
					</view>
				</view>
				</navigator>
				
				<navigator url="/pages/classlist/classlist?name=我的评分
				&type=score">
				<view class="row">
					<view class="left">
						<uni-icons type="star-filled" size="20"></uni-icons>
						<view class="text">我的评分</view>
					</view>
					<view class="right">
						<view class="text">{{userinfo.scoreSize}}</view>
						<uni-icons type="right" size="15"color="#aaa"></uni-icons>
					</view>
				</view>
				</navigator>
				 
				<view class="row">
					<view class="left">
						<uni-icons type="chatboxes-filled" size="20" ></uni-icons>
						<view class="text">联系客服</view>
					</view>
					<view class="right">
						<uni-icons type="right" size="15"color="#aaa"></uni-icons>
					</view>
					<!-- #ifdef MP -->
					<button open-type="contact">联系客服</button>
					<!-- #endif -->
					<!-- #ifndef MP -->
					<button @click="clickcontact">拨打电话</button>
					<!-- #endif -->
					
				</view>
			</view>
		</view>
		
		<view class="section">
			<view class="list">
				<view class="row">
					<view class="left">
						<uni-icons type="notification-filled" size="20"></uni-icons>
						<view class="text">订阅更新</view>
					</view>
					<view class="right">
						
						<uni-icons type="right" size="15"color="#aaa"></uni-icons>
					</view>
				</view>
				<view class="row">
					<view class="left">
						<uni-icons type="flag-filled" size="20"></uni-icons>
						<view class="text">常见问题</view>
					</view>
					<view class="right">
						
						<uni-icons type="right" size="15"color="#aaa"></uni-icons>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
	import { ref } from 'vue';
	import {apiUserInfo} from "@/api/apis.js"
	const userinfo=ref(null);
	const clickcontact=()=>{
		uni.makePhoneCall({
			phoneNumber: '15078620060' 
		})
	}
	
	const getUserInfo=()=>{
		apiUserInfo().then(res=>{
			userinfo.value=res.data
		})
	}
	getUserInfo();
</script>

<style lang="scss"scoped>
.userLayout{
	.userInfo{
		display:flex;
		align-items: center;
		justify-content:center;
		flex-direction: column;
		padding:50rpx 0;
		.avatar{
			width:160rpx;
			height:160rpx;
			border-radius: 50%;
			overflow:hidden;
			image{
				width:100%;
				height:100%;
			}
		}
		.ip{
			font-size: 44rpx;
			color:#333;
			padding:20rpx 0 5rpx;
		}
		.address{
			font-size: 28rpx;
			color:#aaa;
		}
	}
	.section{
		width:690rpx;
		margin:50rpx auto;
		border:1px solid #eee;
		border-radius: 10rpx;
		box-shadow:0 0 30rpx rgba(0,0,0,0.05);
		.list{
			.row{
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding:0 30rpx;
				height:100rpx;
				border-bottom: 1px solid #eee;
				position: relative;
				background: #fff;
				&:last-child{border-radius:0}
				.left{
					display:flex;
					align-items:center;
					:deep(){
						.uni-icons{
							color:$brand-theme-color !important;
						}
					}
					.text{
						padding:20rpx;
						color:#666;
					}
				}
				.right{
					display:flex;
					align-items: center;
					.text{
						font-size: 28rpx;
						color:#aaa;
					}
				}
				button{
					position:absolute;
					top:0;
					left:0;
					height:100rpx;
					width:100%;
					opacity:0;
				}
			}
		}
	}
}
</style>
