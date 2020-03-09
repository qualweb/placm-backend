import { maxTextLength } from "./constants";
import { trim } from "lodash";

function setCharAt(str: string, index: number, chr: string): string {
  if (index > str.length - 1) return str;
  return str.substr(0, index) + chr + str.substr(index + 1);
}

function regulateStringLength(text: string): string {
  let result = trim(text);
  if (text.length > maxTextLength) {
    result = text.substring(0, maxTextLength - 4);
    result.concat("...");
  }
  result = replacePrimeSymbol(result);
  return result;
}

function replacePrimeSymbol(text: string): string {
  return trim(text).replace(/"/g, '\\"');
}

function readyStringToQuery(text: string): string {
  return '"'.concat(regulateStringLength(text), '"');
}

function readyUrlToQuery(url: string): string {
  return '"'.concat(replacePrimeSymbol(url), '"');
}

export {setCharAt, regulateStringLength, replacePrimeSymbol, readyStringToQuery, readyUrlToQuery};
