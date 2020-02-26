import execute_query = require("../lib/database");
import { findAssertions } from "../lib/earl/find_assertions";
import { error, success } from "../lib/responses";
import {maxTextLength} from "../lib/constants"
import { EarlAssertion } from "../lib/earl/earl_types";

const add_earl_report = async (...jsons: string[]) => {
  
  let query;
  let urlRegex, urlTested, urlRegexMatch, assertionDate;
  let toolName, toolUrl, toolDesc, toolVersion;
  let ruleName, ruleUrl, ruleDesc;
  let websiteName, websiteUrl;
  let pageUrl;
  let assertionMode, assertionOutcome, assertionDesc;
  let evaluationTool, rule, website, page, assertionSQL;

  let assertions: Array<EarlAssertion> = [];

  let index = 0;
  for(let json of jsons){
    if(json.length){
      for(let assertion of await findAssertions(JSON.parse(json))){
        assertions.push(assertion);
      }
    }
  }

  let result: any = {
    "assertor": [],
    "evaluationTool": [],
    "rule": [],
    "application": [],
    "page": [],
    "assertion": []
  };

  try {
    for (let assertion of assertions) {
      //console.log(index);
      index++;

      urlRegex = new RegExp(/^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/);
      urlTested = assertion.subject["source"];
      urlRegexMatch = urlTested.match(urlRegex);
      assertionDate = assertion.result["earl:date"];
      
      /* ---------- handle assertor ---------- */
      toolName = regulateStringLength(assertion.subject["earl:assertor"]["earl:title"]["@value"]);
      toolUrl = regulateStringLength(assertion.subject["earl:assertor"]["earl:homepage"] ? assertion.subject["earl:assertor"]["earl:homepage"] : null);
      toolDesc = assertion.subject["earl:assertor"]["earl:description"] ? regulateStringLength(assertion.subject["earl:assertor"]["earl:description"]) : null;
      
      toolVersion = assertion.subject["earl:assertor"]["earl:hasVersion"] ? regulateStringLength(assertion.subject["earl:assertor"]["earl:hasVersion"]) : null;


      query = `SELECT EvaluationToolId FROM EvaluationTool WHERE name = "${toolName}";`;
      evaluationTool = (await execute_query(query))[0];
      if(!evaluationTool) {
        query = `INSERT INTO EvaluationTool (name, url, description, version)
          VALUES ("${toolName}", "${toolUrl}", "${toolDesc}", "${toolVersion}");`;
        evaluationTool = await execute_query(query);
        result.evaluationTool.push(evaluationTool.insertId);
      }

      /* ---------- handle rule ---------- */
      ruleName = regulateStringLength(Array.isArray(assertion.test["earl:title"]) ? assertion.test["earl:title"][1]["@value"] : assertion.test["earl:title"]["@value"]);
      ruleUrl = regulateStringLength(assertion.test["@id"]);
      ruleDesc = regulateStringLength(Array.isArray(assertion.test["earl:description"]) ? assertion.test["earl:description"][1] : assertion.test["earl:description"]);
      
      query = `SELECT RuleId FROM Rule WHERE url = "${ruleUrl}";`;
      rule = (await execute_query(query))[0];
      if(!rule) {
        query = `INSERT INTO Rule (name, url, description)
          VALUES ("${ruleName}", "${ruleUrl}", "${ruleDesc}");`;
        rule = await execute_query(query);
        result.rule.push(rule.insertId);
      }

      /* ---------- handle website/app ---------- */
      websiteUrl = regulateStringLength(urlRegexMatch[3]);
      websiteName = regulateStringLength(websiteUrl.split(".")[0]);

      query = `SELECT ApplicationId FROM Application WHERE url = "${websiteUrl}";`;
      website = (await execute_query(query))[0];
      if(!website) {
        query = `INSERT INTO Application (name, url, creationdate)
          VALUES ("${websiteName}", "${websiteUrl}", "${assertionDate}");`;
        website = await execute_query(query);
        result.website.push(website.insertId);
      }
      /* ---------- handle page ---------- */
      pageUrl = regulateStringLength(websiteUrl.concat(urlRegexMatch[4]));

      query = `SELECT PageId FROM Page WHERE url = "${pageUrl}";`;
      page = (await execute_query(query))[0];
      if(!page){
        query = `INSERT INTO Page (url, creationdate, applicationid)
          VALUES ("${pageUrl}", "${assertionDate}", "${website.insertId || website.ApplicationId}");`;
        page = await execute_query(query);
        result.page.push(page.insertId);
      }

      /* ---------- handle assertion ---------- */
      assertionMode = regulateStringLength(assertion["mode"]);
      assertionOutcome = regulateStringLength(assertion.result["outcome"]);
      assertionDesc = assertion.result["earl:description"] ? regulateStringLength(assertion.result["earl:description"]) : null;

      query = `SELECT AssertionId FROM Assertion 
                WHERE 
                EvaluationToolId = "${evaluationTool.insertId || evaluationTool.EvaluationToolId}" AND
                RuleId =  "${rule.insertId || rule.RuleId}" AND
                PageId = "${page.insertId || page.PageId}" AND
                Mode = "${assertionMode}" AND
                Date = "${assertionDate}" AND
                Description = "${assertionDesc}" AND
                Outcome = "${assertionOutcome}" AND
                TestedUrl = "${urlTested}";`;
      assertionSQL = (await execute_query(query))[0];
      if(!assertionSQL){
        query = `INSERT INTO Assertion (EvaluationToolId, RuleId, PageId, Mode, Date, Description, Outcome, TestedUrl)
                VALUES ("${evaluationTool.insertId || evaluationTool.EvaluationToolId}", "${rule.insertId || rule.RuleId}", "${page.insertId || page.PageId}",
                "${assertionMode}", "${assertionDate}", "${assertionDesc}", "${assertionOutcome}", "${urlTested}");`
        assertionSQL = await execute_query(query);
        result.assertion.push(assertionSQL.insertId);
      }
    }
    /*
        FROM
          Website as w,
          Domain as d,
          DomainPage as dp,
          Page as p,
          Evaluation as e
        WHERE
          LOWER(w.Name) = "${_.toLower(website)}" AND
          w.UserId = "${user_id}" AND
          d.WebsiteId = w.WebsiteId AND
          dp.DomainId = d.DomainId AND
          p.PageId = dp.PageId AND
          p.Uri = "${url}" AND 
          e.PageId = p.PageId AND 
          e.Show_To LIKE "_1"
        ORDER BY e.Evaluation_Date DESC 
        LIMIT 1`;
    }

    return success({
      pagecode: Buffer.from(evaluation.Pagecode, "base64").toString(),
      data: {
        title: evaluation.Title,
        score: evaluation.Score,
        rawUrl: url,
        tot: tot,
        nodes: JSON.parse(Buffer.from(evaluation.Nodes, "base64").toString()),
        conform: `${evaluation.A}@${evaluation.AA}@${evaluation.AAA}`,
        elems: tot.elems,
        date: evaluation.Evaluation_Date
      }
    });
    */
  } catch (err) {
    console.log(err);
    throw error(err);
  }
  return success(result);
};

function regulateStringLength(text: string) : string {
  let result = text;
  if(text.length > maxTextLength){
    result = text.substring(0, maxTextLength - 4);
    result.concat("...");
  }
  result = replacePrimeSymbol(result);
  return result;
}

function replacePrimeSymbol(text: string): string {
  return text.replace(/"/g, "\'");
}

export {add_earl_report};