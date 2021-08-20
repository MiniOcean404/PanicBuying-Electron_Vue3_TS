import { addGoodsToCart } from 'api/card';
import { computed, defineComponent, toRaw } from 'vue';
import { cycleUser } from 'common/utils';
import { ElNotification } from 'element-plus';
import { UserInfo } from 'types/store';
import { useStore } from 'vuex';
import './index.scss';

enum tip {
	Spike = '该商品是预约抢购商品，需要自行加入到购物车，并确保购物车里不含其他可提交商品',
	Reservation = '该商品是秒杀商品，会自动提交订单'
}

const actions = new Map([
	['Spike', 'orderSubmit'],
	['Reservation', 'killOrderSubmit']
])

export default defineComponent({
	name: 'TaskTable',
	props: {
		data: {
			type: Array,
			default: []
		}
	},
	data() {
		return {
			times: []
		}
	},
	setup(props: any, context: any) {
		const store = useStore()
		const allUser = computed(() => store.getters['user/userInfo'])
		const user = toRaw(allUser.value)

		function button(ButtonType: string, scope: any) {
			const index: number = scope.$index
			const { skuId, buyNumber, buyDate, taskType } = toRaw(scope.row)

			// check({
			// 	condition: ButtonType === '开始抢购' && allUser.value.length <= 0,
			// 	message: '还没有添加账号，添加账号后再进行抢购...'
			// })

			switch (ButtonType) {
				case '开始抢购':
					cycleUser(user, startGrab, skuId, buyNumber, taskType, buyDate)

					// ElNotification({ type: 'success', title: '成功', message: tip[taskType] })
					break
				case '删除':
					store.commit('task/REMOVE_SOME_ONE', index)
					ElNotification({ type: 'success', title: '成功', message: '删除成功' })
					break
			}
		}

		return {
			button
		}
	},
	render() {
		const { data, button } = this

		const shopImg = {
			default: (scope: any) => {
				return <img class="shop-img" alt="" src={scope.row.imageSrc} />
			}
		}

		const startTask = {
			default: (scope: any) => {
				return (
					<el-button type="primary" onClick={button.bind(this, '开始抢购', scope)}>
						开始抢购
					</el-button>
				)
			}
		}

		const deleteTask = {
			default: (scope: any) => {
				return (
					<el-button type="primary" onClick={button.bind(this, '删除', scope)}>
						删除
					</el-button>
				)
			}
		}

		return (
			<div>
				<el-table data={data} style="width: 100%" height="90%" stripe={true} border={true}>
					<el-table-column label="序号" type="index" width="50" align="center" />

					<el-table-column label="SkuId" width="120" prop="skuId" align="center" />

					<el-table-column label="商品图" width="100" align="center" v-slots={shopImg} />

					<el-table-column label="标题" prop="name" align="center" />

					<el-table-column label="价格" prop="shopPrice" width="100" align="center" />

					<el-table-column label="库存状况" prop="shopStoreState" width="80" align="center" />

					<el-table-column label="时间" prop="buyDate" width="200" align="center" />

					<el-table-column width="120" v-slots={startTask} />

					<el-table-column width="100" v-slots={deleteTask} />
				</el-table>
			</div>
		)
	}
})

function startGrab(u: UserInfo, ...arg: object[]) {
	console.log(arg)
	if (Date.now() >= +new Date()) {
		// createOrder(u, skuId, buyNumber, taskType)
	} else {
		ElNotification({ type: 'info', title: '成功', message: `账号${u.name}抢购中，还未到抢购时间` })
	}

	// let taskTiming = setInterval(() => {
	// }, 10000)

	// this.times.push({
	//   pinId: u.pinId,
	//   skuId,
	//   // taskTiming
	// })
}

async function createOrder(u: UserInfo, skuId: string, buyNumber: number, taskType: string) {
	// const buyInfo = await getBuyInfo(u.cookie, skuId, buyNumber)

	addGoodsToCart(u.cookie, skuId, buyNumber).then((res: any) => {
		console.log(res, '下单接口返回')
	})

	const api: string | undefined = actions.get(taskType)
	let res: any
	if (api !== undefined) {
		// res = await taskApi[api](u.cookie, skuId, buyNumber, buyInfo)
	}

	if (res && res.success) {
		// this.stopTaskByAccount(u.pinId, skuId)

		ElNotification({
			type: 'success',
			title: '成功',
			message: `恭喜,账号「${u.name}」已抢到,此账号不再参与本轮抢购~`
		})
	} else if (res && res.resultCode === 600158) {
		this.stopTaskBySku(skuId)

		ElNotification({
			type: 'info',
			title: '提示',
			message: `商品库存已空，无法继续抢购,已清除当前任务相关的定时器`
		})
	} else {
		ElNotification({
			type: 'info',
			title: '提示'
			// message: res.message
		})
	}
}
