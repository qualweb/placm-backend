import express from "express";
import { by_month_assertions, by_month_scriteria, assertions_by_date_cumulative, get_distinct_dates } from "../models/timeline";

const router = express.Router();

router.get('/byMonthAS', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    by_month_assertions(serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/byMonthSC', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    by_month_scriteria(serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

/************* NOT IN USE *****************/
router.get('/timeline', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    assertions_by_date_cumulative(serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/dates', async function (req, res, next) {
  try {
    let serverName = req.query.name;
    let filters = req.query.filters ? req.query.filters : {};
    get_distinct_dates(serverName, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});
/******************************************/

export = router;