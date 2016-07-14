var mocha     = require('mocha'),
    Promise   = require('promise'),
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
     order_number     = 1;

console.log('ElasticSearch Instance Id: ' + instance_id);

function ElasticMochaReporter(runner, options)
{

  // Show the Spec Reporter in the console
  new mocha.reporters.Spec(runner);

  var self = this;
  Base.call(self, runner);

  var remainingTests = [];

  var reportsPath    = options.errorCaptureReportPath || './testFailDoms';

  runner.on('suite', function (suite)
  {
    // Skip the global suite
    if (suite.title === '') { return; }

    var suite_describe_statement = suite
        .title
        .match(/[^()]+/g);
    var suite_id    = suite_describe_statement[0],
        suite_title = suite_describe_statement[1].trim();

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
        'instance_id' : instance_id,
      };

      remainingTests.push(testShell);
    });

  })

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

    order_number++;
    elastic.addResult(result)

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
    result.duration     = test.duration;
    result.status       = test.state;

    order_number++;
    elastic.addResult(result)

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

    var screenshot_filename = instance_id + "/" + test_id;

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
    result.fail_category  = 'not addressed'

    elastic.addResult(result)

    order_number++;

    // remove this test from the remaining tests
    remainingTests.splice(shell_index, 1);

  }); // end fail

  runner.on('suite end', function (suite)
  {

    // Skip the global suite
    if (suite.title === '') { return; }
    /*
     * If the suite bailed out early and didn't run some of it's tests,
     * we want to make sure we track them as skipped.
     */
    if (remainingTests.length != 0)
    {
      console.log('       Suite ended with ' + remainingTests.length + ' tests remaining');

      remainingTests.forEach(function (skipped_test) {

        console.log(skipped_test.test_title);
        skipped_test.finish_time  = moment().format();
        skipped_test.duration     = 0;
        skipped_test.order_number = order_number;
        skipped_test.status       = 'skipped';

        order_number++;

        elastic.addResult(skipped_test)

      }); // end forEach

      remainingTests.length = 0;
    } // end if

  }); // end...suite end

  runner.on('end', function(done) {

    function sleepFor( sleepDuration ){
      var now = new Date().getTime();
      while(new Date().getTime() < now + sleepDuration){ /* do nothing */ }
    }
    sleepFor(5000);

  })

} // end ElasticMochaReporter

module.exports = ElasticMochaReporter;
