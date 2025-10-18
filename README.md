### sui jump jump smart contract

#### 1. distribute.move:
   主要负责奖池的分发, 分发每次购票游戏后的 bouns, 分发给排名多少的玩家。
#### 2.prizePool.move:
   操作奖池的合约, 创建奖池从奖池里面分发奖励 gold, sliver, bronze。
#### 3.rank.move:
   rank的合约，主要负责创建每日的 rank，写数据到rank。
#### 4.store.move:
   商店的合约，负责使用 USDB 售卖皮肤
   todo: 接入 navi 检测持仓，奖励皮肤
#### 5.ticket.move:
   门票的合约，买gold, sliver, bronze 三种票然后玩游戏。