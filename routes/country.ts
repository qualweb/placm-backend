import express from "express";
import {get_all_country_names, get_data, get_data_sc, get_data_compare, get_data_sc_compare} from "../models/country"

const router = express.Router();

/*router.post('/add', async function (req, res, next) {
  try {
      await add_countries()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
    console.log(err);
    res.send(err);
  }
});

router.get('/byCountry', async function (req, res, next) {
  try {
      await get_data_by_country()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});*/

router.get('/countryNames', async function (req, res, next) {
  try {
    await get_all_country_names(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/continentData', async function (req, res, next) {
  try {
      await get_data('continent', req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/countryData', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_data('country', req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/continentDataSC', async function (req, res, next) {
  try {
      await get_data_sc('continent', req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/countryDataSC', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_sc('country', req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/continentDataCompare', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
      await get_data_compare('continent', req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/countryDataCompare', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_compare('country', req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/continentDataSCCompare', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
      await get_data_sc_compare('continent', req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/countryDataSCCompare', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_sc_compare('country', req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;