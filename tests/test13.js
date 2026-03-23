let arr = [1, 2, 3, 4, 5];
console.log(arr.length);
console.log(arr[0]);
console.log(arr[4]);

arr.push(6);
console.log(arr.length);
console.log(arr[5]);

arr.pop();
console.log(arr.length);

let doubled = arr.map(x => x * 2);
console.log(doubled[0]);
console.log(doubled[4]);

let evens = arr.filter(x => x % 2 == 0);
console.log(evens[0]);
console.log(evens[1]);