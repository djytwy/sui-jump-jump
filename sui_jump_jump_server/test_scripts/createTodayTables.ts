/**
 * 在链上创建今天的金银铜，三张 tables 
 */
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from '@mysten/sui/transactions'
import { manageKeyPair } from '../config'
import {
    packageID,
    rankRecords,
    rankTableAuth,
} from '../config'

const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const createTable = async (tableDate: string) => {
    const txb = new Transaction();

    txb.moveCall({
        target: `${packageID}::rank::createTodayTables`,
        arguments: [
            txb.object(rankTableAuth),
            txb.object(rankRecords),
            txb.pure.string(tableDate)
        ]
    })
    txb.setGasBudget(1e8)
    const res = await client.signAndExecuteTransaction({
        transaction: txb,
        signer: manageKeyPair,
        options: {
            showEffects: true
        }
    })
    console.log('create success:', tableDate);

    console.log(res.digest);
}

const createTodayTables = () => {
    const now = new Date()
    const today = now.toISOString().split("T")[0]
    createTable(today)
}

createTodayTables()

