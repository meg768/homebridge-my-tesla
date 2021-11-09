


function foo() {
	try {
		throw new Error('Upps!')
	}
	catch(error) {
		console.log(error.message);
	}
	finally {
//		throw new Error('Finally');
	}
	
	
}

function bar() {
	console.log('bar')
}

foo();
bar();

console.log('Done!');