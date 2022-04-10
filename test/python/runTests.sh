#!/bin/bash
readonly TESTING_PORT=5001
set -m #allows background process management

#start python server at non-default port
echo Running app.py on port $TESTING_PORT...
(cd ../../;python3 app.py $TESTING_PORT > /dev/null 2>&1) &
sleep 1

#run test
echo Running tests...
timeout 3 python3 test.py $TESTING_PORT
exitCode="$?"

#stop python server
#(%% means most recent background process)
echo Closing app.py...
kill %%

#count number of tests to make sure all have come back
totalTests=`cat test.py | grep -o "assert" | wc -l`
tests=`wc -l test.log | head -c 1`

#echo output and return 
if [ "$exitCode" -eq 1 ]; then
    echo -e "\n\n***\nDone, some tests FAILED.\n***"
    echo $tests/$totalTests passed.
    exit 1
elif [ "$tests" -ne "$totalTests" ]; then
    echo -e "\n***\nAll finished tests passed, but not all tests finished!"
    echo -e "Tests might've sent requests that the server could not respond to.\n***"
    echo $tests/$totalTests passed.
    exit 1
fi
echo -e "\n***\nDone, \u001b[32m$tests/$totalTests passed.\u001b[0m\n***"
exit 0