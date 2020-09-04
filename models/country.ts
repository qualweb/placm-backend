import { success, error } from "../lib/responses";
//import { COUNTRY_JSON } from "../lib/constants";
import { execute_query, execute_query_proto } from "../lib/database";

/*const add_countries = async () => {
  let result: any = {
    entries: [],
    countries: [],
    continents: []
  };

  let query, country;

  try {
    for (let c of Object.values(COUNTRY_JSON)) {
      query = `SELECT Name FROM Country WHERE name = "${c.country}";`;
      country = (await execute_query(query))[0];
      if (!country && c.country) {
        query = `INSERT INTO Country (name, continent)
            VALUES ("${c.country}", "${c.continent}");`;
        country = await execute_query(query);
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
};*/

const get_data_by_country = async () => {
  let query;
  try {
    query =
    `SELECT c.Name as name,
      c.CountryId as id,
      COUNT(DISTINCT app.ApplicationId) as nApps,
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
      Country c
        ON app.CountryId = c.CountryId
    INNER JOIN
      Page p
        ON p.ApplicationId = app.ApplicationId AND p.deleted = 0
    INNER JOIN
    (SELECT a.AssertionId, a.RuleId, a.PageId, a.Outcome
      FROM
        Assertion a
      WHERE
        date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
        AND a.deleted = 0
      ORDER BY date DESC) a
        ON a.PageId = p.PageId
    WHERE app.deleted = 0
    GROUP BY c.CountryId;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_all_country_names = async (serverName: string) => {
  let query;
  try {
    query =
    `SELECT c.Name as name,
      c.CountryId as id,
      NOW() as date
    FROM
      Country c
    GROUP BY c.Name;`;
    let result = (await execute_query(serverName, query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_continent = async (serverName: string) => {
  let query;
  try {
    query =
    `SELECT cont.ContinentId as id,
      cont.Name as name,
      COUNT(DISTINCT app.ApplicationId) as nApps,
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
      Country c
        ON app.CountryId = c.CountryId
    INNER JOIN
      Continent cont
        ON cont.ContinentId = c.continentId
    INNER JOIN
      Page p
        ON p.ApplicationId = app.ApplicationId AND p.deleted = 0
    INNER JOIN
    (SELECT a.AssertionId, a.RuleId, a.PageId, a.Outcome
      FROM
        Assertion a
      WHERE
        date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
        AND a.deleted = 0
      ORDER BY date DESC) a
        ON a.PageId = p.PageId
    WHERE app.deleted = 0
    GROUP BY cont.Name;`;
    let result = (await execute_query(serverName, query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data = async (tableName: string, serverName: string, filters?: any) => {
  filters = filters && Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let params = [];
  let filtered, splitted;
  let query;
  switch(tableName){
    case 'country':
      query = `
      SELECT c.CountryId as id, 
      c.Name as name,`;
      break;
    case 'continent':
      query = `
      SELECT c.ContinentId as id,
      cont.Name as name,`;
      break;
    default:
      query = `
      SELECT c.ContinentId as id,
      cont.Name as name,`;
      break;
  }

  query = query + `
    COUNT(DISTINCT app.ApplicationId) as nApps,
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
  
  if(filters.tagIds && filters.tagIds !== '0'){
    filtered = filters.tagIds.split(',').filter(function(v: string, i: any, arr: any){return v !== '0';});
    params.push(filtered);
    query = query + `,
    (SELECT JSON_ARRAYAGG(t.Name) FROM Tag t WHERE t.TagId IN (?)) as tagNames`;
  }

  query = query + `
  FROM
    Application app
  LEFT JOIN
    Country c
      ON c.CountryId = app.CountryId
  LEFT JOIN
    Continent cont
      ON c.ContinentId = cont.ContinentId`; 

  if(filters.tagIds){
    query = query + `
    LEFT JOIN
      TagApplication ta
        ON ta.ApplicationId = app.ApplicationId`;
  }

  query = query + `
  INNER JOIN
    Page p
      ON p.ApplicationId = app.ApplicationId AND p.deleted = 0
  INNER JOIN
  (SELECT a.AssertionId, a.PageId, a.Outcome
    FROM
      Assertion a
    WHERE
      date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
      AND a.deleted = 0
    ORDER BY date DESC) a
      ON a.PageId = p.PageId
  WHERE app.deleted = 0`;

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

  query = query + `
  GROUP BY 1, 2
  ORDER BY 2;`;

  try {
    let result = (await execute_query(serverName, query, params));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_sc = async (tableName: string, serverName: string, filters?: any) => {
  filters = filters && Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let params = [];
  let filtered, splitted;
  let query =
  `DROP TABLE IF EXISTS workingTable;
  CREATE TEMPORARY TABLE workingTable AS`;

  switch(tableName){
    case 'country':
      query = query + `
      SELECT c.CountryId as id, 
      c.Name as name`;
      break;
    case 'continent':
      query = query + `
      SELECT c.ContinentId as id,
      cont.Name as name`;
      break;
    default:
      query = query + `
      SELECT c.ContinentId as id,
      cont.Name as name`;
      break;
  }

  query = query + `,
  scriteria.SCId,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'failed', 1, NULL)) as failed,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'cantTell', 1, NULL)) as cantTell,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'passed', 1, NULL)) as passed,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'inapplicable', 1, NULL)) as inapplicable,
  COUNT(DISTINCT scriteria.SCId, IF(a.AssertionId IS NULL OR a.Outcome = 'untested', 1, NULL)) as untested
  FROM
    Application app
  LEFT JOIN
    Country c
      ON c.CountryId = app.CountryId
  LEFT JOIN
    Continent cont
      ON c.ContinentId = cont.ContinentId`; 

  if(filters.tagIds){
    query = query + `
    LEFT JOIN
      TagApplication ta
        ON ta.ApplicationId = app.ApplicationId`;
  }

  query = query + `
  INNER JOIN
    Page p
    ON p.ApplicationId = app.ApplicationId AND p.deleted = 0
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
    AND a.deleted = 0
    ORDER BY date DESC) a
    ON a.PageId = p.PageId
        AND scriteria.RuleId = a.RuleId
  WHERE app.deleted = 0 AND scriteria.SCId is not null`;

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

  query = query + `
  GROUP BY 1, 3;`;

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

  if(filters.tagIds && filters.tagIds !== '0'){
    filtered = filters.tagIds.split(',').filter(function(v: string, i: any, arr: any){return v !== '0';});
    params.push(filtered);
    query = query + `,
    (SELECT JSON_ARRAYAGG(t.Name) FROM Tag t WHERE t.TagId IN (?)) as tagNames`;
  }

  query = query + `
  FROM workingTable
  GROUP BY 1, 2
  ORDER BY 2;`;

  try {
    let result = (await execute_query(serverName, query, params));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_compare = async (tableName: string, serverName: string, filters?: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let groupByParams = [];
  let groupByParam;
  if(filters !== {}){
    groupByParam = Object.keys(filters)[0];
    if(!groupByParam.includes(tableName))
      groupByParams.push(groupByParam.substring(0, groupByParam.length - 1));
  }
  groupByParams.push('id');
  let params = [];
  let filtered, splitted;
  let query;
  switch(tableName){
    case 'country':
      query = `
      SELECT c.CountryId as id, 
      c.Name as name,`;
      break;
    case 'continent':
      query = `
      SELECT c.ContinentId as id,
      cont.Name as name,`;
      break;
    default:
      query = `
      SELECT c.ContinentId as id,
      cont.Name as name,`;
      break;
  }

  query = query + `
    COUNT(DISTINCT app.ApplicationId) as nApps,
    COUNT(DISTINCT p.PageId) as nPages,
    COUNT(DISTINCT a.AssertionId) as nAssertions,
    COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
    COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
    COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
    COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
    COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested`;
    
  if(filters.continentIds && tableName !== 'continent'){
    query = query + `,
    cont.ContinentId as continentId,
    cont.Name as continentName`;
  }

  if(filters.countryIds && tableName !== 'country'){
    query = query + `,
    c.CountryId as countryId,
    c.Name as countryName`;
  }
  
  if(filters.tagIds){
    query = query + `,
    t.TagId as tagId,
    t.Name as tagName`;
  }

  query = query + `
  FROM
    Application app
  LEFT JOIN
    Country c
      ON c.CountryId = app.CountryId
  LEFT JOIN
    Continent cont
      ON c.ContinentId = cont.ContinentId`; 

  if(filters.tagIds){
    query = query + `
    LEFT JOIN
      TagApplication ta
        ON ta.ApplicationId = app.ApplicationId
    LEFT JOIN
      Tag t
        ON t.TagId = ta.TagId`;
  }

  query = query + `
  INNER JOIN
    Page p
      ON p.ApplicationId = app.ApplicationId AND p.deleted = 0
  INNER JOIN
  (SELECT a.AssertionId, a.PageId, a.Outcome
    FROM
      Assertion a
    WHERE
      date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
      AND a.deleted = 0
    ORDER BY date DESC) a
      ON a.PageId = p.PageId
  WHERE app.deleted = 0`;

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

  query = query + `
  GROUP BY ` + groupByParams.join(',') + `;`;

  try {
    let result = (await execute_query(serverName, query, params));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_sc_compare = async (tableName: string, serverName: string, filters?: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let groupByParams = [];
  let groupByParam;
  if(filters !== {}){
    groupByParam = Object.keys(filters)[0];
    if(!groupByParam.includes(tableName))
      groupByParams.push(groupByParam.substring(0, groupByParam.length - 1));
  }
  groupByParams.push('id');
  let params = [];
  let filtered, splitted;
  let query =
  `DROP TABLE IF EXISTS workingTable;
  CREATE TEMPORARY TABLE workingTable AS`;

  switch(tableName){
    case 'country':
      query = query + `
      SELECT c.CountryId as id, 
      c.Name as name`;
      break;
    case 'continent':
      query = query + `
      SELECT c.ContinentId as id,
      cont.Name as name`;
      break;
    default:
      query = query + `
      SELECT c.ContinentId as id,
      cont.Name as name`;
      break;
  }

  query = query + `,
  scriteria.SCId,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'failed', 1, NULL)) as failed,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'cantTell', 1, NULL)) as cantTell,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'passed', 1, NULL)) as passed,
  COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'inapplicable', 1, NULL)) as inapplicable,
  COUNT(DISTINCT scriteria.SCId, IF(a.AssertionId IS NULL OR a.Outcome = 'untested', 1, NULL)) as untested`

  if(filters.continentIds && tableName !== 'continent'){
    query = query + `,
    cont.ContinentId as continentId,
    cont.Name as continentName`;
  }

  if(filters.countryIds && tableName !== 'country'){
    query = query + `,
    c.CountryId as countryId,
    c.Name as countryName`;
  }

  if(filters.tagIds){
    query = query + `,
    t.TagId as tagId,
    t.Name as tagName`;
  }

  query = query + `
  FROM
    Application app
  LEFT JOIN
    Country c
      ON c.CountryId = app.CountryId
  LEFT JOIN
    Continent cont
      ON c.ContinentId = cont.ContinentId`; 

  if(filters.tagIds){
    query = query + `
    LEFT JOIN
      TagApplication ta
        ON ta.ApplicationId = app.ApplicationId
    LEFT JOIN
      Tag t
        ON t.TagId = ta.TagId`;
  }

  query = query + `
  INNER JOIN
    Page p
    ON p.ApplicationId = app.ApplicationId AND p.deleted = 0
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
    AND a.deleted = 0
    ORDER BY date DESC) a
    ON a.PageId = p.PageId
        AND scriteria.RuleId = a.RuleId
  WHERE app.deleted = 0 AND scriteria.SCId is not null`;

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

  query = query + `
  GROUP BY ` + groupByParams.join(',') + `, 3;`;

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

  if(filters.continentIds && tableName !== 'continent'){
    query = query + `,
    continentId,
    continentName`;
  }
  
  if(filters.countryIds && tableName !== 'country'){
    query = query + `,
    countryId,
    countryName`;
  }

  if(filters.tagIds){
    query = query + `,
    tagId,
    tagName`;
  }

  query = query + `
  FROM workingTable
  GROUP BY ` + groupByParams.join(',') + `;`;

  try {
    let result = (await execute_query(serverName, query, params));
    return success(result);
  } catch(err){
    return error(err);
  }
}

export {get_all_country_names, get_data, get_data_sc, get_data_compare, get_data_sc_compare};
