import { _decorator, Component, Node } from 'cc';
import { EventTarget } from 'cc';
const { ccclass, property } = _decorator;
const event_target = new EventTarget();

/**
 * 自定义事件
 * @author 一朵毛山
 * Construct 
 */
export class EventDispatcher {
    /**
     * 单利对象
     */
    private static instance: EventDispatcher;
    /**
     * 更新面板分数
     */
    static UPDATE_SCORE_LABEL: string = "UPDATE_SCORE_LABEL";
    /**
     * 打开游戏结束界面 PVP
     */
    static SHOW_OVER_WINDOW_PVP: string = "SHOW_OVER_WINDOW_PVP";
    /**
     * 打开游戏结束界面 FREE
     */
    static SHOW_OVER_WINDOW_FREE: string = "SHOW_OVER_WINDOW_FREE";
    /**
     * 开始游戏(在玩一次)
     */
    static START_GAME: string = "START_GAME";
    /**
     * loading page show
     */
    static SHOW_LOADING: string = "SHOW_LOADING";
    /**
     * loading page close
     */
    static CLOSE_LOADING: string = "CLOSE_LOADING";
    /**
     * shop page manage
     */
    static SHOW_SHOP: string = "SHOW_SHOP";
    static CLOSE_SHOP: string = 'CLOSE_SHOP';
    /**
     * reload gamer skin
     */
    static RELOAD_GAME_SKIN: string = "RELOAD_GAME_SKIN";

    /**
     * 获取单利
     * @returns 
     */
    static get_instance(): EventDispatcher {
        if (!EventDispatcher.instance) {
            EventDispatcher.instance = new EventDispatcher();
        }
        return EventDispatcher.instance;
    }
    /**
     * 获取event
     */
    get target(): EventTarget {
        return event_target;
    }
}

