import { execute_query_proto } from "../lib/database";
import { error, success } from "../lib/responses";

const get_data_by_evaluation_tool = async () => {
let query;
  try {
    query =
    `SELECT et.Name as name,
      COUNT(DISTINCT a.AssertionId) as nAssertions,
      COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
      COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
      COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
      COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
      COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested
    FROM
      EvaluationTool et
    INNER JOIN
      Page p
        ON p.Deleted = '0'
    INNER JOIN
    (SELECT a.AssertionId, a.RuleId, a.PageId, a.Outcome, a.EvaluationToolId
      FROM
        Assertion a
      WHERE
        date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
        AND a.Deleted = '0'
      ORDER BY date DESC) a
        ON a.PageId = p.PageId
    WHERE et.EvaluationToolId = a.EvaluationToolId
    GROUP BY et.EvaluationToolId;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_evaluation_tool_filtered = async (filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let query = 
  `SELECT eval.Name as name,
    eval.EvaluationToolId as id,
    COUNT(DISTINCT p.PageId) as nPages,
    COUNT(DISTINCT a.AssertionId) as nAssertions,
    COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
    COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
    COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
    COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
    COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested`;
  if(filters.continentIds){
    query = query.concat(`,
    (SELECT JSON_ARRAYAGG(cont.Name) FROM Continent cont WHERE cont.ContinentId IN (${filters.continentIds})) as continentNames`);
  }
  if(filters.countryIds){
    query = query.concat(`,
    (SELECT JSON_ARRAYAGG(c.Name) FROM Country c WHERE c.CountryId IN (${filters.countryIds})) as countryNames`)
  }
  if(filters.tagIds){
    query = query.concat(`,
    (SELECT JSON_ARRAYAGG(t.Name) FROM Tag t WHERE t.TagId IN (${filters.tagIds})) as tagNames`);
  }
  if(filters.orgIds){
    query = query.concat(`,
    (SELECT JSON_ARRAYAGG(org.Name) FROM Organization org WHERE org.OrganizationId IN (${filters.orgIds})) as orgNames`);
  }
  if(filters.appIds){
    query = query.concat(`,
    (SELECT JSON_ARRAYAGG(app.Name) FROM Application app WHERE app.ApplicationId IN (${filters.appIds})) as appNames`);
  }
  
  query = query.concat(`
    FROM
      EvaluationTool eval
    INNER JOIN
      Application app`);

  if(filters.tagIds){
    query = query.concat(`
    INNER JOIN
      TagApplication ta
        ON ta.ApplicationId = app.ApplicationId
        AND ta.TagId IN (${filters.tagIds})`);
  }

  if(filters.continentIds){
    query = query.concat(`
    INNER JOIN
      Country c
        ON c.CountryId = app.CountryId
        AND c.ContinentId IN (${filters.continentIds})`);
  }

  query = query.concat(`
  INNER JOIN
    Page p
      ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
  INNER JOIN
  (SELECT a.AssertionId, a.PageId, a.Outcome, a.EvaluationToolId
    FROM
      Assertion a
    WHERE
      date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
      AND a.Deleted = '0'
    ORDER BY date DESC) a
      ON a.PageId = p.PageId
      AND a.EvaluationToolId = eval.EvaluationToolId
  WHERE app.Deleted = '0'`);

  if(filters.appIds){
    query = query.concat(`
    AND app.ApplicationId IN (${filters.appIds})`);
  }
  if(filters.countryIds){
    query = query.concat(`
    AND app.CountryId IN (${filters.countryIds})`);
  }
  if(filters.sectorIds){
    query = query.concat(`
    AND app.Sector IN (${filters.sectorIds})`);
  }
  if(filters.orgIds){
    query = query.concat(`
    AND app.OrganizationId IN (${filters.orgIds})`);
  }
  query = query.concat(`
  GROUP BY eval.Name, eval.EvaluationToolId;`);

  try {
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

export {get_data_by_evaluation_tool, get_data_evaluation_tool_filtered};