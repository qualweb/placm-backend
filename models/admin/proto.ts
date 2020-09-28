import { success, error } from "../../lib/responses";
import { execute_query } from "../../lib/database";
import { COUNTRY_JSON, CONSTELLATIONS_JSON, PROTODATA_JSON, urlRegex, DB_NAMES, WCAG21, RULES_JSON, ELEMENT_TYPES } from "../../lib/constants";
import * as fs from 'fs';
import { trim, includes, map } from "lodash";
import path, { resolve } from "path";
import puppeteer from "puppeteer";
import { parse } from 'node-html-parser';
import { APIFY_CALL_ERROR_NAME } from "apify/types/errors";
import cloneDeep from 'lodash.clonedeep';
import { RequestQueue } from "apify";

const excelToJson = require('convert-excel-to-json');
let Crawler = require('simplecrawler');

//const fetch = require("node-fetch");
const c = require('ansi-colors');
const randomWords = require('random-words');

const http = require('http');
const https = require('https');

const get_link = async (urlReq: string) => {
  const queryObject = new URL(urlReq);
  if (queryObject.href) {
      const document = await fetchDocument(queryObject.href);
      if(document){
        return success(document);
      } else {
        return error({code: -1, message: 'ERROR_FETCH', err: 'Encountered an error while fetching a document'}, queryObject.href);
      }
  } else {
    return error({code: -2, message: 'NO_URL', err: 'No URL was given to fetch'}, queryObject.href);
  }
};

const reset_database = async (serverName: string) => {
  let query;
  const dbName: string = DB_NAMES[serverName];
  try {
    await execute_query(serverName, 'SET autocommit = 0; START TRANSACTION;');
    // get all table names except those 5
    query = `SELECT 
    CONCAT('TRUNCATE TABLE ',TABLE_NAME,';') AS truncateCommand
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME NOT IN ("Country", "Continent", "Rule", "SuccessCriteria", "RuleSuccessCriteria", "ElementType", "RuleElementType");
    `;
    let truncates = await execute_query(serverName, query, [dbName]);

    // deleting all content from tables
    query = `SET FOREIGN_KEY_CHECKS=0;\n\n`;
    for(let trunc of truncates){
      query = query + trunc.truncateCommand + '\n';
    }
    query = query + `\nSET FOREIGN_KEY_CHECKS=1;`;
    await execute_query(serverName, query, [dbName]);

  } catch (err){
    console.log(err);
    await execute_query(serverName, 'ROLLBACK;');
    return error(err);
  }
  await execute_query(serverName, 'COMMIT;');
  return success(true);
}

const group_elems = () => {
  let result = "[";
  let exceptions = ['80f0bf','4c31df','aaa1bf','59796f'];
  for(let r of Object.values(RULES_JSON)){
    if(exceptions.includes(r.mapping)){
      if(r.mapping == '59796f'){
        result = result + '\n  {\n    ';
        result = result + '"mapping":"' + r.mapping + '",\n    "type":"image"\n  },';
        result = result + '\n  {\n    ';
        result = result + '"mapping":"' + r.mapping + '",\n    "type":"button"\n  },';
      } else {
        result = result + '\n  {\n    ';
        result = result + '"mapping":"' + r.mapping + '",\n    "type":"audio"\n  },';
        result = result + '\n  {\n    ';
        result = result + '"mapping":"' + r.mapping + '",\n    "type":"video"\n  },';
      }
    } else if (r.name) {
      result = result + '\n  {\n    ';
      result = result + '"mapping":"' + r.mapping + '",\n    "type":"';
      if(r.name.toLowerCase().includes('iframe')){
        result = result + 'iframe"\n  },';
      } else if (r.name.toLowerCase().includes('button')){
        result = result + 'button"\n  },';
      } else if (r.name.toLowerCase().includes('autocomplete')){
        result = result + 'input"\n  },';
      } else if (r.name.toLowerCase().includes('link')){
        result = result + 'link"\n  },';
      } else if (r.name.toLowerCase().includes('heading')){
        result = result + 'heading"\n  },';
      } else if (r.name.toLowerCase().includes('video')){
        result = result + 'video"\n  },';
      } else if (r.name.toLowerCase().includes('lang')){
        result = result + 'lang"\n  },';
      } else if (r.name.toLowerCase().includes('meta')){
        result = result + 'meta"\n  },';
      } else if (r.name.toLowerCase().includes('object')){
        result = result + 'object"\n  },';
      } else if (r.name.toLowerCase().includes('title')){
        result = result + 'title"\n  },';
      } else if (r.name.toLowerCase().includes('table')){
        result = result + 'table"\n  },';
      } else if (r.name.toLowerCase().includes('focusable element')){
        result = result + 'other"\n  },';
      } else if (r.name.toLowerCase().includes('audio element')){
        result = result + 'audio"\n  },';
      } else if (r.name.toLowerCase().includes('image') || r.name.toLowerCase().includes('svg')){
        result = result + 'image"\n  },';
      } else if (r.name.toLowerCase().includes('form control') || r.name.toLowerCase().includes('form field')){
        result = result + 'form"\n  },';
      } else if (r.name.toLowerCase().includes('aria') || r.name.toLowerCase().includes('visible label') || r.name.toLowerCase().includes('role attribute')){
        result = result + 'aria"\n  },';
      } else if (r.name.toLowerCase().includes('attribute is not') || r.name.toLowerCase().includes('id attribute')){
        result = result + 'attributes"\n  },';
      } else if (r.name.toLowerCase().includes('css') || r.name.toLowerCase().includes('contrast') || r.name.toLowerCase().includes('scrollable')){
        result = result + 'css"\n  },';
      }
    }
    /*if(r && r.metadata && r.metadata.target && r.metadata.target.elements){
      result.push(r.metadata.target.elements.toString());
    }*/
  }
  result = result.substring(0, result.length - 1);
  result = result + "\n]";
  console.log(result);
}

const update_rules_table_element_type = () => {
  let i = 1;
  let mappings: string[] = [];
  let types: string[] = [];
  let query;

  for(let r of Object.values(RULES_JSON)) {
    if(r.metadata){
      if(!mappings.includes(r.mapping))
        mappings.push(r.mapping);
      query = `INSERT INTO Rule (Mapping, Name, Url, Description) VALUES ("${r.mapping}", "${r.name}", "${r.metadata.url}", "${r.description}");`;
      console.log(query);
      if(r['metadata']['success-criteria'] !== []){
        for(let sc of r['metadata']['success-criteria']){
          query = `INSERT INTO RuleSuccessCriteria (RuleId, SCId) VALUES ("${i}", "${sc.name}");`;
          console.log(query);
        }
      }
      i++;
    }
  }

  i = 1;
  for (let e of Object.values(ELEMENT_TYPES)){
    if(e.type){
      if(!types.includes(e.type)){
        types.push(e.type);
        query = `INSERT INTO ElementType (TypeId, Name) VALUES ("${i}", "${e.type}");`;
        console.log(query);
        i++;
      }
      query = `INSERT INTO RuleElementType (RuleId, TypeId) VALUES ("${mappings.indexOf(e.mapping) + 1}", "${types.indexOf(e.type) + 1}");`;
      console.log(query);
    }
  }
}

const prepare_database = () => {
  let query;
  let continents: string[] = [];
  for (let c of Object.values(COUNTRY_JSON)) {
    if(c.continent){
      if(!continents.includes(c.continent)){
        query = `INSERT INTO Continent (name) VALUES ("${c.continent}");`;
        console.log(query);
        continents.push(c.continent);
      }
      query = `INSERT INTO Country (name, continentId) VALUES ("${c.country}", "${continents.indexOf(c.continent)}");`;
      console.log(query);
    }
  }
  for (let p of Object.values(WCAG21['principles'])) {
    let guidelines = p['guidelines'];
    for (let g of Object.values(guidelines)){
      for (let s of <any> Object.values(g['successcriteria'])){
        let initialUrl = 'https://www.w3.org/WAI/WCAG21/Understanding/';
        //todo fix this
        let preparingUrl = s['handle'].replace(/\(/g,'').replace(/\)/g,'').replace(/\,/g,'').replace(/ /g,'-').toLowerCase();
        let url = initialUrl + preparingUrl;
        query = `INSERT INTO SuccessCriteria (SCId, Name, Principle, Level, Url) VALUES ("${s.num}", "${s.handle}", "${p.handle}", "${s.level}", "${url}");`;
        console.log(query);
      }
    }
  }

  let i = 1;
  let mappings: string[] = [];
  let types: string[] = [];

  for(let r of Object.values(RULES_JSON)) {
    if(r.metadata){
      if(!mappings.includes(r.mapping))
        mappings.push(r.mapping);
      query = `INSERT INTO Rule (Mapping, Name, Url, Description) VALUES ("${r.mapping}", "${r.name}", "${r.metadata.url}", "${r.description}");`;
      console.log(query);
      if(r['metadata']['success-criteria'] !== []){
        for(let sc of r['metadata']['success-criteria']){
          query = `INSERT INTO RuleSuccessCriteria (RuleId, SCId) VALUES ("${i}", "${sc.name}");`;
          console.log(query);
        }
      }
      i++;
    }
  }

  i = 1;
  for (let e of Object.values(ELEMENT_TYPES)){
    if(e.type){
      if(!types.includes(e.type)){
        types.push(e.type);
        query = `INSERT INTO ElementType (TypeId, Name) VALUES ("${i}", "${e.type}");`;
        console.log(query);
        i++;
      }
      query = `INSERT INTO RuleElementType (RuleId, TypeId) VALUES ("${mappings.indexOf(e.mapping) + 1}", "${types.indexOf(e.type) + 1}");`;
      console.log(query);
    }
  }
}

const add_filedata = async (serverName: string) => {
  let result: any = {
    tags: [],
    evaluationTools: [],
    rules: [],
    applications: [],
    organizations: [],
    pages: [],
    assertions: [],
    tagApps: []
  };

  let query, entries: string[], data: string[];
  let tag, evalTool, rule, app, page, assertion, tagapp, url;
  const numberApps = 20;
  const numberPages = 50; //[0-50]+200 (random)
  const numberAssertions = 5;
  // todo arranjar numberTools para ir buscar atraves de um select

  for(let entry of Object.values(PROTODATA_JSON)){
    switch(entry['type']){
      case 'Tag':
          query = `SELECT TagId FROM Tag WHERE name = "${entry['name']}";`;
          tag = (await execute_query(serverName, query))[0];
          if (!tag) {
            query = `INSERT INTO Tag (name)
                VALUES ("${entry['name']}");`;
            tag = await execute_query(serverName, query);
            result.tags.push(tag.insertId);
          };
          break;
        case 'EvaluationTool':
          query = `SELECT EvaluationToolId FROM EvaluationTool WHERE name = "${entry['name']}";`;
          evalTool = (await execute_query(serverName, query))[0];
          if (!evalTool) {
            if(entry['data1'] === ''){
              url = null;
            } else {
              url = '"' + entry['data1'] + '"';
            }
            query = `INSERT INTO EvaluationTool (name, url, description, version)
                VALUES ("${entry['name']}", ${url}, "${entry['data2']}", "${entry['data3']}");`;
            evalTool = await execute_query(serverName, query);
            result.evaluationTools.push(evalTool.insertId);
          };
          break;
        default:
          break;
    }
  }

  let appName, appUrl, appDate, appId;
  let organization;
  let tagId;
  let evaluationToolId;
  let pageUrl, pageId;
  let assertionDesc, assertionOutcome;
  let outcomes = ['passed', 'failed', 'cantTell', 'inapplicable', 'untested'];
  let orgsExtensions = ['Corp.', 'Org.', 'Inc.'];
  let possibleAppNames = map(CONSTELLATIONS_JSON, 'name');

  for(let i = 0; i < numberApps; i++) {
    // Application
    //appName = randomWords({ exactly: 2, join: ' ' });
    let randomIndex = Math.floor(Math.random()*possibleAppNames.length);
    appName = possibleAppNames[randomIndex];
    possibleAppNames.splice(randomIndex, 1);

    appUrl = "http://www." + randomString(10,'a') + '.com';
    appDate = '2020-0' + (Math.floor(Math.random()*9)+1).toString()
         + '-'
         + Math.floor(Math.random()*3).toString()
         + (Math.floor(Math.random()*9)+1).toString()
         + ' 00:00:00';
    query = `SELECT ApplicationId FROM Application WHERE name = "${appName}";`;
    app = (await execute_query(serverName, query))[0];
    if (!app) {
      let organizationName = randomWords({ exactly: 1 })[0];
      organizationName = organizationName.charAt(0).toUpperCase() + organizationName.slice(1);
      organizationName = organizationName + ' ' + orgsExtensions[Math.floor(Math.random()*3)];
      query = `SELECT OrganizationId FROM Organization WHERE name = "${organizationName}";`;
      organization = (await execute_query(serverName, query))[0];
      if(!organization){
        query = `INSERT INTO Organization (name)
          VALUES ("${organizationName}");`;
          organization = await execute_query(serverName, query);
        result.organizations.push(organizationName);
      }
      query = `INSERT INTO Application (name, organizationid, type, sector, url, creationdate, countryid)
          VALUES ("${appName}", "${organization.OrganizationId ? organization.OrganizationId : organization.insertId}", "0", "${Math.floor(Math.random()*2)}", "${appUrl}", "${appDate}", "${Math.floor(Math.random()*243)+1}");`;
      app = await execute_query(serverName, query);
      result.applications.push(app.insertId);
    };
    appId = app.insertId || app.ApplicationId;

    // TagApplication
    tagId = Math.floor(Math.random()*4)+1;
    query = `SELECT TagId FROM TagApplication WHERE 
              TagId = "${tagId}" AND
              ApplicationId = "${appId}";`;
    tagapp = (await execute_query(serverName, query))[0];
    if (!tagapp) {
      query = `INSERT INTO TagApplication (TagId, ApplicationId)
          VALUES ("${tagId}", "${appId}");`;
        tagapp = await execute_query(serverName, query);
      result.tagApps.push([tagId, appId]);
    };

    evaluationToolId = Math.floor(Math.random()*3)+1;

    // Page
    //for(let j = 0; j < numberPages; j++) {
    for(let j = 0; j < Math.floor(Math.random()*numberPages)+200; j++) {
      pageUrl = appUrl + '/' + randomString(10);
      query = `SELECT PageId FROM Page WHERE url = "${pageUrl}";`;
      page = (await execute_query(serverName, query))[0];
      if (!page) {
        query = `INSERT INTO Page (url, creationdate, applicationid)
            VALUES ("${pageUrl}", "${appDate}", "${appId}");`;
        page = await execute_query(serverName, query);
        result.pages.push(page.insertId);
      };
      pageId = page.insertId || page.PageId;

      // Assertion
      for(let r = 1; r <= numberAssertions; r++) {
        let ruleId = Math.floor(Math.random() * 66) + 1;
        assertionDesc = randomString(15,'a');
        assertionOutcome = outcomes[Math.floor(Math.random()*5)];

        query = `SELECT AssertionId FROM Assertion WHERE 
              evaluationtoolid = "$evaluationToolId}" AND
              ruleid = "${ruleId}" AND
              pageid = "${pageId}" AND
              mode = "automatic" AND
              date = "${appDate}";`;
        assertion = (await execute_query(serverName, query))[0];
        if (!assertion) {
          query = `INSERT INTO Assertion (evaluationtoolid, ruleid, pageid, mode, date, description, outcome)
              VALUES ("${evaluationToolId}", "${ruleId}", "${pageId}", "automatic", "${appDate}", "${assertionDesc}", "${assertionOutcome}");`;
          assertion = await execute_query(serverName, query);
          result.assertions.push(assertion.insertId);
        };
      }
    }
  }
  return success(result);
};

const add_countries = async (serverName: string) => {
  let result: any = {
    countries: [],
    continents: []
  };

  let query, country, continent;

  try {
    for (let c of Object.values(COUNTRY_JSON)) {
      query = `SELECT Name FROM Country WHERE name = "${c.country}";`;
      country = (await execute_query(serverName, query))[0];
      if (!country && c.country) {
        query = `SELECT ContinentId FROM Continent WHERE name = "${c.continent}";`;
        continent = (await execute_query(serverName, query))[0];
        if(!continent){
          query = `INSERT INTO Continent (name)
            VALUES ("${c.continent}");`;
          continent = await execute_query(serverName, query);
          result.continents.push(c.continent);         
        }
        query = `INSERT INTO Country (name, continentId)
          VALUES ("${c.country}", "${continent.ContinentId ? continent.ContinentId : continent.insertId}");`;
        country = await execute_query(serverName, query);
        result.countries.push(c.country);   
      }
    }
  } catch (err) {
    console.log(err);
    throw error(err);
  }
  return success(result);
};

async function correct_urls_files_json() {

  let jsonSegments;
  let links: string[][] = [];
  let linksAmostra: string[] = [];
  let linksEnsinoSuperior: string[] = [];
  let linksMunicipios: string[] = [];
  let linksONG: string[] = [];
  let textFromLink, textsFromLinks: string[] = [];

  let failedLinks: string[][] = [];
  let differentLinks: string[][] = [];

  let amostra = <string> await readFile('lib/data_links_jsons', 'amostra2015_json.json');
  let ensinoSuperior = <string> await readFile('lib/data_links_jsons', 'ensino_superior_json.json');
  let municipios = <string> await readFile('lib/data_links_jsons', 'municipios_json.json');
  let ongpd = <string> await readFile('lib/data_links_jsons', 'ongpd_json.json');
  
  amostra = trim(amostra).replace((/  |\r\n|\n|\r|/gm),"");
  jsonSegments = JSON.parse(amostra);
  for(let json of jsonSegments){
    linksAmostra.push(json.url);
    links.push([json.Entidade, json.url]);
  }
  ensinoSuperior = trim(ensinoSuperior).replace((/  |\r\n|\n|\r|/gm),"");
  jsonSegments = JSON.parse(ensinoSuperior);
  for(let json of jsonSegments){
    linksEnsinoSuperior.push(json.url);
    links.push([json.Estabelecimento, json.url]);
  }
  municipios = trim(municipios).replace((/  |\r\n|\n|\r|/gm),"");
  jsonSegments = JSON.parse(municipios);
  for(let json of jsonSegments){
    linksMunicipios.push(json.url);
    links.push([json.Municipio, json.url]);
  }
  ongpd = trim(ongpd).replace((/  |\r\n|\n|\r|/gm),"");
  jsonSegments = JSON.parse(ongpd);
  for(let json of jsonSegments){
    linksONG.push(json.url);
    links.push([json.Entidade, json.url]);
  }

  const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true
  });
  
  const page = await browser.newPage();
  let fileNumber;
  console.log(links.length);
  let index = 0;
  let website, protocol, cleanJsonUrl;

  let entities = links.map(function(x){
    return x[0];
  });
  let urls = links.map(function(x) {
    return x[1];
  });

  for await (let url of urls){
    console.log(index);

    website = url.match(urlRegex);
    website = website === null ? [] : website;
    if(website.length){
      protocol = website[1];
      cleanJsonUrl = protocol + '/', website[3];
    } else {
      cleanJsonUrl = url;
    }

    if(includes(linksAmostra, url)){
      fileNumber = 1;
    } else if(includes(linksEnsinoSuperior, url)){
      fileNumber = 2;
    } else if(includes(linksMunicipios, url)){
      fileNumber = 3;
    } else {
      fileNumber = 4;
    }

    try {
      let result = await page.goto(cleanJsonUrl);
      if(result !== null){
        if(result.status() >= 400){
          failedLinks.push([fileNumber.toString(), entities[index], url, "0 - " + result.status().toString()]);
          console.log("oops");
        } else {
          differentLinks.push([fileNumber.toString(), entities[index], url, await page.url()]);
          console.log("okay");
        }
      } else {
        failedLinks.push([fileNumber.toString(), entities[index], url, "1"]);
        console.log("oops");
      }
    } catch (error) {
      failedLinks.push([fileNumber.toString(), entities[index], url, "2 - error " + error]);
      console.log("oops");
    }
    index++;
  }

    /*if(/^https?:\/\/.*$/.test(url)){
      if(url[url.length-1] === '/'){
        url = url.concat('acessibilidade');
      } else {
        url = url.concat('/acessibilidade');
      }
      textFromLink = <string> await fetch(url)
          .then(response => {
            if (response.status === 200) {
              return response.text();
            } else {
              throw new Error(response.statusText);
            }
          })
          .catch(err => {
            failedLinks.push(url);
            error = 1;
        });
      if(textFromLink){
        textsFromLinks.push(textFromLink);
        successfulLinks.push(url);
      } else {
        if(error !== 1)
          emptyLinks.push(url);
      }
    } else {
      regexLinks.push(url);
    }
    error = 0;
  }*/

  let result = "\ufeffFile;Entity;Failed url;Erro\n";
  for(let fl of failedLinks){
    switch(fl[0]){
      case '1':
        result = result + 'Amostra2015;' + fl[1] + ';' + fl[2] + ';' + fl[3] + '\n';
        break;
      case '2':
        result = result + 'EnsinoSuperior;' + fl[1] + ';' + fl[2] + ';' + fl[3] + '\n';
        break;
      case '3':
        result = result + 'Municipios;' + fl[1] + ';' + fl[2] + ';' + fl[3] + '\n';
        break;
      case '4':
        result = result + 'ONG;' + fl[1] + ';' + fl[2] + ';' + fl[3] + '\n';
        break;
      default:
        break;
    }
  }
  let difference = "\ufeffFile;Entity;Registered url;Redirected url\n";
  let domain;
  for(let data of differentLinks){

    website = data[3].match(urlRegex);
    website = website === null ? [] : website;
    if(website.length){
      protocol = website[1];
      domain = protocol + '/' + website[3];
    } else {
      domain = data[3];
    }

    //let cleanRegisteredUrl = data[1][data[1].length - 1] === '/' ? data[1].substring(0; data[1].length - 1) : data[1];
    let cleanRedirectedUrl = domain[domain.length - 1] === '/' ? domain.substring(0, domain.length - 1) : domain;
      switch(data[0]){
        case '1':
          difference = difference + 'Amostra2015;' + data[1] + ';' + data[2] + ';' + cleanRedirectedUrl + '\n';
          break;
        case '2':
          difference = difference + 'EnsinoSuperior;' + data[1] + ';' + data[2] + ';' + cleanRedirectedUrl + '\n';
          break;
        case '3':
          difference = difference + 'Municipios;' + data[1] + ';' + data[2] + ';' + cleanRedirectedUrl + '\n';
          break;
        case '4':
          difference = difference + 'ONG;' + data[1] + ';' + data[2] + ';' + cleanRedirectedUrl + '\n';
          break;
        default:
          break;
    }
  }
  
  fs.writeFile('lib/failed_results.csv', await result, (err) => {
    if (err) console.log(err);
    console.log('Results saved!');
  });
  fs.writeFile('lib/difference_results.csv', await difference, (err) => {
    if (err) console.log(err);
    console.log('Differences saved!');
  });


  /*try {
    for (let c of Object.values(COUNTRY_JSON)) {
      query = `SELECT Name FROM Country WHERE name = "${c.country}";`;
      country = (await execute_query(serverName, query))[0];
      if (!country && c.country) {
        query = `INSERT INTO Country (name, continent)
            VALUES ("${c.country}", "${c.continent}");`;
        country = await execute_query(serverName, query);
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
  return success(result);*/
};

async function add_as_from_links_excel() {

  const Apify = require('apify');
  let linksWithAS: string[][] = [];

  // Transforming excel into json object
  let workbook = excelToJson({
    sourceFile: 'lib/urls_portugal_2020.xlsx',
    //sourceFile: 'lib/urls_crawler.xlsx',
    header: {
      rows: 1
    },
    columnToKey: {
      A: 'entity',
      B: 'old_url',
      C: 'new_url',
      D: 'changed',
      //E: 'test',
    },
    //sheets: ['Amostra2015 - diferenças','EnsinoSuperior - diferenças','Municípios - diferenças','ONG - diferenças']
    sheets: ['Amostra2015 - diferenças','EnsinoSuperior - diferenças','ONG - diferenças']
    //sheets: ['Mapa']
  });

  let index = 0;
  let textDocument: string;
  let html: any;
  let urls: string[] = [];
  let excelLinks: string = "";

  for (let sheet in workbook){
    for (let row of workbook[sheet]){
      excelLinks = excelLinks + trim(row['new_url']) + '\n';
      //excelLinks = excelLinks + trim(row['test']) + '\n';
    }
  }

  fs.writeFile('lib/new_urls.txt', excelLinks, (err) => {
    if (err) console.log(err);
    console.log('New urls saved!');
  });

  /*let newurls: string[] | null;
  newurls = await new Promise((resolve, reject) => {
    fs.readFile('lib/new_urls.txt', function (err, data) {
      if (err) {
        resolve(null);
      }
      resolve(data.toString());
    });
  });*/

  //aqui basta meter o excelLinks - nao preciso de ir ler o ficheiro depois de o escrever...
  //let newurls = ["https://dados.gov.pt/", "https://labx.gov.pt/", "https://www.livroamarelo.gov.pt/", "https://ogp.eportugal.gov.pt/", "https://www.apin.gov.pt/", "https://ticapp.gov.pt/", "https://giap.ticapp.gov.pt/", "https://tenhoumacrianca.gov.pt"];
  //let newurls = ["https://www.inem.pt/"];
  excelLinks = excelLinks.trim();
  let splittedLinks = excelLinks.split('\n');
  //let splittedLinks = newurls;
  process.env.APIFY_LOCAL_STORAGE_DIR = "./apify_storage";
  let HEADLESS_PUPPETEER = true;
  const requestQueue = await Apify.openRequestQueue('crawler');
  for await(let link of splittedLinks){
    await requestQueue.addRequest({ url: link });
  }
  let firstPage = true;
  let foundAS = false;
  let infos: any;
  let mapFinishedData: IHashString = {};
  const firstLineCSV = 'nome,declaracao,conformidade\n';

  const crawler = await new Apify.PuppeteerCrawler({
    requestQueue,
    launchPuppeteerOptions: {   
      headless: HEADLESS_PUPPETEER
    },
    
    gotoFunction: async ({ page, request } : {page: any, request: any}) =>{
      return await page.goto(request.url, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
    },
    maxConcurrency: 200,
    handlePageTimeoutSecs: 5*60,
    handlePageFunction: async ({ page, request, response } : {page: any, request: any, response: any}) => {
      let contentType = 'text/html';
      if((await response) !== null){
        contentType = await response.headers()['content-type'];
      }
      // accept content-type if can't read response headers
      let validContentType = contentType === undefined ? true : (contentType.startsWith('text/html') || contentType.startsWith('text/xml'));

      let url = page.url();
      let domain = url[url.length-1] === '/' ? url.substring(0,url.length-1) : url;
      let domainSplitted = domain.split('/');
      if(domainSplitted.length > 3){
        domain = domainSplitted.slice(0,3).join('/');
      }

      let dataEntry = findDataEntry(domain, mapFinishedData);
      //firstPage = dataEntry === '';
      firstPage = splittedLinks.includes(request.url);
      foundAS = firstPage ? false : (dataEntry !== '' ? mapFinishedData[dataEntry].finished : false);
      console.log('> ' + url, foundAS ? c.bold.green(true) : c.bold.red(false), validContentType ? c.bold.green('HTML') : c.bold.red('NO_HTML'));
      if(validContentType){
        if(!foundAS){
          if (firstPage) {
            mapFinishedData[domain] = {
              finished: false,
              linksRequestIds: []
            }

            // manually add /acessibilidade to find AS faster (only in Portugal)
            let possibleASUrl = domain + '/acessibilidade';
            await requestQueue.addRequest({ url: possibleASUrl });

            /* let links = await page.$$eval('a[href]', (el: any) => el.map((x: any) => x.getAttribute("href")));
            let absoluteUrls = links.map((link: string) => new URL(link, domain));
            let sameDomainLinks = absoluteUrls.filter((url: { href: string; }) => url.href.startsWith(domain));
            let req;
            for await (let link of sameDomainLinks) {
                req = await requestQueue.addRequest({ url: link.href });
                mapFinishedData[url].linksRequestIds.push(req.requestId);
            } */

            // with this pseudoUrls, only get urls in the same domain and not one of these files
            let pseudoUrls = [new Apify.PseudoUrl(domain + '[(?!.*\.(css|jpg|jpeg|gif|svg|pdf|docx|js|png|ico|xml|mp4|mp3|mkv|wav|rss|php|json)).*]')];
            // enqueue existent links with page that match corresponding regex
            infos = await Apify.utils.enqueueLinks({
              page,
              requestQueue,
              pseudoUrls
            });
            
            fs.appendFile('lib/crawl/400Homepages.txt', domain + '\n', (err) => {
              if (err) console.log(err);
            });

            dataEntry = domain;
            firstPage = false;
          } 

          // find AS using AS generators exclusive classes (portuguese and W3)
          const elemAS = await page.$('.mr.mr-e-name,.basic-information.organization-name');
          // find AS using h1 text (portuguese generator only)
          const headings = await page.$$eval('H1', (elems: any) => elems.map((elem: any) => elem.textContent.toLowerCase()));
          let validHeading = false;
          for(let i = 0; i < headings.length && !validHeading; i++){
            validHeading = headings[i] && headings[i].includes(('Declaração de Acessibilidade').toLowerCase());
          }
          if(!!elemAS || validHeading){
            if(!!elemAS){
              let className = await (await elemAS.getProperty("className")).jsonValue();

              // if it was made with the portuguese generator, store in a different file
              if(className && className.includes('mr-e-name')){
                if(!fs.existsSync('lib/crawl/portugueseAS.csv') || (await readFile('lib/crawl', 'portugueseAS.csv')).trim().length === 0){
                  fs.appendFile('lib/crawl/portugueseAS.csv', firstLineCSV, (err) => {
                    if (err) console.log(err);
                  });
                }
                let orgName = await page.$eval('.capFL [name=siteurl],.capFL .siteurl', (el: any) => el.textContent);
                let conformance = await page.$eval('.mr.mr-conformance-status', (el: any) => el.textContent);
                fs.appendFile('lib/crawl/portugueseAS.csv', orgName+','+request.url+','+conformance+'\n', (err) => {
                  if (err) console.log(err);
                });
              }
            }
            
            // store acessibility statemente in this file, independent of AS generator
            mapFinishedData[dataEntry].finished = true;
            console.log(c.bold.green(request.url));
            fs.appendFile('lib/crawl/foundAS.txt', request.url + '\n', (err) => {
              if (err) console.log(err);
            });
          }
        } else {
          /* // remove all urls that are in queue that belong to dataEntry domain
          let requestsLeft = mapFinishedData[dataEntry].linksRequestIds;
          for await(let reqId of requestsLeft){
            let request = await requestQueue.getRequest(reqId);
            console.log(request);
            await requestQueue.markRequestHandled(request);
          }
          // delete ids to avoid excessive memory usage
          mapFinishedData[dataEntry].linksRequestIds = []; */
          /* let reqQueue = mapFinishedData[dataEntry].queue;
          await reqQueue.drop(); */
        }
      }
    },
    handleFailedRequestFunction: async ({ request, error } : {request: any, error: any}) => {
      console.log(c.bold.red(request.url));
      fs.appendFile('lib/crawl/foundFailed.txt', request.url + '\n', (err) => {
        if (err) console.log(err);
      });
    },
  });
  console.log("touuuu?");
  let timeStart = new Date().getTime();
  await crawler.run();
  await requestQueue.drop();
  let hourDiff = new Date().getTime() - timeStart; //in ms
  let secDiff = hourDiff / 1000; //in s
  let minDiff = hourDiff / 60 / 1000; //in minutes
  let hDiff = hourDiff / 3600 / 1000; //in hours
  let humanReadable = {hours: 0, minutes: 0};
  humanReadable.hours = Math.floor(hDiff);
  humanReadable.minutes = minDiff - 60 * humanReadable.hours;
  console.log(c.bold.green("JA ACABOU!!!!!"), humanReadable);

  /*let crawler: any;
  if(typeof newurls === 'string'){
    if(newurls.endsWith('\n')){
      newurls = newurls.substring(0,newurls.length-1);
    }
    // -- Actively searching for links in the first level of each link --
    for await(let url of newurls.split('\n')){
      index = 0;
      urls = [];
      if(url === '-'){
        continue;
      }
      urls = await new Promise((resolve, reject) => {
        crawler = new Crawler(url);
        crawler.allowInitialDomainChange = true;
        //crawler.filterByDomain = false;
        crawler.on("crawlstart", function() {
          console.log(c.bold.blue('Starting >'), url);
        });
        crawler.on("fetchcomplete", function(queueItem: any) {
          urls.push(queueItem.url);
          //console.log(queueItem);
        });
        crawler.on("fetcherror", function (queueItem: any, responseBuffer: any) {
          fs.appendFile('failed_urls.txt', queueItem.url + '\n', function (err) {
            if (err) throw err;
            console.log(c.bold.red('Fetch Error >'), queueItem.url);
          });
        });
        crawler.on("fetchtimeout", function (queueItem: any, timeoutVal: any) {
          fs.appendFile('failed_urls.txt', queueItem.url + '\n', function (err) {
            if (err) throw err;
            console.log(c.bold.red('Fetch Timeout Error >'), queueItem.url);
          });
        });
        crawler.on("fetchredirect", function(queueItem: any, parsedURL: any) {
          console.log("I just received a redirect from %s to domain %s",queueItem.url, parsedURL.url);
          //var urlModule = require("url");
          if(queueItem.referrer === url){
            url = queueItem.url;
          }
          if(parsedURL.referrer === url){
            url = parsedURL.url;
          }
          crawler.queueURL(url);
        });
        /* testar nas universidades para saber se vale a pena ter isto
        crawler.on("fetchclienterror", function(queueItem: any, error: any) {
          crawler.stop();
          fs.appendFile('failed_urls.txt', queueItem.url + '\n'), function (err) {
            if (err) throw err;
            console.log(c.bold.red('Fetch Client Error >'), queueItem.url);
          });
          console.log('> Fetch Client Error at', url,'with',urls.length,'urls found');
          resolve(urls);
        });*/
        /*crawler.on('complete', function () {
          crawler.stop();
          if(!urls.some(u => u.includes('/acessibilidade'))){
            urls.push(url[url.length-1] === '/' ? url + 'acessibilidade' : url + '/acessibilidade');
          }
          console.log('> Crawling complete at', url,'with',urls.length,'urls found');
          resolve(urls);
        });
        crawler.addFetchCondition(function(parsedURL: any) {
          console.log(parsedURL.url);
          if (parsedURL.path.match(/\.(css|jpg|jpeg|gif|svg|pdf|docx|js|png|ico|xml|mp4|mp3|mkv|wav|rss|php|json)/i)) {
              return false;
          }
          return true;
        });
        crawler.maxDepth = 2;
        crawler.start();
      });

      // -- Searching for accessibility statements --
      let element, responseText;
      for await (let link of urls){
        html = null;
        element = null;
        await fetch(link, {size: 5000000})
          .then(async (response: any) => {
            if (await response.ok) {
              responseText = await response.text();
              //console.log(link, c.green('ok'));
              html = parse(responseText);
              element = await html.querySelectorAll(".mr.mr-e-name,.basic-information.organization-name");
              if(await element.length){
                fs.appendFile('as_urls.txt', link + '\n', function (err) {
                  if (err) throw err;
                  console.log(c.bold.green('### Found an Accessibility Statement'));
                });
              }
            } else {
              //console.log(link, c.red('oops'));
            }
          })
          .catch((err: any) => {
            console.log(c.red(err));
            fs.appendFile('failed_urls.txt', link + '\n', function (err) {
              if (err) throw err;
              console.log(c.bold.red('### Saved -'), link);
          });
        });
      }
      console.log(c.green('# Done'), url);
    }
  }*/
}

function findDataEntry(url: string, map: IHashString): string {
  for(let entry of Object.keys(map)){
    if(url.includes(entry)){
      return entry.toString();
    }
  }
  return '';
}

async function readFile(dirname: string, filename: string): Promise<string>{
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(dirname, filename), 'utf-8', function(err, content) {
      if (err) {
        console.log(err);
        return;
      }
      resolve(<string>content);
    });
  });   
} 

function randomString(len: number, an?: string) {
  an = an && an.toLowerCase();
  var str = "",
    i = 0,
    min = an == "a" ? 10 : 0,
    max = an == "n" ? 10 : 62;
  for (; i++ < len;) {
    var r = Math.random() * (max - min) + min << 0;
    str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
  }
  return str;
}

function fetchDocument(url: any) {
  return new Promise((resolve, reject) => {
      let client = http;
      if (url.toString().indexOf("https") === 0) {
          client = https;
      }
      client.get(url, (resp: any) => {
          let data = '';
          resp.on('data', (chunk: any) => {
              data += chunk;
          });
          resp.on('end', () => {
              resolve(data);
          });
      }).on("error", (err: any) => {
          console.log("Cannot read accessibility statement from", url);
          reject(err);
      });
  });
}

export { reset_database, add_filedata, add_countries, correct_urls_files_json, add_as_from_links_excel, prepare_database, group_elems, update_rules_table_element_type, get_link, fetchDocument };

export interface IHashString {
  [index: string]: {finished: boolean, linksRequestIds: number[]};
} 