import express from "express";
import { get_all_data, get_data_rule_filtered } from "../models/rule";

const router = express.Router();

router.get('/allData', async function (req, res, next) {
  try {
      await get_all_data()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/allRuleDataFiltered', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_rule_filtered(filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;