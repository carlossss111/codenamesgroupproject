#!/bin/bash
#start python server
echo Running app.py...
python3 ../../app.py > /dev/null 2>&1 &
sleep 1

#run test script (for 3 seconds)
echo Running tests...
timeout 3 python3 test.py
exitCode="$?"

#stop python server
procs=`ps -ux | grep "../../app.py" | head -n 1`
procArr=($procs)
kill ${procArr[1]}

#echo output and return 
if [ "$exitCode" -eq 1 ]; then
    echo Done, some tests FAILED.
    exit 1
fi
echo Done, all tests passed.
exit 0