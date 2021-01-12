import { URL } from "url";

const stringIsAValidUrl = (s: string) => {
  try {
    new URL(s);
    return true;
  } catch (err) {
    return false;
  }
};

console.log(stringIsAValidUrl("https://www.example.com:777/a/b?c=d&e=f#g")); //true
console.log(
  stringIsAValidUrl(
    "ipfs://ipfs/QmYcWFQCY1bAZ7ffRggt367McMN5gyZjXtribj5hzzeCWQ"
  )
);
console.log(stringIsAValidUrl("invalid")); //false
