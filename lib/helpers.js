
exports.getRelevantStackInfoFromFailStack = getRelevantStackInfoFromFailStack;
exports.getIndexForTestWithId             = getIndexForTestWithId;

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


function getIndexForTestWithId(arrayOfTests, testId)
{
  for (index = 0; index < arrayOfTests.length; index++)
  {
    if (arrayOfTests[index].test_id == testId) { return index; }
  }
}
