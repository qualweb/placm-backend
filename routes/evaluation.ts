import express from "express";
import { get_data_by_evaluation_tool } from "../models/evaluation";

const router = express.Router();

router.get('/byTool', async function (req, res, next) {
  try {
      await get_data_by_evaluation_tool()
      .then((result: any) => res.send(result))
      .catch((err: any) => res.send(err));
  } catch (err) {
      console.log(err);
      res.send(err);
  }
});

export = router;