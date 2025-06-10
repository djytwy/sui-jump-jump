import { _decorator, Component, Node } from 'cc';
import { EventDispatcher } from './EventDispatcher';

const { ccclass, property } = _decorator;

@ccclass('loadingCtl')
export class loadingCtl extends Component {

    protected onLoad(): void {
        //注册loading事件
        EventDispatcher.get_instance().target.on(EventDispatcher.SHOW_LOADING, this.show, this);
        EventDispatcher.get_instance().target.on(EventDispatcher.CLOSE_LOADING, this.hidden, this);
        console.log('loading page..');
    }

    start() {
        this.node.active = false;
    }

    update(deltaTime: number) {

    }

    show(): void {
        // this.scheduleOnce(() => {
        //     this.node.setPosition(0, 0);
        //     this.node.active = true;
        //     console.log('12312');
        // }, 0.5);
        setTimeout(() => {
            this.node.setPosition(0, 0);
            this.node.active = true;
        }, 500)
    }

    hidden(): void {
        this.scheduleOnce(() => {
            this.node.active = false;
        }, 0.5);
    }
}

