import { success, error } from "../lib/responses";
import { execute_query } from "../lib/database";

const get_data_success_criteria_filtered = async (serverName: string, filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let params = [];
  let filtered, splitted;
  let query = 
  `SELECT sc.Name as name,
    sc.SCId as id,
    sc.Principle as princ,
    sc.Level as level,
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

  if(filters.tagIds && filters.tagIds !== '0'){
    filtered = filters.tagIds.split(',').filter(function(v: string, i: any, arr: any){return v !== '0';});
    params.push(filtered);
    query = query + `,
    (SELECT JSON_ARRAYAGG(t.Name) FROM Tag t WHERE t.TagId IN (?)) as tagNames`;
  }

  if(filters.orgIds){
    params.push(filters.orgIds.split(','));
    query = query + `,
    (SELECT JSON_ARRAYAGG(org.Name) FROM Organization org WHERE org.OrganizationId IN (?)) as orgNames`;
  }

  if(filters.appIds){
    params.push(filters.appIds.split(','));
    query = query + `,
    (SELECT JSON_ARRAYAGG(app.Name) FROM Application app WHERE app.ApplicationId IN (?)) as appNames`;
  }

  if(filters.evalIds){
    params.push(filters.evalIds.split(','));
    query = query + `,
    (SELECT JSON_ARRAYAGG(eval.Name) FROM EvaluationTool eval WHERE a.EvaluationToolId IN (?) AND eval.EvaluationToolId = a.EvaluationToolId) as evalNames`;
  }
    
  query = query + `
  FROM
    Application app`;
    
  query = query + `
  INNER JOIN
    Page p
      ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
  INNER JOIN
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
  INNER JOIN
    RuleSuccessCriteria scr
      ON scr.RuleId = a.RuleId
  INNER JOIN
    SuccessCriteria sc
      ON scr.SCId = sc.SCId`;

  if(filters.tagIds){
    query = query + `
    LEFT JOIN
      TagApplication ta
        ON ta.ApplicationId = app.ApplicationId`;
  }

  if(filters.continentIds){
    query = query + `
    LEFT JOIN
      Country c
        ON c.CountryId = app.CountryId`;
  }

  query = query + `
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

  if(filters.tagIds){
    splitted = filters.tagIds.split(',');
    if(filters.tagIds === '0'){
      query = query + `
      AND ta.TagId is null`;
    } else if (splitted.includes('0')) {

      // removing unspecified from filters
      filtered = splitted.filter(function(v: string, i: any, arr: any){return v !== '0';});
      params.push(filtered);
      
      query = query + `
      AND (ta.TagId is null OR ta.TagId IN (?))`;
    } else {
      params.push(splitted);
      query = query + `
      AND ta.TagId IN (?)`;
    }
  }

  if(filters.appIds){
    params.push(filters.appIds.split(','));
    query = query + `
    AND app.ApplicationId IN (?)`;
  }

  if(filters.sectorIds){
    params.push(filters.sectorIds.split(','));
    query = query + `
    AND app.Sector IN (?)`;
  }

  if(filters.orgIds){
    params.push(filters.orgIds.split(','));
    query = query + `
    AND app.OrganizationId IN (?)`;
  }

  if(filters.evalIds){
    params.push(filters.evalIds.split(','));
    query = query + `
    AND a.EvaluationToolId IN (?)`;
  }

  query = query + `
  GROUP BY 2;`;

  try {
    let result = (await execute_query(serverName, query, params));
    return success(result);
  } catch(err){
    return error(err);
  }
}

export {get_data_success_criteria_filtered};