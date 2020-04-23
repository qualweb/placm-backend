import { execute_query_proto } from "../lib/database";
import { error, success } from "../lib/responses";

const get_data_by_evaluation_tool = async () => {
let query;
  try {
    query =
    `SELECT et.Name as name,
      COUNT(DISTINCT a.AssertionId) as nAssertions,
      COUNT(IF(a.Outcome = 'passed', 1, NULL)) as nPassed,
      COUNT(IF(a.Outcome = 'failed', 1, NULL)) as nFailed,
      COUNT(IF(a.Outcome = 'cantTell', 1, NULL)) as nCantTell,
      COUNT(IF(a.Outcome = 'inapplicable', 1, NULL)) as nInapplicable,
      COUNT(IF(a.Outcome = 'untested', 1, NULL)) as nUntested
    FROM
      EvaluationTool et
    INNER JOIN
      Page p
        ON p.Deleted = '0'
    INNER JOIN
    (SELECT a.AssertionId, a.RuleId, a.PageId, a.Outcome, a.EvaluationToolId
      FROM
        Assertion a
      WHERE
        date = (SELECT max(a1.Date) FROM assertion a1 WHERE a.RuleId = a1.RuleId AND a.PageId = a1.PageId)
        AND a.Deleted = '0'
      ORDER BY date DESC) a
        ON a.PageId = p.PageId
    WHERE et.EvaluationToolId = a.EvaluationToolId
    GROUP BY et.EvaluationToolId;`;
    let result = (await execute_query_proto(query));
    return success(result);
  } catch(err){
    return error(err);
  }
}

export {get_data_by_evaluation_tool};