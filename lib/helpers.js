var util = require('util');


exports.getRelevantStackInfoFromFailStack = getRelevantStackInfoFromFailStack;
function getRelevantStackInfoFromFailStack(stack)
{
  var lines = stack.split("\n    "),
    relevantLines = [];

  for (line in lines) {
      start = lines[line].search('test/|pages/');
      end   = lines[line].length - 1;
      if (start > 0) {
        relaventFilePath = lines[line].substring(start, end);
        relaventFile     = relaventFilePath.split("/").pop();
        relevantLines.push(relaventFile);
    }
  }

  return relevantLines;
}


exports.getIndexForTestWithId = getIndexForTestWithId;
function getIndexForTestWithId(arrayOfTests, testId)
{
  for (index = 0; index < arrayOfTests.length; index++)
  {
    if (arrayOfTests[index].test_id == testId) { return index; }
  }
}


exports.inspect = inspect;
function inspect(obj)
{
  console.log('\n');
  console.log(util.inspect(obj, false, null));
  console.log('\n')
}
