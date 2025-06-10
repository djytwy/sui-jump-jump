import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { bronzePool, sliverPool, goldPool, packageID, manageKeyPair, poolAuth } from '../config'
import { Transaction } from '@mysten/sui/transactions'

const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const withdrawPoolBronze = async () => {
    const txb = new Transaction();
    txb.moveCall({
        target: `${packageID}::prizePool::withdraw`,
        arguments: [
            txb.object(poolAuth),
            txb.object(bronzePool),
            txb.pure.u64(65200000)
        ]
    })
    txb.setGasBudget(1e7)
    const hash = await client.signAndExecuteTransaction({
        transaction: txb,
        signer: manageKeyPair,
        options: {
            showEffects: true,
        }
    })
    console.log(hash);
}


withdrawPoolBronze()