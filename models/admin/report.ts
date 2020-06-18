import { execute_query } from "../../lib/database";
import { findAssertions } from "../../lib/earl/find_assertions";
import { error, success } from "../../lib/responses";
import { EarlAssertion } from "../../lib/earl/earl_types";
import { regulateStringLength, readyUrlToQuery, readyStringToQuery } from "../../lib/util";
import { trim } from "lodash";

const add_earl_report = async (serverName: string, formData: any, ...jsons: string[]) => {
  let query;
  let urlRegex, urlTested, urlRegexMatch, assertionDate;
  let toolName, toolUrl, toolDesc, toolVersion;
  let ruleName, ruleUrl, ruleDesc;
  let orgName, orgId;
  let websiteName, websiteUrl, websiteCountry, websiteId;
  let websiteTags: number[] = [];
  let pageUrl;
  let assertionMode, assertionOutcome, assertionDesc;
  let evaluationTool, rule, org, website, tagSql, tagApp, page, assertionSQL;

  let assertions: Array<EarlAssertion> = [];

  for (let json of jsons) {
    if (json.length) {
      let assertionList = await findAssertions(JSON.parse(json));
      for (let assertion of assertionList) {
        assertions.push(assertion);
      }
    }
  }

  let result: any = {
    assertor: [],
    evaluationTool: [],
    rule: [],
    organization: [],
    application: [],
    tag: [],
    tagApplication: [],
    page: [],
    assertion: []
  };

  let index = 0;
  try {
    for (let assertion of assertions) {
      if(assertion){
        //console.log(index);
        index++;

        urlRegex = new RegExp(/^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)(.*)?(#[\w\-]+)?$/);
        urlTested = trim(assertion.subject["source"]);
        urlRegexMatch = urlTested.match(urlRegex);
        assertionDate = assertion.result["earl:date"];

        /* ---------- handle assertor ---------- */
        toolName = regulateStringLength(assertion.subject["earl:assertor"]["earl:title"]["@value"]);

        toolUrl = regulateStringLength(assertion.subject["earl:assertor"]["earl:homepage"] ? 
          assertion.subject["earl:assertor"]["earl:homepage"] : null);
          
        toolDesc = assertion.subject["earl:assertor"]["earl:description"] ?
          regulateStringLength(assertion.subject["earl:assertor"]["earl:description"]) : null;

        toolVersion = assertion.subject["earl:assertor"]["earl:hasVersion"] ?
          regulateStringLength(assertion.subject["earl:assertor"]["earl:hasVersion"]) : null;

        query = `SELECT EvaluationToolId FROM EvaluationTool WHERE name = "${toolName}";`;
        evaluationTool = (await execute_query(serverName, query))[0];
        if (!evaluationTool) {
          query = `INSERT INTO EvaluationTool (name, url, description, version)
            VALUES ("${toolName}", "${toolUrl}", "${toolDesc}", "${toolVersion}");`;
          evaluationTool = await execute_query(serverName, query);
          result.evaluationTool.push(evaluationTool.insertId);
        }

        /* ---------- handle rule ---------- */
        ruleName = regulateStringLength(
          Array.isArray(assertion.test["earl:title"]) ?
            assertion.test["earl:title"][1]["@value"] : assertion.test["earl:title"]["@value"]);

        ruleUrl = regulateStringLength(assertion.test["@id"]);

        ruleDesc = regulateStringLength(
          Array.isArray(assertion.test["earl:description"]) ?
            assertion.test["earl:description"][1] : assertion.test["earl:description"]);

        query = `SELECT RuleId FROM Rule WHERE url = "${ruleUrl}";`;
        rule = (await execute_query(serverName, query))[0];
        if (!rule) {
          query = `INSERT INTO Rule (name, url, description)
            VALUES ("${ruleName}", "${ruleUrl}", "${ruleDesc}");`;
          rule = await execute_query(serverName, query);
          result.rule.push(rule.insertId);
        }

        /* ---------- handle organization ---------- */
        orgName = regulateStringLength(formData.org);

        query = `SELECT OrganizationId FROM Organization WHERE name = "${orgName}";`;
        org = (await execute_query(serverName, query))[0];
        if (!org) {
          query = `INSERT INTO Organization (name)
            VALUES ("${orgName}");`;
            org = await execute_query(serverName, query);
          result.organization.push(org.insertId);
        }
        orgId = org.OrganizationId ? org.OrganizationId : org.insertId;

        /* ---------- handle website/app ---------- */

        /*** this is the way to get the url without the form, do we need this? ***/
        /*websiteUrl = regulateStringLength(urlRegexMatch ? urlRegexMatch[3] : "");
        let websiteUrlSplitted = websiteUrl.split(".");
        if(websiteUrl.length > 0){
          websiteName = regulateStringLength(websiteUrlSplitted[0] === 'www' ? websiteUrlSplitted[1] : websiteUrlSplitted[0]);
        } else {
          //todo tem de mandar o nome da aplicacao tambem
        }
        query = `SELECT ApplicationId FROM Application WHERE url = "${websiteUrl}";`;
        website = (await execute_query(serverName, query))[0];
        if (!website) {
          query = `INSERT INTO Application (name, url, creationdate)
            VALUES ("${websiteName}", "${websiteUrl}", "${assertionDate}");`;
          website = await execute_query(serverName, query);
          result.application.push(website.insertId);
        }*/
        /***                                                                  ***/
        websiteUrl = formData.appUrl ? readyUrlToQuery(formData.appUrl) : null;
        websiteName = regulateStringLength(formData.appName);
        websiteCountry = formData.country ? formData.country.id : null;
        query = `SELECT ApplicationId FROM Application WHERE name = "${websiteName}" AND OrganizationId = "${orgId}";`;
        website = (await execute_query(serverName, query))[0];
        if (!website) {
          query = `INSERT INTO Application (name, organizationid, type, sector, url, creationdate, countryid)
            VALUES ("${websiteName}", ${orgId}, ${formData.type}, ${formData.sector}, ${websiteUrl}, "${assertionDate}", ${websiteCountry});`;
          website = await execute_query(serverName, query);
          result.application.push(website.insertId);
        }
        websiteId = website.ApplicationId ? website.ApplicationId : website.insertId;

        /* ---------- handle tag ---------- */
        for(let tag of formData.tags){
          let tagName = tag;
          if(typeof tag !== 'string'){
            tagName = tag.name;
          }
          tagName = readyStringToQuery(tagName);
          query = `SELECT TagId FROM Tag WHERE name = ${tagName};`;
          tagSql = (await execute_query(serverName, query))[0];
          if(!tagSql){
            query = `INSERT INTO Tag (name)
              VALUES (${tagName});`;
              tagSql = await execute_query(serverName, query);
            result.tag.push(tagSql.insertId);
          }
          websiteTags.push(tagSql.TagId ? tagSql.TagId : tagSql.insertId);
        }
        for(let tId of websiteTags){
          query = `SELECT * FROM TagApplication WHERE TagId = ${tId} AND ApplicationId = ${websiteId};`;
          tagApp = (await execute_query(serverName, query))[0];
          if(!tagApp){
            query = `INSERT INTO TagApplication (TagId, ApplicationId)
            VALUES (${tId}, ${websiteId});`;
            tagApp = await execute_query(serverName, query);
            result.tagApplication.push(tagApp.insertId);
          }
        }

        /* ---------- handle page ---------- */
        //pageUrl = regulateStringLength(websiteUrl.concat(urlRegexMatch[4]));
        pageUrl = urlTested;

        query = `SELECT PageId FROM Page WHERE url = "${pageUrl}";`;
        page = (await execute_query(serverName, query))[0];
        if (!page) {
          query = `INSERT INTO Page (url, creationdate, applicationid)
            VALUES ("${pageUrl}", "${assertionDate}", "${website.insertId ||
            website.ApplicationId}");`;
          page = await execute_query(serverName, query);
          result.page.push(page.insertId);
        }

        /* ---------- handle assertion ---------- */
        assertionMode = regulateStringLength(assertion["mode"]);
        
        assertionOutcome = regulateStringLength(assertion.result["outcome"]);

        assertionDesc = assertion.result["earl:description"] ?
          regulateStringLength(assertion.result["earl:description"]) : null;

        query = `SELECT AssertionId FROM Assertion 
                  WHERE 
                  EvaluationToolId = "${evaluationTool.insertId ||
                    evaluationTool.EvaluationToolId}" AND
                  RuleId =  "${rule.insertId || rule.RuleId}" AND
                  PageId = "${page.insertId || page.PageId}" AND
                  Mode = "${assertionMode}" AND
                  Date = "${assertionDate}" AND
                  Description = "${assertionDesc}" AND
                  Outcome = "${assertionOutcome}";`;
        assertionSQL = (await execute_query(serverName, query))[0];
        if (!assertionSQL) {
          query = `INSERT INTO Assertion (EvaluationToolId, RuleId, PageId, Mode, Date, Description, Outcome)
                  VALUES ("${evaluationTool.insertId ||
                    evaluationTool.EvaluationToolId}", "${rule.insertId ||
            rule.RuleId}", "${page.insertId || page.PageId}",
                  "${assertionMode}", "${assertionDate}", "${assertionDesc}", "${assertionOutcome}");`;
          assertionSQL = await execute_query(serverName, query);
          result.assertion.push(assertionSQL.insertId);
        }
      }
    }
  } catch (err) {
    console.log(err);
    throw error(err);
  }
  return success(result);
};

export { add_earl_report };
