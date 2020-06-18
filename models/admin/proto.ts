import { success, error } from "../../lib/responses";
import { execute_query } from "../../lib/database";
import { COUNTRY_JSON, CONSTELLATIONS_JSON, PROTODATA_JSON, urlRegex, DB_NAMES } from "../../lib/constants";
import * as fs from 'fs';
import { trim, includes, map, truncate } from "lodash";
import path from "path";
import puppeteer from "puppeteer";
import { parse } from 'node-html-parser';

const excelToJson = require('convert-excel-to-json');
let Crawler = require('simplecrawler');

const fetch = require("node-fetch");

const c = require('ansi-colors');

const randomWords = require('random-words');

const reset_database = async (serverName: string) => {
  let query;
  const dbName: string = DB_NAMES[serverName];
  try {
    // get all table names except country and continent
    query = `SELECT 
    CONCAT('TRUNCATE TABLE ',TABLE_NAME,';') AS truncateCommand
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = '${dbName}' AND TABLE_NAME NOT IN ("Country", "Continent");
    `;
    let truncates = await execute_query(serverName, query);

    // deleting all content from tables
    query = `SET FOREIGN_KEY_CHECKS=0;\n\n`;
    for(let trunc of truncates){
      query = query.concat(trunc.truncateCommand).concat('\n');
    }
    query = query.concat(`\nSET FOREIGN_KEY_CHECKS=1;`);
    await execute_query(serverName, query, true);

  } catch (err){
    console.log(err);
    return error(err);
  }
  return success();
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
  const numberApps = 15;
  const numberPages = 10;
  const numberTools = 5;
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
              url = '"'.concat(entry['data1'],'"');
            }
            query = `INSERT INTO EvaluationTool (name, url, description, version)
                VALUES ("${entry['name']}", ${url}, "${entry['data2']}", "${entry['data3']}");`;
            evalTool = await execute_query(serverName, query);
            result.evaluationTools.push(evalTool.insertId);
          };
          break;
        case 'Rule':
          query = `SELECT RuleId FROM Rule WHERE name = "${entry['name']}";`;
          rule = (await execute_query(serverName, query))[0];
          if (!rule) {
            if(entry['data1'] === ''){
              url = null;
            } else {
              url = '"'.concat(entry['data1'],'"');
            }
            query = `INSERT INTO Rule (name, url, description)
                VALUES ("${entry['name']}", ${url}, "${entry['data2']}");`;
            rule = await execute_query(serverName, query);
            result.rules.push(rule.insertId);
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

    appUrl = "http://www.".concat(randomString(10,'a')).concat('.com');
    appDate = '2020-0'.concat((Math.floor(Math.random()*9)+1).toString())
        .concat('-')
        .concat(Math.floor(Math.random()*3).toString())
        .concat((Math.floor(Math.random()*9)+1).toString())
        .concat(' 00:00:00');
    query = `SELECT ApplicationId FROM Application WHERE name = "${appName}";`;
    app = (await execute_query(serverName, query))[0];
    if (!app) {
      let organizationName = randomWords({ exactly: 1 })[0];
      organizationName = organizationName.charAt(0).toUpperCase() + organizationName.slice(1);
      organizationName = organizationName.concat(' ').concat(orgsExtensions[Math.floor(Math.random()*3)]);
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
    for(let j = 0; j < Math.floor(Math.random()*numberPages)+1; j++) {
      pageUrl = appUrl.concat('/').concat(randomString(10));
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
      for(let r = 1; r <= numberTools; r++) {
        assertionDesc = randomString(15,'a');
        assertionOutcome = outcomes[Math.floor(Math.random()*5)];

        query = `SELECT AssertionId FROM Assertion WHERE 
              evaluationtoolid = "$evaluationToolId}" AND
              ruleid = "${r}" AND
              pageid = "${pageId}" AND
              mode = "automatic" AND
              date = "${appDate}" AND
              description = "${assertionDesc}" AND
              outcome = "${assertionOutcome}";`;
        assertion = (await execute_query(serverName, query))[0];
        if (!assertion) {
          query = `INSERT INTO Assertion (evaluationtoolid, ruleid, pageid, mode, date, description, outcome)
              VALUES ("${evaluationToolId}", "${r}", "${pageId}", "automatic", "${appDate}", "${assertionDesc}", "${assertionOutcome}");`;
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
      /*if(c.continent){
        if(!result.continents.includes(c.continent)){
          query = `INSERT INTO Continent (name) VALUES ("${c.continent}");`;
          console.log(query);
          result.continents.push(c.continent);
        }
        query = `INSERT INTO Country (name, continentId) VALUES ("${c.country}", "${result.continents.indexOf(c.continent)}");`;
        console.log(query);
      }*/
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
      cleanJsonUrl = protocol.concat('/', website[3]);
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
          failedLinks.push([fileNumber.toString(), entities[index], url, "0 - ".concat(result.status().toString())]);
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
      failedLinks.push([fileNumber.toString(), entities[index], url, "2 - error ".concat(error)]);
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
        result = result.concat('Amostra2015;', fl[1], ';', fl[2], ';', fl[3],'\n');
        break;
      case '2':
        result = result.concat('EnsinoSuperior;', fl[1], ';', fl[2], ';', fl[3],'\n');
        break;
      case '3':
        result = result.concat('Municipios;', fl[1], ';', fl[2], ';', fl[3],'\n');
        break;
      case '4':
        result = result.concat('ONG;', fl[1], ';', fl[2], ';', fl[3],'\n');
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
      domain = protocol.concat('/', website[3]);
    } else {
      domain = data[3];
    }

    //let cleanRegisteredUrl = data[1][data[1].length - 1] === '/' ? data[1].substring(0; data[1].length - 1) : data[1];
    let cleanRedirectedUrl = domain[domain.length - 1] === '/' ? domain.substring(0, domain.length - 1) : domain;
      switch(data[0]){
        case '1':
          difference = difference.concat('Amostra2015;', data[1], ';', data[2], ';', cleanRedirectedUrl, '\n');
          break;
        case '2':
          difference = difference.concat('EnsinoSuperior;', data[1], ';', data[2], ';', cleanRedirectedUrl, '\n');
          break;
        case '3':
          difference = difference.concat('Municipios;', data[1], ';', data[2], ';', cleanRedirectedUrl, '\n');
          break;
        case '4':
          difference = difference.concat('ONG;', data[1], ';', data[2], ';', cleanRedirectedUrl, '\n');
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

  let linksWithAS: string[][] = [];

  /*const browser = await puppeteer.launch({
    ignoreHTTPSErrors: true
  });
  const page = await browser.newPage();*/

  // Transforming excel into json object
  let workbook = excelToJson({
    sourceFile: 'lib/urls_portugal_2020.xlsx',
    header: {
      rows: 1
    },
    columnToKey: {
      A: 'entity',
      B: 'old_url',
      C: 'new_url',
      D: 'changed',
    },
    sheets: ['Amostra2015 - diferenças','EnsinoSuperior - diferenças','Municípios - diferenças','ONG - diferenças']
  });

  let index = 0;
  let textDocument: string;
  let html: any;
  let urls: string[] = [];
  let excelLinks: string = "";

  for (let sheet in workbook){
    for (let row of workbook[sheet]){
      excelLinks = excelLinks.concat(trim(row['new_url']), '\n');
    }
  }

  fs.writeFile('lib/new_urls.txt', excelLinks, (err) => {
    if (err) console.log(err);
    console.log('New urls saved!');
  });

  let newurls: string | null;
  /*newurls = await new Promise((resolve, reject) => {
    fs.readFile('lib/new_urls.txt', function (err, data) {
      if (err) {
        resolve(null);
      }
      resolve(data.toString());
    });
  });*/
  newurls = "https://www.defesa.pt/";

  let crawler: any;
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
        crawler.on("crawlstart", function() {
          console.log(c.bold.blue('Starting >'), url);
        });
        crawler.on("fetchcomplete", function(queueItem: any) {
          urls.push(queueItem.url);
          console.log(queueItem.url);
        });
        crawler.on("fetcherror", function (queueItem: any, responseBuffer: any) {
          fs.appendFile('failed_urls.txt', queueItem.url.concat('\n'), function (err) {
            if (err) throw err;
            console.log(c.bold.red('Fetch Error >'), queueItem.url);
          });
        });
        crawler.on("fetchtimeout", function (queueItem: any, timeoutVal: any) {
          fs.appendFile('failed_urls.txt', queueItem.url.concat('\n'), function (err) {
            if (err) throw err;
            console.log(c.bold.red('Fetch Timeout Error >'), queueItem.url);
          });
        });
        crawler.on("fetchredirect", function(queueItem: any, parsedURL: any) {
          console.log("I just received a redirect from %s to domain %s",queueItem.url, parsedURL.host);
        });
        /* testar nas universidades para saber se vale a pena ter isto
        crawler.on("fetchclienterror", function(queueItem: any, error: any) {
          crawler.stop();
          fs.appendFile('failed_urls.txt', queueItem.url.concat('\n'), function (err) {
            if (err) throw err;
            console.log(c.bold.red('Fetch Client Error >'), queueItem.url);
          });
          console.log('> Fetch Client Error at', url,'with',urls.length,'urls found');
          resolve(urls);
        });*/
        crawler.on('complete', function () {
          crawler.stop();
          if(!urls.some(u => u.includes('/acessibilidade'))){
            urls.push(url[url.length-1] === '/' ? url.concat('acessibilidade') : url.concat('/acessibilidade'));
          }
          console.log('> Crawling complete at', url,'with',urls.length,'urls found');
          resolve(urls);
        });
        crawler.addFetchCondition(function(parsedURL: any) {
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
                fs.appendFile('as_urls.txt', link.concat('\n'), function (err) {
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
            fs.appendFile('failed_urls.txt', link.concat('\n'), function (err) {
              if (err) throw err;
              console.log(c.bold.red('### Saved -'), link);
          });
        });
      }
      console.log(c.green('# Done'), url);
    }
  }
}

async function readFilesFromDirname(dirname: string) {
  return new Promise((resolve, reject) => {
    fs.readdir(dirname, function(err, filenames) {
      if (err) {
        console.log(err);
        return;
      }
      let list = [];
      for(let filename of filenames){
        list.push(readFile(dirname,filename))
      }
      resolve(Promise.all(list))
    });
  });
}

async function readFile(dirname: string, filename: string){
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

export { reset_database, add_filedata, add_countries, correct_urls_files_json, add_as_from_links_excel };
