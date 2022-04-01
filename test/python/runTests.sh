#!/bin/bash
#start python server
echo Running app.py...
python3 ../../app.py > /dev/null 2>&1 &
sleep 1

#run test script (for 3 seconds)
echo Running tests...
timeout 2 python3 test.py
exitCode="$?"

#stop python server
procs=`ps -u | grep "../../app.py" | head -n 1`
procArr=($procs)
kill ${procArr[1]}

#count number of tests to make sure all have come back
totalTests=`cat test.py | grep -o "assert" | wc -l`
tests=`wc -l test.log | head -c 1`

#echo output and return 
if [ "$exitCode" -eq 1 ]; then
    echo -e "\n\nDone, some tests FAILED."
    echo $tests/$totalTests passed.
    exit 1
fi
echo -e "***\nDone, \u001b[32m$tests/$totalTests passed.\u001b[0m\n***"
exit 0