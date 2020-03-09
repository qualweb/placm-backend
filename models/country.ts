import { success, error } from "../lib/responses";
import { COUNTRY_JSON } from "../lib/constants";
import { execute_query } from "../lib/database";

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

export {add_countries};
