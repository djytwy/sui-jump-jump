import { _decorator, Component, Node, Label } from 'cc';
import { EventDispatcher } from './EventDispatcher';
import { GameData } from './GameData';
const { ccclass, property } = _decorator;

@ccclass('FreePageCtl')
export class FreePageCtl extends Component {
    //home_page 页面
    @property({ type: Node })
    home_page: Node = null;

    //本局分数
    @property({ type: Label })
    total_score: Label = null;
    //历史最高分
    @property({ type: Label })
    history_score: Label = null;

    start() {
        this.node.active = false;
        //注册打开游戏结束界面事件
        EventDispatcher.get_instance().target.on(EventDispatcher.SHOW_OVER_WINDOW_FREE, this.show, this);
    }

    /**
    * 显示游戏结束界面
    */
    show(): void {
        this.scheduleOnce(() => {
            this.node.setPosition(0, 0);
            this.node.active = true;
            this.total_score.string = GameData.get_total_score() + "";
            let histroy = localStorage.getItem("history_score");
            if (!histroy) {
                histroy = "0";
            }
            this.history_score.string = histroy;
        }, 0.5);
    }

    update(deltaTime: number) {

    }

    goBack() {
        //隐藏该界面
        this.node.setPosition(-1000, 0);
        this.node.active = false;
        //设置homg page 显示在屏幕中间
        this.home_page.active = true;
        this.home_page?.setPosition(0, 0);
    }
}

