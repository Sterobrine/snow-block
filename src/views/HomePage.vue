<template>
  <div class="main-wrap">
    <div class="header">
      <div class="mark">
        <a
          href="https://www.bilibili.com/video/BV1DHK1eBEqo"
          target="_blank"
          rel="noopener noreferrer nofollow"
          >介绍视频</a
        >
      </div>
      <div class="mark">
        <a
          href="https://github.com/Sterobrine/snow-block/tree/main"
          target="_blank"
          rel="noopener noreferrer nofollow"
          >github源码</a
        >
      </div>
    </div>
    <div class="left" style="margin-right: 10px">
      <span class="title">预设</span>
      <div class="input-area">
        <div class="form-item">
          <span class="item-title">预设</span>
          <el-select
            ref="mapSelect"
            v-model="mapNum"
            filterable
            placeholder="请选择"
            @change="initMap"
          >
            <el-option
              v-for="item in mapOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            >
            </el-option>
          </el-select>
        </div>
        <div class="form-item">
          <span class="item-title" style="width: 100px">优先使用块</span>
          <el-select
            ref="mapSelect"
            v-model="priorType"
            filterable
            placeholder="请选择"
          >
            <el-option label="无" :value="0"></el-option>
            <el-option
              v-for="(item, index) in blockNum"
              :key="index"
              :label="`${index + 1}号块`"
              :value="index + 2"
            >
            </el-option>
          </el-select>
        </div>
        <div class="form-item">
          <span class="item-title" style="width: 120px">最大等待时间</span>
          <el-input-number
            v-model="maxTime"
            :min="1"
            style="width: 180px"
          ></el-input-number>
        </div>
      </div>
      <span class="title">数量</span>
      <div class="input-area">
        <div
          class="form-item"
          :style="{ width: numInputWidth }"
          v-for="(item, index) in blockNum"
          :key="index"
        >
          <span class="item-title">{{ `${index + 1}号块` }}</span>
          <el-input-number
            v-model="blockNum[index]"
            :min="0"
            style="width: 180px"
          ></el-input-number>
        </div>
      </div>
      <div class="input-area">
        <div class="btn-wrap">
          <el-button
            type="danger"
            plain
            style="flex: 1; margin-right: 20px"
            :loading="dataLoading"
            @click="handleRun"
            >计算</el-button
          >
          <el-button-group>
            <el-button
              type="primary"
              plain
              icon="el-icon-arrow-left"
              :disabled="dataLoading || pagiantion.pageNum <= 1"
              @click="handlePre"
              >上一个</el-button
            >
            <el-button
              type="primary"
              plain
              :disabled="dataLoading || pagiantion.pageNum >= pagiantion.total"
              @click="handleNext"
              >下一个<i class="el-icon-arrow-right el-icon--right"></i
            ></el-button>
          </el-button-group>
        </div>
      </div>
    </div>
    <div class="right">
      <span class="title">{{
        `结果 (${pagiantion.pageNum}/${pagiantion.total})`
      }}</span>
      <div class="input-area">
        <el-table
          :show-header="false"
          :data="tableData"
          :cell-style="handleCellStyle"
          v-loading="dataLoading"
          element-loading-spinner="el-icon-loading"
          border
        >
          <el-table-column
            v-for="column in tableColumns"
            :key="column.prop"
            :label="column.label"
            align="center"
            :prop="column.prop"
          />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import preData from "../assets/utils/main";
import {
  Block,
  Stage,
  sumCombinations,
  searchResult,
} from "../assets/utils/main";
export default {
  data() {
    return {
      // 已有拼图数量
      blockNum: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      // 地图编号
      mapNum: 0,
      // 当前使用拼图列表
      blockList: [],
      mapOptions: [],
      // 输入组件宽度
      numInputWidth: "0",
      dataLoading: false,
      tableColumns: [],
      tableData: [],
      usefulData: [],
      pagiantion: {
        total: 0,
        pageNum: 0,
      },
      result: [],
      combSeqTactic: "size-desc",
      combsCounter: [],
      // 优先使用的block类型
      priorType: 0,
      maxTime: 5
    };
  },
  computed: {
    posNum() {
      return preData.map[this.mapNum].reduce(
        (sum, i) => (sum += i.reduce((subSum, j) => (subSum += j), 0)),
        0
      );
    },
  },
  mounted() {
    window.addEventListener("resize", () => {
      this.resetNumInputWidth();
      this.resetTableCellHeight();
    });
    this.resetNumInputWidth();
    this.mapOptions = preData.map.map((item, index) => {
      return {
        label: `预设${index + 1}`,
        value: index,
      };
    });
    this.initMap();
  },
  methods: {
    // 设置inputarea宽度
    resetNumInputWidth() {
      const areaWidth = document.querySelector(".input-area").clientWidth;
      if (areaWidth > 800) this.numInputWidth = (areaWidth - 40) / 3 - 2 + "px";
      else this.numInputWidth = (areaWidth - 40) / 2 - 2 + "px";
    },
    // 将传入矩阵映射至usefulData
    updateTableData(result) {
      let mapH = result.length,
        mapW = result[0].length;
      let tableData = [];
      let usefulData = [];
      for (let i = 0; i < mapH; i++) {
        let row = {};
        for (let j = 0; j < mapW; j++) {
          row[j + ""] = result[i][j];
        }
        tableData.push([]);
        usefulData.push(row);
      }
      this.tableData = tableData;
      this.usefulData = usefulData;
    },
    initMap() {
      let columns = [];
      let map = preData.map[this.mapNum];
      let mapW = map[0].length;
      for (let i = 0; i < mapW; i++) {
        columns.push({
          prop: i + "",
          label: i + "",
        });
      }
      this.tableColumns = columns;
      this.updateTableData(map);
      setTimeout(() => {
        this.resetTableCellHeight();
      }, 100);
    },
    handleCellStyle(options) {
      const { columnIndex, rowIndex } = options;
      const colorList = [
        "#000000",
        "#FFFFFF",
        "#92AFC9",
        "#998FD8",
        "#8CA1C4",
        "#97D1D3",
        "#CDD495",
        "#ABD593",
        "#CEB99A",
        "#C9C9AB",
        "#DFBDD6",
        "red",
        "pink",
      ];
      let value = this.usefulData[rowIndex][columnIndex + ""];
      let mapH = preData.map[this.mapNum].length;
      let mapW = preData.map[this.mapNum][0].length;
      let border = {};

      let test = (a) => a !== 0 && a !== 1;

      if (test(value)) {
        value = value.split("-");
        let name = value[0];
        let type = value[1];
        if (
          columnIndex + 1 < mapW &&
          test(this.usefulData[rowIndex][columnIndex + 1 + ""]) &&
          this.usefulData[rowIndex][columnIndex + 1 + ""].split("-")[0] === name
        ) {
          border["borderRight"] = `1px solid `;
        }
        if (
          columnIndex - 1 >= 0 &&
          test(this.usefulData[rowIndex][columnIndex - 1 + ""]) &&
          this.usefulData[rowIndex][columnIndex - 1 + ""].split("-")[0] === name
        ) {
          border["borderLeft"] = `1px solid `;
        }
        if (
          rowIndex + 1 < mapH &&
          test(this.usefulData[rowIndex + 1][columnIndex + ""]) &&
          this.usefulData[rowIndex + 1][columnIndex + ""].split("-")[0] === name
        ) {
          border["borderBottom"] = `1px solid `;
        }
        if (
          rowIndex - 1 >= 0 &&
          test(this.usefulData[rowIndex - 1][columnIndex + ""]) &&
          this.usefulData[rowIndex - 1][columnIndex + ""].split("-")[0] === name
        ) {
          border["borderTop"] = `1px solid `;
        }
        for (let key in border) {
          border[key] += colorList[type];
        }
        value = type;
      }
      return {
        backgroundColor: colorList[value],
        borderBottom: "1px solid black !important",
        borderRight: "1px solid black !important",
        ...border,
      };
    },
    // 使单元格为正方形
    resetTableCellHeight() {
      let cells = document.querySelectorAll("td");
      let width = cells[0].offsetWidth;
      let rows = document.querySelectorAll("tr");
      rows.forEach((row) => {
        row.setAttribute("style", `height: ${width}px !important`);
      });
    },
    // 根据拼图各类块数量，生成一个包含已有块的Block数组
    initBlockList() {
      const blocks = preData.blocks;
      this.blockList = [];
      let count = 0;
      for (let i = 0; i < blocks.length; i++) {
        let num = Math.min(
          this.blockNum[i],
          Math.floor(this.posNum / blocks[i][0].length)
        );
        for (let j = 0; j < num; j++) {
          count++;
          this.blockList.push(
            new Block(
              String.fromCharCode("a".charCodeAt() + count - 1),
              i + 2,
              blocks[i]
            )
          );
        }
      }
    },
    // 统计每个comb中各种类型的block数量
    setCombsCounter(combs) {
      let combsCounter = [];
      combs.forEach((comb) => {
        let counter = {};
        comb.forEach((block) => {
          if (!counter[block.type]) counter[block.type] = 1;
          else counter[block.type]++;
        });
        combsCounter.push(counter);
      });
      this.combsCounter = combsCounter;
    },
    // 将 combs 按照优先级高的元素数量排序
    reSequenceCombs(combs) {
      this.setCombsCounter(combs);
      if (!this.priorType) return combs;
      let tmp = combs.map((comb, index) => ({
        comb,
        counter: this.combsCounter[index],
      }));
      tmp.sort((a, b) => {
        let anum = a.counter[this.priorType] || 0;
        let bnum = b.counter[this.priorType] || 0;
        return bnum - anum;
      });
      this.combsCounter.sort((a, b) => b - a);
      return tmp.map((i) => i.comb);
    },
    // 将 comb 按照特定策略排序
    reSequenceComb(comb, index) {
      let counter = this.combsCounter[index];
      if (this.combSeqTactic === "size-desc") {
        return comb.sort((a, b) => {
          if (a.size === b.size) {
            return counter[b.type] - counter[a.type];
          }
          return b.size - a.size;
        });
      }
      if (this.combSeqTactic === "num-desc") {
        return comb.sort((a, b) => {
          if (counter[b.type] === counter[a.type]) {
            return b.size - a.size;
          }
          return counter[b.type] - counter[a.type];
        });
      }
      return comb;
    },
    getResult() {
      let tmp = [];
      this.result = [];
      const map = preData.map;
      this.initBlockList();
      let combs = sumCombinations(this.blockList, this.posNum);
      // 排序，使含有优先使用块最多的组合排在前面
      combs = this.reSequenceCombs(combs);
      console.log(combs);
      let flag = true;
      let t0 = Date.now();
      for (let i = 0; i < combs.length; i++) {
        // 排序，让面积最大的块排在前面，加快速度
        let comb = this.reSequenceComb(combs[i], i);
        let stage = new Stage(map[this.mapNum], comb);
        let t = Date.now();
        if (searchResult(stage, this.result)) {
          flag = false;
          console.log(
            `(${i + 1}/${combs.length})`,
            comb.map((i) => i.type - 1).join(","),
            Date.now() - t + "ms",
            "√"
          );
          // break;
          tmp.push(comb);
        } else {
          console.log(
            `(${i + 1}/${combs.length})`,
            comb.map((i) => i.type - 1).join(","),
            Date.now() - t + "ms",
            "×"
          );
        }
        if(Date.now() - t0 > this.maxTime * 1000) break;
      }
      if (flag) console.log("no such result");
    },
    showResult() {
      this.pagiantion.total = this.result.length;
      if (this.result.length) {
        this.pagiantion.pageNum = 1;
        this.updateTableData(this.result[this.pagiantion.pageNum - 1]);
      } else {
        this.pagiantion.pageNum = 0;
        this.initMap();
      }
    },
    handleRun() {
      this.dataLoading = true;
      setTimeout(() => {
        let t = Date.now();
        this.getResult();
        console.log(Date.now() - t + "ms");
        this.showResult();
        this.dataLoading = false;
      }, 50);
    },
    handlePre() {
      if (this.pagiantion.pageNum > 1) {
        this.pagiantion.pageNum--;
        this.updateTableData(this.result[this.pagiantion.pageNum - 1]);
      }
    },
    handleNext() {
      if (this.pagiantion.pageNum < this.pagiantion.total) {
        this.pagiantion.pageNum++;
        this.updateTableData(this.result[this.pagiantion.pageNum - 1]);
      }
    },
  },
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
}
.main-wrap {
  width: 100vw;
  display: flex;
  justify-content: space-between;
  min-width: 420px;
  flex-wrap: wrap;
}
.left,
.right {
  min-width: 420px;
  flex: 1;
}
.input-area {
  width: 100%;
  border: 2px dashed black;
  border-radius: 8px;
  flex-wrap: wrap;
  padding: 20px;
  box-sizing: border-box;
  margin-bottom: 20px;
}
.form-item {
  display: inline-block;
  padding: 0 auto;
  padding-bottom: 15px;
  text-align: center;
}
.item-title {
  font-size: 14px;
  display: inline-block;
  width: 68px;
  padding: 0 10px;
  text-align: right;
  box-sizing: border-box;
}
.title {
  height: 40px;
  display: block;
  font-size: 20px;
}
.btn-wrap {
  width: 100%;
  display: flex;
  justify-content: space-between;
}

.header {
  width: 100%;
  height: 40px;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: hidden;
}

.mark {
  margin-right: 20px;
}

@media screen and (min-width: 750px) {
  .main-wrap {
    width: 80%;
    margin: 0 auto;
  }
}

@media screen and (max-width: 750px) {
  .left {
    margin-right: 0 !important;
  }
  .input-area {
    padding: 20px 10px;
  }
  .item-title {
    /* display: block;*/
    text-align: center;
    height: 24px;
    padding: 0;
  }
  .form-item {
    margin-right: 10px;
  }
}
</style>