import express from "express";
import { get_data_by_application } from "../models/page";

const router = express.Router();

router.get('/byApp', async function (req, res, next) {
  try {
      await get_data_by_application(req.query.id)
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;