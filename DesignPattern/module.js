// module模式实现购物车
var basketModule = (function () {
  // 私有
  var basket = [];
  
  return {
    addItem: function(values){
      basket.push(values);
    },
    getItemCount: function(){
      return basket.length;  
    },
    getTotal: function(){
    
      var itemCount = this.getItemCount(),
          total     = 0;
          
        while(itemCount --){
          total += basket[itemCount].price;
        }
      
        return total;
    }
  }
})();

// basketModule 返回了一个拥有公共API的对象
basketModule.addItem({
  item: 'macbook',
  price: 7999
});

basketModule.addItem({
  item: 'iphone',
  price: 5999
});

console.log(basketModule.getItemCount());

console.log(basketModule.getTotal());

