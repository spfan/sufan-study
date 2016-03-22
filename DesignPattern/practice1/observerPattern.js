/*
 * Subject: 维护一系列的观察者，方便添加或删除观察者
 * Observer: 为那些在目标状态发生改变时需获得通知的对象提供一个更新接口
 * ConcreteSubject: 状态发生改变时，向Observer发出通知，储存ContreteObserver的状态
 * ConcreteObserver: 存储一个指向ConcreteSubject的引用，实现Observer的更新接口，以使自身状态与目标的状态保持一致
 */
 
 /*一个Subject可能拥有一系列依赖Observer*/
  function ObserverList() {
    this.observerList = [];
  }
  
  ObserverList.prototype = {
    constructor: ObserverList,
    Add: function(obj) {
      return this.observerList.push(obj);
    },
    Empty: function() {
      this.observerList = [];
    },
    Count: function() {
      return this.observerList.length;
    },
    Get: function(index) {
      if(index > -1 && index < this.observerList.length){
        return this.observerList[index];
      }
    },
    Insert: function(obj, index) {
      var pointer = -1;
      
      if(index === 0){
        this.observerList.unshift(obj);
        pointer = index;
      }else if(index === this.observerList.length){
        this.observerList.push(obj);
        pointer = index;
      }
      return pointer;
    },
    IndexOf: function(obj, startIndex) {
      var i = startIndex, pointer = -1;
      
      while(i < this.observerList.length){
        if(this.observerList[i] === obj){
          pointer = i;
        }
        i ++;
      }
      return pointer;
    },
    RemoveIndexAt: function(index) {
      if(index === 0){
        this.observerList.shift();
      }else if(index === this.observerList.length - 1){
        this.observerList.pop();
      }
    }
  }
  
  function extend(obj, extension){
    for(var key in obj){
      extension[key] = obj[key];
    }
  }
  
  
  /*模拟目标（Subject）在观察者列表上添加、删除或通知观察者的能力*/
  function Subject() {
    this.observers = new ObserverList();
  }
  
  Subject.prototype = {
    constructor: Subject,
    AddObserver: function(observer) {
      this.observers.Add(observer);
    },
    RemoveObserver: function(observer){
      this.observers.RemoveIndexAt(this.observers.IndexOf(observer, 0));
    },
    Notify: function(context){
      var observerCount = this.observers.Count();
      for(var i = 0; i < observerCount; i ++){
        this.observers.Get(i).Update(context);
      }
    }
  }
  
  /*The Observer*/
  function Observer(){
    this.Update = function() {
    
    };
  }
