/*
* 	Mixin是被一个或一组子类继承功能的类，目的是函数的复用
*/

/*----------------------------简单实例-------------------------------*/

/*Superman为man的扩展，man为超类*/
var Person = function(firstName, lastName) {
	
	this.firstName 	= firstName;
	this.lastName 	= lastName;
	this.gender   	= 'male';
	
};

Person.prototype.age = '22';

var SuperMan = function(firstName, lastName, powers) {
	
	Person.call(this, firstName, lastName);
	this.powers = powers;

}; 

SuperMan.prototype = Person.prototype;
var superMan = new SuperMan('juexin', 'fan', ['fly', 'papapa']);
console.log(superMan);

/*----------------------------over-------------------------------*/


/*----------------------------扩展构造函数-------------------------------*/

var Car = function(settings) {

	this.model = settings.model || 'no model provided';
	this.color = settings.color || 'no color provided';

};

var Mixin = function() {};
Mixin.prototype = {
	constructor: Mixin,
	driveForward: function(){
		console.log('drive forward');
	},
	driveBackward: function(){
		console.log('drive backward');
	},
	driveSideways: function(){
		console.log('drive sidewarys');
	}
};

// 将现有对象扩展到另一个对象上，可指定属性名
function augment(receivingClass, givingClass){

	if(arguments[2]){
		for(var i = 2,len = arguments.length; i < len; i ++){
			receivingClass.prototype[arguments[i]] = givingClass.prototype[arguments[i]];
		}
	}else{
		for(var methodName in givingClass.prototype){
			if(!Object.hasOwnProperty(receivingClass.prototype, methodName)){
				receivingClass.prototype[methodName] = givingClass.prototype[methodName];
			}
		}
	}
	
}

// 给Car构造函数增加两个方法
augment(Car, Mixin, 'driveForward', 'driveBackward');

var myCar = new Car({model: 'Ford Escort', color: 'white'});

myCar.driveForward();
myCar.driveBackward();

// 将Mixin的所有方法添加到Car里
augment(Car, Mixin);

var mySportsCar = new Car({model: 'Ford Escort', color: 'white'});

mySportsCar.driveSideways();

/*----------------------------over-------------------------------*/
