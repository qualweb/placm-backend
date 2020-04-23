import express from "express";
import { get_number_of_tags, get_all_tag_data } from "../models/tag";

const router = express.Router();

router.get('/numberOf', async function (req, res, next) {
  try {
      await get_number_of_tags()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

router.get('/allData', async function (req, res, next) {
  try {
      await get_all_tag_data()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;