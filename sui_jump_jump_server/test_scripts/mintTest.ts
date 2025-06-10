import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from '@mysten/sui/transactions'
import { manageKeyPair, packageID, testerKeyPair, skinInfo } from '../config'

const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const run_mint_2 = async () => {
    const txb = new Transaction();
    const [coin] = txb.splitCoins(txb.gas, [1000000000]);
    txb.moveCall({
        target: `${packageID}::skin_store::mint`,
        arguments: [
            txb.pure.string(`Cat jumper`),
            txb.pure.string(`https://img2.baidu.com/it/u=3565409493,803491979&fm=253&fmt=auto&app=138&f=JPEG?w=800&h=1440`),
            coin,
            txb.object(skinInfo)
        ]
    })
    txb.setGasBudget(1e7)
    const hash = await client.signAndExecuteTransaction({
        transaction: txb,
        signer: testerKeyPair,
        options: {
            showEffects: true,
        }
    })
    console.log(hash);
}

const run_mint_1 = async () => {
    const txb = new Transaction();
    const [coin] = txb.splitCoins(txb.gas, [`1000000000`]);
    txb.moveCall({
        target: `${packageID}::skin_store::mint`,
        arguments: [
            txb.pure.string(`Cat jumper`),
            txb.pure.string(`https://aggregator.walrus-mainnet.walrus.space/v1/blobs/52tUM7ups1iN22nHp6IkeQwtAog_neNRajwM2aNXob4`),
            coin,
            txb.object(skinInfo)
        ]
    })
    txb.setGasBudget(1e7)
    const hash = await client.signAndExecuteTransaction({
        transaction: txb,
        signer: testerKeyPair,
        options: {
            showEffects: true,
        }
    })
    console.log(hash);
}

const run_query_mint = async () => {
    const res = await client.getObject({
        id: skinInfo,
        options: {
            showContent: true
        }
    })
    console.log(res.data?.content);
}


run_mint_1()
// run_mint_2()
// run_query_mint()