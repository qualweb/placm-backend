import { execute_query_proto } from "../lib/database";
import { error, success } from "../lib/responses";

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

const get_app_data_filtered = async (filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let query = 
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
    Application app`;

  if(filters.tagIds){
    query = query.concat(`
    INNER JOIN
      TagApplication ta
        ON ta.ApplicationId = app.ApplicationId
        AND ta.TagId IN (${filters.tagIds})`);
  }

  if(filters.continents){
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
  if(filters.orgIds){
    query = query.concat(`
    AND app.OrganizationId IN ("${filters.orgIds}")`);
  }
  query = query.concat(`
  GROUP BY app.Name, app.ApplicationId;`);

  try {
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_sector_data_filtered = async (filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let query;
  try {
    query =
    `SELECT app.Sector as id,
      IF(app.Sector = '0', 'Public', 'Private') as name,
      COUNT(DISTINCT app.ApplicationId) as nApps, 
      COUNT(DISTINCT p.PageId) as nPages,
      COUNT(DISTINCT a.AssertionId) as nAssertions,
      COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
      COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
      COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
      COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
      COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested
    FROM
      Application app`;

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
    GROUP BY app.Sector;`);
    
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_org_data_filtered = async (filters: any) => {
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let query;
  try {
    query =
    `SELECT org.OrganizationId as id,
      org.Name as name,
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
      Organization org
        ON org.OrganizationId = app.OrganizationId`;

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

    query = query.concat(`
    GROUP BY org.Name, org.OrganizationId;`);
    
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

export {get_app_data_filtered, get_sector_data_filtered, get_org_data_filtered};