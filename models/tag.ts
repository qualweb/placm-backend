import { success, error } from "../lib/responses";
import { execute_query_proto, execute_query } from "../lib/database";

const get_number_of_tags = async () => {
  try {
    let query = `SELECT COUNT(*) as number FROM Tag;`;
    let result = (await execute_query_proto(query));
    return success(result[0].number);
  } catch(err){
    return error(err);
  }
}

const get_all_tags_names = async (serverName: string) => {
  let query;
  try {
    query =
    `SELECT t.Name as name,
      t.TagId as id,
      NOW() as date
    FROM
      Tag t`;
    let result = (await execute_query(serverName, query));
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

const get_data = async (serverName: any, filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let params = [];
  let filtered, splitted;
  let query = 
  `SELECT t.TagId as id,
    t.Name as name,
    COUNT(DISTINCT p.PageId) as nPages,
    COUNT(DISTINCT a.AssertionId) as nAssertions,
    COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
    COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
    COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
    COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
    COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested`;
    
  if(filters.continentIds && filters.continentIds !== '0'){
    filtered = filters.continentIds.split(',').filter(function(v: string, i: any, arr: any){return v !== '0';});
    params.push(filtered);
    query = query + `,
    (SELECT JSON_ARRAYAGG(cont.Name) FROM Continent cont WHERE cont.ContinentId IN (?)) as continentNames`;
  }

  if(filters.countryIds && filters.countryIds !== '0'){
    filtered = filters.countryIds.split(',').filter(function(v: string, i: any, arr: any){return v !== '0';});
    params.push(filtered);
    query = query + `,
    (SELECT JSON_ARRAYAGG(c.Name) FROM Country c WHERE c.CountryId IN (?)) as countryNames`
  }

  query = query + `
  FROM
    Application app
  LEFT JOIN
    TagApplication ta
      ON ta.ApplicationId = app.ApplicationId
  LEFT JOIN
    Tag t
      ON t.TagId = ta.TagId`;

  if(filters.continentIds){
    query = query + `
    LEFT JOIN
      Country c
        ON c.CountryId = app.CountryId`;
  }

  query = query + `
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
  WHERE app.Deleted = '0'`;

  if(filters.continentIds){
    splitted = filters.continentIds.split(',');
    if(filters.continentIds === '0'){
      query = query + `
      AND c.ContinentId is null`;
    } else if (splitted.includes('0')) {

      // removing unspecified from filters
      filtered = splitted.filter(function(v: string, i: any, arr: any){return v !== '0';});
      params.push(filtered);
      
      query = query + `
      AND (c.ContinentId is null OR c.ContinentId IN (?))`;
    } else {
      params.push(splitted);
      query = query + `
      AND c.ContinentId IN (?)`;
    }
  }

  if(filters.countryIds){
    splitted = filters.countryIds.split(',');
    if(filters.countryIds === '0'){
      query = query + `
      AND app.CountryId is null`;
    } else if (splitted.includes('0')) {

      // removing unspecified from filters
      filtered = splitted.filter(function(v: string, i: any, arr: any){return v !== '0';});
      params.push(filtered);
      
      query = query + `
      AND (app.CountryId is null OR app.CountryId IN (?))`;
    } else {
      params.push(splitted);
      query = query + `
      AND app.CountryId IN (?)`;
    }
  }

  if(filters.sectorIds){
    params.push(filters.sectorIds.split(','));
    query = query + `
    AND app.Sector IN (?)`;
  }
  
  query = query + `
  GROUP BY 1, 2`;

  try {
    let result = (await execute_query(serverName, query, params));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_sc = async (serverName: string, filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let params = [];
  let filtered, splitted;
  let query =
  `DROP TABLE IF EXISTS workingTable;
  CREATE TEMPORARY TABLE workingTable AS
  SELECT t.TagId as id,
  t.Name as name,
  scriteria.SCId,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'failed', 1, NULL)) as failed,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'cantTell', 1, NULL)) as cantTell,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'passed', 1, NULL)) as passed,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'inapplicable', 1, NULL)) as inapplicable,
  COUNT(DISTINCT scriteria.SCId, IF(a.AssertionId IS NULL OR a.Outcome = 'untested', 1, NULL)) as untested
  FROM
    Application app
  LEFT JOIN
    TagApplication ta
      ON ta.ApplicationId = app.ApplicationId
  LEFT JOIN
    Tag t
      ON t.TagId = ta.TagId`;

  if(filters.continentIds){
    query = query + `
    LEFT JOIN
      Country c
        ON c.CountryId = app.CountryId`;
  }

  query = query + `
  INNER JOIN
    Page p
    ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
  INNER JOIN
    (SELECT SCId, RuleId
        FROM RuleSuccessCriteria scr
    UNION ALL
    SELECT SCId, NULL as RuleId
      FROM SuccessCriteria sc
            WHERE SCId NOT IN (SELECT SCId FROM RuleSuccessCriteria scr)) scriteria
  LEFT JOIN
    (SELECT a.AssertionId, a.PageId, a.Outcome, a.RuleId, a.EvaluationToolId
    FROM
    Assertion a
    WHERE
    date = (SELECT max(a1.Date) 
        FROM Assertion a1 
        WHERE a.RuleId = a1.RuleId 
        AND a.PageId = a1.PageId)
    AND a.Deleted = '0'
    ORDER BY date DESC) a
    ON a.PageId = p.PageId
        AND scriteria.RuleId = a.RuleId
  WHERE app.Deleted = '0' AND scriteria.SCId is not null`;

  if(filters.continentIds){
    splitted = filters.continentIds.split(',');
    if(filters.continentIds === '0'){
      query = query + `
      AND c.ContinentId is null`;
    } else if (splitted.includes('0')) {

      // removing unspecified from filters
      filtered = splitted.filter(function(v: string, i: any, arr: any){return v !== '0';});
      params.push(filtered);
      
      query = query + `
      AND (c.ContinentId is null OR c.ContinentId IN (?))`;
    } else {
      params.push(splitted);
      query = query + `
      AND c.ContinentId IN (?)`;
    }
  }

  if(filters.countryIds){
    splitted = filters.countryIds.split(',');
    if(filters.countryIds === '0'){
      query = query + `
      AND app.CountryId is null`;
    } else if (splitted.includes('0')) {

      // removing unspecified from filters
      filtered = splitted.filter(function(v: string, i: any, arr: any){return v !== '0';});
      params.push(filtered);
      
      query = query + `
      AND (app.CountryId is null OR app.CountryId IN (?))`;
    } else {
      params.push(splitted);
      query = query + `
      AND app.CountryId IN (?)`;
    }
  }

  if(filters.sectorIds){
    params.push(filters.sectorIds.split(','));
    query = query + `
    AND app.Sector IN (?)`;
  }

  query = query + `
  GROUP BY 1, 3
  ORDER BY 1, 2, 3;`;

  query = query + `
  UPDATE workingTable
    SET cantTell = 0, passed = 0, inapplicable = 0, untested = 0
    WHERE failed = 1;
  UPDATE workingTable
    SET passed = 0, inapplicable = 0, untested = 0
    WHERE failed = 0 AND cantTell = 1;
  UPDATE workingTable
    SET inapplicable = 0, untested = 0
    WHERE failed = 0 AND cantTell = 0 AND passed = 1;
  UPDATE workingTable
    SET untested = 0
    WHERE failed = 0 AND cantTell = 0 AND passed = 0 AND inapplicable = 1;
  
  SELECT id, name, 
    SUM(failed) as nFailed, 
    SUM(cantTell) as nCantTell,
    SUM(passed) as nPassed,
    SUM(inapplicable) as nInapplicable,
    SUM(untested) as nUntested`;

  if(filters.continentIds && filters.continentIds !== '0'){
    filtered = filters.continentIds.split(',').filter(function(v: string, i: any, arr: any){return v !== '0';});
    params.push(filtered);
    query = query + `,
    (SELECT JSON_ARRAYAGG(cont.Name) FROM Continent cont WHERE cont.ContinentId IN (?)) as continentNames`;
  }

  if(filters.countryIds && filters.countryIds !== '0'){
    filtered = filters.countryIds.split(',').filter(function(v: string, i: any, arr: any){return v !== '0';});
    params.push(filtered);
    query = query + `,
    (SELECT JSON_ARRAYAGG(c.Name) FROM Country c WHERE c.CountryId IN (?)) as countryNames`
  }

  query = query + `
  FROM workingTable
  GROUP BY 1, 2;`;

  try {
    let result = (await execute_query(serverName, query, params, true));
    return success(result);
  } catch(err){
    return error(err);
  }
}

export {get_all_tags_names, get_data, get_data_sc};