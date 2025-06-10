import express from 'express'
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Transaction } from '@mysten/sui/transactions'
import cors from 'cors'
import { createClient } from 'redis'
import { rankRecords, rankTableAuth, manageKeyPair, privateKey, packageID, publicKey } from './config'
const JSEncrypt = require("jsencrypt-node");

const redisClient = createClient({
    url: 'redis://default:AY3kAAIjcDEzOGZlNDVjMWYxMWM0MzA3ODBjMjZkYjUwNDE2MzNhMHAxMA@enough-midge-36324.upstash.io:6379', // 根据你的 Redis 服务器地址进行修改
    socket: {
        tls: true
    }
});

// 处理 Redis 客户端的错误
redisClient.on('error', (err) => {
    console.error('Redis 连接错误:', err);
});

// 连接到 Redis
redisClient.connect().then(() => {
    console.log('已连接到 Redis');
}).catch((err) => {
    console.error('Redis 连接失败:', err);
});

const client = new SuiClient({
    url: getFullnodeUrl("mainnet"),
});

const dayLimt = 100;

// 创建一个 Express 应用
const app = express();
app.use(cors())
app.use(express.json());

// 设置服务器监听的端口
const PORT = 8080;


app.get('/getRank', async (req, res) => {
    try {
        const level = req.query.level;
        const resDF = await client.getDynamicFields({
            parentId: rankRecords,
            // 这个是初始化的一个 key,没用，过滤掉
            // cursor: '0x0aece46095427f3ab85889ded659f9c8c85221dd6bdaaac9ad40d43ac5b9b572'
        })
        const now = new Date()
        // resDF.data.forEach(e => { console.log(e) })
        const rankItem = resDF.data.find(e => e.name.value === `${now.toISOString().split("T")[0]}-${level}`)
        const res3 = await client.getObject({
            id: rankItem.objectId,
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
        res.json(uniqueData)
    } catch (error) {
        console.log(error);
        res.json([])
    }
})

const addScoresToTable = async (address: string, scores: string, level: string, tableDate: string) => {
    const txb = new Transaction();
    txb.moveCall({
        target: `${packageID}::rank::addToTable`,
        arguments: [
            txb.object(rankTableAuth),
            txb.object(rankRecords),
            txb.pure.address(address),
            // 合约里面的格式:2025-01-01-sliver
            txb.pure.string(`${tableDate}-${level}`),
            txb.pure.string(`:${scores},`)
        ]
    })
    txb.setGasBudget(2e7)
    const _res = await client.signAndExecuteTransaction({
        transaction: txb,
        signer: manageKeyPair,
        options: {
            showEffects: true
        }
    })
    if (_res.effects.status.status === "success") {
        console.log('add scores to table success:', address, scores, tableDate);
        return _res
    } else {
        const now = new Date()
        const key = `${now.getFullYear()}_${now.getMonth() + 1}_${now.getDate()}`
        redisClient.hSet(key, _res.digest, `${now.getTime()}`)
    }
    return _res
}

app.post('/addScoresToTable', async (req, res) => {
    try {
        const address = req.body.address;
        // data的格式: 分数-级别-时间,
        const data = req.body.data;
        const crypt = new JSEncrypt()
        crypt.setKey(privateKey)
        const decodeData = crypt.decrypt(data)
        if (decodeData) {
            const _decodeData = decodeData as string;
            const _parseDecodeData = _decodeData.split("_")
            const storeRes = await storeScore(address, {
                time: _parseDecodeData[2],
                scores: _parseDecodeData[0],
                level: _parseDecodeData[1]
            })
            console.log(storeRes);
            if (storeRes) {
                const hash = await tryFiveTimes(() => addScoresToTable(address, _parseDecodeData[0], _parseDecodeData[1], _parseDecodeData[2]))
                res.json({
                    ...hash,
                    success: true
                })
            } else {
                res.json({
                    error: "This record already in Sui.",
                    success: false
                })
            }
        } else {
            res.json({
                error: "scores decode error.",
                success: false
            })
        }
    } catch (error) {
        console.log(error);
        res.json({
            error,
            success: false
        })
    }
})

app.post('/adminMint', async (req, res) => {
    try {
        // data的格式: 地址-时间,
        const data = req.body.data;
        const crypt = new JSEncrypt()
        crypt.setKey(privateKey)
        const decodeData = crypt.decrypt(data)
        if (decodeData) {
            const _decodeData = decodeData as string;
            const _parseDecodeData = _decodeData.split("_")
            const address = _parseDecodeData[0]
            const time = _parseDecodeData[1]
            const date = new Date(time).toISOString().split('T')[0]
            const now = await redisClient.get(date)
            if (now === null) {
                await redisClient.set(date, 1)
            }
            if (now === null || Number(now) < dayLimt) {
                // const hash = await tryFiveTimes(() => addScoresToTable(address, _parseDecodeData[0], _parseDecodeData[1], _parseDecodeData[2]))
                // res.json({
                //     ...hash,
                //     success: true
                // })
            } else {
                res.json({
                    message: 'Please try mint tomorrow.',
                    success: false
                })
            }
        } else {
            res.json({
                error: "data decode error.",
                success: false
            })
        }
    } catch (error) {
        console.log(error);
        res.json({
            error,
            success: false
        })
    }
})

// app.post('/addScoresToTableTest', async (req, res) => {
//     try {
//         const address = req.body.address;
//         // data的格式: 分数-级别-时间,
//         const data = req.body.data;
//         console.log('address:', address);
//         console.log('data:', data);
//         const crypt = new JSEncrypt()
//         crypt.setKey(publicKey)
//         const now = new Date()
//         const formattedDate = now.toISOString().split('T')[0];
//         // 格式: 分数-级别-时间
//         const rawData = `${88}_${'gold'}_${formattedDate}`
//         const encodeData = crypt.encrypt(rawData)
//         console.log('raw Data:', rawData);
//         console.log('encode Data:', encodeData);
//         crypt.setKey(privateKey)
//         const decodeData = crypt.decrypt(encodeData)
//         console.log('decode Data:', decodeData);
//         if (decodeData) {
//             const _decodeData = decodeData as string;
//             const _parseDecodeData = _decodeData.split("_")
//             const hash = await tryFiveTimes(() => addScoresToTable(address, _parseDecodeData[0], _parseDecodeData[1], _parseDecodeData[2]))
//             res.json({
//                 ...hash,
//                 success: true
//             })
//         } else {
//             res.json({
//                 error: "scores decode error.",
//                 success: false
//             })
//         }
//     } catch (error) {
//         console.log(error);
//         res.json({
//             error,
//             success: false
//         })
//     }
// })


// 检查并存储分数的函数

type ScoreRecord = {
    time: string;
    scores: string;
    level: string;
}

async function storeScore(address: string, score: ScoreRecord): Promise<boolean> {
    const key = `${score.level}_${address}_${score.time}`
    const _score = await redisClient.get(key)
    console.log('redis data:', _score);
    if (!_score || _score !== score.scores) {
        const f = await redisClient.set(key, score.scores)
        return true
    } else {
        return false
    }
}

async function uploadScoresToSui() {

}

const tryFiveTimes = async (func: () => Promise<any>) => {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const result = await func();
            if (result && result.digest) {
                return result; // 如果成功，返回结果
            }
        } catch (error) {
            console.log(`Error: ${error} attempt ${attempt} failed, retrying...`);
        }
    }
    throw new Error('All attempts failed'); // 如果所有尝试都失败，抛出错误
};

// 启动服务器并监听指定端口
app.listen(PORT, () => {
    console.log(`服务器正在 http://localhost:${PORT} 上运行`);
});