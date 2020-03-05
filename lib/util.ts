import { maxTextLength } from "./constants";

function setCharAt(str: string, index: number, chr: string): string {
  if (index > str.length - 1) return str;
  return str.substr(0, index) + chr + str.substr(index + 1);
}

function regulateStringLength(text: string): string {
    let result = text;
    if (text.length > maxTextLength) {
      result = text.substring(0, maxTextLength - 4);
      result.concat("...");
    }
    result = replacePrimeSymbol(result);
    return result;
  }
  
  function replacePrimeSymbol(text: string): string {
    return text.replace(/"/g, "'");
}

export {setCharAt, regulateStringLength, replacePrimeSymbol};
