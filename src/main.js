import Vue from 'vue'
import App from './App.vue'
import { Button, Select, Option, InputNumber, ButtonGroup, Table, TableColumn, Loading } from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

let e = [Button, Select, Option, InputNumber, ButtonGroup, Table, TableColumn, Loading];
console.log(e)
e.forEach(i => Vue.use(i));

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
