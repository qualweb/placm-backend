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

const get_all_tags_names = async () => {
  let query;
  try {
    query =
    `SELECT t.Name as name,
      t.TagId as id
    FROM
      Tag t`;
    let result = (await execute_query_proto(query));
    return success(result);
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
                Assertion a
              WHERE 
                date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
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

const get_data_filtered = async (filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let query = 
  `SELECT t.TagId as id,
    t.Name as name,
    COUNT(DISTINCT p.PageId) as nPages,
    COUNT(DISTINCT a.AssertionId) as nAssertions,
    COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
    COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
    COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
    COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
    COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested
  FROM
    Application app
  INNER JOIN
    TagApplication ta
      ON ta.ApplicationId = app.ApplicationId
  INNER JOIN
    Tag t
      ON t.TagId = ta.TagId`;

  if(filters.continentIds){
    query = query.concat(`
    INNER JOIN
      Country c
        ON c.CountryId = app.CountryId
        AND c.ContinentId IN ("${filters.continentIds}")`);
  }

  query = query.concat(`
  INNER JOIN
    Page p
      ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
  INNER JOIN
  (SELECT a.AssertionId, a.PageId, a.Outcome
    FROM
      Assertion a
    WHERE
      date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
      AND a.Deleted = '0'
    ORDER BY date DESC) a
      ON a.PageId = p.PageId
  WHERE app.Deleted = '0'`);

  if(filters.countryIds){
    query = query.concat(`
    AND app.CountryId IN (${filters.countryIds})`);
  }
  if(filters.sectorIds){
    query = query.concat(`
    AND app.Sector IN (${filters.sectorIds})`);
  }
  query = query.concat(`
  GROUP BY t.TagId, t.Name;`);

  try {
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

export {get_data_filtered};