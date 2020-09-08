import express from "express";
import { get_data_success_criteria, get_data_success_criteria_compare } from "../models/criteria";

const router = express.Router();

router.get('/scData', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    get_data_success_criteria(req.query.name, filters)
      .then((result: any) => {/* 
        console.log(result);
        console.log(result.result.length);
        let assertions = 0;
        let pages = 0;
        for(let a of result.result){
          assertions+= a.nAssertions;
          pages+= a.nPages;
        }
        console.log("assertions", assertions);
        console.log("pages", pages); */
        res.send(result);})
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/scDataCompare', async function (req, res, next) {
  try {
    let filters;
    if(!!req.query.filters && req.query.filters !== '{}'){
      filters = req.query.filters;
    } else {
      throw({ code: 0, message: 'No queryParams given', err: 'EMPTY_PARAMS' });
    }
    get_data_success_criteria_compare(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;