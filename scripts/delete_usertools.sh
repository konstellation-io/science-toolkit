#!/bin/sh

## Usage:
##   delete_usertools.sh CODESERVER1 CODESERVER2 ... CODESERVER_N

USERTOOLS=$*
NAMESPACE=toolkit

show_header() {
  printf "\n\n##    %-30s\n" "$@"
}

for USERTOOL in $USERTOOLS; do
    show_header "Deleting usertools '$USERTOOL' "
    kubectl delete usertools $USERTOOL -n $NAMESPACE --force --grace-period 0
done

echo "Done"
