import express from "express";
import { add_accessibility_statement } from "../../models/page";

const router = express.Router();

router.post('/add', async function (req, res, next) {
    try {
      req.check('textFromLink', 'Invalid json from link').exists();
      req.check('textFromFile', 'Invalid json from file').exists();
      //req.check('jsons', 'Invalid jsons').exists();
      const errors = req.validationErrors();
      if (errors) {
        console.log(errors);
        // or file === undefined, reiniciar pedido e button
        res.send(errors);
      } else {
        //console.log(req.body.jsons);
        //console.log((req.body.jsons).length);
          const textFromLink = req.body.textFromLink;
          const textFromFile = req.body.textFromFile;
          await add_accessibility_statement(textFromLink, textFromFile)
            .then(result => res.send(result))
            .catch((err: any) => res.send(err));
        }
    } catch (err) {
      console.log(err);
      res.send(err);
    }
  });

export = router;