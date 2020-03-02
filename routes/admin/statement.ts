import express from "express";
import { add_accessibility_statement } from "../../models/admin/statement";

const router = express.Router();

router.post('/add', async function (req, res, next) {
    try {
      req.check('htmls', 'Invalid html codes').exists();
      const errors = req.validationErrors();
      if (errors) {
        console.log(errors);
        // or file === undefined, reiniciar pedido e button
        res.send(errors);
      } else {
          const arrayHtmls = JSON.parse(req.body.htmls);
          await add_accessibility_statement(...arrayHtmls)
            .then(result => res.send(result))
            .catch((err: any) => res.send(err));
        }
    } catch (err) {
      console.log(err);
      res.send(err);
    }
  });

export = router;