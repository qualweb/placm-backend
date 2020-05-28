import { success, error } from "../lib/responses";
import { COUNTRY_JSON } from "../lib/constants";
import { execute_query, execute_query_proto } from "../lib/database";

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
};

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
    GROUP BY c.CountryId;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_all_country_names = async () => {
  let query;
  try {
    query =
    `SELECT c.Name as name,
      c.CountryId as id
    FROM
      Country c
    INNER JOIN
      Application app
        ON app.CountryId = c.CountryId
    GROUP BY c.Name;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_continent = async () => {
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
    GROUP BY cont.Name;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

const get_data_country_filtered = async (filters: any) => {
  console.log("ola");
  filters = Object.keys(filters).length !== 0 ? JSON.parse(filters) : {};
  let query = 
  `SELECT c.CountryId as id, 
    c.Name as name, 
    c.ContinentId as continentId,
    cont.Name as continentName,
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
      ON c.CountryId = app.CountryId
  INNER JOIN
    Continent cont
      ON c.ContinentId = cont.ContinentId`; 

  if(filters.continentIds){
    query = query.concat(`
    AND c.ContinentId IN ("${filters.continentIds}")`);
  }

  if(filters.tagIds){
    query = query.concat(`
    INNER JOIN
      TagApplication ta
        ON ta.ApplicationId = app.ApplicationId
        AND ta.TagId IN (${filters.tagIds})`);
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

  query = query.concat(`
  GROUP BY c.Name, c.CountryId;`);

  try {
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

export {get_data_continent, get_data_country_filtered};
