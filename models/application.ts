import { execute_query, execute_query_proto } from "../lib/database";
import { error, success } from "../lib/responses";
import { readyStringToQuery } from "../lib/util";

const get_data_by_sector = async () => {
  let query;
  try {
    query =
    `SELECT app.Sector as sector,
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
      Page p
        ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
    INNER JOIN
    (SELECT a.AssertionId, a.RuleId, a.PageId, a.Outcome
      FROM
        Assertion a
      WHERE
        date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
        AND a.Deleted = '0'
      ORDER BY date DESC) a
        ON a.PageId = p.PageId
    WHERE app.Deleted = '0'
    GROUP BY app.Sector;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_by_type = async () => {
  let query;
  try {
    query =
    `SELECT app.Type as type,
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
      Page p
        ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
    INNER JOIN
    (SELECT a.AssertionId, a.RuleId, a.PageId, a.Outcome
      FROM
        Assertion a
      WHERE
        date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
        AND a.Deleted = '0'
      ORDER BY date DESC) a
        ON a.PageId = p.PageId
    WHERE app.Deleted = '0'
    GROUP BY app.Type;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_by_name = async () => {
  let query;
  try {
    query =
    `SELECT app.Name as name,
      app.ApplicationId as id,
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
      Page p
        ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
    INNER JOIN
    (SELECT a.AssertionId, a.RuleId, a.PageId, a.Outcome
      FROM
        Assertion a
      WHERE
        date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
        AND a.Deleted = '0'
      ORDER BY date DESC) a
        ON a.PageId = p.PageId
    WHERE app.Deleted = '0'
    GROUP BY app.Name;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_all_names_not_deleted = async () => {
  let query;
  try {
    query =
    `SELECT app.Name as name,
      app.ApplicationId as id
    FROM
      Application app
    WHERE app.Deleted = '0'`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_except_id = async (ids: string[]) => {
  let query;
  try {
    query =
    `SELECT app.Name as name,
      app.ApplicationId as id,
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
      Page p
        ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
    INNER JOIN
    (SELECT a.AssertionId, a.RuleId, a.PageId, a.Outcome
      FROM
        Assertion a
      WHERE
        date = (SELECT max(a1.Date) FROM Assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
        AND a.Deleted = '0'
      ORDER BY date DESC) a
        ON a.PageId = p.PageId
    WHERE app.Deleted = '0' AND app.ApplicationId NOT IN (${ids})
    GROUP BY app.Name;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_filtered = async (tableName: string, serverName: string, filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let params = [];
  let query;
  switch(tableName){
    case 'app':
      query = `SELECT app.applicationid as id, app.name as name,`;
      break;
    case 'sector':
      query = `SELECT app.Sector as id, IF(app.Sector = '0', 'Public', 'Private') as name,`;
      break;
    case 'org':
      query = `SELECT org.OrganizationId as id, org.Name as name,`;
      break;
    default:
      query = `SELECT app.applicationid as id, app.name as name,`;
      break;
  }

  query = query.concat(`
  COUNT(DISTINCT p.PageId) as nPages,
  COUNT(DISTINCT a.AssertionId) as nAssertions,
  COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
  COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
  COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
  COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
  COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested`);
  
  if(filters.continentIds){
    params.push(filters.continentIds);
    query = query.concat(`,
      (SELECT JSON_ARRAYAGG(cont.Name) FROM Continent cont WHERE cont.ContinentId IN (?)) as continentNames`);
  }
  if(filters.countryIds){
    params.push(filters.countryIds);
    query = query.concat(`,
      (SELECT JSON_ARRAYAGG(c.Name) FROM Country c WHERE c.CountryId IN (?)) as countryNames`)
  }
  if(filters.tagIds){
    params.push(filters.tagIds);
    query = query.concat(`,
      (SELECT JSON_ARRAYAGG(t.Name) FROM Tag t WHERE t.TagId IN (?)) as tagNames`);
  }
  if(filters.orgIds){
    params.push(filters.orgIds);
    query = query.concat(`,
      (SELECT JSON_ARRAYAGG(org.Name) FROM Organization org WHERE org.OrganizationId IN (?)) as orgNames`);
  }
  query = query.concat(`
    FROM
      Application app`);
      
  if(tableName === 'org'){
    query = query.concat(`
    INNER JOIN
      Organization org
        ON org.OrganizationId = app.OrganizationId`);
  }

  if(filters.tagIds){
    params.push(filters.tagIds);
    query = query.concat(`
    INNER JOIN
      TagApplication ta
        ON ta.ApplicationId = app.ApplicationId
        AND ta.TagId IN (?)`);
  }

  if(filters.continentIds){
    params.push(filters.continentIds);
    query = query.concat(`
    INNER JOIN
      Country c
        ON c.CountryId = app.CountryId
        AND c.ContinentId IN (?)`);
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
    params.push(filters.countryIds);
    query = query.concat(`
    AND app.CountryId IN (?)`);
  }
  if(filters.sectorIds){
    params.push(filters.sectorIds);
    query = query.concat(`
    AND app.Sector IN (?)`);
  }
  if(filters.orgIds){
    params.push(filters.orgIds);
    query = query.concat(`
    AND app.OrganizationId IN (?)`);
  }
  query = query.concat(`
  GROUP BY app.Name, app.ApplicationId;`);

  try {
    let result = (await execute_query(serverName, query, params));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_filtered_sc = async (tableName: string, serverName: string, filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let params = [];
  let query =
  `DROP TABLE IF EXISTS workingTable;
    CREATE TEMPORARY TABLE workingTable AS`;

    switch(tableName){
      case 'app':
        query = query.concat(`
        SELECT app.applicationid as id, app.name as name,`);
        break;
      case 'sector':
        query = query.concat(`
        SELECT app.Sector as id, IF(app.Sector = '0', 'Public', 'Private') as name,`);
        break;
      case 'org':
        query = query.concat(`
        SELECT org.OrganizationId as id, org.Name as name,`);
        break;
      default:
        query = query.concat(`
        SELECT app.applicationid as id, app.name as name,`);
        break;
    }
  
    query = query.concat(`
    scriteria.SCId,
    COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'failed', 1, NULL)) as failed,
    COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'cantTell', 1, NULL)) as cantTell,
    COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'passed', 1, NULL)) as passed,
    COUNT(DISTINCT scriteria.SCId, IF(a.Outcome = 'inapplicable', 1, NULL)) as inapplicable,
    COUNT(DISTINCT scriteria.SCId, IF(a.AssertionId IS NULL OR a.Outcome = 'untested', 1, NULL)) as untested
    FROM Application app`);
    
    if(filters.tagIds){
      params.push(filters.tagIds);
      query = query.concat(`
      INNER JOIN
        TagApplication ta
          ON ta.ApplicationId = app.ApplicationId
          AND ta.TagId IN (?)`);
    }

    if(tableName === 'org'){
      query = query.concat(`
      INNER JOIN
        Organization org
          ON org.OrganizationId = app.OrganizationId`);
    }
  
    if(filters.continentIds){
      params.push(filters.continentIds);
      query = query.concat(`
      INNER JOIN
        Country c
          ON c.CountryId = app.CountryId
          AND c.ContinentId IN (?)`);
    }
    query = query.concat(`
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
    WHERE app.Deleted = '0' AND scriteria.SCId is not null`);
    if(filters.countryIds){
      params.push(filters.countryIds);
      query = query.concat(`
      AND app.CountryId IN (?)`);
    }
    if(filters.sectorIds){
      params.push(filters.sectorIds);
      query = query.concat(`
      AND app.Sector IN (?)`);
    }
    if(filters.orgIds){
      params.push(filters.orgIds);
      query = query.concat(`
      AND app.OrganizationId IN (?)`);
    }

    query = query.concat(`
    GROUP BY 1, 3
    ORDER BY 1, 2, 3;`);

    query = query.concat(`
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
      SUM(untested) as nUntested`);

    if(filters.continentIds){
      params.push(filters.continentIds);
      query = query.concat(`,
      (SELECT JSON_ARRAYAGG(cont.Name) FROM Continent cont WHERE cont.ContinentId IN (?)) as continentNames`);
    }
    if(filters.countryIds){
      params.push(filters.countryIds);
      query = query.concat(`,
      (SELECT JSON_ARRAYAGG(c.Name) FROM Country c WHERE c.CountryId IN (?)) as countryNames`)
    }
    if(filters.tagIds){
      params.push(filters.tagIds);
      query = query.concat(`,
      (SELECT JSON_ARRAYAGG(t.Name) FROM Tag t WHERE t.TagId IN (?)) as tagNames`);
    }

    query = query.concat(`
    FROM workingTable GROUP BY 1;`);

  try {
    let result = (await execute_query(serverName, query, params, true));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_all_sc_data_app = async(serverName: string, filters: any) => {
  let query;
  let appId = filters.appIds ? filters.appIds : null;
  try {
    query =
    `SELECT sc.*,
    (SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', a.assertionid,
        'eval', eval.name,
        'rulename', r.name,
        'page', p.url,
        'outcome', a.outcome,
        'description', a.description))) as assertions,
    COUNT(DISTINCT p.PageId) as nPages,
    COUNT(DISTINCT a.AssertionId) as nAssertions,
    COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
    COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
    COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
    COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
    COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested
    FROM Apiplication app
    INNER JOIN
        Page p
          ON p.ApplicationId = app.ApplicationId AND p.Deleted = '0'
      INNER JOIN
      (SELECT a.AssertionId, a.PageId, a.Outcome, a.RuleId, a.EvaluationToolId, a.Description
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
      LEFT JOIN
        RuleSuccessCriteria scr
          ON scr.RuleId = a.RuleId
      LEFT JOIN
        SuccessCriteria sc
          ON scr.SCId = sc.SCId
      INNER JOIN
        EvaluationTool eval
          on eval.EvaluationToolId = a.EvaluationToolId
      INNER JOIN
        rule r
          on r.RuleId = a.RuleId
    WHERE app.Deleted = '0'
    AND app.ApplicationId = ?
    GROUP BY sc.SCID;`;
    
    let result = (await execute_query(serverName, query, [appId]));
    return success(result);
  } catch(err){
    return error(err);
  }
}

export {get_data_filtered, get_data_filtered_sc, get_all_sc_data_app};