import { success, error } from "../../lib/responses";
import { execute_query_proto } from "../../lib/database";
import { COUNTRY_JSON } from "../../lib/constants";
import * as fs from 'fs';
import { trim } from "lodash";

const add_filedata = async () => {
  let result: any = {
    tags: [],
    evaluationTools: [],
    rules: [],
    applications: [],
    pages: [],
    assertions: [],
    tagApps: []
  };

  let query, entries: string[], data: string[];
  let tag, evalTool, rule, app, page, assertion, tagapp, url;

  fs.readFile('lib/protodata.txt', async function (err, data) {
    if (err) {
      console.error(err);
    }
    entries = data.toString().split('\r\n\r\n');
    for (let entry of entries) {
      data = trim(entry).split('\r\n');
      switch (data[0]) {
        case 'Tag':
          query = `SELECT TagId FROM Tag WHERE name = "${data[1]}";`;
          tag = (await execute_query_proto(query))[0];
          if (!tag) {
            query = `INSERT INTO Tag (name)
                VALUES ("${data[1]}");`;
            tag = await execute_query_proto(query);
            result.tags.push(tag.insertId);
          };
          break;
        case 'EvaluationTool':
          query = `SELECT EvaluationToolId FROM EvaluationTool WHERE name = "${data[1]}";`;
          evalTool = (await execute_query_proto(query))[0];
          if (!evalTool) {
            if(data[2] === '-'){
              url = null;
            } else {
              url = '"'.concat(data[2],'"');
            }
            query = `INSERT INTO EvaluationTool (name, url, description, version)
                VALUES ("${data[1]}", ${url}, "${data[3]}", "${data[4]}");`;
            evalTool = await execute_query_proto(query);
            result.evaluationTools.push(evalTool.insertId);
          };
          break;
        case 'Rule':
          query = `SELECT RuleId FROM Rule WHERE name = "${data[1]}";`;
          rule = (await execute_query_proto(query))[0];
          if (!rule) {
            if(data[2] === '-'){
              url = null;
            } else {
              url = '"'.concat(data[2],'"');
            }
            query = `INSERT INTO Rule (name, url, description)
                VALUES ("${data[1]}", ${url}, "${data[3]}");`;
            rule = await execute_query_proto(query);
            result.rules.push(rule.insertId);
          };
          break;
        case 'Application':
          query = `SELECT ApplicationId FROM Application WHERE name = "${data[1]}";`;
          app = (await execute_query_proto(query))[0];
          if (!app) {
            query = `INSERT INTO Application (name, organization, type, sector, url, creationdate, score, countryid)
                VALUES ("${data[1]}", "${data[2]}", "${data[3]}", "${data[4]}", "${data[5]}", "${data[6]}", "${data[7]}", "${data[8]}");`;
            app = await execute_query_proto(query);
            result.applications.push(app.insertId);
          };
          break;
        case 'Page':
          query = `SELECT PageId FROM Page WHERE url = "${data[1]}";`;
          page = (await execute_query_proto(query))[0];
          if (!page) {
            query = `INSERT INTO Page (url, creationdate, score, applicationid)
                VALUES ("${data[1]}", "${data[2]}", "${data[3]}", "${data[4]}");`;
            page = await execute_query_proto(query);
            result.pages.push(page.insertId);
          };
          break;
        case 'Assertion':
          query = `SELECT AssertionId FROM Assertion WHERE 
              evaluationtoolid = "${data[1]}" AND
              ruleid = "${data[2]}" AND
              pageid = "${data[3]}" AND
              mode = "${data[4]}" AND
              date = "${data[5]}" AND
              description = "${data[6]}" AND
              outcome = "${data[7]}";`;
          assertion = (await execute_query_proto(query))[0];
          if (!assertion) {
            query = `INSERT INTO Assertion (evaluationtoolid, ruleid, pageid, mode, date, description, outcome)
                VALUES ("${data[1]}", "${data[2]}", "${data[3]}", "${data[4]}", "${data[5]}", "${data[6]}", "${data[7]}");`;
            assertion = await execute_query_proto(query);
            result.assertions.push(assertion.insertId);
          };
          break;
        case 'TagApplication':
          query = `SELECT TagId FROM TagApplication WHERE 
              TagId = "${data[1]}" AND
              ApplicationId = "${data[2]}";`;
          tagapp = (await execute_query_proto(query))[0];
          if (!tagapp) {
            query = `INSERT INTO TagApplication (TagId, ApplicationId)
                VALUES ("${data[1]}", "${data[2]}");`;
              tagapp = await execute_query_proto(query);
            result.tagApps.push(tagapp.insertId);
          };
          break;
        default:
          break;
      }
    }
    return success(result);
  });
};

const add_countries = async () => {
  let result: any = {
    entries: [],
    countries: [],
    continents: []
  };

  let query, country;

  try {
    for (let c of Object.values(COUNTRY_JSON)) {
      query = `SELECT Name FROM Country WHERE name = "${c.country}";`;
      country = (await execute_query_proto(query))[0];
      if (!country && c.country) {
        query = `INSERT INTO Country (name, continent)
            VALUES ("${c.country}", "${c.continent}");`;
        country = await execute_query_proto(query);
        result.entries.push(country.insertId);
        result.countries.push(c.country);
        if (result.continents.indexOf(c.continent) === -1)
          result.continents.push(c.continent);
      }
    }
  } catch (err) {
    console.log(err);
    throw error(err);
  }
  return success(result);
};

export { add_filedata, add_countries };
