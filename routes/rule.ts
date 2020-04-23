import express from "express";
import { get_all_data } from "../models/rule";

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

export = router;