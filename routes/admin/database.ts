import express from "express";
import * as database from "../../models/admin/database";
import {} from "../../models/admin/crawler"

const router = express.Router();

router.post('/updateRules', async function (req, res, next) {
  try {
    database.insert_rules_element_type(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.post('/updateSC', async function (req, res, next) {
  try {
    database.insert_success_criteria(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.post('/updateCountries', async function (req, res, next) {
  try {
    database.insert_countries(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.post('/prepare', async function (req, res, next) {
  try {
    database.prepare_database(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/reset', async function (req, res, next) {
  try {
    database.reset_database(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/elems_json', async function (req, res, next) {
  database.element_types_json();
});

export = router;