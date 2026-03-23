let i = 1;
let sum = 0;
while (i <= 10) {
    sum = sum + i;
    i = i + 1;
}
console.log(sum);

let j = 0;
let evenSum = 0;
while (j <= 10) {
    if (j % 2 == 0) {
        evenSum = evenSum + j;
    }
    j = j + 1;
}
console.log(evenSum);