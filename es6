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



/* 模板引擎 */

function compile(template, data){
  var evalExpr = /<%=(.+?)%>/g;
  var expr = /<%([\s\S]+?)%>/g;
  var html = '';

  template = template
    .replace(evalExpr, '`); \n  echo( $1 ); \n  echo(`')
    .replace(expr, '`); \n $1 \n  echo(`');

  template = 'echo(`' + template + '`);';

  var script =
  ` var output = "";

    function echo(html){
      output += html;
    }

    ${ template }

    return output;
  `;
  html = new Function('data', script);

  return html(data);

}

var a = compile( 
`
	<ul>
	  <% for(var i=0; i < data.supplies.length; i++) { %>
	    <li><%= data.supplies[i] %></li>
	  <% } %>
	</ul>
`,{supplies: [3, 4, 5]});

console.log(a)



