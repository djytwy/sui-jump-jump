import { _decorator, Component, Node, Label, macro, Prefab, instantiate } from 'cc';
import { EventDispatcher } from './EventDispatcher';
import { GameData } from './GameData';
import { LogicCtl } from './LogicCtl';
import { Transaction } from "@mysten/sui/transactions";
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils'
import { showAddress } from './utils'
import { packageID, ticketPrice, sliverPool, goldPool, bronzePool, doTransaction, txBlockBrower, suiClient } from './constDev'
import { gameManager } from './gameManager'

const { ccclass, property } = _decorator;
/**
 * 主脚本,挂载canvas上
 * @author 一朵毛山
 * Construct 
 */
@ccclass('MainCtl')
export class MainCtl extends Component {

    //home_page 页面
    @property({ type: Node })
    home_page: Node = null;
    //逻辑层
    @property({ type: LogicCtl })
    logic_ctl: LogicCtl = null;
    //本局得分
    @property({ type: Label })
    score_label: Label = null;
    // ticket on sui chain
    @property({ type: Label })
    ticket: Label = null;
    @property({ type: Label })
    address: Label = null;
    @property({ type: Label })
    ticket_level: Label = null;
    @property({ type: Label })
    pool_balance: Label = null;
    //预制体,tips
    @property({ type: Prefab })
    tips: Prefab = null;

    start() {
        //设置homg page 显示在屏幕中间
        this.home_page?.setPosition(0, 0);
        //注册监听自定义事件 (更新分数)
        EventDispatcher.get_instance().target.on(EventDispatcher.UPDATE_SCORE_LABEL, this.update_score_label, this);
        //注册监听自定义事件 (开始游戏)
        EventDispatcher.get_instance().target.on(EventDispatcher.START_GAME, this.start_game, this);
        //延迟2秒执行自动跳
        this.schedule(this.auto_play, 2, macro.REPEAT_FOREVER, 2);
        this.pool_balance.string = '',
            this.ticket_level.string = ""
        // @ts-ignore tg sdk
        if (window && window.Telegram) {
            // @ts-ignore
            window.Telegram.WebApp.requestFullscreen()
        }
    }

    update(deltaTime: number) {
    }

    /**
     * 更新本局得分
     */
    update_score_label() {
        this.score_label.string = GameData.get_total_score() + "";
    }

    /**
     * 手动开始游戏
     */
    start_game(): void {
        this.unschedule(this.auto_play);
        //设置默认本局得分0
        this.score_label.string = "" + 0;
        //重置游戏数据,游戏状态
        GameData.reset_data();
        //移动和隐藏,home page
        this.home_page.setPosition(-1000, 0);
        this.home_page.active = false;
        //开始游戏,状态为1
        this.logic_ctl?.run_game(1);
    }

    start_game_free(): void {
        this.unschedule(this.auto_play);
        //设置默认本局得分0
        this.score_label.string = "" + 0;
        //重置游戏数据,游戏状态
        GameData.reset_data();
        //移动和隐藏,home page
        this.home_page.setPosition(-1000, 0);
        this.home_page.active = false;
        //开始游戏,状态为1
        this.logic_ctl?.run_game(1);
        window.localStorage.setItem("level", 'free')
        const _address = window.localStorage.getItem("address")
        if (_address) {
            this.address.string = `address: ${showAddress(_address)}`
        }
        this.ticket.string = 'Free mode'
        this.pool_balance.string = '',
            this.ticket_level.string = ""
        gameManager.instance.updateGameMode("free")
    }

    copy_ticket() {
        const ticket = window.localStorage.getItem("ticketObj")
        if (window) {
            window.open(`${txBlockBrower}/object/${ticket}`)
            // window.navigator.clipboard.writeText(ticket).then(() => {
            //     console.log('Copy success: ', ticket);
            // }).catch(err => {
            //     console.error('error: ', err);
            // });
        }
    }

    copy_address() {
        const address = (gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address
        if (window) {
            window.open(`${txBlockBrower}/account/${address}`)
            // window.navigator.clipboard.writeText(address).then(() => {
            //     console.log('Copy success: ', address);
            // }).catch(err => {
            //     console.error('error: ', err);
            // });
        }
    }

    async start_game_gold(): Promise<void> {
        try {
            const txb = new Transaction();
            const goldPrice = window.localStorage.getItem("goldPrice")
            if (goldPrice) {
                const [coin] = txb.splitCoins(txb.gas, [goldPrice]);
                txb.moveCall({
                    target: `${packageID}::Ticket::buyTicket`,
                    arguments: [coin, txb.object(ticketPrice), txb.object(goldPool), txb.object(SUI_CLOCK_OBJECT_ID)]
                })
                txb.setGasBudget(1e7);
                EventDispatcher.get_instance().target.emit(EventDispatcher.SHOW_LOADING);
                const executeRes = await doTransaction(txb)
                if (executeRes.effects.status.status === "failure") {
                    // let item = instantiate(this.tips);
                    // window.alert("Insufficient SUI balance")
                    gameManager.instance.showTips(executeRes.effects.status.error)
                    return
                }
                if (executeRes.digest && executeRes.objectChanges.filter(e => e.type === "created").length > 0) {
                    this.showTicketAndAddress((gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address, executeRes.digest)
                    // this.showTicketAndAddress(window.localStorage.getItem('address'), executeRes.digest)
                    window.localStorage.setItem("ticketLevel", "gold")
                    window.localStorage.setItem("ticketObj", executeRes.effects.created[0].reference.objectId)
                    this.ticket_level.string = "Ticket level:gold"
                    await this.queryPoolBalance(goldPool)
                    gameManager.instance.updateGameMode("pvp")
                    EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
                    this.restart_game()
                }
            } else if (window) {
                window.location.reload()
            }
        } catch (error) {
            EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
            console.log('Errors:', error);
            console.log(error);
        }
    }

    async start_game_sliver(): Promise<void> {
        try {
            const txb = new Transaction();
            const sliverPrice = window.localStorage.getItem("sliverPrice")
            if (sliverPrice) {
                const [coin] = txb.splitCoins(txb.gas, [sliverPrice]);
                txb.moveCall({
                    target: `${packageID}::Ticket::buyTicket`,
                    arguments: [coin, txb.object(ticketPrice), txb.object(sliverPool), txb.object(SUI_CLOCK_OBJECT_ID)]
                })
                txb.setGasBudget(1e7);
                EventDispatcher.get_instance().target.emit(EventDispatcher.SHOW_LOADING);
                const executeRes = await doTransaction(txb)
                if (executeRes.effects.status.status === "failure") {
                    // window.alert("Insufficient SUI balance")
                    gameManager.instance.showTips(executeRes.effects.status.error)
                    return
                }
                if (executeRes.digest && executeRes.objectChanges.filter(e => e.type === "created").length > 0) {
                    // this.showTicketAndAddress(window.localStorage.getItem('address'), executeRes.digest)
                    window.localStorage.setItem("ticketLevel", "sliver")
                    window.localStorage.setItem("ticketObj", executeRes.effects.created[0].reference.objectId)
                    this.ticket_level.string = "Ticket level:sliver"
                    this.showTicketAndAddress((gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address, executeRes.digest)
                    await this.queryPoolBalance(sliverPool)
                    gameManager.instance.updateGameMode("pvp")
                    EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
                    this.restart_game()
                }
            } else if (window) {
                window.location.reload()
            }
        } catch (error) {
            EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
            console.log('Errors:', error);
            console.log(error);
        }
    }

    async start_game_bronze(): Promise<void> {
        try {
            const txb = new Transaction();
            const bronzePrice = window.localStorage.getItem("bronzePrice")
            if (bronzePrice) {
                const [coin] = txb.splitCoins(txb.gas, [bronzePrice]);
                txb.moveCall({
                    target: `${packageID}::Ticket::buyTicket`,
                    arguments: [coin, txb.object(ticketPrice), txb.object(bronzePool), txb.object(SUI_CLOCK_OBJECT_ID)]
                })
                txb.setGasBudget(1e7);
                EventDispatcher.get_instance().target.emit(EventDispatcher.SHOW_LOADING);
                const executeRes = await doTransaction(txb)
                if (!executeRes || executeRes.effects.status.status === "failure") {
                    // window.alert("Insufficient SUI balance")
                    gameManager.instance.showTips(executeRes === undefined ? "Insufficient SUI balance" : executeRes.effects.status.error)
                    EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
                    return
                }
                if (executeRes.digest && executeRes.objectChanges.filter(e => e.type === "created").length > 0) {
                    // this.showTicketAndAddress(window.localStorage.getItem('address'), executeRes.digest)
                    window.localStorage.setItem("ticketLevel", "bronze")
                    console.log(executeRes.effects.created[0].reference.objectId);
                    window.localStorage.setItem("ticketObj", executeRes.effects.created[0].reference.objectId)
                    this.ticket_level.string = 'Ticket level:bronze'
                    this.showTicketAndAddress((gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address, executeRes.digest)
                    await this.queryPoolBalance(bronzePool)
                    gameManager.instance.updateGameMode("pvp")
                    EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
                    this.restart_game()
                }
            } else if (window) {
                window.location.reload()
            }
        } catch (error) {
            EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
            console.log('Errors:', error);
            console.log(error);
        }
    }

    go_to_address() {
        // if (window && window.localStorage.getItem('address')) {
        if (window && ((gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address)) {
            // const address = window.localStorage.getItem('address')
            const address = (gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address
            window.open(`${txBlockBrower}/account/${address}`)
        }
    }

    /**
     * 自动开始游戏
     */
    auto_play() {
        // 状态合法性判断
        if (GameData.get_game_state() == -1) {
            //自动跳
            this.logic_ctl.auto_jump();
        }
    }

    /**
     * 重新开始游戏
     */
    restart_game() {
        this.unschedule(this.auto_play);
        //设置默认本局得分0
        this.score_label.string = "" + 0;
        //重置游戏数据,游戏状态
        GameData.reset_data();
        //移动和隐藏,home page
        this.home_page.setPosition(-1000, 0);
        this.home_page.active = false;
        //开始游戏,状态为1
        this.logic_ctl?.run_game(1);
    }

    /**
     * 购票成功，显示票和账号地址
     */
    showTicketAndAddress(address: string, digest: string) {
        const _length = digest.length
        this.address.string = `address: ${showAddress(address)}`
        this.ticket.string = `Your ticket: ${digest.slice(0, 5)}...${digest.slice(_length - 5, _length)}`
    }

    async queryPoolBalance(pool: string) {
        const res = await suiClient.getObject({
            id: pool,
            options: {
                showContent: true,
                showDisplay: true,
            }
        })
        if (res.data?.content?.dataType === "moveObject") {
            // @ts-ignore
            const balance = `${(Number(res.data.content.fields.balance) / 1e9).toFixed(2)} SUI`
            this.pool_balance.string = `Pool:${balance}`
        }
    }
}

