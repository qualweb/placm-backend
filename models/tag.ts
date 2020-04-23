import { success, error } from "../lib/responses";
import { execute_query_proto } from "../lib/database";

const get_number_of_tags = async () => {
  try {
    let query = `SELECT COUNT(*) as number FROM Tag;`;
    let result = (await execute_query_proto(query));
    return success(result[0].number);
  } catch(err){
    return error(err);
  }
}

// method to get name, number of applications, number of pages,
// number of passed, failed, cantTell, inapplicable and untested (most recent) assertions
// of each tag
const get_all_tag_data = async () => {
  let query;
  try {
    query = `SELECT t.TagId as id, t.Name as name,
              COUNT(DISTINCT ta.ApplicationId) as nApps,
              COUNT(DISTINCT p.PageId) as nPages,
              COUNT(DISTINCT a.AssertionId) as nAssertions,
              COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
              COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
              COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
              COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
              COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested
            FROM
              Tag t
            INNER JOIN
              TagApplication ta
                ON t.TagId = ta.TagId
            INNER JOIN
              Application app
                ON app.ApplicationId = ta.ApplicationId AND app.Deleted = '0'
            INNER JOIN
              Page p
                ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
            INNER JOIN (
              SELECT a.AssertionId, a.RuleId, a.PageId, a.Outcome
              FROM 
                assertion a
              WHERE 
                date = (SELECT max(a1.Date) FROM assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
                AND a.Deleted = '0'
              ORDER BY date DESC) a
                ON a.PageId = p.PageId
            GROUP BY t.TagId;`;
    let result = (await execute_query_proto(query));
    return success(<any> result);
  } catch(err){
    console.log(err);
    return error(err);
  }
}

export {get_number_of_tags, get_all_tag_data};