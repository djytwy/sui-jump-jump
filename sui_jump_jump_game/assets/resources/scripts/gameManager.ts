import { _decorator, Component, Node, Prefab, instantiate, director, Color } from 'cc';
import { suiClient, SKIN_LIST, packageID, skinInfo } from './constDev';
import { EventDispatcher } from './EventDispatcher'
const { ccclass, property } = _decorator;

type ZkGameInfoProps = {
  address: string,
  privateKey: string,
  zkp: string,
  epoch: string,
  salt: string,
  game_token: string
}

type WalletConnectProps = {
  address: string
}

type skinPriceProps = {
  [key: string]: {
    price: string,
    image_url: string
  };
}

@ccclass('TipsContent')
export class TipsContent {
  @property
  text = ''
  @property
  color = new Color(235, 38, 38, 255)
}

@ccclass('gameManager')
export class gameManager extends Component {
  // 静态实例引用
  private static _instance: gameManager = null;

  // ZK连接的数据
  public zkGameInfo: ZkGameInfoProps = null;

  // 用户自己钱包的数据
  public walletInfo: WalletConnectProps = null;

  public skinInfo: Array<string> = null;

  public skinPrice: skinPriceProps = {};

  public gameMode: "free" | "pvp" = "free"

  /**
   * 全局的 tips
   */
  @property(Prefab)
  tipsPrefab: Prefab = null;

  // 玩家钱包最近的一张 ticket
  public ticket: {
    level: "gold" | "sliver" | "bronze" | null,
    objId: string
  } = null;

  protected onLoad(): void {
    // 实现单例逻辑
    if (gameManager._instance === null) {
      gameManager._instance = this;
      director.addPersistRootNode(this.node);
    } else {
      this.node.destroy(); // 重复实例则销毁
    }
  }

  start() {

  }

  update(deltaTime: number) {

  }

  // 获取单例实例
  public static get instance(): gameManager {
    return this._instance;
  }

  // 加分方法示例
  public addScore(points: number): void {
    // this.totalScore += points;
  }

  public updateZkInfo(zkInfo: ZkGameInfoProps) {
    this.zkGameInfo = {
      address: zkInfo.address,
      privateKey: zkInfo.privateKey,
      zkp: zkInfo.zkp,
      epoch: zkInfo.epoch,
      salt: zkInfo.salt,
      game_token: zkInfo.game_token
    }
  }

  public updateWalletInfo(walletInfo: WalletConnectProps) {
    this.walletInfo = walletInfo
  }

  // 获取链上的 NFT 信息
  public async querySkin() {
    type data = {
      name: string,
      image_url: string
    }
    let address = ''
    if (window && window.localStorage.getItem("slushConnected")) {
      address = this.walletInfo.address
    } else {
      address = this.zkGameInfo.address
    }
    const res = await suiClient.getOwnedObjects({
      owner: address,
      options: {
        showContent: true
      },
      filter: {
        StructType: `${packageID}::skin_store::Skin`
      }
    })
    const skin_list = res.data.map(e => {
      if (e.data?.content && e.data?.content.dataType === "moveObject") {
        const fields = e.data?.content.fields as data
        return fields.name
      }
    })
    this.skinInfo = ["defaultJumper", ...skin_list]
    this.setJumper()
    const resPrice = await suiClient.getObject({
      id: skinInfo,
      options: {
        showContent: true
      }
    })
    if (resPrice.data?.content.dataType === "moveObject") {
      // @ts-ignore
      resPrice.data?.content.fields.name_list.forEach((e, i) => {
        // @ts-ignore
        this.skinPrice[e] = {
          // @ts-ignore
          price: resPrice.data?.content.fields.price_list[i],
          // @ts-ignore
          image_url: resPrice.data?.content.fields.skin_list[i],
        }

      })
    }
  }

  setJumper() {
    const skinSet = new Set(this.skinInfo);
    const skinConfig = this.getSkinConfig()
    const hasSkinList = SKIN_LIST.filter(x => skinSet.has(x));
    if (window && hasSkinList.includes(window.localStorage.getItem("skin"))) {
      const config = skinConfig[window.localStorage.getItem("skin")];
      if (config) {
        EventDispatcher.get_instance().target.emit(EventDispatcher.RELOAD_GAME_SKIN, -1, config.fileName);
      }
    }
  }

  getSkinConfig() {
    return {
      "defaultJumper": {
        fileName: 'defaultJumper',
        name: 'Default jumper',
      },
      "recycleBottleJumper": {
        fileName: 'recycleBottleJumper',
        name: 'Recycle bottle jumper'
      },
      "catJumper": {
        fileName: 'catJumper',
        name: 'Cat jumper'
      },
      "springJumper": {
        fileName: 'springJumper',
        name: 'Spring jumper'
      },
    };
  }

  /**
   * 判断玩家买的什么票，从而显示不同的 game over 并兑换票获取 bonus
   */
  async get_player_ticket(): Promise<undefined | "gold" | "sliver" | "bronze"> {
    const objList = await suiClient.getOwnedObjects({
      owner: (gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address,
      // owner: window.localStorage.getItem('address'),
      options: {
        showType: true,
        showContent: true
      }
    })
    // 获取一张最近时间购买的票
    const tickets = objList.data.filter(e => e.data.type === `${packageID}::Ticket::Ticket`)
    if (tickets.length === 0) return undefined
    console.log('tickets:', tickets);

    // 按照 buyTime 降序排列, 
    /** ticket data:
     * {
            dataType: 'moveObject',
            type: '0x8dffe0e4b99b4a20a0093e7e2d9d0deb1e8e244ea956e1221c449a778f84255e::Ticket::Ticket',
            hasPublicTransfer: true,
            fields: {
                buyTime: '1737565343717',
                id: {
                    id: '0x794a81e7956bbdd14cce2b977ec954168d39fbfacb56fe2ff8d50a8067061a8c'
                },
                image: 'https://s2.coinmarketcap.com/static/img/coins/64x64/33258.png',
                level: 'bronze',
                price: '100000000'
            }
        }
        */
    // @ts-ignore
    tickets.sort((a, b) => parseInt(b.data.content.fields.buyTime) - parseInt(a.data.content.fields.buyTime));
    const ticket = tickets[0]
    // @ts-ignore
    this.ticket.objId = ticket.data.objectId
    // @ts-ignore ticket.data?.content?.fields.level = bronze | sliver | gold
    if (ticket.data?.content?.fields.level) {
      // @ts-ignore
      const _level = ticket.data?.content?.fields.level as "gold" | "sliver" | "bronze"
      this.ticket.level = _level;
      return _level;
    }
    return undefined
  }

  public showTips(text: string, color: Color = new Color(235, 38, 38, 255), parentNode: Node = null) {
    const tips = instantiate(this.tipsPrefab);
    (parentNode || director.getScene().children[0]).addChild(tips);
    tips.setPosition(0, 220)
    // @ts-ignore
    tips.getComponent('tipsTemplate').init({ text, color });
    setTimeout(() => {
      (parentNode || director.getScene().children[0]).removeChild(tips)
    }, 3000)
  }

  public updateGameMode(gameMode: "free" | "pvp") {
    this.gameMode = gameMode
  }
}

