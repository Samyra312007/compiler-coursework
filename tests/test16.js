let map = new Map();
map.set("name", "John");
map.set("age", 30);
console.log(map.get("name"));
console.log(map.get("age"));

let set = new Set();
set.add(1);
set.add(2);
set.add(2);
set.add(3);
console.log(set.size);
console.log(set.has(2));
console.log(set.has(5));