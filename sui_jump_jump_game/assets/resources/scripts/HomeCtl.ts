import { _decorator, assetManager, Component, debug, ImageAsset, Label, Node, Sprite, SpriteFrame, Texture2D, Prefab } from 'cc';
const { ccclass, property } = _decorator;
import { googleLoginRedirectLink, googleClientId, suiClient, ambrusHost, ticketPrice, packageID, backendHost, doTransaction } from './constDev'
import { formatAddress } from '@mysten/sui/utils'
import { Transaction } from '@mysten/sui/transactions'
import blockies from 'blockies-ts'
import { EventDispatcher } from './EventDispatcher';
import { getWallets } from '@mysten/wallet-standard'
import { gameManager } from './gameManager'

@ccclass('Home')
export class Home extends Component {

    @property({ type: Node })
    button_start_free: Node = null;

    @property({ type: Node })
    button_start_pvp: Node = null;

    @property({ type: Node })
    button_start_google: Node = null;

    @property({ type: Node })
    button_buy_gold_ticket: Node = null;

    @property({ type: Node })
    button_buy_sliver_ticket: Node = null;

    @property({ type: Node })
    button_buy_bronze_ticket: Node = null;

    @property({ type: Node })
    button_close: Node = null;

    @property({ type: Label })
    zk_login_tips: Label = null

    @property({ type: Node })
    button_user_address: Node = null

    @property({ type: Sprite })
    userIcon: Sprite = null;

    @property({ type: Node })
    button_connect_wallet: Node = null

    @property({ type: Node })
    button_skin_store: Node = null;

    @property({ type: Node })
    button_disconnect: Node = null;

    async start(): Promise<void> {
        this.button_buy_sliver_ticket.active = false;
        this.button_buy_gold_ticket.active = false;
        this.button_buy_bronze_ticket.active = false;
        this.button_start_google.active = false;
        this.button_connect_wallet.active = false;
        this.button_start_pvp.active = false;
        this.button_disconnect.active = false;
        this.button_close.active = false;
        this.button_user_address.active = false;
        this.button_start_free.active = true;
        this.zk_login_tips.string = 'Play with google';

        EventDispatcher.get_instance().target.emit(EventDispatcher.SHOW_LOADING);
        // @ts-ignore
        if (window.Telegram) {
            // @ts-ignore
            startParams = window.Telegram.WebApp.initDataUnsafe.start_param as string;
            // zk login 通过epoch 是否存储来判断
        } else if (window.location.search.length > 1) {
            const game_token = getGameToken()
            if (game_token.length < 1) {
                this.button_connect_wallet.active = true;
                this.button_start_google.active = true;
                return
            } else {
                this.saveZKlogin({ game_token: game_token })
            }
            await this.initWithSuiZK()
        } else if (window && window.localStorage.getItem('game_token')) {
            await this.initWithSuiZK()
        } else if (window.localStorage.getItem("slushConnected")) {
            // sui wallet 连接:
            this.button_start_pvp.active = true;
            this.button_disconnect.active = true;
            this.getTicketPrice()
            await this.connectWallet()
        } else {
            this.button_connect_wallet.active = true;
            this.button_start_google.active = true;
            this.clearZKlogin()
        }
        EventDispatcher.get_instance().target.emit(EventDispatcher.CLOSE_LOADING);
    }

    async googleBtnClk(): Promise<void> {
        this.zk_login_tips.string = "Loging with google..."
        const res = await fetch(`${ambrusHost}/account/login/nonce?origin=suiJump`, {
            method: "GET"
        })
        const nonce: { data: string, statusCode: number } = await res.json()
        const _params = new URLSearchParams({
            client_id: googleClientId,
            redirect_uri: googleLoginRedirectLink,
            response_type: "id_token",
            scope: "openid email profile",
            nonce: nonce.data
        });
        const loginURL = `https://accounts.google.com/o/oauth2/v2/auth?${_params}`;
        // @ts-ignore  for tg:
        if (window.Telegram) {
            // @ts-ignore  for tg:
            window.Telegram.WebApp.openLink(loginURL);
        } else {
            window.location.href = loginURL;
        }
        this.zk_login_tips.fontSize = 20
        this.zk_login_tips.string = "Try again with google"
    }

    async pvpBtnClk() {
        this.button_buy_sliver_ticket.active = true;
        this.button_buy_gold_ticket.active = true;
        this.button_buy_bronze_ticket.active = true;
        this.button_start_free.active = false;
        this.button_start_pvp.active = false;
        this.button_disconnect.active = false;
        this.button_close.active = true;
        this.button_skin_store.active = false;
    }

    backBtnClk() {
        this.button_buy_sliver_ticket.active = false;
        this.button_buy_gold_ticket.active = false;
        this.button_buy_bronze_ticket.active = false;
        this.button_start_free.active = true;
        this.button_start_pvp.active = true;
        this.button_disconnect.active = true;
        this.button_close.active = false;
        this.button_skin_store.active = true;
    }

    update(deltaTime: number) {

    }

    // 获取到 game token 后获取zkinfo 从而生成keypair
    async getZkInfo() {
        type ZkInfoProps = {
            data: TData;
            statusCode: number;
            message: string;
            totalPage: number;
        }

        type TData = {
            "id_token": string;
            salt: string;
            epoch: string;
            zkproof: string;
            "secret_key": string;
            address: string;
        }
        if (window && window.localStorage.getItem('game_token')) {
            const game_token = window.localStorage.getItem('game_token')
            const res = await fetch(`${ambrusHost}/account/blockus/user/zkInfo`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${game_token}`
                }
            })
            const ZKInfo: ZkInfoProps = await res.json()
            // 判断 zk 是否过期
            const system = await suiClient.getLatestSuiSystemState()
            if (Number(system.epoch) >= Number(ZKInfo.data.epoch)) {
                this.clearZKlogin()
                this.button_start_google.active = true;
                this.button_connect_wallet.active = true;
                return;
            } else {
                this.button_start_pvp.active = true;
                this.button_disconnect.active = true;
                // this.saveZKlogin({
                //     address: ZKInfo.data.address,
                //     privateKey: ZKInfo.data.secret_key,
                //     zkp: ZKInfo.data.zkproof,
                //     epoch: ZKInfo.data.epoch,
                //     salt: ZKInfo.data.salt,
                //     game_token: ZKInfo.data.id_token
                // })
                gameManager.instance.updateZkInfo({
                    address: ZKInfo.data.address,
                    privateKey: ZKInfo.data.secret_key,
                    zkp: ZKInfo.data.zkproof,
                    epoch: ZKInfo.data.epoch,
                    salt: ZKInfo.data.salt,
                    game_token: ZKInfo.data.id_token
                })
                await gameManager.instance.querySkin()
            }
        }
    }

    // 获取tickets的价格
    async getTicketPrice() {
        const priceRes = await suiClient.getObject({
            id: ticketPrice,
            options: {
                showType: true,
                showContent: true,
                showOwner: true,
                showPreviousTransaction: true,
                showStorageRebate: true,
                showDisplay: true,
            },
        })
        if (window && window.localStorage) {
            // @ts-ignore
            const gold_price = priceRes.data?.content.fields.goldPrice
            // @ts-ignore
            const sliver_price = priceRes.data?.content.fields.sliverPrice
            // @ts-ignore
            const bronze_price = priceRes.data?.content.fields.bronzePrice
            // @ts-ignore
            window.localStorage.setItem('bronzePrice', bronze_price)
            // @ts-ignore
            window.localStorage.setItem('sliverPrice', sliver_price)
            // @ts-ignore
            window.localStorage.setItem('goldPrice', gold_price)

            const gold_price_node = this.button_buy_gold_ticket.getChildByName("price").getComponent(Label)
            const sliver_price_node = this.button_buy_sliver_ticket.getChildByName("price").getComponent(Label)
            const bronze_price_node = this.button_buy_bronze_ticket.getChildByName("price").getComponent(Label)

            // @ts-ignore
            gold_price_node.string = (Number(gold_price) / 1e9).toFixed(1)
            // @ts-ignore
            sliver_price_node.string = (Number(sliver_price) / 1e9).toFixed(1)
            // @ts-ignore
            bronze_price_node.string = (Number(bronze_price) / 1e9).toFixed(1)
        }
    }

    // 链上信息初始化
    async initWithSuiZK() {
        await this.getTicketPrice()
        await this.getZkInfo()
        this.showUserZkAddress()
    }

    // zklogin 成功保存zk数据
    saveZKlogin(props: { epoch?: string, address?: string, game_token?: string, zkp?: string, privateKey?: string, salt?: string }) {
        if (window && window.localStorage) {
            const keys = Object.keys(props)
            keys.forEach(e => {
                // if (e === "epoch") {
                //     window.localStorage.setItem(`${e}`, `${Number(props[e]) + 25}`)
                // } else {
                //     window.localStorage.setItem(`${e}`, props[e])
                // }
                window.localStorage.setItem(`${e}`, props[e])
            })
        }
    }

    // 清除本地存储信息
    clearZKlogin() {
        if (window && window.localStorage) {
            window.localStorage.removeItem("epoch")
            window.localStorage.removeItem("address")
            window.localStorage.removeItem("game_token")
            window.localStorage.removeItem("zkp")
            window.localStorage.removeItem("privateKey")
        }
    }

    showUserZkAddress() {
        this.button_user_address.active = true
        const address = gameManager.instance.zkGameInfo.address
        // const address = window.localStorage.getItem('address')
        const showAddress = `${address.slice(0, 4)} ... ${address.slice(address.length - 4, address.length)}`
        this.loadUserIcon(address)
        this.button_user_address.getChildByName('user_address').getComponent(Label).string = `${showAddress}`
    }

    // 连接浏览器的钱包(slush)
    async connectWallet() {
        try {
            const availableWallets = getWallets().get();
            let wallet = availableWallets.find(e => e.name === "Slush")
            if (wallet === undefined) {
                // 特殊处理:
                // @ts-ignore
                availableWallets[0].forEach(_wallet => {
                    if (_wallet.name === "Slush") {
                        wallet = _wallet
                    }
                });
            }
            if (wallet === undefined) {
                // 特殊处理:
                // @ts-ignore
                availableWallets[0].forEach(_wallet => {
                    if (_wallet.name === "Slush") {
                        wallet = _wallet
                    }
                });
            }
            // @ts-ignore
            await wallet.features['standard:connect'].connect();
            if (wallet.accounts.length > 0) {
                // 通常第一个就是当前 active 的地址
                const address = wallet.accounts[0].address
                this.button_user_address.active = true
                this.loadUserIcon(address)
                this.button_user_address.getChildByName('user_address').getComponent(Label).string = `${formatAddress(address)}`
                window.localStorage.setItem("slushConnected", 'isConnected')
                gameManager.instance.updateWalletInfo({
                    address
                })
                // window.localStorage.setItem("address", address)
                this.button_start_google.active = false
                this.button_connect_wallet.active = false
                this.button_start_pvp.active = true
                this.button_disconnect.active = true
                await gameManager.instance.querySkin()
                // this.transferSui()
            }
            // @ts-ignore
            const unsubscribe = wallet.features['standard:events'].on('change', (event) => {
                // event.accounts 是当前可用账户列表
                if (event.accounts.length === 0 || event.accounts[0] !== gameManager.instance.walletInfo.address) {
                    console.log('User change or disconnect ...');
                    // 这里可以做 UI 更新或清理状态
                    setTimeout(() => {
                        window.localStorage.removeItem("address")
                        window.localStorage.removeItem("slushConnected")
                        window.location.reload()
                    }, 1000)
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    async disconnectWallet() {
        try {
            if (window.localStorage.getItem("game_token")) {
                this.clearZKlogin()
                window.location.href = '/'
                return
            }
            const availableWallets = getWallets().get();
            let wallet = availableWallets.find(e => e.name === "Slush")
            if (wallet === undefined) {
                // 特殊处理:
                // @ts-ignore
                availableWallets[0].forEach(_wallet => {
                    if (_wallet.name === "Slush") {
                        wallet = _wallet
                    }
                });
            }
            // @ts-ignore
            await wallet.features['standard:disconnect'].disconnect();
        } catch (error) {
            console.log('meet some errors ');
        }
    }

    loadUserIcon(address: string) {
        let self = this
        const base64String = blockies.create({ seed: address }).toDataURL()
        const img = new Image();
        const texture = new Texture2D();
        img.src = base64String;
        img.onload = function () {
            texture.reset({
                width: img.width,
                height: img.height
            })
            texture.uploadData(img, 0, 0)
            // texture.loaded = true
            const sp = new SpriteFrame();
            sp.texture = texture;
            self.userIcon.spriteFrame = sp
        }
    }

    async transferSui() {
        const tx = new Transaction()
        const [coin] = tx.splitCoins(tx.gas, [1e7])
        tx.transferObjects([coin], '0xd8812f6b90e382096476211366155790147fc6defd59b87b85645e8f675a8af3')
        const res = await doTransaction(tx)
        console.log('transferSui: ', res.digest);
    }

    showShop() {
        EventDispatcher.get_instance().target.emit(EventDispatcher.SHOW_SHOP);
    }
}

const getGameToken = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    return token
}
