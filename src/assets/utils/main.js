import data from './data'

export class Block {
  constructor(name, type, template) {
    this.name = name; // 作为id
    this.type = type; // 用于区分10种不同的形状
    this.orient = 0; // 形状当前朝向
    this.template = template || []; // 形状占位模板 [[],[]]
    this.size = template[0].length; // 形状占位格数
    this.pos = null; // 形状原点template[?][0]所在的StagePos
  }

  getOffset(pos) {
    // 获取模板坐标与目的坐标的偏移量
    if (!pos) pos = this.pos;
    if (!pos) return [0, 0];
    let x = pos.x;
    let y = pos.y;
    let template = this.template[this.orient];
    let originX = template[0][0];
    let originY = template[0][1];
    return [x - originX, y - originY];
  }
}

export class StagePos {
  constructor(x, y, empty) {
    this.x = x;
    this.y = y; // 对应二维数组[x][y]
    this.block = null;
    this.empty = empty;
  }

  setblock(block, isChangePos) {
    this.block = block;
    this.empty = 0;
    if (isChangePos) block.pos = this;
  }

  removeblock() {
    this.block.pos = null;
    this.block = null;
    this.empty = 1;
  }
}

export class Stage {
  constructor(map, blockList) {
    this.map = map;
    this.height = map.length;
    this.width = map[0].length;
    this.blockList = blockList || [];
    this.graph = []; // 站位图
    this.history = new Set();
    this.initStage();
  }
  // 将stage.graph初始化为和选中map矩阵相同形状的StagePos矩阵
  initStage() {
    if (this.graph.length) this.graph = [];
    for (let i = 0; i < this.height; i++) {
      let line = [];
      for (let j = 0; j < this.width; j++) {
        line.push(new StagePos(i, j, this.map[i][j]));
      }
      this.graph.push(line);
    }
  }

  addblockToStage(block, pos) {
    // 将某个block放置在graph上
    let offset = block.getOffset(pos);
    let template = block.template[block.orient];
    let isChangePos = true;
    for (let i = 0; i < template.length; i++) {
      let x = template[i][0];
      let y = template[i][1];
      if (x === 0 && y === 0) {
        isChangePos = true;
      }
      else isChangePos = false; // 角色当前位置只被原点位置修改
      x += offset[0];
      y += offset[1];
      pos = this.graph[x][y];
      pos.setblock(block, isChangePos);
    }
  }

  removeblockFromStage(block) {
    // 将某个block移出graph
    let pos = block.pos;
    if (pos) {
      let offset = block.getOffset(pos);
      let template = block.template[block.orient];
      for (let i = 0; i < template.length; i++) {
        let x = template[i][0] + offset[0];
        let y = template[i][1] + offset[1];
        pos = this.graph[x][y];
        pos.removeblock();
      }
    }
  }

  findNextPos(block) {
    // 根据上一次该角色的站位，找到下一个可能的站位
    // block原先不在graph上时，prePose为(0,0)位置
    let prePos = block.pos || this.graph[0][0];
    let preSeq = this.getSequenceNum(prePos);
    let sum = this.width * this.height;
    for (let i = preSeq; i < sum; i++) {
      let pos = this.getPosition(i);
      if (this.isPosAccommodate(block, pos)) {
        return pos;
      }
    }
    return null;
  }

  isPosAccommodate(block, pos) {
    // 判断给定位置是否足以容纳block
    if (block.pos === pos) return false;
    let template = block.template[block.orient];
    let offset = block.getOffset(pos);
    // 是否放得下
    for (let i = 0; i < template.length; i++) {
      let x = template[i][0] + offset[0];
      let y = template[i][1] + offset[1];
      if (this.isOutOfStage(x, y)) {
        return false;
      }
      let targetPos = this.graph[x][y];
      // pos是否已被占用
      if (!targetPos.empty) {
        if (targetPos.block) {
          if (targetPos.block.name === block.name) {
            continue;
          }
        }
        return false;
      }
    }
    // 剪枝
    let target = `${block.type}-${block.orient}-${pos.x}-${pos.y}`
    for (let value of this.history) {
      let tmp = value.slice(0, value.length - 2);
      if (tmp === target) {
        // 剪枝
        return false;
      }
    }
    return true;
  }

  isOutOfStage(x, y) {
    // 越界判断
    if (x >= this.height || y >= this.width || x < 0 || y < 0) return true;
    return false;
  }

  getPosition(num) {
    // 一维坐标转二维
    let y = num % this.width;
    let x = (num - y) / this.width;
    let pos = this.graph[x][y];
    return pos;
  }

  getSequenceNum(pos) {
    // 二维转一维
    let x = pos.x;
    let y = pos.y;
    return this.width * x + y;
  }

  clearStagePos() {
    // 将所有block移出graph
    this.blockList.forEach((block) => {
      this.removeblockFromStage(block);
    });
  }

  getResult() {
    // 生成和当前graph形状相同的block.type矩阵
    let res = [];
    for (let i = 0; i < this.height; i++) {
      let row = [];
      for (let j = 0; j < this.width; j++) {
        if (!this.graph[i][j].block) row.push(0);
        else row.push(`${this.graph[i][j].block.name}-${this.graph[i][j].block.type}`);
      }
      res.push(row)
    }
    return res;
  }

  setHistory(block, pos) {
    this.history.add(`${block.type}-${block.orient}-${pos.x}-${pos.y}-${block.name}`)
  }

  clearHistory(block) {
    // 清除该block留下的history
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        for (let k = 0; k < block.template.length; k++) {
          this.history.delete(`${block.type}-${k}-${i}-${j}-${block.name}`);
        }
      }
    }
  }

  displayMap() {
    console.log("-");
    for (let i = 0; i < this.height; i++) {
      let s = "";
      for (let j = 0; j < this.width; j++) {
        if (!this.graph[i][j].block) s += "0 ";
        else s += this.graph[i][j].block.name + " ";
      }
      console.log(s);
    }
    console.log("-");
  }
}

export function sumCombinations(arr, sum) {
  // 返回的arr中所有block.size和为sum的组合，返回值为一个二维数组
  arr.sort((a, b) => a.size - b.size);

  let dp = Array(sum + 1).fill(0);
  dp[0] = 1;
  let allCombs = Array(sum + 1).fill().map(() => []);

  let map = {};

  for (let i = 0; i < arr.length; i++) {
    for (let j = sum; j >= arr[i].size; j--) {
      dp[j] += dp[j - arr[i].size];
      if (dp[j - arr[i].size] > 0) {
        if (j === arr[i].size) {
          let key = arr[i].type + '';
          if (!map[key]) {
            allCombs[j].push([arr[i]]);
            map[key] = true;
          }
        } else {
          for (let comb of allCombs[j - arr[i].size]) {
            let tmp = [...comb, arr[i]];
            let key = tmp.map(i => i.type).join(',');
            if (!map[key]) {
              allCombs[j].push(tmp);
              map[key] = true;
            }
          }
        }
      }
    }
  }

  return allCombs[sum];
}

// export function searchResult(stage, result, index = 0) {
//   // 判断sumCombinations得到的某一个组合是否能够正好放入graph中, 递归
//   if (index >= stage.blockList.length) {
//     result.push(stage.getResult());
//     return true;
//   }
//   let block = stage.blockList[index];
//   for (let i = 0; i < block.template.length; i++) {
//     block.orient = i;
//     let pos = stage.findNextPos(block);
//     while (pos) {
//       stage.removeblockFromStage(block);
//       stage.addblockToStage(block, pos);
//       stage.setHistory(block, pos);
//       if (searchResult(stage, result, index + 1)) {
//         stage.removeblockFromStage(block);
//         return true;
//       }
//       pos = stage.findNextPos(block);
//     }
//     stage.removeblockFromStage(block);
//   }
//   block.orient = 0;
//   stage.clearHistory(block);
//   return false;
// }

export function searchResult(stage, result) {
  // 判断sumCombinations得到的某一个组合是否能够正好放入graph中, 非递归
  let s = [], blockList = stage.blockList;
  let blockNum = blockList.length;
  blockList = blockList.map(i => i);
  let block = blockList[0];
  let rotateFlag = false;
  while (s.length < blockNum) {
    let pos = stage.findNextPos(block);
    if (pos) {
      // 给新块找一个位置放下
      stage.removeblockFromStage(block);
      stage.addblockToStage(block, pos);
      // 记录当前放下块的特征，用于剪枝
      stage.setHistory(block, pos);
      s.push(blockList.shift());
      block = blockList[0];
      rotateFlag = false;
    }
    else if (block.orient < block.template.length - 1) {
      // 如果新块能旋转，先旋转, 再重新找位置
      stage.removeblockFromStage(block);
      block.orient++;
      rotateFlag = true;
    }
    else {
      // 旋转过那orient就变了，不能直接remove
      if (!rotateFlag) {
        stage.removeblockFromStage(block);
      }
      block.orient = 0;
      stage.clearHistory(block);
      // 新块已不能旋转，且找不到位置，需要变动已放下的块， 让老块重新走一遍流程
      if (!s.length) {
        // 没有老块，直接结束
        return false;
      }
      // 老块出栈回到blockList中，当作新块准备重走一遍流程
      block = s.pop();
      blockList.unshift(block);
      rotateFlag = false;
    }
  }
  result.push(stage.getResult());
  stage.blockList.forEach(block => {
    block.pos = null;
  });
  return true;
}


export default data;