import express from "express";
import { get_all_data, get_data_rule, get_data_element_type, get_data_rule_compare, get_data_element_type_compare } from "../models/rule";

const router = express.Router();

router.get('/allData', async function (req, res, next) {
  try {
      get_all_data()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/ruleData', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    get_data_rule(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/elemData', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    get_data_element_type(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/ruleDataCompare', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    get_data_rule_compare(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/elemDataCompare', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    get_data_element_type_compare(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;