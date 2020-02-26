import express from "express";
import {add_countries} from "../models/country"

const router = express.Router();

router.post('/addAll', async function (req, res, next) {
    try {
        await add_countries()
        .then((result: any) => res.send(result))
        .catch((err: any) => res.send(err));
    } catch (err) {
      console.log(err);
      res.send(err);
    }
  });

export = router;