import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { bronzePool, sliverPool, goldPool } from '../config'

const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const run = async () => {
    type data = {
        name: string,
        image_url: string
    }
    const res1 = await client.getObject({
        id: bronzePool,
        options: {
            showContent: true,
            showDisplay: true,
        }
    })
    const res = await client.getBalance({
        owner: bronzePool,
        coinType: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    })
    console.log(res)
    if (res1.data?.content?.dataType === "moveObject") {
        // @ts-ignore
        console.log(res1.data.content);
        // @ts-ignore
        console.log(res1.data.content.fields.balance);
    } else {
        console.log('123123');
    }
}

run()