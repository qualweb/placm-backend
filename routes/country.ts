import express from "express";
import {get_data_country_filtered, get_data_continent} from "../models/country"

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
      await get_data_continent()
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
    await get_data_country_filtered(filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;