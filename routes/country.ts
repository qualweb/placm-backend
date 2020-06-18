import express from "express";
import {get_data_country_filtered, get_data_continent, get_all_country_names} from "../models/country"

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

router.get('/allContinentData', async function (req, res, next) {
  try {
      await get_data_continent(req.query.name)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/allCountryDataFiltered', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_data_country_filtered(req.query.name, filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

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

export = router;