import { _decorator, Component, Node, Label, Color } from 'cc';
import { EventDispatcher } from './EventDispatcher';
import { GameData } from './GameData';
import { LogicCtl } from './LogicCtl'
import { RanklistTop3 } from './RanklistTop3'
import { backendHost, doTransaction, publicKey, txBlockBrower, packageID, gasBudget, bronzePool, sliverPool, goldPool } from './constDev'
import { showAddress } from './utils'
import JSEncrypt from 'jsencrypt'
import blockies from 'blockies-ts'
import { Transaction } from '@mysten/sui/transactions'
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils'
import { gameManager } from './gameManager'
const { ccclass, property } = _decorator;

/**
 * 游戏结束界面,脚本
 * @author 一朵毛山
 * Construct 
 */
@ccclass('OverCtl')
export class OverCtl extends Component {
    //本局分数
    @property({ type: Label })
    total_score: Label = null;
    //历史最高分
    @property({ type: Label })
    history_score: Label = null;
    // 日期
    @property({ type: Label })
    date: Label = null;
    @property({ type: Node })
    home_page: Node = null;
    @property({ type: Node })
    btn_get_bonus: Node = null;
    @property({ type: Node })
    btn_upload: Node = null;
    @property({ type: Node })
    btn_redirect_upload: Node = null;
    @property({ type: Node })
    btn_redirect_bonus: Node = null;
    @property({ type: Label })
    text_redirect_bonus: Label = null;
    // 逻辑层脚本，主要用于链上兑换票
    @property({ type: LogicCtl })
    logic_ctl: LogicCtl = null;
    // 上传成功后跳转浏览器的链接
    redirectlinkUpload: string = '';
    // 获取 bonus成功后跳转浏览器的链接
    redirectlinkBonus: string = '';
    // top3 控制脚本
    @property({ type: RanklistTop3 })
    top3_ctl: RanklistTop3 = null;
    // rank list
    public rankList: Array<{ address: string, scores: string }> = []
    // congratulation 动画
    @property({ type: Node })
    congratulationAnima: Node = null;
    // show more button:
    @property({ type: Node })
    showMore: Node = null;


    start() {
        //注册打开游戏结束界面事件
        EventDispatcher.get_instance().target.on(EventDispatcher.SHOW_OVER_WINDOW_PVP, this.show, this);
        this.node.active = false;
    }

    async uploadToRank() {
        try {
            const crypt = new JSEncrypt()
            crypt.setKey(publicKey)
            const now = new Date()
            const formattedDate = now.toISOString().split('T')[0];
            // 格式: 分数-级别-时间
            let data = `${this.total_score.string}_${this.logic_ctl.ticketLevel}_${formattedDate}`
            const encodeData = crypt.encrypt(data)
            EventDispatcher.get_instance().target.emit(EventDispatcher.SHOW_LOADING);
            const res = await fetch(`${backendHost}/addScoresToTable`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json;charset=utf-8',
                },
                body: JSON.stringify({
                    // "address": window.localStorage.getItem('address'),
                    "address": (gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address,
                    "data": encodeData,
                }),
            })
            const res_json = await res.json()
            EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
            if (res_json.success) {
                gameManager.instance.showTips("Upload scores success !", new Color(26, 189, 110, 255))
                this.redirectlinkUpload = `${txBlockBrower}/txblock/${res_json.digest}`
                console.log(res_json.digest);
                console.log('Scores upload success !');
                this.btn_upload.active = false;
                this.btn_redirect_upload.active = true;
            } else {
                gameManager.instance.showTips("You have same scores today !")
                console.log('Scores upload fail');
            }
        } catch (error) {
            gameManager.instance.showTips("Upload error please try again!")
            EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
            console.log(error);
        }
    }

    async getUploadReceipt() {
        if (window) {
            window.open(`${this.redirectlinkUpload}`)
        }
    }

    async get_bonus() {
        EventDispatcher.get_instance().target.emit(EventDispatcher.SHOW_LOADING);
        const successObj = await this.tryFiveTimesGetBonus()
        EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
        if (successObj) {
            this.redirectlinkBonus = `${txBlockBrower}/txblock/${successObj.hash}`
            this.text_redirect_bonus.string = `You bouns: \n ${successObj.amount} Sui`
            console.log('bonus hash:', successObj.hash);
            this.btn_get_bonus.active = false
            this.btn_redirect_bonus.active = true
            window.localStorage.removeItem("ticketObj")
            window.localStorage.removeItem("ticketLevel")
            setTimeout(() => {
                this.congratulationAnima.active = true
            }, 800)
            setTimeout(() => {
                this.congratulationAnima.active = false
            }, 2300)
        } else {
            gameManager.instance.showTips("Please try agin later")
            console.log('try again');
        }
    }

    async getBonusReceipt() {
        if (window) {
            window.open(`${this.redirectlinkBonus}`)
        }
    }

    async getRankList() {
        try {
            let level = window.localStorage.getItem("ticketLevel")
            const res = await fetch(`${backendHost}/getRank?level=${level}`)
            this.rankList = await res.json()
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    /**
     * 显示游戏结束界面
     */
    show(): void {
        this.scheduleOnce(() => {
            this.node.setPosition(0, 0);
            this.node.active = true;
            this.btn_get_bonus.active = true;
            this.btn_upload.active = true;
            this.btn_redirect_bonus.active = false;
            this.btn_redirect_upload.active = false;
            this.total_score.string = GameData.get_total_score() + "";
            let histroy = localStorage.getItem("history_score");
            if (!histroy) {
                histroy = "0";
            }
            let self = this
            this.getRankList().then(r => {
                self.history_score.string = histroy;
                if (self.rankList.length > 1) {
                    self.top3_ctl.showTop3(self.rankList.slice(0, 3).map((e, i) => ({
                        scores: e.scores,
                        address: showAddress(e.address, 4),
                        id: i,
                        url: blockies.create({ seed: e.address }).toDataURL(),
                        rank: i + 1,
                        isYou: ((gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address).toLowerCase() === (e.address).toLowerCase() ? "You" : null
                    })))
                } else {
                    this.showMore.active = false
                    self.top3_ctl.showTop3([{
                        address: '--',
                        scores: '',
                        id: 1,
                        url: '',
                        rank: 0,
                        isYou: null
                    }])
                }
            })
        }, 0.5);
    }

    update(deltaTime: number) {

    }
    /**
     * 重新开始游戏
     */
    restart() {
        //隐藏该界面
        this.node.setPosition(-1000, 0);
        this.node.active = false;
        //设置homg page 显示在屏幕中间
        this.home_page.active = true;
        this.home_page?.setPosition(0, 0);
    }

    /**
     * 获取链上的bonus
     * @returns 
     */
    async getTicketBonusOne() {
        try {
            const txb = new Transaction();
            // const levelObj = this.ticketLevel === "bronze" ? bronzePool : this.ticketLevel === "sliver" ? sliverPool : goldPool
            const ticketObj = window.localStorage.getItem("ticketObj")
            const level = window.localStorage.getItem("ticketLevel")
            const levelObj = level === "bronze" ? bronzePool : level === "sliver" ? sliverPool : goldPool
            console.log(ticketObj, levelObj);
            txb.moveCall({
                target: `${packageID}::distribute::distributeBonus`,
                arguments: [
                    txb.pure.u64(200),
                    txb.object(ticketObj),
                    txb.object(levelObj),
                    // random is 0x8
                    txb.object('0x8'),
                    // clock is 0x6,
                    txb.object(SUI_CLOCK_OBJECT_ID),
                ]
            })
            txb.setGasBudget(gasBudget)
            const res = await doTransaction(txb)
            // const res = await suiClient.signAndExecuteTransaction({
            //     transaction: txb,
            //     signer: _keyPair,
            //     options: {
            //         showEffects: true,
            //         showBalanceChanges: true
            //     }
            // })
            console.log('get Bonus:', res.digest);
            return {
                hash: res.digest,
                amount: (Number(res.balanceChanges[0].amount) / 1e9).toFixed(3)
            }
        } catch (error) {
            return 'error'
        }
    }

    async tryFiveTimesGetBonus(): Promise<{
        hash: string
        amount: string
    } | undefined> {
        const maxAttempts = 5;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            const result = await this.getTicketBonusOne();
            if (result !== 'error') {
                return result; // 如果成功，返回结果
            }
            console.log(`Attempt ${attempt} failed, retrying...`);
        }
        return undefined; // 如果所有尝试都失败，返回 undefined
    }
}
