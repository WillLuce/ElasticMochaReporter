var mocha     = require('mocha'),
    elastic   = require('./elasticwrapper.js'),
    helper    = require('./helpers.js'),
    aws       = require('./awswrapper.js');

var Base      = mocha.reporters.Base;

/*
 * Each run of the framework is given a unique id and the order of the
 * tests is reset to 1. This is going to help us keep track of which tests
 * ran together and in what order.
 */
var instance_id      = Date.now(),
    order_number     = 1,
    suite_id;

console.log('ElasticSearch Instance Id: ' + instance_id);

function ElasticMochaReporter(runner)
{
  // Show the Spec Reporter in the console
  new mocha.reporters.Spec(runner);

  var self = this;
  Base.call(self, runner);

  var remainingTests = [];

  runner.on('suite', function (suite)
  {
    // Skip the global suite
    if (suite.title === '') { return; }

    var suite_describe_statement = suite
      .title
      .match(/[^()]+/g);

    var suite_title = suite_describe_statement[1].trim();

    suite_id = suite_describe_statement[0];

    suite.tests.forEach(function (test)
    {
      var test_it_statement = test
        .title
        .match(/[^()]+/g);
      var test_id    = test_it_statement[0],
        test_title = test_it_statement[1].trim();

      var testShell = {
        'suite_id' : suite_id,
        'suite_title' : suite_title,
        'test_id' : test_id,
        'test_title' : test_title,
        'file' : test.file.split('/').pop(),
        'instance_id' : instance_id
      };

      remainingTests.push(testShell);
    });

  });

  runner.on('pass', function (test)
  {
    // ignore before/after hooks
    if (test.title.indexOf('hook') > 0)
    {
      return;
    }

    var test_it_statement = test
      .title
      .match(/[^()]+/g);
    var test_id    = test_it_statement[0];

    var shell_index = helper.getIndexForTestWithId(remainingTests, test_id),
      result      = remainingTests[shell_index];

    result.order_number = order_number;
    result.finish_time  = moment().format();
    result.duration     = test.duration;
    result.status       = test.state;
    result.full_id      = suite_id + test_id;

    order_number++;
    elastic.addResult(result);

    // remove this test from the remaining tests
    remainingTests.splice(shell_index, 1);

  }); // end pass

  runner.on('pending', function (test)
  {
    // ignore before/after hooks
    if (test.title.indexOf('hook') > 0)
    {
      return;
    }

    var test_it_statement = test
      .title
      .match(/[^()]+/g);
    var test_id    = test_it_statement[0];

    var shell_index = helper.getIndexForTestWithId(remainingTests, test_id),
      result      = remainingTests[shell_index];


    result.order_number = order_number;
    result.finish_time  = moment().format();
    result.duration     = 0;
    result.status       = 'skipped';
    result.full_id      = suite_id + test_id;

    order_number++;
    elastic.addResult(result);

    // remove this test from the remaining tests
    remainingTests.splice(shell_index, 1);

  }); // end pending

  runner.on('fail', function (test)
  {
    // ignore before/after hooks
    if (test.title.indexOf('hook') > 0) { return; }

    var test_it_statement = test
      .title
      .match(/[^()]+/g);
    var test_id = test_it_statement[0];

    var screenshot_filename = instance_id + "/" + suite_id + "/" + test_id;

    aws.saveScreenshot(screenshot_filename);

    var shell_index = helper.getIndexForTestWithId(remainingTests, test_id),
      result      = remainingTests[shell_index];


    var failMessage = test.err.message,
      failStack   = helper.getRelevantStackInfoFromFailStack(test.err.stack);

    // append new information to the test shell
    result.order_number   = order_number;
    result.finish_time    = moment().format();
    result.duration       = test.duration;
    result.status         = test.state;
    result.fail_message   = failMessage;
    result.fail_stack     = failStack;
    result.timedOut       = test.timedOut;
    result.screenshot_url = screenshot_filename;
    result.fail_category  = 'unaddressed';
    result.full_id        = suite_id + test_id;

    elastic.addResult(result);

    order_number++;

    // remove this test from the remaining tests
    remainingTests.splice(shell_index, 1);

  }); // end fail

} // end ElasticMochaReporter

module.exports = ElasticMochaReporter;
