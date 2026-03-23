function add(a, b) {
    return a + b;
}
console.log(add(5, 3));

function max(a, b) {
    if (a > b) {
        return a;
    }
    return b;
}
console.log(max(10, 20));
console.log(max(30, 15));

function factorial(n) {
    if (n <= 1) {
        return 1;
    }
    return n * factorial(n - 1);
}
console.log(factorial(5));