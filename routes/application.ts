import express from "express";
import { get_data_by_sector, get_data_by_type, get_data_by_name } from "../models/application";

const router = express.Router();

router.get('/bySector', async function (req, res, next) {
  try {
      await get_data_by_sector()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/byType', async function (req, res, next) {
  try {
      await get_data_by_type()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/byName', async function (req, res, next) {
  try {
      await get_data_by_name()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;