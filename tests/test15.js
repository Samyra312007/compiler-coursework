let regex1 = /hello/i;
console.log(regex1.test("HELLO"));
console.log(regex1.test("world"));

let regex2 = /[0-9]+/;
console.log(regex2.test("abc123def"));
console.log(regex2.test("abcdef"));