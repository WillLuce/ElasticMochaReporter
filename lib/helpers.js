var util = require('util');


exports.getRelevantStackInfoFromFailStack = getRelevantStackInfoFromFailStack;
function getRelevantStackInfoFromFailStack(stack)
{
  var lines = stack.split("\n    "),
      relevantLines = [];

  for (var line in lines) {
    var start = lines[line].search('test/|pages/'),
        end   = lines[line].length - 1;
    if (start > 0) {
      var relevantFilePath = lines[line].substring(start, end),
          relevantFile = relevantFilePath.split("/").pop();

      relevantLines.push(relevantFile);
    }
  }

  return relevantLines;
}


exports.getIndexForTestWithId = getIndexForTestWithId;
function getIndexForTestWithId(arrayOfTests, testId)
{
  for (var index = 0; index < arrayOfTests.length; index++)
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
