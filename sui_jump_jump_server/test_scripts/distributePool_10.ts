import { goldPool, sliverPool, bronzePool, distributeRewardsConfig, manageKeyPair, distributeCap, packageID, client, rankRecords } from '../config'
import { Transaction } from '@mysten/sui/transactions'


const queryRank = async (level: string) => {
    const resDF = await client.getDynamicFields({
        parentId: rankRecords,
        // 这个是初始化的一个 key,没用，过滤掉
        // cursor: '0x0aece46095427f3ab85889ded659f9c8c85221dd6bdaaac9ad40d43ac5b9b572'
    })
    const now = new Date()
    // resDF.data.forEach(e => { console.log(e) })
    const rankItem = resDF.data.find(e => e.name.value === `${now.toISOString().split("T")[0]}-${level}`)
    const res3 = await client.getObject({
        id: rankItem?.objectId ?? "",
        options: {
            showContent: true
        }
    })
    // @ts-ignore
    const rankString = res3.data?.content?.fields.rankTable as string;
    const rankList = rankString.split(",")
    let data: { address: string, scores: string }[] = []
    rankList.forEach(e => {
        const item = e.split(':')
        if (typeof item[1] !== "undefined")
            // @ts-ignore
            data.push({
                address: `0x${item[0]}`,
                scores: item[1] as string
            })
    })
    // 先升序排，再进行去重，达到覆盖的效果
    data.sort((a, b) => parseInt(a.scores) - parseInt(b.scores));
    const uniqueData = Array.from(
        new Map(data.map(item => [item.address, item])).values()
    )
    // 最后再降序排列
    uniqueData.sort((a, b) => parseInt(b.scores) - parseInt(a.scores));
    const rank = uniqueData.map(e => e.address)
    return rank.slice(0, 10)
}

const distributeMoreThan10 = async () => {
    const txb = new Transaction();
    const rank_bronze = await queryRank("bronze")
    console.log('distribute list:', rank_bronze);
    txb.moveCall({
        target: `${packageID}::distribute::distributeMoreThan10`,
        arguments: [
            txb.object(distributeCap),
            txb.object(distributeRewardsConfig),
            txb.pure.vector("address", []),
            txb.pure.vector("address", []),
            txb.pure.vector("address", rank_bronze),
            txb.object(goldPool),
            txb.object(sliverPool),
            txb.object(bronzePool)
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
    console.log(res.effects?.status.status, res.digest);
}

const distributeLessThan10 = async () => {
    const txb = new Transaction();
    const rank_bronze = await queryRank("bronze")
    const _rank_bronze = rank_bronze.slice(0, 5)
    console.log('distribute list:', _rank_bronze);
    txb.moveCall({
        target: `${packageID}::distribute::distributeLessThan10`,
        arguments: [
            txb.object(distributeCap),
            txb.pure.vector("address", []),
            txb.pure.vector("address", []),
            txb.pure.vector("address", _rank_bronze),
            txb.object(goldPool),
            txb.object(sliverPool),
            txb.object(bronzePool)
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
    console.log(res.effects?.status.status, res.digest);
}

// distributeLessThan10()
distributeMoreThan10()
