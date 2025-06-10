import { _decorator, Component, Node, Sprite, Color, Button, EventTouch, resources, SpriteFrame, Label } from 'cc';
import { EventDispatcher } from './EventDispatcher';
import { Transaction } from '@mysten/sui/transactions'
import { gameManager } from './gameManager'
import { SKIN_LIST, doTransaction, packageID, skinInfo } from './constDev'

const { ccclass, property } = _decorator;


@ccclass('shopCtl')
export class shopCtl extends Component {

    @property({ type: Node })
    skin1: Node = null;

    /**
     * recycle bottom jumper: skin2
     * Cat jumper: skin3
     * Spring jumper: skin4
     */
    @property({ type: Node })
    skin2: Node = null;

    @property({ type: Node })
    skin3: Node = null;

    @property({ type: Node })
    skin4: Node = null;

    @property({ type: Node })
    close: Node = null;

    @property({ type: Label })
    skin_tips: Node;


    start() {
        //注册loading事件
        EventDispatcher.get_instance().target.on(EventDispatcher.SHOW_SHOP, this.show, this);
        EventDispatcher.get_instance().target.on(EventDispatcher.CLOSE_SHOP, this.hidden, this);
        if (window && (window.localStorage.getItem("slushConnected") || window.localStorage.getItem("gameToken"))) {
            this.skin_tips.active = false
        } else {
            this.skin_tips.active = true
        }
        this.node.active = false;
    }

    update(deltaTime: number) {

    }

    active(touch: EventTouch, jumperName: string) {
        const skinConfig = this.getConfig()
        for (let item in skinConfig) {
            let checked = skinConfig[item].node.getChildByName('checked')
            checked.active = false
        }
        const activeNode = skinConfig[jumperName]
        const checked = activeNode.node.getChildByName('checked')
        checked.active = true
        window.localStorage.setItem("skin", jumperName)
        EventDispatcher.get_instance().target.emit(EventDispatcher.RELOAD_GAME_SKIN, -1, jumperName);
    }

    show(): void {
        this.scheduleOnce(() => {
            this.node.setPosition(0, 0);
            this.node.active = true;
            this.loadUserNFT()
        }, 0.5);
    }

    hidden(): void {
        this.scheduleOnce(() => {
            this.node.active = false;
        }, 0.5);
    }

    loadUserNFT() {
        try {
            if (gameManager.instance.skinInfo && gameManager.instance.skinInfo.length > 0) {
                const skinSet = new Set(gameManager.instance.skinInfo);
                const hasSkinList = SKIN_LIST.filter(x => skinSet.has(x));
                const skinConfig = this.getConfig();
                // unlock user own skins:
                hasSkinList.forEach(skinName => {
                    const config = skinConfig[skinName];
                    if (config) {
                        const { node, color } = config;
                        const sprite = node.getComponent(Sprite);
                        if (sprite) {
                            sprite.color = color;
                        }
                        const button = node.getComponent(Button);
                        if (button) {
                            button.interactable = true
                        }
                        const lock = node.getChildByName("lock");
                        const purchaseBtn = node.getChildByName("purchaseBtn");
                        if (lock) lock.active = false;
                        if (purchaseBtn) purchaseBtn.active = false;
                    }
                });

                // init user choiced skin in store:
                if (window && hasSkinList.includes(window.localStorage.getItem("skin"))) {
                    const config = skinConfig[window.localStorage.getItem("skin")];
                    for (let item in skinConfig) {
                        let checked = skinConfig[item].node.getChildByName('checked')
                        checked.active = false
                    }
                    if (config) {
                        const { node, color } = config;
                        const checkedNode = node.getChildByName("checked");
                        checkedNode.active = true
                    }
                } else {
                    const defaultChecked = skinConfig['defaultJumper'].node.getChildByName("checked")
                    defaultChecked.active = true
                }
            }
        } catch (error) {
            console.error('加载用户NFT时发生错误:', error);
        }
    }

    getConfig() {
        return {
            "defaultJumper": {
                node: this.skin1,
                color: new Color(255, 255, 255, 255),
                fileName: 'default_jumper',
                name: 'Default jumper',
            },
            "recycleBottleJumper": {
                node: this.skin2,
                color: new Color(255, 255, 255, 255),
                fileName: 'recycleBottleJumper',
                name: 'Recycle bottle jumper'
            },
            "catJumper": {
                node: this.skin3,
                color: new Color(255, 255, 255, 255),
                fileName: 'catJumper',
                name: 'Cat jumper'
            },
            "springJumper": {
                node: this.skin4,
                color: new Color(255, 255, 255, 255),
                fileName: 'springJumper',
                name: 'Spring jumper'
            },
            // onChain: {
            //     "Default jumper": {
            //         node: this.skin1,
            //         color: new Color(255, 255, 255, 255),
            //         fileName: 'default',
            //         name: 'Default jumper'
            //     },
            //     "Cat jumper": {
            //         node: this.skin2,
            //         color: new Color(255, 255, 255, 255),
            //         fileName: 'jumper',
            //         name: 'Cat jumper'
            //     },
            //     "Spring jumper": {
            //         node: this.skin3,
            //         color: new Color(255, 255, 255, 255),
            //         fileName: 'jumper2',
            //         name: 'Spring jumper'
            //     }
            // },
            // local: {
            //     "SkinBtn1": {
            //         node: this.skin1,
            //         color: new Color(255, 255, 255, 255),
            //         fileName: 'default',
            //         name: 'Default jumper'
            //     },
            //     "SkinBtn2": {
            //         node: this.skin2,
            //         color: new Color(255, 255, 255, 255),
            //         fileName: 'jumper',
            //         name: 'Cat jumper'
            //     },
            //     "SkinBtn3": {
            //         node: this.skin3,
            //         color: new Color(255, 255, 255, 255),
            //         fileName: 'jumper2',
            //         name: 'Spring jumper'
            //     }
            // }
        };
    }

    async purchaseSkin(touch: EventTouch, data: string) {
        try {
            EventDispatcher.get_instance().target.emit(EventDispatcher.SHOW_LOADING);
            const txb = new Transaction();
            const [coin] = txb.splitCoins(txb.gas, [Number(gameManager.instance.skinPrice[data].price)]);
            txb.moveCall({
                target: `${packageID}::skin_store::mint`,
                arguments: [
                    txb.pure.string(data),
                    txb.pure.string(gameManager.instance.skinPrice[data].image_url),
                    coin,
                    txb.object(skinInfo)
                ]
            })
            txb.setGasBudget(1e7)
            const res = await doTransaction(txb)
            if (res.effects.status.status === "success") {
                gameManager.instance.showTips("Buy skin success !", new Color(26, 189, 110, 255))
                window.location.reload()
            }
            EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
        } catch (error) {
            console.log(error);
        }
    }
}

