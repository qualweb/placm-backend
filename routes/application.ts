import express from "express";
import { get_app_data_filtered, get_sector_data_filtered, get_org_data_filtered } from "../models/application";

const router = express.Router();

router.get('/appDataFiltered', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_app_data_filtered(filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/sectorDataFiltered', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_sector_data_filtered(filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/orgDataFiltered', async function (req, res, next) {
  try {
    let filters = req.query.filters ? req.query.filters : {};
    await get_org_data_filtered(filters)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;