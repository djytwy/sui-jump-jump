import { _decorator, Component, Node, Prefab, instantiate, Label, Sprite, SpriteFrame, Texture2D } from 'cc';
import { OverCtl } from './OverCtl'
import { showAddress } from './utils'
import { gameManager } from './gameManager'
import blockies from 'blockies-ts'

const { ccclass, property } = _decorator;
/**
 * 排行榜界面,脚本
 * @author 一朵毛山
 * Construct 
 */
@ccclass('RankCtl')
export class RankCtl extends Component {
    //预制体,排行榜你的
    @property({ type: Prefab })
    pre_rank_item: Prefab = null;
    //排行数据容器
    @property({ type: Node })
    content: Node = null;
    //title
    @property({ type: Label })
    title: Label = null;
    // 导入 over 的数据
    @property({ type: OverCtl })
    over_ctl: OverCtl = null;


    start() {
        //默认不显示
        this.node.active = false;
    }

    update(deltaTime: number) {

    }

    /**
     * 显示该页面
     */
    show() {
        const youAddress = (gameManager.instance.zkGameInfo && gameManager.instance.zkGameInfo.address) || gameManager.instance.walletInfo.address
        this.node.setPosition(0, 0);
        this.node.active = true;
        this.content.removeAllChildren();
        const list_data = this.over_ctl.rankList;
        const level = window.localStorage.getItem("ticketLevel")
        this.title.string = level.toUpperCase() + ' RANK LIST'
        if (list_data) {
            for (let i = 0; i < list_data.length; i++) {
                let item = instantiate(this.pre_rank_item);
                item.setParent(this.content);
                item.setPosition(-7, i * -72 - 35);
                console.log(list_data[i]);
                if (list_data[i].address === youAddress) {
                    item.getChildByName("order").getComponent(Label).string = i + 1 + "";
                    item.getChildByName("nick_name").getComponent(Label).string = `You: ${showAddress(list_data[i].address, 4)}`;
                    item.getChildByName("score").getComponent(Label).string = list_data[i].scores;
                    this.loadUserIcon(list_data[i].address, item)
                } else {
                    //数据
                    item.getChildByName("order").getComponent(Label).string = i + 1 + "";
                    item.getChildByName("nick_name").getComponent(Label).string = `${showAddress(list_data[i].address, 4)}`;
                    item.getChildByName("score").getComponent(Label).string = list_data[i].scores;
                    this.loadUserIcon(list_data[i].address, item)
                }
            }
        } else {

        }
    }

    /**
     * 关闭该页面
     */
    close() {
        this.node.setPosition(-1000, 0);
        this.node.active = false;
    }

    loadUserIcon(address: string, item: Node) {
        console.log(item);
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
            item.getChildByName("avatar").getComponent(Sprite).spriteFrame = sp
            // self.userIcon.spriteFrame = sp
        }
    }
}

