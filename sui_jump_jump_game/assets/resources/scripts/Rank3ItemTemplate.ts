import { _decorator, Component, Node, assetManager, ImageAsset, SpriteFrame, Texture2D, Sprite, Label } from 'cc';
import { RankItem } from './RanklistTop3'
const { ccclass, property } = _decorator;

@ccclass('Rank3ItemTemplate')
export class Rank3ItemTemplate extends Component {
    @property
    public id = 0;
    @property
    public url = '';
    @property(Sprite)
    public icon: Sprite | null = null;
    @property(Label)
    public address: Label | null = null;
    @property(Label)
    public score: Label | null = null;
    @property(Label)
    public rank: Label = null;
    @property(Label)
    public isYou: Label = null;


    init(data: RankItem) {
        this.loadImage(data.url, this.icon)
        this.id = data.id;
        this.address.string = data.address;
        this.score.string = data.scores;
        this.rank.string = data.rank === 0 ? '-' : data.rank.toString();
        console.log(this.rank, this.isYou);
        this.isYou.string = data.isYou ? "You" : ""
        this.isYou.node.active = data.isYou ? true : false
    }

    async loadImage(base64Url: string, icon: Sprite) {
        const img = new Image();
        const texture = new Texture2D();
        img.src = base64Url;
        img.onload = function () {
            texture.reset({
                width: img.width,
                height: img.height
            })
            texture.uploadData(img, 0, 0)
            // texture.loaded = true
            const sp = new SpriteFrame();
            sp.texture = texture;
            icon.spriteFrame = sp
        }
        // assetManager.loadRemote<ImageAsset>(base64Url, function (err, imageAsset) {
        //     console.log('url:', base64Url, imageAsset, err);
        //     const spriteFrame = new SpriteFrame()
        //     const texture = new Texture2D();
        //     texture.image = imageAsset;
        //     spriteFrame.texture = texture;
        //     icon.spriteFrame = spriteFrame;
        // });
    }
}

