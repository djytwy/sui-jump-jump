import { _decorator, Component, instantiate, Label, Prefab } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RankItem')
export class RankItem {
    @property
    id = 0;
    @property
    rank = 0;
    @property
    scores = '0';
    @property
    url = ''
    @property
    address = ''
    @property
    isYou = ''
}

@ccclass('RanklistTop3')
export class RanklistTop3 extends Component {
    @property(Prefab)
    itemPrefab: Prefab | null = null;


    showTop3(data: RankItem[]) {
        this.node.removeAllChildren()
        for (let i = 0; i < data.length; ++i) {
            const item = instantiate(this.itemPrefab);
            const _data = data[i];
            console.log('rank data:', _data, item);
            this.node.addChild(item);
            // @ts-ignore
            item.getComponent('Rank3ItemTemplate').init(_data);
        }
    }
}

