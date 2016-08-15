class Collection {
	*[Symbol.iterator]() {
		let i = 0;
		while(this[i] !== undefined) {
			yield this[i];
			++i;
		}
	}
}
let myCollection = new Collection();
myCollection[0] = 1;
myCollection[1] = 2;

for(let value of myCollection){
	console.log(value);
}

let obj = {
	[Symbol.toPrimitive](hint) {
		switch(hint) {
			case 'number':
				return 250;
			case 'string':
				return 'diudiu';
			case 'default':
				return 'dd';
			default:
				throw new Error();
		}
	}
}

/* ---------------管道生成dom------------------*/

const dom = new Proxy({}, {
  get(target, property) {
    return function(attrs = {}, ...children) {
      const el = document.createElement(property);
      for (let prop of Object.keys(attrs)) {
        el.setAttribute(prop, attrs[prop]);
      }
      for (let child of children) {
        if (typeof child === 'string') {
          child = document.createTextNode(child);
        }
        el.appendChild(child);
      }
      return el;
    }
  }
});

const el = dom.div({},
  'Hello, my name is ',
  dom.a({href: '//example.com'}, 'Mark'),
  '. I like:',
  dom.ul({},
    dom.li({}, 'The web'),
    dom.li({}, 'Food'),
    dom.li({}, '…actually that\'s it')
  )
);

document.body.appendChild(el);
