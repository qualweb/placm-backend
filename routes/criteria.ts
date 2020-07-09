import express from "express";
import { get_data_success_criteria_filtered } from "../models/criteria";

const router = express.Router();

router.get('/allSCDataFiltered', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_success_criteria_filtered(req.query.name, filters)
      .then((result: any) => {
        console.log(result);
        console.log(result.result.length);
        let assertions = 0;
        let pages = 0;
        for(let a of result.result){
          assertions+= a.nAssertions;
          pages+= a.nPages;
        }
        console.log("assertions", assertions);
        console.log("pages", pages);
        res.send(result);})
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;