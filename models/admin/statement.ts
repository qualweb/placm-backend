import { forEach } from "lodash";
import { add_earl_report } from "./report";
import { parse } from 'node-html-parser';
import { twitterRegex, emailRegex, telephoneRegex } from "../../lib/constants";
import { setCharAt, readyStringToQuery, readyUrlToQuery } from "../../lib/util";
import { execute_query } from "../../lib/database";
import { error, success } from "../../lib/responses";

const fetch = require("node-fetch");

const add_accessibility_statement = async (serverName: string, numLinks: number, ...linksAndTexts: string[]) => {
  console.log(numLinks);

  let statements: any[] = [];
  let linksRead: string[] = [];

  /*for(let text of texts){
    if(text){
      statements.push(parse(text));
    }
  }*/


  for(let i = 0; i < linksAndTexts.length; i++){
    if(numLinks > 0 && i <= numLinks - 1){
      if(linksAndTexts[i]){
        linksRead.push(linksAndTexts[i]);
      }
    } else {
      if(linksAndTexts[i]){
        statements.push(parse(linksAndTexts[i]));
      }
    }
  }

  let origin;
  let asUrl;
  let organization, orgElem;
  let name, nameElem;
  let appUrl, appUrlElem;
  let state, stateString = "", stateElem;
  let date, dateElem;
  let standard, standardElem, standardText, standardNumber;
  let autoEvaluations, manualEvaluations, wwwcLinks;
  let sealElem, seal, sealEnum, sealText, sealTextElem;
  let phoneNumber: string[] = [], email: string[] = [], twitter: string[] = [],
      visitorAddress: string[] = [], postalAddress: string[] = [];
  let phoneElem, emailElem, extraContactsElem, visitorAddrElem, postalAddrElem, 
      allContactsElem, allContactsElemList; 
  let durResponse: string | null = null, durResponseElem;
  let earlReports: string[] = [];
  let effortsCounter = 0, effortsListElem;
  let limitationsCounter = 0, limitationsListElem;
  let compatabilitiesCounter = 0, incompatabilitiesCounter = 0, 
      compatabilitiesListElem, incompatabilitiesListElem;
  let technologiesUsed: string | null = "", technologiesListElem;
  let approachListElem, approach = '000';

  let results: any = {
    astatements: [],
    applications: [],
    contacts: [],
    reports: {}
  };

  let query: any;
  let application: any, asSQL: any, contact: any;

  for(let i = 0; i < statements.length; i++){
    /* ---------- handle organization name ---------- */
    orgElem = statements[i].querySelectorAll(".mr.mr-e-name");
    if(orgElem.length){
      /*lowFl - let orgSiblingIndex = orgElem[0].parentNode.childNodes.indexOf(orgElem[0]) + 2;
      organization = orgElem[0].parentNode.childNodes[orgSiblingIndex].text;*/
      organization = orgElem[0].childNodes[0].text;
    } else {
      orgElem = statements[i].querySelectorAll(".basic-information.organization-name");
      if(orgElem.length){
        organization = orgElem[0].text;
      }
    }

    /* ---------- handle application name ---------- */
    nameElem = statements[i].querySelectorAll("[name=target-name]");
    if(nameElem.length){
      name = nameElem[0].text;
      origin = "govpt";
    } else {
      nameElem = statements[i].querySelectorAll(".basic-information.website-name");
      if(nameElem.length){
        name = nameElem[0].text;
        origin = "w3c";
      }
    }

    /* ---------- handle application url ---------- */
    appUrlElem = statements[i].querySelectorAll("[name=siteurl]");
    if(appUrlElem.length){
      appUrl = appUrlElem[0].getAttribute('href');
    } else {
      // todo w3c generator doesnt have the link element even having an input field to app's url
    }

    /* ---------- handle conformance state ---------- */
    stateElem = statements[i].querySelectorAll("[name=conformance-output]");
    if(stateElem.length){
      stateString = stateElem[0].text.toLowerCase();
    } else {
      stateElem = statements[i].querySelectorAll(".basic-information.conformance-status");
      if(stateElem.length){
        stateString = stateElem[0].text.toLowerCase();
      }
    }
    switch(stateString){
      case 'não conforme':
      case 'non conformant':
        state = 1;
        break;
      case 'parcialmente conforme':
      case 'partially conformant':
        state = 2;
        break;
      case 'plenamente conforme':
      case 'fully conformant':
        state = 3;
        break;
      default:
        state = 0;
        break;
    }

    /* ---------- handle AS date ---------- */
    dateElem = statements[i].querySelectorAll(".mr.mr-date");
    if(dateElem.length){
      date = dateElem[0].text;
    } else {
      dateElem = statements[i].querySelectorAll(".basic-information.statement-created-date");
      if(dateElem.length){
        date = dateElem[0].text;
      }
    }

    /* ---------- handle standard ---------- */
    standardElem = statements[i].querySelectorAll(".basic-information.conformance-standard");
    if(standardElem.length){
      //standardText = standardElem[0].text;
      standardText = standardElem[0].childNodes[0].text;
      //standardText = standardText.substring(0, standardText.length - 1);
      standardNumber = standardText.split(" ")[1];
      if(standardNumber === "2.1" || standardNumber === "2.0"){
        standard = standardNumber;
      } else {
        standard = "other";
      }
    } else {
      if(origin === 'govpt'){
        standard = "2.0";
      } else {
        standard = "unknown";
      }
    }

    /* ---------- handle earl report links ---------- */
    autoEvaluations = statements[i].querySelectorAll(".mr.mr-automatic-summary");
    manualEvaluations = statements[i].querySelectorAll(".mr.mr-manual-summary");
    wwwcLinks = statements[i].querySelectorAll(".technical-information.related-evidence");

    let linksFound = findChildrenLinks(autoEvaluations, manualEvaluations, wwwcLinks);
    for(let i = 0; i < linksFound.length; i++){
      let fetchedText = await fetch(linksFound[i]);
      if(await fetchedText){
        earlReports.push(await fetchedText.text());
      }
    }

    /* ---------- handle accessibility seal ---------- */
    sealElem = statements[i].querySelectorAll(".mr.mr-seal");
    if(sealElem.length){
      seal = sealElem[0].text.toLowerCase();
      switch(seal){
        case 'ouro':
          sealEnum = 3;
          break;
        case 'prata':
          sealEnum = 2;
          break;
        case 'bronze':
          sealEnum = 1;
          break;
        default:
          sealEnum = 0;
          break;
      }
    } else {
      sealEnum = 0;
    }

    sealTextElem = statements[i].querySelectorAll("#accstmnt_additional_evidence_summary");
    if(sealTextElem.length){
      sealText = sealTextElem[0].text;
    }

    /* ---------- handle contacts - W3C AS generator ---------- */
    phoneElem = statements[i].querySelectorAll(".phone-number.p-tel");
    if(phoneElem.length){
      phoneNumber.push(phoneElem[0].text);
    }
    emailElem = statements[i].querySelectorAll(".email.u-email");
    if(emailElem.length){
      email.push(emailElem[0].text);
    }
    visitorAddrElem = statements[i].querySelectorAll(".visitor-address.p-extended-address");
    if(visitorAddrElem.length){
      visitorAddress.push(visitorAddrElem[0].text);
    }
    postalAddrElem = statements[i].querySelectorAll(".postal-address.p-adr");
    if(postalAddrElem.length){
      postalAddress.push(postalAddrElem[0].text);
    }
    extraContactsElem = statements[i].querySelectorAll(".contact-other.p-note");
    if(extraContactsElem.length){
      twitter.push(...extraContactsElem[0].text.match(twitterRegex));
    }

    durResponseElem = statements[i].querySelectorAll(".feedback.responsetime");
    if(durResponseElem.length){
      durResponse = durResponseElem[0].text;
    }

    /* ---------- handle contacts - Portuguese AS generator ---------- */
    allContactsElem = statements[i].querySelectorAll('#accstmnt_orginfo_contacts_summary');
    if(allContactsElem.length){
      allContactsElemList = allContactsElem[0].querySelectorAll('dd');
      if(allContactsElemList.length){
        forEach(allContactsElemList, (elem => {
          if(elem.text.match(emailRegex)){
            email.push(elem.text);
          } else if(elem.text.match(twitterRegex)){
            twitter.push(elem.text);
          } else if(elem.text.match(telephoneRegex)){
            phoneNumber.push(elem.text);
          } else{
            visitorAddress.push(elem.text);
          } 
        }));
      }
    }

    /* ---------- handle efforts ---------- */
    effortsListElem = statements[i].querySelectorAll('.organizational-effort.accessibility-measures');
    if(effortsListElem.length){
      forEach(effortsListElem[0].childNodes, (child => {
        if(child.tagName){
          effortsCounter++;
        }
      }));
    }
    
    /* ---------- handle limitations ---------- */
    limitationsListElem = statements[i].querySelectorAll('#non-conformance-sections');
    if(limitationsListElem.length){
      forEach(limitationsListElem[0].childNodes, (child => {
        if(child.tagName){
          limitationsCounter++;
        }
      }));
    } else {
      limitationsListElem = statements[i].querySelectorAll('.technical-information.accessibility-limitations');
      if(limitationsListElem.length){
        forEach(limitationsListElem[0].childNodes, (child => {
          if(child.tagName){
            limitationsCounter++;
          }
        }));
      }
    }

    /* ---------- handle technologies ---------- */
    technologiesListElem = statements[i].querySelectorAll('.technical-information.technologies-used');
    if(technologiesListElem.length){
      forEach(technologiesListElem[0].childNodes, (tech => {
        if(tech.tagName && technologiesUsed){
          technologiesUsed = technologiesUsed.concat(tech.text.replace(';',','), ';');
        }
      }));
    }
    // to remove final dot
    if(technologiesUsed && technologiesUsed.length > 1){
      technologiesUsed = technologiesUsed.substring(0, technologiesUsed.length - 1);
    }

    /* ---------- handle compatabilities ---------- */
    compatabilitiesListElem = statements[i].querySelectorAll('.technical-information.technologies-used');
    if(compatabilitiesListElem.length){
      forEach(compatabilitiesListElem[0].childNodes, (child => {
        if(child.tagName){
          compatabilitiesCounter++;
        }
      }));
    }

    /* ---------- handle incompatabilities ---------- */
    incompatabilitiesListElem = statements[i].querySelectorAll('.technical-information.technologies-used');
    if(incompatabilitiesListElem.length){
      forEach(incompatabilitiesListElem[0].childNodes, (child => {
        if(child.tagName){
          incompatabilitiesCounter++;
        }
      }));
    }

    /* ---------- handle accessment approach ---------- */
    approachListElem = statements[i].querySelectorAll('.technical-information.technologies-used');
    if(approachListElem.length){
      forEach(approachListElem[0].childNodes, (child => {
        if(child.tagName){
          switch(child.text.toLowerCase()){
            case 'self-evaluation':
              approach = setCharAt(approach, 2, '1');
              break;
            case 'external evaluation':
              approach = setCharAt(approach, 1, '1');
              break;
            default:
              approach = setCharAt(approach, 0, '1');
              break;
          }
        }
      }));
    }

    appUrl = appUrl === undefined ? null : readyUrlToQuery(appUrl);
    organization = organization === undefined ? null : readyStringToQuery(organization);
    date = date === undefined ? new Date().toISOString().slice(0, 19).replace('T', ' ') : new Date(date).toISOString().slice(0, 19).replace('T', ' ');

    origin = origin === undefined ? 'unknown' : readyStringToQuery(origin);
    asUrl = linksRead[i] === undefined ? null : readyUrlToQuery(linksRead[i]);
    standard = standard === undefined ? 'unknown' : standard;
    sealText = sealText === undefined ? null : readyStringToQuery(sealText);
    technologiesUsed = technologiesUsed === null ? null : readyStringToQuery(technologiesUsed);

    durResponse = durResponse === null ? null : readyStringToQuery(durResponse);

    try {
      if(appUrl === null){
        query = `SELECT ApplicationId FROM Application WHERE name = "${name}" AND organization = ${organization};`;
      } else {
        query = `SELECT ApplicationId FROM Application WHERE url = ${appUrl};`;
      }
      application = (await execute_query(serverName, query))[0];
      if (!application) {
        query = `INSERT INTO Application (name, url, organization, creationdate)
          VALUES ("${name}", ${appUrl}, ${organization}, "${date}");`;
        application = await execute_query(serverName, query);
        results.applications.push(application.insertId);
      }

      // todo fix from:file
      if(asUrl === null){
        query = `SELECT ASId FROM AccessibilityStatement 
                    WHERE 
                    Origin = ${origin} AND
                    ApplicationId = "${application.insertId || application.ApplicationId}" AND
                    Standard = "${standard}" AND
                    Date = "${date}" AND
                    State = "${state}" AND
                    UsabilityStamp = "${sealEnum}" AND
                    UsabilityStampText = ${sealText} AND
                    LimitationsWithoutAltCounter = "${limitationsCounter}" AND
                    CompatabilitiesCounter = "${compatabilitiesCounter}" AND
                    IncompatabilitiesCounter = "${incompatabilitiesCounter}" AND
                    TechnologiesUsed = ${technologiesUsed} AND
                    AccessmentApproach = "${approach}";`;
      } else {
        query = `SELECT ASId FROM AccessibilityStatement 
                    WHERE
                    ASUrl = ${asUrl};`;
      }
      asSQL = (await execute_query(serverName, query))[0];
      if (!asSQL) {
        query = `INSERT INTO AccessibilityStatement (Origin, ASUrl, ApplicationId, Standard, Date, State, UsabilityStamp, UsabilityStampText, 
                LimitationsWithoutAltCounter, CompatabilitiesCounter, IncompatabilitiesCounter, TechnologiesUsed, AccessmentApproach)
                VALUES (${origin}, ${asUrl}, "${application.insertId || application.ApplicationId}", "${standard}",
                "${date}", "${state}", "${sealEnum}", ${sealText}, "${limitationsCounter}", "${compatabilitiesCounter}", 
                "${incompatabilitiesCounter}", ${technologiesUsed}, "${approach}");`;
        asSQL = await execute_query(serverName, query);
        results.astatements.push(asSQL.insertId);
      }

      forEach(phoneNumber, (async phone => {
        phone = readyStringToQuery(phone);
        query = `SELECT ContactId FROM Contact WHERE type = "phone" AND contact = ${phone};`;
        contact = (await execute_query(serverName, query))[0];
        if (!contact) {
          query = `INSERT INTO Contact (type, contact)
            VALUES ("phone", ${phone});`;
            contact = await execute_query(serverName, query);
          results.contacts.push(contact.insertId);
        }
      }));
      forEach(email, (async emailAddr => {
        emailAddr = readyStringToQuery(emailAddr);
        query = `SELECT ContactId FROM Contact WHERE type = "email" AND contact = ${emailAddr};`;
        contact = (await execute_query(serverName, query))[0];
        if (!contact) {
          query = `INSERT INTO Contact (type, contact, durationresponse)
            VALUES ("email", ${emailAddr}, ${durResponse});`;
            contact = await execute_query(serverName, query);
          results.contacts.push(contact.insertId);
        }
      }));
      forEach(visitorAddress, (async visitorAddr => {
        visitorAddr = readyStringToQuery(visitorAddr);
        query = `SELECT ContactId FROM Contact WHERE type = "visitorAdress" AND contact = ${visitorAddr};`;
        contact = (await execute_query(serverName, query))[0];
        if (!contact) {
          query = `INSERT INTO Contact (type, contact)
            VALUES ("visitorAdress", ${visitorAddr});`;
            contact = await execute_query(serverName, query);
          results.contacts.push(contact.insertId);
        }
      }));
      forEach(postalAddress, (async postalAddr => {
        postalAddr = readyStringToQuery(postalAddr);
        query = `SELECT ContactId FROM Contact WHERE type = "postalAdress" AND contact = ${postalAddr};`;
        contact = (await execute_query(serverName, query))[0];
        if (!contact) {
          query = `INSERT INTO Contact (type, contact)
            VALUES ("postalAdress", ${postalAddr});`;
            contact = await execute_query(serverName, query);
          results.contacts.push(contact.insertId);
        }
      }));
      forEach(twitter, (async twitterAt => {
        twitterAt = readyStringToQuery(twitterAt);
        query = `SELECT ContactId FROM Contact WHERE type = "twitter" AND contact = ${twitterAt};`;
        contact = (await execute_query(serverName, query))[0];
        if (!contact) {
          query = `INSERT INTO Contact (type, contact, durationresponse)
            VALUES ("twitter", ${twitterAt}, ${durResponse});`;
            contact = await execute_query(serverName, query);
          query = `INSERT INTO AcceStatContact (ASId, ContactId)
            VALUES ("${asSQL.insertId || asSQL.ASId}", "${contact.insertId}");`
          results.contacts.push(contact.insertId);
        }
      }));
      results.reports = (await add_earl_report(serverName, ...earlReports)).result;
    } catch (err){
      console.log(err);
      throw error(err);
    }
  }
  return success(results);
}

function findChildrenLinks(...evaluations: NodeListOf<Element>[]): string[] {
  let aElements, href;
  let earlReportsLinks: string[] = [];

  forEach(evaluations, (evaluation => {
    forEach(evaluation, (element => {
      if(element.tagName === 'a'){
        href = element.getAttribute('href');
        if(href && /^https?:\/\/.*\.json$/.test(href)){
          earlReportsLinks.push(href);
        }
      } else {
        aElements = element.querySelectorAll('a');
        forEach(aElements, (a => {
          href = a.getAttribute('href');
          if(href && /^https?:\/\/.*\.json$/.test(href)){
            earlReportsLinks.push(href);
          }
        }));
      }
    }));
  }));

  return earlReportsLinks;
}

export { add_accessibility_statement };