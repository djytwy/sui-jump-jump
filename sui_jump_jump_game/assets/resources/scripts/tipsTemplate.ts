import { _decorator, Component, Node, Label, Sprite, Color } from 'cc';
const { ccclass, property } = _decorator;
import { TipsContent } from './gameManager'

@ccclass('tipsTemplate')
export class tipsTemplate extends Component {

    @property(Label)
    public text: Label | null = null;

    init(data: TipsContent) {
        this.text.color = data.color ? data.color : new Color(235, 38, 38, 255)
        this.text.string = data.text
        this.text.node.active = true
    }

    start() {

    }

    update(deltaTime: number) {

    }
}

