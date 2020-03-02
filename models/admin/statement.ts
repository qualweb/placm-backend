import { forEach } from "lodash";
import { add_earl_report } from "./report";
import { parse } from 'node-html-parser';

const fetch = require("node-fetch");

const add_accessibility_statement = async (...texts: string[]) => {

  let statements: any[] = [];

  //console.log(texts.length);

  for(let text of texts){
    if(text){
      statements.push(parse(text));
    }
  }

  let autoEvaluations, manualEvaluations, wwwcLinks;
  let results: string[] = [];

  for(let i = 0; i < statements.length; i++){
    autoEvaluations = statements[i].querySelectorAll(".mr.mr-automatic-summary");
    manualEvaluations = statements[i].querySelectorAll(".mr.mr-manual-summary");
    wwwcLinks = statements[i].querySelectorAll(".technical-information.related-evidence");

    let linksFound = findChildrenLinks(autoEvaluations, manualEvaluations, wwwcLinks);
    for(let i = 0; i < linksFound.length; i++){
      let fetchedText = await fetch(linksFound[i]);
      if(await fetchedText){
        results.push(await fetchedText.text());
      }
    }
  }

  return add_earl_report(...results);
}

function findChildrenLinks(...evaluations: NodeListOf<Element>[]): string[] {
  let aElements, href;
  let results: string[] = [];

  forEach(evaluations, (evaluation => {
    forEach(evaluation, (element => {
      if(element.tagName === 'a'){
        href = element.getAttribute('href');
        if(href && /^https?:\/\/.*\.json$/.test(href)){
          results.push(href);
        }
      } else {
        aElements = element.querySelectorAll('a');
        forEach(aElements, (a => {
          href = a.getAttribute('href');
          if(href && /^https?:\/\/.*\.json$/.test(href)){
            results.push(href);
          }
        }));
      }
    }));
  }));

  return results;
}

export { add_accessibility_statement };