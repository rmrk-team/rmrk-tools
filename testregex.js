const string1 = "5105000-0aff6865bed3a66b-DLEP-0000000000000001";
const string2 = "5105000-0aff6865bed3a66b-DLEP-0000000000000001";

const idExpand1 = string1.split("-");
idExpand1.shift();
const uniquePart1 = idExpand1.join("-");

const idExpand2 = string2.split("-");
idExpand2.shift();
const uniquePart2 = idExpand2.join("-");

console.log(uniquePart1 === uniquePart2);
